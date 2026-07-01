import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://supportcraft.aakasa.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              `${APP_URL}/`,
      lastModified:     new Date(),
      changeFrequency:  "weekly",
      priority:         1.0,
    },
    {
      url:              `${APP_URL}/privacy`,
      lastModified:     new Date(),
      changeFrequency:  "yearly",
      priority:         0.3,
    },
    {
      url:              `${APP_URL}/terms`,
      lastModified:     new Date(),
      changeFrequency:  "yearly",
      priority:         0.3,
    },
    {
      url:              `${APP_URL}/login`,
      lastModified:     new Date(),
      changeFrequency:  "yearly",
      priority:         0.5,
    },
    {
      url:              `${APP_URL}/register`,
      lastModified:     new Date(),
      changeFrequency:  "yearly",
      priority:         0.6,
    },
  ];
}
