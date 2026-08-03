import type { Metadata } from "next";

/**
 * Designlabbet ligger utanför verkstadens layout med flit: ingen sidomeny,
 * ingen topbar och ingen datahämtning. Då kan man skruva på formspråket
 * utan att någon riktig vy påverkas.
 */
export const metadata: Metadata = {
  title: "Designlabb",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
