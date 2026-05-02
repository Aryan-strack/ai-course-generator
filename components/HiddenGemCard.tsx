import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Sparkles, Lock } from "lucide-react-native";

interface HiddenGemCardProps {
  title: string;
  description: string;
  rewardValue: string;
  isUnlocked: boolean;
  onPress?: () => void;
}

export default function HiddenGemCard({
  title,
  description,
  rewardValue,
  isUnlocked,
  onPress,
}: HiddenGemCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !isUnlocked && styles.lockedCard,
        pressed && isUnlocked && styles.cardPressed,
      ]}
      onPress={isUnlocked ? onPress : undefined}
    >
      <View style={styles.iconContainer}>
        {isUnlocked ? (
          <Image
            source={require("../assets/images/gem.png")}
            style={styles.gemIcon}
          />
        ) : (
          <View style={styles.lockCircle}>
            <Lock size={24} color="#64748b" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !isUnlocked && styles.mutedText]}>
            {isUnlocked ? title : "SECRET TASK"}
          </Text>
          <View style={styles.rewardBadge}>
            <Sparkles size={12} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.rewardText}>{rewardValue}</Text>
          </View>
        </View>
        
        <Text style={[styles.description, !isUnlocked && styles.mutedText]}>
          {isUnlocked ? description : "Complete more courses to reveal this hidden gem."}
        </Text>
      </View>

      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>LOCKED</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  lockedCard: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderColor: "rgba(30, 41, 59, 0.3)",
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    borderColor: "#fbbf24",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  gemIcon: {
    width: 32,
    height: 32,
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f1f5f9",
    letterSpacing: 0.5,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbbf2444",
    gap: 4,
  },
  rewardText: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "900",
  },
  description: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  mutedText: {
    color: "#64748b",
  },
  lockedOverlay: {
    position: "absolute",
    right: -20,
    top: 10,
    backgroundColor: "#1e293b",
    paddingHorizontal: 20,
    paddingVertical: 4,
    transform: [{ rotate: "45deg" }],
  },
  lockedText: {
    color: "#64748b",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
