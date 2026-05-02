import { useUser } from "@clerk/expo";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/db";
import { trophies, userTrophies, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface Trophy {
  id: number;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
  category: string | null;
  earnedAt?: Date | null;
}

export const useTrophies = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [allTrophies, setAllTrophies] = useState<Trophy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrophyData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Get the local user ID first
      const userResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, user.id))
        .limit(1);

      if (userResult.length === 0) {
        setIsLoading(false);
        return;
      }

      const userId = userResult[0].id;

      // 2. Fetch all possible trophies
      const trophiesResult = await db.select().from(trophies);

      // 3. Fetch user's earned trophies
      const earnedResult = await db
        .select({
          trophyId: userTrophies.trophyId,
          earnedAt: userTrophies.earnedAt,
        })
        .from(userTrophies)
        .where(eq(userTrophies.userId, userId));

      // 4. Map them together
      const mergedTrophies = trophiesResult.map((t) => {
        const earned = earnedResult.find((e) => e.trophyId === t.id);
        return {
          ...t,
          earnedAt: earned ? earned.earnedAt : null,
        };
      });

      setAllTrophies(mergedTrophies);
      setError(null);
    } catch (err) {
      console.error("Error fetching trophies:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    fetchTrophyData();
  }, [fetchTrophyData]);

  return {
    trophies: allTrophies,
    isLoading,
    error,
    refetch: fetchTrophyData,
  };
};
