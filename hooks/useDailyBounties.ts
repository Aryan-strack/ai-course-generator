import { useEffect, useState, useCallback } from "react";
import { db } from "@/db";
import { users, dailyBounties, courses, courseEnrollments } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { useUserData } from "./useUserData";
import { generateDailyBounties, GeneratedBounty } from "@/utils/gemini";
import * as Haptics from "expo-haptics";

export interface Bounty extends GeneratedBounty {
  id: number;
  isCompleted: boolean;
  expiresAt: Date;
}

const REFRESH_INTERVAL_HOURS = 6;

export const DEFAULT_BOUNTIES: (GeneratedBounty & { id?: number; isCompleted?: boolean })[] = [
  { task: "Create your first AI Course", rewardValue: "150", rewardType: "xp", isCompleted: false },
  { task: "Explore the Course Realm", rewardValue: "50", rewardType: "coin", isCompleted: false },
  { task: "Complete your Profile Setup", rewardValue: "10", rewardType: "gem", isCompleted: false },
];

export const useDailyBounties = () => {
  const { userData, refetch: refetchUser } = useUserData();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const fetchBounties = useCallback(async () => {
    if (!userData?.id) return;

    try {
      setIsLoading(true);

      // 1. Check for existing non-expired bounties
      const now = new Date();
      const existingBounties = await db
        .select()
        .from(dailyBounties)
        .where(
          and(
            eq(dailyBounties.userId, userData.id),
            gt(dailyBounties.expiresAt, now)
          )
        );

      if (existingBounties.length > 0) {
        setBounties(existingBounties.map(b => ({
          ...b,
          isCompleted: b.isCompleted === 1,
          rewardType: b.rewardType as "xp" | "coin" | "gem"
        })));
        updateTimer(existingBounties[0].expiresAt);
      } else {
        // 2. Refresh needed - Check for course enrollments
        const userEnrollments = await db
          .select({ id: courseEnrollments.id })
          .from(courseEnrollments)
          .where(eq(courseEnrollments.userId, userData.id))
          .limit(1);

        let newBountiesData: GeneratedBounty[];
        
        if (userEnrollments.length === 0) {
          // Use hardcoded defaults for new users - NO GENERATION
          newBountiesData = DEFAULT_BOUNTIES;
        } else {
          // 3. GENERATION REQUIRED
          setIsGenerating(true);
          try {
            // Fetch course titles for Gemini context
            const userCourses = await db
              .select({ title: courses.title })
              .from(courseEnrollments)
              .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
              .where(eq(courseEnrollments.userId, userData.id));

            const courseTitles = userCourses.map(c => c.title);
            newBountiesData = await generateDailyBounties(courseTitles);
          } finally {
            setIsGenerating(false);
          }
        }
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + REFRESH_INTERVAL_HOURS);

        // 4. Save to DB
        const insertedBounties = await Promise.all(
          newBountiesData.map(async (data) => {
            const result = await db.insert(dailyBounties).values({
              userId: userData.id,
              task: data.task,
              rewardValue: data.rewardValue,
              rewardType: data.rewardType,
              isCompleted: 0,
              expiresAt: expiresAt,
            }).returning();
            return result[0];
          })
        );

        // Update user's last refresh time
        await db.update(users)
          .set({ lastBountyUpdate: new Date() })
          .where(eq(users.id, userData.id));

        setBounties(insertedBounties.map(b => ({
          ...b,
          isCompleted: false,
          rewardType: b.rewardType as "xp" | "coin" | "gem"
        })));
        updateTimer(expiresAt);
      }
    } catch (error) {
      console.error("Error in useDailyBounties:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id]);

  const updateTimer = (expiry: Date) => {
    const update = () => {
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Refreshing...");
        fetchBounties();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  };

  const completeBounty = async (bountyId: number) => {
    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty || bounty.isCompleted) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 1. Update bounty in DB
      await db.update(dailyBounties)
        .set({ isCompleted: 1 })
        .where(eq(dailyBounties.id, bountyId));

      // 2. Reward user
      const rewardVal = parseInt(bounty.rewardValue);
      const updateData: any = {};
      if (bounty.rewardType === "xp") updateData.xp = sql`${users.xp} + ${rewardVal}`;
      else if (bounty.rewardType === "coin") updateData.coins = sql`${users.coins} + ${rewardVal}`;
      // Note: Gems aren't in the schema yet, but we can add or ignore for now
      
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userData!.id));

      // 3. Update local state
      setBounties(prev => prev.map(b => 
        b.id === bountyId ? { ...b, isCompleted: true } : b
      ));
      
      refetchUser(); // Refresh top UI stats
    } catch (error) {
      console.error("Error completing bounty:", error);
    }
  };

  const autoCheckBounties = useCallback(async (currentBounties: Bounty[]) => {
    if (!userData?.id || currentBounties.length === 0) return;

    let updated = false;
    const newBounties = [...currentBounties];

    for (let i = 0; i < newBounties.length; i++) {
      const bounty = newBounties[i];
      if (bounty.isCompleted) continue;

      let shouldComplete = false;

      // Logic for automatic completion
      if (bounty.task.toLowerCase().includes("profile")) {
        // Assume user has profile if we have userData
        if (userData.name && userData.email) shouldComplete = true;
      } else if (bounty.task.toLowerCase().includes("create") || bounty.task.toLowerCase().includes("explore")) {
        // Check if user has any courses
        const userCourses = await db
          .select()
          .from(courseEnrollments)
          .where(eq(courseEnrollments.userId, userData.id))
          .limit(1);
        if (userCourses.length > 0) shouldComplete = true;
      }

      if (shouldComplete) {
        // Reuse completeBounty logic without haptics for "auto" feel or add subtle feedback
        await db.update(dailyBounties)
          .set({ isCompleted: 1 })
          .where(eq(dailyBounties.id, bounty.id));
        
        newBounties[i] = { ...bounty, isCompleted: true };
        updated = true;
      }
    }

    if (updated) {
      setBounties(newBounties);
      refetchUser();
    }
  }, [userData?.id, userData?.name, userData?.email, refetchUser]);

  useEffect(() => {
    if (userData?.id) {
      fetchBounties();
    }
  }, [userData?.id, fetchBounties]);

  useEffect(() => {
    if (userData?.id && bounties.length > 0 && !isLoading) {
      autoCheckBounties(bounties);
    }
  }, [userData?.id, bounties.length, isLoading, autoCheckBounties]);

  return {
    bounties,
    isLoading,
    isGenerating,
    timeLeft,
    completeBounty,
    refresh: fetchBounties
  };
};
