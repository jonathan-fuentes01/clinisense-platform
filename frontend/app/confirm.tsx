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

import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { router, useLocalSearchParams } from "expo-router";
import { saveUserProfile } from "../src/api";

export default function Confirm() {
  const params = useLocalSearchParams<{ email?: string; fullName?: string; role?: string }>();

  const [email, setEmail] = useState<string>((params.email ?? "").toString());
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const Green = "green";

  const isValid = useMemo(() => {
    const emailLike = email.includes("@") && email.includes(".");
    return emailLike && code.trim().length >= 4;
  }, [email, code]);

  const handleConfirm = async () => {
    if (!isValid) {
      Alert.alert("Missing Info", "Please enter a valid Email and the code.");
      return;
    }

    try {
      setLoading(true);

      await confirmSignUp({
        username: email,
        confirmationCode: code.trim(),
      });

      // Save user profile to DynamoDB after successful confirmation
      try {
        await saveUserProfile({
          fullName: (params.fullName ?? "").toString(),
          username: email,
          role: (params.role ?? "doctor") as "admin" | "doctor",
        });
      } catch (profileError) {
        console.warn("Profile save failed:", profileError);
      }

      Alert.alert("Success", "Account confirmed! Please login.");
      router.replace({ pathname: "/signin", params: { email } });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const emailLike = email.includes("@") && email.includes(".");
    if (!emailLike) {
      Alert.alert("Email Required", "Enter your email first so we can resend the code.");
      return;
    }

    try {
      setResending(true);
      await resendSignUpCode({ username: email });
      Alert.alert("Sent", "A new confirmation code was sent to your email.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

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
        {/* Header (match onboarding/signup) */}
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
          Confirm your account
        </Text>

        {/* Form container */}
        <View
          style={{
            width: "100%",
            maxWidth: 520,
            marginTop: 22,
            gap: 12,
          }}
        >
          {/* Email */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "gray", fontSize: 14 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
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

          {/* Code */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "gray", fontSize: 14 }}>Confirmation Code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor="#9aa0a6"
              keyboardType="number-pad"
              style={{
                borderWidth: 2,
                borderColor: "#D9EAD3",
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 16,
                fontSize: 16,
                letterSpacing: 2,
              }}
            />
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            onPress={handleConfirm}
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
              {loading ? "Confirming..." : "Confirm Account"}
            </Text>
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
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
              {resending ? "Resending..." : "Resend Code"}
            </Text>
          </TouchableOpacity>

          {/* Back to login */}
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