import type { Viewport } from "next";

// Public tap pages draw edge to edge (behind the notch and home indicator);
// `.safe-area` in PublicShell pads the content back inside the visible area.
export const viewport: Viewport = { viewportFit: "cover" };

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
