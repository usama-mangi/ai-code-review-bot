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
import { GitPullRequest, MessageSquare, AlertTriangle, TrendingUp, Clock, BarChart3, Activity, AlertCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";

const SEVERITY_COLORS: Record<string, string> = {
  bug: "#f87171",
  security: "#fb923c",
  improvement: "#facc15",
  style: "#60a5fa",
  info: "#94a3b8",
};

const SEVERITY_EMOJI: Record<string, string> = {
  bug: "🐛",
  security: "🔒",
  improvement: "💡",
  style: "🎨",
  info: "ℹ️",
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
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-center max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
        <button onClick={fetchData} className="btn-primary gap-2">
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm mt-1">
          AI code review activity overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Reviews"
          value={stats?.totalReviews ?? 0}
          icon={<GitPullRequest size={18} className="text-brand-400" />}
          loading={loading}
          color="brand"
        />
        <StatCard
          label="Total Comments"
          value={stats?.totalComments ?? 0}
          icon={<MessageSquare size={18} className="text-emerald-400" />}
          loading={loading}
          color="emerald"
        />
        <StatCard
          label="Avg Comments / PR"
          value={stats?.avgCommentsPerReview ?? 0}
          icon={<TrendingUp size={18} className="text-yellow-400" />}
          loading={loading}
          color="yellow"
        />
        <StatCard
          label="Bugs Found"
          value={stats?.severityBreakdown?.bug ?? 0}
          icon={<AlertTriangle size={18} className="text-red-400" />}
          loading={loading}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="card xl:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">Reviews Over Time (30 days)</h2>
          {loading ? (
            <div className="skeleton h-48 w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="reviews"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 4 }}
                  activeDot={{ r: 6, fill: "#818cf8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="No review data yet"
              message="Install the GitHub App on a repository and open a pull request to start seeing review activity here."
              linkTo="/repositories"
              linkText="Set up repositories"
            />
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Comment Severity</h2>
          {loading ? (
            <div className="skeleton h-48 w-full" />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SEVERITY_COLORS[entry.name] ?? "#6366f1"}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) =>
                    `${SEVERITY_EMOJI[value] ?? ""} ${value}`
                  }
                  wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="No comments yet"
              message="Comments from AI reviews will appear here with severity breakdowns."
            />
          )}
        </div>
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Avg Review Time"
          value={perfMetrics?.avgReviewTime?.avgSeconds ?? 0}
          icon={<Clock size={18} className="text-blue-400" />}
          loading={loading}
          color="blue"
          format={(v) => `${v}s`}
        />
        <StatCard
          label="Error Rate"
          value={perfMetrics?.errorRatePct ?? 0}
          icon={<AlertTriangle size={18} className="text-orange-400" />}
          loading={loading}
          color="orange"
          format={(v) => `${v}%`}
        />
        <StatCard
          label="Failed Reviews"
          value={perfMetrics?.statusCounts?.failed ?? 0}
          icon={<Activity size={18} className="text-red-400" />}
          loading={loading}
          color="red"
        />
        <StatCard
          label="Repos Tracked"
          value={perfMetrics?.byRepo?.length ?? 0}
          icon={<BarChart3 size={18} className="text-green-400" />}
          loading={loading}
          color="green"
        />
      </div>

      {/* Weekly Trend Chart */}
      {perfMetrics && perfMetrics.weeklyTrend.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Weekly Review Trend (12 weeks)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={perfMetrics.weeklyTrend.map((d) => ({
                week: format(new Date(d.week), "MMM d"),
                reviews: d.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
              />
              <Bar dataKey="reviews" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Reviews */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Reviews</h2>
          <Link to="/reviews" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : recentReviews.length > 0 ? (
          <div className="space-y-2">
            {recentReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reviews yet"
            message="Install the GitHub App on your repository, then open a pull request. The bot will automatically review it and post comments here."
            linkTo="/repositories"
            linkText="Install the GitHub App"
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
  color,
  format: formatFn,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  color: string;
  format?: (v: number) => string;
}) {
  const glowMap: Record<string, string> = {
    brand: "shadow-brand-600/10",
    emerald: "shadow-emerald-600/10",
    yellow: "shadow-yellow-600/10",
    red: "shadow-red-600/10",
    blue: "shadow-blue-600/10",
    orange: "shadow-orange-600/10",
    green: "shadow-green-600/10",
  };

  return (
    <div className={clsx("stat-card shadow-lg", glowMap[color])}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <div className="p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-8 w-24" />
      ) : (
        <span className="stat-value">{formatFn ? formatFn(value) : value.toLocaleString()}</span>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const statusClass = `badge-${review.status}`;
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="flex items-center justify-between rounded-lg p-3 transition-all duration-150 hover:bg-[var(--bg-card-hover)] group focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center">
          <GitPullRequest size={14} className="text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
            {review.prTitle ?? `PR #${review.prNumber}`}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {review.repoFullName} · #{review.prNumber}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className={statusClass}>{review.status}</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-600/10 flex items-center justify-center mb-4">
        <GitPullRequest size={24} className="text-brand-400" />
      </div>
      <p className="text-sm font-medium text-white mb-1">{title}</p>
      <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
      {linkTo && linkText && (
        <Link
          to={linkTo}
          className="mt-4 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}
