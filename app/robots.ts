import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.onechater.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private app surfaces and APIs shouldn't be crawled.
      // /cli is an auth bridge; /security is an authed settings page.
      disallow: ["/api/", "/chat", "/dashboard", "/login", "/security", "/cli"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
