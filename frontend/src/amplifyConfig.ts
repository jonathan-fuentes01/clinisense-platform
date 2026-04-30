import "@aws-amplify/react-native"; // registers AsyncStorage + NetInfo adapters for RN
import { Amplify } from "aws-amplify";
import { Hub } from "aws-amplify/utils";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-2_XKq4cKesI",
      userPoolClientId: "md4a9m3t963hasakbkmqss41i",
      identityPoolId: "us-east-2:191ac2fb-5e7a-444e-aad2-4d7729808532",
      signUpVerificationMethod: "code",
    },
  },
  API: {
    REST: {
      MedtronicHealthAPI: {
        endpoint: "https://ttwf6zzrv7.execute-api.us-east-2.amazonaws.com/dev",
        region: "us-east-2",
      },
    },
  },
});

Hub.listen("auth", ({ payload }) => {
  console.log("[Hub:auth] event:", payload.event, "data:", JSON.stringify(payload ?? {}));
});
