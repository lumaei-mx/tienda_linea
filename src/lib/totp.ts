import { randomBytes } from "crypto";

/**
 * 2FA TOTP (RFC 6238) — compatible Edge Runtime.
 * Usa crypto.subtle (async) + periodo 30s + digits 6.
 */

export interface TotpSecret {
  secret: string; // base32
  otpauthUrl: string;
  recoveryCode: string;
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += "=";
  return output;
}

function base32Decode(str: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = str.replace(/=+$/, "").toUpperCase();
  const bits: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32");
    for (let i = 4; i >= 0; i--) bits.push((idx >> i) & 1);
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    bytes[i] = b;
  }
  return bytes;
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, message.buffer as ArrayBuffer);
  return new Uint8Array(sig);
}

export function generateTotpSecret(email: string): TotpSecret {
  const raw = randomBytes(20);
  const secret = base32Encode(raw);
  const issuer = "Lumaei";
  const otpauthUrl = `otpauth://totp/${issuer}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
  const recoveryCode = randomBytes(4).toString("hex").toUpperCase();
  return { secret, otpauthUrl, recoveryCode };
}

export async function verifyTotpCode(secretBase32: string, code: string): Promise<boolean> {
  if (!code || code.length !== 6) return false;
  try {
    const secret = base32Decode(secretBase32);
    const epoch = Math.floor(Date.now() / 30000);
    for (let i = -1; i <= 1; i++) {
      const counter = new Uint8Array(8);
      const view = new DataView(counter.buffer);
      view.setUint32(0, 0, false);
      view.setUint32(4, epoch + i, false);
      const hash = await hmacSha1(secret, counter);
      const offset = hash[hash.length - 1] & 0xf;
      const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);
      const otp = binary % 1000000;
      if (String(otp).padStart(6, "0") === code) return true;
    }
    return false;
  } catch {
    return false;
  }
}