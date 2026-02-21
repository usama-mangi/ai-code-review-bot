import { useState, useEffect } from "react";
import { api } from "../AuthContext";
import { Settings, Shield, ShieldAlert, GitMerge, Loader2 } from "lucide-react";

interface Repository {
  githubId: number;
  fullName: string;
  installationId: number;
  enabled: boolean;
}

export function Repositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<Repository[]>("/config/repositories");
      setRepositories(res.data);
    } catch (err: any) {
      console.error("Failed to fetch repositories:", err);
      // If unauthorized, it could be the token is missing
      if (err.response?.status === 401) {
        setError("Your GitHub session has expired or is missing permissions. Please log out and back in.");
      } else {
        setError("Failed to load repositories. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRepository = async (repo: Repository) => {
    try {
      // Optimistic update
      setRepositories((current) =>
        current.map((r) =>
          r.githubId === repo.githubId ? { ...r, enabled: !r.enabled } : r
        )
      );

      await api.post(`/config/repositories/${repo.githubId}/toggle`, {
        enabled: !repo.enabled,
        fullName: repo.fullName,
        installationId: repo.installationId,
      });
    } catch (err) {
      console.error("Failed to toggle repository:", err);
      // Revert on failure
      setRepositories((current) =>
        current.map((r) =>
          r.githubId === repo.githubId ? { ...r, enabled: repo.enabled } : r
        )
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            Repositories
          </h1>
        </div>
        <p className="text-neutral-400">
          Manage which repositories the AI Code Review Bot monitors. The bot will only review pull requests for enabled repositories.
        </p>
        
        {error && (
          <div className="mt-4 p-4 border border-red-500/30 bg-red-500/10 rounded-xl flex items-start gap-3 text-red-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {repositories.length === 0 && !error ? (
          <div className="p-12 text-center text-neutral-400 flex flex-col items-center">
            <GitMerge className="w-12 h-12 mb-4 text-neutral-600" />
            <p className="text-lg font-medium text-neutral-300">No repositories found</p>
            <p className="text-sm mt-2 max-w-sm">
              You haven't installed the GitHub App on any repositories yet, or you don't have access to them.
            </p>
            <a 
              href="https://github.com/apps/ai-code-review-bot-2/installations/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Install App on GitHub
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {repositories.map((repo) => (
              <li key={repo.githubId} className="flex items-center justify-between p-4 sm:p-5 hover:bg-neutral-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${repo.enabled ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                    <GitMerge size={20} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${repo.enabled ? 'text-neutral-200' : 'text-neutral-400'}`}>
                      {repo.fullName}
                    </h3>
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                      <Shield size={12} className={repo.enabled ? "text-green-400" : "text-neutral-600"} />
                      {repo.enabled ? "Active code reviews enabled" : "Code reviews disabled"}
                    </p>
                  </div>
                </div>

                <button
                  role="switch"
                  aria-checked={repo.enabled}
                  onClick={() => toggleRepository(repo)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                    repo.enabled ? "bg-brand-500" : "bg-neutral-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      repo.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
