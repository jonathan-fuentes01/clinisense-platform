import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AlertsPage() {
    return (
        <View style={{
            flex: 1,
            paddingHorizontal: 24,
            backgroundColor: "#f2f2f2",
        }}>
            {/*AlertCard*/}
            <View style={{ 
                flexDirection: 
                "row", marginTop: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
                overflow: "hidden",
                }}>
                <View style={{ 
                    width: 10, 
                    backgroundColor: "#cc0000",
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
                    backgroundColor: "#ffe5e5",
                }}
                >
                    <Ionicons name="warning-outline" size={20} color="#cc0000" />
                </View>
                    <Text style={{ fontWeight: "600", color: "#cc0000", marginLeft: 6, }}>CRITICAL</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 10 }}>pH Below Threshold</Text>
                <Text style={{ color: "#666", marginTop: 4 }}>pH dropped to 6.2 (threshold: 6.8)</Text>
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
                        <Text style={{ marginLeft: 4 }}>2 min ago</Text>
                    </View>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600" }}>Davis, Emily</Text>
                <Text style={{ fontSize: 12, marginTop: 4, color: "#666" }}>ID: 123456</Text>
                <View style={{ flexDirection: "row", marginTop: 12 }}>
                    <TouchableOpacity style={{
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: "#cc0000",
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
        </View>
    )
}