import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchUserAttributes } from "aws-amplify/auth";
import { getAlerts, acknowledgeAlert } from "../../src/api";

type Severity = "critical" | "warning";

type Alert = {
  patientId: string;
  patientName: string;
  pH: number;
  severity: Severity;
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  readingSK: string;
  acknowledged: boolean;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState<string>("");

  const loadAlerts = useCallback(async (email: string) => {
    try {
      const data = await getAlerts(email) as Alert[];
      setAlerts(data);
    } catch (e) {
      console.error("[AlertsPage] failed to load alerts:", e);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const attrs = await fetchUserAttributes();
        const email = attrs.email ?? "";
        setDoctorEmail(email);
        await loadAlerts(email);
      } catch (e) {
        console.error("[AlertsPage] init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    if (!doctorEmail) return;
    setRefreshing(true);
    await loadAlerts(doctorEmail);
    setRefreshing(false);
  }, [doctorEmail, loadAlerts]);

  const handleAcknowledge = async (alert: Alert) => {
    if (!doctorEmail) return;
    try {
      await acknowledgeAlert({ patientId: alert.patientId, readingSK: alert.readingSK, doctorEmail });
      setAlerts(prev => prev.map(a =>
        a.readingSK === alert.readingSK ? { ...a, acknowledged: true } : a
      ));
    } catch (e) {
      console.error("[AlertsPage] acknowledge error:", e);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, paddingHorizontal: 24, backgroundColor: "#f2f2f2" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontWeight: "600", fontSize: 24, marginTop: 15 }}>Alerts</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="green" />
      ) : alerts.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#aaa" />
          <Text style={{ color: "#aaa", marginTop: 12, fontSize: 16 }}>No abnormal readings</Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <AlertCard
            key={alert.readingSK}
            alert={alert}
            onAcknowledge={() => handleAcknowledge(alert)}
          />
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function AlertCard({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: () => void }) {
  const getSeverityColor = () => alert.severity === "critical" ? "#cc0000" : "#cc8400";
  const getBadgeColor   = () => alert.severity === "critical" ? "#ffe5e5" : "#fff4e5";

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
      }} />
      <View style={{
        backgroundColor: "white",
        padding: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        flex: 1,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: getBadgeColor() }}>
            <Ionicons name="warning-outline" size={20} color={getSeverityColor()} />
          </View>
          <Text style={{ fontWeight: "600", color: getSeverityColor(), marginLeft: 6 }}>
            {alert.severity.toUpperCase()}
          </Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 10 }}>{alert.title}</Text>
        <Text style={{ color: "#666", marginTop: 4 }}>{alert.description}</Text>

        <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 12 }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: "#666" }}>Patient</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="time-outline" size={18} color="black" />
            <Text style={{ marginLeft: 4 }}>{alert.timeAgo}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>{alert.patientName}</Text>
        <Text style={{ fontSize: 12, marginTop: 4, color: "#666" }}>ID: {alert.patientId}</Text>

        <View style={{
          paddingHorizontal: 10, paddingVertical: 6,
          borderRadius: 12, backgroundColor: "#eee",
          marginTop: 8, alignSelf: "flex-start",
        }}>
          <Text style={{ color: "#555", fontWeight: "500", fontSize: 12 }}>
            {alert.acknowledged ? "Acknowledged" : "Unacknowledged"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", marginTop: 12 }}>
          <TouchableOpacity
            onPress={onAcknowledge}
            disabled={alert.acknowledged}
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: alert.acknowledged ? "#ccc" : getSeverityColor(),
              flex: 1,
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
            </Text>
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
  );
}
