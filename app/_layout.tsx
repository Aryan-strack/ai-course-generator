import { useSyncUser } from "@/hooks/useSyncUser";
import { tokenCache } from "@/utils/cache";
import { configureRevenueCat, syncRevenueCatUser } from "@/utils/revenuecat";
import { ClerkLoaded, ClerkProvider, useUser } from "@clerk/expo";
import { Stack } from "expo-router";
import { useEffect } from "react";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
  );
}

/**
 * Initial component to handle user synchronization upon app load.
 */
function InitialLayout() {
  useSyncUser();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    void configureRevenueCat();
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    void syncRevenueCatUser(user.id);
  }, [isLoaded, isSignedIn, user?.id]);

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
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <InitialLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
