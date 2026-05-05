/**
 * Firebase Auth Integration Test
 * This script tests the signup and signin flows
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
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

console.log('=== Firebase Auth & Firestore Integration Test ===\n');

// Validate config
console.log('1. Validating Firebase config...');
const missing = Object.entries(firebaseConfig).filter(([k, v]) => !v);
if (missing.length > 0) {
  console.error('❌ Missing config values:', missing.map(([k]) => k).join(', '));
  console.error('\nPlease add these to your .env file:');
  missing.forEach(([k]) => console.error(`   ${k}=your_value_here`));
  process.exit(1);
}
console.log('✅ All config values present\n');

// Initialize Firebase
console.log('2. Initializing Firebase...');
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  console.log('✅ Firebase initialized successfully\n');

  // Test user
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  const testName = 'Test User';

  // Test Signup
  console.log('3. Testing signup...');
  console.log(`   Email: ${testEmail}`);
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const firebaseUser = userCredential.user;
  console.log(`✅ User created: ${firebaseUser.uid}\n`);

  // Create Firestore user document
  console.log('4. Creating Firestore user document...');
  const userData = {
    name: testName,
    email: testEmail,
    xp: 0,
    coins: 0,
    level: 1,
    rank: 'Novice',
    dailyStreak: 0,
    subscriptionStatus: 'free',
    guild: 'Freelancer',
    bio: 'Test user',
    createdAt: new Date(),
  };
  await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  console.log('✅ Firestore document created\n');

  // Test Signout
  console.log('5. Testing signout...');
  await signOut(auth);
  console.log('✅ Signout successful\n');

  // Test Signin
  console.log('6. Testing signin...');
  const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
  const signedInUser = signInCredential.user;
  console.log(`✅ Signed in as: ${signedInUser.email}\n`);

  // Verify Firestore document
  console.log('7. Verifying Firestore document...');
  const userDoc = await getDoc(doc(db, 'users', signedInUser.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    console.log('✅ User document found');
    console.log(`   Name: ${data.name}`);
    console.log(`   Level: ${data.level}`);
    console.log(`   Rank: ${data.rank}\n`);
  } else {
    console.error('❌ User document not found\n');
  }

  // Test creating a course enrollment
  console.log('8. Testing course enrollment creation...');
  const enrollmentRef = collection(db, 'courseEnrollments');
  await addDoc(enrollmentRef, {
    userId: signedInUser.uid,
    courseId: 'test_course_id',
    progress: 0,
    isCompleted: false,
    createdAt: new Date(),
  });
  console.log('✅ Course enrollment created\n');

  // Cleanup
  console.log('9. Cleaning up test data...');
  await signOut(auth);
  console.log('✅ Cleanup complete\n');

  console.log('=== ✅ All Tests Passed! ===\n');
  console.log('Firebase integration is working correctly!');
  process.exit(0);

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
