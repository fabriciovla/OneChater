import { redirect } from "next/navigation";

// English slug for the memory section. Redirects home with ?to=, which scrolls to
// the section and rewrites the URL back to /memory.
export default function MemoryPage() {
  redirect("/?to=memory");
}
