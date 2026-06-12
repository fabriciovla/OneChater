import { redirect } from "next/navigation";

// English slug for the pricing section. Redirects home with ?to=, which scrolls
// to the section and rewrites the URL back to /pricing.
export default function PricingPage() {
  redirect("/?to=pricing");
}
