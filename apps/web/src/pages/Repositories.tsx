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
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-5">
      <div className="mb-6">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Repositories</h1>
          </div>
          
          <a 
            href="https://github.com/apps/code-qa-review-bot" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors border"
            style={{ background: "var(--accent)", color: "var(--bg-primary)", borderColor: "var(--accent)" }}
          >
            Install App <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Manage which repositories the bot monitors. It will only review pull requests for enabled repos.
        </p>
        
        {error && (
          <div className="mt-3 p-3 border rounded-md flex items-start gap-2.5" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)", color: "var(--status-critical)" }}>
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs">{error}</p>
              <button
                onClick={fetchRepositories}
                className="mt-1.5 text-[10px] font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        {repositories.length === 0 && !error ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--accent-dim)" }}>
              <GitMerge size={18} style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No repositories found</p>
            <p className="text-[11px] max-w-xs mb-4" style={{ color: "var(--text-muted)" }}>
              You haven't installed the GitHub App on any repositories yet.
            </p>
            <a 
              href="https://github.com/apps/code-qa-review-bot" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md"
              style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
            >
              Install on GitHub
            </a>
          </div>
        ) : (
          <ul>
            {repositories.map((repo, i) => (
              <li 
                key={repo.githubId} 
                className="flex items-center justify-between px-4 py-3 transition-colors"
                style={{ borderBottom: i < repositories.length - 1 ? "1px solid var(--border-subtle)" : undefined }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-md"
                    style={{ 
                      background: repo.enabled ? "var(--accent-dim)" : "var(--bg-secondary)",
                      color: repo.enabled ? "var(--accent)" : "var(--text-muted)" 
                    }}
                  >
                    <GitMerge size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold" style={{ color: repo.enabled ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {repo.fullName}
                    </h3>
                    <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                      <Shield size={10} style={{ color: repo.enabled ? "var(--status-ok)" : undefined }} />
                      {repo.enabled ? "Active" : "Disabled"}
                    </p>
                  </div>
                </div>

                <button
                  role="switch"
                  aria-checked={repo.enabled}
                  aria-label={`${repo.enabled ? "Disable" : "Enable"} code reviews for ${repo.fullName}`}
                  onClick={() => toggleRepository(repo)}
                  className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                  style={{ 
                    background: repo.enabled ? "var(--accent)" : "var(--border)",
                    ["--tw-ring-offset-color" as any]: "var(--bg-card)"
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      repo.enabled ? "translate-x-4" : "translate-x-0"
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
