import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, GitPullRequest, Settings, Layers, LogOut, User as UserIcon, Menu, X, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../AuthContext";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/reviews", icon: GitPullRequest, label: "Reviews" },
  { to: "/repositories", icon: Settings, label: "Repos" },
  { to: "/architecture", icon: Layers, label: "Architecture" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentPage = NAV.find(n => n.to === location.pathname)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* ── Sidebar — 200px on desktop ── */}
      <aside className="hidden lg:flex flex-col w-[200px] flex-shrink-0 border-r"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
        
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
            <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Code Review</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI Bot</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              style={({ isActive }) => isActive ? { background: "var(--accent-dim)" } : undefined}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
          <a href="https://github.com/apps/code-qa-review-bot" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <ExternalLink size={16} />
            Install App
          </a>
          
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-7 h-7 rounded-lg" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-card)" }}>
                  <UserIcon size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.username}</p>
              </div>
              <button onClick={logout} className="p-1 rounded transition-colors hover:bg-[var(--bg-card)]"
                style={{ color: "var(--text-muted)" }} aria-label="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-200 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Code Review</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ color: "var(--text-muted)" }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
              )}
              style={({ isActive }) => isActive ? { background: "var(--accent-dim)" } : undefined}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="p-3 border-t flex items-center gap-2.5" style={{ borderColor: "var(--border-subtle)" }}>
            {user.avatarUrl && <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg" />}
            <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--text-primary)" }}>{user.username}</span>
            <button onClick={logout} style={{ color: "var(--text-muted)" }} aria-label="Logout"><LogOut size={16} /></button>
          </div>
        )}
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 border-b flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1" style={{ color: "var(--text-secondary)" }} aria-label="Menu">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{currentPage}</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--status-ok)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>System OK</span>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                {user.avatarUrl && <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg" />}
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{user.username}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
