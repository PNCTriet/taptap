/** Player (B2C) entry routes used by CMS "open experience" CTAs. */
export const PLAYER_HOME = "/explore";
export const playerStationUrl = (code: string) => `/s/${encodeURIComponent(code)}`;
export const playerCollectionUrl = (slug: string) => `/collections/${encodeURIComponent(slug)}`;

export function randomTagCode(prefix = "tt") {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const buf = new Uint32Array(10);
  globalThis.crypto.getRandomValues(buf);
  for (const n of buf) out += alphabet[n % alphabet.length];
  return `${prefix}-${out}`;
}
