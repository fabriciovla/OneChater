import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.onechater.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/terms", "/privacy", "/refunds"];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}
