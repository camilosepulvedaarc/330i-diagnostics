// obd.js: talks to an ELM327-style Bluetooth LE adapter (Veepeak OBDCheck BLE)
// over Web Bluetooth, and decodes standard OBD-II answers. Also a demo source
// with fake data so the app can be tried without the car.

// Cheap BLE adapters use one of a few known service IDs; we ask for all of them
// and use whichever one has a "notify" and a "write" characteristic.
// Written out in full: Bluefy (iPhone) rejects the short number form (0xfff0)
// with an empty error; the full form means the same thing everywhere.
const fullId = (s) => '0000' + s + '-0000-1000-8000-00805f9b34fb';
const BLE_SERVICES = [
  fullId('fff0'), fullId('ffe0'), fullId('18f0'), fullId('ae30'),
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

// Standard mode 01 values. f() turns raw bytes into a number (metric units).
const PIDS = {
  rpm:      { pid: '0C', f: (a, b) => (a * 256 + b) / 4 },
  speed:    { pid: '0D', f: (a) => a },                     // km/h
  coolant:  { pid: '05', f: (a) => a - 40 },                // °C
  intake:   { pid: '0F', f: (a) => a - 40 },                // °C
  throttle: { pid: '11', f: (a) => (a * 100) / 255 },       // %
  map:      { pid: '0B', f: (a) => a },                     // kPa absolute
  baro:     { pid: '33', f: (a) => a },                     // kPa
  load:     { pid: '04', f: (a) => (a * 100) / 255 },       // %
  stft:     { pid: '06', f: (a) => ((a - 128) * 100) / 128 }, // %
  ltft:     { pid: '07', f: (a) => ((a - 128) * 100) / 128 }, // %
  runtime:  { pid: '1F', f: (a, b) => a * 256 + b },        // seconds
  distClr:  { pid: '31', f: (a, b) => a * 256 + b },        // km since codes cleared
  maf:      { pid: '10', f: (a, b) => (a * 256 + b) / 100 }, // airflow g/s (for MPG)
};

// Connection log: setup steps, scans and anything unexpected, so one car test
// shows what the adapter really said. Kept in localStorage to copy later.
const LOG = (() => { try { return JSON.parse(localStorage.getItem('diag-log')) || []; } catch { return []; } })();
let logTimer;
function log(line) {
  const t = new Date().toTimeString().slice(0, 8);
  LOG.push(t + ' ' + line);
  if (LOG.length > 400) LOG.splice(0, LOG.length - 400);
  clearTimeout(logTimer);
  logTimer = setTimeout(() => { try { localStorage.setItem('diag-log', JSON.stringify(LOG)); } catch {} }, 500);
}
const shown = (text) => JSON.stringify(text);

const hexBytes = (h) => (h.match(/../g) || []).map((x) => parseInt(x, 16));

// Turns the adapter's text answer into one hex string per responding module.
// Long answers come split into numbered lines ("0:...", "1:...") that get joined.
function responses(text) {
  const lines = text.split(/[\r\n]+/).map((l) => l.trim().replace(/\s/g, ''))
    .filter((l) => l && !/^SEARCHING/i.test(l));
  const out = [];
  let multi = '';
  for (const l of lines) {
    const m = l.match(/^([0-9A-F]):([0-9A-F]+)$/i);
    if (m) multi += m[2];
    else if (/^[0-9A-F]{3}$/i.test(l)) continue; // length line before a multi-line answer
    else if (/^[0-9A-F]+$/i.test(l)) out.push(l.toUpperCase());
  }
  if (multi) out.unshift(multi.toUpperCase());
  return out;
}

function decodeDtc(four) {
  const n = parseInt(four[0], 16);
  return 'PCBU'[n >> 2] + (n & 3) + four.slice(1);
}

class ElmAdapter {
  constructor() {
    this.buf = '';
    this.waiting = null;
    this.queue = Promise.resolve();
    this.supported = new Set();
    this.isCan = true;
    this.name = '';
    this.protocol = '';
    this.onDisconnect = null;
  }

  async connect() {
    if (!navigator.bluetooth) throw new Error('NO_BT');
    this.device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_SERVICES,
    });
    this.name = this.device.name || 'OBD adapter';
    log('--- connect: picked "' + this.name + '"');
    this.device.addEventListener('gattserverdisconnected', () => this.onDisconnect && this.onDisconnect());
    const server = await this.device.gatt.connect();
    log('GATT connected');
    try {
      const all = await server.getPrimaryServices();
      log('services: ' + all.map((x) => x.uuid).join(', '));
    } catch (e) { log('service list not available: ' + e.message); }

    for (const id of BLE_SERVICES) {
      let svc;
      try { svc = await server.getPrimaryService(id); } catch { continue; }
      const chars = await svc.getCharacteristics();
      const rx = chars.find((c) => c.properties.notify || c.properties.indicate);
      const tx = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
      log('service ' + svc.uuid + ': ' + chars.map((c) => c.uuid.slice(4, 8) + '[' +
        ['read', 'write', 'writeWithoutResponse', 'notify', 'indicate'].filter((k) => c.properties[k]).join('/') + ']').join(' '));
      if (rx && tx) { this.rx = rx; this.tx = tx; log('using rx ' + rx.uuid + ' tx ' + tx.uuid); break; }
    }
    if (!this.rx) throw new Error('NO_SERIAL');

    await this.rx.startNotifications();
    const dec = new TextDecoder();
    this.rx.addEventListener('characteristicvaluechanged', (e) => {
      this.buf += dec.decode(e.target.value);
      const i = this.buf.indexOf('>');
      if (i >= 0 && this.waiting) {
        const text = this.buf.slice(0, i);
        this.buf = this.buf.slice(i + 1);
        const w = this.waiting; this.waiting = null; w(text);
      }
    });
    await this.init();
  }

  disconnect() {
    if (this.device && this.device.gatt.connected) this.device.gatt.disconnect();
  }

  // Sends one command and waits for the ">" prompt. Commands run one at a time.
  send(cmd, timeout = 4000, quiet = false) {
    const run = async () => {
      if (this.dirty) { await new Promise((r) => setTimeout(r, 400)); this.dirty = false; }
      this.buf = '';
      const answer = new Promise((resolve, reject) => {
        const t = setTimeout(() => { this.waiting = null; this.dirty = true; reject(new Error('TIMEOUT ' + cmd)); }, timeout);
        this.waiting = (text) => { clearTimeout(t); resolve(text); };
      });
      const data = new TextEncoder().encode(cmd + '\r');
      const p = this.tx.properties;
      const write = p.writeWithoutResponse && this.tx.writeValueWithoutResponse
        ? this.tx.writeValueWithoutResponse
        : (this.tx.writeValueWithResponse || this.tx.writeValue);
      const t0 = Date.now();
      await write.call(this.tx, data);
      try {
        const text = await answer;
        if (!quiet) log('> ' + cmd + '  < ' + shown(text) + ' (' + (Date.now() - t0) + 'ms)');
        return text;
      } catch (e) { log('> ' + cmd + '  ! ' + e.message + ' buf=' + shown(this.buf)); throw e; }
    };
    const job = this.queue.then(run, run);
    this.queue = job.catch(() => {});
    return job;
  }

  async init() {
    await this.send('ATZ', 6000).catch(() => {});      // reset
    for (const c of ['ATE0', 'ATL0', 'ATS0', 'ATH0', 'ATAT1', 'ATSP0']) await this.send(c);
    const first = await this.send('0100', 15000);       // first request also finds the protocol
    if (/UNABLE|NO DATA|ERROR|STOPPED/i.test(first)) throw new Error('NO_ECU');
    this.readSupported(first, 0x00);
    for (const base of [0x20, 0x40]) {
      if (!this.supported.has(base)) break;
      const r = await this.send('01' + base.toString(16).toUpperCase().padStart(2, '0')).catch(() => '');
      this.readSupported(r, base);
    }
    const dpn = (await this.send('ATDPN')).trim().replace(/^A/, '');
    this.isCan = /^[6-9AB]$/i.test(dpn);
    this.protocol = this.isCan ? 'CAN (ISO 15765-4)' : 'Protocol ' + dpn;
    log('supported PIDs: ' + [...this.supported].map((n) => n.toString(16).toUpperCase().padStart(2, '0')).join(' '));
    log('setup done, ' + this.protocol);
  }

  readSupported(text, base) {
    const tag = '41' + base.toString(16).toUpperCase().padStart(2, '0');
    for (const r of responses(text)) {
      if (!r.startsWith(tag)) continue;
      hexBytes(r.slice(4, 12)).forEach((byte, i) => {
        for (let bit = 0; bit < 8; bit++) {
          if (byte & (0x80 >> bit)) this.supported.add(base + i * 8 + bit + 1);
        }
      });
    }
  }

  has(key) { return this.supported.has(parseInt(PIDS[key].pid, 16)); }

  async read(key) {
    if (key === 'battery') {
      const v = parseFloat(await this.send('ATRV', 4000, true));
      return Number.isFinite(v) ? v : null;
    }
    if (!this.has(key)) return null;
    const { pid, f } = PIDS[key];
    const text = await this.send('01' + pid, 4000, true);
    for (const r of responses(text)) {
      if (r.startsWith('41' + pid)) return f(...hexBytes(r.slice(4)));
    }
    log('unexpected answer to 01' + pid + ': ' + shown(text));
    return null;
  }

  // mode '03' stored, '07' pending
  async readDtcs(mode) {
    const text = await this.send(mode, 8000);
    if (/NO DATA/i.test(text)) return [];
    const tag = (parseInt(mode, 16) + 0x40).toString(16).toUpperCase();
    const codes = new Set();
    for (const r of responses(text)) {
      if (!r.startsWith(tag)) continue;
      let body = r.slice(2);
      if (this.isCan) body = body.slice(2);  // CAN answers start with a count byte
      for (let i = 0; i + 4 <= body.length; i += 4) {
        const four = body.slice(i, i + 4);
        if (four !== '0000') codes.add(decodeDtc(four));
      }
    }
    log('mode ' + mode + ' codes: ' + ([...codes].join(' ') || 'none'));
    return [...codes];
  }

  // Mode 01 PID 01: check engine light + emissions readiness monitors.
  async readStatus() {
    const text = await this.send('0101', 6000);
    const all = responses(text).filter((x) => x.startsWith('4101'));
    if (!all.length) return null;
    const st = decodeStatus(hexBytes(all[0].slice(4, 12)));
    st.mil = all.some((x) => hexBytes(x.slice(4, 6))[0] & 0x80);
    return st;
  }

  // Mode 02: the snapshot the car saved when the stored code was set.
  async readFreeze() {
    const first = await this.send('020200', 6000).catch(() => '');
    const r = responses(first).find((x) => x.startsWith('4202'));
    if (!r) return null;
    const four = r.slice(6, 10);
    if (!four || four === '0000') return null;
    const snap = { code: decodeDtc(four), v: {} };
    for (const key of FREEZE_KEYS) {
      const { pid, f } = PIDS[key];
      const t = await this.send('02' + pid + '00', 4000, true).catch(() => '');
      const line = responses(t).find((x) => x.startsWith('42' + pid));
      if (line) snap.v[key] = f(...hexBytes(line.slice(6)));
    }
    log('freeze frame ' + snap.code + ': ' + JSON.stringify(snap.v));
    return snap;
  }

  async clearDtcs() {
    const text = await this.send('04', 8000);
    return /44/.test(text.replace(/\s/g, ''));
  }

  async readVin() {
    const text = await this.send('0902', 8000).catch(() => '');
    const all = responses(text).join('');
    const i = all.indexOf('4902');
    if (i < 0) return null;
    const ascii = hexBytes(all.slice(i + 6)).map((b) => String.fromCharCode(b)).join('');
    const vin = ascii.replace(/[^A-HJ-NPR-Z0-9]/g, '');
    return vin.length >= 17 ? vin.slice(-17) : null;
  }
}

const FREEZE_KEYS = ['rpm', 'speed', 'coolant', 'load', 'stft', 'ltft', 'map', 'intake', 'throttle'];

// Readiness monitor names (gasoline). Bits: B = continuous, C = available, D = not finished yet.
const CONT = ['Misfire', 'Fuel system', 'Components'];
const NONCONT = ['Catalyst', 'Heated catalyst', 'EVAP system', 'Secondary air', 'A/C refrigerant', 'O2 sensor', 'O2 sensor heater', 'EGR / VVT'];
function decodeStatus([a, b, c, d]) {
  const monitors = [];
  CONT.forEach((name, i) => {
    if (b & (1 << i)) monitors.push({ name, done: !(b & (1 << (i + 4))) });
  });
  NONCONT.forEach((name, i) => {
    if (c & (1 << i)) monitors.push({ name, done: !(d & (1 << i)) });
  });
  return { mil: !!(a & 0x80), count: a & 0x7f, diesel: !!(b & 0x08), monitors };
}

// Fake car for trying the app without an adapter.
class DemoAdapter {
  constructor() {
    this.name = 'Demo car';
    this.protocol = 'Demo';
    this.t0 = Date.now();
    this.cleared = false;
  }
  async connect() { await new Promise((r) => setTimeout(r, 600)); }
  disconnect() {}
  has() { return true; }
  async read(key) {
    const t = (Date.now() - this.t0) / 1000;
    const wave = Math.sin(t / 3 - 1.6) * 0.5 + 0.5;
    const warm = Math.min(1, t / 40);
    const v = {
      rpm: 850 + wave * 2400 + Math.random() * 60,
      speed: Math.max(0, wave * 135 - 12),
      maf: 3 + wave * 38,
      coolant: 60 + warm * 32,
      intake: 28 + wave * 6,
      throttle: 8 + wave * 40,
      map: 35 + wave * 110,
      baro: 101,
      load: 18 + wave * 50,
      stft: Math.sin(t) * 3,
      ltft: 2.3,
      runtime: Math.round(t),
      distClr: this.cleared ? 0 : 1843,
      battery: 14.1 + Math.random() * 0.1,
    }[key];
    return v ?? null;
  }
  async readDtcs(mode) {
    if (this.cleared) return [];
    return mode === '03' ? ['P0171', 'P0420'] : ['P0301'];
  }
  async clearDtcs() { this.cleared = true; return true; }
  async readVin() { return 'DEMO0000000000000'; }
  async readStatus() {
    // after a clear, most monitors show "not ready" like a real car
    return this.cleared
      ? decodeStatus([0x00, 0x07 | 0x10, 0x65, 0x65])
      : decodeStatus([0x82, 0x07, 0x65, 0x04]);
  }
  async readFreeze() {
    if (this.cleared) return null;
    return { code: 'P0171', v: { rpm: 742, speed: 0, coolant: 88, load: 24, stft: 9.4, ltft: 14.8, map: 31, intake: 34, throttle: 3.1 } };
  }
}

window.OBD = { ElmAdapter, DemoAdapter, LOG, log };
