import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TrophyWithStatus } from "../hooks/useStats";

const ICON_MAP: Record<string, any> = {
  "rocket": require("../assets/images/rocket.png"),
  "magic-book": require("../assets/images/open-book.png"),
  "trophy": require("../assets/images/trophy.png"),
  "coin-stack": require("../assets/images/coin-stack.png"),
  "shield": require("../assets/images/shield.png"),
  "crystal-ball": require("../assets/images/crystal.png"),
  "lightning-bolt": require("../assets/images/lightning.png"),
};

interface TrophyGridProps {
  trophies: TrophyWithStatus[];
}

export default function TrophyGrid({ trophies }: TrophyGridProps) {
  // Ensure we have 16 slots for a 4x4 grid
  const paddedTrophies = [...trophies];
  while (paddedTrophies.length < 16) {
    paddedTrophies.push({
      id: -(paddedTrophies.length + 1), // Negative ID for placeholders
      name: "Locked",
      description: "Keep playing to unlock",
      icon: "locked",
      isEarned: false,
      earnedAt: null,
    });
  }

  const renderItem = ({ item }: { item: TrophyWithStatus }) => {
    const isPlaceholder = item.id < 0;

    return (
      <View style={styles.trophyContainer}>
        <View style={[
          styles.iconWrapper,
          item.isEarned && styles.earnedWrapper,
          isPlaceholder && styles.placeholderWrapper
        ]}>
          <Image
            source={ICON_MAP[item.icon] || require("../assets/images/star.png")}
            style={[
              styles.icon,
              (!item.isEarned || isPlaceholder) && styles.lockedIcon
            ]}
            contentFit="contain"
          />
          {!item.isEarned && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockText}>🔒</Text>
            </View>
          )}
        </View>
        <Text style={[styles.trophyName, !item.isEarned && styles.lockedText]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TROPHY CABINET</Text>
        <Text style={styles.subtitle}>4x4 Mastery Grid</Text>
      </View>

      <View style={styles.gridContainer}>
        {paddedTrophies.map((item, index) => (
          <View key={item.id.toString() + index} style={styles.gridItem}>
            {renderItem({ item })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#a855f7",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gridItem: {
    width: "22%", // Roughly 1/4th minus gaps
    aspectRatio: 1,
    marginBottom: 8,
  },
  trophyContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  iconWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
  },
  earnedWrapper: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  placeholderWrapper: {
    opacity: 0.5,
    borderStyle: "dashed",
    borderWidth: 1,
  },
  icon: {
    width: "60%",
    height: "60%",
  },
  lockedIcon: {
    opacity: 0.2,
    tintColor: "#475569",
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1e293b',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  lockText: {
    fontSize: 8,
  },
  trophyName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  lockedText: {
    color: "#64748b",
  },
});
