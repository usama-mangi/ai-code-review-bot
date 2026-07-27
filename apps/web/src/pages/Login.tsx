import { Github } from "lucide-react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

export function Login() {
  const { user, loginWithGitHub, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen text-neutral-50 flex flex-col items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-md w-full p-8 rounded-2xl shadow-xl flex flex-col items-center text-center border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 overflow-hidden p-2" style={{ background: "var(--accent-glow)" }}>
          <img src="/favicon.png" alt="AI Code Review Bot Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          AI Code Review Bot
        </h1>
        
        <p className="mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Automated intelligent pull request reviews powered by AI directly integrated with your GitHub workflow.
        </p>

        <button
          onClick={loginWithGitHub}
          className="w-full relative group inline-flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl font-medium tracking-wide shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          style={{ background: "#24292e" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#2f363d"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#24292e"; }}
        >
          <Github className="w-5 h-5" />
          <span>Continue with GitHub</span>
        </button>

        <p className="mt-8 text-sm" style={{ color: "var(--text-muted)" }}>
          By continuing, you agree to connect your GitHub account.
        </p>
      </div>
    </div>
  );
}
