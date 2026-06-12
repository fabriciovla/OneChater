import { redirect } from "next/navigation";

// English slug for the models section. Redirects home with ?to=, which scrolls to
// the section and rewrites the URL back to /models.
export default function ModelsPage() {
  redirect("/?to=models");
}
