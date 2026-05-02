import { Tabs } from "expo-router";
import { Tent, Sword, Zap, User } from "lucide-react-native";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#a855f7",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#111827", // Slightly lighter for contrast
          borderWidth: 1,
          borderColor: "#1e293b",
          position: "absolute",
          bottom: Platform.OS === "ios" ? 32 : 24,
          left: 20,
          right: 20,
          borderRadius: 32,
          height: 72,
          paddingBottom: 12,
          paddingTop: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "900",
          marginTop: 4,
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "CAMP",
          tabBarIcon: ({ color, size }) => <Tent color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: "QUESTS",
          tabBarIcon: ({ color, size }) => <Sword color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "STATS",
          tabBarIcon: ({ color, size }) => <Zap color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
