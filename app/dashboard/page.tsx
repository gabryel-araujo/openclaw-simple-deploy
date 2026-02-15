import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { createClient } from "@/src/infrastructure/auth/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return <DashboardContent />;
}
