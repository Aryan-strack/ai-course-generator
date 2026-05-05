import {
  collection,
  query,
  where,
  and,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/utils/firebase/config";
import { Alert } from "react-native";
import { generateDailyBounties } from "./gemini";

export type GamificationAction =
  | "CREATE_COURSE"
  | "COMPLETE_CHAPTER"
  | "ACE_QUIZ"
  | "ENROLL_COURSE";

export async function handleGamificationAction(
  userId: string,
  action: GamificationAction,
  context?: string,
) {
  try {
    console.log(
      `Handling gamification action: ${action} for userId: ${userId} with context: ${context}`,
    );

    await checkAndCompleteBounties(userId, action);
    await checkAndUnlockTrophies(userId);

    if (action === "COMPLETE_CHAPTER" || action === "CREATE_COURSE") {
      await replenishBountiesIfNeeded(userId, context);
    }
  } catch (error) {
    console.error("Error handling gamification action: ", error);
  }
}

async function checkAndCompleteBounties(
  userId: string,
  action: GamificationAction,
) {
  const bountiesRef = collection(db, "dailyBounties");
  const activeBountiesQuery = query(
    bountiesRef,
    where("userId", "==", userId),
    where("isCompleted", "==", false)
  );
  const snapshot = await getDocs(activeBountiesQuery);

  for (const docSnap of snapshot.docs) {
    const bounty = docSnap.data();
    let isMatch = false;
    const task = (bounty.task || "").toLowerCase();

    switch (action) {
      case "CREATE_COURSE":
        if (
          task.includes("create") ||
          task.includes("forge") ||
          task.includes("new journey") ||
          task.includes("start")
        )
          isMatch = true;
        break;
      case "ENROLL_COURSE":
        if (
          task.includes("enroll") ||
          task.includes("explore") ||
          task.includes("start")
        )
          isMatch = true;
        break;
      case "COMPLETE_CHAPTER":
        if (
          task.includes("chapter") ||
          task.includes("complete") ||
          task.includes("finish") ||
          task.includes("module")
        )
          isMatch = true;
        break;
      case "ACE_QUIZ":
        if (
          task.includes("quiz") ||
          task.includes("ace") ||
          task.includes("perfect") ||
          task.includes("correct")
        )
          isMatch = true;
        break;
    }

    if (isMatch) {
      await updateDoc(doc(db, "dailyBounties", docSnap.id), {
        isCompleted: true,
      });

      await rewardUser(
        userId,
        parseInt(bounty.rewardValue || "0"),
        bounty.rewardType as "xp" | "coin" | "gem",
      );
      Alert.alert(
        "Bounty Completed! 🎯",
        `You earned ${bounty.rewardValue} ${bounty.rewardType} for: "${bounty.task}"`,
      );
    }
  }
}

async function replenishBountiesIfNeeded(
  userId: string,
  recentAchievement?: string,
) {
  const now = new Date();
  const bountiesRef = collection(db, "dailyBounties");
  const activeQuery = query(
    bountiesRef,
    where("userId", "==", userId),
    where("isCompleted", "==", false),
    where("expiresAt", ">", now)
  );
  const snapshot = await getDocs(activeQuery);

  const slotsNeeded = 3 - snapshot.size;

  if (slotsNeeded > 0) {
    console.log(
      `[BOUNTY] Generating ${slotsNeeded} new bounties for user ${userId}`,
    );

    // Fetch course titles for context
    const enrollmentsRef = collection(db, "courseEnrollments");
    const enrollmentsQuery = query(enrollmentsRef, where("userId", "==", userId));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const courseTitles: string[] = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const data = enrollmentDoc.data();
      const courseDoc = await getDoc(doc(db, "courses", data.courseId));
      if (courseDoc.exists()) {
        courseTitles.push(courseDoc.data().title);
      }
    }

    const newBountiesData = await generateDailyBounties(
      courseTitles,
      recentAchievement,
    );

    const toAdd = newBountiesData.slice(0, slotsNeeded);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    for (const data of toAdd) {
      await addDoc(bountiesRef, {
        userId,
        task: data.task,
        rewardValue: data.rewardValue,
        rewardType: data.rewardType,
        isCompleted: false,
        expiresAt,
        createdAt: serverTimestamp(),
      });
    }

    console.log(`[BOUNTY] Successfully added ${toAdd.length} new bounties.`);
  }
}

export async function checkAndUnlockTrophies(userId: string) {
  const trophiesRef = collection(db, "trophies");
  const allTrophiesSnapshot = await getDocs(trophiesRef);

  const userTrophiesRef = collection(db, "userTrophies");
  const earnedQuery = query(userTrophiesRef, where("userId", "==", userId));
  const earnedSnapshot = await getDocs(earnedQuery);
  const earnedTrophyIds = earnedSnapshot.docs.map(d => d.data().trophyId);

  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return;
  const userProfile = userDoc.data();

  for (const trophyDoc of allTrophiesSnapshot.docs) {
    const trophy = trophyDoc.data();
    if (earnedTrophyIds.includes(trophyDoc.id)) continue;

    let conditionMet = false;
    switch (trophy.conditionType) {
      case "level":
        if ((userProfile.level || 1) >= trophy.conditionValue) conditionMet = true;
        break;
      case "xp":
        if ((userProfile.xp || 0) >= trophy.conditionValue) conditionMet = true;
        break;
      case "coin_count":
        if ((userProfile.coins || 0) >= trophy.conditionValue) conditionMet = true;
        break;
      case "course_count":
        const enrollmentsRef = collection(db, "courseEnrollments");
        const q = query(enrollmentsRef, where("userId", "==", userId));
        const enrollmentsSnapshot = await getDocs(q);
        if (enrollmentsSnapshot.size >= trophy.conditionValue) conditionMet = true;
        break;
    }

    if (conditionMet) {
      await addDoc(userTrophiesRef, {
        userId,
        trophyId: trophyDoc.id,
        earnedAt: serverTimestamp(),
      });
      Alert.alert(
        "Hidden Gem Unlocked! 💎",
        `Congratulations! You've earned the "${trophy.name}" trophy.`,
      );
    }
  }
}

export async function rewardUser(
  userId: string,
  amount: number,
  type: "xp" | "coin" | "gem",
) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return;

  const user = userDoc.data();
  let newXp = user.xp || 0;
  let newCoins = user.coins || 0;

  if (type === "coin") {
    newCoins += amount;
  } else if (type === "xp") {
    newXp += amount;
  }

  // Check for level up
  let currentLevelNum = user.level || 1;
  let currentRank = user.rank || "Novice";
  let leveledUp = false;

  while (true) {
    const nextLevelNum = currentLevelNum + 1;
    const levelsRef = collection(db, "levels");
    const levelQuery = query(levelsRef, where("levelNumber", "==", nextLevelNum));
    const levelSnapshot = await getDocs(levelQuery);

    if (levelSnapshot.empty) break;

    const nextLevelData = levelSnapshot.docs[0].data();

    if (newXp >= (nextLevelData.xpRequired || 0) && newCoins >= (nextLevelData.coinsRequired || 0)) {
      currentLevelNum = nextLevelNum;
      currentRank = nextLevelData.rankName || currentRank;
      newCoins += nextLevelData.coinsReward || 0;
      leveledUp = true;
    } else {
      break;
    }
  }

  const updateData: any = {
    xp: newXp,
    coins: newCoins,
  };

  if (leveledUp) {
    updateData.level = currentLevelNum;
    updateData.rank = currentRank;

    const levelsRef = collection(db, "levels");
    const nextLevelQuery = query(levelsRef, where("levelNumber", "==", currentLevelNum + 1));
    const nextLevelSnapshot = await getDocs(nextLevelQuery);

    if (!nextLevelSnapshot.empty) {
      const nextLevelData = nextLevelSnapshot.docs[0].data();
      updateData.nextLevelXp = nextLevelData.xpRequired;
      updateData.nextLevelCoins = nextLevelData.coinsRequired;
    }

    Alert.alert(
      "LEVEL UP! 🚀",
      `Congratulations Hero! You are now Level ${currentLevelNum} (${currentRank})!`,
    );
  }

  await updateDoc(userRef, updateData);
}

// Helper to get a doc
async function getDoc(docRef: any) {
  const snap = await getDoc(docRef);
  return snap;
}
