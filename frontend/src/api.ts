import { post, get, put } from "aws-amplify/api";
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

export async function createPatient(data: {
  fullName: string;
  age: number;
  doctorId: string;
  createdByAdminId: string;
}) {
  const operation = post({
    apiName: "MedtronicHealthAPI",
    path: "/patients",
    options: { body: data },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function getAllPatients() {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: "/patients",
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function getDoctorPatients(doctorId: string) {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: "/patients",
    options: { queryParams: { doctorId } },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function reassignPatient(patientId: string, newDoctorId: string) {
  const operation = put({
    apiName: "MedtronicHealthAPI",
    path: `/patients/${patientId}`,
    options: { body: { newDoctorId } },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function getDoctors() {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: "/doctors",
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function savePushToken(email: string, pushToken: string) {
  const operation = put({
    apiName: "MedtronicHealthAPI",
    path: "/users/push-token",
    options: { body: { email, pushToken } },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function postReading(data: {
  patientId: string;
  pH: number;
  voltage?: number;
  timestamp?: string;
}) {
  const operation = post({
    apiName: "MedtronicHealthAPI",
    path: "/readings",
    options: { body: data },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function getPatient(patientId: string) {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: `/patients/${patientId}`,
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function getPatientReadings(patientId: string, limit = 20) {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: `/patients/${patientId}/readings`,
    options: { queryParams: { limit: String(limit) } },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function getAlerts(doctorEmail: string) {
  const operation = get({
    apiName: "MedtronicHealthAPI",
    path: "/alerts",
    options: { queryParams: { doctorEmail } },
  });
  const { body } = await operation.response;
  return await body.json();
}

export async function acknowledgeAlert(data: {
  patientId: string;
  readingSK: string;
  doctorEmail: string;
}) {
  const operation = post({
    apiName: "MedtronicHealthAPI",
    path: "/alerts/acknowledge",
    options: { body: data },
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
