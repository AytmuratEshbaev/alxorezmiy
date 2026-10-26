// PBKDF2-SHA256 (WebCrypto) — Workers runtime'da ham, Node'da ham ishlaydi.
// Workers PBKDF2 iteratsiyalarini 100 000 bilan cheklaydi, shuning uchun aynan shu qiymat.
// Format: pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>
// scripts/create-admin.mjs ham xuddi shu formatda hash yaratadi.

const ITERATIONS = 100_000;
const KEY_BYTES = 32;

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, iterStr, saltB64, hashB64] = stored.split('$');
  const iterations = Number(iterStr);
  if (
    algo !== 'pbkdf2-sha256' ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > ITERATIONS
  ) {
    return false;
  }
  try {
    const expected = fromB64(hashB64);
    const actual = await derive(password, fromB64(saltB64), iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Mavjud bo'lmagan foydalanuvchi uchun ham bir xil vaqt sarflash (email enumeration'ga qarshi). */
export const DUMMY_HASH =
  'pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export const PASSWORD_MIN_LENGTH = 10;
