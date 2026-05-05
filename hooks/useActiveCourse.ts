import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/utils/firebase/config";
import { collection, query, where, getDocs, orderBy, desc, and, getDoc, doc } from "firebase/firestore";

export interface ActiveCourse {
  title: string;
  chapter: string | null;
  progress: number;
  rewardXp: number;
  courseId: string;
  enrollmentId: string;
}

/**
 * Hook to fetch the most recently accessed active course for the current user.
 */
export const useActiveCourse = () => {
  const { user, isSignedIn, isLoading: authLoading } = useAuth();
  const [activeCourse, setActiveCourse] = useState<ActiveCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveCourse = useCallback(async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      setActiveCourse(null);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch enrollments for this user that aren't completed
      const enrollmentsRef = collection(db, "courseEnrollments");
      const q = query(
        enrollmentsRef,
        where("userId", "==", user.id),
        where("isCompleted", "==", false),
        orderBy("lastAccessedAt", "desc")
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const enrollmentDoc = snapshot.docs[0];
        const data = enrollmentDoc.data();

        // Fetch course details
        const courseDoc = await getDoc(doc(db, "courses", data.courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          setActiveCourse({
            title: courseData.title,
            chapter: data.currentChapter || null,
            progress: data.progress || 0,
            rewardXp: courseData.rewardXp || 0,
            courseId: data.courseId,
            enrollmentId: enrollmentDoc.id,
          });
        } else {
          setActiveCourse(null);
        }
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
  }, [isSignedIn, user]);

  useEffect(() => {
    fetchActiveCourse();
  }, [fetchActiveCourse]);

  return {
    activeCourse,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchActiveCourse,
  };
};
