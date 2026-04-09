import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getPatient, getPatientReadings, postReading } from "../../src/api";
import { BleError, BleManager, Characteristic, Device, Subscription } from "react-native-ble-plx";

const PH_CRITICAL_LOW  = 6.5;
const PH_WARN_LOW      = 6.8;
const PH_WARN_HIGH     = 7.6;
const PH_CRITICAL_HIGH = 8.0;

type PatientProfile = {
  patientId: string;
  fullName: string;
  age: string;
  status: string;
  assignedDoctorId: string;
  createdAt: string;
};

type Reading = {
  readingSK: string;
  pH: number;
  timestamp: string;
};

function phColor(pH: number) {
  if (pH < PH_CRITICAL_LOW || pH > PH_CRITICAL_HIGH) return "#cc0000";
  if (pH < PH_WARN_LOW     || pH > PH_WARN_HIGH)     return "#cc8400";
  return "#1a7a1a";
}

function phLabel(pH: number) {
  if (pH < PH_CRITICAL_LOW || pH > PH_CRITICAL_HIGH) return "Critical";
  if (pH < PH_WARN_LOW     || pH > PH_WARN_HIGH)     return "Warning";
  return "Normal";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Simple sparkline bar chart — no external dependency
function PHChart({ readings }: { readings: Reading[] }) {
  if (readings.length === 0) return null;

  // Show up to 20 readings, oldest → newest (reverse since API returns newest first)
  const data = [...readings].reverse().slice(-20);
  const minY = 5.5;
  const maxY = 8.5;
  const chartH = 80;

  return (
    <View>
      {/* Y-axis labels */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: chartH + 24 }}>
        <View style={{ justifyContent: "space-between", height: chartH, marginRight: 4 }}>
          <Text style={{ fontSize: 9, color: "#999" }}>{maxY.toFixed(1)}</Text>
          <Text style={{ fontSize: 9, color: "#999" }}>{((maxY + minY) / 2).toFixed(1)}</Text>
          <Text style={{ fontSize: 9, color: "#999" }}>{minY.toFixed(1)}</Text>
        </View>
        {/* Bars */}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", height: chartH }}>
          {data.map((r) => {
            const pct = Math.max(0, Math.min(1, (r.pH - minY) / (maxY - minY)));
            const barH = Math.max(4, pct * chartH);
            return (
              <View key={r.readingSK} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: chartH }}>
                <View style={{
                  width: "60%",
                  height: barH,
                  backgroundColor: phColor(r.pH),
                  borderRadius: 3,
                }} />
              </View>
            );
          })}
        </View>
      </View>
      {/* Threshold lines labels */}
      <View style={{ flexDirection: "row", marginTop: 6, justifyContent: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 10, height: 2, backgroundColor: "#1a7a1a", marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: "#666" }}>Normal 6.8–7.6</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 10, height: 2, backgroundColor: "#cc8400", marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: "#666" }}>Warning</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 10, height: 2, backgroundColor: "#cc0000", marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: "#666" }}>Critical</Text>
        </View>
      </View>
    </View>
  );
}

// ─── BLE constants ────────────────────────────────────────────────────────────
const ESP32_DEVICE_NAME   = "ESP32-Device";
const SERVICE_UUID        = "cdbe9e3f-2839-4d61-a1d9-4043e0e0eaeb";
const CHARACTERISTIC_UUID = "00a81b7a-1fc2-467a-aabc-8bf7a71bbf5c";

// Decode base64 string returned by react-native-ble-plx
function decodeBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

type BleStatus = "idle" | "scanning" | "connecting" | "connected" | "error";

const cardStyle = {
  backgroundColor: "white",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
} as const;

export default function PatientPage() {
  const { patientId, fullName } = useLocalSearchParams<{ patientId?: string; fullName?: string }>();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── BLE state ──────────────────────────────────────────────────────────────
  const bleManager = useRef<BleManager | null>(null);
  const connectedDevice = useRef<Device | null>(null);
  const notifSub = useRef<Subscription | null>(null);
  const [bleStatus, setBleStatus] = useState<BleStatus>("idle");
  const [bleError, setBleError] = useState<string | null>(null);
  const [liveReading, setLiveReading] = useState<{ pH: number; voltage: number } | null>(null);

  // Initialise BleManager once (not on web)
  useEffect(() => {
    if (Platform.OS === "web") return;
    bleManager.current = new BleManager();
    return () => {
      disconnectBle();
      bleManager.current?.destroy();
    };
  }, []);

  const disconnectBle = useCallback(() => {
    notifSub.current?.remove();
    notifSub.current = null;
    connectedDevice.current?.cancelConnection();
    connectedDevice.current = null;
    setBleStatus("idle");
  }, []);

  const connectBle = useCallback(async () => {
    if (!bleManager.current || !patientId) return;
    setBleStatus("scanning");
    setBleError(null);

    bleManager.current.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: false },
      async (err: BleError | null, device: Device | null) => {
        if (err) {
          console.warn("[BLE] scan error:", err.message);
          setBleStatus("error");
          setBleError(err.message);
          return;
        }
        if (!device) return;

        const name = device.name ?? device.localName ?? "";
        if (!name.includes(ESP32_DEVICE_NAME)) return;

        bleManager.current!.stopDeviceScan();
        setBleStatus("connecting");

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          connectedDevice.current = connected;
          setBleStatus("connected");

          // Subscribe to pH notifications
          notifSub.current = connected.monitorCharacteristicForService(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            async (charErr: BleError | null, characteristic: Characteristic | null) => {
              if (charErr) {
                console.warn("[BLE] notification error:", charErr.message);
                setBleStatus("error");
                setBleError(charErr.message);
                return;
              }
              if (!characteristic?.value) return;

              try {
                const json = decodeBase64(characteristic.value);
                const parsed = JSON.parse(json);
                const pH      = parseFloat(parsed["pH Value"] ?? parsed["ph"] ?? parsed["pH"]);
                const voltage = parseFloat(parsed["Voltage"]  ?? parsed["voltage"] ?? "0");

                if (isNaN(pH)) return;

                setLiveReading({ pH, voltage });

                // Upload to AWS
                await postReading({ patientId, pH, voltage });

                // Add to local list so chart updates immediately
                const now = new Date().toISOString();
                const newReading: Reading = { readingSK: `READING#${now}`, pH, timestamp: now };
                setReadings(prev => [newReading, ...prev].slice(0, 50));
              } catch (parseErr) {
                console.warn("[BLE] parse error:", parseErr);
              }
            }
          );

          // Handle unexpected disconnection
          connected.onDisconnected(() => {
            setBleStatus("idle");
            setLiveReading(null);
            notifSub.current?.remove();
            notifSub.current = null;
          });
        } catch (connectErr: any) {
          console.warn("[BLE] connect error:", connectErr.message);
          setBleStatus("error");
          setBleError(connectErr.message);
        }
      }
    );

    // Stop scanning after 10 s if no device found
    setTimeout(() => {
      if (bleStatus === "scanning") {
        bleManager.current?.stopDeviceScan();
        setBleStatus("error");
        setBleError("Device not found. Make sure ESP32 is nearby and advertising.");
      }
    }, 10_000);
  }, [patientId, bleStatus]);

  // ─── Data load ─────────────────────────────────────────────────────────────
  const load = async () => {
    if (!patientId) return;
    try {
      const [profileData, readingsData] = await Promise.all([
        getPatient(patientId) as Promise<PatientProfile>,
        getPatientReadings(patientId, 20) as Promise<{ readings: Reading[] }>,
      ]);
      setProfile(profileData);
      setReadings(readingsData.readings || []);
    } catch (e) {
      console.error("[PatientPage] load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const latestPH   = liveReading?.pH ?? readings[0]?.pH ?? null;
  const latestTime = liveReading ? "Live" : (readings[0]?.timestamp ? formatTime(readings[0].timestamp) : null);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f2" }}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f2f2f2" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 2 }}>
        {profile?.fullName ?? fullName ?? "Patient"}
      </Text>
      <Text style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>ID: {patientId}</Text>

      {/* BLE Connect Card (mobile only) */}
      {Platform.OS !== "web" && (
        <View style={cardStyle}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>Device Connection</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 8, height: 8, borderRadius: 4, marginRight: 6,
                backgroundColor: bleStatus === "connected" ? "#1a7a1a" : bleStatus === "error" ? "#cc0000" : "#aaa",
              }} />
              <Text style={{ fontSize: 13, color: "#666", textTransform: "capitalize" }}>{bleStatus}</Text>
            </View>
          </View>
          {bleError && (
            <Text style={{ color: "#cc0000", fontSize: 12, marginBottom: 8 }}>{bleError}</Text>
          )}
          {bleStatus === "connected" ? (
            <TouchableOpacity
              onPress={disconnectBle}
              style={{ backgroundColor: "#eee", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
            >
              <Text style={{ fontWeight: "600", color: "#333" }}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={connectBle}
              disabled={bleStatus === "scanning" || bleStatus === "connecting"}
              style={{
                backgroundColor: bleStatus === "scanning" || bleStatus === "connecting" ? "#ccc" : "#1a7a1a",
                borderRadius: 10, paddingVertical: 10, alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "600", color: "white" }}>
                {bleStatus === "scanning" ? "Scanning…" : bleStatus === "connecting" ? "Connecting…" : "Connect to ESP32"}
              </Text>
            </TouchableOpacity>
          )}
          {liveReading && (
            <Text style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "#555" }}>
              Live — pH {liveReading.pH.toFixed(2)}  |  {liveReading.voltage.toFixed(3)} V
            </Text>
          )}
        </View>
      )}

      {/* Patient Info Card */}
      <View style={cardStyle}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Patient Info</Text>
        <InfoRow label="Age"    value={profile?.age ? `${profile.age} yrs` : "—"} />
        <InfoRow label="Status" value={profile?.status ?? "—"} capitalize />
        <InfoRow label="Enrolled" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"} isLast />
      </View>

      {/* Latest pH Card */}
      <View style={cardStyle}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Latest pH Reading</Text>
        {latestPH !== null ? (
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ fontSize: 64, fontWeight: "700", color: phColor(latestPH) }}>
              {latestPH.toFixed(2)}
            </Text>
            <View style={{
              paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
              backgroundColor: phColor(latestPH) + "22", marginTop: 4,
            }}>
              <Text style={{ color: phColor(latestPH), fontWeight: "600", fontSize: 13 }}>
                {phLabel(latestPH)}
              </Text>
            </View>
            <Text style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
              {latestTime}
            </Text>
          </View>
        ) : (
          <Text style={{ color: "#aaa", textAlign: "center", paddingVertical: 20 }}>
            No readings yet
          </Text>
        )}
      </View>

      {/* pH History Chart */}
      {readings.length > 1 && (
        <View style={cardStyle}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 16 }}>
            pH History ({readings.length} readings)
          </Text>
          <PHChart readings={readings} />
        </View>
      )}

      {/* Readings List */}
      {readings.length > 0 && (
        <View style={cardStyle}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Recent Readings</Text>
          {readings.map((r, i) => (
            <View key={r.readingSK} style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: i < readings.length - 1 ? 1 : 0,
              borderBottomColor: "#f0f0f0",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: phColor(r.pH), marginRight: 10,
                }} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: phColor(r.pH) }}>
                  pH {r.pH.toFixed(2)}
                </Text>
              </View>
              <Text style={{ color: "#999", fontSize: 12 }}>{formatTime(r.timestamp)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value, isLast, capitalize }: {
  label: string; value: string; isLast?: boolean; capitalize?: boolean;
}) {
  return (
    <View style={{
      flexDirection: "row", justifyContent: "space-between",
      paddingBottom: 10, marginBottom: isLast ? 0 : 10,
      borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#f0f0f0",
    }}>
      <Text style={{ color: "#666" }}>{label}</Text>
      <Text style={{ fontWeight: "600", textTransform: capitalize ? "capitalize" : "none" }}>{value}</Text>
    </View>
  );
}
