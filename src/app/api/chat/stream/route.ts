import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  publishChat,
  subscribeAdmin,
  subscribeSession,
  type ChatEvent,
} from "@/lib/chat-bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/chat/stream?sessionId=xxx  — visitor session SSE
 * GET /api/chat/stream?admin=1        — admin inbox SSE
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
  const isAdmin = req.nextUrl.searchParams.get("admin") === "1";

  if (isAdmin) {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "无权限" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (!sessionId) {
    return new Response(JSON.stringify({ error: "缺少 sessionId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let unsub: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (ev: ChatEvent | { type: string }) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(ev)}\n\n`)
          );
        } catch {
          /* closed */
        }
      };

      send({ type: "ping" });

      if (isAdmin) {
        unsub = subscribeAdmin((ev) => send(ev));
      } else if (sessionId) {
        unsub = subscribeSession(sessionId, (ev) => send(ev));
      }

      heartbeat = setInterval(() => {
        send({ type: "ping" });
      }, 15000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        unsub?.();
        try {
          controller.close();
        } catch {
          /* */
        }
      });
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// silence unused in edge cases
void publishChat;
