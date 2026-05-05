import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/utils/firebase/config";
import { collection, query, where, getDocs, orderBy, desc, getDoc, doc } from "firebase/firestore";

export interface EnrolledCourse {
  id: string;
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
  const { user, isSignedIn, isLoading: authLoading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnrolledCourses = useCallback(async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      setEnrolledCourses([]);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch enrollments from Firestore
      const enrollmentsRef = collection(db, "courseEnrollments");
      const q = query(
        enrollmentsRef,
        where("userId", "==", user.id),
        orderBy("lastAccessedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const results: EnrolledCourse[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Fetch course details
        const courseDoc = await getDoc(doc(db, "courses", data.courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          results.push({
            id: data.courseId,
            title: courseData.title,
            category: courseData.category,
            bannerImage: courseData.bannerImage || null,
            icon: courseData.icon || null,
            totalChapters: courseData.totalChapters || 0,
            progress: data.progress || 0,
            lastAccessedAt: data.lastAccessedAt ? new Date(data.lastAccessedAt.seconds * 1000) : new Date(),
            isCompleted: !!data.isCompleted,
          });
        }
      }

      setEnrolledCourses(results);
      setError(null);
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [fetchEnrolledCourses]);

  return {
    enrolledCourses,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchEnrolledCourses,
  };
};
