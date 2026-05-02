import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import ActiveQuest from "../../components/ActiveQuest";
import DailyBounties from "../../components/DailyBounties";
import ExploreRealms from "../../components/ExploreRealms";
import PlayerCard from "../../components/PlayerCard";
import TrophyCabinet from "../../components/TrophyCabinet";
import { useUserData } from "../../hooks/useUserData";
import { useActiveCourse } from "../../hooks/useActiveCourse";
import { useEnrolledCourses } from "../../hooks/useEnrolledCourses";

export default function CampScreen() {
  const { userData, isLoading: isUserLoading, refetch: refetchUser } = useUserData();
  const { activeCourse, isLoading: isActiveCourseLoading, refetch: refetchActiveCourse } = useActiveCourse();
  const { refetch: refetchCourses } = useEnrolledCourses();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchActiveCourse(), refetchCourses()]);
    setRefreshing(false);
  }, [refetchUser, refetchActiveCourse, refetchCourses]);

  // Helper to format large numbers
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const displayName = userData?.name.split(" ")[0] || "Hero";

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Atmospherics */}
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />

        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>HERO'S CAMP</Text>
            <Text style={styles.headerSubtitle}>
              {isUserLoading ? "Loading..." : `Welcome back, ${displayName}`}
            </Text>
          </View>
          <View style={styles.currencyContainer}>
            <View style={styles.currencyItem}>
              <Image
                source={require("../../assets/images/gem.png")}
                style={styles.currencyIcon}
              />
              <Text style={styles.currencyText}>
                {isUserLoading ? "..." : `${formatNumber(userData?.xp || 0)} XP`}
              </Text>
            </View>
            <View style={styles.currencyItem}>
              <Image
                source={require("../../assets/images/coin.png")}
                style={styles.currencyIcon}
              />
              <Text style={styles.currencyText}>
                {isUserLoading ? "..." : formatNumber(userData?.coins || 0)}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
          }
        >
          {/* Header: Player Card */}
          <PlayerCard
            name={userData?.name}
            level={userData?.level}
            rank={userData?.rank}
            xp={userData?.xp}
            nextLevelXp={userData?.nextLevelXp}
            coins={userData?.coins}
            nextLevelCoins={userData?.nextLevelCoins}

            imageUrl={userData?.imageUrl}
          />

          {/* Middle-Top: Active Quest */}
          <ActiveQuest
            courseId={activeCourse?.courseId}
            title={activeCourse?.title}
            chapter={activeCourse?.chapter}
            progress={activeCourse?.progress}
            reward={activeCourse?.rewardXp}
            isLoading={isActiveCourseLoading}
          />

          {/* Middle: Daily Bounties */}
          <DailyBounties />

          {/* Bottom: Explore Realms */}
          <ExploreRealms />

          {/* Very Bottom: Trophy Cabinet */}
          <TrophyCabinet />
          <View style={{ height: 200 }} />
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
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  glowTop: {
    top: -100,
    right: -50,
    backgroundColor: "#a855f7", // Purple glow
  },
  glowBottom: {
    bottom: 100,
    left: -50,
    backgroundColor: "#38bdf8", // Cyan glow
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 35,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 18,
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 2,
  },
  currencyContainer: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    gap: 6,
  },
  currencyIcon: {
    width: 16,
    height: 16,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
});
