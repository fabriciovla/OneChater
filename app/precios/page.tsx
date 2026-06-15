import SeoLanding from "../_seo/SeoLanding";
import { precios, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Precios",
  description:
    "Precios de OneChater: trae tus propias API keys y paga a OpenAI, Anthropic y Google directamente, sin recargo. Empieza gratis y mejora para todos los modelos y memoria persistente.",
  slug: "/precios",
  alt: { lang: "en", path: "/pricing" },
  locale: "es",
});

export default function Page() {
  return <SeoLanding content={precios} />;
}
