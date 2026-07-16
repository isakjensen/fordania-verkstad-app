import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { themeScript } from "@/lib/theme";
import { InlineScript } from "@/components/inline-script";
import { PwaManager } from "@/components/pwa/pwa-manager";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fordania Verkstad",
    template: "%s · Fordania Verkstad",
  },
  description:
    "Verkstadsplanerare för biluthyrning – planera jobb, följ fordon och håll verkstaden i rörelse.",
  applicationName: "Fordania Verkstad",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // Native-känsla när appen läggs på iOS-hemskärmen.
  appleWebApp: {
    capable: true,
    title: "Verkstad",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Fyll hela skärmen bakom safe-areas (native-känsla på iPad/iPhone).
  viewportFit: "cover",
  // Statusbaren följer temat – annars blir remsan högst upp (notch/statusbar)
  // vit även i mörkt läge, t.ex. över den mörka skannern.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0b0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={cn("h-full antialiased", sans.variable, geistMono.variable)}
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="min-h-full">
        <PwaManager />
        {children}
      </body>
    </html>
  );
}
