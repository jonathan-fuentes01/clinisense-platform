import React, { useEffect } from "react";
import { Text, View, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      //default:
      router.replace("/onboarding");

      //testing:
      //router.replace("/doctor")
      //router.replace("/admin")
    }, 2000);

    return () => clearTimeout(t);
  }, [router]);
  
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={require("../assets/images/flask.png")}
        style={{
          width: 120,
          height: 120,
          resizeMode: "contain",
          marginBottom: 20,
        }}
      />
      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
          color: "green",
        }}
      >CSULB
      </Text>
      <Text 
        style={{
          fontSize: 20,
          marginTop: 6,
          color: "green",
        }}
      >BMES App
      </Text>
    </View>
  );
}
