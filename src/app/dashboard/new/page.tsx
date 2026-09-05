import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function NewOrganizerPage() {
  await requireUser();
  redirect("/dashboard?newOrg=true");
}
