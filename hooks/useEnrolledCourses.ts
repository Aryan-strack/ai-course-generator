import { useUser } from "@clerk/expo";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/db";
import { users, courses, courseEnrollments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface EnrolledCourse {
  id: number;
  title: string;
  category: string;
  progress: number;
  totalChapters: number;
  bannerImage: string | null;
  icon: string | null;
  lastAccessedAt: Date;
  isCompleted: boolean;
}

/**
 * Hook to fetch all enrolled courses for the current user.
 */
export const useEnrolledCourses = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnrolledCourses = useCallback(async () => {
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

      // 2. Fetch all enrollments
      const results = await db
        .select({
          id: courses.id,
          title: courses.title,
          category: courses.category,
          bannerImage: courses.bannerImage,
          icon: courses.icon,
          progress: courseEnrollments.progress,
          totalChapters: courses.totalChapters,
          lastAccessedAt: courseEnrollments.lastAccessedAt,
          isCompleted: courseEnrollments.isCompleted,
        })
        .from(courseEnrollments)
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(eq(courseEnrollments.userId, userId))
        .orderBy(desc(courseEnrollments.lastAccessedAt));

      setEnrolledCourses(results.map(r => ({
        ...r,
        isCompleted: r.isCompleted === 1,
      })));
      setError(null);
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [fetchEnrolledCourses]);

  return {
    enrolledCourses,
    isLoading,
    error,
    refetch: fetchEnrolledCourses,
  };
};
