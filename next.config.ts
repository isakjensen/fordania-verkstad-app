import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bilduppladdning på arbetsordrar. Standardgränsen är 1 MB; bilderna
      // komprimeras i klienten före uppladdning men vi ger marginal.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
