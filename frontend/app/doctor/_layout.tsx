import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';

export default function DoctorLayout() {
    return (
    <Tabs>
        <Tabs.Screen 
        name="patients" 
        options={{ 
        title: "Patients",
        tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color}/>
        ),
       }} 
       />
      <Tabs.Screen 
      name="alerts" 
      options={{ 
        title: "Alerts",
        tabBarIcon: ({ color, size }) => (
            <Feather name="alert-circle" size={size} color={color} />
        )
       }} 
       />
      <Tabs.Screen 
      name="profile" 
      options={{ 
        title: "Profile",
        tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="user-doctor" size={size} color={color} />
        )
       }} 
       />
      <Tabs.Screen name="patient" options={{ href: null }} />
    </Tabs>
  );
}