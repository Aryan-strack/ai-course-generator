import { useUser } from "@clerk/expo";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  clerkId: string;
  imageUrl: string | null;
  xp: number;
  coins: number;
  level: number;
  rank: string;
  nextLevelXp: number;
  nextLevelCoins: number;
  dailyStreak: number;
  lastCheckIn: Date | null;
  subscriptionStatus: 'free' | 'pro';
  bio: string;
  guild: string;
  createdAt: Date;
}

/**
 * Hook to fetch the current authenticated user's profile from the database.
 */
export const useUserData = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, user.id))
        .limit(1);

      if (result.length > 0) {
        const data = result[0];
        setUserData({
          ...data,
          lastCheckIn: data.lastCheckIn ? new Date(data.lastCheckIn) : null,
          createdAt: new Date(data.createdAt),
        } as UserProfile);
      } else {
        console.warn("User not found in DB, waiting for sync...");
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    isLoading,
    error,
    refetch: fetchUserData,
  };
};
