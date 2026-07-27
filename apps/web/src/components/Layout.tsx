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
  const currentPage = NAV.find(n => n.to === location.pathname)?.label ?? "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Icon rail — desktop only */}
      <aside 
        className="hidden lg:flex flex-col items-center w-12 flex-shrink-0 border-r py-3 gap-1"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}
      >
        <div className="w-8 h-8 rounded flex items-center justify-center mb-3" style={{ background: "var(--accent-dim)" }}>
          <img src="/favicon.png" alt="Logo" className="w-4.5 h-4.5 object-contain" />
        </div>
        
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => clsx(
              "w-9 h-9 flex items-center justify-center rounded transition-colors relative",
              isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
            style={({ isActive }) => isActive ? { background: "var(--accent-dim)" } : undefined}
            title={label}
            aria-label={label}
          >
            <Icon size={16} />
          </NavLink>
        ))}

        <div className="flex-1" />

        <a
          href="https://github.com/apps/code-qa-review-bot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          title="Install App"
          aria-label="Install App on GitHub"
        >
          <ExternalLink size={14} />
        </a>

        {user && (
          <div className="relative group">
            <button className="w-9 h-9 flex items-center justify-center rounded overflow-hidden" style={{ background: "var(--bg-card)" }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={14} style={{ color: "var(--text-muted)" }} />
              )}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-md border opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{user.username}</p>
              <button onClick={logout} className="flex items-center gap-1.5 text-[10px] w-full" style={{ color: "var(--status-critical)" }}>
                <LogOut size={10} /> Sign out
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-52 flex flex-col border-r transition-transform duration-200 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-[11px] font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>CODE REVIEW</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ color: "var(--text-muted)" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
              style={({ isActive }) => isActive ? { background: "var(--accent-dim)" } : undefined}
            >
              <Icon size={14} /> {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
            {user.avatarUrl && <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded" />}
            <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: "var(--text-primary)" }}>{user.username}</span>
            <button onClick={logout} style={{ color: "var(--text-muted)" }} aria-label="Logout"><LogOut size={12} /></button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-10 px-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-0.5" style={{ color: "var(--text-secondary)" }} aria-label="Menu">
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{currentPage || "Dashboard"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--status-ok)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>System OK</span>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-1.5">
                {user.avatarUrl && <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded" />}
                <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{user.username}</span>
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
