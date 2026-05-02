import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DailyStreak from "../../components/DailyStreak";
import PlayerCard from "../../components/PlayerCard";
import RankingList from "../../components/RankingList";
import TrophyGrid from "../../components/TrophyGrid";
import { useStats } from "../../hooks/useStats";
import { useUserData } from "../../hooks/useUserData";

export default function StatsScreen() {
  const { userData, isLoading: userLoading, refetch: refetchUser } = useUserData();
  const { rankings, allTrophies, currentUserRank, isLoading: statsLoading, handleCheckIn, refetchStats } = useStats();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchStats()]);
    setRefreshing(false);
  }, [refetchUser, refetchStats]);

  const isLoading = (userLoading || statsLoading) && !refreshing;

  if (isLoading && !userData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.glow, styles.glowBottom]} />
        <View style={[styles.glow, styles.glowTop]} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.label}>PERFORMANCE METRICS</Text>
            <Text style={styles.title}>Your Stats</Text>
          </View>

          {userData && (
            <PlayerCard
              name={userData.name}
              level={userData.level}
              rank={userData.rank}
              xp={userData.xp}
              nextLevelXp={userData.nextLevelXp}
              coins={userData.coins}
              nextLevelCoins={userData.nextLevelCoins}
              imageUrl={userData.imageUrl}
            />
          )}

          <DailyStreak
            streak={userData?.dailyStreak || 0}
            lastCheckIn={userData?.lastCheckIn || null}
            onCheckIn={handleCheckIn}
          />

          <TrophyGrid trophies={allTrophies} />

          <RankingList
            rankings={rankings}
            currentUserRank={currentUserRank}
            currentUserId={userData?.id}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0c15",
  },
  safeArea: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.1,
  },
  glowBottom: {
    bottom: -100,
    right: -150,
    backgroundColor: "#fbbf24",
  },
  glowTop: {
    top: -50,
    left: -150,
    backgroundColor: "#a855f7",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#a855f7",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
});

