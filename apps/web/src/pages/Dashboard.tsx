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
} from "recharts";
import { apiClient, type Stats, type Review } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react";
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
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.getStats(), apiClient.getReviews(1, 5)])
      .then(([s, r]) => {
        setStats(s);
        setRecentReviews(r.data);
      })
      .finally(() => setLoading(false));
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
            <EmptyState message="No review data yet. Open a PR in a connected repo!" />
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
            <EmptyState message="No comments yet." />
          )}
        </div>
      </div>

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
          <EmptyState message="No reviews yet. Install the GitHub App and open a PR!" />
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
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  color: string;
}) {
  const glowMap: Record<string, string> = {
    brand: "shadow-brand-600/10",
    emerald: "shadow-emerald-600/10",
    yellow: "shadow-yellow-600/10",
    red: "shadow-red-600/10",
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
        <span className="stat-value">{value.toLocaleString()}</span>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const statusClass = `badge-${review.status}`;
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="flex items-center justify-between rounded-lg p-3 transition-all duration-150 hover:bg-[var(--bg-card-hover)] group"
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="text-4xl mb-3">🤖</div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  );
}
