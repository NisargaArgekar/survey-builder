/**
 * Authentication utilities
 * Password hashing and token generation
 */

// Simple password hashing - in production use proper bcrypt or argon2
export function hashPassword(password: string): string {
  // This is a placeholder - for production use a proper hashing library
  // For now, just use a simple transformation
  return Buffer.from(password).toString('base64')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateToken(userId: string): string {
  // Simple JWT-like token for now
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64')
}
