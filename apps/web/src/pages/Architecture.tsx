import { useState, useEffect } from "react";
import { 
  GitPullRequest, 
  Webhook, 
  Server, 
  Bot, 
  MessageSquareDiff, 
  Workflow, 
  TerminalSquare, 
  Container, 
  Cloud, 
  Play, 
  Pause,
  Database
} from "lucide-react";
import clsx from "clsx";

const appSteps = [
  { id: 1, title: "PR Opened", desc: "Developer creates a new PR on GitHub", icon: GitPullRequest, color: "text-blue-400" },
  { id: 2, title: "Webhook", desc: "GitHub sends a payload to our API", icon: Webhook, color: "text-purple-400" },
  { id: 3, title: "Diff Parser", desc: "API parses the raw code diff", icon: Server, color: "text-amber-400" },
  { id: 4, title: "AI Review", desc: "AI model analyzes code for bugs & style", icon: Bot, color: "text-amber-300" },
  { id: 5, title: "GitHub Comment", desc: "Bot posts inline comments back to PR", icon: MessageSquareDiff, color: "text-emerald-400" },
];

const cicdSteps = [
  { id: 1, title: "Code Pushed", desc: "Developer pushes code to main", icon: TerminalSquare, color: "text-neutral-400" },
  { id: 2, title: "GitHub Actions", desc: "CI runs type checks and builds", icon: Workflow, color: "text-blue-400" },
  { id: 3, title: "Docker Build", desc: "Images built and pushed to registry", icon: Container, color: "text-cyan-400" },
  { id: 4, title: "SSH Deploy", desc: "CD connects to the target VM", icon: Server, color: "text-purple-400" },
  { id: 5, title: "Zero-Downtime", desc: "VM pulls images and restarts", icon: Cloud, color: "text-emerald-400" },
];

export function Architecture() {
  const [activeAppStep, setActiveAppStep] = useState(1);
  const [activeCicdStep, setActiveCicdStep] = useState(1);
  const [isPlayingApp, setIsPlayingApp] = useState(true);
  const [isPlayingCicd, setIsPlayingCicd] = useState(true);

  useEffect(() => {
    if (!isPlayingApp) return;
    const interval = setInterval(() => {
      setActiveAppStep((prev) => (prev % appSteps.length) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlayingApp]);

  useEffect(() => {
    if (!isPlayingCicd) return;
    const interval = setInterval(() => {
      setActiveCicdStep((prev) => (prev % cicdSteps.length) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlayingCicd]);

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>How It Works</h1>
        <p className="text-xs mt-0.5 max-w-xl" style={{ color: "var(--text-muted)" }}>
          Architecture of the AI Code Review Bot. Watch the live flow of code reviews and the CI/CD pipeline.
        </p>
      </div>

      {/* App Architecture */}
      <section className="panel overflow-hidden p-0">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="w-4 h-4 object-contain" />
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>PR Flow</h2>
          </div>
          <button 
            onClick={() => setIsPlayingApp(!isPlayingApp)}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            aria-label={isPlayingApp ? "Pause" : "Play"}
          >
            {isPlayingApp ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Play</>}
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-x-auto">
          <div className="min-w-[700px] flex items-center justify-between relative">
            <div className="absolute top-8 left-8 right-8 h-0.5 -translate-y-1/2 z-0 hidden md:block" style={{ background: "var(--border-subtle)" }}>
              <div 
                className="h-full transition-all duration-700 ease-in-out"
                style={{ width: `${((activeAppStep - 1) / (appSteps.length - 1)) * 100}%`, background: "var(--accent)" }}
              />
            </div>

            {appSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeAppStep === step.id;
              const isPast = step.id < activeAppStep;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center w-32">
                  <div 
                    className={clsx(
                      "w-16 h-16 rounded-lg flex items-center justify-center border transition-all duration-500",
                      isActive ? "scale-110" : isPast ? "opacity-70" : "opacity-30"
                    )}
                    style={{ 
                      background: isActive ? "var(--accent-dim)" : "var(--bg-secondary)",
                      borderColor: isActive ? "var(--accent)" : "var(--border-subtle)"
                    }}
                  >
                    <Icon className={clsx("w-6 h-6 transition-colors duration-500", isActive ? step.color : "text-neutral-500")} />
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h3 className={clsx("text-[11px] font-bold transition-colors", isActive ? "text-white" : "text-neutral-500")}>
                      {step.title}
                    </h3>
                    <p className={clsx("text-[10px] leading-relaxed mt-0.5 transition-opacity max-w-[120px]", isActive ? "opacity-100" : "opacity-0")} style={{ color: "var(--text-muted)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CI/CD Pipeline */}
      <section className="panel overflow-hidden p-0">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4" style={{ color: "var(--status-info)" }} />
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>CI/CD Pipeline</h2>
          </div>
          <button 
            onClick={() => setIsPlayingCicd(!isPlayingCicd)}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            aria-label={isPlayingCicd ? "Pause" : "Play"}
          >
            {isPlayingCicd ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Play</>}
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-x-auto">
          <div className="min-w-[700px] flex items-center justify-between relative">
            <div className="absolute top-8 left-8 right-8 h-0.5 -translate-y-1/2 z-0 hidden md:block" style={{ background: "var(--border-subtle)" }}>
              <div 
                className="h-full bg-cyan-500 transition-all duration-700 ease-in-out"
                style={{ width: `${((activeCicdStep - 1) / (cicdSteps.length - 1)) * 100}%` }}
              />
            </div>

            {cicdSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeCicdStep === step.id;
              const isPast = step.id < activeCicdStep;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center w-32">
                  <div 
                    className={clsx(
                      "w-16 h-16 rounded-lg flex items-center justify-center border transition-all duration-500",
                      isActive ? "scale-110" : isPast ? "opacity-70" : "opacity-30"
                    )}
                    style={{ 
                      background: isActive ? "rgba(6,182,212,0.1)" : "var(--bg-secondary)",
                      borderColor: isActive ? "rgb(6,182,212)" : "var(--border-subtle)"
                    }}
                  >
                    <Icon className={clsx("w-6 h-6 transition-colors duration-500", isActive ? step.color : "text-neutral-500")} />
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h3 className={clsx("text-[11px] font-bold transition-colors", isActive ? "text-white" : "text-neutral-500")}>
                      {step.title}
                    </h3>
                    <p className={clsx("text-[10px] leading-relaxed mt-0.5 transition-opacity max-w-[120px]", isActive ? "opacity-100" : "opacity-0")} style={{ color: "var(--text-muted)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Stack Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="panel p-4">
          <Database className="w-5 h-5 mb-3" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>Backend</h3>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Bun + Express + TypeScript on Linux. Docker + PM2 for process management.
          </p>
        </div>
        <div className="panel p-4">
          <Server className="w-5 h-5 mb-3" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>Data</h3>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            PostgreSQL via Drizzle ORM for persistent data. Redis for BullMQ queues and rate limiting.
          </p>
        </div>
        <div className="panel p-4">
          <Bot className="w-5 h-5 mb-3" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>AI</h3>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Multi-model providers with automatic fallback. Static security pre-scanner at zero API cost.
          </p>
        </div>
      </div>
    </div>
  );
}
