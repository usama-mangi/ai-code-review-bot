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

// --- App Flow Data ---
const appSteps = [
  { id: 1, title: "1. PR Opened", desc: "Developer creates a new PR on GitHub", icon: GitPullRequest, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: 2, title: "2. Webhook", desc: "GitHub sends a payload to our API", icon: Webhook, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: 3, title: "3. Diff Parser", desc: "Azure VM API parses the raw code diff", icon: Server, color: "text-brand-400", bg: "bg-brand-500/10" },
  { id: 4, title: "4. AI Review", desc: "GPT-4o analyzes the code for bugs & style", icon: Bot, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: 5, title: "5. GitHub Comment", desc: "Bot posts inline comments back to PR", icon: MessageSquareDiff, color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

// --- DevOps Flow Data ---
const cicdSteps = [
  { id: 1, title: "1. Code Pushed", desc: "Developer pushes code to the main branch", icon: TerminalSquare, color: "text-neutral-400", bg: "bg-neutral-500/10" },
  { id: 2, title: "2. GitHub Actions", desc: "CI runs type checks and starts building", icon: Workflow, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: 3, title: "3. Docker Build", desc: "Images built and pushed to Docker Hub", icon: Container, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { id: 4, title: "4. SSH Deploy", desc: "CD connects securely to Azure VM", icon: Server, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: 5, title: "5. Azure Start", desc: "VM pulls images & performs zero-downtime restart", icon: Cloud, color: "text-brand-400", bg: "bg-brand-500/10" },
];

export function Architecture() {
  const [activeAppStep, setActiveAppStep] = useState(1);
  const [activeCicdStep, setActiveCicdStep] = useState(1);
  
  const [isPlayingApp, setIsPlayingApp] = useState(true);
  const [isPlayingCicd, setIsPlayingCicd] = useState(true);

  // App cycle
  useEffect(() => {
    if (!isPlayingApp) return;
    const interval = setInterval(() => {
      setActiveAppStep((prev) => (prev % appSteps.length) + 1);
    }, 2500); // 2.5s per step
    return () => clearInterval(interval);
  }, [isPlayingApp]);

  // CI/CD cycle
  useEffect(() => {
    if (!isPlayingCicd) return;
    const interval = setInterval(() => {
      setActiveCicdStep((prev) => (prev % cicdSteps.length) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlayingCicd]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10 space-y-12">
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent mb-3">
          How It Works
        </h1>
        <p className="text-neutral-400 max-w-2xl text-lg">
          Explore the architecture of the AI Code Review Bot. Watch the live simulated flow of code reviews and our CI/CD deployment pipeline.
        </p>
      </div>

      {/* --- App Architecture Section --- */}
      <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="App Logo" className="w-6 h-6 object-contain" />
            <h2 className="text-xl font-bold text-white">App Architecture (PR Flow)</h2>
          </div>
          <button 
            onClick={() => setIsPlayingApp(!isPlayingApp)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-white rounded-lg transition-colors border border-neutral-700"
          >
            {isPlayingApp ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
        </div>
        
        <div className="p-8 md:p-12 overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between relative">
            
            {/* The animated connection line */}
            <div className="absolute top-1/2 left-10 right-10 h-1 bg-neutral-800 -translate-y-1/2 z-0 hidden md:block">
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
                  {/* Step Node */}
                  <div 
                    className={clsx(
                      "w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl",
                      isActive ? `border-transparent ${step.bg} scale-110 ring-4 ring-brand-500/30` :
                      isPast   ? "border-brand-500/50 bg-neutral-900" :
                                 "border-neutral-800 bg-neutral-900 opacity-50 grayscale"
                    )}
                  >
                    <Icon className={clsx("w-8 h-8 transition-colors duration-500", isActive ? step.color : (isPast ? "text-brand-500/80" : "text-neutral-500"))} />
                  </div>
                  
                  {/* Step Content */}
                  <div className="mt-6 text-center h-24">
                    <span className={clsx(
                      "text-xs font-bold uppercase tracking-wider mb-1 block transition-colors",
                      isActive ? step.color : "text-neutral-600"
                    )}>
                      Step {step.id}
                    </span>
                    <h3 className={clsx("font-bold text-sm mb-1 transition-colors", isActive ? "text-white" : "text-neutral-400")}>
                      {step.title}
                    </h3>
                    <p className={clsx("text-xs leading-relaxed transition-opacity", isActive ? "text-neutral-300 opacity-100" : "text-neutral-600 opacity-0")}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- DevOps Architecture Section --- */}
      <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <Workflow className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">DevOps & CI/CD Pipeline</h2>
          </div>
          <button 
            onClick={() => setIsPlayingCicd(!isPlayingCicd)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-white rounded-lg transition-colors border border-neutral-700"
          >
            {isPlayingCicd ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
        </div>
        
        <div className="p-8 md:p-12 overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between relative">
            
            {/* The animated connection line */}
            <div className="absolute top-1/2 left-10 right-10 h-1 bg-neutral-800 -translate-y-1/2 z-0 hidden md:block">
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
                      isPast   ? "border-cyan-500/50 bg-neutral-900" :
                                 "border-neutral-800 bg-neutral-900 opacity-50 grayscale"
                    )}
                  >
                    <Icon className={clsx("w-8 h-8 transition-colors duration-500", isActive ? step.color : (isPast ? "text-cyan-500/80" : "text-neutral-500"))} />
                  </div>
                  
                  <div className="mt-6 text-center h-24">
                    <span className={clsx(
                      "text-xs font-bold uppercase tracking-wider mb-1 block transition-colors",
                      isActive ? step.color : "text-neutral-600"
                    )}>
                      Step {step.id}
                    </span>
                    <h3 className={clsx("font-bold text-sm mb-1 transition-colors", isActive ? "text-white" : "text-neutral-400")}>
                      {step.title}
                    </h3>
                    <p className={clsx("text-xs leading-relaxed transition-opacity", isActive ? "text-neutral-300 opacity-100" : "text-neutral-600 opacity-0")}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Underlying Stack Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
          <Database className="w-8 h-8 text-neutral-400 mb-4" />
          <h3 className="text-white font-bold mb-2">Backend Services</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Bun + Express + TypeScript running on an Azure Linux VM. Managed reliably by PM2/Docker.
          </p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
          <Server className="w-8 h-8 text-neutral-400 mb-4" />
          <h3 className="text-white font-bold mb-2">Databases</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Drizzle ORM interacting with PostgreSQL for persistent data (Reviews, Users, Repositories), and Redis for rate-limiting & BullMQ queueing.
          </p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
          <Workflow className="w-8 h-8 text-neutral-400 mb-4" />
          <h3 className="text-white font-bold mb-2">AI Integration</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            GPT-4o / advanced models systematically evaluate code diffs for logical bugs, stylistic issues, and security vulnerabilities.
          </p>
        </div>
      </div>
      
    </div>
  );
}
