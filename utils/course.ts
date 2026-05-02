import { db } from "@/db";
import {
    chapters as chaptersTable,
    courseEnrollments as courseEnrollmentsTable,
    courses as coursesTable,
    quizzes as quizzesTable,
    subtopics as subtopicsTable,
} from "@/db/schema";
import { handleGamificationAction } from "./gamification";
import { generateCourseBannerImage, generateCourseContent } from "./gemini";
import { uploadToImageKit } from "./imagekit";

export async function forgeCourse(
  topic: string,
  difficulty: string,
  userId: number,
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

    const [newCourse] = await db
      .insert(coursesTable)
      .values({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        totalChapters: courseData.chapters.length,
        bannerImage: bannerImageUrl,
        difficulty: difficulty,
        icon: courseData.icon,
      })
      .returning();

    await db.insert(courseEnrollmentsTable).values({
      userId: userId,
      courseId: newCourse.id,
      currentChapter: "Chapter 1",
      progress: 0,
      isCompleted: 0,
    });

    for (let i = 0; i < courseData.chapters.length; i++) {
      const chapter = courseData.chapters[i];
      const [newChapter] = await db
        .insert(chaptersTable)
        .values({
          courseId: newCourse.id,
          title: chapter.title,
          orderNumber: i + 1,
        })
        .returning();

      for (let j = 0; j < chapter.subtopics.length; j++) {
        const subtopic = chapter.subtopics[j];
        const [newSubtopic] = await db
          .insert(subtopicsTable)
          .values({
            chapterId: newChapter.id,
            title: subtopic.title,
            content: subtopic.content,
            orderNumber: j + 1,
          })
          .returning();

        await db.insert(quizzesTable).values({
          subtopicId: newSubtopic.id,
          question: subtopic.quiz.question,
          options: JSON.stringify(subtopic.quiz.options),
          correctAnswer: subtopic.quiz.correctAnswer,
        });
      }
    }

    console.log(
      "successfully forget and enrolled user to course: ",
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
