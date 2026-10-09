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
  if (existing) throw new Error("用户名或邮箱已存在");
  if (username.length < 3) throw new Error("用户名至少 3 个字符");
  if (password.length < 6) throw new Error("密码至少 6 个字符");

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
  if (!user) throw new Error("用户名或密码错误");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("用户名或密码错误");
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  } as SessionUser;
}

/**
 * Change password for the given user id. Requires current password.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!currentPassword) throw new Error("请输入当前密码");
  if (!newPassword || newPassword.length < 6) {
    throw new Error("新密码至少 6 个字符");
  }
  if (newPassword.length > 128) {
    throw new Error("新密码过长");
  }
  if (currentPassword === newPassword) {
    throw new Error("新密码不能与当前密码相同");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("用户不存在");

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new Error("当前密码错误");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
