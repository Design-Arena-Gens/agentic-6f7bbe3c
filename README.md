# Relay Agent Console

Autonomous web agent console built with Next.js 14 and Tailwind CSS. Drop a mission—launch planning, research synthesis, or process optimization—and the agent responds with an execution playbook, prioritized tasks, and strategic signals.

## 🚀 Quick start

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000` and issue commands to the agent.

## 📂 Structure

```
app/                # App Router pages & API routes
├─ api/agent/       # Agent orchestration endpoint
├─ layout.tsx       # Root layout & metadata
├─ page.tsx         # Landing page + console container
components/         # UI components
lib/agent.ts        # Deterministic agent brain & playbooks
tailwind.config.ts  # Tailwind theme configuration
```

## 🧠 Agent overview

- Deterministic playbooks for project planning, research analysis, ops optimization, and creative ideation.
- Generates execution steps, prioritized tasks with confidence scores, and strategic signals.
- References an embedded knowledge snapshot to anchor responses.

## 🛠 Scripts

- `npm run dev` – Local development server.
- `npm run build` – Production build.
- `npm start` – Run the compiled app.
- `npm run lint` – Static analysis via ESLint.

## 📦 Deployment

Ready for Vercel: `vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-6f7bbe3c`.
