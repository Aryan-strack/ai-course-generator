import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { syncRevenueCatUser } from "@/utils/revenuecat";
import { useSyncUser } from "@/hooks/useSyncUser";

/**
 * Initial component to handle user synchronization upon app load.
 */
function InitialLayout() {
  useSyncUser();
  const { user, isSignedIn, refreshUser } = useAuth();

  useEffect(() => {
    void configureRevenueCat();
  }, []);

  useEffect(() => {
    if (isSignedIn && user?.id) {
      void syncRevenueCatUser(user.id);
      void refreshUser();
    }
  }, [isSignedIn, user?.id, refreshUser]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}

async function configureRevenueCat() {
  // RevenueCat disabled for now
}
