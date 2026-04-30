import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { signOut, fetchUserAttributes } from "aws-amplify/auth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fetchUserProfile } from "../../src/api";

const Green = "green";

type UserProfile = {
  fullName: string;
  email: string;
  role: string;
};

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: "#f0f0f0",
    }}>
      <Text style={{ color: "#666" }}>{label}</Text>
      <Text style={{ color: "#000", fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

export default function AdminProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const attrs = await fetchUserAttributes();
        const email = attrs.email ?? "";
        const data = await fetchUserProfile(email) as UserProfile;
        setProfile(data);
      } catch (e) {
        console.error("[AdminProfile] failed to load profile:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace("/signin");
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2", paddingHorizontal: 24 }}>
      <Text style={{ marginTop: 15, fontWeight: "600", fontSize: 24 }}>Profile</Text>
      <Text style={{ color: "#666", marginTop: 4, marginBottom: 5 }}>Account Information</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Green} />
      ) : (
        <>
          {/* Identity card */}
          <View style={[cardStyle, { alignItems: "center", marginTop: 20 }]}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#e0f0e0",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <MaterialCommunityIcons name="shield-account" size={34} color={Green} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 8 }}>
              {profile?.fullName ?? "—"}
            </Text>
            <View style={{
              marginTop: 6,
              paddingHorizontal: 12,
              paddingVertical: 3,
              borderRadius: 20,
              backgroundColor: "#e6f4ea",
            }}>
              <Text style={{ color: Green, fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>
                {profile?.role ?? "admin"}
              </Text>
            </View>
          </View>

          {/* Account details */}
          <View style={[cardStyle, { marginTop: 16 }]}>
            <Text style={{ fontSize: 17, fontWeight: "600", marginBottom: 10 }}>Account Details</Text>
            <InfoRow label="Full Name" value={profile?.fullName ?? "—"} />
            <InfoRow label="Email" value={profile?.email ?? "—"} />
            <InfoRow label="Role" value={profile?.role ?? "—"} isLast />
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 24,
          backgroundColor: Green,
          paddingVertical: 16,
          width: "100%",
          borderRadius: 30,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginRight: 6 }}>
            Logout
          </Text>
          <MaterialCommunityIcons name="logout" size={24} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
