import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { signOut } from "aws-amplify/auth";

export default function ProfileScreen() {
  const Green = "green";

  const handleLogout = async () => {
    await signOut();
    router.replace("/signin");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >

      <Text style={{ fontSize: 26, fontWeight: "bold", color: Green }}>
        CSULB BMES
      </Text>

      <Text
        style={{
          marginTop: 30,
          fontSize: 22,
          fontWeight: "600",
          color: "black",
        }}
      >
        Doctor Page
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 40,
          backgroundColor: Green,
          paddingVertical: 16,
          paddingHorizontal: 40,
          borderRadius: 30,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}