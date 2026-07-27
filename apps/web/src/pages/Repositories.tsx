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
      {/* Toolbar */}
      <div className="flex items-center justify-between h-10 px-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Repositories</span>
          <span className="text-[10px] code-font" style={{ color: "var(--border)" }}>{repos.length} installed</span>
        </div>
        <button onClick={load} className="p-1 transition-colors" style={{ color: "var(--text-muted)" }} aria-label="Refresh"><RefreshCw size={12} /></button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ background: "rgba(248,113,113,0.05)", borderColor: "var(--border-subtle)" }}>
          <AlertCircle size={12} style={{ color: "var(--status-critical)" }} />
          <span className="text-[10px]" style={{ color: "var(--status-critical)" }}>{error}</span>
        </div>
      )}

      {/* Repo grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 w-full rounded-lg" />)}
          </div>
        ) : repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <GitBranch size={16} style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>No repositories</p>
            <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>Install the GitHub App on your repos first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {repos.map(repo => (
              <div key={repo.id} className="panel p-4 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                    <GitBranch size={12} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{repo.fullName}</p>
                    <p className="text-[9px] code-font mt-0.5" style={{ color: "var(--text-muted)" }}>Installed {new Date(repo.installedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-ok)" }} />
                    <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--status-ok)" }}>Active</span>
                  </div>
                  <span className="text-[9px] code-font tabular-nums" style={{ color: "var(--text-muted)" }}>{repo.reviewCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
