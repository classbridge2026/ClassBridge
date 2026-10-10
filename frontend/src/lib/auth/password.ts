import "server-only";
import bcrypt from "bcryptjs";

/** Salt rounds for password hashing */
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password securely using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
