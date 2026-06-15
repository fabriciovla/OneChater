import SeoLanding from "../_seo/SeoLanding";
import { fusion, buildMetadata } from "../_seo/content";

export const metadata = buildMetadata({
  title: "Fusion — merge multiple AI models into one answer",
  description:
    "Fusion sends one prompt to GPT, Claude and Gemini at once and merges their best parts into a single, stronger answer. Your keys, no markup.",
  slug: "/fusion",
  locale: "en",
});

export default function Page() {
  return <SeoLanding content={fusion} />;
}
