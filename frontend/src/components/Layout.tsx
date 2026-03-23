import { useState } from "react";
import type { ReactNode } from "react";
import Navbar from "./Navbar";

type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="app-body">
        <Navbar
          isOpen={sidebarOpen}
          onLinkClick={() => {
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
        />
        <main className="content">
          <header className="app-header">
            <button
              className="burger"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((s) => !s)}
            >
              <span />
              <span />
              <span />
            </button>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
