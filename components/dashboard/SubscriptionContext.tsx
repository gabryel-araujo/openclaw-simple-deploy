"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SubscriptionData {
  id: string;
  status: string;
  planId: string;
  maxAgents: number;
  nextPaymentDate: string | null;
  createdAt: string;
}

interface SubscriptionState {
  loading: boolean;
  isActive: boolean;
  validUntil: string | null;
  subscription: SubscriptionData | null;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionState>({
  loading: true,
  isActive: false,
  validUntil: null,
  subscription: null,
  refresh: () => {},
});

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscription/status");
      if (!res.ok) throw new Error("Erro ao buscar assinatura");
      const data = (await res.json()) as {
        active: boolean;
        validUntil: string | null;
        subscription: SubscriptionData | null;
      };
      setIsActive(data.active);
      setValidUntil(data.validUntil ?? null);
      setSubscription(data.subscription ?? null);
    } catch {
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return (
    <SubscriptionContext.Provider
      value={{ loading, isActive, validUntil, subscription, refresh: fetchStatus }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
