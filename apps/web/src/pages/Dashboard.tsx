import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { apiClient, type Stats, type Review, type PerformanceMetrics } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, RefreshCw } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  bug: "#f87171",
  security: "#fb923c",
  improvement: "#fbbf24",
  style: "#60a5fa",
  info: "#a0a0b4",
};

const SEVERITY_LABELS: Record<string, string> = {
  bug: "Bug",
  security: "Security",
  improvement: "Improve",
  style: "Style",
  info: "Info",
};

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.getStats(),
      apiClient.getPerformanceMetrics(),
      apiClient.getReviews(1, 5),
    ])
      .then(([s, p, r]) => {
        setStats(s);
        setPerfMetrics(p);
        setRecentReviews(r.data);
      })
      .catch((err) => {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pieData = stats
    ? Object.entries(stats.severityBreakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const chartData = stats?.reviewsOverTime.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    reviews: d.count,
  })) ?? [];

  if (error && !loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(248,113,113,0.1)" }}>
          <AlertCircle size={22} style={{ color: "var(--status-critical)" }} />
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Something went wrong</p>
        <p className="text-xs text-center max-w-xs mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={fetchData} className="btn-primary gap-1.5">
          <RefreshCw size={12} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Review activity overview</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-ok)" }} />
          System Online
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PrimaryStat
          label="Reviews"
          value={stats?.totalReviews ?? 0}
          loading={loading}
        />
        <PrimaryStat
          label="Comments"
          value={stats?.totalComments ?? 0}
          loading={loading}
        />
        <PrimaryStat
          label="Avg / PR"
          value={stats?.avgCommentsPerReview ?? 0}
          loading={loading}
          format={(v) => v.toFixed(1)}
        />
        <PrimaryStat
          label="Bugs"
          value={stats?.severityBreakdown?.bug ?? 0}
          loading={loading}
          accent
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Line Chart */}
        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <span>Reviews Over Time</span>
            <span style={{ color: "var(--border)" }}>30d</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="skeleton h-40 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontFamily: "IBM Plex Mono",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reviews"
                    stroke="var(--accent)"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: "var(--accent)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No review data yet"
                message="Install the bot on a repository and open a PR to start seeing activity."
                linkTo="/repositories"
                linkText="Set up repos"
              />
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="panel">
          <div className="panel-header">
            <span>Severity Distribution</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="skeleton h-40 w-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SEVERITY_COLORS[entry.name] ?? "var(--text-muted)"}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => SEVERITY_LABELS[value] ?? value}
                    wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Sans" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No comments yet"
                message="Comments from AI reviews will appear here."
              />
            )}
          </div>
        </div>
      </div>

      {/* Performance Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricStat
          label="Avg Review Time"
          value={perfMetrics?.avgReviewTime?.avgSeconds ?? 0}
          suffix="s"
          loading={loading}
        />
        <MetricStat
          label="Error Rate"
          value={perfMetrics?.errorRatePct ?? 0}
          suffix="%"
          loading={loading}
          warn={(perfMetrics?.errorRatePct ?? 0) > 5}
        />
        <MetricStat
          label="Failed"
          value={perfMetrics?.statusCounts?.failed ?? 0}
          loading={loading}
          warn={(perfMetrics?.statusCounts?.failed ?? 0) > 0}
        />
        <MetricStat
          label="Repos"
          value={perfMetrics?.byRepo?.length ?? 0}
          loading={loading}
        />
      </div>

      {/* Weekly Trend */}
      {perfMetrics && perfMetrics.weeklyTrend.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span>Weekly Trend</span>
            <span style={{ color: "var(--border)" }}>12w</span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={perfMetrics.weeklyTrend.map((d) => ({
                week: format(new Date(d.week), "MMM d"),
                reviews: d.count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="reviews" fill="var(--accent)" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      <div className="panel">
        <div className="panel-header">
          <span>Recent Reviews</span>
          <Link to="/reviews" className="text-[10px] font-semibold uppercase tracking-wider transition-colors" style={{ color: "var(--accent)" }}>
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full rounded" />
            ))}
          </div>
        ) : recentReviews.length > 0 ? (
          <div>
            {recentReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No reviews yet"
              message="Install the bot on a repository and open a PR."
              linkTo="/repositories"
              linkText="Install App"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryStat({
  label,
  value,
  loading,
  format: formatFn,
  accent,
}: {
  label: string;
  value: number;
  loading: boolean;
  format?: (v: number) => string;
  accent?: boolean;
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      {loading ? (
        <div className="skeleton h-7 w-16 mt-1" />
      ) : (
        <span className="stat-value" style={accent ? { color: "var(--status-critical)" } : undefined}>
          {formatFn ? formatFn(value) : value.toLocaleString()}
        </span>
      )}
    </div>
  );
}

function MetricStat({
  label,
  value,
  suffix,
  loading,
  warn,
}: {
  label: string;
  value: number;
  suffix?: string;
  loading: boolean;
  warn?: boolean;
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      {loading ? (
        <div className="skeleton h-6 w-12 mt-1" />
      ) : (
        <span className="text-lg font-bold tabular-nums" style={{ 
          fontFamily: "IBM Plex Mono", 
          color: warn ? "var(--status-warn)" : "var(--text-primary)",
          letterSpacing: "-0.02em"
        }}>
          {value.toLocaleString()}{suffix}
        </span>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="flex items-center justify-between px-4 py-2.5 transition-colors border-b last:border-b-0"
      style={{ borderColor: "var(--border-subtle)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
          <GitPullRequest size={12} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {review.prTitle ?? `PR #${review.prNumber}`}
          </p>
          <p className="text-[10px] code-font truncate" style={{ color: "var(--text-muted)" }}>
            {review.repoFullName} #{review.prNumber}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className={`badge-${review.status}`}>{review.status}</span>
        <span className="text-[10px] code-font" style={{ color: "var(--text-muted)" }}>
          {format(new Date(review.createdAt), "MMM d")}
        </span>
      </div>
    </Link>
  );
}

function EmptyState({
  title,
  message,
  linkTo,
  linkText,
}: {
  title: string;
  message: string;
  linkTo?: string;
  linkText?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--accent-dim)" }}>
        <GitPullRequest size={18} style={{ color: "var(--accent)" }} />
      </div>
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-[11px] max-w-[240px]" style={{ color: "var(--text-muted)" }}>{message}</p>
      {linkTo && linkText && (
        <Link
          to={linkTo}
          className="mt-3 text-[11px] font-semibold uppercase tracking-wider transition-colors"
          style={{ color: "var(--accent)" }}
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}
