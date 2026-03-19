import { post, get } from "aws-amplify/api";
// This file contains API calls related to user profiles. It uses AWS Amplify's API module to interact with the backend.


export async function saveUserProfile(data: {
  fullName: string;
  username: string;
  role: "admin" | "doctor";
}) {
  const operation = post({
    apiName: "MedtronicHealthAPI", // must match aws-exports
    path: "/users",
    options: {
      body: data,
    },
  });

  const { body } = await operation.response;
  return await body.json();
}

export async function fetchUserProfile(email: string) {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: "/users",
    options: {
      queryParams: { email },
    },
  });

  const { body } = await operation.response;
  return await body.json();
}
