import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";

interface PlayerCardProps {
  name?: string;
  level?: number;
  rank?: string;
  xp?: number;
  nextLevelXp?: number;
  coins?: number;
  nextLevelCoins?: number;

  imageUrl?: string | null;
}

export default function PlayerCard({
  name = "Hero Name",
  level = 1,
  rank = "Novice",
  xp = 0,
  nextLevelXp = 100,
  coins = 0,
  nextLevelCoins = 50,

  imageUrl,
}: PlayerCardProps) {

  const xpProgress = nextLevelXp > 0 ? Math.max(0, Math.min(100, (xp / nextLevelXp) * 100)) : 0;
  const coinsProgress = nextLevelCoins > 0 ? Math.max(0, Math.min(100, (coins / nextLevelCoins) * 100)) : 0;
  const coinsReady = coins >= nextLevelCoins;

  return (
    <View style={styles.container}>
      <View style={styles.cardContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={imageUrl ? { uri: imageUrl } : require("../assets/images/avatar.png")}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.rankContainer}>
              <ShieldCheck size={14} color="#a855f7" />
              <Text style={styles.rankText}>LEVEL {level}</Text>
            </View>
            <Text style={styles.nameText}>{name}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          {/* XP Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelGroup}>
                <Image source={require("../assets/images/gem.png")} style={{ width: 14, height: 14, marginRight: 4 }} />
                <Text style={styles.progressLabel}>XP PROGRESS</Text>
              </View>
              <Text style={styles.progressValue}>
                {Math.round(xpProgress)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={["#38bdf8", "#0ea5e9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${xpProgress}%` }]}
              />
            </View>
            <Text style={styles.progressMeta}>
              {xp} / {nextLevelXp} XP to Level {level + 1}
            </Text>
          </View>

          {/* Coins Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelGroup}>
                <View style={[styles.coinDot, coinsReady && { backgroundColor: '#fbbf24', shadowColor: '#fbbf24' }]} />
                <Text style={[styles.progressLabel, coinsReady && { color: '#fbbf24' }]}>
                  {coinsReady ? "COINS SECURED" : "COIN REQUIREMENT"}
                </Text>
              </View>
              <Text style={styles.progressValue}>
                {Math.round(coinsProgress)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={["#fbbf24", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${coinsProgress}%` }]}
              />
            </View>
            <Text style={styles.progressMeta}>
              {coinsReady ? "Requirement fulfilled!" : `${coins} / ${nextLevelCoins} Coins to Level ${level + 1}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  cardContent: {
    padding: 24,
    gap: 24,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#1e293b",
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#a855f7',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  infoSection: {
    flex: 1,
    gap: 4,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  progressContainer: {
    gap: 20,
  },
  progressSection: {
    width: "100%",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1.5,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#1e293b",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressMeta: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  coinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    marginRight: 6,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  }
});

