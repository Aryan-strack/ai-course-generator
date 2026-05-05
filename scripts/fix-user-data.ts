import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  updateDoc,
  doc,
  query 
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

async function fixUserData() {
  console.log("FIX_USER_DATA: Starting...");

  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      const currentLevel = user.level || 1;

      // Get requirements for next level
      const levelsRef = collection(db, "levels");
      const levelQuery = query(levelsRef, where("levelNumber", "==", currentLevel + 1));
      const levelSnapshot = await getDocs(levelQuery);

      if (!levelSnapshot.empty) {
        const nextLevel = levelSnapshot.docs[0].data();

        console.log(
          `Updating user ${user.name} (Level ${currentLevel}) -> nextLevel XP: ${nextLevel.xpRequired}, Coins: ${nextLevel.coinsRequired}`,
        );
        
        await updateDoc(doc(db, "users", userDoc.id), {
          nextLevelXp: nextLevel.xpRequired,
          nextLevelCoins: nextLevel.coinsRequired,
        });
      }
    }

    console.log("FIX_USER_DATA: Success!");
  } catch (err) {
    console.error("FIX_USER_DATA: Error", err);
  }
}

fixUserData();
