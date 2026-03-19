import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

// sign in logic from the AWS Amplify documentation: https://docs.amplify.aws/lib/auth/emailpassword/q/platform/react-native/#sign-in
import { signIn, fetchAuthSession } from "aws-amplify/auth";

export default function SignIn() {
  const params = useLocalSearchParams<{ email?: string }>();

  const [username, setUsername] = useState<string>(
    (params.email ?? "").toString()
  );
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const Green = "green";

  const isValid = useMemo(() => {
    const emailLike = username.includes("@") && username.includes(".");
    return emailLike && password.length >= 6;
  }, [username, password]);

  const routeByRole = async () => {
    const session = await fetchAuthSession();

    const payload: any = session.tokens?.idToken?.payload;
    console.log("[routeByRole] payload:", JSON.stringify(payload));

    const groupsRaw = payload?.["cognito:groups"] ?? [];
    const groups = Array.isArray(groupsRaw) ? groupsRaw : [groupsRaw];
    console.log("[routeByRole] groups:", groups);

    const isAdmin = groups
      .filter(Boolean)
      .map((g: string) => g.toLowerCase())
      .includes("admin");

    console.log("[routeByRole] isAdmin:", isAdmin, "→ navigating to:", isAdmin ? "/admin" : "/doctor");

    if (isAdmin) router.replace("/admin");
    else router.replace("/doctor");
  };

  const handleSignIn = async () => {
    console.log("[handleSignIn] called, isValid:", isValid, "username:", username, "passwordLen:", password.length);
    setError("");

    if (!isValid) {
      setError("Please enter a valid Email and a password (6+ characters).");
      return;
    }

    try {
      setLoading(true);
      console.log("[handleSignIn] calling signIn...");
      await signIn({ username, password });
      console.log("[handleSignIn] signIn succeeded, calling routeByRole...");
      await routeByRole();
    } catch (e: any) {
      // If a session already exists, skip re-auth and route directly
      if (e?.name === "UserAlreadyAuthenticatedException") {
        console.log("[handleSignIn] already authenticated, routing by role...");
        await routeByRole();
        return;
      }
      console.error("[handleSignIn] error:", e);
      setError(e?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
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
          Login to Detect pH
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

          {/* Inline error */}
          {error ? (
            <Text style={{ color: "red", fontSize: 13, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}

          {/* Primary button */}
          <TouchableOpacity
            onPress={handleSignIn}
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
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          {/* Secondary buttons */}
          <TouchableOpacity
            onPress={() => router.push("/signup")}
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
              Sign Up
            </Text>
          </TouchableOpacity>

         
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}