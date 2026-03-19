import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
import { createPatient, getAllPatients, reassignPatient } from "../src/api";

const Green = "green";

type Patient = {
  patientId: string;
  fullName: string;
  age: string;
  assignedDoctorId: string;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [adminId, setAdminId] = useState("");

  // Create patient modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newDoctorId, setNewDoctorId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Reassign modal state
  const [reassignPatient_, setReassignPatient] = useState<Patient | null>(null);
  const [reassignDoctorId, setReassignDoctorId] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [reassignError, setReassignError] = useState("");

  useEffect(() => {
    loadAdminId();
    loadPatients();
  }, []);

  const loadAdminId = async () => {
    const session = await fetchAuthSession();
    const email = session.tokens?.idToken?.payload?.email as string ?? "";
    setAdminId(email);
  };

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const data: any = await getAllPatients();
      setPatients(data.patients || []);
    } catch (e) {
      console.error("Failed to load patients:", e);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleCreatePatient = async () => {
    setCreateError("");
    if (!newName.trim() || !newDoctorId.trim()) {
      setCreateError("Full name and Doctor ID are required.");
      return;
    }
    try {
      setCreating(true);
      await createPatient({
        fullName: newName.trim(),
        age: parseInt(newAge) || 0,
        doctorId: newDoctorId.trim(),
        createdByAdminId: adminId,
      });
      setShowCreate(false);
      setNewName("");
      setNewAge("");
      setNewDoctorId("");
      await loadPatients();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create patient.");
    } finally {
      setCreating(false);
    }
  };

  const handleReassign = async () => {
    setReassignError("");
    if (!reassignDoctorId.trim()) {
      setReassignError("New Doctor ID is required.");
      return;
    }
    try {
      setReassigning(true);
      await reassignPatient(reassignPatient_!.patientId, reassignDoctorId.trim());
      setReassignPatient(null);
      setReassignDoctorId("");
      await loadPatients();
    } catch (e: any) {
      setReassignError(e?.message ?? "Failed to reassign patient.");
    } finally {
      setReassigning(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/signin");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <View style={{ backgroundColor: Green, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: "white", fontSize: 14 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Patient list */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            Patients ({patients.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{ backgroundColor: Green, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>+ New Patient</Text>
          </TouchableOpacity>
        </View>

        {loadingPatients ? (
          <ActivityIndicator color={Green} style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <Text style={{ color: "gray", textAlign: "center", marginTop: 40 }}>
            No patients yet. Create one to get started.
          </Text>
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.patientId}
            renderItem={({ item }) => (
              <View style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>{item.fullName}</Text>
                  <Text style={{ color: item.status === "active" ? Green : "gray", fontSize: 12 }}>
                    {item.status}
                  </Text>
                </View>
                <Text style={{ color: "gray", fontSize: 13, marginTop: 4 }}>
                  ID: {item.patientId}  ·  Age: {item.age}
                </Text>
                <Text style={{ color: "gray", fontSize: 13 }}>
                  Doctor: {item.assignedDoctorId}
                </Text>
                <TouchableOpacity
                  onPress={() => { setReassignPatient(item); setReassignDoctorId(""); }}
                  style={{ marginTop: 10, borderWidth: 1, borderColor: Green, borderRadius: 20, paddingVertical: 6, alignItems: "center" }}
                >
                  <Text style={{ color: Green, fontSize: 13, fontWeight: "600" }}>Reassign Doctor</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Create Patient Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>New Patient</Text>

              <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>Full Name *</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Jane Doe"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>Age</Text>
              <TextInput
                value={newAge}
                onChangeText={setNewAge}
                placeholder="45"
                keyboardType="number-pad"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>Doctor ID *</Text>
              <TextInput
                value={newDoctorId}
                onChangeText={setNewDoctorId}
                placeholder="D-001"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              {createError ? <Text style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{createError}</Text> : null}

              <TouchableOpacity
                onPress={handleCreatePatient}
                disabled={creating}
                style={{ backgroundColor: creating ? "#7FBF7F" : Green, padding: 16, borderRadius: 30, alignItems: "center", marginBottom: 10 }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{creating ? "Creating..." : "Create Patient"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setShowCreate(false); setCreateError(""); }} style={{ alignItems: "center", padding: 12 }}>
                <Text style={{ color: "gray" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reassign Doctor Modal */}
      <Modal visible={!!reassignPatient_} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>Reassign Doctor</Text>
              <Text style={{ color: "gray", fontSize: 13, marginBottom: 16 }}>
                Patient: {reassignPatient_?.fullName} · Current: {reassignPatient_?.assignedDoctorId}
              </Text>

              <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>New Doctor ID *</Text>
              <TextInput
                value={reassignDoctorId}
                onChangeText={setReassignDoctorId}
                placeholder="D-002"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              {reassignError ? <Text style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{reassignError}</Text> : null}

              <TouchableOpacity
                onPress={handleReassign}
                disabled={reassigning}
                style={{ backgroundColor: reassigning ? "#7FBF7F" : Green, padding: 16, borderRadius: 30, alignItems: "center", marginBottom: 10 }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{reassigning ? "Reassigning..." : "Confirm Reassign"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setReassignPatient(null); setReassignError(""); }} style={{ alignItems: "center", padding: 12 }}>
                <Text style={{ color: "gray" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
