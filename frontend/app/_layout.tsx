// import { Stack } from "expo-router";

// export default function RootLayout() {
//   return <Stack />;
// }



// MY LU CODE MODIFY for AOMPLIFY AWS services 3/6/2026
import "./amplifyConfig";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}