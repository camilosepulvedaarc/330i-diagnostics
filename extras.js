// extras.js: fuel economy, trip recording, drive mode, 0-60 timer, alerts,
// readiness and freeze-frame cards. Uses globals from app.js (state, show,
// icon, store, toast, US, n0, n1, boostKpa, header) at call time.

const Extras = (() => {
  // ---------- fuel economy ----------
  // Gasoline burns at about 14.7 g of air per g of fuel; 745 g per litre.
  // Good to roughly ±10%: the car runs slightly rich under hard throttle.
  const lph = (maf) => (maf * 3600) / (14.7 * 745);
  const econ = { L: 0, km: 0, last: 0 };

  function econText(L, km) {
    if (km < 0.1 || L <= 0) return null;
    return US() ? [n1(Math.min(99.9, (km * 0.6214) / (L * 0.26417))), 'mpg'] : [n1((L / km) * 100), 'L/100km'];
  }
  function instant() {
    const v = state.v;
    if (v.maf == null || v.speed == null) return null;
    const burn = lph(v.maf);
    if (v.speed < 5) return US() ? [(burn * 0.26417).toFixed(2), 'gal/h'] : [n1(burn), 'L/h'];
    return econText(burn, v.speed);
  }

  // ---------- trips ----------
  const loadTrips = () => store.get('trips', []);
  function saveTrips(list) {
    for (;;) {
      try { localStorage.setItem('diag-trips', JSON.stringify(list)); return; }
      catch { if (list.length <= 1) return toast('Phone storage full: trip not saved'); list.shift(); }
    }
  }
  function startTrip() {
    state.trip = { id: Date.now(), start: Date.now(), rows: [], L: 0, km: 0, lastRow: 0 };
    toast('Recording drive');
  }
  function stopTrip() {
    const t = state.trip; state.trip = null;
    if (!t || t.rows.length < 5) { toast('Drive too short to save'); return; }
    const col = (i) => t.rows.map((r) => r[i]).filter((x) => x != null);
    const trip = {
      id: t.id, start: t.start, end: Date.now(), km: t.km, L: t.L,
      maxBoost: Math.max(...col(3)), maxSpeed: Math.max(...col(1)), rows: t.rows,
    };
    const list = loadTrips(); list.push(trip);
    while (list.length > 8) list.shift();
    saveTrips(list);
    toast('Drive saved');
  }
  function deleteTrip(id) { saveTrips(loadTrips().filter((t) => t.id !== id)); }

  function exportTrip(id) {
    const t = loadTrips().find((x) => x.id === id);
    if (!t) return;
    const head = US()
      ? 'time_s,speed_mph,rpm,boost_psi,coolant_F,throttle_pct,airflow_gps'
      : 'time_s,speed_kmh,rpm,boost_bar,coolant_C,throttle_pct,airflow_gps';
    const f = (x, d) => (x == null ? '' : x.toFixed(d));
    const lines = t.rows.map(([s, kmh, rpm, kpa, c, thr, maf]) => [
      s.toFixed(1),
      f(kmh == null ? null : US() ? kmh * 0.6214 : kmh, 1), f(rpm, 0),
      f(kpa == null ? null : US() ? kpa * 0.145 : kpa / 100, 2),
      f(c == null ? null : US() ? c * 9 / 5 + 32 : c, 0), f(thr, 0), f(maf, 2),
    ].join(','));
    const name = '330i-drive-' + new Date(t.start).toISOString().slice(0, 16).replace(/[T:]/g, '-') + '.csv';
    const file = new File([head + '\n' + lines.join('\n')], name, { type: 'text/csv' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(() => {});
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  }

  // ---------- 0-60 timer ----------
  const target = () => (US() ? { kmh: 96.56, label: '0–60 mph' } : { kmh: 100, label: '0–100 km/h' });
  const perfOn = () => ['wait', 'ready', 'run'].includes(state.perf.mode);
  function arm() { state.perf = { mode: 'wait', prev: null, n: 0, since: performance.now() }; }
  function perfSample(t) {
    const p = state.perf, s = state.v.speed;
    if (!perfOn() || s == null) return;
    p.n++;
    if (p.mode === 'wait' && s < 1) p.mode = 'ready';
    else if (p.mode === 'ready' && s >= 1) { p.t0 = p.prev ? (p.prev.t + t) / 2 : t; p.mode = 'run'; }
    else if (p.mode === 'run') {
      const goal = target().kmh;
      if (s < 1) p.mode = 'ready';
      else if (s >= goal && p.prev) {
        const k = (goal - p.prev.s) / (s - p.prev.s || 1);
        p.result = (p.prev.t + k * (t - p.prev.t) - p.t0) / 1000;
        p.mode = 'done';
        const best = store.get('perf', []);
        best.push({ s: p.result, label: target().label, at: Date.now() });
        best.sort((a, b) => a.s - b.s);
        store.set('perf', best.slice(0, 10));
        beep(880, 0.15);
      }
    }
    p.prev = { t, s };
  }

  // ---------- alerts ----------
  let audio = null;
  function unlockAudio() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch {}
  }
  function beep(freq = 660, len = 0.25) {
    if (!audio) return;
    try {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.25, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + len);
      o.start(); o.stop(audio.currentTime + len);
    } catch {}
  }
  const lastAlert = {};
  function alertOnce(key, msg) {
    const now = Date.now();
    if (lastAlert[key] && now - lastAlert[key] < 90000) return;
    lastAlert[key] = now;
    const el = document.getElementById('alert');
    el.innerHTML = `${icon('warn')}<span>${msg}</span>`;
    el.hidden = false;
    clearTimeout(alertOnce.t);
    alertOnce.t = setTimeout(() => { el.hidden = true; }, 12000);
    beep(); setTimeout(() => beep(), 320);
  }
  function checkAlerts() {
    if (!store.get('alerts', true)) return;
    const v = state.v, running = (v.rpm || 0) > 400;
    if (v.coolant != null && v.coolant >= 110) alertOnce('hot', `Coolant is hot (${show('coolant').join('')}). Ease off and let it cool.`);
    if (v.battery != null) {
      if (running && v.battery < 12.8) alertOnce('chg', `Battery only ${n1(v.battery)} V with the engine running. The charging system may have a problem.`);
      else if (!running && v.battery < 11.9) alertOnce('bat', `Battery is low (${n1(v.battery)} V). Start the engine soon.`);
    }
  }

  // Engine tile: off / warming up / warm. Oil warms up later than coolant.
  function engineState() {
    const v = state.v;
    if (v.rpm == null) return null;
    if (v.rpm <= 300) return { text: 'Off', tone: '' };
    if (v.coolant == null) return { text: 'Running', tone: 'ok' };
    return v.coolant < 75 ? { text: 'Warming up', tone: 'warn' } : { text: 'Warm', tone: 'ok' };
  }

  // ---------- called after every poll round ----------
  function onSample(now) {
    const v = state.v;
    const dt = econ.last ? (now - econ.last) / 3600000 : 0; // hours
    econ.last = now;
    if (dt > 0 && dt < 5 / 3600 && v.maf != null) {
      const L = lph(v.maf) * dt, km = (v.speed || 0) * dt;
      econ.L += L; econ.km += km;
      if (state.trip) { state.trip.L += L; state.trip.km += km; }
    }
    const b = boostKpa();
    if (b != null && (state.peak == null || b > state.peak)) state.peak = b;
    const tr = state.trip;
    if (tr && now - tr.lastRow >= 250) {
      tr.lastRow = now;
      const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
      tr.rows.push([r1((now - tr.start) / 1000), r1(v.speed), v.rpm == null ? null : Math.round(v.rpm), r1(b), r1(v.coolant), r1(v.throttle), r1(v.maf)]);
    }
    perfSample(performance.now());
    checkAlerts();
  }
  function resetSession() { econ.L = 0; econ.km = 0; econ.last = 0; state.peak = null; }

  // ---------- extra display values ----------
  function showExtra(key) {
    if (key === 'mpg') return instant();
    if (key === 'mpgavg') return econText(econ.L, econ.km);
    if (key === 'peak') {
      if (state.peak == null) return null;
      return US() ? [n1(state.peak * 0.145), 'psi'] : [(state.peak / 100).toFixed(2), 'bar'];
    }
    if (key === 'engine') { const e = engineState(); return e && [e.text, '']; }
    return undefined;
  }

  // ---------- scan screen cards ----------
  function readinessHtml() {
    const st = state.status;
    if (!st) return '';
    const left = st.monitors.filter((m) => !m.done);
    const verdict = !left.length ? ['ok', 'All monitors ready']
      : left.length === 1 ? ['warn', '1 monitor not ready yet']
      : ['bad', left.length + ' monitors not ready yet'];
    return `<section class="card ready-card">
      <div class="card-h"><h2>${icon('checkCircle')} Inspection readiness</h2>
        <span class="mil ${st.mil ? 'on' : ''}">${icon('engine')} ${st.mil ? 'Light ON' : 'Light off'}</span></div>
      <p class="ready-verdict ${verdict[0]}">${verdict[1]}</p>
      <div class="mons">${st.monitors.map((m) => `<span class="mon ${m.done ? 'done' : ''}">${icon(m.done ? 'check' : 'clock')}${m.name}</span>`).join('')}</div>
      <p class="muted small">Monitors finish on their own after a few days of normal driving. Most US states allow at most one unfinished monitor on 2001+ cars. Check your state's rule.</p>
    </section>`;
  }

  function freezeHtml() {
    const fz = state.freeze;
    if (!fz) return '';
    const save = state.v; state.v = fz.v;
    try {
    const cell = (label, key) => { const s = show(key); return s ? `<div><span>${label}</span><b>${s[0]}<small>${s[1]}</small></b></div>` : ''; };
    const html = `<section class="card freeze-card">
      <div class="card-h"><h2>${icon('clock')} Freeze frame · ${fz.code}</h2></div>
      <p class="muted small">What the engine was doing when ${fz.code} was stored.</p>
      <div class="fz">${cell('RPM', 'rpm')}${cell('Speed', 'speed')}${cell('Coolant', 'coolant')}${cell('Load', 'load')}
        ${cell('Short trim', 'stft')}${cell('Long trim', 'ltft')}${cell('Boost', 'boost')}${cell('Throttle', 'throttle')}${cell('Intake', 'intake')}</div>
    </section>`;
    return html;
    } finally { state.v = save; }
  }

  // ---------- live screen cards ----------
  function tripsHtml() {
    const rec = state.trip;
    const list = loadTrips().slice().reverse();
    const dur = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
    const dist = (km) => US() ? n1(km * 0.6214) + ' mi' : n1(km) + ' km';
    return `<section class="card trips">
      <div class="card-h"><h2>${icon('road')} Drives</h2>
        <button class="btn ${rec ? 'danger' : 'primary'} sm" data-act="${rec ? 'tripstop' : 'tripstart'}">${rec ? '■ Stop' : '● Record'}</button></div>
      ${rec ? `<p class="rec"><i></i>Recording · <span data-k="triptime">0:00</span> · <span data-k="tripdist">–</span></p>` : ''}
      ${list.length ? list.map((t) => {
        const e = econText(t.L, t.km);
        return `<a class="trip" href="#/trip/${t.id}">
          <div><p class="r-title">${new Date(t.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${new Date(t.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          <p class="r-sub">${dur(t.end - t.start)} · ${dist(t.km)}${e ? ' · ' + e.join(' ') : ''}</p></div>
          <span class="chev">${icon('chevron')}</span></a>`;
      }).join('') : `<p class="muted small">Tap Record before a drive to save it. You can replay it here or export it as a spreadsheet.</p>`}
    </section>`;
  }

  function tripLive() {
    const t = state.trip;
    if (!t) return {};
    const s = Math.round((Date.now() - t.start) / 1000);
    return {
      triptime: [Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), ''],
      tripdist: [US() ? n1(t.km * 0.6214) : n1(t.km), US() ? 'mi' : 'km'],
    };
  }

  function tripView(id) {
    const t = loadTrips().find((x) => String(x.id) === String(id));
    if (!t) return `${header('Drive', '', '#/live')}<p class="empty">This drive isn't saved anymore.</p>`;
    const e = econText(t.L, t.km);
    const mins = Math.round((t.end - t.start) / 60000);
    const box = (label, val) => `<div class="tile"><div><p class="lbl">${label}</p><p class="val">${val}</p></div></div>`;
    const sp = (kmh) => US() ? n0(kmh * 0.6214) + '<small>mph</small>' : n0(kmh) + '<small>km/h</small>';
    const bo = (k) => US() ? n1(k * 0.145) + '<small>psi</small>' : (k / 100).toFixed(2) + '<small>bar</small>';
    return `
    ${header(new Date(t.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), new Date(t.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · ' + mins + ' min', '#/live')}
    <section class="card chart-card">
      <div class="card-h"><h2>${icon('chart')} Whole drive</h2></div>
      <canvas id="tripchart"></canvas>
      <ul class="legend row-legend"><li class="s-blue"><i></i>RPM</li><li class="s-violet"><i></i>Boost</li><li class="s-green"><i></i>Speed</li><li class="s-red"><i></i>Coolant</li></ul>
    </section>
    <section class="grid">
      ${box('Distance', US() ? n1(t.km * 0.6214) + '<small>mi</small>' : n1(t.km) + '<small>km</small>')}
      ${box('Fuel economy', e ? e[0] + '<small>' + e[1] + '</small>' : '–')}
      ${box('Top speed', sp(t.maxSpeed || 0))}
      ${box('Peak boost', bo(t.maxBoost || 0))}
    </section>
    <div class="actions">
      <button class="btn primary" data-act="tripexport" data-id="${t.id}">Export CSV</button>
      <button class="btn danger" data-act="tripdelete" data-id="${t.id}">${icon('trash')} Delete</button>
    </div>`;
  }

  function drawTrip(id) {
    const cv = document.getElementById('tripchart');
    const t = cv && loadTrips().find((x) => String(x.id) === String(id));
    if (!t) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const end = t.rows[t.rows.length - 1][0] || 1;
    const series = [['--blue', 2, 0, 7000], ['--violet', 3, -70, 150], ['--green', 1, 0, 200], ['--red', 4, 0, 130]];
    for (const [color, i, lo, hi] of series) {
      g.strokeStyle = css.getPropertyValue(color).trim(); g.lineWidth = 1.5; g.lineJoin = 'round';
      g.beginPath(); let on = false;
      for (const r of t.rows) {
        if (r[i] == null) continue;
        const x = (r[0] / end) * w, y = h - 3 - Math.max(0, Math.min(1, (r[i] - lo) / (hi - lo))) * (h - 6);
        on ? g.lineTo(x, y) : g.moveTo(x, y); on = true;
      }
      g.stroke();
    }
  }

  // ---------- drive mode ----------
  function gaugeSvg() {
    // boost gauge: -15..+20 psi (or -1..+1.4 bar), 240° sweep
    const lo = -103, hi = 138; // kPa
    const R = 88, C = 2 * Math.PI * R, sweep = C * (240 / 360);
    const b = boostKpa();
    const k = b == null ? 0 : Math.max(0, Math.min(1, (b - lo) / (hi - lo)));
    const pk = state.peak == null ? null : Math.max(0, Math.min(1, (state.peak - lo) / (hi - lo)));
    const ang = (f) => (150 + f * 240) * Math.PI / 180;
    const tick = pk == null ? '' : (() => {
      const a = ang(pk), x1 = 100 + 74 * Math.cos(a), y1 = 100 + 74 * Math.sin(a), x2 = 100 + 102 * Math.cos(a), y2 = 100 + 102 * Math.sin(a);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="peak"/>`;
    })();
    const zero = (() => { const a = ang((0 - lo) / (hi - lo)); return `<circle cx="${100 + R * Math.cos(a)}" cy="${100 + R * Math.sin(a)}" r="3" class="zero"/>`; })();
    const s = show('boost');
    return `<svg viewBox="0 0 200 180">
      <circle cx="100" cy="100" r="${R}" class="g-track" stroke-dasharray="${sweep} ${C}" transform="rotate(150 100 100)"/>
      <circle cx="100" cy="100" r="${R}" class="g-bar" stroke-dasharray="${sweep * k} ${C}" transform="rotate(150 100 100)"/>
      ${zero}${tick}
      <text x="100" y="104" class="g-num">${s ? s[0] : '–'}</text>
      <text x="100" y="128" class="g-unit">${US() ? 'psi boost' : 'bar boost'}</text>
    </svg>`;
  }

  function perfParts() {
    const p = state.perf, tg = target();
    const big = p.mode === 'done' ? p.result.toFixed(2) + '<small>s</small>' : p.mode === 'run' ? ((performance.now() - p.t0) / 1000).toFixed(1) + '<small>s</small>' : '–.–';
    const msg = {
      idle: 'Tap Arm, then come to a full stop.',
      wait: 'Come to a full stop to start.',
      ready: 'Ready. The timer starts the moment you move.',
      run: 'Go! Timing to ' + tg.label.split('–')[1] + '…',
      done: 'Done. Tap Arm to try again.',
    }[p.mode];
    const rate = perfOn() && p.n > 3 ? ` · ${n1(p.n / ((performance.now() - p.since) / 1000))} speed readings/s` : '';
    return { big, msg: msg + rate };
  }
  function perfHtml() {
    const p = state.perf, tg = target(), { big, msg } = perfParts();
    const best = store.get('perf', []).filter((b) => b.label === tg.label).slice(0, 5);
    return `<section class="card perf ${p.mode}">
      <p class="perf-label">${tg.label}</p>
      <p class="perf-big">${big}</p>
      <p class="perf-msg">${msg}</p>
      <button class="btn ${perfOn() ? 'ghost' : 'primary'} wide" data-act="${perfOn() ? 'perfcancel' : 'perfarm'}">${perfOn() ? 'Cancel' : 'Arm'}</button>
    </section>
    <section class="card list">${best.length ? best.map((b, i) => `<div class="kv"><span>#${i + 1} · ${new Date(b.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><b>${b.s.toFixed(2)} s</b></div>`).join('') : '<div class="kv"><span>No runs yet</span><b>–</b></div>'}</section>
    <p class="note">Accuracy is about ±0.2–0.3 s: the adapter reports speed only a few times a second. Only time runs where it's legal and safe, like a closed course.</p>`;
  }

  function driveView() {
    return `<div class="drive-wrap">
      ${header('Drive mode', '', '#/live')}
      <div class="seg">
        <button class="${state.driveTab === 'gauges' ? 'on' : ''}" data-act="drivetab" data-id="gauges">Gauges</button>
        <button class="${state.driveTab === 'perf' ? 'on' : ''}" data-act="drivetab" data-id="perf">${target().label}</button>
      </div>
      <div data-drive>${driveInner()}</div>
    </div>`;
  }
  function driveInner() {
    if (state.driveTab === 'perf') return perfHtml();
    const e = engineState();
    return `<section class="card dgauge"><div data-gauge>${gaugeSvg()}</div>
        <button class="peak-btn" data-act="peakreset">Peak <b data-k="peak">–</b> · reset</button></section>
      <section class="dgrid">
        <div class="tile big"><div><p class="lbl">Speed</p><p class="val" data-k="speed">–</p></div></div>
        <div class="tile big"><div><p class="lbl">RPM</p><p class="val" data-k="rpm">–</p></div></div>
        <div class="tile big"><div><p class="lbl">Coolant${e && e.tone === 'warn' ? ' · warming up' : ''}</p><p class="val ${e && e.tone === 'warn' ? 'warn' : ''}" data-k="coolant">–</p></div></div>
        <div class="tile big"><div><p class="lbl">Fuel now</p><p class="val" data-k="mpg">–</p></div></div>
      </section>`;
  }
  // Refresh only the moving parts so buttons aren't rebuilt under a finger.
  function updateDrive() {
    const g = document.querySelector('[data-gauge]');
    if (g) g.innerHTML = gaugeSvg();
    const d = document.querySelector('[data-drive]');
    if (!d || state.driveTab !== 'perf') return;
    if (d.dataset.mode !== state.perf.mode) { d.dataset.mode = state.perf.mode; d.innerHTML = perfHtml(); return; }
    const { big, msg } = perfParts();
    d.querySelector('.perf-big').innerHTML = big;
    d.querySelector('.perf-msg').textContent = msg;
  }

  return {
    onSample, resetSession, showExtra, unlockAudio, tripLive,
    readinessHtml, freezeHtml, tripsHtml, tripView, drawTrip, driveView, updateDrive,
    startTrip, stopTrip, deleteTrip, exportTrip, arm, perfOn, engineState,
  };
})();
