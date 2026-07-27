import { Settings, Database, Cpu, Bot, GitPullRequest, Monitor, Globe, BarChart3, Shield, Zap } from "lucide-react";

const FLOW = [
  { icon: GitPullRequest, label: "PR Event", detail: "GitHub fires webhook on PR open/push", color: "var(--accent)" },
  { icon: Globe, label: "Nginx", detail: "Reverse proxy, SSL termination, rate limiting", color: "var(--text-secondary)" },
  { icon: Settings, label: "API Server", detail: "Express.js — validates payload, authenticates webhook", color: "var(--accent)" },
  { icon: Database, label: "Redis Queue", detail: "BullMQ — reliable async job scheduling with retry", color: "var(--status-warn)" },
  { icon: Cpu, label: "Worker", detail: "Fetches diff via Octokit, builds context, calls AI", color: "var(--accent)" },
  { icon: Bot, label: "AI Model", detail: "Kimi-K2 via OpenRouter — analyzes code, returns structured review", color: "var(--info)" },
  { icon: GitPullRequest, label: "Post Comments", detail: "Octokit posts inline review comments on the PR", color: "var(--accent)" },
  { icon: Database, label: "PostgreSQL", detail: "Drizzle ORM — stores reviews, comments, metrics", color: "var(--status-warn)" },
];

const STACK = [
  { icon: Settings, name: "Bun.js", desc: "Fast JS runtime with native TypeScript", layer: "Runtime" },
  { icon: Settings, name: "Express.js", desc: "Minimal, flexible HTTP framework", layer: "Backend" },
  { icon: Database, name: "Redis + BullMQ", desc: "In-memory store, reliable job queues", layer: "Queue" },
  { icon: Database, name: "PostgreSQL", desc: "ACID-compliant relational database", layer: "Storage" },
  { icon: Cpu, name: "Drizzle ORM", desc: "TypeScript-first SQL query builder", layer: "ORM" },
  { icon: Bot, name: "OpenAI API", desc: "Kimi-K2 model via OpenRouter gateway", layer: "AI" },
  { icon: Settings, name: "Docker", desc: "Containerized deployment for all services", layer: "Deploy" },
  { icon: Shield, name: "GitHub App", desc: "OAuth + webhook authentication", layer: "Auth" },
];

export function Architecture() {
  return (
    <div className="h-full overflow-auto p-6 space-y-8">
      {/* PR Flow */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Zap size={16} style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>PR Flow</h2>
          <span className="text-sm code-font" style={{ color: "var(--text-muted)" }}>end-to-end</span>
        </div>

        <div className="panel p-6 overflow-x-auto">
          <div className="flex items-start gap-0 min-w-max">
            {FLOW.map(({ icon: Icon, label, detail, color }, i) => (
              <div key={label} className="flex items-start">
                <div className="flex flex-col items-center w-28">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                    style={{ borderColor: `${color}33`, background: `${color}10` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <p className="text-sm font-semibold mt-3 text-center" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs text-center mt-1 max-w-[110px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{detail}</p>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex items-center pt-5 px-1">
                    <div className="w-8 h-px" style={{ background: "var(--border)" }} />
                    <div className="w-0 h-0" style={{ borderLeft: "5px solid var(--border)", borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Monitor size={16} style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Tech Stack</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STACK.map(({ icon: Icon, name, desc, layer }) => (
            <div key={name} className="panel p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                <Icon size={18} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}>{layer}</span>
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key decisions */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={16} style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Key Decisions</h2>
        </div>
        <div className="panel p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Why BullMQ + Redis?</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Reliable job queue with automatic retries, rate limiting, and delayed jobs. Redis is battle-tested and fast.</p>
            </div>
            <div>
              <p className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Why Drizzle ORM?</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>TypeScript-first, no code generation, SQL-like API. Lightweight and fast with excellent migration support.</p>
            </div>
            <div>
              <p className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Why separate Worker?</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Decouples webhook handling from AI processing. API stays responsive while worker handles slow AI calls.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
