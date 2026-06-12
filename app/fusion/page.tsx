import { redirect } from "next/navigation";

// Pretty slug. A direct hit / refresh redirects home with ?to=, which scrolls to
// the fusion section and rewrites the URL back to /fusion.
export default function FusionPage() {
  redirect("/?to=fusion");
}
