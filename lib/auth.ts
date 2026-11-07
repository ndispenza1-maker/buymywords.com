import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getSQL } from "./db";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set — refusing to run with insecure default");
  return secret;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
  account_type: string | null; // 'shopper' | 'store_owner' | null
  profile_complete: boolean;
  store_built: boolean;
  subscription_status: string | null;
  subscription_tier: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "30d" });
}

export async function setAuthCookie(userId: string) {
  const token = createToken(userId);
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    domain: process.env.NODE_ENV === "production" ? ".themallofprojects.com" : undefined,
  });
}

export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    const sql = getSQL();
    const rows = await sql`
      SELECT id, email, display_name, bio, avatar_url, cover_url, created_at, account_type, profile_complete, store_built, subscription_status, subscription_tier
      FROM users WHERE id = ${decoded.userId}
    `;
    return (rows[0] as User) || null;
  } catch {
    return null;
  }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", { maxAge: 0, path: "/", domain: process.env.NODE_ENV === "production" ? ".themallofprojects.com" : undefined });
}
