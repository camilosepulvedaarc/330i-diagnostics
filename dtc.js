// dtc.js: plain-English meanings for common generic (SAE) fault codes.
// Codes not listed fall back to the system they belong to.

const DTC_TEXT = {
  P0010: 'Intake camshaft actuator circuit (Bank 1)',
  P0011: 'Intake camshaft timing over-advanced (Bank 1)',
  P0014: 'Exhaust camshaft timing over-advanced (Bank 1)',
  P0016: 'Crankshaft / camshaft position correlation (Bank 1)',
  P0030: 'Upstream O2 sensor heater circuit (Bank 1 Sensor 1)',
  P0036: 'Downstream O2 sensor heater circuit (Bank 1 Sensor 2)',
  P0087: 'Fuel rail pressure too low',
  P0088: 'Fuel rail pressure too high',
  P0101: 'Mass air flow sensor range / performance',
  P0106: 'Manifold pressure sensor range / performance',
  P0111: 'Intake air temperature sensor range / performance',
  P0117: 'Coolant temperature sensor reading low',
  P0118: 'Coolant temperature sensor reading high',
  P0128: 'Engine not reaching normal temperature (thermostat)',
  P0130: 'Upstream O2 sensor circuit (Bank 1 Sensor 1)',
  P0133: 'Upstream O2 sensor slow response (Bank 1 Sensor 1)',
  P0171: 'System too lean (Bank 1)',
  P0172: 'System too rich (Bank 1)',
  P0201: 'Injector circuit, cylinder 1',
  P0202: 'Injector circuit, cylinder 2',
  P0203: 'Injector circuit, cylinder 3',
  P0204: 'Injector circuit, cylinder 4',
  P0217: 'Engine overheating',
  P0234: 'Turbo overboost',
  P0299: 'Turbo underboost',
  P0300: 'Random / multiple cylinder misfire',
  P0301: 'Misfire, cylinder 1',
  P0302: 'Misfire, cylinder 2',
  P0303: 'Misfire, cylinder 3',
  P0304: 'Misfire, cylinder 4',
  P0325: 'Knock sensor circuit (Bank 1)',
  P0335: 'Crankshaft position sensor circuit',
  P0340: 'Camshaft position sensor circuit (Bank 1)',
  P0420: 'Catalytic converter efficiency below threshold (Bank 1)',
  P0440: 'Evaporative emission (EVAP) system fault',
  P0441: 'EVAP system incorrect purge flow',
  P0442: 'EVAP system small leak',
  P0455: 'EVAP system large leak',
  P0456: 'EVAP system very small leak',
  P0457: 'EVAP leak (fuel cap loose or missing)',
  P0500: 'Vehicle speed sensor',
  P0506: 'Idle speed lower than expected',
  P0507: 'Idle speed higher than expected',
  P0562: 'System voltage low',
  P0563: 'System voltage high',
  P0600: 'Control module communication link',
  P0606: 'Engine computer processor fault',
  P0700: 'Transmission control system (transmission has its own code)',
  P0715: 'Transmission input speed sensor circuit',
  P2096: 'After-catalyst fuel trim too lean (Bank 1)',
  P2097: 'After-catalyst fuel trim too rich (Bank 1)',
  P2181: 'Cooling system performance',
  P2187: 'System too lean at idle (Bank 1)',
  P2188: 'System too rich at idle (Bank 1)',
  U0100: 'Lost communication with engine computer',
  U0101: 'Lost communication with transmission computer',
  U0121: 'Lost communication with ABS module',
};

const SYSTEMS = {
  '0': 'Fuel, air or emissions', '1': 'Fuel and air metering', '2': 'Fuel and air metering',
  '3': 'Ignition or misfire', '4': 'Emissions controls', '5': 'Speed and idle control',
  '6': 'Engine computer and outputs', '7': 'Transmission', '8': 'Transmission', '9': 'Transmission',
};

function describeDtc(code) {
  if (DTC_TEXT[code]) return DTC_TEXT[code];
  const kind = code[0], maker = code[1] === '1' || code[1] === '3';
  if (maker) return 'BMW-specific code (look it up for your model)';
  if (kind === 'P') return (SYSTEMS[code[2]] || 'Powertrain') + ' fault';
  return { C: 'Chassis', B: 'Body', U: 'Network' }[kind] + ' fault';
}

// red = stop driving hard / get it checked soon, amber = check when you can
function dtcSeverity(code) {
  if (/^P030\d$|^P0217$|^P0234$|^P0087$/.test(code)) return 'red';
  return 'amber';
}

window.DTC = { describeDtc, dtcSeverity };
