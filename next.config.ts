import type { NextConfig } from "next";

// Corporate proxy uses a self-signed TLS cert — disable verification in dev only.
// In production (CI / cloud), NODE_TLS_REJECT_UNAUTHORIZED is not set so this is a no-op.
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  serverExternalPackages: [],
};

export default nextConfig;
