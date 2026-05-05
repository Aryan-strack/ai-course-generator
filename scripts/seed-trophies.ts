import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const trophiesRef = collection(db, "trophies");

    for (const trophy of trophiesData) {
      // Check if trophy exists
      const q = query(trophiesRef, where("name", "==", trophy.name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Create new trophy
        await setDoc(doc(trophiesRef), trophy);
        console.log(`SEEDING_TROPHIES: Trophy "${trophy.name}" created`);
      } else {
        // Update existing trophy
        await setDoc(doc(db, "trophies", snapshot.docs[0].id), trophy);
        console.log(`SEEDING_TROPHIES: Trophy "${trophy.name}" updated`);
      }
    }

    console.log("SEEDING_TROPHIES: Successfully seeded/updated 7 trophies!");
  } catch (error) {
    console.error("SEEDING_ERROR:", error);
  }
}

seed();
