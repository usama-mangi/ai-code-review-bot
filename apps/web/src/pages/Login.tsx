import { useAuth } from "../AuthContext";
import { LogIn, Shield, Zap, Brain } from "lucide-react";

export function Login() {
  const { loginWithGitHub, isLoading } = useAuth();

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Left: product showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-8 blur-3xl" style={{ background: "var(--accent)" }} />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Code Review Bot</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            AI-powered code review for GitHub
          </h1>
          <p className="text-base leading-relaxed mb-12" style={{ color: "var(--text-muted)" }}>
            Multi-model AI reviews every PR — flags bugs, suggests improvements, and posts inline comments.
            Type <code className="code-font px-2 py-0.5 rounded text-sm" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>/accept</code> to apply suggestions instantly.
          </p>

          <div className="space-y-4">
            {[
              { icon: Brain, label: "Multi-model AI", desc: "OpenAI, Anthropic, Google — auto-selected per repo" },
              { icon: Shield, label: "Smart detection", desc: "Bugs, security issues, performance, style" },
              { icon: Zap, label: "Interactive commands", desc: "/accept, /explain — right in the PR" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                  <Icon size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: login */}
      <div className="flex-1 flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-secondary)" }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 justify-center lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Code Review</span>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Sign in</h2>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>Connect your GitHub account to get started.</p>
            </div>

            <button
              onClick={loginWithGitHub}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border text-base font-semibold transition-all disabled:opacity-40"
              style={{
                background: isLoading ? "var(--bg-card)" : "var(--accent)",
                color: isLoading ? "var(--text-muted)" : "var(--bg-primary)",
                borderColor: isLoading ? "var(--border)" : "var(--accent)",
              }}
            >
              <LogIn size={18} />
              {isLoading ? "Connecting…" : "Continue with GitHub"}
            </button>

            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              By continuing, you agree to our terms of service.
            </p>
          </div>

          <div className="mt-10 p-4 rounded-xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--status-critical)" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--status-warn)" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--status-ok)" }} />
            </div>
            <div className="space-y-1 text-sm code-font" style={{ color: "var(--text-muted)" }}>
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
