import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";

const databaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.error("EXPO_PUBLIC_DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle({ client: sql, schema });

const trophiesData = [
  {
    name: "First Voyage",
    description: "Enroll in your first course",
    icon: "rocket",
    conditionType: "course_count",
    conditionValue: 1,
    category: "Starter",
  },
  {
    name: "Grand Scholar",
    description: "Complete 5 chapters across any courses",
    icon: "magic-book",
    conditionType: "chapter_count",
    conditionValue: 5,
    category: "Educational",
  },
  {
    name: "Apex Graduate",
    description: "Finish your first full course",
    icon: "trophy",
    conditionType: "course_complete",
    conditionValue: 1,
    category: "Educational",
  },
  {
    name: "Treasure Hunter",
    description: "Collect 500 gold coins",
    icon: "coin-stack",
    conditionType: "coin_count",
    conditionValue: 500,
    category: "Wealth",
  },
  {
    name: "Vanguard",
    description: "Reach Level 5 to prove your dedication",
    icon: "shield",
    conditionType: "level",
    conditionValue: 5,
    category: "Rank",
  },
  {
    name: "The Polymath",
    description: "Enroll in courses from 3 different categories",
    icon: "crystal-ball",
    conditionType: "category_count",
    conditionValue: 3,
    category: "Educational",
  },
  {
    name: "XP Titan",
    description: "Earn a total of 2000 XP",
    icon: "lightning-bolt",
    conditionType: "xp",
    conditionValue: 2000,
    category: "Rank",
  },
];

async function seed() {
  console.log("SEEDING_TROPHIES: Starting...");

  try {
    for (const trophy of trophiesData) {
      await db
        .insert(schema.trophies)
        .values(trophy)
        .onConflictDoUpdate({
          target: schema.trophies.name,
          set: {
            description: trophy.description,
            icon: trophy.icon,
            conditionType: trophy.conditionType,
            conditionValue: trophy.conditionValue,
            category: trophy.category,
          },
        });
    }

    console.log("SEEDING_TROPHIES: Successfully seeded 7 trophies!");
  } catch (error) {
    console.error("SEEDING_ERROR:", error);
  }
}

seed();
