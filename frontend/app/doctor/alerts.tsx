import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';

type Severity = "critical" | "warning";
type Status = "unacknowledged" | "acknowledged";

export default function AlertsPage() {
    return (
        <ScrollView style={{
            flex: 1,
            paddingHorizontal: 24,
            backgroundColor: "#f2f2f2",
        }}>
            <Text style={{ fontWeight: "600", fontSize: 24, marginTop: 15 }}>Alerts</Text>
            <AlertCard
                severity="critical"
                title="pH Below Threshold"
                description="pH dropped to 6.2 (threshold 6.8)"
                patientName="Davis, Emily"
                patientId="123456"
                timeAgo="2 min ago"
                status="unacknowledged"
            />
            <AlertCard
                severity="warning"
                title="pH Approaching Threshold"
                description="pH trending downward (current: 6.9, threshold: 6.8)"
                patientName="Nguyen, Alex"
                patientId="789012"
                timeAgo="10 min ago"
                status="acknowledged"
            />
        </ScrollView>
    )
};

function AlertCard({
    severity,
    title,
    description,
    patientName,
    patientId,
    timeAgo,
    status,
}: {
    severity: Severity;
    title: string;
    description: string;
    patientName: string;
    patientId: string;
    timeAgo: string;
    status: Status;
}) {

    const getSeverityColor = () => {
        if (severity === "critical") return "#cc0000";
        if (severity === "warning") return "#cc8400";
    };

    const getBadgeColor = () => {
        if (severity === "critical") return "#ffe5e5";
        if (severity === "warning") return "#fff4e5";
    };

    return (
        <View style={{ 
            flexDirection: "row", 
            marginTop: 20,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
            overflow: "hidden",
            }}>
            <View style={{ 
                width: 10, 
                backgroundColor: getSeverityColor(),
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
                }}></View>
            <View style={{
            backgroundColor: "white",
            padding: 16,
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            flex: 1,
        }}
        >
            <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
                <View style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 16,
                backgroundColor: getBadgeColor(),
            }}
            >
                <Ionicons name="warning-outline" size={20} color={getSeverityColor()} />
            </View>
                <Text style={{ fontWeight: "600", color: getSeverityColor(), marginLeft: 6, }}>{severity.toUpperCase()}</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 10 }}>{title}</Text>
            <Text style={{ color: "#666", marginTop: 4 }}>{description}</Text>
            <View style={{
                height: 1,
                backgroundColor: "#eee",
                marginVertical: 12,
            }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4}}>
                <Text style={{ fontSize: 12, color: "#666" }}>Patient</Text>
                <View style={{ flexDirection: "row", alignItems: "center"}}>
                    <Ionicons name="time-outline" size={18} color="black" />
                    <Text style={{ marginLeft: 4 }}>{timeAgo}</Text>
                </View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{patientName}</Text>
            <Text style={{ fontSize: 12, marginTop: 4, color: "#666" }}>ID: {patientId}</Text>
            <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 12, 
                backgroundColor: "#eee", 
                marginTop: 8,
                alignSelf: "flex-start",
                }}>
                <Text style={{ color: "#555", fontWeight: "500", fontSize: 12 }}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </View>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
                <TouchableOpacity style={{
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: getSeverityColor(),
                    flex: 1,
                    alignItems: "center",
                    marginRight: 8,
                }}>
                    <Text style={{ color: "white", fontWeight: "600" }}>Acknowledge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#eee",
                    flex: 1,
                    alignItems: "center",
                }}>
                    <Text style={{ color: "#333", fontWeight: "600" }}>View Patient</Text>
                </TouchableOpacity>
            </View>
            </View>
            </View>
    )
}