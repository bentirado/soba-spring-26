import { NavLink } from "react-router-dom";

type Props = {
  isOpen: boolean;
  onLinkClick?: () => void;
};

export default function Navbar({ isOpen, onLinkClick }: Props) {
  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/volunteers", label: "Volunteers" },
    { to: "/programs", label: "Programs" },
    { to: "/events", label: "Events" },
    { to: "/analytics", label: "Analytics" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-brand">Science Museum of Oklahoma</div>

      <nav className="sidebar-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
            onClick={() => onLinkClick && onLinkClick()}
          >
            <span className="link-icon" aria-hidden>
              {/* simple small circle icon instead of a big letter */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="6" cy="6" r="5" fill="rgba(255,255,255,0.9)" />
              </svg>
            </span>
            <span className="link-label">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
