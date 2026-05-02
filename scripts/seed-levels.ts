import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";

// Load the DB URL from env
const databaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.error("EXPO_PUBLIC_DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle({ client: sql, schema });

const gameLevels = [
  {
    levelNumber: 1,
    xpRequired: 0,
    coinsRequired: 0,
    rankName: "Novice",
    coinsReward: 0,
  },
  {
    levelNumber: 2,
    xpRequired: 50,
    coinsRequired: 100,
    rankName: "Apprentice",
    coinsReward: 50,
  },
  {
    levelNumber: 3,
    xpRequired: 125,
    coinsRequired: 250,
    rankName: "Squire",
    coinsReward: 75,
  },
  {
    levelNumber: 4,
    xpRequired: 250,
    coinsRequired: 500,
    rankName: "Knight",
    coinsReward: 100,
  },
  {
    levelNumber: 5,
    xpRequired: 450,
    coinsRequired: 1000,
    rankName: "Warrior",
    coinsReward: 150,
  },
  {
    levelNumber: 6,
    xpRequired: 750,
    coinsRequired: 2000,
    rankName: "Veteran",
    coinsReward: 200,
  },
  {
    levelNumber: 7,
    xpRequired: 1250,
    coinsRequired: 3500,
    rankName: "Master",
    coinsReward: 300,
  },
  {
    levelNumber: 8,
    xpRequired: 2000,
    coinsRequired: 5500,
    rankName: "Grandmaster",
    coinsReward: 450,
  },
  {
    levelNumber: 9,
    xpRequired: 3000,
    coinsRequired: 8000,
    rankName: "Legend",
    coinsReward: 600,
  },
  {
    levelNumber: 10,
    xpRequired: 4500,
    coinsRequired: 12000,
    rankName: "Mythic",
    coinsReward: 800,
  },
  {
    levelNumber: 11,
    xpRequired: 6500,
    coinsRequired: 18000,
    rankName: "Ancient",
    coinsReward: 1000,
  },
  {
    levelNumber: 12,
    xpRequired: 9000,
    coinsRequired: 25000,
    rankName: "Immortal",
    coinsReward: 1250,
  },
  {
    levelNumber: 13,
    xpRequired: 12500,
    coinsRequired: 35000,
    rankName: "Divine",
    coinsReward: 1500,
  },
  {
    levelNumber: 14,
    xpRequired: 17500,
    coinsRequired: 50000,
    rankName: "Radiant",
    coinsReward: 2000,
  },
  {
    levelNumber: 15,
    xpRequired: 25000,
    coinsRequired: 75000,
    rankName: "Ethereal",
    coinsReward: 2500,
  },
  {
    levelNumber: 16,
    xpRequired: 37500,
    coinsRequired: 110000,
    rankName: "Celestial",
    coinsReward: 3200,
  },
  {
    levelNumber: 17,
    xpRequired: 55000,
    coinsRequired: 160000,
    rankName: "Cosmic",
    coinsReward: 4000,
  },
  {
    levelNumber: 18,
    xpRequired: 80000,
    coinsRequired: 250000,
    rankName: "Transcendent",
    coinsReward: 5000,
  },
  {
    levelNumber: 19,
    xpRequired: 125000,
    coinsRequired: 400000,
    rankName: "GodMode",
    coinsReward: 7500,
  },
  {
    levelNumber: 20,
    xpRequired: 250000,
    coinsRequired: 750000,
    rankName: "Ascended",
    coinsReward: 10000,
  },
];

async function seed() {
  console.log("SEEDING_LEVELS: Starting...");

  try {
    // Clear existing levels first to avoid conflicts if re-running
    // await db.delete(schema.levels);

    // Insert new data
    for (const level of gameLevels) {
      await db
        .insert(schema.levels)
        .values(level)
        .onConflictDoUpdate({
          target: schema.levels.levelNumber,
          set: {
            xpRequired: level.xpRequired,
            coinsRequired: level.coinsRequired,
            rankName: level.rankName,
            coinsReward: level.coinsReward,
          },
        });
    }

    console.log("SEEDING_LEVELS: Successfully seeded 20 levels!");
  } catch (error) {
    console.error("SEEDING_ERROR:", error);
  }
}

seed();
