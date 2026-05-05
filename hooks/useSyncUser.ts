import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/utils/firebase/config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Hook to synchronize the authenticated user with Firebase Firestore.
 * This runs on app load or whenever the user's authentication state changes.
 */
export const useSyncUser = () => {
  const { user, isSignedIn, refreshUser } = useAuth();

  useEffect(() => {
    if (isSignedIn && user) {
      syncUser();
    } else if (!isSignedIn) {
      console.log("DATABASE_SYNC: User not signed in, skipping sync");
    }
  }, [isSignedIn, user]);

  const syncUser = async () => {
    if (!user) return;

    try {
      const email = user.email;
      const name = user.name || "Hero";
      const userId = user.id;

      // Check if user exists in Firestore by id
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, check if updates needed
        const dbUser = userDoc.data();
        const updates: any = {};
        let needsUpdate = false;

        if (dbUser.email !== email) {
          updates.email = email;
          needsUpdate = true;
        }
        if (dbUser.name !== name) {
          updates.name = name;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(userDocRef, updates);
          console.log("DATABASE_SYNC: User updated:", email);
        } else {
          console.log("DATABASE_SYNC: User already in sync.");
        }
        return;
      }

      // User doesn't exist in Firestore, create new record
      // (This shouldn't happen normally as signUp creates it, but handle edge case)
      console.warn("DATABASE_SYNC: User not found in Firestore, creating new record");
      await setDoc(userDocRef, {
        id: userId,
        email,
        name,
        imageUrl: user.imageUrl || null,
        xp: 0,
        coins: 0,
        level: 1,
        rank: "Novice",
        nextLevelXp: 50,
        nextLevelCoins: 100,
        dailyStreak: 0,
        lastCheckIn: null,
        subscriptionStatus: "free",
        bio: "A mysterious wanderer in the cyber realm. Ready to learn and conquer.",
        guild: "Freelancer",
        createdAt: new Date(),
        lastBountyUpdate: null,
        passwordHash: user.passwordHash || null,
      });
      console.log("DATABASE_SYNC: New user created in Firestore:", email);
    } catch (error: any) {
      console.error("DATABASE_SYNC_ERROR:", error);
    }
  };
};
};
