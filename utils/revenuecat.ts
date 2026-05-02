import { useCallback, useEffect, useState } from "react";

/** The entitlement identifier you configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT_ID = "pro";

export interface CustomerInfo {
  entitlements?: {
    active?: Record<string, unknown>;
  };
}

export interface PurchasesProduct {
  title?: string;
  priceString?: string;
  subscriptionPeriod?: string;
  introductoryPrice?: {
    periodNumberOfUnits?: number;
    periodUnit?: string;
  };
}

export interface PurchasesPackage {
  identifier: string;
  packageType?: string;
  product: PurchasesProduct;
}

export interface PurchasesOffering {
  current?: PurchasesOffering | null;
  availablePackages?: PurchasesPackage[];
}

function getDisabledMessage() {
  return "Subscriptions are temporarily disabled for this build.";
}

// ─── Init ─────────────────────────────────────────────────────────────────────
/**
 * Call once on app start (e.g. inside _layout.tsx) to configure the SDK.
 * Safe to call multiple times – RevenueCat ignores subsequent calls.
 */
export async function configureRevenueCat() {
  return false;
}

export async function syncRevenueCatUser(userId?: string | null) {
  void userId;
  return null;
}

export async function logoutRevenueCat() {
  return;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface SubscriptionState {
  /** Whether the user has an active "pro" entitlement. */
  isPro: boolean;
  /** Raw RevenueCat customer info (null until loaded). */
  customerInfo: CustomerInfo | null;
  /** The current default offering fetched from RevenueCat. */
  currentOffering: PurchasesOffering | null;
  /** True while the initial load is in progress. */
  isLoading: boolean;
  /** Any error string from the last operation. */
  error: string | null;
  /** Purchase a specific package by identifier. */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases. */
  restorePurchases: () => Promise<boolean>;
  /** Manually refresh customer info (e.g. after returning from paywall). */
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      setCustomerInfo(null);
      setCurrentOffering(null);
      setError(getDisabledMessage());
    } catch (e: any) {
      setError(e?.message ?? getDisabledMessage());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    return () => {
      return;
    };
  }, [loadData]);

  const isPro = false;

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    void pkg;
    setError(getDisabledMessage());
    return false;
  }, []);

  const restorePurchases = useCallback(async () => {
    setError(getDisabledMessage());
    return false;
  }, []);

  return {
    isPro,
    customerInfo,
    currentOffering,
    isLoading,
    error,
    purchasePackage,
    restorePurchases,
    refresh: loadData,
  };
}
