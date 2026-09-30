import bcrypt from 'bcryptjs';

/**
 * Hashes a plaintext password using bcrypt with salt factor of 10.
 * If the string is already a valid bcrypt hash, it returns it directly to avoid double hashing.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  if (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$')) {
    return password;
  }
  return bcrypt.hashSync(password, 10);
}

/**
 * Verifies a plaintext password against a stored hash.
 * Supports both bcrypt hashes and backward-compatible legacy plaintext fallback.
 */
export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (!plainText || !storedHash) return false;
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(plainText, storedHash);
    } catch {
      return false;
    }
  }
  // Backward compatibility fallback for legacy seeds before migration
  return plainText === storedHash;
}
