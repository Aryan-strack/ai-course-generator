import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/utils/firebase/config";
import { handleGamificationAction } from "./gamification";
import { generateCourseBannerImage, generateCourseContent } from "./gemini";
import { uploadToImageKit } from "./imagekit";

export async function forgeCourse(
  topic: string,
  difficulty: string,
  userId: string,
) {
  try {
    console.log(
      `Starting course generation for topic: ${topic}, difficulty: ${difficulty}, userId: ${userId}`,
    );

    // Step 1: Generate course content using Gemini
    const courseData = await generateCourseContent(topic, difficulty);
    console.log("Course content generated successfully.");

    // Step 2: Generate course banner image using Gemini
    let bannerImageUrl = `https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop`;
    try {
      console.log("Generating course banner image...");
      const base64Image = await generateCourseBannerImage(
        courseData.title,
        courseData.category,
      );
      if (base64Image) {
        console.log(
          "Course banner image generated successfully. Uploading to ImageKit...",
        );
        const fileName = `${courseData.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_banner.jpg`;
        bannerImageUrl = await uploadToImageKit(base64Image, fileName);
        console.log(
          "Course banner image uploaded successfully. URL: ",
          bannerImageUrl,
        );
      }
    } catch (bannerError) {
      console.error(
        "Error generating or uploading course banner image: ",
        bannerError,
      );
    }

    // Step 3: Create course document in Firestore
    const coursesRef = collection(db, "courses");
    const newCourseRef = doc(coursesRef);
    const newCourseData = {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      totalChapters: courseData.chapters.length,
      bannerImage: bannerImageUrl,
      difficulty: difficulty,
      icon: courseData.icon,
      rewardXp: 100,
      createdAt: serverTimestamp(),
    };
    await setDoc(newCourseRef, newCourseData);
    const newCourse = { id: newCourseRef.id, ...newCourseData };

    // Step 4: Create course enrollment for the user
    const enrollmentsRef = collection(db, "courseEnrollments");
    await addDoc(enrollmentsRef, {
      userId: userId,
      courseId: newCourse.id,
      currentChapter: "Chapter 1",
      progress: 0,
      isCompleted: false,
      completedQuizzes: [],
      completedChapters: [],
      lastAccessedAt: serverTimestamp(),
    });

    // Step 5: Create chapters, subtopics, and quizzes
    for (let i = 0; i < courseData.chapters.length; i++) {
      const chapter = courseData.chapters[i];
      const chaptersRef = collection(db, "chapters");
      const newChapterRef = doc(chaptersRef);
      await setDoc(newChapterRef, {
        courseId: newCourse.id,
        title: chapter.title,
        orderNumber: i + 1,
        createdAt: serverTimestamp(),
      });

      for (let j = 0; j < chapter.subtopics.length; j++) {
        const subtopic = chapter.subtopics[j];
        const subtopicsRef = collection(db, "subtopics");
        const newSubtopicRef = doc(subtopicsRef);
        await setDoc(newSubtopicRef, {
          chapterId: newChapterRef.id,
          title: subtopic.title,
          content: subtopic.content,
          orderNumber: j + 1,
          createdAt: serverTimestamp(),
        });

        // Create quiz for this subtopic
        const quizzesRef = collection(db, "quizzes");
        await addDoc(quizzesRef, {
          subtopicId: newSubtopicRef.id,
          question: subtopic.quiz.question,
          options: JSON.stringify(subtopic.quiz.options),
          correctAnswer: subtopic.quiz.correctAnswer,
          createdAt: serverTimestamp(),
        });
      }
    }

    console.log(
      "Successfully forged and enrolled user to course: ",
      newCourse.id,
    );

    handleGamificationAction(userId, "CREATE_COURSE").catch((err) =>
      console.error("Gamification error: ", err),
    );

    return newCourse;
  } catch (error) {
    console.error("Error forging course: ", error);
    throw error;
  }
}

/**
 * Get user's enrolled courses
 */
export async function getUserEnrolledCourses(userId: string) {
  try {
    const enrollmentsRef = collection(db, "courseEnrollments");
    const q = query(enrollmentsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const enrollments = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const courseDoc = await getDoc(doc(db, "courses", data.courseId));
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        enrollments.push({
          id: data.courseId,
          ...courseData,
          enrollmentId: docSnap.id,
          progress: data.progress || 0,
          isCompleted: data.isCompleted || false,
          currentChapter: data.currentChapter || null,
          lastAccessedAt: data.lastAccessedAt ? 
            (data.lastAccessedAt.toDate ? data.lastAccessedAt.toDate() : new Date(data.lastAccessedAt)) : 
            null,
        });
      }
    }
    return enrollments;
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return [];
  }
}

/**
 * Get course by ID
 */
export async function getCourseById(courseId: string) {
  try {
    const docSnap = await getDoc(doc(db, "courses", courseId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

/**
 * Update course progress
 */
export async function updateCourseProgress(
  enrollmentId: string,
  progress: number,
  currentChapter: string,
  isCompleted: boolean = false
) {
  try {
    const enrollmentRef = doc(db, "courseEnrollments", enrollmentId);
    const updateData: any = {
      progress,
      currentChapter,
      lastAccessedAt: serverTimestamp(),
    };
    if (isCompleted) {
      updateData.isCompleted = true;
    }
    await updateDoc(enrollmentRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating course progress:", error);
    return false;
  }
}

