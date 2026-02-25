import { createClient } from "@/src/infrastructure/auth/supabase";
import { redirect } from "next/navigation";
import { BillingPage } from "@/components/dashboard/BillingPage";

export default async function BillingRoute() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return <BillingPage user={session.user} />;
}
