import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const Green = "green";

export default function PatientPage() {
  const { patientId, fullName } = useLocalSearchParams<{
    patientId?: string;
    fullName?: string;
  }>();

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: Green,
          paddingTop: 56,
          paddingBottom: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "white", fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
          Patient Details
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
          {fullName ?? "Patient"}
        </Text>
        <Text style={{ color: "gray", fontSize: 13, marginBottom: 24 }}>
          ID: {patientId}
        </Text>

        {/* Placeholder for vitals / readings */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#D9EAD3",
            borderRadius: 12,
            padding: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "gray", fontSize: 15 }}>
            Vitals & readings coming soon
          </Text>
          <Text style={{ color: "gray", fontSize: 13, marginTop: 6, textAlign: "center" }}>
            ESP32 pH data will appear here once the device endpoint is connected.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
