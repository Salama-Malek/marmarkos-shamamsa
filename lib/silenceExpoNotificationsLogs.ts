import { LogBox } from 'react-native';

/**
 * Side-effect-only module: must be imported BEFORE anything that pulls in
 * `expo-notifications` so the library's import-time warning + error are
 * suppressed before they fire.
 *
 * Why this exists: in Expo Go SDK 53+, expo-notifications logs a WARN and an
 * ERROR at module load complaining that Android *push* (remote) notifications
 * were removed. We only use LOCAL scheduled notifications, which still work,
 * but the library can't tell which API the app will use so it always warns.
 *
 * Two layers, because LogBox alone has historically been unreliable for
 * messages emitted via console.error from native bridges:
 *   1. LogBox.ignoreLogs hides matching lines from the in-app red-box overlay.
 *   2. console.warn/error patching swallows them at the source so they don't
 *      reach Metro either.
 *
 * Genuine warnings and errors continue through both pipes.
 */
const PATTERNS: RegExp[] = [
  /expo-notifications.*not fully supported in Expo Go/i,
  /Android Push notifications.*was removed from Expo Go/i,
];

function matchesAny(message: string): boolean {
  return PATTERNS.some((p) => p.test(message));
}

LogBox.ignoreLogs(PATTERNS);

const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

console.warn = (...args: unknown[]) => {
  const message = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
  if (matchesAny(message)) return;
  originalWarn(...args);
};

console.error = (...args: unknown[]) => {
  const message = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
  if (matchesAny(message)) return;
  originalError(...args);
};
