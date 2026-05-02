import React, { useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  Dimensions, 
  Pressable,
  Modal,
  Image
} from "react-native";
import { 
  Zap, 
  Trophy, 
  Coins, 
  Star, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  MousePointer2
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

/**
 * Custom Toast for Quiz Success
 */
export function GamifiedToast({ 
  visible, 
  xp, 
  message, 
  type = "success",
  onClose 
}: { 
  visible: boolean; 
  xp: number; 
  message: string; 
  type?: "success" | "warning";
  onClose: () => void 
}) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 60,
          useNativeDriver: true,
          tension: 50,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          hide();
        }, 3000);
      });
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const isWarning = type === "warning";

  return (
    <Animated.View 
      style={[
        styles.toastContainer, 
        { transform: [{ translateY }], opacity }
      ]}
    >
      <LinearGradient
        colors={isWarning ? ["#451a03", "#78350f"] : ["#1e293b", "#0f172a"]}
        style={[styles.toastGradient, isWarning && styles.toastWarningBorder]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.toastIcon, isWarning && styles.toastIconWarningBg]}>
          {isWarning ? (
            <AlertTriangle size={20} color="#fbbf24" fill="#fbbf24" />
          ) : (
            <Image source={require("../assets/images/gem.png")} style={{ width: 20, height: 20 }} />
          )}
        </View>
        <View style={styles.toastContent}>
          <Text style={styles.toastMessage}>{message}</Text>
          {xp > 0 && <Text style={styles.toastXp}>+{xp} XP EARNED</Text>}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/**
 * Custom Dialog for Chapter Completion
 */
export function ChapterCompleteDialog({ 
  visible, 
  chapterName, 
  xp, 
  coins, 
  onClose 
}: { 
  visible: boolean; 
  chapterName: string; 
  xp: number; 
  coins: number; 
  onClose: () => void 
}) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.dialogContainer}>
          <LinearGradient
            colors={["rgba(168, 85, 247, 0.2)", "rgba(59, 130, 246, 0.2)"]}
            style={styles.dialogGlow}
          />
          
          <View style={styles.dialogContent}>
            <View style={styles.trophyContainer}>
              <Trophy size={60} color="#fbbf24" />
              <View style={styles.starsContainer}>
                <Star size={16} color="#fbbf24" fill="#fbbf24" style={styles.star1} />
                <Star size={24} color="#fbbf24" fill="#fbbf24" style={styles.star2} />
                <Star size={16} color="#fbbf24" fill="#fbbf24" style={styles.star3} />
              </View>
            </View>

            <Text style={styles.congratsText}>CHAPTER COMPLETE!</Text>
            <Text style={styles.chapterTitle}>{chapterName}</Text>
            
            <View style={styles.rewardSummary}>
              <View style={styles.rewardItem}>
                <Image 
                  source={require("../assets/images/gem.png")} 
                  style={styles.rewardIcon} 
                />
                <Text style={styles.rewardValue}>{xp}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.rewardItem}>
                <Image 
                  source={require("../assets/images/coin.png")} 
                  style={styles.rewardIcon} 
                />
                <Text style={styles.rewardValue}>{coins}</Text>
                <Text style={styles.rewardLabel}>COINS</Text>
              </View>
            </View>

            <Pressable style={styles.continueButton} onPress={onClose}>
              <LinearGradient
                colors={["#a855f7", "#3b82f6"]}
                style={styles.continueGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.continueText}>CONTINUE JOURNEY</Text>
                <CheckCircle2 size={20} color="#ffffff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Custom Dialog for Daily Streak Check-in
 */
export function StreakCheckInDialog({ 
  visible, 
  streak, 
  xp, 
  coins, 
  onClose 
}: { 
  visible: boolean; 
  streak: number; 
  xp: number; 
  coins: number; 
  onClose: () => void 
}) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.dialogContainer}>
          <LinearGradient
            colors={["rgba(249, 115, 22, 0.2)", "rgba(234, 179, 8, 0.1)"]}
            style={styles.dialogGlow}
          />
          
          <View style={styles.dialogContent}>
            <View style={styles.trophyContainer}>
              <View style={styles.streakCircle}>
                <Flame size={60} color="#f97316" fill="#f97316" />
              </View>
              <View style={styles.starsContainer}>
                <Star size={16} color="#fbbf24" fill="#fbbf24" style={styles.star1} />
                <Star size={24} color="#fbbf24" fill="#fbbf24" style={styles.star2} />
                <Star size={16} color="#fbbf24" fill="#fbbf24" style={styles.star3} />
              </View>
            </View>

            <Text style={styles.congratsText}>DAILY CHECK-IN SUCCESS!</Text>
            <Text style={styles.chapterTitle}>{streak} DAY STREAK!</Text>
            
            <View style={styles.rewardSummary}>
              <View style={styles.rewardItem}>
                <Image 
                  source={require("../assets/images/gem.png")} 
                  style={styles.rewardIcon} 
                />
                <Text style={styles.rewardValue}>{xp}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.rewardItem}>
                <Image 
                  source={require("../assets/images/coin.png")} 
                  style={styles.rewardIcon} 
                />
                <Text style={styles.rewardValue}>{coins}</Text>
                <Text style={styles.rewardLabel}>COINS</Text>
              </View>
            </View>

            <Pressable style={styles.continueButton} onPress={onClose}>
              <LinearGradient
                colors={["#f97316", "#fbbf24"]}
                style={styles.continueGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.continueText}>AWESOME!</Text>
                <CheckCircle2 size={20} color="#ffffff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastGradient: {
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toastIconWarningBg: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
  },
  toastWarningBorder: {
    borderColor: "rgba(251, 191, 36, 0.5)",
  },
  toastContent: {
    flex: 1,
  },
  toastMessage: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  toastXp: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogContainer: {
    width: width * 0.85,
    backgroundColor: "#0f172a",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    padding: 32,
    alignItems: "center",
  },
  dialogGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogContent: {
    width: "100%",
    alignItems: "center",
  },
  trophyContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  starsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  star1: { position: "absolute", top: -10, left: -20 },
  star2: { position: "absolute", top: -30, alignSelf: "center" },
  star3: { position: "absolute", top: -10, right: -20 },
  congratsText: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 8,
  },
  chapterTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 32,
  },
  rewardSummary: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginBottom: 32,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  rewardItem: {
    alignItems: "center",
  },
  rewardValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  rewardLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  rewardIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  continueButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  continueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  continueText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  streakCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(249, 115, 22, 0.3)",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  }
});
