import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isSignedIn, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.heroContainer}>
        <Text style={styles.heroSuperText}>READY TO</Text>
        <Text style={styles.heroMainText}>LEVEL UP</Text>
        <Text style={styles.heroSubText}>YOUR SKILLS?</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI-POWERED</Text>
          </View>
        </View>

        <Text style={styles.title}>CourseForge AI</Text>
        <Text style={styles.subtitle}>
          Forge your own AI-powered courses in seconds. Unleash your creativity
          and share your knowledge with the world.
        </Text>

        {!isSignedIn ? (
          <>
            <Link href="/sign-up" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonText}>START JOURNEY</Text>
              </Pressable>
            </Link>

            <Link href="/sign-in" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>RESUME QUEST</Text>
              </Pressable>
            </Link>
          </>
        ) : (
          <View style={styles.signedInContainer}>
            <Text style={styles.signedInText}>WELCOME BACK, HERO</Text>
            <Pressable
              onPress={() => router.push("/(tabs)")}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>ENTER THE HUB</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0c15",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowTop: {
    top: -50,
    left: -50,
    backgroundColor: "#7e22ce2a", // Purple glow
  },
  glowBottom: {
    bottom: -50,
    right: -100,
    backgroundColor: "#0ea5e91a", // Cyan glow
  },
  heroContainer: {
    flex: 0.5,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heroSuperText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#38bdf8",
    letterSpacing: 4,
    marginBottom: 4,
  },
  heroMainText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 2,
    lineHeight: 64,
  },
  heroSubText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#a855f7",
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 0.5,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#0ea5e933",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#38bdf8",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  button: {
    width: "100%",
    backgroundColor: "#a855f7",
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "transparent",
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#ffffff",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#94a3b8",
  },
  signedInContainer: {
    width: "100%",
    alignItems: "center",
  },
   signedInText: {
     fontSize: 12,
     fontWeight: "900",
     color: "#10b981",
     letterSpacing: 2,
     marginBottom: 16,
   },
   loadingContainer: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
   },
   loadingText: {
     color: "#a855f7",
     fontSize: 12,
     fontWeight: "900",
     letterSpacing: 2,
     marginTop: 16,
   },
 });
