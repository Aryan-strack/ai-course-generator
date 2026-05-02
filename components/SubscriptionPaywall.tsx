import { PurchasesPackage, useSubscription } from "@/utils/revenuecat";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const { width: SCREEN_W } = Dimensions.get("window");

// ─── Feature list ─────────────────────────────────────────────────────────────
const PRO_FEATURES = [
  { icon: "infinite", label: "Unlimited Course Generation", color: "#38bdf8" },
  { icon: "sparkles", label: "AI-Powered Elite Quests", color: "#fcd34d" },
  { icon: "diamond", label: "Exclusive Pro Avatars & Badges", color: "#a78bfa" },
  { icon: "bar-chart", label: "Advanced Learning Analytics", color: "#34d399" },
  { icon: "trophy", label: "Hidden Legendary Trophies", color: "#fb923c" },
  { icon: "flash", label: "Double XP Bounty Events", color: "#f472b6" },
];

function getIntroTrialLabel(product: PurchasesPackage["product"]) {
  const introPrice = (product as PurchasesPackage["product"] & {
    introductoryPrice?: {
      periodNumberOfUnits?: number;
      periodUnit?: string;
    };
  }).introductoryPrice;

  if (!introPrice?.periodNumberOfUnits || !introPrice?.periodUnit) {
    return null;
  }

  return `🎁 ${introPrice.periodNumberOfUnits}-${introPrice.periodUnit.toLowerCase()} free trial included`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SubscriptionPaywallProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Package card ─────────────────────────────────────────────────────────────
function PackageCard({
  pkg,
  isSelected,
  isPopular,
  onPress,
}: {
  pkg: PurchasesPackage;
  isSelected: boolean;
  isPopular: boolean;
  onPress: () => void;
}) {
  const product = pkg.product;
  const title = product.title?.replace(/\s*\(.*?\)\s*/g, "") ?? pkg.packageType;
  const price = product.priceString ?? "";
  const period = product.subscriptionPeriod ?? "";

  let periodLabel = "";
  if (period.includes("M") && !period.includes("Y")) periodLabel = "/ month";
  else if (period.includes("Y")) periodLabel = "/ year";
  else if (period.includes("W")) periodLabel = "/ week";

  return (
    <TouchableOpacity
      style={[
        styles.packageCard,
        isSelected && styles.packageCardSelected,
        isPopular && !isSelected && styles.packageCardPopular,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>⭐ BEST VALUE</Text>
        </View>
      )}
      <View style={styles.packageRadio}>
        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>
      <View style={styles.packageInfo}>
        <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
          {title}
        </Text>
      </View>
      <View style={styles.packagePricing}>
        <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
          {price}
        </Text>
        <Text style={styles.packagePeriod}>{periodLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SubscriptionPaywall({
  visible,
  onClose,
}: SubscriptionPaywallProps) {
  const {
    isPro,
    currentOffering,
    isLoading,
    error,
    purchasePackage,
    restorePurchases,
    refresh,
  } = useSubscription();

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [purchasing, setPurchasing] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      refresh();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse button
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const packages = currentOffering?.availablePackages ?? [];

  // Pick the "most popular" package (e.g., annual or second package)
  const popularIndex = packages.length > 1 ? 1 : 0;

  const handlePurchase = async () => {
    if (packages.length === 0) return;
    const pkg = packages[selectedIndex];
    setPurchasing(true);
    const success = await purchasePackage(pkg);
    setPurchasing(false);
    if (success) {
      Alert.alert(
        "🎉 Welcome to PRO!",
        "Your subscription is now active. Enjoy all the elite features!",
        [{ text: "Let's Go!", onPress: onClose }]
      );
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restorePurchases();
    setRestoring(false);
    if (success) {
      Alert.alert(
        "✅ Restored!",
        "Your PRO subscription has been restored.",
        [{ text: "Continue", onPress: onClose }]
      );
    } else {
      Alert.alert("No Subscription Found", "We couldn't find a previous purchase to restore.");
    }
  };

  const selectedPackage = packages[selectedIndex];
  const selectedProduct = selectedPackage?.product;
  const introTrialLabel = selectedProduct ? getIntroTrialLabel(selectedProduct) : null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Glow accents */}
          <View style={[styles.glowBlob, styles.glowBlobTopLeft]} />
          <View style={[styles.glowBlob, styles.glowBlobTopRight]} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Crown hero */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={["#fcd34d", "#f59e0b"]}
                style={styles.crownCircle}
              >
                <Text style={styles.crownEmoji}>👑</Text>
              </LinearGradient>
              <Text style={styles.proLabel}>COURSEFORGE</Text>
              <Text style={styles.heroTitle}>Unlock Elite Mode</Text>
              <Text style={styles.heroSubtitle}>
                Level up beyond limits — exclusive power-ups for true adventurers.
              </Text>
            </View>

            {/* Already pro state */}
            {isPro && !isLoading ? (
              <View style={styles.alreadyProCard}>
                <Ionicons name="checkmark-circle" size={28} color="#34d399" />
                <Text style={styles.alreadyProText}>PRO ACTIVE — Elite Mode On!</Text>
              </View>
            ) : null}

            {/* Features */}
            <View style={styles.featuresContainer}>
              {PRO_FEATURES.map((f) => (
                <View key={f.label} style={styles.featureRow}>
                  <View style={[styles.featureIconWrap, { backgroundColor: f.color + "22" }]}>
                    <Ionicons name={f.icon as any} size={18} color={f.color} />
                  </View>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>

            {/* Packages */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#38bdf8" size="large" />
                <Text style={styles.loadingText}>Loading plans...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={24} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.errorContainer}>
                <Ionicons name="storefront-outline" size={28} color="#94a3b8" />
                <Text style={styles.errorText}>
                  No subscription plans available yet.{"\n"}Please check back soon!
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.choosePlanLabel}>CHOOSE YOUR PLAN</Text>
                {packages.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.identifier}
                    pkg={pkg}
                    isSelected={selectedIndex === idx}
                    isPopular={idx === popularIndex}
                    onPress={() => setSelectedIndex(idx)}
                  />
                ))}
              </>
            )}

            {/* CTA */}
            {!isLoading && !isPro && packages.length > 0 ? (
              <>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={handlePurchase}
                    disabled={purchasing}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={["#fbbf24", "#f59e0b", "#d97706"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaGradient}
                    >
                      {purchasing ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <>
                          <Ionicons name="flash" size={20} color="#0b0c15" style={{ marginRight: 8 }} />
                          <Text style={styles.ctaText}>
                            START ELITE MODE
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {introTrialLabel ? <Text style={styles.trialNote}>{introTrialLabel}</Text> : null}

                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={handleRestore}
                  disabled={restoring}
                >
                  {restoring ? (
                    <ActivityIndicator color="#94a3b8" size="small" />
                  ) : (
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}

            {/* Legal */}
            <Text style={styles.legalText}>
              Subscriptions auto-renew unless cancelled. Manage in{" "}
              {Platform.OS === "ios" ? "App Store Settings" : "Google Play"}.
              {"\n"}By subscribing you agree to our Terms & Privacy Policy.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b0c15",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.15)",
    maxHeight: "93%",
    overflow: "hidden",
  },
  glowBlob: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.12,
    pointerEvents: "none",
  },
  glowBlobTopLeft: {
    top: -80,
    left: -80,
    backgroundColor: "#8b5cf6",
  },
  glowBlobTopRight: {
    top: -60,
    right: -80,
    backgroundColor: "#38bdf8",
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 6,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 36,
  },

  // Hero
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#fcd34d",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  crownEmoji: {
    fontSize: 36,
  },
  proLabel: {
    color: "#fcd34d",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 6,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: SCREEN_W * 0.75,
  },

  // Already Pro
  alreadyProCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  alreadyProText: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Features
  featuresContainer: {
    marginBottom: 24,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  // Choose plan
  choosePlanLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
    textAlign: "center",
  },

  // Package cards
  packageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#1e293b",
    padding: 16,
    marginBottom: 10,
  },
  packageCardSelected: {
    borderColor: "#fcd34d",
    backgroundColor: "rgba(252,211,77,0.06)",
  },
  packageCardPopular: {
    borderColor: "rgba(139,92,246,0.5)",
    backgroundColor: "rgba(139,92,246,0.05)",
  },
  popularBadge: {
    position: "absolute",
    top: -11,
    left: 16,
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  packageRadio: {
    marginRight: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#fcd34d",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fcd34d",
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "700",
  },
  packageTitleSelected: {
    color: "#ffffff",
  },
  packagePricing: {
    alignItems: "flex-end",
  },
  packagePrice: {
    color: "#64748b",
    fontSize: 18,
    fontWeight: "800",
  },
  packagePriceSelected: {
    color: "#fcd34d",
  },
  packagePeriod: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },

  // CTA
  ctaButton: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#fcd34d",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaText: {
    color: "#0b0c15",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  // Trial note
  trialNote: {
    color: "#34d399",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
  },

  // Restore
  restoreButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  restoreText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Loading / error
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "rgba(56,189,248,0.1)",
    borderWidth: 1,
    borderColor: "#38bdf8",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  retryText: {
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: 13,
  },

  // Legal
  legalText: {
    color: "#334155",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 16,
  },
});
