import React from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { CheckCircle2, Circle } from "lucide-react-native";
import { useDailyBounties, DEFAULT_BOUNTIES } from "../hooks/useDailyBounties";
import { GeneratedBounty } from "../utils/gemini";

export default function DailyBounties() {
  const { bounties, isLoading, isGenerating, timeLeft, completeBounty } = useDailyBounties();

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "coin": return require("../assets/images/coin.png");
      case "gem": return require("../assets/images/gem.png");
      case "xp": return require("../assets/images/gem.png"); // Reusing gem for XP
      default: return require("../assets/images/crystal.png");
    }
  };

  // Filter out Gems and limit to top 3 (uncompleted first)
  const displayBounties = (bounties || [])
    .filter(b => b.rewardType !== "gem")
    .sort((a, b) => {
      if (a.isCompleted === b.isCompleted) return 0;
      return a.isCompleted ? 1 : -1;
    })
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DAILY BOUNTIES</Text>
        {!isLoading && !isGenerating && (
          <Text style={styles.timer}>Refreshes in {timeLeft}</Text>
        )}
      </View>

      <View style={styles.bountyList}>
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fbbf24" size="small" />
            <Text style={styles.loadingText}>Forging new bounties for you...</Text>
          </View>
        ) : displayBounties.length > 0 ? (
          displayBounties.map((bounty, index) => (
            <View 
              key={bounty.id || `default-${index}`} 
              style={styles.bountyItem}
            >
              <View style={styles.bountyLeft}>
                {bounty.isCompleted ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : (
                  <Circle size={24} color="#1e293b" />
                )}
                <Text style={[styles.bountyTask, bounty.isCompleted && styles.completedText]}>
                  {bounty.task}
                </Text>
              </View>
              <View style={styles.bountyRight}>
                <View style={styles.rewardContainer}>
                  <Image
                    source={getRewardIcon(bounty.rewardType)}
                    style={styles.rewardIcon}
                  />
                  <Text style={styles.rewardValue}>{bounty.rewardValue}</Text>
                </View>
              </View>
            </View>
          ))
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fbbf24" size="small" />
            <Text style={styles.loadingText}>Seeking bounties...</Text>
          </View>
        ) : !isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No bounties available today.</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fbbf24", // Alert Amber
    letterSpacing: 2,
  },
  timer: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  bountyList: {
    gap: 16,
  },
  bountyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  bountyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bountyTask: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f8fafc",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  bountyRight: {
    paddingLeft: 12,
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  rewardIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fbbf24",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 10,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    fontStyle: "italic",
  },
});
