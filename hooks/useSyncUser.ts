import { useUser } from "@clerk/expo";
import { useEffect } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Hook to synchronize the authenticated Clerk user with the NeonDB database.
 * This runs on app load or whenever the user's authentication state changes.
 */
export const useSyncUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  const syncUser = async () => {
    if (!user) return;

    try {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName || user.firstName || "Hero";
      const imageUrl = user.imageUrl;
      const clerkId = user.id;

      if (!email || !clerkId) {
        console.warn("User sync skipped: Missing email or Clerk ID");
        return;
      }

      // 1. Check if user exists in our DB by clerkId
      const resultByClerkId = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const userByClerkId = resultByClerkId[0];

      if (userByClerkId) {
        // User already linked by Clerk ID, check if updates are needed
        if (
          userByClerkId.email !== email ||
          userByClerkId.name !== name ||
          userByClerkId.imageUrl !== imageUrl
        ) {
          await db
            .update(users)
            .set({ email, name, imageUrl })
            .where(eq(users.clerkId, clerkId));
          console.log("DATABASE_SYNC: User updated (clerkID match):", email);
        } else {
          console.log("DATABASE_SYNC: User already in sync (clerkID match).");
        }
        return;
      }

      // 2. Check if user exists by email (handle case where user was created manually or re-created in Clerk)
      const resultByEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const userByEmail = resultByEmail[0];

      if (userByEmail) {
        // User exists by email, link the clerkId
        await db
          .update(users)
          .set({ clerkId, name, imageUrl })
          .where(eq(users.email, email));
        console.log("DATABASE_SYNC: User linked and updated by email match:", email);
        return;
      }

      // 3. Neither exists, create new record
      await db.insert(users).values({
        clerkId,
        email,
        name,
        imageUrl,
      });
      console.log("DATABASE_SYNC: New user created:", email);
    } catch (error: any) {
      console.error("DATABASE_SYNC_ERROR: Failed to sync user to database:", error);
      if (error?.message) {
        console.error("ERROR_MESSAGE:", error.message);
      }
    }
  };
};
