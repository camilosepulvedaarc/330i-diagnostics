# PROJECT MAP: 330i Diagnostics

**Goal:** iPhone app (web app opened in Bluefy) that reads Cam's 2018 BMW 330i xDrive (F30, NBT EVO) through his Veepeak OBDCheck BLE: live gauges, fault codes read/explain/clear.

**Status (2026-11-26):** Built, checked in demo mode, published on GitHub Pages: https://camilosepulvedaarc.github.io/330i-diagnostics/ . Not yet tested on the real car.

## Decisions
- Web app + Bluefy (free) instead of native ($99/yr Apple). Safari has no Web Bluetooth.
- Look from Cam's reference (3-phone "BMW Diagnostic" mock): navy-black #0A0E15, cards #121821/#18202B, hairline borders, one blue #2F74FF for active, green/amber/red for status only. No BMW roundel (public URL); tri-color stripe as decoration.
- Only real OBD-II data. Tires, oil life, brakes, service and multi-module scans need BMW protocols, so they're left out (Cam chose "swap for real data").
- Health score = share of real checks passing (codes, battery, coolant, fuel trims).
- US units by default (mph/°F/psi), metric toggle on the Car tab.

- Scan tab (#/codes) = "Vehicle Scan" like the reference's middle phone: X-ray hero (beam sweeps, paint dissolves, wireframe shows), progress card, 4 system tiles, then codes. Stand-in X-ray = SVG edge-detect filter (#xray in index.html); real render car-xray.webp added 2026-11-26 (lines up with car.webp; its own floor ring, so the CSS ring hides).
- Icons redrawn closer to the reference (detailed line icons, 1.5 stroke, 30px in tiles).
- Hosting: GitHub Pages (free, no Netlify credits). PUBLIC repo camilosepulvedaarc/330i-diagnostics = local branch `public` (remote `public`), fresh history with the GitHub no-reply email. Old PRIVATE repo car-diagnostics (remote `origin`, branch `main`) has Gmail in commit history, so it stays private as an archive. DEPLOY = commit on branch `public` + `git push` (Pages rebuilds in ~1 min). Bump VERSION in sw.js each time.
- Old Netlify site car-diagnostics-330i left locked on purpose (Cam: leave it).

## Files
- `obd.js`: Web Bluetooth + ELM327 commands, PID decode, DTC read (03/07), clear (04), VIN (0902), DemoAdapter.
- `dtc.js`: plain-English text for common generic codes + fallbacks.
- `app.js`: screens (#/ dashboard, #/live, #/codes, #/car), poll loop, health, chart.
- `style.css`: all look tokens at the top. `sw.js`: offline cache, bump VERSION after changes.
- `apple-touch-icon.png`: full-bleed 512 home screen icon (rendered from icon.svg with headless Edge).
- `car.webp`: hero render (ChatGPT, Alpine White, standard bumpers). Edges faded by CSS mask. Swap for an M Sport render after the body kit.
- Preview: `.claude/launch.json` in "From Claude" → "car-diag" (port 5180).

## To do
- DONE: car render added 2026-11-26 (sw diag-v2).
- Deploy (GitHub repo + Netlify like Blueprint), then test in the car with Bluefy.
- Unknown until car test: which BLE service the Veepeak uses (app tries several), Bluefy's write/notify behaviour.
- Later: M Sport animation (FA 337 + HU_NBT_EVO VO coding via E-Sys/ENET, unverified for F30).
