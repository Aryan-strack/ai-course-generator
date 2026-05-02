import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { X, Sparkles, Sword, Shield, Trophy, Lock } from "lucide-react-native";
import { UserProfile } from "../hooks/useUserData";

interface ForgeCourseModalProps {
  isVisible: boolean;
  onClose: () => void;
  onForge: (topic: string, difficulty: string) => Promise<void>;
  userData: UserProfile | null;
}

const DIFFICULTIES = [
  {
    id: "easy",
    label: "Squire",
    description: "Foundational concepts, slower pace.",
    icon: Sword,
    color: "#10b981",
    locked: false,
  },
  {
    id: "medium",
    label: "Knight",
    description: "Deep dive, moderate complexity.",
    icon: Shield,
    color: "#a855f7",
    locked: false,
  },
  {
    id: "hard",
    label: "Paladin",
    description: "Mastery level, intense challenges.",
    icon: Trophy,
    color: "#fbbf24",
    locked: true, // Will be checked against subscription
  },
];

export default function ForgeCourseModal({
  isVisible,
  onClose,
  onForge,
  userData,
}: ForgeCourseModalProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [isGenerating, setIsGenerating] = useState(false);

  const isPro = userData?.subscriptionStatus === "pro";

  const handleForge = () => {
    if (!topic.trim()) return;
    
    // Close modal immediately and pass data to parent to handle bg generation
    onForge(topic, difficulty);
    onClose();
    setTopic("");
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <Sparkles size={20} color="#10b981" />
                <Text style={styles.headerTitle}>The Great Forge</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isGenerating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={styles.loadingText}>Stoking the forge...</Text>
                  <Text style={styles.loadingSubtext}>
                    Our AI spirits are crafting your unique quest. This takes a moment of meditation.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Topic Input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>WHAT IS YOUR QUEST?</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Python Mastery, Quantum Physics, Vegan Cooking"
                      placeholderTextColor="#475569"
                      value={topic}
                      onChangeText={setTopic}
                      multiline
                    />
                  </View>

                  {/* Difficulty Section */}
                  <View style={styles.difficultySection}>
                    <Text style={styles.inputLabel}>CHOOSE YOUR CHALLENGE</Text>
                    <View style={styles.difficultyGrid}>
                      {DIFFICULTIES.map((level) => {
                        const isLocked = level.id === "hard" && !isPro;
                        const isSelected = difficulty === level.id;
                        const Icon = level.icon;

                        return (
                          <Pressable
                            key={level.id}
                            style={[
                              styles.difficultyCard,
                              isSelected && { borderColor: level.color, backgroundColor: `${level.color}15` },
                              isLocked && styles.difficultyCardLocked,
                            ]}
                            onPress={() => !isLocked && setDifficulty(level.id)}
                          >
                            <View style={styles.difficultyHeader}>
                              <Icon size={20} color={isLocked ? "#475569" : level.color} />
                              <Text style={[styles.difficultyLabel, { color: isLocked ? "#475569" : "#ffffff" }]}>
                                {level.label}
                              </Text>
                              {isLocked && <Lock size={12} color="#f43f5e" />}
                            </View>
                            <Text style={styles.difficultyDesc}>{level.description}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    style={[styles.submitButton, !topic.trim() && styles.submitButtonDisabled]}
                    onPress={handleForge}
                    disabled={!topic.trim()}
                  >
                    <Text style={styles.submitButtonText}>FORGE JOURNEY</Text>
                    <Sparkles size={18} color="#ffffff" />
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  centeredView: {
    width: "90%",
    maxWidth: 400,
  },
  modalView: {
    backgroundColor: "#0f172a",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#10b981",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#334155",
    minHeight: 80,
    textAlignVertical: "top",
  },
  difficultySection: {
    marginBottom: 32,
  },
  difficultyGrid: {
    gap: 12,
  },
  difficultyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  difficultyCardLocked: {
    opacity: 0.6,
    backgroundColor: "#0f172a",
    borderStyle: "dashed",
  },
  difficultyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  difficultyDesc: {
    fontSize: 12,
    color: "#94a3b8",
    paddingLeft: 30,
  },
  submitButton: {
    backgroundColor: "#10b981",
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#334155",
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});
