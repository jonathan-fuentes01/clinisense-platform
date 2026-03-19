import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
import { getDoctorPatients } from "../src/api";

const Green = "green";

type Patient = {
  patientId: string;
  fullName: string;
  linkedAt: string;
};

export default function DoctorPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload as any;
      const email = (payload?.email as string) ?? "";
      const name = (payload?.name as string) ?? email;
      setDoctorId(email);
      setDoctorName(name);
      await loadPatients(email);
    } catch (e) {
      console.error("Failed to init doctor page:", e);
      setLoading(false);
    }
  };

  const loadPatients = async (id?: string) => {
    const uid = id ?? doctorId;
    if (!uid) return;
    try {
      const data: any = await getDoctorPatients(uid);
      setPatients(data.patients || []);
    } catch (e) {
      console.error("Failed to load patients:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/signin");
  };

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
        <View>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
            Doctor Dashboard
          </Text>
          {doctorName ? (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>
              {doctorName}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: "white", fontSize: 14 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Patient list */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
          My Patients {!loading && `(${patients.length})`}
        </Text>

        {loading ? (
          <ActivityIndicator color={Green} style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <Text style={{ color: "gray", textAlign: "center", marginTop: 40 }}>
            No patients assigned yet.
          </Text>
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.patientId}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Green} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/patient",
                    params: { patientId: item.patientId, fullName: item.fullName },
                  })
                }
                style={{
                  borderWidth: 1,
                  borderColor: "#D9EAD3",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>{item.fullName}</Text>
                  <Text style={{ color: "gray", fontSize: 12, marginTop: 4 }}>
                    ID: {item.patientId}
                  </Text>
                  <Text style={{ color: "gray", fontSize: 12 }}>
                    Linked: {new Date(item.linkedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ color: Green, fontSize: 13, fontWeight: "600" }}>View →</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
