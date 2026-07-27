import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, type Review, type PaginatedResponse } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";

export function ReviewHistory() {
  const [data, setData] = useState<PaginatedResponse<Review> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = (p: number) => {
    setLoading(true);
    setError(null);
    apiClient
      .getReviews(p, 20)
      .then(setData)
      .catch((err) => {
        console.error("Failed to load reviews:", err);
        setError("Failed to load review history. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  if (error && !loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(248,113,113,0.1)" }}>
          <AlertCircle size={22} style={{ color: "var(--status-critical)" }} />
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Couldn't load reviews</p>
        <p className="text-xs text-center max-w-xs mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={() => fetchReviews(page)} className="btn-primary gap-1.5">
          <RefreshCw size={12} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Review History</h1>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>All pull requests reviewed by the bot</p>
      </div>

      {/* Desktop table */}
      <div className="panel overflow-hidden p-0 hidden md:block">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
              {["Pull Request", "Repository", "Author", "Status", "Files", "Date"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-2.5">
                        <div className="skeleton h-3.5 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.data.map((review) => (
                  <ReviewTableRow key={review.id} review={review} />
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="panel p-3 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            ))
          : data?.data.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
      </div>

      {!loading && data?.data.length === 0 && (
        <div className="panel flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--accent-dim)" }}>
            <GitPullRequest size={18} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No reviews yet</p>
          <p className="text-[11px] max-w-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Install the bot on a repository and open a pull request.
          </p>
          <Link to="/repositories" className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            Set up repos →
          </Link>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
            {(page - 1) * 20 + 1}–{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewTableRow({ review }: { review: Review }) {
  return (
    <tr
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      className="transition-colors"
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <td className="px-4 py-2.5">
        <Link to={`/reviews/${review.id}`} className="flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded">
          <GitPullRequest size={12} style={{ color: "var(--accent)" }} className="flex-shrink-0" />
          <span className="text-xs font-medium truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>
            {review.prTitle ?? `PR #${review.prNumber}`}
          </span>
          <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>#{review.prNumber}</span>
        </Link>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[11px] code-font" style={{ color: "var(--text-secondary)" }}>
          {review.repoFullName ?? "—"}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{review.prAuthor ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className={clsx(`badge-${review.status}`, review.status === "processing" && "animate-pulse")}>
          {review.status}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-xs code-font" style={{ color: "var(--text-muted)" }}>{review.filesChanged ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
            {format(new Date(review.createdAt), "MMM d, HH:mm")}
          </span>
          {review.prUrl && (
            <a href={review.prUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open PR on GitHub">
              <ExternalLink size={10} style={{ color: "var(--text-muted)" }} className="hover:text-[var(--accent)] transition-colors" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="panel block p-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitPullRequest size={12} style={{ color: "var(--accent)" }} className="flex-shrink-0" />
          <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {review.prTitle ?? `PR #${review.prNumber}`}
          </span>
        </div>
        <span className={`badge-${review.status} flex-shrink-0`}>{review.status}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
        <span>{review.repoFullName}</span>
        <span>·</span>
        <span>{review.prAuthor}</span>
        <span>·</span>
        <span>{format(new Date(review.createdAt), "MMM d, HH:mm")}</span>
      </div>
    </Link>
  );
}
