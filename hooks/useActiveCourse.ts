import { useUser } from "@clerk/expo";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/db";
import { users, courses, courseEnrollments } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export interface ActiveCourse {
  title: string;
  chapter: string | null;
  progress: number;
  rewardXp: number;
  courseId: number;
  enrollmentId: number;
}

/**
 * Hook to fetch the most recently accessed active course for the current user.
 */
export const useActiveCourse = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeCourse, setActiveCourse] = useState<ActiveCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveCourse = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Get User ID from DB
      const userResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, user.id))
        .limit(1);

      if (userResult.length === 0) {
        setIsLoading(false);
        return;
      }

      const userId = userResult[0].id;

      // 2. Fetch the most recent enrollment that isn't completed
      const enrollmentResult = await db
        .select({
          enrollmentId: courseEnrollments.id,
          progress: courseEnrollments.progress,
          currentChapter: courseEnrollments.currentChapter,
          courseId: courses.id,
          title: courses.title,
          rewardXp: courses.rewardXp,
        })
        .from(courseEnrollments)
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(
          and(
            eq(courseEnrollments.userId, userId),
            eq(courseEnrollments.isCompleted, 0)
          )
        )
        .orderBy(desc(courseEnrollments.lastAccessedAt))
        .limit(1);

      if (enrollmentResult.length > 0) {
        const data = enrollmentResult[0];
        setActiveCourse({
          title: data.title,
          chapter: data.currentChapter,
          progress: data.progress,
          rewardXp: data.rewardXp,
          courseId: data.courseId,
          enrollmentId: data.enrollmentId,
        });
      } else {
        setActiveCourse(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching active course:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    fetchActiveCourse();
  }, [fetchActiveCourse]);

  return {
    activeCourse,
    isLoading,
    error,
    refetch: fetchActiveCourse,
  };
};
