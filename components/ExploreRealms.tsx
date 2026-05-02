import React, { useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Zap, Target, BookOpen } from "lucide-react-native";
import { useEnrolledCourses } from "../hooks/useEnrolledCourses";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 280;

export default function ExploreRealms() {
  const { enrolledCourses, isLoading, refetch } = useEnrolledCourses();
  const router = useRouter();

  // Refetch whenever the home screen comes into focus (e.g., after generating a new course)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading) return null;

  if (enrolledCourses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>YOUR REALMS</Text>
          <Text style={styles.sectionSubtitle}>Continue your mastery in these worlds</Text>
        </View>
        <Pressable style={styles.seeAllButton} onPress={() => router.push("/quests")}>
          <Text style={styles.seeAllText}>VIEW ALL</Text>
          <ChevronRight size={14} color="#a855f7" />
        </Pressable>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
      >
        {enrolledCourses.map((course) => (
          <Pressable 
            key={course.id} 
            style={styles.courseCard}
            onPress={() => router.push(`/course/${course.id}`)}
          >
            <Image
              source={course.bannerImage ? { uri: course.bannerImage } : { uri: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop" }}
              style={styles.bannerImage}
              contentFit="cover"
            />
            
            <LinearGradient
              colors={["transparent", "rgba(11, 12, 21, 0.95)"]}
              style={styles.gradientOverlay}
            />

            <View style={styles.cardContent}>
              <View style={styles.topRow}>
                <View style={styles.categoryBadge}>
                    <BookOpen size={12} color="#a855f7" />
                    <Text style={styles.categoryText}>{course.category.toUpperCase()}</Text>
                </View>
                {course.isCompleted && (
                   <View style={styles.completedBadge}>
                        <Zap size={10} color="#10b981" fill="#10b981" />
                        <Text style={styles.completedText}>MASTERED</Text>
                   </View>
                )}
              </View>

              <View style={styles.bottomSection}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course.title}
                </Text>
                
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>PROGRESS SYNC</Text>
                        <Text style={styles.progressValue}>{course.progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View 
                            style={[
                                styles.progressBarFill, 
                                { width: `${course.progress}%` },
                                course.progress === 100 && styles.progressCompleteFill
                            ]} 
                        />
                    </View>
                </View>
              </View>
            </View>

            {/* Decorative Corner Icon */}
            <View style={styles.floatingIcon}>
                <Target size={20} color="rgba(168, 85, 247, 0.5)" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#f1f5f9",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#a855f7",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 16,
    paddingRight: 20,
  },
  courseCard: {
    width: CARD_WIDTH,
    height: 180,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    position: "relative",
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  categoryText: {
    color: "#a855f7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  completedText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "900",
  },
  bottomSection: {
    gap: 12,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 24,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#a855f7",
  },
  progressCompleteFill: {
    backgroundColor: "#10b981",
  },
  floatingIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    opacity: 0.1,
    transform: [{ rotate: "15deg" }],
  },
});
