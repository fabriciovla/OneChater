import SeoLanding from "../_seo/SeoLanding";
import { pricing, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Pricing",
  description:
    "OneChater pricing: bring your own API keys and pay OpenAI, Anthropic and Google directly with no markup. Start free, upgrade for all models and persistent memory.",
  slug: "/pricing",
  alt: { lang: "es", path: "/precios" },
  locale: "en",
});

export default function Page() {
  return <SeoLanding content={pricing} />;
}
