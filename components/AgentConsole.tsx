"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AgentMessage,
  AgentReference,
  AgentResponse,
  AgentSignal,
  AgentStep,
  AgentTask
} from "@/lib/agent";

type ChatEntry = {
  id: string;
  role: "user" | "agent";
  content: string;
  createdAt: string;
  response?: AgentResponse;
};

const INITIAL_AGENT_ENTRY: ChatEntry = {
  id: "boot",
  role: "agent",
  content:
    "Relay agent online. Drop a mission—strategy, research, or execution—and I will craft a focused plan with ready-to-run next actions.",
  createdAt: new Date().toISOString(),
  response: {
    summary: "Boot sequence complete.",
    reply:
      "Relay agent online. Drop a mission—strategy, research, or execution—and I will craft a focused plan with ready-to-run next actions.",
    steps: [
      {
        id: "boot-1",
        title: "Ready to orchestrate",
        detail: "Tell me the objective or challenge. I'll translate it into operator-ready momentum."
      }
    ],
    tasks: [],
    signals: [],
    references: [],
    playbook: "Bootstrap"
  }
};

export function AgentConsole() {
  const [messages, setMessages] = useState<ChatEntry[]>([INITIAL_AGENT_ENTRY]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskBoard, setTaskBoard] = useState<AgentTask[]>([]);
  const [signals, setSignals] = useState<AgentSignal[]>([]);
  const [activePlaybook, setActivePlaybook] = useState<string>(INITIAL_AGENT_ENTRY.response?.playbook ?? "Bootstrap");
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const chatHistory = useMemo<AgentMessage[]>(() => {
    return messages.map((message) => ({
      role: message.role === "agent" ? "assistant" : "user",
      content: message.content
    }));
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) {
      return;
    }

    const id = createId("user");
    const now = new Date().toISOString();
    const userEntry: ChatEntry = {
      id,
      role: "user",
      content: trimmed,
      createdAt: now
    };

    setMessages((prev) => [...prev, userEntry]);
    setInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const raw: unknown = await response.json();
      const payload = normalizeAgentResponse(raw);
      const agentEntry: ChatEntry = {
        id: createId("agent"),
        role: "agent",
        content: payload.reply,
        createdAt: new Date().toISOString(),
        response: payload
      };

      setMessages((prev) => [...prev, agentEntry]);
      setTaskBoard((prev) => mergeTasks(prev, payload.tasks));
      setSignals((prev) => dedupeSignals([...prev, ...payload.signals]));
      setActivePlaybook(payload.playbook);
    } catch (error) {
      console.error("failed to submit", error);
      const agentEntry: ChatEntry = {
        id: createId("agent-error"),
        role: "agent",
        content: "Signal lost while processing. Give it another shot in a moment.",
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, agentEntry]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdvanceTask = (taskId: string) => {
    setTaskBoard((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        const nextStatus = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "done" : "pending";
        return { ...task, status: nextStatus };
      })
    );
  };

  const handleSoftReset = () => {
    setMessages([INITIAL_AGENT_ENTRY]);
    setTaskBoard([]);
    setSignals([]);
    setActivePlaybook(INITIAL_AGENT_ENTRY.response?.playbook ?? "Bootstrap");
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[2.25fr_1fr]">
      <div className="glass-panel gradient-border rounded-3xl p-6 shadow-2xl border border-slate-800/40">
        <header className="flex flex-col gap-2 border-b border-slate-700/40 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300/70">Relay Operator</p>
              <h1 className="text-3xl font-semibold text-slate-100">Command Console</h1>
            </div>
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-200/80 bg-sky-900/40 rounded-full border border-sky-400/30">
              {activePlaybook}
            </span>
          </div>
          <p className="text-sm text-slate-300/70">
            Feed me a mission. I&apos;ll break it into steps, surface references, and line up next actions you can run
            immediately.
          </p>
        </header>

        <div className="relative h-[420px] overflow-y-auto pr-3" aria-live="polite">
          <div className="space-y-6">
            {messages.map((message) => (
              <ChatBubble key={message.id} entry={message} />
            ))}
          </div>
          <div ref={messageEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="w-full resize-none rounded-2xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-slate-100 outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/20"
            placeholder="Example: craft a 30-day go-to-market plan for a B2B SaaS beta"
            rows={3}
            required
            aria-label="Describe a mission for the agent"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSoftReset}
              className="rounded-full border border-slate-600/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-slate-400/80 hover:text-slate-200"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-lg shadow-sky-500/30 transition hover:shadow-sky-400/40 disabled:cursor-wait disabled:opacity-70"
            >
              {isProcessing ? "Orchestrating..." : "Deploy"}
            </button>
          </div>
        </form>
      </div>

      <aside className="glass-panel rounded-3xl border border-slate-800/40 p-6 shadow-xl space-y-6">
        <TaskPanel tasks={taskBoard} onAdvance={handleAdvanceTask} />
        <SignalPanel signals={signals} />
      </aside>
    </section>
  );
}

function ChatBubble({ entry }: { entry: ChatEntry }) {
  const isUser = entry.role === "user";
  return (
    <article
      className={`flex flex-col gap-3 rounded-3xl border px-4 py-4 text-sm leading-relaxed shadow ${
        isUser
          ? "border-slate-700/60 bg-slate-900/40 ml-auto max-w-[75%]"
          : "border-slate-700/40 bg-slate-800/40 max-w-full"
      }`}
    >
      <header className="flex items-center gap-3">
        <div
          className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold uppercase tracking-widest ${
            isUser ? "bg-slate-600/60 text-slate-200" : "bg-sky-400/20 text-sky-200 border border-sky-500/30"
          }`}
        >
          {isUser ? "YOU" : "AGENT"}
        </div>
        <span className="text-[0.67rem] uppercase tracking-[0.3em] text-slate-400/80">
          {new Date(entry.createdAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
          })}
        </span>
      </header>

      <p className="whitespace-pre-line text-slate-100/90">{entry.content}</p>

      {!isUser && entry.response ? (
        <div className="space-y-4">
          {entry.response.steps.length > 0 ? (
            <div className="rounded-2xl border border-slate-600/60 bg-slate-900/30 p-4">
              <h3 className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Execution Steps</h3>
              <ol className="mt-3 space-y-3">
                {entry.response.steps.map((step: AgentStep, index: number) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="mt-1 h-6 w-6 shrink-0 rounded-full border border-sky-400/40 text-center text-xs font-semibold text-sky-200/80">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-100">{step.title}</p>
                      <p className="text-xs text-slate-300/80">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {entry.response.references.length > 0 ? (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <h3 className="text-xs uppercase tracking-[0.35em] text-indigo-200/90">Signals To Tap</h3>
              <ul className="mt-3 space-y-2 text-xs text-indigo-100/80">
                {entry.response.references.map((reference) => (
                  <li key={reference.id}>
                    <a
                      href={reference.href}
                      className="underline decoration-dotted decoration-indigo-200/50 underline-offset-4 hover:text-indigo-200"
                    >
                      {reference.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function TaskPanel({ tasks, onAdvance }: { tasks: AgentTask[]; onAdvance: (taskId: string) => void }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 text-sm text-slate-300/70">
        Tasks will queue here once the agent identifies execution work.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-[0.35em] text-sky-200/80">Task Board</h2>
        <span className="text-[0.65rem] text-slate-500/80">
          {tasks.filter((task) => task.status === "done").length}/{tasks.length} complete
        </span>
      </header>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4 transition hover:border-sky-400/40"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-100">{task.title}</p>
              <button
                type="button"
                onClick={() => onAdvance(task.id)}
                className="rounded-full border border-slate-600/60 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-300/80 transition group-hover:border-sky-400/60 group-hover:text-sky-200/80"
              >
                {task.status === "pending" ? "Activate" : task.status === "in-progress" ? "Complete" : "Reset"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300/80">{task.description}</p>
            <div className="mt-3 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.35em] text-slate-400/80">
              <span>{task.category}</span>
              <span>Confidence {Math.round(task.confidence * 100)}%</span>
              {task.due ? <span>Due {task.due}</span> : <span />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalPanel({ signals }: { signals: AgentSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-5 text-sm text-slate-300/70">
        Strategic signals will collect here as the agent responds.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs uppercase tracking-[0.35em] text-violet-200/80">Strategic Signals</h2>
      <ul className="space-y-3 text-xs text-slate-200/80">
        {signals.map((signal) => (
          <li
            key={signal.id}
            className={`rounded-2xl border px-4 py-3 ${
              signal.type === "warning"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                : signal.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                : "border-sky-500/30 bg-sky-500/10 text-sky-100"
            }`}
          >
            {signal.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function mergeTasks(existing: AgentTask[], incoming: AgentTask[]): AgentTask[] {
  if (incoming.length === 0) {
    return existing;
  }

  const map = new Map(existing.map((task) => [task.title.toLowerCase(), task]));
  for (const task of incoming) {
    const key = task.title.toLowerCase();
    if (map.has(key)) {
      const current = map.get(key)!;
      map.set(key, {
        ...current,
        ...task,
        id: current.id,
        status: current.status
      });
    } else {
      map.set(key, task);
    }
  }
  return Array.from(map.values());
}

function dedupeSignals(signals: AgentSignal[]): AgentSignal[] {
  const seen = new Set<string>();
  const result: AgentSignal[] = [];
  for (let index = signals.length - 1; index >= 0; index -= 1) {
    const signal = signals[index];
    if (!seen.has(signal.message)) {
      seen.add(signal.message);
      result.unshift(signal);
    }
  }
  return result.slice(-6);
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAgentResponse(payload: unknown): AgentResponse {
  if (!isRecord(payload)) {
    return fallbackAgentResponse();
  }

  const steps = Array.isArray(payload.steps)
    ? payload.steps.map(normalizeStep).filter((step): step is AgentStep => step !== null)
    : [];
  const tasks = Array.isArray(payload.tasks)
    ? payload.tasks.map(normalizeTask).filter((task): task is AgentTask => task !== null)
    : [];
  const signals = Array.isArray(payload.signals)
    ? payload.signals.map(normalizeSignal).filter((signal): signal is AgentSignal => signal !== null)
    : [];
  const references = Array.isArray(payload.references)
    ? payload.references.map(normalizeReference).filter((reference): reference is AgentReference => reference !== null)
    : [];

  return {
    summary: typeof payload.summary === "string" ? payload.summary : "",
    reply: typeof payload.reply === "string" ? payload.reply : "",
    steps,
    tasks,
    signals,
    references,
    playbook: typeof payload.playbook === "string" ? payload.playbook : "General Partner"
  };
}

function normalizeStep(step: unknown): AgentStep | null {
  if (!isRecord(step)) {
    return null;
  }
  const title = typeof step.title === "string" ? step.title : "Execution step";
  const detail = typeof step.detail === "string" ? step.detail : "";
  if (!detail) {
    return null;
  }
  return {
    id: typeof step.id === "string" ? step.id : createId("step"),
    title,
    detail
  };
}

function normalizeTask(task: unknown): AgentTask | null {
  if (!isRecord(task)) {
    return null;
  }

  const title = typeof task.title === "string" ? task.title : "";
  if (!title) {
    return null;
  }

  const description = typeof task.description === "string" ? task.description : undefined;
  const category =
    task.category === "analysis" ||
    task.category === "planning" ||
    task.category === "delivery" ||
    task.category === "research"
      ? task.category
      : "planning";

  const status =
    task.status === "pending" || task.status === "in-progress" || task.status === "done"
      ? task.status
      : "pending";

  const confidence = typeof task.confidence === "number" ? clamp(task.confidence, 0, 1) : 0.5;
  const due = typeof task.due === "string" ? task.due : undefined;

  return {
    id: typeof task.id === "string" ? task.id : createId("task"),
    title,
    description,
    category,
    status,
    confidence,
    due
  };
}

function normalizeSignal(signal: unknown): AgentSignal | null {
  if (!isRecord(signal)) {
    return null;
  }

  const message = typeof signal.message === "string" ? signal.message : "";
  if (!message) {
    return null;
  }

  const type = signal.type === "warning" || signal.type === "success" ? signal.type : "insight";

  return {
    id: typeof signal.id === "string" ? signal.id : createId("signal"),
    type,
    message
  };
}

function normalizeReference(reference: unknown): AgentReference | null {
  if (!isRecord(reference)) {
    return null;
  }

  const label = typeof reference.label === "string" ? reference.label : "";
  const href = typeof reference.href === "string" ? reference.href : "#";
  if (!label) {
    return null;
  }

  return {
    id: typeof reference.id === "string" ? reference.id : createId("ref"),
    label,
    href
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fallbackAgentResponse(): AgentResponse {
  return {
    summary: "",
    reply: "Processed the request, but the response payload looked unfamiliar. Try again.",
    steps: [],
    tasks: [],
    signals: [],
    references: [],
    playbook: "General Partner"
  };
}
