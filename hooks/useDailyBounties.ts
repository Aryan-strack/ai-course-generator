import { useEffect, useState, useCallback } from "react";
import { db } from "@/utils/firebase/config";
import { collection, query, where, gt, doc, getDocs, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useUserData } from "./useUserData";
import { generateDailyBounties, GeneratedBounty } from "@/utils/gemini";
import * as Haptics from "expo-haptics";

export interface Bounty extends GeneratedBounty {
  id: string;
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
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  };

  const fetchBounties = useCallback(async () => {
    if (!userData?.id) return;

    try {
      setIsLoading(true);

      const now = new Date();
      const bountiesRef = collection(db, "dailyBounties");
      
      // 1. Check for existing non-expired bounties
      const q = query(
        bountiesRef,
        where("userId", "==", userData.id),
        where("expiresAt", ">", now)
      );
      const existingSnapshot = await getDocs(q);

      if (!existingSnapshot.empty) {
        const bountiesList = existingSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isCompleted: data.isCompleted || false,
            expiresAt: data.expiresAt instanceof Date ? data.expiresAt : 
                       (data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)),
            rewardType: data.rewardType as "xp" | "coin" | "gem"
          };
        }) as Bounty[];
        setBounties(bountiesList);
        updateTimer(bountiesList[0].expiresAt);
      } else {
        // 2. Refresh needed - Check for course enrollments
        const enrollmentsRef = collection(db, "courseEnrollments");
        const userEnrollmentsQuery = query(
          enrollmentsRef,
          where("userId", "==", userData.id)
        );
        const userEnrollmentsSnapshot = await getDocs(userEnrollmentsQuery);

        let newBountiesData: GeneratedBounty[];
        
        if (userEnrollmentsSnapshot.empty) {
          // Use hardcoded defaults for new users - NO GENERATION
          newBountiesData = DEFAULT_BOUNTIES;
        } else {
          // 3. GENERATION REQUIRED
          setIsGenerating(true);
          try {
            // Fetch course titles for Gemini context
            const courseTitles: string[] = [];
            for (const enrollmentDoc of userEnrollmentsSnapshot.docs) {
              const data = enrollmentDoc.data();
              const courseDoc = await getDoc(doc(db, "courses", data.courseId));
              if (courseDoc.exists()) {
                courseTitles.push(courseDoc.data().title);
              }
            }
            newBountiesData = await generateDailyBounties(courseTitles);
          } finally {
            setIsGenerating(false);
          }
        }
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + REFRESH_INTERVAL_HOURS);

        // 4. Save to Firestore
        const insertedBounties: Bounty[] = [];
        for (const data of newBountiesData) {
          const bountyRef = await addDoc(bountiesRef, {
            userId: userData.id,
            task: data.task,
            rewardValue: data.rewardValue,
            rewardType: data.rewardType,
            isCompleted: false,
            expiresAt: expiresAt,
            createdAt: serverTimestamp(),
          });
          insertedBounties.push({
            id: bountyRef.id,
            ...data,
            isCompleted: false,
            rewardType: data.rewardType as "xp" | "coin" | "gem",
            expiresAt: expiresAt,
          });
        }

        // Update user's last refresh time
        const userRef = doc(db, "users", userData.id);
        await updateDoc(userRef, {
          lastBountyUpdate: expiresAt,
        });

        setBounties(insertedBounties);
        updateTimer(expiresAt);
      }
    } catch (error) {
      console.error("Error in useDailyBounties:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id]);

  const completeBounty = async (bountyId: string) => {
    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty || bounty.isCompleted) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 1. Update bounty in Firestore
      await updateDoc(doc(db, "dailyBounties", bountyId), {
        isCompleted: true,
      });

      // 2. Reward user
      const userRef = doc(db, "users", userData!.id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentUser = userDoc.data();
        const rewardVal = parseInt(bounty.rewardValue);
        const updateData: any = {};
        
        if (bounty.rewardType === "xp") {
          updateData.xp = (currentUser.xp || 0) + rewardVal;
        } else if (bounty.rewardType === "coin") {
          updateData.coins = (currentUser.coins || 0) + rewardVal;
        } else if (bounty.rewardType === "gem") {
          updateData.gems = (currentUser.gems || 0) + rewardVal;
        }
        
        await updateDoc(userRef, updateData);
      }

      // 3. Update local state
      setBounties(prev => prev.map(b => 
        b.id === bountyId ? { ...b, isCompleted: true } : b
      ));
      
      refetchUser();
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

      if (bounty.task.toLowerCase().includes("profile")) {
        if (userData.name && userData.email) shouldComplete = true;
      } else if (bounty.task.toLowerCase().includes("create") || bounty.task.toLowerCase().includes("explore")) {
        const enrollmentsRef = collection(db, "courseEnrollments");
        const q = query(enrollmentsRef, where("userId", "==", userData.id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) shouldComplete = true;
      }

      if (shouldComplete) {
        await updateDoc(doc(db, "dailyBounties", bounty.id), {
          isCompleted: true,
        });
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
