import { permanentRedirect } from "next/navigation";

// Legacy slug. Permanently redirect (308) to the real /modelos page so any
// inbound links or stale index entries consolidate onto the canonical URL.
export default function FuncionalidadesPage() {
  permanentRedirect("/modelos");
}
