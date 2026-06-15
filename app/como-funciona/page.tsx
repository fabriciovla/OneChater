import SeoLanding from "../_seo/SeoLanding";
import { comoFunciona, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Cómo funciona",
  description:
    "Cómo funciona OneChater: conecta tus API keys, chatea con GPT, Claude y Gemini lado a lado y construye una memoria persistente que viaja entre todos los modelos.",
  slug: "/como-funciona",
  alt: { lang: "en", path: "/how-it-works" },
  locale: "es",
});

export default function Page() {
  return <SeoLanding content={comoFunciona} />;
}
