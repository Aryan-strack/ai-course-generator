 import { useLocalSearchParams, useRouter } from "expo-router";
 import { useEffect, useState, useCallback } from "react";
 import { 
   StyleSheet, 
   Text, 
   View, 
   ScrollView, 
   Pressable, 
   ActivityIndicator, 
   Dimensions,
   Alert,
   Image
 } from "react-native";
 import { SafeAreaView } from "react-native-safe-area-context";
 import { StatusBar } from "expo-status-bar";
 import { 
   ChevronLeft, 
   BookOpen, 
   CheckCircle2, 
   Play, 
   Zap, 
   Trophy,
   ArrowRight,
   ArrowLeft,
   AlertTriangle
 } from "lucide-react-native";
 import { db } from "@/db";
 import { courses, chapters as chaptersTable, subtopics as subtopicsTable, quizzes as quizzesTable, courseEnrollments, users } from "@/db/schema";
 import { eq, and, sql } from "drizzle-orm";
 import { useAuth } from "@/context/AuthContext";
 import { handleGamificationAction, rewardUser } from "@/utils/gamification";
 import * as Haptics from "expo-haptics";
 import SubtopicQuiz from "@/components/SubtopicQuiz";
 import { GamifiedToast, ChapterCompleteDialog } from "@/components/RewardUI";

 const { width } = Dimensions.get("window");

 export default function CourseSessionScreen() {
   const { id, chapterIndex } = useLocalSearchParams();
   const router = useRouter();
   const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sessionRewards, setSessionRewards] = useState({ xp: 0, coins: 0 });
  const [dialogVisible, setDialogVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ visible: false, xp: 0, message: "", type: "success" as "success" | "warning" });
  const [lastQuizId, setLastQuizId] = useState<number | null>(null);

  useEffect(() => {
    if (chapterIndex) {
      setCurrentChapterIndex(parseInt(chapterIndex as string));
    }
  }, [chapterIndex]);

  const fetchCourseData = useCallback(async () => {
    if (!id || !user) return;

    try {
      setIsLoading(true);
      
      // 1. Get DB User ID
      const userRes = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
      if (userRes.length === 0) return;
      setUserId(userRes[0].id);

      // 2. Fetch Course
      const courseRes = await db.select().from(courses).where(eq(courses.id, parseInt(id as string))).limit(1);
      if (courseRes.length === 0) return;
      setCourse(courseRes[0]);

      // 3. Fetch Chapters and Subtopics
      const chaptersRes = await db
        .select()
        .from(chaptersTable)
        .where(eq(chaptersTable.courseId, parseInt(id as string)))
        .orderBy(chaptersTable.orderNumber);

      const chaptersWithSubtopics = await Promise.all(
        chaptersRes.map(async (chapter) => {
          const subtopics = await db
            .select()
            .from(subtopicsTable)
            .where(eq(subtopicsTable.chapterId, chapter.id))
            .orderBy(subtopicsTable.orderNumber);
          
          const subtopicsWithQuizzes = await Promise.all(
            subtopics.map(async (subtopic) => {
              const quiz = await db
                .select()
                .from(quizzesTable)
                .where(eq(quizzesTable.subtopicId, subtopic.id))
                .limit(1);
              return { ...subtopic, quiz: quiz[0] || null };
            })
          );

          return { ...chapter, subtopics: subtopicsWithQuizzes };
        })
      );

      setChapters(chaptersWithSubtopics);

      // 4. Update last accessed and fetch enrollment
      const enrollRes = await db.select().from(courseEnrollments)
        .where(and(eq(courseEnrollments.userId, userRes[0].id), eq(courseEnrollments.courseId, parseInt(id as string))))
        .limit(1);
      
      if (enrollRes.length > 0) {
        setEnrollment(enrollRes[0]);
      }

      await db.update(courseEnrollments)
        .set({ lastAccessedAt: new Date() })
        .where(and(eq(courseEnrollments.userId, userRes[0].id), eq(courseEnrollments.courseId, parseInt(id as string))));

    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleFinishChapter = async () => {
    if (!userId || !course || !enrollment) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const currentChapter = chapters[currentChapterIndex];
      const progress = Math.round(((currentChapterIndex + 1) / chapters.length) * 100);
      
      const completedChapters = JSON.parse(enrollment.completedChapters || "[]");
      const alreadyRewarded = completedChapters.includes(currentChapter.id);
      
      const chapterXpReward = alreadyRewarded ? 0 : 5;
      const chapterCoinReward = alreadyRewarded ? 0 : 50;
      
      if (!alreadyRewarded) {
        completedChapters.push(currentChapter.id);
      }
      
      // 1. Update Enrollment Progress
      await db.update(courseEnrollments)
        .set({ 
          progress, 
          currentChapter: chapters[currentChapterIndex + 1]?.title || "Course Completed",
          isCompleted: currentChapterIndex === chapters.length - 1 ? 1 : 0,
          completedChapters: JSON.stringify(completedChapters)
        })
        .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, course.id)));

      // 2. Trigger Gamification and Rewards
      if (!alreadyRewarded) {
        await handleGamificationAction(
          userId, 
          "COMPLETE_CHAPTER", 
          `Completed Chapter ${currentChapterIndex + 1}: ${currentChapter.title} of ${course.title}`
        );
        await rewardUser(userId, chapterXpReward, "xp");
        await rewardUser(userId, chapterCoinReward, "coin");
        
        setSessionRewards(prev => ({
          xp: prev.xp + chapterXpReward,
          coins: prev.coins + chapterCoinReward
        }));
      }

      setDialogVisible(true);
      // Update local enrollment state to reflect the new completion
      setEnrollment({ ...enrollment, completedChapters: JSON.stringify(completedChapters) });
    } catch (error) {
      console.error("Error finishing chapter:", error);
    }
  };

  const handleQuizSuccess = async (attempts: number) => {
    if (!userId || !enrollment || !currentSubtopic) return;
    
    const completedQuizzes = JSON.parse(enrollment.completedQuizzes || "[]");
    const alreadyRewarded = completedQuizzes.includes(currentSubtopic.id);
    
    let xpReward = 0;
    let coinReward = 0;
    let message = "KNOWLEDGE SECURED!";
    let type: "success" | "warning" = "success";

    if (alreadyRewarded) {
      message = "YOU ALREADY REWARDED FOR THIS QUIZ";
      type = "warning";
    } else if (attempts === 1) {
      xpReward = 1;
      coinReward = 5;
      completedQuizzes.push(currentSubtopic.id);
    } else {
      message = "CORRECT! (NO REWARD FOR MULTIPLE ATTEMPTS)";
      type = "warning";
    }

    setShowQuiz(false);
    setToastConfig({ visible: true, xp: xpReward, message, type });
    
    if (xpReward > 0 || coinReward > 0) {
      await rewardUser(userId, xpReward, "xp");
      await rewardUser(userId, coinReward, "coin");
      await handleGamificationAction(userId, "ACE_QUIZ", `Aced quiz in ${currentSubtopic.title}`);
      
      setSessionRewards(prev => ({ 
        xp: prev.xp + xpReward, 
        coins: prev.coins + coinReward 
      }));

      // Update enrollment in DB and state
      await db.update(courseEnrollments)
        .set({ completedQuizzes: JSON.stringify(completedQuizzes) })
        .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, course.id)));
      
      setEnrollment({ ...enrollment, completedQuizzes: JSON.stringify(completedQuizzes) });
    }

    // Move to next subtopic or finish
    if (currentSubtopicIndex < (currentChapter?.subtopics.length - 1)) {
      setTimeout(() => {
        setCurrentSubtopicIndex(prev => prev + 1);
      }, 500);
    } else {
      handleFinishChapter();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>AWAKENING THE ARCHIVES...</Text>
      </View>
    );
  }

  const currentChapter = chapters[currentChapterIndex];
  const currentSubtopic = currentChapter?.subtopics[currentSubtopicIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color="#ffffff" size={24} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.courseTitle} numberOfLines={1}>{course?.title}</Text>
            <View style={styles.chapterIdBadge}>
              <Text style={styles.progressText}>CHAPTER {currentChapterIndex + 1}</Text>
              <View style={styles.idDot} />
              <Text style={styles.idText}>ID: #{currentChapter?.id}</Text>
            </View>
          </View>
          <View style={styles.xpBadge}>
            <Image source={require("../../../assets/images/gem.png")} style={{ width: 14, height: 14 }} />
            <Text style={styles.xpText}>{course?.rewardXp} XP</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.chapterProgressBg}>
          <View 
            style={[
              styles.chapterProgressFill, 
              { width: `${((currentSubtopicIndex + 1) / (currentChapter?.subtopics.length || 1)) * 100}%` }
            ]} 
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Subtopic Header */}
          <View style={styles.subtopicHeader}>
            <Text style={styles.chapterLabel}>CHAPTER {currentChapterIndex + 1}: {currentChapter?.title}</Text>
            <Text style={styles.subtopicTitle}>{currentSubtopic?.title}</Text>
          </View>

          {/* Content Area */}
          <View style={styles.contentCard}>
            <View style={styles.contentDecoration} />
            {showQuiz && currentSubtopic?.quiz ? (
              <SubtopicQuiz 
                quiz={currentSubtopic.quiz} 
                onSuccess={handleQuizSuccess} 
              />
            ) : (
              <Text style={styles.contentText}>
                {currentSubtopic?.content}
              </Text>
            )}
          </View>

          {/* Subtopic Navigation */}
          {showQuiz ? (
            <View style={styles.navigation}>
              <Pressable 
                style={styles.navButton}
                onPress={() => setShowQuiz(false)}
              >
                <ArrowLeft size={20} color="#ffffff" />
                <Text style={styles.navText}>BACK TO LESSON</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.navigation}>
              <Pressable 
                style={[styles.navButton, currentSubtopicIndex === 0 && styles.disabledNav]}
                disabled={currentSubtopicIndex === 0}
                onPress={() => setCurrentSubtopicIndex(prev => prev - 1)}
              >
                <ArrowLeft size={20} color={currentSubtopicIndex === 0 ? "#475569" : "#ffffff"} />
                <Text style={[styles.navText, currentSubtopicIndex === 0 && styles.disabledText]}>PREVIOUS</Text>
              </Pressable>

              <View style={styles.subtopicDots}>
                {currentChapter?.subtopics.map((_: any, idx: number) => (
                  <View 
                    key={idx} 
                    style={[styles.dot, idx === currentSubtopicIndex && styles.activeDot]} 
                  />
                ))}
              </View>

              <Pressable 
                style={[styles.navButton, currentSubtopicIndex === (currentChapter?.subtopics.length - 1) && styles.finishButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (currentSubtopic?.quiz) {
                    setShowQuiz(true);
                  } else {
                    if (currentSubtopicIndex < (currentChapter?.subtopics.length - 1)) {
                      setCurrentSubtopicIndex(prev => prev + 1);
                    } else {
                      handleFinishChapter();
                    }
                  }
                }}
              >
                <Text style={styles.navText}>
                  {currentSubtopicIndex === (currentChapter?.subtopics.length - 1) ? "COMPLETE" : "NEXT"}
                </Text>
                {currentSubtopicIndex === (currentChapter?.subtopics.length - 1) ? (
                  <CheckCircle2 size={20} color="#ffffff" />
                ) : (
                  <ArrowRight size={20} color="#ffffff" />
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>

        <GamifiedToast 
          visible={toastConfig.visible} 
          xp={toastConfig.xp} 
          message={toastConfig.message} 
          type={toastConfig.type}
          onClose={() => setToastConfig(prev => ({ ...prev, visible: false }))} 
        />

        <ChapterCompleteDialog 
          visible={dialogVisible}
          chapterName={currentChapter?.title}
          xp={sessionRewards.xp}
          coins={sessionRewards.coins}
          onClose={() => {
            setDialogVisible(false);
            router.back();
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0c15",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0b0c15",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  courseTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  progressText: {
    color: "#a855f7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  chapterIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  idDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  idText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    gap: 6,
  },
  xpText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "900",
  },
  chapterProgressBg: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    width: "100%",
  },
  chapterProgressFill: {
    height: "100%",
    backgroundColor: "#a855f7",
  },
  scrollContent: {
    padding: 24,
  },
  subtopicHeader: {
    marginBottom: 24,
  },
  chapterLabel: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtopicTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  contentCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    marginBottom: 32,
    minHeight: 300,
  },
  contentDecoration: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: "#a855f722",
  },
  contentText: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "400",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  navText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  finishButton: {
    backgroundColor: "#10b981",
  },
  disabledNav: {
    backgroundColor: "transparent",
    opacity: 0.3,
  },
  disabledText: {
    color: "#475569",
  },
  subtopicDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#334155",
  },
  activeDot: {
    backgroundColor: "#a855f7",
    width: 12,
  },
});
