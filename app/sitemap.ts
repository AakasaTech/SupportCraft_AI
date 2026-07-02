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
    {
      url:              `${APP_URL}/faq`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/docs`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/docs/getting-started`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/docs/tickets`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/docs/replying-to-tickets`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/docs/ai-features`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/docs/faq`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.7,
    },
  ];
}
