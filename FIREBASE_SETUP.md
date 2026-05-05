# Firebase Setup Guide

## Overview
This project uses Firebase Authentication and Cloud Firestore for user management and data storage.

## Configuration

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Register your app (Web or React Native)

### 2. Add Firebase Config to .env
Copy the Firebase config values to your `.env` file:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies
```bash
npm install firebase
```

### 4. Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method

### 5. Enable Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Choose a location (e.g., us-east1)

### 6. Optional: Enable Storage
1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Choose security rules

## Firestore Collections

### users
Stores user profile data.
- **id**: string (Firebase Auth UID)
- **name**: string
- **email**: string
- **xp**: number
- **coins**: number
- **level**: number
- **rank**: string
- **dailyStreak**: number
- **lastCheckIn**: timestamp
- **subscriptionStatus**: 'free' | 'pro'
- **guild**: string
- **bio**: string
- **createdAt**: timestamp

### courseEnrollments
Tracks user course progress.
- **userId**: string (FK to users)
- **courseId**: string (FK to courses)
- **progress**: number (0-100)
- **currentChapter**: string
- **isCompleted**: boolean
- **completedQuizzes**: array
- **completedChapters**: array
- **lastAccessedAt**: timestamp

### courses
Stores course definitions.
- **title**: string
- **description**: string
- **category**: string
- **totalChapters**: number
- **difficulty**: 'easy' | 'medium' | 'hard'
- **rewardXp**: number
- **icon**: string

### chapters
Course chapter content.
- **courseId**: string
- **title**: string
- **orderNumber**: number

### subtopics
Chapter subtopic content.
- **chapterId**: string
- **title**: string
- **content**: string
- **orderNumber**: number

### quizzes
Quiz questions tied to subtopics.
- **subtopicId**: string
- **question**: string
- **options**: string (JSON array)
- **correctAnswer**: string

### dailyBounties
Daily tasks and rewards.
- **userId**: string
- **task**: string
- **rewardValue**: string
- **rewardType**: 'xp' | 'coin' | 'gem'
- **isCompleted**: boolean
- **expiresAt**: timestamp

### trophies
Available trophies.
- **name**: string
- **description**: string
- **icon**: string
- **conditionType**: string
- **conditionValue**: number
- **category**: string

### userTrophies
Earned trophies by users.
- **userId**: string
- **trophyId**: string
- **earnedAt**: timestamp

### levels
Level requirements and rewards.
- **levelNumber**: number
- **xpRequired**: number
- **coinsRequired**: number
- **rankName**: string
- **coinsReward**: number

## Security Rules (Recommended)

### Development (Test Mode)
Allow all access during development:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Production
Restrict access to authenticated users:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /courseEnrollments/{enrollment} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /{collection}/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

## Troubleshooting

### "No database connection string" Error
This means the Firebase config is missing from `.env`. Double-check the values.

### "Auth already initialized" Error
This happens when AuthProvider is mounted multiple times. The code handles this with try-catch.

### Firestore Permission Denied
Update your Firestore rules to allow access or enable test mode.

### User Data Not Persisting
Ensure Firestore persistence is enabled. For web, check `localStorage` is available.

## Seeding Initial Data

Run these scripts to seed levels and trophies:

```bash
# Seed levels
node scripts/seed-levels.ts

# Seed trophies
node scripts/seed-trophies.ts
```
