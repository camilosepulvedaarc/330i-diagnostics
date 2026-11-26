// Bluetooth test page: prints exactly what this browser offers, so a
// screenshot shows why the app's Connect button does or doesn't work.
const out = document.getElementById('out');
const say = (line) => { out.textContent += '\n' + line; };
out.textContent = '';

window.addEventListener('error', (e) => say('PAGE ERROR: ' + e.message));
window.addEventListener('unhandledrejection', (e) => say('PROMISE ERROR: ' + (e.reason && (e.reason.name + ' ' + e.reason.message))));

say('Time: ' + new Date().toLocaleTimeString());
say('Browser: ' + navigator.userAgent);
say('Secure page (https): ' + window.isSecureContext);
say('navigator.bluetooth exists: ' + !!navigator.bluetooth);
if (navigator.bluetooth) {
  say('requestDevice: ' + typeof navigator.bluetooth.requestDevice);
  say('getAvailability: ' + typeof navigator.bluetooth.getAvailability);
  if (navigator.bluetooth.getAvailability) {
    navigator.bluetooth.getAvailability()
      .then((ok) => say('Bluetooth available: ' + ok))
      .catch((e) => say('getAvailability failed: ' + e.name + ' ' + e.message));
  }
}

async function pick(label, options) {
  say('\n[' + label + '] tapped');
  if (!navigator.bluetooth) { say('No Bluetooth in this browser. Use Bluefy.'); return; }
  try {
    const dev = await navigator.bluetooth.requestDevice(options);
    say('[' + label + '] picked: ' + (dev.name || '(no name)') + ' id ' + dev.id);
    const server = await dev.gatt.connect();
    say('[' + label + '] connected: ' + server.connected);
    const services = await server.getPrimaryServices().catch((e) => { say('service list failed: ' + e.message); return []; });
    say('[' + label + '] services: ' + services.map((s) => s.uuid).join(', '));
    dev.gatt.disconnect();
  } catch (e) {
    say('[' + label + '] FAILED: ' + e.name + ': ' + e.message);
  }
}

const SERVICES = [0xfff0, 0xffe0, 0x18f0, 0xae30, 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'];
document.getElementById('b1').addEventListener('click', () =>
  pick('any', { acceptAllDevices: true, optionalServices: SERVICES }));
document.getElementById('b2').addEventListener('click', () =>
  pick('obd', { filters: SERVICES.map((s) => ({ services: [s] })).concat([{ namePrefix: 'VEEPEAK' }, { namePrefix: 'OBD' }, { namePrefix: 'IOS' }]), optionalServices: SERVICES }));
