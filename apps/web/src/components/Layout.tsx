import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, GitPullRequest, LogOut, User as UserIcon, Settings, ExternalLink, Layers } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30 overflow-hidden p-1.5">
            <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">CodeReview Bot</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI-Powered Reviews</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" end />
          <NavItem to="/reviews" icon={<GitPullRequest size={16} />} label="Review History" />
          <NavItem to="/repositories" icon={<Settings size={16} />} label="Repositories" />
          <NavItem to="/architecture" icon={<Layers size={16} />} label="How It Works" />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-4" style={{ borderColor: "var(--border)" }}>
          <a
            href="https://github.com/apps/ai-pr-review-bot-usama-mangi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-white rounded-lg transition-colors border border-neutral-700"
          >
            Install App <ExternalLink size={14} />
          </a>
          
          {user && (
            <div className="flex items-center gap-3 w-full bg-neutral-900/50 p-2 rounded-lg border border-neutral-800">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full bg-neutral-800" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                  <UserIcon size={16} className="text-neutral-400" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Powered by GPT-4o + GitHub API
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
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
