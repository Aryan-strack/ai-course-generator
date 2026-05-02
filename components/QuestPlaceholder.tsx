import { Sparkles } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";

interface QuestPlaceholderProps {
  topic: string;
}

export default function QuestPlaceholder({ topic }: QuestPlaceholderProps) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.glow, { opacity: animatedValue }]} />

      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>FORGING...</Text>
        </View>
        <View style={styles.loadingIcon}>
          <Sparkles size={16} color="#10b981" />
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {topic || "The Unknown Quest"}
      </Text>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>STOKING THE FORGE...</Text>
          {/* <Loader2 size={12} color="#10b981" /> */}
          <ActivityIndicator color="#10b981" />
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { opacity: animatedValue }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.statusText}>Our AI spirits are crafting your journey. This usually takes 30-60 seconds.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#10b98144",
    marginBottom: 16,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#10b981",
    filter: "blur(40px)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#10b98115",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b98144",
  },
  categoryText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  loadingIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b98122",
    justifyContent: "center",
    alignItems: "center",
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
  progressBarBg: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "40%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    color: "#94a3b8",
    fontSize: 11,
    fontStyle: "italic",
    flex: 1,
  },
});
