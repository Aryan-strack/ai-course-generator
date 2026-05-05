import { auth, db } from './firebase/config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const SESSION_TOKEN_KEY = 'session_token';
const SESSION_DURATION_DAYS = 30;

/**
 * Generate a cryptographically secure random token
 */
export async function generateSessionToken() {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password using SHA-256 (for legacy compatibility)
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a new user with email and password
 */
export async function signUpWithEmail(email, password, name) {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Create user document in Firestore
    const userData = {
      name: name,
      email: email,
      clerkId: null,
      imageUrl: null,
      xp: 0,
      coins: 0,
      level: 1,
      rank: 'Novice',
      nextLevelXp: 50,
      nextLevelCoins: 100,
      dailyStreak: 0,
      lastCheckIn: null,
      subscriptionStatus: 'free',
      bio: 'A mysterious wanderer in the cyber realm. Ready to learn and conquer.',
      guild: 'Freelancer',
      createdAt: serverTimestamp(),
      lastBountyUpdate: null,
      passwordHash: await hashPassword(password),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Generate and save session token
    const sessionToken = await generateSessionToken();
    await saveSessionToken(sessionToken, firebaseUser.uid);

    // Update profile with display name
    await updateProfile(firebaseUser, {
      displayName: name,
    });

    // Construct and return user object
    const newUser = {
      id: firebaseUser.uid,
      ...userData,
      sessionToken,
      createdAt: new Date(),
    };

    return { user: newUser, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    let errorMessage = 'Failed to create account';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'User with this email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password must be at least 6 characters';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get or create user document in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let userDoc = await getDoc(userDocRef);

    let userData;
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      userData = {
        name: firebaseUser.displayName || 'Hero',
        email: firebaseUser.email,
        clerkId: null,
        imageUrl: firebaseUser.photoURL || null,
        xp: 0,
        coins: 0,
        level: 1,
        rank: 'Novice',
        nextLevelXp: 50,
        nextLevelCoins: 100,
        dailyStreak: 0,
        lastCheckIn: null,
        subscriptionStatus: 'free',
        bio: 'A mysterious wanderer in the cyber realm. Ready to learn and conquer.',
        guild: 'Freelancer',
        createdAt: serverTimestamp(),
        lastBountyUpdate: null,
        passwordHash: await hashPassword(password),
      };
      await setDoc(userDocRef, userData);
    } else {
      userData = userDoc.data();
    }

    // Update last login time
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
    });

    // Generate new session token
    const sessionToken = await generateSessionToken();
    await saveSessionToken(sessionToken, firebaseUser.uid);

    // Construct and return user object
    const now = new Date();
    const user = {
      id: firebaseUser.uid,
      ...userData,
      sessionToken,
      createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : now,
      lastCheckIn: userData.lastCheckIn ? new Date(userData.lastCheckIn.seconds * 1000) : null,
      lastBountyUpdate: userData.lastBountyUpdate ? new Date(userData.lastBountyUpdate.seconds * 1000) : null,
    };

    return { user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    let errorMessage = 'Failed to sign in';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await clearSessionToken();
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

/**
 * Get the current session user from the stored token
 */
export async function getCurrentUser() {
  try {
    // Try to get user from Firebase Auth first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Check if we have a session token in storage
      const sessionToken = await getSessionToken();
      if (!sessionToken) return null;

      // Session exists but Firebase auth doesn't - need to re-authenticate
      // This can happen if the app was closed and reopened
      return null;
    }

    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    const sessionToken = await getSessionToken();

    // Verify session token matches
    if (!sessionToken) {
      return null;
    }

    const now = new Date();
    return {
      id: currentUser.uid,
      name: userData.name,
      email: userData.email,
      clerkId: userData.clerkId,
      imageUrl: userData.imageUrl,
      xp: userData.xp || 0,
      coins: userData.coins || 0,
      level: userData.level || 1,
      rank: userData.rank || 'Novice',
      nextLevelXp: userData.nextLevelXp || 50,
      nextLevelCoins: userData.nextLevelCoins || 100,
      dailyStreak: userData.dailyStreak || 0,
      lastCheckIn: userData.lastCheckIn ? new Date(userData.lastCheckIn.seconds * 1000) : null,
      subscriptionStatus: userData.subscriptionStatus || 'free',
      bio: userData.bio,
      guild: userData.guild,
      passwordHash: userData.passwordHash,
      sessionToken,
      createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : now,
      lastBountyUpdate: userData.lastBountyUpdate ? new Date(userData.lastBountyUpdate.seconds * 1000) : null,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Save session token to secure storage
 */
async function saveSessionToken(token, userId) {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
      await SecureStore.setItemAsync('user_id', userId);
    } else {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      localStorage.setItem('user_id', userId);
    }
  } catch (error) {
    console.error('Save session error:', error);
  }
}

/**
 * Get session token from secure storage
 */
async function getSessionToken() {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    } else {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Delete session token from storage
 */
export async function clearSessionToken() {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      await SecureStore.deleteItemAsync('user_id');
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem('user_id');
    }
  } catch (error) {
    console.error('Clear session error:', error);
  }
}

/**
 * Update Firestore user document
 */
export async function updateUserInFirestore(userId, updates) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Update user error:', error);
  }
}

/**
 * Get Firestore user document
 */
export async function getUserFromFirestore(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
