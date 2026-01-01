import db from "../config/database";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  password: string;
  name: string | null;
  avatar: string | null;
  role: string;
  is_verified: number;
  reset_token: string | null;
  reset_token_expires: number | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const SALT_ROUNDS = 12;

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const stmt = db.prepare(`
    INSERT INTO users (email, password, name)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(email, hashedPassword, name || null);

  return findUserById(result.lastInsertRowid as number) as User;
}

/**
 * Find user by ID
 */
export function findUserById(id: number): User | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as User | undefined;
}

/**
 * Find user by email
 */
export function findUserByEmail(email: string): User | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | undefined;
}

/**
 * Find user by reset token
 */
export function findUserByResetToken(token: string): User | undefined {
  const stmt = db.prepare(`
    SELECT * FROM users 
    WHERE reset_token = ? AND reset_token_expires > ?
  `);
  return stmt.get(token, Date.now()) as User | undefined;
}

/**
 * Update user profile
 */
export function updateUserProfile(
  id: number,
  data: { name?: string; avatar?: string | null }
): User | undefined {
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }

  if (data.avatar !== undefined) {
    updates.push("avatar = ?");
    values.push(data.avatar);
  }

  if (updates.length === 0) {
    return findUserById(id);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id.toString());

  const stmt = db.prepare(`
    UPDATE users 
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  stmt.run(...values.slice(0, -1), id);

  return findUserById(id);
}

/**
 * Update user password
 */
export async function updateUserPassword(
  id: number,
  newPassword: string
): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const stmt = db.prepare(`
    UPDATE users 
    SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(hashedPassword, id);
}

/**
 * Set password reset token
 */
export function setResetToken(
  id: number,
  token: string,
  expires: number
): void {
  const stmt = db.prepare(`
    UPDATE users 
    SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(token, expires, id);
}

/**
 * Verify user password
 */
export async function verifyPassword(
  user: User,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

/**
 * Delete user account
 */
export function deleteUser(id: number): void {
  const stmt = db.prepare("DELETE FROM users WHERE id = ?");
  stmt.run(id);
}

/**
 * Convert User to SafeUser (removes sensitive data)
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    isVerified: Boolean(user.is_verified),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
