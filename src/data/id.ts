/**
 * RFC 4122 v4 UUID generation without external dependencies.
 *
 * Prefers the platform's CSPRNG (`crypto.randomUUID` / `getRandomValues`,
 * available on web and Node 20+) and falls back to a Math.random-based v4 on
 * platforms without a global `crypto` (some React Native runtimes). This avoids
 * the `uuid` package's runtime requirement for a `crypto.getRandomValues`
 * polyfill on React Native while still producing sync-stable unique IDs.
 */
export function uuid(): string {
  const c = globalThis.crypto as
    | { randomUUID?: () => string; getRandomValues?: <T extends ArrayBufferView>(arr: T) => T }
    | undefined;

  if (c?.randomUUID) {
    return c.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Set version (4) and variant (RFC 4122) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}
