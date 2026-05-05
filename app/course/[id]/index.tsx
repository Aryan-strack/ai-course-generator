import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Zap, Trophy } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { db } from "@/db";
import { courses, chapters as chaptersTable, courseEnrollments, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { useAuth } from "@/context/AuthContext";
import ChapterMapNode from "@/components/ChapterMapNode";

const { width, height } = Dimensions.get("window");
const NODE_SPACING = 160;
const ZIGZAG_OFFSET = 60;

export default function CourseMapScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id || !user) return;

    try {
      setIsLoading(true);

      // User ID is directly available
      const userId = user.id;

      // 2. Fetch Course
      const courseRes = await db.select().from(courses).where(eq(courses.id, parseInt(id as string))).limit(1);
      if (courseRes.length === 0) return;
      setCourse(courseRes[0]);

      // 3. Fetch Chapters
      const chaptersRes = await db
        .select()
        .from(chaptersTable)
        .where(eq(chaptersTable.courseId, parseInt(id as string)))
        .orderBy(chaptersTable.orderNumber);
      setChapters(chaptersRes);

      // 4. Fetch Enrollment
      const enrollmentRes = await db
        .select()
        .from(courseEnrollments)
        .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, parseInt(id as string))))
        .limit(1);
      
      if (enrollmentRes.length > 0) {
        setEnrollment(enrollmentRes[0]);
      }

    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Scroll to bottom after loading (since first chapter is at bottom)
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>MAPPING YOUR DESTINY...</Text>
      </View>
    );
  }

  // Calculate chapter status
  const totalChapters = chapters.length;
  const currentChapterTitle = enrollment?.currentChapter;
  const progress = enrollment?.progress || 0;
  
  // Find current chapter index
  const currentIdx = chapters.findIndex(c => c.title === currentChapterTitle);
  const resolvedCurrentIdx = currentIdx === -1 ? (progress === 100 ? totalChapters : 0) : currentIdx;

  const getNodePosition = (idx: number) => {
    const centerX = width / 2;
    const getOffset = (index: number) => {
      const pattern = [0, ZIGZAG_OFFSET, 0, -ZIGZAG_OFFSET];
      return pattern[index % 4];
    };

    return {
      x: centerX + getOffset(idx) - 40, // -40 to center the 80px wide node
      y: (totalChapters - 1 - idx) * NODE_SPACING + 100, // +100 for top padding
    };
  };

  const renderPath = () => {
    const paths = [];
    const centerX = width / 2;
    
    for (let i = 0; i < chapters.length - 1; i++) {
        const startIdx = i;
        const endIdx = i + 1;
        
        const getOffset = (idx: number) => {
            const pattern = [0, ZIGZAG_OFFSET, 0, -ZIGZAG_OFFSET];
            return pattern[idx % 4];
        };

        const x1 = centerX + getOffset(startIdx);
        const y1 = (totalChapters - 1 - startIdx) * NODE_SPACING + 140; // +100 padding + 40 node center
        
        const x2 = centerX + getOffset(endIdx);
        const y2 = (totalChapters - 1 - endIdx) * NODE_SPACING + 140;

        const cx = (x1 + x2) / 2 + (getOffset(endIdx) === 0 ? (getOffset(startIdx) > 0 ? 30 : -30) : 0);
        const cy = (y1 + y2) / 2;

        const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
        
        const isCompleted = startIdx < resolvedCurrentIdx;
        const strokeColor = isCompleted ? "#10b981" : "#1e293b";

        paths.push(
          <Path
            key={`path-${i}`}
            d={d}
            stroke={strokeColor}
            strokeWidth={6}
            strokeDasharray="1, 12"
            strokeLinecap="round"
            fill="none"
          />
        );
    }
    return paths;
  };

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
            <Text style={styles.statsText}>{totalChapters} STATIONS • {progress}% SYNCED</Text>
          </View>
          <View style={styles.xpBadge}>
            <Image source={require("../../../assets/images/gem.png")} style={{ width: 14, height: 14 }} />
            <Text style={styles.xpText}>{course?.rewardXp} XP</Text>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.mapContainer, 
            { height: totalChapters * NODE_SPACING + 300 } // Ample space for portal and nodes
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* SVG Paths */}
          <Svg style={StyleSheet.absoluteFill}>
            {renderPath()}
          </Svg>

          {/* Chapters Node List (Reversed for bottom-to-top layout logic) */}
          {chapters.map((chapter, actualIdx) => {
            const isCompleted = actualIdx < resolvedCurrentIdx;
            const isActive = actualIdx === resolvedCurrentIdx;
            const pos = getNodePosition(actualIdx);

            return (
              <View 
                key={chapter.id} 
                style={[
                  styles.nodeWrapper, 
                  { left: pos.x, top: pos.y }
                ]}
              >
                <ChapterMapNode
                  index={actualIdx + 1}
                  title={chapter.title}
                  isCompleted={isCompleted}
                  isActive={isActive}
                  onPress={() => {
                    if (isCompleted || isActive) {
                      router.push({
                        pathname: "/course/[id]/player",
                        params: { id: course.id, chapterIndex: actualIdx }
                      });
                    }
                  }}
                />
              </View>
            );
          })}
          
          {/* Start/End Decorations */}
          <View style={[styles.portalStart, { top: (totalChapters - 1) * NODE_SPACING + 280 }]}>
             <View style={styles.portalCircle} />
             <Text style={styles.portalText}>THE VOID</Text>
          </View>
          
          <View style={[styles.portalEnd, { top: 40 }]}>
             <View style={[styles.portalCircle, styles.endCircle]} />
             <Text style={styles.portalText}>THE CITADEL</Text>
          </View>
        </ScrollView>
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
    backgroundColor: "rgba(11, 12, 21, 0.9)",
    zIndex: 10,
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
  statsText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
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
  mapContainer: {
    paddingVertical: 100,
    alignItems: "center",
  },
  nodesList: {
    width: "100%",
    paddingBottom: 20,
  },
  nodeWrapper: {
    position: "absolute",
    alignItems: "center",
    width: 80, // Match node width
  },
  portalStart: {
    position: "absolute",
    bottom: 20,
    alignItems: "center",
  },
  portalEnd: {
    position: "absolute",
    alignItems: "center",
  },
  portalCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    marginBottom: 8,
  },
  endCircle: {
      backgroundColor: "#a855f7",
      shadowColor: "#a855f7",
      shadowOpacity: 0.8,
      shadowRadius: 10,
  },
  portalText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
