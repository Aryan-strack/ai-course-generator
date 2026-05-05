import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Animated,
  Dimensions 
} from "react-native";
import { Check, X, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface SubtopicQuizProps {
  quiz: {
    question: string;
    options: string; // JSON stringified array
    correctAnswer: string;
  };
  onSuccess: (attempts: number) => void;
}

export default function SubtopicQuiz({ quiz, onSuccess }: SubtopicQuizProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(1);
  
  const options = JSON.parse(quiz.options);

  const handleOptionPress = (option: string) => {
    if (isCorrect) return; // Prevent multiple presses once correct
    
    setSelectedOption(option);
    const correct = option === quiz.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // No longer automatic timeout, user must click Continue
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttempts(prev => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.quizHeader}>
        <View style={styles.iconContainer}>
          <Zap size={20} color="#fbbf24" fill="#fbbf24" />
        </View>
        <Text style={styles.quizLabel}>KNOWLEDGE CHECK</Text>
      </View>

      <Text style={styles.question}>{quiz.question}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option: string, index: number) => {
          const isSelected = selectedOption === option;
          const isOptionCorrect = option === quiz.correctAnswer;
          
          let optionStyle: any = styles.optionButton;
          let textStyle: any = styles.optionText;
          let icon = null;

          if (isSelected || (isCorrect && isOptionCorrect)) {
            if (isOptionCorrect) {
              optionStyle = [styles.optionButton, styles.correctOption];
              textStyle = [styles.optionText, styles.correctText];
              icon = <Check size={18} color="#10b981" />;
            } else if (isSelected) {
              optionStyle = [styles.optionButton, styles.wrongOption];
              textStyle = [styles.optionText, styles.wrongText];
              icon = <X size={18} color="#ef4444" />;
            }
          }

          return (
            <Pressable
              key={index}
              style={optionStyle}
              onPress={() => handleOptionPress(option)}
              disabled={isCorrect === true}
            >
              <Text style={textStyle}>{option}</Text>
              {icon}
            </Pressable>
          );
        })}
      </View>

      {isCorrect === false && (
        <Text style={styles.hint}>That&apos;s not quite right. Try again!</Text>
      )}

      {isCorrect === true && (
        <Pressable 
          style={styles.continueButton} 
          onPress={() => onSuccess(attempts)}
        >
          <Text style={styles.continueText}>CONTINUE TO NEXT SECTION</Text>
          <Check size={20} color="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    marginTop: 20,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  quizHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  quizLabel: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  question: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  correctOption: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  wrongOption: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  optionText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  correctText: {
    color: "#10b981",
  },
  wrongText: {
    color: "#ef4444",
  },
  hint: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  continueButton: {
    marginTop: 24,
    backgroundColor: "#10b981",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  continueText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
