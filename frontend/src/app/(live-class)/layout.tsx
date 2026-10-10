import type { ReactNode } from "react";

/** Full-bleed classroom surface — no portal sidebar. */
export default function LiveClassLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
