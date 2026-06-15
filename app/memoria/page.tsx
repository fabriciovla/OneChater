import SeoLanding from "../_seo/SeoLanding";
import { memoria, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Memoria de IA persistente",
  description:
    "OneChater le da a cada modelo de IA una memoria persistente y privada que viaja contigo — para que GPT, Claude y Gemini siempre recuerden tus proyectos, preferencias y contexto.",
  slug: "/memoria",
  alt: { lang: "en", path: "/memory" },
  locale: "es",
});

export default function Page() {
  return <SeoLanding content={memoria} />;
}
