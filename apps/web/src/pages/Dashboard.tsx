import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { apiClient, type Stats, type Review, type PerformanceMetrics } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, RefreshCw, TrendingUp, MessageSquare, Bug } from "lucide-react";

const SEV: Record<string, string> = { bug: "#f87171", security: "#fb923c", improvement: "#fbbf24", style: "#60a5fa", info: "#a0a0b4" };

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [perf, setPerf] = useState<PerformanceMetrics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([apiClient.getStats(), apiClient.getPerformanceMetrics(), apiClient.getReviews(1, 5)])
      .then(([s, p, r]) => { setStats(s); setPerf(p); setReviews(r.data); })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const pieData = stats ? Object.entries(stats.severityBreakdown).map(([name, value]) => ({ name, value })) : [];
  const lineData = stats?.reviewsOverTime.map(d => ({ date: format(new Date(d.date), "MMM d"), r: d.count })) ?? [];

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle size={32} style={{ color: "var(--status-critical)" }} />
      <p className="text-base" style={{ color: "var(--text-muted)" }}>{error}</p>
      <button onClick={load} className="btn-primary"><RefreshCw size={14} /> Retry</button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Reviews" value={stats?.totalReviews} loading={loading} />
        <StatCard icon={MessageSquare} label="Total Comments" value={stats?.totalComments} loading={loading} />
        <StatCard icon={GitPullRequest} label="Avg / PR" value={stats?.avgCommentsPerReview} loading={loading} fmt={v => v.toFixed(1)} />
        <StatCard icon={Bug} label="Bugs Found" value={stats?.severityBreakdown?.bug} loading={loading} accent />
      </div>

      {/* ── Main content: chart + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart — takes 2 cols */}
        <div className="xl:col-span-2 panel">
          <div className="panel-header">
            <span>Review Trend</span>
            <span className="code-font text-xs" style={{ color: "var(--border)" }}>30 days</span>
          </div>
          <div className="p-5">
            {loading ? <div className="skeleton h-48 w-full" /> : lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "IBM Plex Mono" }} />
                  <Line type="monotone" dataKey="r" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--accent)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center py-12">
                <GitPullRequest size={28} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="panel">
          <div className="panel-header"><span>Severity</span></div>
          <div className="p-5 flex flex-col items-center">
            {loading ? <div className="skeleton h-40 w-full" /> : pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map(e => <Cell key={e.name} fill={SEV[e.name] ?? "var(--text-muted)"} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center">
                  {pieData.map(e => (
                    <span key={e.name} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV[e.name] }} />
                      {e.name} <span className="code-font" style={{ color: "var(--text-muted)" }}>{e.value}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8">
                <GitPullRequest size={24} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>No data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row: weekly + recent ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly bar chart */}
        {perf && perf.weeklyTrend.length > 0 && (
          <div className="xl:col-span-2 panel">
            <div className="panel-header">
              <span>Weekly Volume</span>
              <span className="code-font text-xs" style={{ color: "var(--border)" }}>12 weeks</span>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={perf.weeklyTrend.map(d => ({ w: format(new Date(d.week), "MMM d"), n: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="w" tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="n" fill="var(--accent)" radius={[3, 3, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent reviews */}
        <div className="panel">
          <div className="panel-header">
            <span>Recent</span>
            <Link to="/reviews" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}</div>
          ) : reviews.length > 0 ? (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {reviews.map(r => (
                <Link key={r.id} to={`/reviews/${r.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-card-hover)]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                    <GitPullRequest size={16} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.prTitle ?? `PR #${r.prNumber}`}</p>
                    <p className="text-xs code-font truncate" style={{ color: "var(--text-muted)" }}>{r.repoFullName}</p>
                  </div>
                  <span className={`badge-${r.status} flex-shrink-0`}>{r.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <GitPullRequest size={24} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>No reviews yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance strip ── */}
      {perf && (
        <div className="panel">
          <div className="panel-header"><span>Performance</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: "var(--border-subtle)" }}>
            <MetricCell label="Avg Review Time" value={perf.avgReviewTime?.avgSeconds} suffix="s" loading={loading} />
            <MetricCell label="Error Rate" value={perf.errorRatePct} suffix="%" loading={loading} warn={(perf.errorRatePct ?? 0) > 5} />
            <MetricCell label="Failed Reviews" value={perf.statusCounts?.failed} loading={loading} warn={(perf.statusCounts?.failed ?? 0) > 0} />
            <MetricCell label="Active Repos" value={perf.byRepo?.length} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, fmt, accent }: {
  icon: React.ComponentType<{ size?: string | number; style?: React.CSSProperties }>;
  label: string; value?: number; loading: boolean; fmt?: (n: number) => string; accent?: boolean;
}) {
  return (
    <div className="panel p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
        <Icon size={20} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
        {loading ? <div className="skeleton h-7 w-16 mt-1" /> : (
          <p className="text-2xl font-bold tabular-nums mt-0.5" style={{
            fontFamily: "IBM Plex Mono",
            color: accent ? "var(--status-critical)" : "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}>
            {fmt ? fmt(value ?? 0) : (value ?? 0).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCell({ label, value, suffix, loading, warn }: {
  label: string; value?: number; suffix?: string; loading: boolean; warn?: boolean;
}) {
  return (
    <div className="px-5 py-4 text-center" style={{ borderColor: "var(--border-subtle)" }}>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      {loading ? <div className="skeleton h-7 w-14 mx-auto" /> : (
        <p className="text-xl font-bold tabular-nums" style={{
          fontFamily: "IBM Plex Mono",
          color: warn ? "var(--status-warn)" : "var(--text-primary)",
        }}>
          {(value ?? 0).toLocaleString()}{suffix}
        </p>
      )}
    </div>
  );
}
