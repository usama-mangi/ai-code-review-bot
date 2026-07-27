import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { apiClient, type Stats, type Review, type PerformanceMetrics } from "../api/client";
import { format } from "date-fns";
import { GitPullRequest, AlertCircle, RefreshCw } from "lucide-react";

const SEV: Record<string, string> = { bug: "#f87171", security: "#fb923c", improvement: "#fbbf24", style: "#60a5fa", info: "#a0a0b4" };
const SEV_LABEL: Record<string, string> = { bug: "Bug", security: "Security", improvement: "Improve", style: "Style", info: "Info" };

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
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <AlertCircle size={24} style={{ color: "var(--status-critical)" }} />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
      <button onClick={load} className="btn-primary text-[10px]"><RefreshCw size={11} /> Retry</button>
    </div>
  );

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-3 auto-rows-[minmax(0,auto)]">
        
        {/* ── Hero: Review trend — spans 8 cols ── */}
        <div className="col-span-12 xl:col-span-8 panel">
          <div className="panel-header">
            <span>Review Trend</span>
            <span className="code-font" style={{ color: "var(--border)" }}>30 days</span>
          </div>
          <div className="p-4">
            {loading ? <div className="skeleton h-36 w-full" /> : lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, fontFamily: "IBM Plex Mono" }} />
                  <Line type="monotone" dataKey="r" stroke="var(--accent)" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "var(--accent)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptySmall />}
          </div>
        </div>

        {/* ── Severity pie — spans 4 cols ── */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-4 panel">
          <div className="panel-header"><span>Severity</span></div>
          <div className="p-3 flex flex-col items-center">
            {loading ? <div className="skeleton h-32 w-full" /> : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map(e => <Cell key={e.name} fill={SEV[e.name] ?? "var(--text-muted)"} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptySmall />}
            {/* legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
              {pieData.map(e => (
                <span key={e.name} className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV[e.name] }} />
                  {SEV_LABEL[e.name] ?? e.name} {e.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stat tiles — 4 across ── */}
        <StatTile label="Total Reviews" value={stats?.totalReviews} loading={loading} />
        <StatTile label="Total Comments" value={stats?.totalComments} loading={loading} />
        <StatTile label="Avg / PR" value={stats?.avgCommentsPerReview} loading={loading} fmt={v => v.toFixed(1)} />
        <StatTile label="Bugs Found" value={stats?.severityBreakdown?.bug} loading={loading} accent />

        {/* ── Performance strip — full width ── */}
        <div className="col-span-12 panel">
          <div className="panel-header"><span>Performance</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: "var(--border-subtle)" }}>
            <MetricCell label="Avg Time" value={perf?.avgReviewTime?.avgSeconds} suffix="s" loading={loading} />
            <MetricCell label="Error Rate" value={perf?.errorRatePct} suffix="%" loading={loading} warn={(perf?.errorRatePct ?? 0) > 5} />
            <MetricCell label="Failed" value={perf?.statusCounts?.failed} loading={loading} warn={(perf?.statusCounts?.failed ?? 0) > 0} />
            <MetricCell label="Repos Active" value={perf?.byRepo?.length} loading={loading} />
          </div>
        </div>

        {/* ── Weekly bar chart — 8 cols ── */}
        {perf && perf.weeklyTrend.length > 0 && (
          <div className="col-span-12 xl:col-span-8 panel">
            <div className="panel-header"><span>Weekly Volume</span><span className="code-font" style={{ color: "var(--border)" }}>12w</span></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={perf.weeklyTrend.map(d => ({ w: format(new Date(d.week), "MMM d"), n: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="w" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "IBM Plex Mono" }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="n" fill="var(--accent)" radius={[2, 2, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Recent reviews — 4 cols ── */}
        <div className={`col-span-12 ${perf && perf.weeklyTrend.length > 0 ? 'xl:col-span-4' : ''} panel`}>
          <div className="panel-header">
            <span>Recent</span>
            <Link to="/reviews" className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>All →</Link>
          </div>
          {loading ? (
            <div className="p-3 space-y-1.5">{[1,2,3].map(i => <div key={i} className="skeleton h-8 w-full" />)}</div>
          ) : reviews.length > 0 ? (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {reviews.map(r => (
                <Link key={r.id} to={`/reviews/${r.id}`} className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[var(--bg-card-hover)]">
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                    <GitPullRequest size={10} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.prTitle ?? `PR #${r.prNumber}`}</p>
                    <p className="text-[9px] code-font truncate" style={{ color: "var(--text-muted)" }}>{r.repoFullName}</p>
                  </div>
                  <span className={`badge-${r.status} flex-shrink-0`}>{r.status}</span>
                </Link>
              ))}
            </div>
          ) : <div className="p-6"><EmptySmall /></div>}
        </div>

      </div>
    </div>
  );
}

function StatTile({ label, value, loading, fmt, accent }: { label: string; value?: number; loading: boolean; fmt?: (n: number) => string; accent?: boolean }) {
  return (
    <div className="col-span-6 sm:col-span-3 xl:col-span-3 panel p-3 flex flex-col">
      <span className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{label}</span>
      {loading ? <div className="skeleton h-6 w-14" /> : (
        <span className="text-xl font-bold tabular-nums" style={{ fontFamily: "IBM Plex Mono", color: accent ? "var(--status-critical)" : "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {fmt ? fmt(value ?? 0) : (value ?? 0).toLocaleString()}
        </span>
      )}
    </div>
  );
}

function MetricCell({ label, value, suffix, loading, warn }: { label: string; value?: number; suffix?: string; loading: boolean; warn?: boolean }) {
  return (
    <div className="px-4 py-3 text-center" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-[9px] font-semibold uppercase tracking-widest block mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</span>
      {loading ? <div className="skeleton h-5 w-10 mx-auto" /> : (
        <span className="text-base font-bold tabular-nums" style={{ fontFamily: "IBM Plex Mono", color: warn ? "var(--status-warn)" : "var(--text-primary)" }}>
          {(value ?? 0).toLocaleString()}{suffix}
        </span>
      )}
    </div>
  );
}

function EmptySmall() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="w-8 h-8 rounded flex items-center justify-center mb-2" style={{ background: "var(--accent-dim)" }}>
        <GitPullRequest size={14} style={{ color: "var(--accent)" }} />
      </div>
      <p className="text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>No data yet</p>
      <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>Open a PR to start</p>
    </div>
  );
}
