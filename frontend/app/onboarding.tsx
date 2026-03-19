import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Onboarding() {
    const router = useRouter();

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 24,
            }}
        >
            <View
                style={{
                    width: "100%",
                    maxWidth: 520,
                    marginTop: 30,
                    gap: 12,
                    alignItems: "center",
                }}
            >
                <Image
                    source={require("../assets/images/flask.png")}
                    style={{
                        width: 150,
                        height: 150,
                        resizeMode: "contain",
                        marginBottom: 10,
                    }}
                />
                <Text
                    style={{
                        fontSize: 26,
                        fontWeight: "bold",
                        color: "green",
                    }}
                >
                    CSULB BMES
                </Text>
                <Text
                    style={{
                        marginTop: 30,
                        fontSize: 20,
                        color: "gray",
                    }}
                >
                    Login to Detect pH
                </Text>

                <TouchableOpacity
                    onPress={() => router.push("/signin")}
                    style={{
                        width: "100%",
                        backgroundColor: "green",
                        paddingVertical: 20,
                        alignItems: "center",
                        borderRadius: 30,
                    }}
                >
                    <Text
                        style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        Login
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.push("/signup")}
                    style={{
                        marginTop: 10,
                        backgroundColor: "white",
                        borderColor: "green",
                        borderWidth: 2,
                        paddingVertical: 20,
                        borderRadius: 30,
                        alignItems: "center",
                        width: "100%"
                    }}
                >
                    <Text
                        style={{
                            color: "green",
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}