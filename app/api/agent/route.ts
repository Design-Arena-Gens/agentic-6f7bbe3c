import { NextResponse } from "next/server";
import { runAgent, type AgentMessage } from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message : "";
    const historyPayload = Array.isArray(body.history) ? body.history : [];
    const history = sanitizeHistory(historyPayload);

    if (!message.trim()) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    const payload = runAgent({
      input: message,
      history
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("[agent] failed to process request", error);
    return NextResponse.json(
      { error: "Agent failed to process the request. Try again in a moment." },
      { status: 500 }
    );
  }
}

function sanitizeHistory(raw: unknown[]): AgentMessage[] {
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const possibleRole = "role" in item ? (item as Partial<AgentMessage>).role : undefined;
      const role: AgentMessage["role"] =
        possibleRole === "assistant" || possibleRole === "user" ? possibleRole : "user";

      const content = "content" in item ? String((item as Partial<AgentMessage>).content ?? "") : "";

      if (!content.trim()) {
        return null;
      }

      return { role, content };
    })
    .filter(Boolean)
    .slice(-10) as AgentMessage[];
}
