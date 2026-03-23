import type { ReactNode } from "react";
import Navbar from "./Navbar";
type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  return (
    <div className="app-shell">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
