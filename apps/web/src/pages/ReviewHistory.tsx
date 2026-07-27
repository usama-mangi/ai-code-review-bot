import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, type Review } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  completed: { color: "var(--status-ok)", bg: "rgba(76,175,80,0.1)", label: "OK" },
  pending: { color: "var(--status-warn)", bg: "rgba(255,193,7,0.1)", label: "PEND" },
  processing: { color: "var(--accent)", bg: "var(--accent-dim)", label: "PROC" },
  failed: { color: "var(--status-critical)", bg: "rgba(248,113,113,0.1)", label: "FAIL" },
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
    apiClient.getReviews(p, 12)
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
      <div className="flex items-center justify-between h-10 px-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Reviews</span>
          <span className="text-[10px] code-font" style={{ color: "var(--border)" }}>#{page}/{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          {["all", "completed", "pending", "processing", "failed"].map(st => (
            <button key={st}
              onClick={() => setStatusFilter(st === "all" ? null : st)}
              className={clsx("text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded transition-colors",
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
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ background: "rgba(248,113,113,0.05)", borderColor: "var(--border-subtle)" }}>
          <AlertCircle size={12} style={{ color: "var(--status-critical)" }} />
          <span className="text-[10px]" style={{ color: "var(--status-critical)" }}>{error}</span>
          <button onClick={() => load(page)} className="text-[10px] underline ml-auto" style={{ color: "var(--text-muted)" }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 space-y-1">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-10 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <GitPullRequest size={16} style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>No reviews found</p>
            <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              {statusFilter ? `No "${statusFilter}" reviews yet` : "Open a PR to start"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  {["PR", "Status", "Files", "Repo", "Created"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const status = s(r.status);
                  return (
                    <tr key={r.id} className="border-b hover:bg-[var(--bg-card-hover)] transition-colors" style={{ borderColor: "var(--border-subtle)" }}>
                      <td className="px-3 py-2">
                        <Link to={`/reviews/${r.id}`} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                            <GitPullRequest size={10} style={{ color: "var(--accent)" }} />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{r.prTitle ?? `PR #${r.prNumber}`}</p>
                            <p className="text-[9px] code-font" style={{ color: "var(--text-muted)" }}>#{r.prNumber}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color: status.color, background: status.bg }}>
                          <span className="w-1 h-1 rounded-full" style={{ background: status.color }} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-semibold tabular-nums" style={{ fontFamily: "IBM Plex Mono", color: "var(--text-primary)" }}>{r.filesChanged ?? "—"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] code-font" style={{ color: "var(--text-muted)" }}>{r.repoFullName}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] code-font" style={{ color: "var(--text-muted)" }}>{format(new Date(r.createdAt), "MMM d, HH:mm")}</span>
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
                  <Link key={r.id} to={`/reviews/${r.id}`} className="block px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--accent-dim)" }}>
                        <GitPullRequest size={10} style={{ color: "var(--accent)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.prTitle ?? `PR #${r.prNumber}`}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded"
                            style={{ color: status.color, background: status.bg }}>
                            <span className="w-0.5 h-0.5 rounded-full" style={{ background: status.color }} />
                            {status.label}
                          </span>
                          <span className="text-[9px] code-font" style={{ color: "var(--text-muted)" }}>{r.filesChanged ?? 0} files</span>
                        </div>
                        <p className="text-[9px] code-font mt-1" style={{ color: "var(--text-muted)" }}>{r.repoFullName} · {format(new Date(r.createdAt), "MMM d")}</p>
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
        <div className="flex items-center justify-center gap-2 h-10 border-t flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1 disabled:opacity-20" style={{ color: "var(--text-muted)" }}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] code-font tabular-nums" style={{ color: "var(--text-primary)" }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1 disabled:opacity-20" style={{ color: "var(--text-muted)" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
