import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import * as Notifications from "expo-notifications";
import { fetchUserAttributes } from "aws-amplify/auth";
import { savePushToken } from "../../src/api";

// How notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical iOS/Android devices
  if (Platform.OS === "web") return null;

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("ph-alerts", {
      name: "pH Alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Permission not granted");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("[Push] Expo token:", token);
  return token;
}

export default function DoctorLayout() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Register and save token
    registerForPushNotifications().then(async (token) => {
      if (!token) return;
      try {
        const attrs = await fetchUserAttributes();
        const email = attrs.email ?? "";
        if (email) await savePushToken(email, token);
      } catch (e) {
        console.warn("[Push] Failed to save token:", e);
      }
    });

    // Foreground notification received
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[Push] Received:", notification.request.content.title);
    });

    // User tapped notification → go to alerts tab
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.screen === "alerts") {
        router.push("/doctor/alerts");
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Tabs>
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => <Feather name="alert-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <FontAwesome6 name="user-doctor" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="patient" options={{ href: null }} />
    </Tabs>
  );
}
