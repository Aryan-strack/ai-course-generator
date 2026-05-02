import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Check } from "lucide-react-native";

interface ChapterMapNodeProps {
  index: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  onPress: () => void;
  offset?: number; // X-axis offset for zigzag
}

export default function ChapterMapNode({
  index,
  title,
  isCompleted,
  isActive,
  onPress,
  offset = 0,
}: ChapterMapNodeProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.node,
          isCompleted && styles.completedNode,
          isActive && styles.activeNode,
          !isCompleted && !isActive && styles.lockedNode,
          pressed && styles.pressed,
        ]}
      >
        {isCompleted ? (
          <View style={styles.checkCircle}>
            <Check size={24} color="#ffffff" strokeWidth={3} />
          </View>
        ) : (
          <Text style={[
            styles.chapterNumber,
            !isActive && styles.lockedText
          ]}>
            {index}
          </Text>
        )}
        
        {isActive && <View style={styles.activeGlow} />}
      </Pressable>
      
      <View style={styles.textContainer}>
        <Text style={[
          styles.chapterTitle,
          isCompleted && styles.completedText,
          !isCompleted && !isActive && styles.mutedText
        ]}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 150, // Enough for title
  },
  node: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    backgroundColor: "#111827",
    zIndex: 2,
  },
  completedNode: {
    borderColor: "#10b981",
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  activeNode: {
    borderColor: "#a855f7",
    backgroundColor: "#111827",
    borderWidth: 6,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  lockedNode: {
    borderColor: "#1e293b",
    backgroundColor: "#111827",
    opacity: 0.8,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  checkCircle: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  chapterNumber: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },
  lockedText: {
    color: "#475569",
  },
  activeGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#a855f7",
    opacity: 0.5,
  },
  textContainer: {
    marginTop: 12,
    maxWidth: 150,
  },
  chapterTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  completedText: {
    color: "#10b981",
  },
  mutedText: {
    color: "#64748b",
  },
});
