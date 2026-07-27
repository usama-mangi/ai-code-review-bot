import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient, type ReviewDetail as ReviewDetailType, type Comment } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, ChevronLeft, FileCode } from "lucide-react";

const SEV: Record<string, { color: string; bg: string }> = {
  bug: { color: "var(--status-critical)", bg: "rgba(248,113,113,0.08)" },
  security: { color: "var(--status-warn)", bg: "rgba(251,146,60,0.08)" },
  improvement: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
  style: { color: "var(--info)", bg: "rgba(96,165,250,0.08)" },
  info: { color: "var(--text-muted)", bg: "rgba(160,160,180,0.08)" },
};

export function ReviewDetail() {
  const { reviewId } = useParams();
  const [data, setData] = useState<ReviewDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!reviewId) return;
    setLoading(true); setError(null);
    apiClient.getReview(Number(reviewId))
      .then(d => { setData(d); })
      .catch(() => setError("Failed to load review."))
      .finally(() => setLoading(false));
  }, [reviewId]);

  // Group comments by filePath
  const fileGroups = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Comment[]>();
    for (const c of data.comments) {
      const existing = map.get(c.filePath) ?? [];
      existing.push(c);
      map.set(c.filePath, existing);
    }
    return Array.from(map.entries()).map(([filePath, comments]) => ({ filePath, comments }));
  }, [data]);

  const visibleComments = useMemo(() => {
    let comments = data?.comments ?? [];
    if (activeFile) comments = comments.filter(c => c.filePath === activeFile);
    if (severityFilter) comments = comments.filter(c => c.severity === severityFilter);
    return comments;
  }, [data, activeFile, severityFilter]);

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <AlertCircle size={20} style={{ color: "var(--status-critical)" }} />
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{error}</p>
      <Link to="/reviews" className="text-[10px] underline" style={{ color: "var(--accent)" }}>← Back</Link>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 h-10 px-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <Link to="/reviews" className="p-0.5" style={{ color: "var(--text-muted)" }} aria-label="Back"><ChevronLeft size={14} /></Link>
        {loading ? <div className="skeleton h-4 w-40" /> : data && (
          <>
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <GitPullRequest size={10} style={{ color: "var(--accent)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{data.prTitle ?? `PR #${data.prNumber}`}</p>
              <p className="text-[9px] code-font" style={{ color: "var(--text-muted)" }}>{data.repoFullName} · {format(new Date(data.createdAt), "MMM d, HH:mm")}</p>
            </div>
            <span className={`badge-${data.status}`}>{data.status}</span>
            <span className="text-[10px] code-font tabular-nums" style={{ color: "var(--text-muted)" }}>{data.comments.length} comments · {fileGroups.length} files</span>
          </>
        )}
      </div>

      {/* Body: split pane */}
      {loading ? (
        <div className="flex-1 p-4 space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 w-full" />)}
        </div>
      ) : data && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: file tree */}
          <div className="w-56 border-r flex flex-col overflow-hidden flex-shrink-0 hidden md:flex" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: "var(--border-subtle)" }}>
              <FileCode size={10} style={{ color: "var(--text-muted)" }} />
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Files</span>
              <span className="text-[9px] code-font ml-auto" style={{ color: "var(--border)" }}>{fileGroups.length}</span>
            </div>
            <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => setActiveFile(null)}
                className="w-full text-left px-3 py-2 transition-colors"
                style={activeFile === null ? { background: "var(--accent-dim)" } : undefined}
              >
                <span className="text-[10px] font-medium" style={{ color: activeFile === null ? "var(--accent)" : "var(--text-primary)" }}>All files</span>
                <span className="text-[9px] code-font ml-1" style={{ color: "var(--text-muted)" }}>{data.comments.length}</span>
              </button>
              {fileGroups.map(fc => (
                <button key={fc.filePath}
                  onClick={() => setActiveFile(fc.filePath)}
                  className="w-full text-left px-3 py-2 transition-colors"
                  style={activeFile === fc.filePath ? { background: "var(--accent-dim)" } : undefined}
                >
                  <span className="text-[10px] font-medium truncate block" style={{ color: activeFile === fc.filePath ? "var(--accent)" : "var(--text-primary)" }}>{fc.filePath}</span>
                  <span className="text-[8px] code-font" style={{ color: "var(--border)" }}>{fc.comments.length} comments</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: comments signal strip */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Severity filter */}
            <div className="flex items-center gap-1 h-8 px-3 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-[9px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--text-muted)" }}>Filter</span>
              {["all", "bug", "security", "improvement", "style", "info"].map(sev => (
                <button key={sev}
                  onClick={() => setSeverityFilter(sev === "all" ? null : sev)}
                  className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-colors"
                  style={((sev === "all" && !severityFilter) || severityFilter === sev)
                    ? { color: sev === "all" ? "var(--accent)" : SEV[sev]?.color, background: sev === "all" ? "var(--accent-dim)" : SEV[sev]?.bg }
                    : { color: "var(--text-muted)" }
                  }
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {visibleComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                    <FileCode size={14} style={{ color: "var(--accent)" }} />
                  </div>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>No comments</p>
                  <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>This review has no comments for the selected filter.</p>
                </div>
              ) : (
                visibleComments.map(c => {
                  const sev = SEV[c.severity] ?? SEV.info;
                  return (
                    <div key={c.id} className="px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: sev.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: sev.color, background: sev.bg }}>
                              {c.severity}
                            </span>
                            <span className="text-[9px] code-font" style={{ color: "var(--text-muted)" }}>{c.filePath}:{c.lineNumber}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
