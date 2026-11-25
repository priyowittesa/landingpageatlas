import { redirect } from "next/navigation";

/** First visit lands on Operations Intelligence; Portfolio health lives at /ptepi/portfolio. */
export default function PtepiIndexPage() {
  redirect("/ptepi/actions");
}
