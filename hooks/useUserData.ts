import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/utils/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  clerkId: string | null;
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
  lastBountyUpdate?: Date | null;
}

/**
 * Hook to fetch the current authenticated user's profile from Firestore.
 */
export const useUserData = () => {
  const { user, isSignedIn, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      setUserData(null);
      return;
    }

    try {
      setIsLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.id));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          id: user.id,
          ...data,
          lastCheckIn: data.lastCheckIn ? new Date(data.lastCheckIn.seconds * 1000) : null,
          lastBountyUpdate: data.lastBountyUpdate ? new Date(data.lastBountyUpdate.seconds * 1000) : null,
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        } as UserProfile);
      } else {
        console.warn("User not found in Firestore");
        setUserData(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchUserData,
  };
};
