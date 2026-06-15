import SeoLanding from "../_seo/SeoLanding";
import { modelos, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Modelos de IA compatibles",
  description:
    "Chatea con GPT, Claude, Gemini y cualquier modelo compatible con OpenAI en un solo lugar. Trae tus propias API keys y paga a cada proveedor directamente, sin recargo.",
  slug: "/modelos",
  alt: { lang: "en", path: "/models" },
  locale: "es",
});

export default function Page() {
  return <SeoLanding content={modelos} />;
}
