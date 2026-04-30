import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { getDoctorPatients } from "../../src/api";
import Ionicons from "@expo/vector-icons/Ionicons";

type Patient = {
    patientId: string;
    fullName: string;
    linkedAt: string;
};

export default function PatientsScreen() {
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [doctorId, setDoctorId] = React.useState("");

    React.useEffect(() => {
        initPage();
    }, []);

    const initPage = async () => {
        try {
            const session = await fetchAuthSession();
            const payload = session.tokens?.idToken?.payload as any;
            const email = (payload?.email as string) ?? "";
            setDoctorId(email);
            await loadPatients(email);
        } catch (e) {
            console.error("Failed to init doctor page:", e);
            setError("Failed to load page.");
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
            setError("Unable to load patients.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadPatients();
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f2" }}>
                <ActivityIndicator color="green" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f2" }}>
                <Text style={{ color: "gray" }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
            <FlatList
                data={patients}
                keyExtractor={(item) => item.patientId}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="green" />
                }
                ListHeaderComponent={
                    <Text style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: "500" }}>
                        {patients.length} {patients.length === 1 ? "patient" : "patients"} assigned
                    </Text>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: "center", marginTop: 60 }}>
                        <Ionicons name="people-outline" size={48} color="#ccc" />
                        <Text style={{ color: "#aaa", marginTop: 12, fontSize: 16 }}>No patients assigned yet</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <PatientCard
                        patient={item}
                        onPress={() =>
                            router.push({
                                pathname: "/doctor/patient",
                                params: { patientId: item.patientId, fullName: item.fullName },
                            })
                        }
                    />
                )}
            />
        </View>
    );
}

function PatientCard({ patient, onPress }: { patient: Patient; onPress: () => void }) {
    const nameParts = patient.fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const formattedName = nameParts.length > 1 ? `${lastName}, ${firstName}` : patient.fullName;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: "white",
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>{formattedName}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
            <Text style={{ marginTop: 8, color: "#999", fontSize: 13 }}>
                Enrolled {new Date(patient.linkedAt).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );
}
