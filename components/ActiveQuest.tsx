import React from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import { Image } from "expo-image";
import { Play, Compass, Sparkles } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";

interface ActiveQuestProps {
  courseId?: number | null;
  title?: string | null;
  chapter?: string | null;
  progress?: number;
  reward?: string | number;
  isLoading?: boolean;
}

export default function ActiveQuest({
  courseId,
  title,
  chapter,
  progress = 0,
  reward = "100 XP",
  isLoading = false,
}: ActiveQuestProps) {
  const router = useRouter();
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.glassCard, styles.loadingCard]}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>FETCHING YOUR JOURNEY...</Text>
        </View>
      </View>
    );
  }

  if (!title) {
    return (
      <View style={styles.container}>
        <View style={styles.glassCard}>
          <View style={styles.header}>
            <Text style={styles.label}>NO ACTIVE QUEST</Text>
          </View>
          
           <View style={styles.emptyContent}>
             <Text style={styles.emptyTitle}>Your journey hasn&apos;t started yet.</Text>
             <Text style={styles.emptySubtitle}>Choose your path, Hero! The realms await your arrival.</Text>
           </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.exploreButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Compass size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>EXPLORE</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.forgeButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Sparkles size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>FORGE NEW</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const size = 60;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.glassCard}>
        <View style={styles.header}>
          <Text style={styles.label}>CURRENT QUEST</Text>
          <View style={styles.rewardBadge}>
            <Image
              source={require("../assets/images/gem.png")}
              style={styles.rewardIcon}
            />
            <Text style={styles.rewardText}>+{reward}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>{title}</Text>
            <Text style={styles.questSubtitle}>{chapter || "Getting Started..."}</Text>
          </View>

          <View style={styles.progressContainer}>
            <Svg width={size} height={size}>
              <Circle
                stroke="#1e293b"
                fill="transparent"
                strokeWidth={strokeWidth}
                cx={size / 2}
                cy={size / 2}
                r={radius}
              />
              <Circle
                stroke="#a855f7"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.playButtonPressed,
          ]}
          onPress={() => router.push({ pathname: ("/course/[id]" as any), params: { id: courseId as any } })}
        >
          <View style={styles.playButtonGlow} />
          <Play size={24} color="#ffffff" fill="#ffffff" />
          <Text style={styles.playButtonText}>RESUME JOURNEY</Text>
        </Pressable>
        
        <Text style={styles.hookText}>Finish this chapter to unlock {reward}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 24,
  },
  glassCard: {
    backgroundColor: "rgba(17, 24, 39, 0.8)",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    overflow: "hidden",
  },
  loadingCard: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#a855f7",
    letterSpacing: 2,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  rewardIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fbbf24",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyContent: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exploreButton: {
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  forgeButton: {
    backgroundColor: "#6366f1", // Magic Indigo
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  questInfo: {
    flex: 1,
    marginRight: 16,
  },
  questTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  questSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
  playButton: {
    width: "100%",
    height: 60,
    backgroundColor: "#a855f7",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  playButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  playButtonGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    backgroundColor: "#a855f7",
    zIndex: -1,
  },
  playButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  hookText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6366f1", // Magic Indigo
    fontWeight: "600",
    fontStyle: "italic",
  },
});
