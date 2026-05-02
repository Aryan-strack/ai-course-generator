import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  clerkId: text('clerk_id').notNull().unique(),
  imageUrl: text('image_url'),
  xp: integer('xp').default(0).notNull(),
  coins: integer('coins').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  rank: text('rank').default('Novice').notNull(),
  nextLevelXp: integer('next_level_xp').default(50).notNull(),
  nextLevelCoins: integer('next_level_coins').default(100).notNull(),
  dailyStreak: integer('daily_streak').default(0).notNull(),
  lastCheckIn: timestamp('last_check_in'),
  subscriptionStatus: text('subscription_status').default('free').notNull(), // 'free' | 'pro'
  lastBountyUpdate: timestamp('last_bounty_update'),
  bio: text('bio').default('A mysterious wanderer in the cyber realm. Ready to learn and conquer.').notNull(),
  guild: text('guild').default('Freelancer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const levels = pgTable('levels', {
  id: serial('id').primaryKey(),
  levelNumber: integer('level_number').notNull().unique(),
  xpRequired: integer('xp_required').notNull(),
  coinsRequired: integer('coins_required').default(0).notNull(),
  rankName: text('rank_name').notNull(),
  coinsReward: integer('coins_reward').default(0).notNull(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  totalChapters: integer('total_chapters').notNull(),
  difficulty: text('difficulty').default('easy').notNull(), // 'easy' | 'medium' | 'hard'
  bannerImage: text('banner_image'),
  rewardXp: integer('reward_xp').default(100).notNull(),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  title: text('title').notNull(),
  orderNumber: integer('order_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subtopics = pgTable('subtopics', {
  id: serial('id').primaryKey(),
  chapterId: integer('chapter_id').references(() => chapters.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  orderNumber: integer('order_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  subtopicId: integer('subtopic_id').references(() => subtopics.id).notNull(),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON stringified array
  correctAnswer: text('correct_answer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const courseEnrollments = pgTable('course_enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  currentChapter: text('current_chapter'),
  progress: integer('progress').default(0).notNull(),
  isCompleted: integer('is_completed').default(0).notNull(), // 0 or 1
  completedQuizzes: text('completed_quizzes').default('[]').notNull(), // JSON array of subtopic IDs
  completedChapters: text('completed_chapters').default('[]').notNull(), // JSON array of chapter IDs
  lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
});

export const dailyBounties = pgTable('daily_bounties', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  task: text('task').notNull(),
  rewardValue: text('reward_value').notNull(),
  rewardType: text('reward_type').notNull(), // 'xp' | 'coin' | 'gem'
  isCompleted: integer('is_completed').default(0).notNull(), // 0 or 1
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trophies = pgTable('trophies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  conditionType: text('condition_type').notNull(), // e.g., 'course_count', 'xp', 'level', 'coin_count', 'chapter_count'
  conditionValue: integer('condition_value').notNull(),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userTrophies = pgTable('user_trophies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  trophyId: integer('trophy_id').references(() => trophies.id).notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
});
