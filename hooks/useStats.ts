import { useState, useEffect, useCallback } from "react";
import { db } from "@/utils/firebase/config";
import { collection, query, orderBy, getDocs, limit, where, updateDoc, doc, getCountFromServer } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useUserData } from "./useUserData";

export interface RankingUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  imageUrl: string | null;
  rank: number;
}

export interface TrophyWithStatus {
  id: string;
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
  const { user, isSignedIn, isLoading: authLoading } = useAuth();
  const { userData, refetch: refetchUser } = useUserData();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [allTrophies, setAllTrophies] = useState<TrophyWithStatus[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [learningAnalytics, setLearningAnalytics] = useState<LearningAnalytics>({ coursesEnrolled: 0, coursesCompleted: 0, quizzesCompleted: 0 });
  const [recentTrophies, setRecentTrophies] = useState<TrophyWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!isSignedIn || !userData) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Fetch Rankings (Top 10)
      const usersRef = collection(db, "users");
      const topUsersQuery = query(usersRef, orderBy("xp", "desc"), limit(10));
      const topUsersSnapshot = await getDocs(topUsersQuery);

      const formattedRankings = topUsersSnapshot.docs.map((doc, index) => {
        const u = doc.data();
        return {
          id: doc.id,
          name: u.name,
          xp: u.xp || 0,
          level: u.level || 1,
          imageUrl: u.imageUrl || null,
          rank: index + 1,
        };
      });

      setRankings(formattedRankings);

      // 2. Fetch All Trophies with Earned Status
      const trophiesRef = collection(db, "trophies");
      const trophiesSnapshot = await getDocs(trophiesRef);

      const userTrophiesRef = collection(db, "userTrophies");
      const userTrophiesQuery = query(userTrophiesRef, where("userId", "==", userData.id));
      const userTrophiesSnapshot = await getDocs(userTrophiesQuery);

      const earnedTrophies = userTrophiesSnapshot.docs.map(doc => ({ 
        trophyId: doc.data().trophyId, 
        earnedAt: doc.data().earnedAt 
      }));

      const trophiesWithStatus = trophiesSnapshot.docs.map(doc => {
        const t = doc.data();
        const earned = earnedTrophies.find(et => et.trophyId === doc.id);
        return {
          id: doc.id,
          name: t.name,
          description: t.description,
          icon: t.icon,
          isEarned: !!earned,
          earnedAt: earned?.earnedAt ? new Date(earned.earnedAt.seconds * 1000) : null,
        };
      });

      setAllTrophies(trophiesWithStatus);

      // 3. Find current user rank
      const allUsersQuery = query(usersRef, orderBy("xp", "desc"));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      let rank = 1;
      for (let i = 0; i < allUsersSnapshot.docs.length; i++) {
        const u = allUsersSnapshot.docs[i].data();
        if (u.xp > userData.xp) {
          rank++;
        } else {
          break;
        }
      }
      setCurrentUserRank(rank);

      // 4. Fetch Learning Analytics
      const enrollmentsRef = collection(db, "courseEnrollments");
      const userEnrollmentsQuery = query(enrollmentsRef, where("userId", "==", userData.id));
      const enrollmentsSnapshot = await getDocs(userEnrollmentsQuery);

      let coursesEnrolled = enrollmentsSnapshot.size;
      let coursesCompleted = 0;
      let quizzesCompleted = 0;

      enrollmentsSnapshot.forEach(doc => {
        const e = doc.data();
        if (e.isCompleted) coursesCompleted++;
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
      const userRef = doc(db, "users", userData.id);
      await updateDoc(userRef, {
        dailyStreak: newStreak,
        lastCheckIn: now,
        xp: userData.xp + 5,
        coins: userData.coins + 50,
      });
      
      await refetchUser();
      await fetchStats();
      return { success: true, streak: newStreak };
    } catch (err) {
      console.error("Check-in error:", err);
      return { success: false };
    }
  };

  useEffect(() => {
    if (userData && isSignedIn) {
      fetchStats();
    }
  }, [userData, fetchStats, isSignedIn]);

  return {
    rankings,
    allTrophies,
    recentTrophies,
    learningAnalytics,
    currentUserRank,
    isLoading: isLoading || authLoading,
    handleCheckIn,
    refetchStats: fetchStats,
  };
};
