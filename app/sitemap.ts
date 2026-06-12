import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.onechater.com";

// Landing sections, each reachable by a Spanish AND an English slug (both routes
// redirect home and scroll to the section). Listing both, cross-linked with
// hreflang alternates, lets search engines index the localized URLs.
const SECTIONS: { es: string; en: string }[] = [
  { es: "/como-funciona", en: "/how-it-works" },
  { es: "/memoria", en: "/memory" },
  { es: "/modelos", en: "/models" },
  { es: "/fusion", en: "/fusion" },
  { es: "/precios", en: "/pricing" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home (x-default points here too).
  entries.push({
    url: `${SITE_URL}/`,
    changeFrequency: "weekly",
    priority: 1,
    alternates: { languages: { en: `${SITE_URL}/`, es: `${SITE_URL}/` } },
  });

  // Each section, in both languages, cross-linked via hreflang.
  for (const s of SECTIONS) {
    const languages = {
      es: `${SITE_URL}${s.es}`,
      en: `${SITE_URL}${s.en}`,
      "x-default": `${SITE_URL}${s.en}`,
    };
    const paths = s.es === s.en ? [s.es] : [s.es, s.en];
    for (const path of paths) {
      entries.push({
        url: `${SITE_URL}${path}`,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages },
      });
    }
  }

  // Standalone pages.
  entries.push({ url: `${SITE_URL}/cli`, changeFrequency: "weekly", priority: 0.7 });
  for (const path of ["/terms", "/privacy", "/refunds"]) {
    entries.push({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority: 0.5 });
  }

  return entries;
}
