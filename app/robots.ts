import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://supportcraft.aakasa.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/login", "/register"],
        disallow: [
          "/dashboard",
          "/tickets",
          "/customers",
          "/knowledge-base",
          "/email",
          "/ai",
          "/settings",
          "/admin",
          "/api",
          "/portal/dashboard",
          "/portal/tickets",
          "/portal/profile",
          "/portal/announcements",
          "/auth",
          "/invitation",
          "/update-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
