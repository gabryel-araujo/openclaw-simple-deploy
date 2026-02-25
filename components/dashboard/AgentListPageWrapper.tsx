"use client";

import { useEffect, useState } from "react";
import { AgentListPage } from "./AgentListPage";

/**
 * Wrapper that fetches subscription status and passes readOnly
 * to AgentListPage when the subscription is inactive.
 */
export function AgentListPageWrapper({ userId }: { userId: string }) {
  const [readOnly, setReadOnly] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/subscription/status");
        if (res.ok) {
          const data = (await res.json()) as { active: boolean };
          // If user has NO subscription at all, allow full access
          // (they might be on a free trial or haven't subscribed yet)
          // ReadOnly only applies when they HAD a subscription that's now inactive
          if (data.active === false) {
            // Check if they have a subscription record at all
            const full = (await fetch("/api/subscription/status").then((r) =>
              r.json(),
            )) as { subscription: { status: string } | null };
            if (
              full.subscription &&
              full.subscription.status !== "pending" &&
              full.subscription.status !== "authorized"
            ) {
              setReadOnly(true);
            }
          }
        }
      } catch {
        // If check fails, don't restrict access
      } finally {
        setChecked(true);
      }
    }
    void check();
  }, []);

  if (!checked) return null;

  return <AgentListPage userId={userId} readOnly={readOnly} />;
}
