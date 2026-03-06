import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { signUp } from "aws-amplify/auth";
import { router } from "expo-router";

type Role = "admin" | "doctor";

export default function SignUp() {
  const [fullName, setFullName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<Role>("doctor");
  const [loading, setLoading] = useState(false);

  const isValid = useMemo(() => {
    const emailLike = username.includes("@") && username.includes(".");
    return fullName.trim().length >= 2 && emailLike && password.length >= 6;
  }, [fullName, username, password]);

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert(
        "Missing Info",
        "Please enter Full Name, a valid Email, and a password (6+ characters)."
      );
      return;
    }

    try {
      setLoading(true);

      await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email: username, // Cognito requires EMAIL
            name: fullName,
           
          },
        },
      });

      Alert.alert("Success", "Check email for confirmation code.");
      router.push("/confirm");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const Green = "green";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingVertical: 28,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header (match onboarding vibe) */}
        <Image
          source={require("../assets/images/flask.png")}
          style={{
            width: 120,
            height: 120,
            resizeMode: "contain",
            marginBottom: 8,
          }}
        />

        <Text style={{ fontSize: 26, fontWeight: "bold", color: Green }}>
          CSULB BMES
        </Text>

        <Text style={{ marginTop: 18, fontSize: 18, color: "gray" }}>
          Create your account
        </Text>

        {/* Card-ish container */}
        <View
          style={{
            width: "100%",
            maxWidth: 520,
            marginTop: 22,
            gap: 12,
          }}
        >
          {/* Full name */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "gray", fontSize: 14 }}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="first name + last name"
              placeholderTextColor="#9aa0a6"
              style={{
                borderWidth: 2,
                borderColor: "#D9EAD3",
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 16,
                fontSize: 16,
              }}
            />
          </View>

          {/* Email */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "gray", fontSize: 14 }}>Email</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="johndoe@email.com"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 2,
                borderColor: "#D9EAD3",
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 16,
                fontSize: 16,
              }}
            />
          </View>

          {/* Password */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "gray", fontSize: 14 }}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9aa0a6"
              secureTextEntry
              style={{
                borderWidth: 2,
                borderColor: "#D9EAD3",
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 16,
                fontSize: 16,
              }}
            />
            <Text style={{ color: "#9aa0a6", fontSize: 12, marginTop: 2 }}>
              Must be at least 6 characters.
            </Text>
          </View>

          {/* Role selector (pill segmented control) */}
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: "gray", fontSize: 14, marginBottom: 8 }}>
              Role
            </Text>

            <View
              style={{
                flexDirection: "row",
                borderWidth: 2,
                borderColor: Green,
                borderRadius: 30,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => setRole("doctor")}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: "center",
                  backgroundColor: role === "doctor" ? Green : "white",
                }}
              >
                <Text
                  style={{
                    color: role === "doctor" ? "white" : Green,
                    fontWeight: "600",
                  }}
                >
                  Doctor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole("admin")}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: "center",
                  backgroundColor: role === "admin" ? Green : "white",
                  borderLeftWidth: 2,
                  borderLeftColor: Green,
                }}
              >
                <Text
                  style={{
                    color: role === "admin" ? "white" : Green,
                    fontWeight: "600",
                  }}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#9aa0a6", fontSize: 12, marginTop: 8 }}>
              (Role will be saved later in DynamoDB/API — currently used for routing.)
            </Text>
          </View>

          {/* Primary button (match onboarding "Login" style) */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || loading}
            style={{
              marginTop: 14,
              backgroundColor: !isValid || loading ? "#7FBF7F" : Green,
              paddingVertical: 18,
              borderRadius: 30,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Secondary button (match onboarding outline button) */}
          <TouchableOpacity
            onPress={() => router.push("/signin")}
            style={{
              marginTop: 10,
              backgroundColor: "white",
              borderColor: Green,
              borderWidth: 2,
              paddingVertical: 18,
              borderRadius: 30,
              alignItems: "center",
            }}
          >
            <Text style={{ color: Green, fontSize: 16, fontWeight: "600" }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}