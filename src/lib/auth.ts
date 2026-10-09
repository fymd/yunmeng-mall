import * as bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

const COOKIE_NAME = "ym_session";
const SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

export type SessionUser = {
  id: string;
  username: string;
  email: string | null;
  role: string;
};

function encodeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const sig = Buffer.from(`${payload}.${SECRET}`)
    .toString("base64url")
    .slice(0, 32);
  return `${payload}.${sig}`;
}

function decodeSession(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = Buffer.from(`${payload}.${SECRET}`)
      .toString("base64url")
      .slice(0, 32);
    if (sig !== expected) return null;
    const user = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as SessionUser;
    if (!user?.id || !user?.username) return null;
    return user;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = encodeSession(user);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function registerUser(
  username: string,
  password: string,
  email?: string
) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
  });
  if (existing) throw new Error("\u7528\u6237\u540d\u6216\u90ae\u7bb1\u5df2\u5b58\u5728");
  if (username.length < 3) throw new Error("\u7528\u6237\u540d\u81f3\u5c11 3 \u4e2a\u5b57\u7b26");
  if (password.length < 6) throw new Error("\u5bc6\u7801\u81f3\u5c11 6 \u4e2a\u5b57\u7b26");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      email: email || null,
      passwordHash,
      role: "USER",
    },
  });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  } as SessionUser;
}

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
    },
  });
  if (!user) throw new Error("\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef");
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  } as SessionUser;
}
