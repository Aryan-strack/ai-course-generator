import { useState, useEffect, useCallback } from "react";
import { db } from "@/db";
import { users, trophies, userTrophies, courseEnrollments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { useUser } from "@clerk/expo";
import { useUserData } from "./useUserData";

export interface RankingUser {
  id: number;
  name: string;
  xp: number;
  level: number;
  imageUrl: string | null;
  rank: number;
}

export interface TrophyWithStatus {
  id: number;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedAt: Date | null;
}

export interface LearningAnalytics {
  coursesEnrolled: number;
  coursesCompleted: number;
  quizzesCompleted: number;
}

export const useStats = () => {
  const { user } = useUser();
  const { userData, refetch: refetchUser } = useUserData();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [allTrophies, setAllTrophies] = useState<TrophyWithStatus[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [learningAnalytics, setLearningAnalytics] = useState<LearningAnalytics>({ coursesEnrolled: 0, coursesCompleted: 0, quizzesCompleted: 0 });
  const [recentTrophies, setRecentTrophies] = useState<TrophyWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user || !userData) {
        setIsLoading(false);
        return;
    };

    try {
      setIsLoading(true);

      // 1. Fetch Rankings (Top 10)
      const topUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.xp))
        .limit(10);

      const formattedRankings = topUsers.map((u, index) => ({
        id: u.id,
        name: u.name,
        xp: u.xp,
        level: u.level,
        imageUrl: u.imageUrl,
        rank: index + 1,
      }));

      setRankings(formattedRankings);

      // 2. Fetch All Trophies with Earned Status
      const allTrophiesList = await db.select().from(trophies);
      const earnedTrophies = await db
        .select()
        .from(userTrophies)
        .where(eq(userTrophies.userId, userData.id));

      const trophiesWithStatus = allTrophiesList.map((t) => {
        const earned = earnedTrophies.find((et) => et.trophyId === t.id);
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          icon: t.icon,
          isEarned: !!earned,
          earnedAt: earned ? new Date(earned.earnedAt) : null,
        };
      });

      setAllTrophies(trophiesWithStatus);

      // 3. Find current user rank
      const [rankResult] = await db
        .select({
          rank: sql<number>`count(*) + 1`,
        })
        .from(users)
        .where(sql`${users.xp} > ${userData.xp}`);
    
      setCurrentUserRank(Number(rankResult?.rank || 1));

      // 4. Fetch Learning Analytics
      const enrollments = await db
        .select()
        .from(courseEnrollments)
        .where(eq(courseEnrollments.userId, userData.id));

      let coursesEnrolled = enrollments.length;
      let coursesCompleted = enrollments.filter(e => e.isCompleted === 1).length;
      let quizzesCompleted = 0;

      enrollments.forEach(e => {
        try {
          const quizzes = JSON.parse(e.completedQuizzes || '[]');
          quizzesCompleted += quizzes.length;
        } catch (err) {}
      });

      setLearningAnalytics({ coursesEnrolled, coursesCompleted, quizzesCompleted });

      // 5. Derive Recent Trophies
      const recent = trophiesWithStatus
        .filter(t => t.isEarned)
        .sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0))
        .slice(0, 3);
      setRecentTrophies(recent);

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, userData]);

  const handleCheckIn = async () => {
    if (!userData) return { success: false };

    const now = new Date();
    const lastCheckIn = userData.lastCheckIn ? new Date(userData.lastCheckIn) : null;
    
    // Check if already checked in today
    if (lastCheckIn) {
      const isToday = 
        lastCheckIn.getDate() === now.getDate() &&
        lastCheckIn.getMonth() === now.getMonth() &&
        lastCheckIn.getFullYear() === now.getFullYear();
      
      if (isToday) return { success: true, alreadyCheckedIn: true };
    }

    // Determine if streak should continue or reset
    let newStreak = 1;
    if (lastCheckIn) {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      
      const wasYesterday = 
        lastCheckIn.getDate() === yesterday.getDate() &&
        lastCheckIn.getMonth() === yesterday.getMonth() &&
        lastCheckIn.getFullYear() === yesterday.getFullYear();
      
      if (wasYesterday) {
        newStreak = userData.dailyStreak + 1;
      }
    }

    try {
      await db
        .update(users)
        .set({
          dailyStreak: newStreak,
          lastCheckIn: now,
          xp: userData.xp + 5, // 5 XP reward
          coins: userData.coins + 50, // 50 coin reward
        })
        .where(eq(users.id, userData.id));
      
      await refetchUser();
      await fetchStats();
      return { success: true, streak: newStreak };
    } catch (err) {
      console.error("Check-in error:", err);
      return { success: false };
    }
  };

  useEffect(() => {
    if (userData) {
      fetchStats();
    }
  }, [userData, fetchStats]);

  return {
    rankings,
    allTrophies,
    recentTrophies,
    learningAnalytics,
    currentUserRank,
    isLoading,
    handleCheckIn,
    refetchStats: fetchStats,
  };
};
