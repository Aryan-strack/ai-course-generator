import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";

const databaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.error("EXPO_PUBLIC_DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle({ client: sql, schema });

async function fixUserData() {
  console.log("FIX_USER_DATA: Starting...");

  try {
    const allUsers = await db.select().from(schema.users);

    for (const user of allUsers) {
      // Get requirements for next level
      const [nextLevel] = await db
        .select()
        .from(schema.levels)
        .where(eq(schema.levels.levelNumber, user.level + 1))
        .limit(1);

      if (nextLevel) {
        console.log(
          `Updating user ${user.name} (Level ${user.level}) -> nextLevel XP: ${nextLevel.xpRequired}, Coins: ${nextLevel.coinsRequired}`,
        );
        await db
          .update(schema.users)
          .set({
            nextLevelXp: nextLevel.xpRequired,
            nextLevelCoins: nextLevel.coinsRequired,
          })
          .where(eq(schema.users.id, user.id));
      }
    }

    console.log("FIX_USER_DATA: Success!");
  } catch (err) {
    console.error("FIX_USER_DATA: Error", err);
  }
}

fixUserData();
