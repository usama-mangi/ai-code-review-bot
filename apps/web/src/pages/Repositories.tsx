import { useState, useEffect } from "react";
import { api } from "../AuthContext";
import { Settings, Shield, ShieldAlert, GitMerge, Loader2, ExternalLink } from "lucide-react";

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
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-400" />
            <h1 className="text-3xl font-bold text-white">
              Repositories
            </h1>
          </div>
          
          <a 
            href="https://github.com/apps/code-qa-review-bot" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-brand-500/20"
            style={{ background: "var(--accent)" }}
          >
            Install App <ExternalLink size={15} />
          </a>
        </div>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage which repositories the AI Code Review Bot monitors. The bot will only review pull requests for enabled repositories.
        </p>
        
        {error && (
          <div className="mt-4 p-4 border border-red-500/30 bg-red-500/10 rounded-xl flex items-start gap-3 text-red-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchRepositories}
                className="mt-2 text-xs font-medium text-red-300 hover:text-red-200 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        {repositories.length === 0 && !error ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/10 flex items-center justify-center mb-4">
              <GitMerge size={24} className="text-brand-400" />
            </div>
            <p className="text-lg font-medium text-white">No repositories found</p>
            <p className="text-sm mt-2 max-w-sm" style={{ color: "var(--text-muted)" }}>
              You haven't installed the GitHub App on any repositories yet, or you don't have access to them.
            </p>
            <a 
              href="https://github.com/apps/code-qa-review-bot" 
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
              style={{ background: "var(--accent)" }}
            >
              Install App on GitHub
            </a>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {repositories.map((repo) => (
              <li key={repo.githubId} className="flex items-center justify-between p-4 sm:p-5 transition-colors" style={{ ["--hover-bg" as any]: "var(--bg-card-hover)" }}>
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ 
                      background: repo.enabled ? "var(--accent-glow)" : "var(--bg-secondary)", 
                      borderColor: repo.enabled ? "rgba(99, 102, 241, 0.2)" : "var(--border-subtle)",
                      color: repo.enabled ? "var(--accent)" : "var(--text-muted)" 
                    }}
                  >
                    <GitMerge size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: repo.enabled ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {repo.fullName}
                    </h3>
                    <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--text-muted)" }}>
                      <Shield size={12} className={repo.enabled ? "text-green-400" : ""} style={!repo.enabled ? { color: "var(--text-muted)" } : undefined} />
                      {repo.enabled ? "Active code reviews enabled" : "Code reviews disabled"}
                    </p>
                  </div>
                </div>

                <button
                  role="switch"
                  aria-checked={repo.enabled}
                  aria-label={`${repo.enabled ? "Disable" : "Enable"} code reviews for ${repo.fullName}`}
                  onClick={() => toggleRepository(repo)}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  style={{ 
                    background: repo.enabled ? "var(--accent)" : "var(--border)",
                    ["--tw-ring-offset-color" as any]: "var(--bg-card)"
                  }}
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
