import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/employees", label: "Employees" },
  { to: "/recruitment", label: "Recruitment" },
  { to: "/performance", label: "Performance" },
  { to: "/analytics", label: "Analytics" }
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">TalentOS</p>
          <h2>Talent Management System</h2>
          <p className="sidebar-copy">Operate hiring, growth, and org performance from one place.</p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              end={link.to === "/"}
              key={link.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>{user?.email}</span>
          <button className="secondary-button" onClick={() => void logout()} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <Outlet />
      </div>
    </div>
  );
}
