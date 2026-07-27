import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient, type ReviewDetail as ReviewDetailType, type Comment } from "../api/client";
import { format } from "date-fns";
import { ArrowLeft, GitPullRequest, ExternalLink, FileCode, AlertTriangle, Shield, Lightbulb, Palette, Info, AlertCircle, Search, X } from "lucide-react";
import clsx from "clsx";

const SEVERITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  bug: { label: "Bug", icon: <AlertTriangle size={12} />, badgeClass: "badge-bug" },
  security: { label: "Security", icon: <Shield size={12} />, badgeClass: "badge-security" },
  improvement: { label: "Improvement", icon: <Lightbulb size={12} />, badgeClass: "badge-improvement" },
  style: { label: "Style", icon: <Palette size={12} />, badgeClass: "badge-style" },
  info: { label: "Info", icon: <Info size={12} />, badgeClass: "badge-info" },
};

const SEVERITY_ORDER = ["bug", "security", "improvement", "style", "info"];

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiClient
      .getReview(parseInt(id))
      .then((r) => {
        setReview(r);
        const files = [...new Set(r.comments.map((c) => c.filePath))];
        if (files.length > 0) setActiveFile(files[0]);
      })
      .catch((err) => {
        console.error("Failed to load review:", err);
        setError("Failed to load review details. It may have been removed or you may not have access.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const files = useMemo(
    () => (review ? [...new Set(review.comments.map((c) => c.filePath))] : []),
    [review]
  );

  const filteredComments = useMemo(() => {
    if (!review) return [];
    return review.comments.filter((c) => {
      const matchesFile = activeFile ? c.filePath === activeFile : true;
      const matchesSeverity = activeSeverity ? c.severity === activeSeverity : true;
      const matchesSearch = searchQuery
        ? c.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.filePath.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesFile && matchesSeverity && matchesSearch;
    });
  }, [review, activeFile, activeSeverity, searchQuery]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Review not found</h2>
        <p className="text-sm text-center max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {error ?? "This review doesn't exist or you don't have permission to view it."}
        </p>
        <Link to="/reviews" className="btn-primary gap-2">
          <ArrowLeft size={14} /> Back to History
        </Link>
      </div>
    );
  }

  const severityCounts = review.comments.reduce<Record<string, number>>((acc, c) => {
    acc[c.severity] = (acc[c.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Back */}
      <Link to="/reviews" className="btn-ghost inline-flex text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg">
        <ArrowLeft size={14} /> Back to History
      </Link>

      {/* PR Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center mt-0.5">
              <GitPullRequest size={18} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {review.prTitle ?? `PR #${review.prNumber}`}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs code-font" style={{ color: "var(--text-muted)" }}>
                  {review.repoFullName}
                </span>
                <span style={{ color: "var(--border)" }}>·</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  by {review.prAuthor}
                </span>
                <span style={{ color: "var(--border)" }}>·</span>
                <span className="text-xs code-font" style={{ color: "var(--text-muted)" }}>
                  {review.commitSha.slice(0, 8)}
                </span>
                <span className={`badge-${review.status}`}>{review.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {review.prUrl && (
              <a href={review.prUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">
                View PR <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Summary */}
        {review.summary && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              AI Summary
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{review.summary}</p>
          </div>
        )}

        {/* Severity breakdown */}
        {Object.keys(severityCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(severityCounts).map(([sev, count]) => {
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <span key={sev} className={cfg.badgeClass}>
                  {cfg.icon} {cfg.label}: {count}
                </span>
              );
            })}
          </div>
        )}

        {/* Meta */}
        <div className="flex gap-4 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>📁 {review.filesChanged} files changed</span>
          <span>💬 {review.comments.length} comments</span>
          <span>🕐 {format(new Date(review.createdAt), "MMM d, yyyy HH:mm")}</span>
        </div>
      </div>

      {/* Comments Section */}
      {review.comments.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* File list sidebar */}
          <div className="card xl:col-span-1 p-3 space-y-1 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: "var(--text-muted)" }}>
              Files ({files.length})
            </p>
            <button
              onClick={() => setActiveFile(null)}
              className={clsx(
                "w-full text-left rounded-lg px-3 py-2 text-xs transition-all duration-150 flex items-center justify-between gap-2",
                activeFile === null
                  ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              )}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <FileCode size={12} className="flex-shrink-0" />
                <span>All files</span>
              </span>
              <span className="flex-shrink-0 text-xs rounded-full px-1.5 py-0.5" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                {review.comments.length}
              </span>
            </button>
            {files.map((file) => {
              const fileComments = review.comments.filter((c) => c.filePath === file);
              return (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={clsx(
                    "w-full text-left rounded-lg px-3 py-2 text-xs transition-all duration-150 flex items-center justify-between gap-2",
                    activeFile === file
                      ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                  )}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <FileCode size={12} className="flex-shrink-0" />
                    <span className="truncate code-font">{file.split("/").pop()}</span>
                  </span>
                  <span className="flex-shrink-0 text-xs rounded-full px-1.5 py-0.5" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                    {fileComments.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Comments for active file */}
          <div className="xl:col-span-3 space-y-3">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {activeFile && (
                <div className="flex items-center gap-2 px-1">
                  <FileCode size={14} className="text-brand-400" />
                  <span className="text-sm code-font text-white">{activeFile}</span>
                </div>
              )}
              <div className="flex-1 sm:ml-auto flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search comments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    style={{ borderColor: "var(--border)" }}
                    aria-label="Search comments"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Severity filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveSeverity(null)}
                className={clsx(
                  "px-2.5 py-1 text-xs font-medium rounded-full transition-all",
                  activeSeverity === null
                    ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                )}
              >
                All ({review.comments.filter((c) => activeFile ? c.filePath === activeFile : true).length})
              </button>
              {SEVERITY_ORDER.filter((sev) => severityCounts[sev] > 0).map((sev) => {
                const cfg = SEVERITY_CONFIG[sev];
                const count = activeFile
                  ? review.comments.filter((c) => c.filePath === activeFile && c.severity === sev).length
                  : severityCounts[sev];
                return (
                  <button
                    key={sev}
                    onClick={() => setActiveSeverity(activeSeverity === sev ? null : sev)}
                    className={clsx(
                      "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-all",
                      activeSeverity === sev
                        ? cfg.badgeClass
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                    )}
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Filtered results count */}
            {(searchQuery || activeSeverity) && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Showing {filteredComments.length} of {review.comments.filter((c) => activeFile ? c.filePath === activeFile : true).length} comments
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            )}

            {/* Comments */}
            {filteredComments.length > 0 ? (
              filteredComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm font-medium text-white">No matching comments</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Try adjusting your search or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <p className="font-medium text-white">Looks great!</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            No issues found in this pull request.
          </p>
        </div>
      )}
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const cfg = SEVERITY_CONFIG[comment.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div className="card animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <span className={cfg.badgeClass}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        {comment.lineNumber && (
          <span className="flex-shrink-0 text-xs code-font px-2 py-0.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            L{comment.lineNumber}
          </span>
        )}
        <span className="flex-shrink-0 text-xs code-font truncate ml-auto" style={{ color: "var(--text-muted)" }}>
          {comment.filePath}
        </span>
      </div>
      <p className="text-sm mt-3" style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}>
        {comment.body}
      </p>
    </div>
  );
}
