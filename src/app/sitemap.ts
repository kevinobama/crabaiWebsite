import type { MetadataRoute } from "next";

// Dynamic sitemap. Next.js 16 emits this at /sitemap.xml automatically.
// Update SITE_URL to match your production domain.

const SITE_URL = "https://www.crabq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Single-page app — one entry for the root URL. If you add more routes
  // (e.g. /blog, /case-studies), add them here.
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
      // Bilingual alternates — tells search engines this page exists in
      // both English and Chinese.
      alternates: {
        languages: {
          "en-US": SITE_URL,
          "zh-CN": SITE_URL,
        },
      },
    },
  ];
}
