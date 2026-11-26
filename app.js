// app.js: screens, live updates and the connection flow.

const ICONS = {
  // tab bar
  home: '<path class="fillable" d="M3.5 10.6 12 3.8l8.5 6.8V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.3H9.2v5.3H5A1.5 1.5 0 0 1 3.5 19z"/>',
  chart: '<path d="M4 20.5h16"/><path d="M6.5 17.5v-3M10.5 17.5v-5.5M14.5 17.5v-4M18.5 17.5V10"/><path d="M5 10.5 9.5 7l4 2.5L19.5 4"/><path d="M16.5 4h3v3"/>',
  scan: '<path d="M4 8.5V5.5A1.5 1.5 0 0 1 5.5 4h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3"/><path d="M7.5 13.5l1-2.6a1.5 1.5 0 0 1 1.4-.9h4.2a1.5 1.5 0 0 1 1.4.9l1 2.6v2h-9z"/><path d="M3 12h2M19 12h2"/>',
  car: '<path d="M5.5 10.5 7.2 6.3A2 2 0 0 1 9 5h6a2 2 0 0 1 1.8 1.3l1.7 4.2"/><path class="fillable" d="M3.5 12.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2V17H3.5z"/><path d="M5 17v1.5a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V17M15.5 17v1.5a1 1 0 0 0 1 1H18a1 1 0 0 0 1-1V17"/><path d="M6.5 13.7h2M15.5 13.7h2"/>',
  // data
  engine: '<path d="M8.5 5.5h5M11 5.5v2.5"/><path d="M5.5 10.5H8L9.5 8h5l2 2.5h1.3l1.7-1.7h2v6.4h-2l-1.7-1.7h-1.3v2l-2 2.5H9l-2-2H5.5z"/><path d="M5.5 11.5v4.5M2.5 11v6M2.5 13.8h3"/>',
  battery: '<rect x="2.5" y="7.5" width="19" height="12" rx="2"/><path d="M6 7.5V5.5h3.5v2M14.5 7.5V5.5H18v2"/><path d="M5.8 13.5h3.4M14.8 13.5h3.4M16.5 11.8v3.4"/>',
  temp: '<path d="M10 13.6V5.2a2 2 0 0 1 4 0v8.4a3.9 3.9 0 1 1-4 0z"/><path d="M12 15.2V8.5"/><circle cx="12" cy="16.9" r="1.6" fill="currentColor"/><path d="M16.5 6h1.8M16.5 9h1.8M16.5 12h1.8"/>',
  gauge: '<path d="M4.2 17.6a8.8 8.8 0 1 1 15.6 0"/><path d="M12 5.6v1.6M6.3 8l1.1 1.1M17.7 8l-1.1 1.1M3.9 13.2h1.6M18.5 13.2h1.6"/><path d="M12 14.2l3.6-4"/><circle cx="12" cy="14.2" r="1.4"/>',
  speed: '<path d="M4.2 17.6a8.8 8.8 0 1 1 15.6 0"/><path d="M12 5.6v1.6M6.3 8l1.1 1.1M17.7 8l-1.1 1.1M3.9 13.2h1.6M18.5 13.2h1.6"/><path d="M12 14.2l-3.4-4.2"/><circle cx="12" cy="14.2" r="1.4"/>',
  air: '<path d="M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8"/><path d="M3 16.5h6.5M5 4.5h2"/>',
  throttle: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 7.5l-1.8 2M12 7.5l1.8 2"/>',
  boost: '<path d="M11 21a7.5 7.5 0 1 1 6.9-10.4"/><path d="M14.2 6.2V3.5h6.3v7h-2.6"/><circle cx="11" cy="13.5" r="3.4"/><path d="M11 12v3M9.5 13.5h3"/>',
  fuel: '<path d="M4.5 20.5V5.5A1.5 1.5 0 0 1 6 4h6.5A1.5 1.5 0 0 1 14 5.5v15"/><path d="M3 20.5h12.5"/><path d="M7 7h4.5v4H7z"/><path d="M14 10h1.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 0 3 0V8.6L17.6 6.2"/>',
  load: '<path d="M4.2 17.6a8.8 8.8 0 1 1 15.6 0"/><path d="M7.5 15a5 5 0 0 1 9 0"/><path d="M12 14.2l2.6-2.8"/><circle cx="12" cy="14.2" r="1.2"/>',
  warn: '<path d="M10.3 4.3a2 2 0 0 1 3.4 0l7.6 13.4a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3z"/><path d="M12 9.5v4.6"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>',
  wrench: '<path d="M14.6 6.4a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.6-3.6a6 6 0 0 1-7.9 7.9l-6.6 6.6a2.1 2.1 0 0 1-3-3l6.6-6.6a6 6 0 0 1 7.9-7.9z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  road: '<path d="M8.5 3.5 5 20.5M15.5 3.5 19 20.5"/><path d="M12 5v2.2M12 10.9v2.2M12 16.8V19"/>',
  // ui
  bt: '<path d="M7 7l10 10-5 5V2l5 5L7 17"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4 4 10-10"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16.3 9.4"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
};
// Line icons drawn for this app; the wrench outline follows Lucide's (ISC license).
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

// ---------- version ----------
const [APP_VERSION, APP_DATE] = ((document.querySelector('meta[name="app-version"]') || {}).content || '?|').split('|');
const versionDate = () => APP_DATE ? new Date(APP_DATE + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

// Which version the phone's offline copy holds (from the cache name, e.g. diag-v11).
async function offlineVersion() {
  try {
    const keys = await caches.keys();
    const k = keys.map((x) => x.match(/^diag-v(\d+)$/)).filter(Boolean).map((m) => Number(m[1]));
    return k.length ? Math.max(...k) : null;
  } catch { return null; }
}
async function showOfflineVersion() {
  const el = document.querySelector('[data-offline]');
  if (!el) return;
  const v = await offlineVersion();
  el.className = v == null ? '' : v === Number(APP_VERSION) ? 'ok' : 'warn';
  el.textContent = v == null ? 'Not saved yet' : v === Number(APP_VERSION) ? 'v' + v + ' ✓ up to date' : 'v' + v + ', updating…';
}

// Asks GitHub for the newest version. If there is one, the app reloads into it.
async function checkUpdate(btn) {
  btn.disabled = true; btn.textContent = 'Checking…';
  try {
    const html = await (await fetch('./?check=' + Date.now(), { cache: 'no-store' })).text();
    const m = html.match(/name="app-version" content="(\d+)\|/);
    const latest = m ? Number(m[1]) : null;
    if (latest && latest > Number(APP_VERSION)) {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.update();
      if (state.conn === 'on') toast('v' + latest + ' is ready. Disconnect, then reopen the app to finish updating.');
      else { toast('Updating to v' + latest + '…'); setTimeout(() => location.reload(), 1200); }
    } else if (latest) toast("You're on the latest version (v" + APP_VERSION + ')');
    else toast("Couldn't check right now. Try again with internet.");
  } catch { toast("Couldn't check right now. Try again with internet."); }
  btn.disabled = false; btn.textContent = 'Check for updates';
}

// ---------- state ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('diag-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('diag-' + k, JSON.stringify(v)); } catch {} },
};

const state = {
  conn: 'off',          // off | connecting | on | demo
  v: {},                // latest readings, metric
  history: [],          // last 60 s for the chart
  codes: { stored: [], pending: [] },
  scannedAt: null,
  scanning: false,
  scanProg: 0,
  scanStep: '',
  revealed: false,
  status: null,         // check engine light + readiness monitors
  freeze: null,         // freeze frame snapshot
  trip: null,           // drive being recorded
  perf: { mode: 'idle' },
  peak: null,
  driveTab: 'gauges',
  codeTab: 'stored',
  vin: store.get('vin', null),
  units: store.get('units', 'us'),
};
let adapter = null;

const FAST = ['rpm', 'speed', 'maf', 'map'];
const SLOW = ['throttle', 'coolant', 'intake', 'load', 'stft', 'ltft', 'baro', 'battery', 'runtime', 'distClr'];

// ---------- units ----------
const US = () => state.units === 'us';
const n0 = (x) => Math.round(x).toLocaleString('en-US');
const n1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const boostKpa = () => (state.v.map == null ? null : state.v.map - (state.v.baro || 101));

function show(key) {
  const extra = Extras.showExtra(key);
  if (extra !== undefined) return extra;
  if (key === 'triptime' || key === 'tripdist') return Extras.tripLive()[key] || null;
  const v = state.v;
  switch (key) {
    case 'rpm': return v.rpm == null ? null : [n0(v.rpm), 'rpm'];
    case 'speed': return v.speed == null ? null : US() ? [n0(v.speed * 0.6214), 'mph'] : [n0(v.speed), 'km/h'];
    case 'coolant': case 'intake': {
      const c = v[key]; if (c == null) return null;
      return US() ? [n0(c * 9 / 5 + 32), '°F'] : [n0(c), '°C'];
    }
    case 'boost': {
      const b = boostKpa(); if (b == null) return null;
      return US() ? [n1(b * 0.145), 'psi'] : [(b / 100).toFixed(2), 'bar'];
    }
    case 'throttle': case 'load': return v[key] == null ? null : [n0(v[key]), '%'];
    case 'stft': case 'ltft': return v[key] == null ? null : [(v[key] > 0 ? '+' : '') + n1(v[key]), '%'];
    case 'trim': return v.stft == null || v.ltft == null ? null : [(v.stft + v.ltft > 0 ? '+' : '') + n1(v.stft + v.ltft), '%'];
    case 'battery': return v.battery == null ? null : [n1(v.battery), 'V'];
    case 'runtime': return v.runtime == null ? null : [Math.floor(v.runtime / 60) + ':' + String(Math.round(v.runtime % 60)).padStart(2, '0'), 'min'];
    case 'distClr': return v.distClr == null ? null : US() ? [n0(v.distClr * 0.6214), 'mi'] : [n0(v.distClr), 'km'];
    case 'engine': return v.rpm == null ? null : [v.rpm > 300 ? 'Running' : 'Off', ''];
    case 'codes': return !state.scannedAt ? null : [state.codes.stored.length ? state.codes.stored.length + ' stored' : 'None', ''];
  }
  return null;
}

// ---------- health ----------
function checks() {
  const v = state.v, c = [];
  if (state.scannedAt) c.push({ name: 'Fault codes', ok: state.codes.stored.length === 0 });
  if (v.battery != null) {
    const running = (v.rpm || 0) > 400;
    c.push({ name: 'Battery', ok: running ? v.battery >= 13.2 && v.battery <= 15 : v.battery >= 12.2 });
  }
  if (v.coolant != null) c.push({ name: 'Coolant temp', ok: v.coolant < 110 });
  if (v.stft != null && v.ltft != null) c.push({ name: 'Fuel trims', ok: Math.abs(v.stft + v.ltft) < 15 });
  return c;
}

function healthHtml() {
  const c = checks();
  const ok = c.filter((x) => x.ok).length;
  const score = c.length ? Math.round((ok / c.length) * 100) : null;
  const tone = score == null ? 'muted' : score === 100 ? 'green' : score >= 75 ? 'amber' : 'red';
  const word = score == null ? 'No data' : score === 100 ? 'All good' : score >= 75 ? 'Fair' : 'Needs a look';
  const R = 52, C = 2 * Math.PI * R, arc = C * 0.75;
  const fill = score == null ? 0 : arc * (score / 100);
  const bad = c.filter((x) => !x.ok).map((x) => x.name);
  const title = !c.length ? (state.conn === 'off' ? 'Connect to check your car' : 'Reading the car…')
    : bad.length ? (bad.length === 1 ? bad[0] + (/s$/.test(bad[0]) ? ' need a look' : ' needs a look') : bad.length + ' things need a look')
    : 'No issues found';
  const sub = !c.length ? 'Plug in the adapter, turn the ignition on and tap Connect.'
    : `${ok} of ${c.length} checks OK${bad.length ? ' · ' + bad.join(', ') : ' · readings in normal range'}`;
  return `
    <div class="ring ${tone}">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${R}" class="track" stroke-dasharray="${arc} ${C}" transform="rotate(135 60 60)"/>
        ${fill ? `<circle cx="60" cy="60" r="${R}" class="bar" stroke-dasharray="${fill} ${C}" transform="rotate(135 60 60)"/>` : ''}
      </svg>
      <div class="ring-in"><b>${score == null ? '–' : score}</b><span>${word}</span></div>
    </div>
    <div class="health-text">
      <p class="h-title">${score === 100 ? `<span class="okmark">${icon('check')}</span>` : ''}${title}</p>
      <p class="h-sub">${sub}</p>
    </div>
    <span class="chev">${icon('chevron')}</span>`;
}

// ---------- pieces ----------
const tile = (ic, label, key) => `
  <div class="tile"><span class="ic">${icon(ic)}</span>
    <div><p class="lbl">${label}</p><p class="val" data-k="${key}">–</p></div></div>`;

const connPill = () => {
  const s = state.conn;
  const label = s === 'on' ? 'Live' : s === 'demo' ? 'Demo' : s === 'connecting' ? 'Connecting' : 'Offline';
  return `<span class="pill-status ${s}"><i></i>${label}</span>`;
};

function header(title, sub, back) {
  return `<header class="bar">
    ${back ? `<a class="round" href="${back === true ? '#/' : back}" aria-label="Back">${icon('chevron')}</a>` : '<span></span>'}
    <div class="bar-t"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
    ${connPill()}
  </header>`;
}

function connectCard() {
  if (state.conn === 'on' || state.conn === 'demo') return '';
  const busy = state.conn === 'connecting';
  return `<section class="card connect">
    <div><p class="c-title">${icon('bt')} Veepeak OBDCheck BLE</p>
    <p class="c-sub">Plug it in under the dash (left of the steering column), ignition on.</p>
    ${navigator.bluetooth ? '' : '<p class="c-warn">Bluetooth isn\'t available here. Open this page in the Bluefy app to connect. Demo works anywhere.</p>'}</div>
    <button class="btn primary" data-act="connect" ${busy ? 'disabled' : ''}>${busy ? 'Connecting…' : 'Connect'}</button>
    <button class="btn ghost" data-act="demo" ${busy ? 'disabled' : ''}>Try demo</button>
  </section>`;
}

// ---------- screens ----------
const views = {
  drive() { return Extras.driveView(); },
  trip() { return Extras.tripView(routeArg()); },
  home() {
    return `
    <header class="top">
      <span class="badge">${icon('car')}</span>
      <div class="who"><h1>My 330i</h1><p>F30 · 2018 · xDrive · 2.0L Turbo</p></div>
      ${connPill()}
    </header>
    <section class="hero">
      <div class="stripes"><i></i><i></i><i></i></div>
      <div class="glow"></div>
      <img src="car.webp" alt="">
    </section>
    ${connectCard()}
    <a class="card health" href="#/codes" data-health>${healthHtml()}</a>
    <section class="grid">
      ${tile('engine', 'Engine', 'engine')}
      ${tile('battery', 'Battery', 'battery')}
      ${tile('temp', 'Coolant', 'coolant')}
      ${tile('boost', 'Boost', 'boost')}
      ${tile('fuel', 'Fuel trim', 'trim')}
      ${tile('warn', 'Fault codes', 'codes')}
    </section>
    <a class="card row" href="#/codes">
      <span class="ic big">${icon('wrench')}</span>
      <div><p class="r-title">Vehicle scan</p>
      <p class="r-sub" data-scan>${scanLine()}</p></div>
      <span class="chev">${icon('chevron')}</span>
    </a>
    <a class="ver" href="#/car">330i Diag · v${esc(APP_VERSION)}</a>`;
  },

  live() {
    const legend = (cls, label, key) => `<li class="${cls}"><i></i><span>${label}</span><b data-k="${key}">–</b></li>`;
    return `
    ${header('Live Data', 'Engine computer · live')}
    ${connectCard()}
    <section class="card chart-card">
      <div class="card-h"><h2>${icon('chart')} Live telemetry</h2><span class="live-dot ${state.conn}">Last 60 s</span></div>
      <div class="chart-wrap"><canvas id="chart"></canvas>
        <ul class="legend">${legend('s-blue', 'Engine RPM', 'rpm')}${legend('s-violet', 'Boost', 'boost')}${legend('s-red', 'Coolant', 'coolant')}</ul>
      </div>
      <div class="axis"><span>−60s</span><span>−45s</span><span>−30s</span><span>−15s</span><span>Now</span></div>
    </section>
    <a class="card row" href="#/drive">
      <span class="ic big">${icon('gauge')}</span>
      <div><p class="r-title">Drive mode</p><p class="r-sub">Big gauges, peak boost and the ${US() ? '0–60' : '0–100'} timer</p></div>
      <span class="chev">${icon('chevron')}</span>
    </a>
    <section class="grid">
      ${tile('gauge', 'Engine RPM', 'rpm')}
      ${tile('speed', 'Vehicle speed', 'speed')}
      ${tile('temp', 'Coolant temp', 'coolant')}
      ${tile('air', 'Intake temp', 'intake')}
      ${tile('throttle', 'Throttle', 'throttle')}
      ${tile('boost', 'Boost', 'boost')}
      ${tile('load', 'Engine load', 'load')}
      ${tile('battery', 'Battery', 'battery')}
      ${tile('fuel', 'Short-term trim', 'stft')}
      ${tile('fuel', 'Long-term trim', 'ltft')}
      ${tile('fuel', 'Fuel now', 'mpg')}
      ${tile('road', 'Fuel average', 'mpgavg')}
    </section>
    ${Extras.tripsHtml()}`;
  },

  codes() {
    const list = state.codes[state.codeTab];
    const seg = (id, label) => `<button class="${state.codeTab === id ? 'on' : ''}" data-act="tab" data-id="${id}">${label} (${state.scannedAt ? state.codes[id].length : '–'})</button>`;
    const connected = state.conn === 'on' || state.conn === 'demo';
    const rows = !state.scannedAt
      ? `<p class="empty">${connected ? 'Tap Scan to read the engine computer.' : 'Connect the adapter to scan.'}</p>`
      : !list.length
        ? `<p class="empty ok">${icon('check')} No ${state.codeTab} codes</p>`
        : list.map((c) => `
          <div class="code ${DTC.dtcSeverity(c)}">
            <span class="ic">${icon('warn')}</span>
            <div><p class="code-id">${c} <em>${state.codeTab === 'stored' ? 'Stored' : 'Pending'}</em></p>
            <p class="code-d">${DTC.describeDtc(c)}</p></div>
          </div>`).join('');
    return `
    ${header('Vehicle Scan', 'Engine computer diagnostic')}
    <section class="xr ${state.revealed ? 'done' : ''} ${state.scanning ? 'scanning' : ''}" style="--p:-12%">
      <div class="xr-floor"></div>
      <img class="xr-x ${XRAY ? '' : 'fake'}" src="${XRAY || 'car.webp'}" alt="">
      <img class="xr-s" src="car.webp" alt="">
      <div class="xr-grid"></div>
      <div class="beam"></div>
    </section>
    ${connectCard()}
    <section class="card prog" data-prog>${progHtml()}</section>
    <section class="sys" data-sys>${sysHtml()}</section>
    <div class="seg">${seg('stored', 'Stored')}${seg('pending', 'Pending')}</div>
    <section class="card codes-card">
      <div class="card-h"><h2>${icon('warn')} ${state.codeTab === 'stored' ? 'Stored codes' : 'Pending codes'}</h2></div>
      <p class="muted small scan-line" data-scan>${scanLine()}</p>
      ${rows}
    </section>
    ${state.codeTab === 'stored' ? Extras.freezeHtml() : ''}
    <p class="note">${state.codeTab === 'stored'
      ? 'Stored codes are confirmed faults that turn on the check engine light.'
      : 'Pending codes were seen once. They become stored if the problem happens again.'}</p>
    <div class="actions">
      <button class="btn primary" data-act="scan" ${!connected || state.scanning ? 'disabled' : ''}>${icon('refresh')} ${state.scanning ? 'Scanning…' : 'Scan'}</button>
      <button class="btn danger" data-act="clear" ${!connected || state.scanning || !state.scannedAt ? 'disabled' : ''}>${icon('trash')} Clear codes</button>
    </div>
    ${Extras.readinessHtml()}`;
  },

  car() {
    const row = (label, val) => `<div class="kv"><span>${label}</span><b>${val}</b></div>`;
    const connected = state.conn === 'on' || state.conn === 'demo';
    return `
    ${header('Car', '2018 BMW 330i xDrive · F30')}
    ${connectCard()}
    <section class="card list">
      ${row('VIN', state.vin ? esc(state.vin) : '–')}
      ${row('Adapter', adapter && connected ? esc(adapter.name) : '–')}
      ${row('Protocol', adapter && connected ? esc(adapter.protocol) : '–')}
      <div class="kv"><span>Engine run time</span><b data-k="runtime">–</b></div>
      <div class="kv"><span>Driven since codes cleared</span><b data-k="distClr">–</b></div>
    </section>
    <section class="card list">
      <div class="kv"><span>Units</span>
        <div class="seg small"><button class="${US() ? 'on' : ''}" data-act="units" data-id="us">mph · °F · psi</button><button class="${US() ? '' : 'on'}" data-act="units" data-id="metric">km/h · °C · bar</button></div>
      </div>
      <div class="kv"><span>Alerts<br><small class="muted">Hot coolant, low battery</small></span>
        <div class="seg small"><button class="${store.get('alerts', true) ? 'on' : ''}" data-act="alerts" data-id="1">On</button><button class="${store.get('alerts', true) ? '' : 'on'}" data-act="alerts" data-id="0">Off</button></div>
      </div>
    </section>
    ${connected ? `<button class="btn ghost wide" data-act="disconnect">Disconnect</button>` : ''}
    <section class="card log-card">
      <div class="card-h"><h2>${icon('code')} Connection log</h2>
        <span class="muted small">${OBD.LOG.length} lines</span></div>
      <p class="muted small">If something doesn't work in the car, tap Copy and paste it to Claude.</p>
      <details><summary>Show log</summary><pre>${OBD.LOG.slice(-150).join(String.fromCharCode(10)).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;')) || 'Empty'}</pre></details>
      <div class="actions"><button class="btn ghost" data-act="copylog">Copy log</button><button class="btn ghost" data-act="clearlog">Clear log</button></div>
    </section>
    <section class="card list about">
      <div class="kv"><span>App version</span><b>v${esc(APP_VERSION)} <small>${versionDate()}</small></b></div>
      <div class="kv"><span>Offline copy on this phone</span><b data-offline>…</b></div>
      <button class="btn ghost wide" data-act="update">Check for updates</button>
    </section>
    <p class="note">This app reads the engine computer through standard OBD-II. Tire pressure, oil life, brakes and BMW service data live in other modules it can't reach.</p>`;
  },
};

// ---------- scan screen pieces ----------
// The X-ray render is optional: car-xray.webp / .png if Cam adds one,
// otherwise the normal render with a blue "scan" filter.
let XRAY = null;
for (const src of ['car-xray.webp', 'car-xray.png']) {
  const im = new Image();
  im.onload = () => { if (!XRAY) { XRAY = src; if (route() === 'codes') render(); } };
  im.src = src;
}

function progHtml() {
  const s = state;
  const done = s.scannedAt && !s.scanning;
  const pct = s.scanning ? s.scanProg : done ? 100 : 0;
  const n = s.codes.stored.length;
  const title = s.scanning ? 'Scanning…' : done ? 'Diagnostic scan complete' : 'Ready to scan';
  const sub = s.scanning ? s.scanStep
    : done ? `${checks().length} checks · ${n ? n + ' stored code' + (n > 1 ? 's' : '') : 'no fault codes'}`
    : (s.conn === 'on' || s.conn === 'demo') ? 'Tap Scan below' : 'Connect the adapter first';
  const tone = s.scanning ? 'busy' : done ? (n ? 'amber' : 'green') : 'idle';
  return `
    <span class="prog-ic ${tone}">${icon(done && n ? 'warn' : 'checkCircle')}</span>
    <div class="prog-t"><p class="r-title">${title}</p><p class="r-sub">${sub}</p></div>
    <b class="prog-pct">${pct}%</b>
    <div class="prog-bar"><i style="width:${pct}%"></i></div>`;
}

function sysHtml() {
  const c = Object.fromEntries(checks().map((x) => [x.name, x.ok]));
  const item = (ic, label, ok, val) => {
    const cls = ok == null ? 'unk' : ok ? 'ok' : 'bad';
    const txt = ok == null ? '–' : val || (ok ? 'OK' : 'Check');
    const mark = ok == null ? '' : icon(ok ? 'check' : 'warn');
    return `<div class="sys-i ${cls}"><span class="ic">${icon(ic)}</span><p>${label}</p><b>${mark}${txt}</b></div>`;
  };
  const b = show('battery'), t = show('coolant'), f = show('trim');
  const n = state.codes.stored.length;
  return item('engine', 'Engine', c['Fault codes'], n ? n + ' codes' : 'OK')
    + item('battery', 'Battery', c['Battery'], b && b.join(' '))
    + item('temp', 'Coolant', c['Coolant temp'], t && t.join(''))
    + item('fuel', 'Fuel trim', c['Fuel trims'], f && f.join(''));
}

// Paint dissolves behind a sweeping beam and the X-ray shows through.
function reveal() {
  const xr = document.querySelector('.xr');
  if (!xr || state.revealed) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { state.revealed = true; xr.classList.add('done'); return; }
  const t0 = performance.now(), dur = 1600;
  xr.classList.add('sweeping');
  const step = (now) => {
    if (!xr.isConnected) return;
    const k = Math.min(1, (now - t0) / dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    xr.style.setProperty('--p', (-12 + e * 124).toFixed(1) + '%');
    if (k < 1) requestAnimationFrame(step);
    else { state.revealed = true; xr.classList.remove('sweeping'); xr.classList.add('done'); }
  };
  requestAnimationFrame(step);
}

function scanLine() {
  if (state.scanning) return 'Scanning…';
  if (!state.scannedAt) return 'Not scanned yet';
  const mins = Math.round((Date.now() - state.scannedAt) / 60000);
  return `Scanned ${mins < 1 ? 'just now' : mins + ' min ago'} · ${state.codes.stored.length} stored, ${state.codes.pending.length} pending`;
}

// ---------- render / update ----------
function route() { return (location.hash.replace('#/', '') || 'home').split('/')[0]; }
function routeArg() { return (location.hash.replace('#/', '') || '').split('/')[1]; }

function render() {
  const r = views[route()] ? route() : 'home';
  document.getElementById('view').innerHTML = views[r]();
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === r));
  document.body.classList.toggle('in-drive', r === 'drive');
  update();
  if (r === 'codes') setTimeout(reveal, 250);
  if (r === 'trip') Extras.drawTrip(routeArg());
  if (r === 'car') showOfflineVersion();
}

function update() {
  Extras.updateDrive();
  document.querySelectorAll('[data-k]').forEach((el) => {
    const s = show(el.dataset.k);
    el.innerHTML = s ? `${s[0]}${s[1] ? `<small>${s[1]}</small>` : ''}` : '–';
  });
  const h = document.querySelector('[data-health]');
  if (h) h.innerHTML = healthHtml();
  const sl = document.querySelector('[data-scan]');
  if (sl) sl.textContent = scanLine();
  const es = Extras.engineState();
  document.querySelectorAll('[data-k="engine"]').forEach((el) => el.classList.toggle('warn', !!es && es.tone === 'warn'));
  const pg = document.querySelector('[data-prog]');
  if (pg) pg.innerHTML = progHtml();
  const sy = document.querySelector('[data-sys]');
  if (sy) sy.innerHTML = sysHtml();
  drawChart();
}

function drawChart() {
  const cv = document.getElementById('chart');
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = Math.round((h - 1) * i / 4) + 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  const now = Date.now();
  const css = getComputedStyle(document.documentElement);
  const series = [
    ['--blue', (p) => p.rpm, 0, 7000],
    ['--violet', (p) => p.boost, -70, 150],
    ['--red', (p) => p.coolant, 0, 130],
  ];
  for (const [color, get, lo, hi] of series) {
    g.strokeStyle = css.getPropertyValue(color).trim();
    g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath();
    let started = false;
    for (const p of state.history) {
      const val = get(p); if (val == null) continue;
      const x = w - ((now - p.t) / 60000) * w;
      const y = h - 4 - Math.max(0, Math.min(1, (val - lo) / (hi - lo))) * (h - 8);
      started ? g.lineTo(x, y) : g.moveTo(x, y); started = true;
    }
    g.stroke();
  }
}

// ---------- connection ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 4500);
}

async function connect(demo) {
  Extras.unlockAudio(); // a tap is needed before the phone allows alert sounds
  state.conn = 'connecting'; render();
  adapter = demo ? new OBD.DemoAdapter() : new OBD.ElmAdapter();
  adapter.onDisconnect = () => {
    if (state.trip) Extras.stopTrip();
    if (state.conn === 'on') toast('Adapter disconnected');
    state.conn = 'off'; render();
  };
  try {
    await adapter.connect();
    state.conn = demo ? 'demo' : 'on';
    state.v = {}; state.history = [];
    Extras.resetSession();
    keepAwake();
    render();
    poll();
    await scan();
    const vin = await adapter.readVin().catch(() => null);
    if (vin) { state.vin = vin; if (!demo) store.set('vin', vin); render(); }
  } catch (e) {
    adapter && adapter.disconnect();
    state.conn = 'off'; render();
    const m = e && (e.name === 'NotFoundError' ? '' : e.message);
    OBD.log('connect failed: ' + (e && (e.name + ' ' + e.message)));
    if (m === 'NO_BT') toast("This browser can't use Bluetooth. Open the app in Bluefy.");
    else if (m === 'NO_ECU') toast("Adapter connected, but the car didn't answer. Turn the ignition on and try again.");
    else if (m === 'NO_SERIAL') toast("That device doesn't look like an OBD adapter.");
    else if (m) toast('Could not connect: ' + m);
  }
}

// Keep the phone screen on while connected (where the browser allows it).
let wake = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && (state.conn === 'on' || state.conn === 'demo')) keepAwake();
});

async function poll() {
  const me = adapter;
  let n = 0;
  while (adapter === me && (state.conn === 'on' || state.conn === 'demo')) {
    // 0-60 timer armed: read only speed, as often as the adapter allows
    const keys = Extras.perfOn() ? ['speed'] : n % 4 === 0 ? FAST.concat(SLOW) : FAST;
    let got = 0;
    for (const k of keys) {
      try { const v = await me.read(k); if (v != null) { state.v[k] = v; got++; } } catch {}
      if (adapter !== me) return;
    }
    const now = Date.now();
    Extras.onSample(now);
    state.history.push({ t: now, rpm: state.v.rpm, boost: boostKpa(), coolant: state.v.coolant });
    while (state.history.length && now - state.history[0].t > 61000) state.history.shift();
    update();
    n++;
    if (me instanceof OBD.DemoAdapter) await sleep(300);
    else if (!got) await sleep(1000);
  }
}

async function scan() {
  if (!adapter || state.scanning) return;
  const progress = (p, step) => { state.scanProg = p; state.scanStep = step; update(); };
  state.scanning = true; render();
  const started = Date.now();
  try {
    progress(15, 'Reading stored fault codes');
    state.codes.stored = await adapter.readDtcs('03');
    progress(55, 'Reading pending fault codes');
    state.codes.pending = await adapter.readDtcs('07');
    progress(70, 'Reading readiness monitors');
    state.status = adapter.readStatus ? await adapter.readStatus().catch(() => null) : null;
    progress(82, 'Reading freeze frame');
    state.freeze = state.codes.stored.length && adapter.readFreeze ? await adapter.readFreeze().catch(() => null) : null;
    progress(92, 'Checking live readings');
    await sleep(Math.max(0, 1800 - (Date.now() - started))); // let the scan animation play
    state.scannedAt = Date.now();
  } catch (e) { toast('Scan failed: ' + e.message); }
  state.scanning = false; render();
}

function confirmClear() {
  if ((state.v.rpm || 0) > 300) { toast('Turn the engine off first (leave the ignition on), then clear codes.'); return; }
  const box = document.createElement('div');
  box.className = 'modal';
  box.innerHTML = `<div class="sheet">
    <h2>Clear fault codes?</h2>
    <p>This turns off the check engine light and erases the stored and pending codes. If the problem is still there, the code comes back.</p>
    <p>The car also resets its emissions readiness checks, so it may fail an inspection until you've driven a few days.</p>
    <p class="muted">Best done with the engine off and ignition on.</p>
    <div class="actions"><button class="btn ghost" data-x="no">Cancel</button><button class="btn danger" data-x="yes">Clear codes</button></div>
  </div>`;
  document.body.appendChild(box);
  box.addEventListener('click', async (e) => {
    const x = e.target.closest('[data-x]');
    if (!x && e.target !== box) return;
    box.remove();
    if (x && x.dataset.x === 'yes') {
      try { await adapter.clearDtcs(); toast('Codes cleared'); } catch (err) { toast('Clear failed: ' + err.message); }
      scan();
    }
  });
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'connect') connect(false);
  if (act === 'demo') connect(true);
  if (act === 'scan') scan();
  if (act === 'clear') confirmClear();
  if (act === 'tab') { state.codeTab = b.dataset.id; render(); }
  if (act === 'tripstart') { if (state.conn !== 'on' && state.conn !== 'demo') toast('Connect first'); else { Extras.startTrip(); render(); } }
  if (act === 'tripstop') { Extras.stopTrip(); render(); }
  if (act === 'tripexport') Extras.exportTrip(Number(b.dataset.id));
  if (act === 'tripdelete' && confirm('Delete this drive?')) { Extras.deleteTrip(Number(b.dataset.id)); location.hash = '#/live'; }
  if (act === 'drivetab') { state.driveTab = b.dataset.id; if (b.dataset.id !== 'perf') state.perf = { mode: 'idle' }; render(); }
  if (act === 'perfarm') { if (state.conn !== 'on' && state.conn !== 'demo') toast('Connect first'); else { Extras.arm(); update(); } }
  if (act === 'perfcancel') { state.perf = { mode: 'idle' }; update(); }
  if (act === 'peakreset') { state.peak = null; update(); }
  if (act === 'update') checkUpdate(b);
  if (act === 'alerts') { store.set('alerts', b.dataset.id === '1'); render(); }
  if (act === 'units') { state.units = b.dataset.id; store.set('units', state.units); render(); }
  if (act === 'copylog') {
    const text = OBD.LOG.join(String.fromCharCode(10));
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(() => toast('Log copied'), () => toast('Copy failed: open Show log and select the text'));
  }
  if (act === 'clearlog') { OBD.LOG.length = 0; try { localStorage.removeItem('diag-log'); } catch {} render(); }
  if (act === 'disconnect') {
    if (state.trip) Extras.stopTrip();
    const a = adapter; adapter = null; state.conn = 'off'; a && a.disconnect();
    if (wake) { wake.release().catch(() => {}); wake = null; }
    render();
  }
});

document.getElementById('alert').addEventListener('click', (e) => { e.currentTarget.hidden = true; });
document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
window.addEventListener('hashchange', () => {
  if (route() === 'codes') state.revealed = false; // replay the X-ray reveal on each visit
  if (route() !== 'drive' && Extras.perfOn()) state.perf = { mode: 'idle' };
  render(); window.scrollTo(0, 0);
});
window.addEventListener('resize', drawChart);
render();

if ('serviceWorker' in navigator) {
  // When a new version takes over, reload once so the new look shows right away.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded && state.conn !== 'on') { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
