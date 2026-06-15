import SeoLanding from "../_seo/SeoLanding";
import { memory, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Persistent AI memory",
  description:
    "OneChater gives every AI model a persistent, private memory that travels with you — so GPT, Claude and Gemini always remember your projects, preferences and context.",
  slug: "/memory",
  alt: { lang: "es", path: "/memoria" },
  locale: "en",
});

export default function Page() {
  return <SeoLanding content={memory} />;
}
