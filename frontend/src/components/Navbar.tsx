import { NavLink } from "react-router-dom";

export default function Navbar() {
  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/volunteers", label: "Volunteers" },
    { to: "/programs", label: "Programs" },
    { to: "/events", label: "Events" },
    { to: "/analytics", label: "Analytics" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <nav className="navbar">
      <div className="brand">SoBA</div>

      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `nav-link${isActive ? " active" : ""}`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
