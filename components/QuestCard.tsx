import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Play, BookOpen, Clock } from "lucide-react-native";

interface QuestCardProps {
  title: string;
  category: string;
  progress: number;
  totalChapters: number;
  lastAccessed?: string;
  onPress?: () => void;
}

export default function QuestCard({
  title,
  category,
  progress,
  totalChapters,
  lastAccessed,
  onPress,
}: QuestCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
        </View>
        <View style={styles.chapterBadge}>
          <BookOpen size={12} color="#94a3b8" />
          <Text style={styles.chapterText}>{totalChapters} CHAPTERS</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>PROGRESS</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.timeText}>{lastAccessed || "Just now"}</Text>
        </View>
        
        <View style={styles.resumeButton}>
          <Play size={16} color="#ffffff" fill="#ffffff" />
          <Text style={styles.resumeText}>RESUME</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 16,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    borderColor: "#a855f744",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#38bdf815",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38bdf844",
  },
  categoryText: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  chapterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chapterText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#a855f7",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#a855f7",
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a855f7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  resumeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
