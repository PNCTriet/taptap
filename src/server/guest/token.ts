/** Guest identity = a random secret kept in an httpOnly cookie. The DB stores only its sha256. */
export const GUEST_COOKIE = "tt_guest";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

export function isValidGuestToken(v: unknown): v is string {
  return typeof v === "string" && TOKEN_RE.test(v);
}

export function newGuestToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export function guestCookieOptions(secure: boolean) {
  return { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: GUEST_COOKIE_MAX_AGE };
}
