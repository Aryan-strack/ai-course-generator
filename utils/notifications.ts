import { Platform } from "react-native";

type ExpoNotificationsModule = typeof import("expo-notifications");

let notificationsModulePromise: Promise<ExpoNotificationsModule | null> | null =
  null;
let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  if (Platform.OS === "web") {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications")
      .then((module) => {
        if (!notificationHandlerConfigured) {
          module.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });

          notificationHandlerConfigured = true;
        }

        return module;
      })
      .catch((error) => {
        console.warn(
          "expo-notifications native module is unavailable. Notifications will be disabled until you rebuild with the expo-notifications plugin.",
          error,
        );
        return null;
      });
  }

  return notificationsModulePromise;
}

/**
 * Requests necessary permissions for local notifications.
 */
export async function requestNotificationPermissions() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("User did not grant notification permissions.");
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
}

/**
 * Sends a local notification.
 */
export async function sendLocalNotification(title: string, body: string) {
  try {
    const Notifications = await getNotificationsModule();

    if (!Notifications) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // send immediately
    });
  } catch (error) {
    console.error("Error sending local notification:", error);
  }
}
