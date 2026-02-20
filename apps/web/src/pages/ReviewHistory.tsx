import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, type Review, type PaginatedResponse } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export function ReviewHistory() {
  const [data, setData] = useState<PaginatedResponse<Review> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.getReviews(page, 20).then(setData).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Review History</h1>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm mt-1">
          All pull requests reviewed by the bot
        </p>
      </div>

      <div className="card overflow-hidden p-0">
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

        {!loading && data?.data.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <p style={{ color: "var(--text-muted)" }}>No reviews yet. Install the bot and open a PR!</p>
          </div>
        )}
      </div>

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
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
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
        <Link to={`/reviews/${review.id}`} className="flex items-center gap-2 group-hover:text-brand-300 transition-colors">
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
            <a href={review.prUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink size={12} style={{ color: "var(--text-muted)" }} className="hover:text-brand-400 transition-colors" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}
