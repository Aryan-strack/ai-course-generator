import { Image } from "expo-image";
import { Medal } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RankingUser } from "../hooks/useStats";

interface RankingListProps {
  rankings: RankingUser[];
  currentUserRank: number | null;
  currentUserId: number | undefined;
}

export default function RankingList({ rankings, currentUserRank, currentUserId }: RankingListProps) {
  const renderItem = ({ item }: { item: RankingUser }) => {
    const isCurrentUser = item.id === currentUserId;
    const isTop3 = item.rank <= 3;

    return (
      <View style={[styles.rankItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankNumberContainer}>
          {item.rank === 1 ? (
            <Medal size={20} color="#fbbf24" fill="#fbbf24" />
          ) : item.rank === 2 ? (
            <Medal size={20} color="#94a3b8" fill="#94a3b8" />
          ) : item.rank === 3 ? (
            <Medal size={20} color="#b45309" fill="#b45309" />
          ) : (
            <Text style={styles.rankNumber}>{item.rank}</Text>
          )}
        </View>

        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require("../assets/images/avatar.png")}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name} {isCurrentUser && "(You)"}
          </Text>
          <Text style={styles.userLevel}>Level {item.level}</Text>
        </View>

        <View style={styles.xpContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Image source={require("../assets/images/gem.png")} style={{ width: 14, height: 14 }} />
            <Text style={styles.xpValue}>{item.xp.toLocaleString()}</Text>
          </View>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GLOBAL RANKINGS</Text>
        {currentUserRank && (
          <View style={styles.myRankBadge}>
            <Text style={styles.myRankText}>YOUR RANK: #{currentUserRank}</Text>
          </View>
        )}
      </View>

      <View style={styles.list}>
        {rankings.map((user) => (
          <View key={user.id}>
            {renderItem({ item: user })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 40,
    marginTop: 40
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  myRankBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  myRankText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#a855f7",
    letterSpacing: 0.5,
  },
  list: {
    gap: 12,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.05)",
  },
  currentUserItem: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderWidth: 1,
  },
  rankNumberContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#64748b",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  userLevel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  xpContainer: {
    alignItems: "flex-end",
  },
  xpValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
  },
  xpLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "800",
  },
});
