import type { MetadataRoute } from "next";

/**
 * Web app manifest – gör Fordania Verkstad installerbar som PWA på
 * hemskärmen (iPad/iPhone/Android/desktop). Ikonerna genereras av
 * `scripts/gen-icons.mjs` och ligger i `public/`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fordania Verkstad",
    short_name: "Verkstad",
    description:
      "Verkstadsplanerare för biluthyrning – planera jobb, följ fordon och håll verkstaden i rörelse.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    // Matchar app-bakgrunden (canvas) resp. den ljusa toppen.
    background_color: "#eef3f9",
    theme_color: "#ffffff",
    lang: "sv",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
