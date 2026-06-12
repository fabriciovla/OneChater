import { redirect } from "next/navigation";

// Pretty slug. A direct hit / refresh redirects home with ?to=, which scrolls to
// the matching section and rewrites the URL back to /funcionalidades.
export default function FuncionalidadesPage() {
  redirect("/?to=funcionalidades");
}
