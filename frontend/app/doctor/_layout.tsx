import { Tabs } from "expo-router";

export default function DoctorLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="patients" options={{ title: "Patients" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="patient" options={{ href: null }} />
    </Tabs>
  );
}