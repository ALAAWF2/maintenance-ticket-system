const admin = require("firebase-admin");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// تحميل ملف الخدمة
const serviceAccount = require("../maintenance-ticket-syste-e79a1-firebase-adminsdk-fbsvc-5041c159fe.json");

// تهيئة Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// تحميل ملف Excel
const workbook = XLSX.readFile(path.join(__dirname, "../outlet_users_credentials.xlsx"));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// رفع البيانات إلى Firestore
async function uploadUsers() {
  for (const row of data) {
    if (!row.uid || !row["Outlet Name"]) continue;

    const docRef = db.collection("users").doc(row.uid);
    await docRef.set({
      outlet: row["Outlet Name"]
    });
    console.log(`✅ Added ${row["Outlet Name"]}`);
  }
  console.log("✅✅ All users added to Firestore!");
}

uploadUsers().catch(console.error);
