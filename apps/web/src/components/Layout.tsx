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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "w-60 flex-shrink-0 border-r flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30 overflow-hidden p-1.5">
              <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">CodeReview Bot</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI-Powered Reviews</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1" role="navigation" aria-label="Main navigation">
          <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" end onClick={() => setSidebarOpen(false)} />
          <NavItem to="/reviews" icon={<GitPullRequest size={16} />} label="Review History" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/repositories" icon={<Settings size={16} />} label="Repositories" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/architecture" icon={<Layers size={16} />} label="How It Works" onClick={() => setSidebarOpen(false)} />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-4" style={{ borderColor: "var(--border)" }}>
          <a
            href="https://github.com/apps/code-qa-review-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors border focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            Install App <ExternalLink size={14} />
          </a>
          
          {user && (
            <div className="flex items-center gap-3 w-full p-2 rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" style={{ background: "var(--bg-secondary)" }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
                  <UserIcon size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ color: "var(--text-muted)" }}
                title="Logout"
                aria-label="Logout"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "var(--bg-card)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Powered by AI + GitHub API
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 overflow-hidden p-1">
              <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
            <span className="text-sm font-semibold text-white">CodeReview Bot</span>
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
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]",
          isActive
            ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
