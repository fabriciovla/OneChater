import { redirect } from "next/navigation";

// Legacy slug. A refresh / direct hit always lands the user on the home top.
export default function MemoriaPage() {
  redirect("/");
}
