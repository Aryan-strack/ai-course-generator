import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/utils/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";

export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
  category: string | null;
  earnedAt?: Date | null;
}

export const useTrophies = () => {
  const { user, isSignedIn, isLoading: authLoading } = useAuth();
  const [allTrophies, setAllTrophies] = useState<Trophy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrophyData = useCallback(async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Check user exists (already handled by auth)
      const userDoc = await getDoc(doc(db, "users", user.id));
      if (!userDoc.exists()) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch all possible trophies
      const trophiesRef = collection(db, "trophies");
      const trophiesSnapshot = await getDocs(trophiesRef);

      // 3. Fetch user's earned trophies
      const userTrophiesRef = collection(db, "userTrophies");
      const userTrophiesQuery = query(
        userTrophiesRef,
        where("userId", "==", user.id)
      );
      const earnedSnapshot = await getDocs(userTrophiesQuery);

      // Build a map of earned trophy IDs with earnedAt dates
      const earnedMap = new Map();
      earnedSnapshot.forEach((doc) => {
        const data = doc.data();
        earnedMap.set(data.trophyId, data.earnedAt);
      });

      // 4. Map them together
      const mergedTrophies = trophiesSnapshot.docs.map((doc) => {
        const t = doc.data();
        const earnedAt = earnedMap.has(doc.id) ? earnedMap.get(doc.id) : null;
        return {
          id: doc.id,
          name: t.name,
          description: t.description,
          icon: t.icon,
          conditionType: t.conditionType,
          conditionValue: t.conditionValue,
          category: t.category,
          earnedAt: earnedAt ? new Date(earnedAt.seconds * 1000) : null,
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
  }, [isSignedIn, user]);

  useEffect(() => {
    fetchTrophyData();
  }, [fetchTrophyData]);

  return {
    trophies: allTrophies,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchTrophyData,
  };
};
