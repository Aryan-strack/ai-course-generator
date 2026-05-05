# Database Migration: NeonDB → Firebase

## Summary
Replaced NeonDB (PostgreSQL) and Drizzle ORM with **Firebase Authentication** and **Cloud Firestore** for improved reliability, real-time capabilities, and easier setup.

## What Changed

### 1. Dependencies Removed
- `@neondatabase/serverless` - No longer needed
- `drizzle-orm` - Replaced with Firebase SDK
- `bcryptjs` - No longer needed (Firebase handles password hashing)
- `pg` (transitive dependency)

### 2. Dependencies Added
- `firebase` ^11.1.0 - Official Firebase SDK

### 3. Files Created

#### `firebase/config.js`
- Firebase app initialization
- Auth initialization with persistence
- Firestore initialization with offline persistence
- Exports `app`, `auth`, and `db` instances

#### `utils/firebase-auth.ts`
- `signUpWithEmail()` - Creates Firebase Auth user + Firestore document
- `signInWithEmail()` - Signs in and syncs user data
- `signOut()` - Clears session and signs out
- `getCurrentUser()` - Gets authenticated user from cache/DB
- `clearSessionToken()` / `saveSessionToken()` - Session management
- `updateUserInFirestore()` / `getUserFromFirestore()` - User data CRUD

#### `FIREBASE_SETUP.md`
- Complete Firebase setup guide
- Firestore collection schemas
- Security rules examples
- Troubleshooting guide

### 4. Files Modified

#### `package.json`
- Removed: `bcryptjs`, `@neondatabase/serverless`, `drizzle-orm`
- Added: `firebase` ^11.1.0

#### `context/AuthContext.tsx`
- Import from `@/utils/firebase-auth` instead of `@/utils/auth`
- Changed `User.id` type from `number` → `string` (Firebase UID)
- Added `onAuthStateChanged` listener for real-time auth state
- Added `isInitialized` ref to prevent double initialization
- Added `lastBountyUpdate` field to User interface

#### `utils/auth.ts` (REMOVED)
- Deleted entirely, replaced by `utils/firebase-auth.ts`

#### `hooks/useSyncUser.ts`
- Replaced Drizzle ORM queries with Firestore operations
- Uses `doc()`, `getDoc()`, `setDoc()`, `updateDoc()`
- Removed duplicate user creation logic

#### `hooks/useUserData.ts`
- Changed `id: number` → `id: string`
- Updated Firestore document fetch with type conversions
- Properly converts Firestore timestamps to Date objects

#### `hooks/useEnrolledCourses.ts`
- Replaced SQL joins with sequential Firestore queries
- Added `getDoc` import for fetching course details
- Type conversions for Firestore timestamps

#### `hooks/useActiveCourse.ts`
- Changed ID types from `number` → `string`
- Replaced Drizzle queries with Firestore collections
- Uses `where()` clauses for filtering

#### `hooks/useStats.ts`
- Replaced all Drizzle ORM queries with Firestore operations
- Changed ranking calculation to client-side (Firestore doesn't support window functions)
- Added proper Firestore timestamp conversions
- `currentUserRank` calculated by fetching all users ordered by XP

#### `hooks/useDailyBounties.ts`
- Complete rewrite for Firestore
- Replaced Drizzle `and()`, `gt()`, `eq()` with Firestore `where()`
- Uses `addDoc()` instead of `db.insert().returning()`
- Firestore timestamp handling for `expiresAt`
- Reward calculation uses document updates instead of SQL expressions

#### `utils/course.ts`
- Complete rewrite of `forgeCourse()` for Firestore
- Uses `doc()`, `setDoc()`, `addDoc()` instead of Drizzle insert
- Firestore `serverTimestamp()` for automatic timestamps
- Sequential document creation (no transactions needed for this use case)

#### `utils/gamification.ts`
- Complete rewrite for Firestore
- Replaced all Drizzle queries with Firestore operations
- Firestore `increment()` support for atomic updates
- Uses `where()` clauses for filtering
- Client-side filtering for complex queries

#### `app/_layout.tsx`
- Removed unused `useSyncUser` import (moved functionality into AuthProvider)

#### `scripts/seed-levels.ts`
- Complete rewrite for Firestore
- Uses Firebase Admin SDK pattern
- Checks for existing documents before creating/updating

#### `scripts/seed-trophies.ts`
- Complete rewrite for Firestore
- Firestore document upsert pattern

#### `scripts/fix-user-data.ts`
- Complete rewrite for Firestore
- Iterates through users and updates next level requirements

#### `.env`
- Added Firebase config variables:
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`

#### `test-firebase.js` (NEW)
- Integration test for Firebase Auth + Firestore
- Tests signup, signin, signout flows
- Verifies Firestore document creation
- Tests course enrollment creation

## Database Schema Changes

### Collection: users
- `id` is now a **string** (Firebase UID) instead of auto-increment integer
- All timestamp fields use Firestore Timestamp type
- Default values applied at application level or via Firestore rules

### Collection: courseEnrollments
- `id` is now auto-generated Firestore document ID
- `userId` and `courseId` are strings (Firebase UIDs / Firestore doc IDs)
- `progress`, `isCompleted` use proper types (no 0/1 conversion)

### Collection: courses, chapters, subtopics, quizzes
- All IDs are Firestore auto-generated document IDs
- Timestamps use Firestore Timestamp type

### Collections: levels, trophies, dailyBounties, userTrophies
- Similar ID and timestamp changes
- `isCompleted` uses boolean instead of 0/1

## Key Benefits

1. **Real-time Updates**: Firestore automatically syncs data across clients
2. **Offline Support**: Built-in offline persistence for all operations
3. **Simplified Auth**: Firebase Auth handles password hashing, session management
4. **No Database Maintenance**: Fully managed backend by Google
5. **Scalability**: Automatic scaling without configuration
6. **Security**: Granular Firestore security rules
7. **Faster Development**: No SQL schema migrations needed

## Migration Steps for Existing Users

1. **Export NeonDB data** to JSON/CSV
2. **Create Firebase project** and enable Firestore
3. **Write migration script** to transform SQL rows → Firestore documents
4. **Update user IDs** in all collections to match Firebase Auth UIDs
5. **Import data** using Firebase Admin SDK or CLI
6. **Test thoroughly** before switching DNS/updating client

## Testing

Run the Firebase integration test:
```bash
node test-firebase.js
```

This verifies:
- Firebase configuration is correct
- Authentication flows work
- Firestore reads/writes succeed
- Data transformations are correct

## Known Differences

1. **No SQL joins**: Need to fetch documents separately or duplicate data
2. **No transactions across collections**: Use batched writes for atomic multi-document updates
3. **No complex aggregations**: Calculate rankings/counts client-side or use Cloud Functions
4. **ID type change**: All IDs are now strings, not numbers
5. **Case-sensitive queries**: Firestore field names and values are case-sensitive

## Performance Notes

- Firestore charges by read/write/delete operations
- Consider caching frequently accessed data
- Use composite indexes for complex queries
- Enable offline persistence for better UX
- Batch writes when possible to reduce operations

## Security Considerations

1. Update Firestore rules before production deployment
2. Enable App Check to prevent abuse
3. Use Firebase Authentication for all user operations
4. Validate all inputs on the client side
5. Implement rate limiting for sensitive operations

## Future Improvements

- Add Cloud Functions for server-side logic (awards, notifications)
- Implement Firestore composite indexes for complex queries
- Add Firebase Analytics for user behavior tracking
- Use Firebase Storage for course media files
- Implement Firebase Remote Config for feature flags
