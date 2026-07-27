import { Github } from "lucide-react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

export function Login() {
  const { user, loginWithGitHub, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-sm w-full p-8 rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-5 overflow-hidden" style={{ background: "var(--accent-dim)" }}>
            <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            CodeReview Bot
          </h1>
          
          <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            AI-powered pull request reviews integrated with your GitHub workflow.
          </p>

          <button
            onClick={loginWithGitHub}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-white text-xs font-semibold rounded-md transition-all duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            style={{ background: "#24292e", ["--tw-ring-offset-color" as any]: "var(--bg-card)" }}
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </button>

          <p className="mt-6 text-[10px]" style={{ color: "var(--text-muted)" }}>
            By continuing, you agree to connect your GitHub account.
          </p>
        </div>
      </div>
    </div>
  );
}
