// Bluetooth test page: tries the device list a few different ways and prints
// exactly what the browser answers, so one screenshot pins down the problem.
const out = document.getElementById('out');
const say = (line) => { out.textContent += '\n' + line; };
out.textContent = '';

// Bluefy can reject with something that isn't a normal Error, so show anything.
const describe = (e) => {
  if (e == null) return String(e);
  if (e instanceof Error) return e.name + ': ' + e.message;
  try { return typeof e + ' ' + JSON.stringify(e); } catch { return typeof e + ' ' + String(e); }
};

window.addEventListener('error', (e) => say('PAGE ERROR: ' + e.message));
window.addEventListener('unhandledrejection', (e) => say('PROMISE ERROR: ' + describe(e.reason)));

say('Browser: ' + navigator.userAgent);
say('navigator.bluetooth exists: ' + !!navigator.bluetooth);
if (navigator.bluetooth && navigator.bluetooth.getAvailability) {
  navigator.bluetooth.getAvailability().then((ok) => say('Bluetooth available: ' + ok), (e) => say('getAvailability: ' + describe(e)));
}

const full = (s) => '0000' + s + '-0000-1000-8000-00805f9b34fb';
const FULL = [full('fff0'), full('ffe0'), full('18f0'), full('ae30'), 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'];
const SHORT = [0xfff0, 0xffe0, 0x18f0, 0xae30, 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'];

async function pick(label, options) {
  say('\n[' + label + '] tapped');
  if (!navigator.bluetooth) { say('No Bluetooth in this browser. Use Bluefy.'); return; }
  try {
    const dev = await navigator.bluetooth.requestDevice(options);
    say('[' + label + '] PICKED: ' + (dev.name || '(no name)'));
    const server = await dev.gatt.connect();
    say('[' + label + '] connected: ' + server.connected);
    const services = await server.getPrimaryServices().catch((e) => { say('service list: ' + describe(e)); return []; });
    say('[' + label + '] services: ' + services.map((s) => s.uuid).join(', '));
    dev.gatt.disconnect();
  } catch (e) {
    say('[' + label + '] FAILED: ' + describe(e));
  }
}

document.getElementById('b1').addEventListener('click', () => pick('A plain', { acceptAllDevices: true }));
document.getElementById('b2').addEventListener('click', () => pick('B full IDs', { acceptAllDevices: true, optionalServices: FULL }));
document.getElementById('b3').addEventListener('click', () => pick('C short IDs', { acceptAllDevices: true, optionalServices: SHORT }));
