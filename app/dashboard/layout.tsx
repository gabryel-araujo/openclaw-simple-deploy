import { SubscriptionProvider } from "@/components/dashboard/SubscriptionContext";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { ReadonlyOverlay } from "@/components/dashboard/ReadonlyOverlay";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>

        <Sidebar />

        <div className="p-4 sm:ml-64 min-h-screen">
          <div className="mt-4 mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            {/* Payment warning banner – only appears when subscription is invalid */}
            <SubscriptionBanner />

            {/* Page content – overlaid with a lock when subscription is invalid */}
            <ReadonlyOverlay>{children}</ReadonlyOverlay>
          </div>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
