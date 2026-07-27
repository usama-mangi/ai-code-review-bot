import { useEffect, useState } from "react";
import { apiClient, type Repo } from "../api/client";
import { GitBranch, RefreshCw, AlertCircle } from "lucide-react";

export function Repositories() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError(null);
    apiClient.getRepos()
      .then(setRepos)
      .catch(() => setError("Failed to load repositories."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between h-14 px-6 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Repositories</span>
          <span className="text-sm code-font" style={{ color: "var(--text-muted)" }}>{repos.length} installed</span>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors" style={{ color: "var(--text-muted)" }} aria-label="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ background: "rgba(248,113,113,0.05)", borderColor: "var(--border-subtle)" }}>
          <AlertCircle size={16} style={{ color: "var(--status-critical)" }} />
          <span className="text-sm" style={{ color: "var(--status-critical)" }}>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-36 w-full" />)}
          </div>
        ) : repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <GitBranch size={24} style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No repositories</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Install the GitHub App on your repos first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <div key={repo.id} className="panel p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                    <GitBranch size={18} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{repo.fullName}</p>
                    <p className="text-sm code-font mt-1" style={{ color: "var(--text-muted)" }}>Installed {new Date(repo.installedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: "var(--status-ok)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--status-ok)" }}>Active</span>
                  </div>
                  <span className="text-sm code-font tabular-nums" style={{ color: "var(--text-muted)" }}>{repo.reviewCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
