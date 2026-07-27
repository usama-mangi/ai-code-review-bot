import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient, type ReviewDetail as ReviewDetailType, type Comment } from "../api/client";
import { format } from "date-fns";
import { ArrowLeft, GitPullRequest, ExternalLink, FileCode, AlertTriangle, Shield, Lightbulb, Palette, Info, AlertCircle, Search, X } from "lucide-react";
import clsx from "clsx";

const SEVERITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  bug: { label: "Bug", icon: <AlertTriangle size={11} />, badgeClass: "badge-bug" },
  security: { label: "Security", icon: <Shield size={11} />, badgeClass: "badge-security" },
  improvement: { label: "Improve", icon: <Lightbulb size={11} />, badgeClass: "badge-improvement" },
  style: { label: "Style", icon: <Palette size={11} />, badgeClass: "badge-style" },
  info: { label: "Info", icon: <Info size={11} />, badgeClass: "badge-info" },
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
      <div className="p-5 space-y-3">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(248,113,113,0.1)" }}>
          <AlertCircle size={22} style={{ color: "var(--status-critical)" }} />
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Review not found</p>
        <p className="text-xs text-center max-w-xs mb-4" style={{ color: "var(--text-muted)" }}>
          {error ?? "This review doesn't exist or you don't have permission to view it."}
        </p>
        <Link to="/reviews" className="btn-primary gap-1.5">
          <ArrowLeft size={12} /> Back to History
        </Link>
      </div>
    );
  }

  const severityCounts = review.comments.reduce<Record<string, number>>((acc, c) => {
    acc[c.severity] = (acc[c.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-5 space-y-4">
      {/* Back */}
      <Link to="/reviews" className="btn-ghost inline-flex text-[11px]">
        <ArrowLeft size={12} /> Back to History
      </Link>

      {/* PR Header */}
      <div className="panel">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                <GitPullRequest size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h1 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {review.prTitle ?? `PR #${review.prNumber}`}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
                    {review.repoFullName}
                  </span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    by {review.prAuthor}
                  </span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
                    {review.commitSha.slice(0, 8)}
                  </span>
                  <span className={`badge-${review.status}`}>{review.status}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {review.prUrl && (
                <a href={review.prUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-[11px]">
                  View PR <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Summary */}
          {review.summary && (
            <div className="mt-3 p-3 rounded-md" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                AI Summary
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.summary}</p>
            </div>
          )}

          {/* Severity breakdown */}
          {Object.keys(severityCounts).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
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
          <div className="flex gap-4 mt-3 text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
            <span>{review.filesChanged} files</span>
            <span>{review.comments.length} comments</span>
            <span>{format(new Date(review.createdAt), "MMM d, yyyy HH:mm")}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {review.comments.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
          {/* File sidebar */}
          <div className="panel xl:col-span-1 p-2 h-fit">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5" style={{ color: "var(--text-muted)" }}>
              Files ({files.length})
            </p>
            <button
              onClick={() => setActiveFile(null)}
              className={clsx(
                "w-full text-left rounded px-2 py-1.5 text-[11px] transition-colors flex items-center justify-between gap-1.5",
              )}
              style={activeFile === null ? 
                { background: "var(--accent-dim)", color: "var(--accent)" } : 
                { color: "var(--text-secondary)" }
              }
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <FileCode size={11} className="flex-shrink-0" />
                <span>All files</span>
              </span>
              <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
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
                    "w-full text-left rounded px-2 py-1.5 text-[11px] transition-colors flex items-center justify-between gap-1.5",
                  )}
                  style={activeFile === file ? 
                    { background: "var(--accent-dim)", color: "var(--accent)" } : 
                    { color: "var(--text-secondary)" }
                  }
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <FileCode size={11} className="flex-shrink-0" />
                    <span className="truncate code-font">{file.split("/").pop()}</span>
                  </span>
                  <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
                    {fileComments.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Comments */}
          <div className="xl:col-span-3 space-y-2">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {activeFile && (
                <div className="flex items-center gap-1.5 px-1">
                  <FileCode size={12} style={{ color: "var(--accent)" }} />
                  <span className="text-[11px] code-font" style={{ color: "var(--text-primary)" }}>{activeFile}</span>
                </div>
              )}
              <div className="flex-1 sm:ml-auto flex items-center gap-2">
                <div className="relative flex-1 max-w-[200px]">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-6 py-1.5 text-[11px] rounded-md border bg-[var(--bg-secondary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                    aria-label="Search comments"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Clear search"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Severity chips */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveSeverity(null)}
                className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors"
                style={activeSeverity === null ? 
                  { background: "var(--accent-dim)", color: "var(--accent)" } : 
                  { color: "var(--text-muted)" }
                }
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
                      "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors",
                      activeSeverity === sev ? cfg.badgeClass : ""
                    )}
                    style={activeSeverity !== sev ? { color: "var(--text-muted)" } : undefined}
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Results count */}
            {(searchQuery || activeSeverity) && (
              <p className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
                {filteredComments.length} results
              </p>
            )}

            {/* Comments */}
            {filteredComments.length > 0 ? (
              filteredComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>No matching comments</p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="panel flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(52,211,153,0.1)" }}>
            <span className="text-lg">✓</span>
          </div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Looks clean</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>No issues found in this pull request.</p>
        </div>
      )}
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const cfg = SEVERITY_CONFIG[comment.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={cfg.badgeClass}>
          {cfg.icon} {cfg.label}
        </span>
        {comment.lineNumber && (
          <span className="text-[10px] code-font px-1.5 py-0.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
            L{comment.lineNumber}
          </span>
        )}
        <span className="text-[10px] code-font truncate ml-auto" style={{ color: "var(--text-muted)" }}>
          {comment.filePath}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {comment.body}
      </p>
    </div>
  );
}
