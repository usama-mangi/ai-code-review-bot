import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient, type ReviewDetail as ReviewDetailType, type Comment } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, ChevronLeft, FileCode } from "lucide-react";

const SEV: Record<string, { color: string; bg: string }> = {
  bug: { color: "var(--status-critical)", bg: "rgba(248,113,113,0.1)" },
  security: { color: "var(--status-warn)", bg: "rgba(251,146,60,0.1)" },
  improvement: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  style: { color: "var(--info)", bg: "rgba(96,165,250,0.1)" },
  info: { color: "var(--text-muted)", bg: "rgba(160,160,180,0.1)" },
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
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle size={28} style={{ color: "var(--status-critical)" }} />
      <p className="text-base" style={{ color: "var(--text-muted)" }}>{error}</p>
      <Link to="/reviews" className="text-sm underline" style={{ color: "var(--accent)" }}>← Back to reviews</Link>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 h-14 px-6 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <Link to="/reviews" className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" style={{ color: "var(--text-muted)" }} aria-label="Back">
          <ChevronLeft size={18} />
        </Link>
        {loading ? <div className="skeleton h-5 w-48" /> : data && (
          <>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <GitPullRequest size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium truncate" style={{ color: "var(--text-primary)" }}>{data.prTitle ?? `PR #${data.prNumber}`}</p>
              <p className="text-sm code-font" style={{ color: "var(--text-muted)" }}>{data.repoFullName} · {format(new Date(data.createdAt), "MMM d, HH:mm")}</p>
            </div>
            <span className={`badge-${data.status}`}>{data.status}</span>
            <span className="text-sm code-font tabular-nums" style={{ color: "var(--text-muted)" }}>
              {data.comments.length} comments · {fileGroups.length} files
            </span>
          </>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 p-6 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : data && (
        <div className="flex-1 flex overflow-hidden">
          {/* File tree sidebar */}
          <div className="w-64 border-r flex flex-col overflow-hidden flex-shrink-0 hidden md:flex" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
              <FileCode size={16} style={{ color: "var(--text-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Files</span>
              <span className="text-sm code-font ml-auto" style={{ color: "var(--text-muted)" }}>{fileGroups.length}</span>
            </div>
            <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => setActiveFile(null)}
                className="w-full text-left px-5 py-3 transition-colors"
                style={activeFile === null ? { background: "var(--accent-dim)" } : undefined}
              >
                <span className="text-sm font-medium" style={{ color: activeFile === null ? "var(--accent)" : "var(--text-primary)" }}>All files</span>
                <span className="text-sm code-font ml-2" style={{ color: "var(--text-muted)" }}>{data.comments.length}</span>
              </button>
              {fileGroups.map(fc => (
                <button key={fc.filePath}
                  onClick={() => setActiveFile(fc.filePath)}
                  className="w-full text-left px-5 py-3 transition-colors"
                  style={activeFile === fc.filePath ? { background: "var(--accent-dim)" } : undefined}
                >
                  <p className="text-sm font-medium truncate" style={{ color: activeFile === fc.filePath ? "var(--accent)" : "var(--text-primary)" }}>{fc.filePath}</p>
                  <p className="text-xs code-font mt-0.5" style={{ color: "var(--text-muted)" }}>{fc.comments.length} comments</p>
                </button>
              ))}
            </div>
          </div>

          {/* Comments area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Severity filter */}
            <div className="flex items-center gap-2 h-12 px-5 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-sm font-medium mr-1" style={{ color: "var(--text-muted)" }}>Filter:</span>
              {["all", "bug", "security", "improvement", "style", "info"].map(sev => (
                <button key={sev}
                  onClick={() => setSeverityFilter(sev === "all" ? null : sev)}
                  className="text-sm font-medium px-2.5 py-1 rounded-lg transition-colors"
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
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                    <FileCode size={20} style={{ color: "var(--accent)" }} />
                  </div>
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No comments</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No comments match the selected filter.</p>
                </div>
              ) : (
                visibleComments.map(c => {
                  const sev = SEV[c.severity] ?? SEV.info;
                  return (
                    <div key={c.id} className="px-6 py-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 self-stretch rounded-full flex-shrink-0 mt-1" style={{ background: sev.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="badge text-xs" style={{ color: sev.color, background: sev.bg }}>
                              {c.severity}
                            </span>
                            <span className="text-sm code-font" style={{ color: "var(--text-muted)" }}>{c.filePath}:{c.lineNumber}</span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.body}</p>
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
