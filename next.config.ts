import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: opt-in caching with "use cache", dynamic by default.
  // Also enables PPR, <Activity> for state preservation on navigation.
  cacheComponents: true,

  // React Compiler: automatic memoization — no manual useMemo/useCallback needed.
  reactCompiler: true,

  experimental: {
    // Turbopack filesystem cache: stores compiler artifacts on disk between
    // dev restarts for faster cold starts on large repos.
    turbopackFileSystemCacheForDev: true,
    // Tree-shaking agresivo de paquetes con muchas re-exportaciones.
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
