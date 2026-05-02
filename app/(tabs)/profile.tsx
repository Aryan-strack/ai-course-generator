import SubscriptionPaywall from "@/components/SubscriptionPaywall";
import { useStats } from "@/hooks/useStats";
import { useUserData } from "@/hooks/useUserData";
import { logoutRevenueCat, useSubscription } from "@/utils/revenuecat";
import { useClerk, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ICON_MAP: Record<string, any> = {
  "rocket": require("@/assets/images/rocket.png"),
  "magic-book": require("@/assets/images/open-book.png"),
  "trophy": require("@/assets/images/trophy.png"),
  "coin-stack": require("@/assets/images/coin-stack.png"),
  "shield": require("@/assets/images/shield.png"),
  "crystal-ball": require("@/assets/images/crystal.png"),
  "lightning-bolt": require("@/assets/images/lightning.png"),
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { learningAnalytics, recentTrophies } = useStats();
  const { userData } = useUserData();
  const { isPro, isLoading: isSubscriptionLoading } = useSubscription();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Generate a mock heatmap (5 rows, 14 columns for recent history)
  const heatmapRows = 5;
  const heatmapCols = 14;

  const heatmapData = useMemo(() => {
    const totalCells = heatmapCols * heatmapRows;
    const streak = userData?.dailyStreak || 0;
    // Proper data simulation: highlight recent streak days, dim past
    return Array.from({ length: totalCells }).map((_, i) => {
      // The last few cells represent recent days
      const daysAgo = totalCells - 1 - i;
      let opacity = 0.1; // Default empty

      if (daysAgo < streak) {
        // High activity on streak days
        opacity = 0.6 + (Math.random() * 0.4);
      } else if (daysAgo < Math.max(streak, 15)) {
        // Occasional past activity
        opacity = Math.random() > 0.7 ? 0.3 : 0.1;
      }
      return { opacity };
    });
  }, [userData?.dailyStreak]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.glow, styles.glowCenter]} />
        <View style={[styles.glow, styles.glowTopRight]} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header & Avatar */}
          <View style={styles.headerContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: userData?.imageUrl || user?.imageUrl || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" }}
                style={styles.avatar}
              />
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{userData?.level || 1}</Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{userData?.name || user?.firstName || "Explorer"}</Text>
              <Text style={styles.rankTitle}>{userData?.rank || "Novice"}</Text>
              <View style={styles.guildBadge}>
                <Ionicons name="shield" size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.guildText}>{userData?.guild || "Freelancer"}</Text>
              </View>
            </View>
          </View>

          {/* Lore / Bio */}
          <View style={styles.loreCard}>
            <Ionicons name="information-circle-outline" size={16} color="#8b5cf6" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.loreText}>
              "{userData?.bio || "A mysterious wanderer in the cyber realm. Ready to learn and conquer."}"
            </Text>
          </View>

          {/* Wallet / Inventory */}
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={20} color="#fcd34d" />
            <Text style={styles.sectionTitle}>INVENTORY</Text>
          </View>
          <View style={styles.walletContainer}>
            <View style={[styles.walletItem, { borderColor: "#fbbf24" }]}>
              <Image source={require("@/assets/images/coin-stack.png")} style={{ width: 24, height: 24 }} />
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Coins</Text>
                <Text style={styles.walletValue}>{userData?.coins || 0}</Text>
              </View>
            </View>
            <View style={[styles.walletItem, { borderColor: "#38bdf8" }]}>
              <Image source={require("@/assets/images/gem.png")} style={{ width: 24, height: 24 }} />
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>XP (Gems)</Text>
                <Text style={styles.walletValue}>{userData?.xp || 0}</Text>
              </View>
            </View>
          </View>

          {/* Learning Analytics */}
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={20} color="#34d399" />
            <Text style={styles.sectionTitle}>LEARNING ANALYTICS</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.proCard,
              isPro ? styles.proCardActive : null,
            ]}
            activeOpacity={0.9}
            onPress={() => setPaywallVisible(true)}
          >
            <View style={styles.proCardIconWrap}>
              <Ionicons name={isPro ? "shield-checkmark" : "diamond"} size={22} color={isPro ? "#34d399" : "#fcd34d"} />
            </View>
            <View style={styles.proCardContent}>
              <Text style={styles.proCardTitle}>{isPro ? "CourseForge Pro Active" : "Unlock CourseForge Pro"}</Text>
              <Text style={styles.proCardSubtitle}>
                {isSubscriptionLoading
                  ? "Checking your subscription status..."
                  : isPro
                    ? "Manage your benefits and restore purchases anytime."
                    : "Get unlimited generation, elite quests, analytics, and more."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="book-outline" size={24} color="#34d399" style={styles.statIcon} />
              <Text style={styles.statValue}>{learningAnalytics?.coursesEnrolled || 0}</Text>
              <Text style={styles.statLabel}>Enrolled</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="checkmark-done-circle-outline" size={24} color="#38bdf8" style={styles.statIcon} />
              <Text style={styles.statValue}>{learningAnalytics?.coursesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="ribbon-outline" size={24} color="#8b5cf6" style={styles.statIcon} />
              <Text style={styles.statValue}>{learningAnalytics?.quizzesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Quizzes Aced</Text>
            </View>
          </View>

          {/* Activity Heatmap */}
          <View style={styles.sectionHeader}>
            <Ionicons name="git-commit-outline" size={20} color="#38bdf8" />
            <Text style={styles.sectionTitle}>ACTIVITY LOG</Text>
          </View>
          <View style={styles.heatmapCard}>
            <View style={styles.heatmapGrid}>
              {Array.from({ length: heatmapCols }).map((_, col) => (
                <View key={`col-${col}`} style={styles.heatmapCol}>
                  {Array.from({ length: heatmapRows }).map((_, row) => {
                    const index = col * heatmapRows + row;
                    const opacity = heatmapData[index]?.opacity || 0.1;
                    return (
                      <View
                        key={`cell-${col}-${row}`}
                        style={[
                          styles.heatmapCell,
                          { backgroundColor: opacity > 0.4 ? "#38bdf8" : "#8b5cf6", opacity }
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Trophy Showcase */}
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={20} color="#fcd34d" />
            <Text style={styles.sectionTitle}>RECENT ACHIEVEMENTS</Text>
          </View>
          {recentTrophies && recentTrophies.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {recentTrophies.map((trophy) => (
                <View key={trophy.id} style={styles.trophyCard}>
                  <Image
                    source={ICON_MAP[trophy.icon] || require("@/assets/images/star.png")}
                    style={{ width: 40, height: 40, marginBottom: 8 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.trophyName}>{trophy.name}</Text>
                  <Text style={styles.trophyDate}>
                    {trophy.earnedAt ? new Date(trophy.earnedAt).toLocaleDateString() : ""}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyTrophyCard}>
              <Text style={styles.emptyTrophyText}>No achievements unlocked yet.</Text>
            </View>
          )}

          {/* Settings & Gear */}
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color="#94a3b8" />
            <Text style={styles.sectionTitle}>GEAR & SETTINGS</Text>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="volume-medium-outline" size={20} color="#94a3b8" />
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: "#1e293b", true: "#38bdf8" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="hardware-chip-outline" size={20} color="#94a3b8" />
                <Text style={styles.settingLabel}>Haptics</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: "#1e293b", true: "#38bdf8" }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="notifications-outline" size={20} color="#94a3b8" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#1e293b", true: "#38bdf8" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              try {
                await logoutRevenueCat();
                await signOut();
              } catch {
                Alert.alert("Sign out failed", "Please try again.");
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </TouchableOpacity>

        </ScrollView>
        <SubscriptionPaywall visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
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
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.15,
  },
  glowCenter: {
    top: "30%",
    left: "-20%",
    backgroundColor: "#38bdf8",
  },
  glowTopRight: {
    top: "-10%",
    right: "-20%",
    backgroundColor: "#8b5cf6",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#38bdf8",
  },
  rankBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#38bdf8",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  headerInfo: {
    marginLeft: 20,
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  rankTitle: {
    fontSize: 14,
    color: "#38bdf8",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },
  guildBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  guildText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "500",
  },
  loreCard: {
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    marginBottom: 28,
  },
  loreText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    marginLeft: 8,
  },
  walletContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  walletItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  walletInfo: {
    marginLeft: 12,
  },
  walletLabel: {
    color: "#94a3b8",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 2,
  },
  walletValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  statBox: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(252, 211, 77, 0.25)",
    padding: 16,
    marginBottom: 20,
  },
  proCardActive: {
    borderColor: "rgba(52, 211, 153, 0.35)",
    backgroundColor: "rgba(52, 211, 153, 0.08)",
  },
  proCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 12,
  },
  proCardContent: {
    flex: 1,
  },
  proCardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  proCardSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  heatmapCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 28,

  },
  heatmapScroll: {
    paddingRight: 8,

  },
  heatmapGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: '100%'
  },
  heatmapCol: {
    flex: 1,
    marginRight: 4,
  },
  heatmapCell: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 4,
    marginBottom: 4,
  },
  trophyCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fbbf24",
    alignItems: "center",
    width: 110,
    marginRight: 12,
  },
  trophyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  trophyName: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  trophyDate: {
    color: "#94a3b8",
    fontSize: 10,
  },
  emptyTrophyCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 28,
    alignItems: "center",
  },
  emptyTrophyText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  settingsCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  settingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    color: "#f8fafc",
    fontSize: 15,
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
