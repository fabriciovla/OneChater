import { redirect } from "next/navigation";

// Spanish slug for the models section. Redirects home with ?to=, which scrolls to
// the section and rewrites the URL back to /modelos.
export default function ModelosPage() {
  redirect("/?to=modelos");
}
