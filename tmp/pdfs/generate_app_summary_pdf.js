const fs = require("fs");
const path = require("path");

const outDir = path.resolve("output/pdf");
fs.mkdirSync(outDir, { recursive: true });

const page = { width: 612, height: 792 };
const colors = {
  green: "0.11 0.45 0.23",
  greenSoft: "0.91 0.96 0.92",
  text: "0.12 0.16 0.14",
  muted: "0.35 0.40 0.37",
  border: "0.78 0.86 0.80",
};

const content = {
  title: "Mobile Healthcare Application",
  subtitle:
    "One-page repo summary generated from local project evidence on 2026-03-25.",
  left: [
    {
      title: "What It Is",
      lines: [
        "An Expo/React Native mobile app for a healthcare monitoring workflow tied to AWS Amplify services and ESP32 firmware.",
        "The implemented app supports auth, role-based admin/doctor views, patient assignment, and a placeholder for incoming pH or vitals data.",
      ],
    },
    {
      title: "Who It's For",
      lines: [
        "Primary users are doctors and admins. Doctors review assigned patients; admins create patients and reassign them to doctors.",
      ],
    },
    {
      title: "How To Run",
      bullets: [
        "From the repo root, go to `frontend`.",
        "Run `npm install`.",
        "Run `npx expo start` or `npm start`.",
        "Open the app in Expo Go, an emulator, simulator, or web.",
        "Backend deployment steps: Not found in repo.",
        "Firmware flashing steps: Not found in repo.",
      ],
    },
  ],
  right: [
    {
      title: "What It Does",
      bullets: [
        "Lets users sign up, confirm email, and sign in with AWS Cognito via Amplify Auth.",
        "Routes users by role so admins land on the dashboard and doctors land in doctor tabs.",
        "Stores user profiles with name, email, role, and created date.",
        "Lets admins create patients, assign a doctor, and list all patients.",
        "Lets admins reassign a patient to a different doctor.",
        "Lets doctors refresh and view only their assigned patients.",
        "Shows a patient detail screen reserved for future pH or vitals readings.",
      ],
    },
    {
      title: "How It Works",
      bullets: [
        "Frontend: Expo Router screens in `frontend/app` configure Amplify and call `MedtronicHealthAPI` through `frontend/src/api.ts`.",
        "Auth: Amplify uses a Cognito user pool and identity pool in `us-east-2`; role checks read Cognito groups from the ID token.",
        "API: API Gateway routes `/users`, `/patients`, and `/doctors` to Lambda `UserMeHandler`.",
        "Backend: `UserMeHandler` runs an Express app that writes profiles to DynamoDB table `Users-dev` and patient records plus links to `Medtronic_Health`.",
        "Data model: patient creation and reassignment use DynamoDB transactional writes; doctor and admin views query the same table differently.",
        "Device side: ESP32 firmware reads UART data, converts it to a JSON payload with `Voltage` and `pH Value`, then notifies over BLE.",
        "Mobile BLE ingestion path from the app to the firmware: Not found in repo.",
      ],
    },
  ],
};

function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makeStream() {
  const parts = [];
  return {
    text(x, y, size, font, color, text) {
      parts.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`);
    },
    rect(x, y, w, h, fillColor) {
      parts.push(`${fillColor} rg ${x} ${y} ${w} ${h} re f`);
    },
    strokeRect(x, y, w, h, strokeColor, lineWidth = 1) {
      parts.push(`${lineWidth} w ${strokeColor} RG ${x} ${y} ${w} ${h} re S`);
    },
    line(x1, y1, x2, y2, strokeColor, lineWidth = 1) {
      parts.push(`${lineWidth} w ${strokeColor} RG ${x1} ${y1} m ${x2} ${y2} l S`);
    },
    join() {
      return parts.join("\n");
    },
  };
}

function drawSectionBox(stream, x, yTop, w, title, body) {
  const padX = 14;
  const titleSize = 12;
  const bodySize = 9;
  const lineGap = 12;
  const bulletGap = 2;
  let y = yTop;

  stream.rect(x, y - 22, w, 22, colors.greenSoft);
  stream.strokeRect(x, y - 22, w, 22, colors.border, 0.8);
  stream.text(x + padX, y - 15, titleSize, "F2", colors.green, title);
  y -= 34;

  const maxChars = Math.max(28, Math.floor((w - padX * 2) / 5.3));

  if (body.lines) {
    for (const paragraph of body.lines) {
      const wrapped = wrapText(paragraph, maxChars);
      for (const line of wrapped) {
        stream.text(x + padX, y, bodySize, "F1", colors.text, line);
        y -= lineGap;
      }
      y -= 4;
    }
  }

  if (body.bullets) {
    for (const bullet of body.bullets) {
      const wrapped = wrapText(bullet, maxChars - 2);
      wrapped.forEach((line, idx) => {
        const prefix = idx === 0 ? "- " : "  ";
        stream.text(x + padX, y, bodySize, "F1", colors.text, `${prefix}${line}`);
        y -= lineGap;
      });
      y -= bulletGap;
    }
  }

  const bottom = y - 8;
  const height = yTop - bottom;
  stream.strokeRect(x, bottom, w, height, colors.border, 0.8);
  return bottom - 14;
}

function buildPdf() {
  const stream = makeStream();
  stream.rect(0, 0, page.width, page.height, "1 1 1");
  stream.rect(36, 730, 540, 38, colors.green);
  stream.text(50, 745, 20, "F2", "1 1 1", content.title);
  stream.text(50, 720, 9, "F1", colors.muted, content.subtitle);
  stream.line(36, 708, 576, 708, colors.border, 1);

  const leftX = 36;
  const rightX = 320;
  const colW = 256;
  let leftY = 686;
  let rightY = 686;

  for (const section of content.left) {
    leftY = drawSectionBox(stream, leftX, leftY, colW, section.title, section);
  }
  for (const section of content.right) {
    rightY = drawSectionBox(stream, rightX, rightY, colW, section.title, section);
  }

  const minY = Math.min(leftY, rightY);
  if (minY < 34) {
    throw new Error(`Layout overflowed page bounds at y=${minY}`);
  }

  stream.text(
    36,
    20,
    8,
    "F1",
    colors.muted,
    "Evidence sources: root README, frontend app/screens, frontend Amplify config, Lambda source, and ESP32 firmware source."
  );

  const contents = stream.join();
  const objects = [];
  const addObject = (text) => objects.push(text);

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Count 1 /Kids [3 0 R] >>");
  addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>");
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  addObject(`<< /Length ${Buffer.byteLength(contents, "utf8")} >>\nstream\n${contents}\nendstream`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, idx) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

const pdf = buildPdf();
const outPath = path.join(outDir, "mobile-health-app-summary.pdf");
fs.writeFileSync(outPath, pdf, "utf8");

const raw = fs.readFileSync(outPath, "utf8");
const pageCount = (raw.match(/\/Type \/Page\b/g) || []).length;
if (pageCount !== 1) {
  throw new Error(`Expected 1 page, found ${pageCount}`);
}

console.log(outPath);
