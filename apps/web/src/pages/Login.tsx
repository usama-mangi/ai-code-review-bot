import { Github, Bot } from "lucide-react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

export function Login() {
  const { user, loginWithGitHub, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <Bot className="w-8 h-8 text-blue-400" />
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text mb-3">
          AI Code Review Bot
        </h1>
        
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Automated intelligent pull request reviews powered by AI directly integrated with your GitHub workflow.
        </p>

        <button
          onClick={loginWithGitHub}
          className="w-full relative group inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#24292e] text-white rounded-xl font-medium tracking-wide shadow-lg hover:bg-[#2f363d] hover:-translate-y-0.5 transition-all duration-200"
        >
          <Github className="w-5 h-5" />
          <span>Continue with GitHub</span>
        </button>

        <p className="mt-8 text-sm text-neutral-500">
          By continuing, you agree to connect your GitHub account.
        </p>
      </div>
    </div>
  );
}
