import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
import { createPatient, getAllPatients, reassignPatient, getDoctors } from "../src/api";

const Green = "green";

type Patient = {
  patientId: string;
  fullName: string;
  age: string;
  assignedDoctorId: string;
  status: string;
  createdAt: string;
};

type Doctor = {
  userId: string;
  fullName: string;
};

// ─── Reusable doctor picker field ────────────────────────────────────────────
function DoctorPicker({
  doctors,
  selected,
  onSelect,
  label,
}: {
  doctors: Doctor[];
  selected: Doctor | null;
  onSelect: (d: Doctor) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: "#D9EAD3",
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: selected ? "#000" : "#aaa", fontSize: 15 }}>
          {selected ? `${selected.fullName}  (${selected.userId})` : "Select a doctor..."}
        </Text>
        <Text style={{ color: "gray", fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: 24 }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={{ backgroundColor: "white", borderRadius: 16, maxHeight: 360, overflow: "hidden" }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
              <Text style={{ fontWeight: "600", fontSize: 16 }}>Select Doctor</Text>
            </View>
            {doctors.length === 0 ? (
              <Text style={{ color: "gray", textAlign: "center", padding: 24 }}>No doctors found.</Text>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(d) => d.userId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { onSelect(item); setOpen(false); }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderColor: "#f0f0f0",
                      backgroundColor: selected?.userId === item.userId ? "#F0FAF0" : "white",
                    }}
                  >
                    <Text style={{ fontWeight: "600", fontSize: 15 }}>{item.fullName}</Text>
                    <Text style={{ color: "gray", fontSize: 12, marginTop: 2 }}>{item.userId}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [adminId, setAdminId] = useState("");

  // Create patient modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [selectedCreateDoctor, setSelectedCreateDoctor] = useState<Doctor | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Reassign modal state
  const [reassignPatient_, setReassignPatient] = useState<Patient | null>(null);
  const [selectedReassignDoctor, setSelectedReassignDoctor] = useState<Doctor | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const [reassignError, setReassignError] = useState("");

  useEffect(() => {
    loadAdminId();
    loadPatients();
    loadDoctors();
  }, []);

  const loadAdminId = async () => {
    const session = await fetchAuthSession();
    const email = (session.tokens?.idToken?.payload?.email as string) ?? "";
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

  const loadDoctors = async () => {
    try {
      const data: any = await getDoctors();
      setDoctors(data.doctors || []);
    } catch (e) {
      console.error("Failed to load doctors:", e);
    }
  };

  const handleCreatePatient = async () => {
    setCreateError("");
    if (!newName.trim() || !selectedCreateDoctor) {
      setCreateError("Full name and doctor selection are required.");
      return;
    }
    try {
      setCreating(true);
      await createPatient({
        fullName: newName.trim(),
        age: parseInt(newAge) || 0,
        doctorId: selectedCreateDoctor.userId,
        createdByAdminId: adminId,
      });
      setShowCreate(false);
      setNewName("");
      setNewAge("");
      setSelectedCreateDoctor(null);
      await loadPatients();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create patient.");
    } finally {
      setCreating(false);
    }
  };

  const handleReassign = async () => {
    setReassignError("");
    if (!selectedReassignDoctor) {
      setReassignError("Please select a doctor.");
      return;
    }
    try {
      setReassigning(true);
      await reassignPatient(reassignPatient_!.patientId, selectedReassignDoctor.userId);
      setReassignPatient(null);
      setSelectedReassignDoctor(null);
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
            renderItem={({ item }) => {
              const doc = doctors.find((d) => d.userId === item.assignedDoctorId);
              const doctorLabel = doc
                ? `${doc.fullName}  (${doc.userId})`
                : item.assignedDoctorId;
              return (
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
                    Doctor: {doctorLabel}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setReassignPatient(item); setSelectedReassignDoctor(null); }}
                    style={{ marginTop: 10, borderWidth: 1, borderColor: Green, borderRadius: 20, paddingVertical: 6, alignItems: "center" }}
                  >
                    <Text style={{ color: Green, fontSize: 13, fontWeight: "600" }}>Reassign Doctor</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
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
                placeholder="please enter patient full name"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>Age</Text>
              <TextInput
                value={newAge}
                onChangeText={setNewAge}
                placeholder="please enter patient age"
                keyboardType="number-pad"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              <DoctorPicker
                doctors={doctors}
                selected={selectedCreateDoctor}
                onSelect={setSelectedCreateDoctor}
                label="Assign Doctor *"
              />

              {createError ? <Text style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{createError}</Text> : null}

              <TouchableOpacity
                onPress={handleCreatePatient}
                disabled={creating}
                style={{ backgroundColor: creating ? "#7FBF7F" : Green, padding: 16, borderRadius: 30, alignItems: "center", marginBottom: 10 }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{creating ? "Creating..." : "Create Patient"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setShowCreate(false); setCreateError(""); setSelectedCreateDoctor(null); }} style={{ alignItems: "center", padding: 12 }}>
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
                Patient: {reassignPatient_?.fullName}
              </Text>

              <DoctorPicker
                doctors={doctors.filter((d) => d.userId !== reassignPatient_?.assignedDoctorId)}
                selected={selectedReassignDoctor}
                onSelect={setSelectedReassignDoctor}
                label="New Doctor *"
              />

              {reassignError ? <Text style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{reassignError}</Text> : null}

              <TouchableOpacity
                onPress={handleReassign}
                disabled={reassigning}
                style={{ backgroundColor: reassigning ? "#7FBF7F" : Green, padding: 16, borderRadius: 30, alignItems: "center", marginBottom: 10 }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{reassigning ? "Reassigning..." : "Confirm Reassign"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setReassignPatient(null); setReassignError(""); setSelectedReassignDoctor(null); }} style={{ alignItems: "center", padding: 12 }}>
                <Text style={{ color: "gray" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
