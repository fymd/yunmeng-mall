import { NextRequest, NextResponse } from "next/server";
import { loginUser, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };
    if (!username || !password) {
      return NextResponse.json(
        { error: "\u7528\u6237\u540d\u548c\u5bc6\u7801\u5fc5\u586b" },
        { status: 400 }
      );
    }
    const user = await loginUser(username.trim(), password);
    await createSession(user);
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u767b\u5f55\u5931\u8d25";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
