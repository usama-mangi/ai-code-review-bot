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
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Couldn't load reviews</h2>
        <p className="text-sm text-center max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
        <button onClick={() => fetchReviews(page)} className="btn-primary gap-2">
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Review History</h1>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm mt-1">
          All pull requests reviewed by the bot
        </p>
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden p-0 hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {["Pull Request", "Repository", "Author", "Status", "Comments", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
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
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-full rounded" />
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
      <div className="md:hidden space-y-3">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="card space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            ))
          : data?.data.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
      </div>

      {!loading && data?.data.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/10 flex items-center justify-center mb-4">
            <GitPullRequest size={24} className="text-brand-400" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No reviews yet</p>
          <p className="text-xs max-w-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Install the GitHub App on a repository and open a pull request. The bot will review it automatically.
          </p>
          <Link to="/repositories" className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors">
            Set up repositories →
          </Link>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewTableRow({ review }: { review: Review }) {
  const statusClass = `badge-${review.status}`;
  return (
    <tr
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      className="transition-colors hover:bg-[var(--bg-card-hover)] group"
    >
      <td className="px-4 py-3">
        <Link to={`/reviews/${review.id}`} className="flex items-center gap-2 group-hover:text-brand-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded">
          <GitPullRequest size={14} className="text-brand-400 flex-shrink-0" />
          <span className="font-medium text-white truncate max-w-[220px]">
            {review.prTitle ?? `PR #${review.prNumber}`}
          </span>
          <span style={{ color: "var(--text-muted)" }}>#{review.prNumber}</span>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="code-font text-xs" style={{ color: "var(--text-secondary)" }}>
          {review.repoFullName ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span style={{ color: "var(--text-secondary)" }}>{review.prAuthor ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <span className={clsx(statusClass, review.status === "processing" && "animate-pulse")}>
          {review.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span style={{ color: "var(--text-secondary)" }}>{review.filesChanged ?? "—"} files</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--text-muted)" }} className="text-xs">
            {format(new Date(review.createdAt), "MMM d, HH:mm")}
          </span>
          {review.prUrl && (
            <a href={review.prUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open PR on GitHub">
              <ExternalLink size={12} style={{ color: "var(--text-muted)" }} className="hover:text-brand-400 transition-colors" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const statusClass = `badge-${review.status}`;
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="card block focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitPullRequest size={14} className="text-brand-400 flex-shrink-0" />
          <span className="font-medium text-white text-sm truncate">
            {review.prTitle ?? `PR #${review.prNumber}`}
          </span>
        </div>
        <span className={clsx(statusClass, "flex-shrink-0")}>{review.status}</span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="code-font">{review.repoFullName}</span>
        <span>·</span>
        <span>{review.prAuthor}</span>
        <span>·</span>
        <span>{format(new Date(review.createdAt), "MMM d, HH:mm")}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {review.filesChanged ?? "—"} files changed
        </span>
        {review.prUrl && (
          <a
            href={review.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-brand-400 hover:text-brand-300 transition-colors"
            aria-label="Open PR on GitHub"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </Link>
  );
}
