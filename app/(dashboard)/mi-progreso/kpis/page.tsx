import { redirect } from "next/navigation";

export default function RedirectViejaKpis() {
  redirect("/compromisos?tab=hitos");
}
