import { AgentConsole } from "@/components/AgentConsole";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-14">
      <section className="rounded-3xl border border-slate-700/40 bg-slate-900/30 p-8 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-400/80">Relay Operator Stack</p>
            <h1 className="text-4xl font-semibold text-slate-100">Spin up an autonomous execution partner</h1>
            <p className="text-base text-slate-300/80">
              Feed the agent a mission—launch planning, research synthesis, or process optimization—and it will respond
              with a crisp plan, prioritized tasks, and signals that keep you in command.
            </p>
          </div>
          <div className="rounded-3xl border border-sky-500/30 bg-sky-500/10 px-6 py-4 text-sm text-sky-50/80">
            Built for instant deployment on Vercel. Zero configuration. Pure focus on operator velocity.
          </div>
        </div>
      </section>

      <AgentConsole />
    </main>
  );
}
