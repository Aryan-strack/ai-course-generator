import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, CheckCircle2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { StreakCheckInDialog } from "./RewardUI";

interface DailyStreakProps {
  streak: number;
  lastCheckIn: Date | null;
  onCheckIn: () => Promise<any>;
}

export default function DailyStreak({ streak, lastCheckIn, onCheckIn }: DailyStreakProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const isToday = lastCheckIn ? (
    new Date(lastCheckIn).toDateString() === new Date().toDateString()
  ) : false;

  const handlePress = async () => {
    if (isToday || isUpdating) return;
    
    try {
      setIsUpdating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await onCheckIn();
      
      if (result && result.success) {
        setShowDialog(true);
      }
    } catch (error) {
      console.error("Check-in error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(249, 115, 22, 0.15)", "rgba(234, 179, 8, 0.05)"]}
        style={styles.card}
      >
        <View style={styles.leftSection}>
          <View style={styles.iconCircle}>
            <Flame size={32} color={isToday ? "#f97316" : "#475569"} fill={isToday ? "#f97316" : "transparent"} />
          </View>
          <View>
            <Text style={styles.streakCount}>{streak}</Text>
            <Text style={styles.streakLabel}>DAY STREAK</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, (isToday || isUpdating) && styles.checkedButton]} 
          onPress={handlePress}
          disabled={isToday || isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : isToday ? (
            <View style={styles.checkedContent}>
              <CheckCircle2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>CHECKED</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>CHECK IN</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
      
      <View style={styles.daysRow}>
        {[...Array(7)].map((_, i) => {
          // Simplified visualization of 7 days
          const isActive = i < (streak % 8); 
          return (
            <View key={i} style={[styles.dayDot, isActive && styles.dayDotActive]} />
          );
        })}
      </View>

      <StreakCheckInDialog
        visible={showDialog}
        streak={streak + 1} // Assuming streak increments on check-in
        xp={5}
        coins={50}
        onClose={() => setShowDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
    backgroundColor: "#111827",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  streakCount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  button: {
    backgroundColor: "#f97316",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkedButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  checkedContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1e293b",
  },
  dayDotActive: {
    backgroundColor: "#f97316",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
