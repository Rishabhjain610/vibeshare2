import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vibe Reels",
  description: "Watch short videos and visual clips shared by anyone on VibeShare",
};

// Reels page uses the standard root layout (Navbar + Sidebars) on desktop.
// On mobile it switches to a full-screen immersive experience via CSS.
// We do NOT override the root layout here — we let page.tsx handle responsiveness.
export default function ReelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
