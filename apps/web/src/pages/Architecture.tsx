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
  { id: 1, title: "PR Opened", desc: "Developer creates a new PR on GitHub", icon: GitPullRequest, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: 2, title: "Webhook", desc: "GitHub sends a payload to our API", icon: Webhook, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: 3, title: "Diff Parser", desc: "API parses the raw code diff", icon: Server, color: "text-brand-400", bg: "bg-brand-500/10" },
  { id: 4, title: "AI Review", desc: "AI model analyzes code for bugs & style", icon: Bot, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: 5, title: "GitHub Comment", desc: "Bot posts inline comments back to PR", icon: MessageSquareDiff, color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

const cicdSteps = [
  { id: 1, title: "Code Pushed", desc: "Developer pushes code to the main branch", icon: TerminalSquare, color: "text-neutral-400", bg: "bg-neutral-500/10" },
  { id: 2, title: "GitHub Actions", desc: "CI runs type checks and starts building", icon: Workflow, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: 3, title: "Docker Build", desc: "Images built and pushed to Docker Hub", icon: Container, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { id: 4, title: "SSH Deploy", desc: "CD connects securely to the target VM", icon: Server, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: 5, title: "Zero-Downtime Deploy", desc: "VM pulls images & restarts with no downtime", icon: Cloud, color: "text-brand-400", bg: "bg-brand-500/10" },
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
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-3">
          How It Works
        </h1>
        <p className="max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
          Explore the architecture of the AI Code Review Bot. Watch the live simulated flow of code reviews and the CI/CD deployment pipeline.
        </p>
      </div>

      {/* App Architecture Section */}
      <section className="card overflow-hidden p-0">
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="App Logo" className="w-6 h-6 object-contain" />
            <h2 className="text-xl font-bold text-white">App Architecture (PR Flow)</h2>
          </div>
          <button 
            onClick={() => setIsPlayingApp(!isPlayingApp)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors border focus:outline-none focus:ring-2 focus:ring-brand-500"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            aria-label={isPlayingApp ? "Pause PR flow animation" : "Play PR flow animation"}
          >
            {isPlayingApp ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
        </div>
        
        <div className="p-8 md:p-12 overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between relative">
            <div className="absolute top-1/2 left-10 right-10 h-1 -translate-y-1/2 z-0 hidden md:block" style={{ background: "var(--border)" }}>
              <div 
                className="h-full bg-brand-500 transition-all duration-700 ease-in-out"
                style={{ width: `${((activeAppStep - 1) / (appSteps.length - 1)) * 100}%` }}
              />
            </div>

            {appSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeAppStep === step.id;
              const isPast = step.id < activeAppStep;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center w-40">
                  <div 
                    className={clsx(
                      "w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl",
                      isActive ? `border-transparent ${step.bg} scale-110 ring-4 ring-brand-500/30` :
                      isPast   ? "border-brand-500/50" :
                                 "opacity-50 grayscale"
                    )}
                    style={!isActive ? { background: "var(--bg-secondary)", borderColor: isActive ? undefined : "var(--border)" } : undefined}
                  >
                    <Icon className={clsx("w-8 h-8 transition-colors duration-500", isActive ? step.color : (isPast ? "text-brand-500/80" : "text-neutral-500"))} />
                  </div>
                  
                  <div className="mt-6 text-center h-24">
                    <h3 className={clsx("font-bold text-sm mb-1 transition-colors", isActive ? "text-white" : "text-neutral-400")}>
                      {step.title}
                    </h3>
                    <p className={clsx("text-xs leading-relaxed transition-opacity", isActive ? "opacity-100" : "opacity-0")} style={{ color: isActive ? "var(--text-secondary)" : "var(--text-muted)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DevOps Architecture Section */}
      <section className="card overflow-hidden p-0">
         <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-3">
            <Workflow className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">DevOps & CI/CD Pipeline</h2>
          </div>
          <button 
            onClick={() => setIsPlayingCicd(!isPlayingCicd)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors border focus:outline-none focus:ring-2 focus:ring-brand-500"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            aria-label={isPlayingCicd ? "Pause CI/CD flow animation" : "Play CI/CD flow animation"}
          >
            {isPlayingCicd ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
        </div>
        
        <div className="p-8 md:p-12 overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between relative">
            <div className="absolute top-1/2 left-10 right-10 h-1 -translate-y-1/2 z-0 hidden md:block" style={{ background: "var(--border)" }}>
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
                <div key={step.id} className="relative z-10 flex flex-col items-center w-40">
                  <div 
                    className={clsx(
                      "w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl",
                      isActive ? `border-transparent ${step.bg} scale-110 ring-4 ring-cyan-500/30` :
                      isPast   ? "border-cyan-500/50" :
                                 "opacity-50 grayscale"
                    )}
                    style={!isActive ? { background: "var(--bg-secondary)", borderColor: isActive ? undefined : "var(--border)" } : undefined}
                  >
                    <Icon className={clsx("w-8 h-8 transition-colors duration-500", isActive ? step.color : (isPast ? "text-cyan-500/80" : "text-neutral-500"))} />
                  </div>
                  
                  <div className="mt-6 text-center h-24">
                    <h3 className={clsx("font-bold text-sm mb-1 transition-colors", isActive ? "text-white" : "text-neutral-400")}>
                      {step.title}
                    </h3>
                    <p className={clsx("text-xs leading-relaxed transition-opacity", isActive ? "opacity-100" : "opacity-0")} style={{ color: isActive ? "var(--text-secondary)" : "var(--text-muted)" }}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="card">
          <Database className="w-8 h-8 mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-white font-bold mb-2">Backend Services</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Bun + Express + TypeScript running on a Linux VM. Managed reliably by PM2/Docker.
          </p>
        </div>
        <div className="card">
          <Server className="w-8 h-8 mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-white font-bold mb-2">Databases</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Drizzle ORM interacting with PostgreSQL for persistent data (Reviews, Users, Repositories), and Redis for rate-limiting & BullMQ queueing.
          </p>
        </div>
        <div className="card">
          <Workflow className="w-8 h-8 mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-white font-bold mb-2">AI Integration</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Multi-model AI providers (OpenAI, Anthropic, Google) with automatic fallback evaluate code diffs for logical bugs, stylistic issues, and security vulnerabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
