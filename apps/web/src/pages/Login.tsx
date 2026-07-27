import { useAuth } from "../AuthContext";
import { LogIn, Shield, Zap, Brain } from "lucide-react";

export function Login() {
  const { loginWithGitHub, isLoading } = useAuth();

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Left: product showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "var(--accent)" }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Code Review Bot</span>
          </div>

          <h1 className="text-2xl xl:text-3xl font-bold leading-tight mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            AI-powered code review<br />for GitHub
          </h1>
          <p className="text-xs max-w-md leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
            Multi-model AI reviews every PR — flags bugs, suggests improvements, and posts inline comments. 
            Type <code className="code-font px-1 py-0.5 rounded text-[10px]" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>/accept</code> to apply suggestions instantly.
          </p>

          <div className="space-y-3 max-w-sm">
            {[
              { icon: Brain, label: "Multi-model AI", desc: "OpenAI, Anthropic, Google — auto-selected per repo" },
              { icon: Shield, label: "Smart detection", desc: "Bugs, security issues, performance, style" },
              { icon: Zap, label: "Interactive commands", desc: "/accept, /explain — right in the PR" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}>
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                  <Icon size={13} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: login panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-secondary)" }}>
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-2 mb-8 justify-center lg:hidden">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Code Review</span>
          </div>

          <div className="space-y-4">
            <div className="text-center lg:text-left">
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Sign in</h2>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Connect your GitHub account to get started.</p>
            </div>

            <button
              onClick={loginWithGitHub}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40"
              style={{ 
                background: isLoading ? "var(--bg-card)" : "var(--accent)", 
                color: isLoading ? "var(--text-muted)" : "var(--bg-primary)", 
                borderColor: isLoading ? "var(--border)" : "var(--accent)",
              }}
            >
              <LogIn size={14} />
              {isLoading ? "Connecting…" : "Continue with GitHub"}
            </button>

            <div className="text-center">
              <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                By continuing, you agree to our terms of service.
              </p>
            </div>
          </div>

          <div className="mt-8 p-3 rounded-lg border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--status-critical)" }} />
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--status-warn)" }} />
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--status-ok)" }} />
            </div>
            <div className="space-y-0.5 text-[9px] code-font" style={{ color: "var(--text-muted)" }}>
              <p><span style={{ color: "var(--accent)" }}>$</span> code-review-bot status</p>
              <p>→ AI engine: <span style={{ color: "var(--status-ok)" }}>ready</span></p>
              <p>→ Models: <span style={{ color: "var(--text-secondary)" }}>OpenAI · Anthropic · Google</span></p>
              <p>→ Reviews today: <span style={{ color: "var(--text-secondary)" }}>0</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
