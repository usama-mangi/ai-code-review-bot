import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, GitPullRequest, LogOut, User as UserIcon, Settings, ExternalLink, Layers, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "w-56 flex-shrink-0 border-r flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>CODEREVIEW</p>
              <p className="text-[10px] font-medium tracking-widest" style={{ color: "var(--text-muted)" }}>BOT</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5" role="navigation" aria-label="Main navigation">
          <NavItem to="/" icon={<LayoutDashboard size={15} />} label="Dashboard" end onClick={() => setSidebarOpen(false)} />
          <NavItem to="/reviews" icon={<GitPullRequest size={15} />} label="Reviews" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/repositories" icon={<Settings size={15} />} label="Repos" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/architecture" icon={<Layers size={15} />} label="Architecture" onClick={() => setSidebarOpen(false)} />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
          <a
            href="https://github.com/apps/code-qa-review-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors border"
            style={{ 
              background: "var(--bg-card)", 
              borderColor: "var(--border)", 
              color: "var(--text-muted)" 
            }}
          >
            Install App <ExternalLink size={11} />
          </a>
          
          {user && (
            <div className="flex items-center gap-2 p-2 rounded-md" style={{ background: "var(--bg-card)" }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-7 h-7 rounded" style={{ background: "var(--bg-secondary)" }} />
              ) : (
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
                  <UserIcon size={13} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.username}</p>
              </div>
              <button 
                onClick={logout}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
                title="Logout"
                aria-label="Logout"
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--status-critical)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded overflow-hidden" style={{ background: "var(--accent-dim)" }}>
              <img src="/favicon.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-[11px] font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>CODEREVIEW</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  end,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-100",
          isActive
            ? "text-[var(--accent)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )
      }
      style={({ isActive }) => isActive ? { background: "var(--accent-dim)" } : undefined}
    >
      {icon}
      {label}
    </NavLink>
  );
}
