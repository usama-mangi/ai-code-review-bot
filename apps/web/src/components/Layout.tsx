import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, GitPullRequest, Bot } from "lucide-react";
import clsx from "clsx";

export function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Bot size={18} className="text-white" />
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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
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
