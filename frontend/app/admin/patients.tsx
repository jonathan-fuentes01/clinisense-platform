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
  RefreshControl,
} from "react-native";
import { fetchAuthSession } from "aws-amplify/auth";
import { Ionicons } from "@expo/vector-icons";
import { createPatient, getAllPatients, reassignPatient, getDoctors } from "../../src/api";

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

// ─── Doctor picker ────────────────────────────────────────────────────────────
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

// ─── Patient card ─────────────────────────────────────────────────────────────
function PatientCard({
  patient,
  doctorLabel,
  onReassign,
}: {
  patient: Patient;
  doctorLabel: string;
  onReassign: () => void;
}) {
  return (
    <View style={{
      backgroundColor: "white",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontWeight: "700", fontSize: 16, flex: 1 }}>{patient.fullName}</Text>
        <View style={{
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 20,
          backgroundColor: patient.status === "active" ? "#e6f4ea" : "#f0f0f0",
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: "600",
            color: patient.status === "active" ? Green : "gray",
            textTransform: "capitalize",
          }}>
            {patient.status}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: "#888", fontSize: 13 }}>Age</Text>
        <Text style={{ fontSize: 13, fontWeight: "500" }}>{patient.age || "—"}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: "#888", fontSize: 13 }}>Doctor</Text>
        <Text style={{ fontSize: 13, fontWeight: "500", flex: 1, textAlign: "right", marginLeft: 16 }} numberOfLines={1}>
          {doctorLabel}
        </Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "#888", fontSize: 13 }}>Enrolled</Text>
        <Text style={{ fontSize: 13, fontWeight: "500" }}>
          {new Date(patient.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onReassign}
        style={{
          marginTop: 14,
          borderWidth: 1.5,
          borderColor: Green,
          borderRadius: 12,
          paddingVertical: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: Green, fontSize: 13, fontWeight: "600" }}>Reassign Doctor</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminPatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [adminId, setAdminId] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [selectedCreateDoctor, setSelectedCreateDoctor] = useState<Doctor | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [reassignTarget, setReassignTarget] = useState<Patient | null>(null);
  const [selectedReassignDoctor, setSelectedReassignDoctor] = useState<Doctor | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const [reassignError, setReassignError] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const session = await fetchAuthSession();
    const email = (session.tokens?.idToken?.payload?.email as string) ?? "";
    setAdminId(email);
    await Promise.all([loadPatients(), loadDoctors()]);
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
      setRefreshing(false);
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
      await reassignPatient(reassignTarget!.patientId, selectedReassignDoctor.userId);
      setReassignTarget(null);
      setSelectedReassignDoctor(null);
      await loadPatients();
    } catch (e: any) {
      setReassignError(e?.message ?? "Failed to reassign patient.");
    } finally {
      setReassigning(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      {loadingPatients ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={Green} size="large" />
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.patientId}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Green} />
          }
          ListHeaderComponent={
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: "#888", fontWeight: "500" }}>
                {patients.length} {patients.length === 1 ? "patient" : "patients"} total
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreate(true)}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: Green, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 }}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={{ color: "white", fontWeight: "600", fontSize: 13, marginLeft: 4 }}>New Patient</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={{ color: "#aaa", marginTop: 12, fontSize: 16 }}>No patients yet</Text>
              <Text style={{ color: "#ccc", fontSize: 13, marginTop: 4 }}>Tap "New Patient" to get started</Text>
            </View>
          }
          renderItem={({ item }) => {
            const doc = doctors.find((d) => d.userId === item.assignedDoctorId);
            const doctorLabel = doc ? doc.fullName : item.assignedDoctorId;
            return (
              <PatientCard
                patient={item}
                doctorLabel={doctorLabel}
                onReassign={() => { setReassignTarget(item); setSelectedReassignDoctor(null); }}
              />
            );
          }}
        />
      )}

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
                placeholder="Enter patient full name"
                style={{ borderWidth: 1, borderColor: "#D9EAD3", borderRadius: 10, padding: 12, marginBottom: 12 }}
              />

              <Text style={{ color: "gray", fontSize: 13, marginBottom: 4 }}>Age</Text>
              <TextInput
                value={newAge}
                onChangeText={setNewAge}
                placeholder="Enter patient age"
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

              <TouchableOpacity
                onPress={() => { setShowCreate(false); setCreateError(""); setSelectedCreateDoctor(null); }}
                style={{ alignItems: "center", padding: 12 }}
              >
                <Text style={{ color: "gray" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reassign Doctor Modal */}
      <Modal visible={!!reassignTarget} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>Reassign Doctor</Text>
              <Text style={{ color: "gray", fontSize: 13, marginBottom: 16 }}>
                Patient: {reassignTarget?.fullName}
              </Text>

              <DoctorPicker
                doctors={doctors.filter((d) => d.userId !== reassignTarget?.assignedDoctorId)}
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

              <TouchableOpacity
                onPress={() => { setReassignTarget(null); setReassignError(""); setSelectedReassignDoctor(null); }}
                style={{ alignItems: "center", padding: 12 }}
              >
                <Text style={{ color: "gray" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
