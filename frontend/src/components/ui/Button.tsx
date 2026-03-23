import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "primary" | "ghost";
  onClick?: () => void;
};

export default function Button({ children, variant = "ghost", onClick }: Props) {
  const style =
    variant === "primary"
      ? {
          backgroundColor: "var(--primary)",
          color: "white",
          border: "1px solid var(--border)",
        }
      : {
          backgroundColor: "transparent",
          color: "var(--text)",
        };

  return (
    <button style={{ ...style }} onClick={onClick}>
      {children}
    </button>
  );
}
