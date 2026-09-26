import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  where,
  getDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Diagnostic: log whether Firebase config env vars are set (not their values) ---
if (typeof window !== "undefined") {
  console.log("[Firebase Init] Config check:", {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
  });
}

let app;
let db;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  if (typeof window !== "undefined") {
    console.log("[Firebase Init] ✅ Firebase app and Firestore initialized successfully");
  }
} catch (initError) {
  console.error("[Firebase Init] ❌ Failed to initialize Firebase:", initError);
  throw initError;
}

let storage;
try {
  storage = getStorage(app);
} catch (e) {
  console.warn("Firebase Storage not available:", e);
}

// ===================== USER FUNCTIONS =====================

export async function registerUser(name, email, pin) {
  console.log("[registerUser] Attempting registration for:", email);
  try {
    const userRef = doc(db, "users", email);
    const existing = await getDoc(userRef);
    console.log("[registerUser] Existing user check, exists:", existing.exists());
    if (existing.exists()) {
      throw new Error("An account with this email already exists. Please login instead.");
    }
    await setDoc(userRef, {
      name,
      email,
      pin,
      createdAt: serverTimestamp(),
    });
    console.log("[registerUser] ✅ Registration successful for:", email);
    return { name, email };
  } catch (err) {
    console.error("[registerUser] ❌ Registration error:", err.code || err.message || err);
    throw err;
  }
}

export async function loginUser(email, pin) {
  console.log("[loginUser] Attempting login for:", email);
  try {
    const userRef = doc(db, "users", email);
    console.log("[loginUser] Firestore doc ref created, fetching...");
    const userDoc = await getDoc(userRef);
    console.log("[loginUser] Firestore response received, exists:", userDoc.exists());
    if (!userDoc.exists()) {
      throw new Error("No account found with this email.");
    }
    const userData = userDoc.data();
    if (userData.pin !== pin) {
      throw new Error("Incorrect PIN. Please try again.");
    }
    console.log("[loginUser] ✅ Login successful for:", email);
    return { name: userData.name, email: userData.email };
  } catch (err) {
    console.error("[loginUser] ❌ Login error:", err.code || err.message || err);
    throw err;
  }
}

export async function verifyPin(email, pin) {
  const userRef = doc(db, "users", email);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return false;
  return userDoc.data().pin === pin;
}

export async function getAllUsers() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || null,
  }));
}

// ===================== MESSAGE FUNCTIONS =====================

export async function sendMessage(
  roomId,
  user,
  text,
  fileUrl = null,
  fileType = null,
  fileName = null
) {
  const messagesRef = collection(db, "rooms", roomId, "messages");
  await addDoc(messagesRef, {
    text: text || "",
    userName: user.name,
    userEmail: user.email,
    createdAt: serverTimestamp(),
    isAI: false,
    fileUrl: fileUrl || null,
    fileType: fileType || null,
    fileName: fileName || null,
  });
}

export async function sendAIMessage(roomId, text, replyTo) {
  const messagesRef = collection(db, "rooms", roomId, "messages");
  await addDoc(messagesRef, {
    text,
    userName: "Luna AI",
    userEmail: "ai@chat2.0",
    createdAt: serverTimestamp(),
    isAI: true,
    replyTo: replyTo || null,
    fileUrl: null,
    fileType: null,
    fileName: null,
  });
}

export function subscribeToMessages(roomId, callback, messageLimit = 500) {
  const messagesRef = collection(db, "rooms", roomId, "messages");
  const q = query(
    messagesRef,
    orderBy("createdAt", "asc"),
    limit(messageLimit)
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || new Date(),
    }));
    callback(messages);
  });
}

// ===================== FILE UPLOAD =====================

export async function uploadFile(roomId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('roomId', roomId);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload file to Vercel Blob');
  }

  const data = await res.json();
  return data.url;
}

export function getFileType(file) {
  const type = file.type || "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";
  return "file";
}

// ===================== PRESENCE =====================

export async function setUserOnline(user) {
  const presenceRef = doc(db, "presence", user.email);
  await setDoc(presenceRef, {
    name: user.name,
    email: user.email,
    lastSeen: serverTimestamp(),
    online: true,
  });
}

export async function setUserOffline(user) {
  const presenceRef = doc(db, "presence", user.email);
  await deleteDoc(presenceRef);
}

export function subscribeToPresence(callback) {
  const presenceRef = collection(db, "presence");
  const q = query(presenceRef, where("online", "==", true));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(users);
  });
}

// ===================== ROOMS =====================

export const ROOMS = [
  { id: "general", name: "General", icon: "💬", description: "Chat about anything" },
  { id: "random", name: "Random", icon: "🎲", description: "Random fun stuff" },
  { id: "tech", name: "Tech", icon: "💻", description: "Technology & coding" },
  { id: "gaming", name: "Gaming", icon: "🎮", description: "Games & gaming" },
  { id: "music", name: "Music", icon: "🎵", description: "Music lovers" },
];

export { db, storage };
