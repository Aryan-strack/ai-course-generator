import React from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useTrophies, Trophy } from "../hooks/useTrophies";

const ICON_MAP: Record<string, any> = {
  "rocket": require("../assets/images/rocket.png"),
  "magic-book": require("../assets/images/open-book.png"),
  "trophy": require("../assets/images/trophy.png"),
  "coin-stack": require("../assets/images/coin-stack.png"),
  "shield": require("../assets/images/shield.png"),
  "crystal-ball": require("../assets/images/crystal.png"),
  "lightning-bolt": require("../assets/images/lightning.png"),
};

export default function TrophyCabinet() {
  const { trophies, isLoading } = useTrophies();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>TROPHY CABINET</Text>
          <Text style={styles.sectionSubtitle}>Your legendary accomplishments</Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.statsText}>
            {trophies.filter(t => t.earnedAt).length}/{trophies.length}
          </Text>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trophies.map((trophy) => {
          const isEarned = !!trophy.earnedAt;
          return (
            <View key={trophy.id} style={styles.trophyCard}>
              <View style={[
                styles.iconContainer,
                isEarned && styles.earnedIconContainer
              ]}>
                <Image
                  source={ICON_MAP[trophy.icon] || require("../assets/images/star.png")}
                  style={[
                    styles.trophyIcon,
                    !isEarned && styles.lockedIcon
                  ]}
                  contentFit="contain"
                />
                {!isEarned && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockText}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.trophyName, !isEarned && styles.lockedText]}>
                {trophy.name}
              </Text>
              <Text style={styles.trophyCondition} numberOfLines={2}>
                {isEarned 
                  ? `Earned ${new Date(trophy.earnedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
                  : trophy.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 32,
  },
  loadingContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  statsBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  statsText: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "900",
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 20,
  },
  trophyCard: {
    alignItems: "center",
    width: 110,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    marginBottom: 8,
    position: 'relative',
  },
  earnedIconContainer: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  trophyIcon: {
    width: 48,
    height: 48,
  },
  lockedIcon: {
    opacity: 0.2,
    tintColor: '#475569',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1e293b',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  lockText: {
    fontSize: 10,
  },
  trophyName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 4,
  },
  lockedText: {
    color: "#64748b",
  },
  trophyCondition: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 12,
    paddingHorizontal: 4,
  },
});
