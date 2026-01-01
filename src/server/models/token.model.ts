import db from "../config/database";

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * Store refresh token
 */
export function storeRefreshToken(
  userId: number,
  token: string,
  expiresAt: string
): void {
  const stmt = db.prepare(`
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `);

  stmt.run(userId, token, expiresAt);
}

/**
 * Find refresh token
 */
export function findRefreshToken(token: string): RefreshToken | undefined {
  const stmt = db.prepare(`
    SELECT * FROM refresh_tokens 
    WHERE token = ? AND expires_at > datetime('now')
  `);

  return stmt.get(token) as RefreshToken | undefined;
}

/**
 * Delete refresh token (for logout)
 */
export function deleteRefreshToken(token: string): void {
  const stmt = db.prepare("DELETE FROM refresh_tokens WHERE token = ?");
  stmt.run(token);
}

/**
 * Delete all refresh tokens for a user (for logout all devices)
 */
export function deleteAllUserRefreshTokens(userId: number): void {
  const stmt = db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?");
  stmt.run(userId);
}

/**
 * Clean up expired tokens
 */
export function cleanupExpiredTokens(): void {
  const stmt = db.prepare(`
    DELETE FROM refresh_tokens 
    WHERE expires_at <= datetime('now')
  `);

  stmt.run();
}
