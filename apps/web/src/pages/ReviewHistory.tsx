import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, type Review } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  completed: { color: "var(--status-ok)", bg: "rgba(76,175,80,0.12)", label: "Completed" },
  pending: { color: "var(--status-warn)", bg: "rgba(255,193,7,0.12)", label: "Pending" },
  processing: { color: "var(--accent)", bg: "var(--accent-dim)", label: "Processing" },
  failed: { color: "var(--status-critical)", bg: "rgba(248,113,113,0.12)", label: "Failed" },
};

export function ReviewHistory() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const load = (p: number) => {
    setLoading(true); setError(null);
    apiClient.getReviews(p, 15)
      .then(res => { setReviews(res.data); setTotalPages(res.pagination.pages); })
      .catch(() => setError("Failed to load reviews."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = statusFilter ? reviews.filter(r => r.status === statusFilter) : reviews;
  const s = (status: string) => STATUS[status] ?? STATUS.pending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between h-14 px-6 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Reviews</span>
          <span className="text-sm code-font" style={{ color: "var(--text-muted)" }}>Page {page} of {totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          {["all", "completed", "pending", "processing", "failed"].map(st => (
            <button key={st}
              onClick={() => { setStatusFilter(st === "all" ? null : st); setPage(1); }}
              className={clsx("text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
                (st === "all" && !statusFilter) || statusFilter === st
                  ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              style={((st === "all" && !statusFilter) || statusFilter === st) ? { background: "var(--accent-dim)" } : undefined}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ background: "rgba(248,113,113,0.05)", borderColor: "var(--border-subtle)" }}>
          <AlertCircle size={16} style={{ color: "var(--status-critical)" }} />
          <span className="text-sm" style={{ color: "var(--status-critical)" }}>{error}</span>
          <button onClick={() => load(page)} className="text-sm underline ml-auto" style={{ color: "var(--text-muted)" }}>Retry</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-6 space-y-2">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <GitPullRequest size={24} style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No reviews found</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {statusFilter ? `No "${statusFilter}" reviews yet` : "Open a PR to start reviewing"}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  {["Pull Request", "Status", "Files Changed", "Repository", "Created"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const status = s(r.status);
                  return (
                    <tr key={r.id} className="border-b hover:bg-[var(--bg-card-hover)] transition-colors" style={{ borderColor: "var(--border-subtle)" }}>
                      <td className="px-5 py-3">
                        <Link to={`/reviews/${r.id}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                            <GitPullRequest size={16} style={{ color: "var(--accent)" }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.prTitle ?? `PR #${r.prNumber}`}</p>
                            <p className="text-xs code-font" style={{ color: "var(--text-muted)" }}>#{r.prNumber}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="badge" style={{ color: status.color, background: status.bg }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold tabular-nums" style={{ fontFamily: "IBM Plex Mono", color: "var(--text-primary)" }}>
                          {r.filesChanged ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm code-font" style={{ color: "var(--text-muted)" }}>{r.repoFullName}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm code-font" style={{ color: "var(--text-muted)" }}>{format(new Date(r.createdAt), "MMM d, HH:mm")}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {filtered.map(r => {
                const status = s(r.status);
                return (
                  <Link key={r.id} to={`/reviews/${r.id}`} className="block px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                        <GitPullRequest size={16} style={{ color: "var(--accent)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.prTitle ?? `PR #${r.prNumber}`}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="badge text-xs" style={{ color: status.color, background: status.bg }}>
                            <span className="w-1 h-1 rounded-full" style={{ background: status.color }} />
                            {status.label}
                          </span>
                          <span className="text-xs code-font" style={{ color: "var(--text-muted)" }}>{r.filesChanged ?? 0} files</span>
                        </div>
                        <p className="text-xs code-font mt-1.5" style={{ color: "var(--text-muted)" }}>{r.repoFullName} · {format(new Date(r.createdAt), "MMM d")}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 h-14 border-t flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-1.5 rounded-lg disabled:opacity-20 hover:bg-[var(--bg-card)] transition-colors" style={{ color: "var(--text-muted)" }}>
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm code-font tabular-nums" style={{ color: "var(--text-primary)" }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="p-1.5 rounded-lg disabled:opacity-20 hover:bg-[var(--bg-card)] transition-colors" style={{ color: "var(--text-muted)" }}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
