import { useAuth } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

exportdefault function Index() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

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
          Forge your own AI-powered courses in seconds. Unleash your creativity and share your knowledge with the world.
        </Text>


        {!isSignedIn ? (
          <>
            <Link href="/sign-up" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.buttonText}>START JOURNEY</Text>
              </Pressable>
            </Link>

            <Link href="/sign-in" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed
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
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.buttonText}>ENTER THE HUB</Text>
            </Pressable>
          </View>
        )}

      </View>

    </View>
  )
}