import { db } from "@/db";
import {
    courseEnrollments,
    courses,
    dailyBounties,
    levels,
    trophies,
    users,
    userTrophies,
} from "@/db/schema";
import { and, count, eq, gt } from "drizzle-orm";
import { Alert } from "react-native";
import { generateDailyBounties } from "./gemini";

export type GamificationAction =
  | "CREATE_COURSE"
  | "COMPLETE_CHAPTER"
  | "ACE_QUIZ"
  | "ENROLL_COURSE";

export async function handleGamificationAction(
  userId: number,
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
  userId: number,
  action: GamificationAction,
) {
  const activeBounties = await db
    .select()
    .from(dailyBounties)
    .where(
      and(eq(dailyBounties.userId, userId), eq(dailyBounties.isCompleted, 0)),
    );

  for (const bounty of activeBounties) {
    let isMatch = false;
    const task = bounty.task.toLowerCase();

    // Fuzzy matching for AI generated tasks
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
      await db
        .update(dailyBounties)
        .set({ isCompleted: 1 })
        .where(eq(dailyBounties.id, bounty.id));

      await rewardUser(
        userId,
        parseInt(bounty.rewardValue),
        bounty.rewardType as "xp" | "coin",
      );
      Alert.alert(
        "Bounty Completed! 🎯",
        `You earned ${bounty.rewardValue} ${bounty.rewardType} for: "${bounty.task}"`,
      );
    }
  }
}

async function replenishBountiesIfNeeded(
  userId: number,
  recentAchievement?: string,
) {
  const now = new Date();
  const activeBounties = await db
    .select()
    .from(dailyBounties)
    .where(
      and(
        eq(dailyBounties.userId, userId),
        eq(dailyBounties.isCompleted, 0),
        gt(dailyBounties.expiresAt, now),
      ),
    );

  const slotsNeeded = 3 - activeBounties.length;

  if (slotsNeeded > 0) {
    console.log(
      `[BOUNTY] Generating ${slotsNeeded} new bounties for user ${userId}`,
    );

    // Fetch course titles for context
    const userEnrollments = await db
      .select({ title: courses.title })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, userId));

    const courseTitles = userEnrollments.map((c) => c.title);
    const newBountiesData = await generateDailyBounties(
      courseTitles,
      recentAchievement,
    );

    // Take only what's needed to fill to 3
    const toAdd = newBountiesData.slice(0, slotsNeeded);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Fresh AI bounties last 24h

    for (const data of toAdd) {
      await db.insert(dailyBounties).values({
        userId,
        task: data.task,
        rewardValue: data.rewardValue,
        rewardType: data.rewardType,
        isCompleted: 0,
        expiresAt,
      });
    }

    console.log(`[BOUNTY] Successfully added ${toAdd.length} new bounties.`);
  }
}

export async function checkAndUnlockTrophies(userId: number) {
  const allTrophies = await db.select().from(trophies);
  const earnedTrophyIds = (
    await db
      .select({ id: userTrophies.trophyId })
      .from(userTrophies)
      .where(eq(userTrophies.userId, userId))
  ).map((t) => t.id);

  const [userProfile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!userProfile) return;

  for (const trophy of allTrophies) {
    if (earnedTrophyIds.includes(trophy.id)) continue;

    let conditionMet = false;
    switch (trophy.conditionType) {
      case "level":
        if (userProfile.level >= trophy.conditionValue) conditionMet = true;
        break;
      case "xp":
        if (userProfile.xp >= trophy.conditionValue) conditionMet = true;
        break;
      case "coin_count":
        if (userProfile.coins >= trophy.conditionValue) conditionMet = true;
        break;
      case "course_count":
        const enrollments = await db
          .select({ count: count() })
          .from(courseEnrollments)
          .where(eq(courseEnrollments.userId, userId));
        if (enrollments[0].count >= trophy.conditionValue) conditionMet = true;
        break;
      // Add more cases as needed (chapter_count etc.)
    }

    if (conditionMet) {
      await db.insert(userTrophies).values({
        userId: userId,
        trophyId: trophy.id,
      });
      Alert.alert(
        "Hidden Gem Unlocked! 💎",
        `Congratulations! You've earned the "${trophy.name}" trophy.`,
      );
    }
  }
}

export async function rewardUser(
  userId: number,
  amount: number,
  type: "xp" | "coin",
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return;

  let newXp = user.xp;
  let newCoins = user.coins;

  if (type === "coin") {
    newCoins += amount;
  } else if (type === "xp") {
    newXp += amount;
  }

  // Update initial balance
  await db
    .update(users)
    .set({
      xp: newXp,
      coins: newCoins,
    })
    .where(eq(users.id, userId));

  // Check for level up
  let currentLevelNum = user.level;
  let currentRank = user.rank;
  let leveledUp = false;

  // Iterate to handle multiple level ups if possible
  while (true) {
    const nextLevelNum = currentLevelNum + 1;
    const [nextLevelData] = await db
      .select()
      .from(levels)
      .where(eq(levels.levelNumber, nextLevelNum))
      .limit(1);

    if (!nextLevelData) break; // Max level reached

    // BOTH XP and COINS must meet requirements
    if (
      newXp >= nextLevelData.xpRequired &&
      newCoins >= nextLevelData.coinsRequired
    ) {
      currentLevelNum = nextLevelNum;
      currentRank = nextLevelData.rankName;
      newCoins += nextLevelData.coinsReward; // Give level up reward
      leveledUp = true;
    } else {
      break;
    }
  }

  if (leveledUp) {
    // Get info for the NEW next level after leveling up
    const [newNextLevel] = await db
      .select()
      .from(levels)
      .where(eq(levels.levelNumber, currentLevelNum + 1))
      .limit(1);

    await db
      .update(users)
      .set({
        level: currentLevelNum,
        rank: currentRank,
        coins: newCoins, // Includes rewards
        nextLevelXp: newNextLevel ? newNextLevel.xpRequired : user.nextLevelXp,
        nextLevelCoins: newNextLevel
          ? newNextLevel.coinsRequired
          : user.nextLevelCoins,
      })
      .where(eq(users.id, userId));

    Alert.alert(
      "LEVEL UP! 🚀",
      `Congratulations Hero! You are now Level ${currentLevelNum} (${currentRank})!`,
    );
  }
}
