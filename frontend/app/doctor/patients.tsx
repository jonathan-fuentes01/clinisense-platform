import React from "react";
import { View, Text, FlatList } from "react-native";

type Patient = {
    id: string;
    name: string;
    status: "normal" | "warning" | "critical";
    ph: number;
    lastUpdated: string;
};

const DATA: Patient[] = [
    {id: "1", name: "Wayne Smith", status: "normal", ph: 7.2, lastUpdated: "2 min ago"},
    {id: "2", name: "Lilian Watson", status: "critical", ph: 6.2, lastUpdated: "10 min ago"},
    {id: "3", name: "Theresa White", status: "warning", ph: 6.8, lastUpdated: "15 min ago"},
    {id: "4", name: "Bobby Lanes", status: "normal", ph: 7.1, lastUpdated: "7 min ago"},
]

export default function PatientsScreen() {
    const [ patients, setPatients ] = React.useState<Patient[]>([]);
    const [ loading, setLoading ] = React.useState(true);
    const [ error, setError ] = React.useState<string | null>(null);

    React.useEffect(() => {
        setTimeout(() => {
            setPatients(DATA);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return <Text>Loading patients...</Text>;
    } 
    if (error) {
        return <Text>Unable to load patients.</Text>;
    } 
    if (patients.length === 0) {
        return <Text>No patients found.</Text>
    }

    return (
        <View style={{
            flex: 1, 
            backgroundColor: "#f2f2f2", 
            padding: 16
        }}
        >
            <Text style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 12,
            }}
            >Current Patients</Text>
            <FlatList 
                data={patients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PatientCard patient={item}/>
                )}
            />
        </View>
    )
};

function PatientCard({ patient }: {patient: Patient}) {
    const nameParts = patient.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const formattedName = `${lastName}, ${firstName}`;

    const getColor= () => {
        if (patient.status === "critical") return "#cc0000";
        if (patient.status === "warning") return "#cc8400";
        return "#2e7d32";
    };
    
    const getBackground = () => {
        if (patient.status === "critical") return "#ffe5e5";
        if (patient.status === "warning") return "#fff4e5";
        return "#e6f4ea";
    };

    return (
        <View style={{
            backgroundColor: "white",
            padding: 16,
            borderRadius: 16,
            marginBottom: 12,
            
            // ios
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2},
            shadowOpacity: 0.08,
            shadowRadius: 6,

            // android
            elevation: 2,
        }}
        >
            <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: "600",
                }}>
                    {formattedName}
                </Text>
                <View style={{
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    backgroundColor: getBackground(),
                }}>
                    <Text style={{
                        color: getColor(),
                        fontWeight: "600",
                        fontSize: 13,
                    }}>
                        {patient.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={{
                marginTop: 10,
                color: "#666",
            }}>
                pH: {patient.ph} • Updated {patient.lastUpdated}
            </Text>
        </View>
    );
}