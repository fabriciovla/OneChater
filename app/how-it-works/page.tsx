import { redirect } from "next/navigation";

// English slug for the "how it works" section. Redirects home with ?to=, which
// scrolls to the section and rewrites the URL back to /how-it-works.
export default function HowItWorksPage() {
  redirect("/?to=how-it-works");
}
