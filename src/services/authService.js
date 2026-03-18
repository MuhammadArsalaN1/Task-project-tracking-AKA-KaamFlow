import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  doc,
  setDoc,
  runTransaction,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";


// =======================================
// 🔥 DUPLICATE CHECK (FIXED)
// =======================================
const checkDuplicates = async (cnic, phone) => {
  const usersRef = collection(db, "users");

  const cnicQuery = query(usersRef, where("cnic", "==", cnic));
  const phoneQuery = query(usersRef, where("phone", "==", phone));

  const [cnicSnap, phoneSnap] = await Promise.all([
    getDocs(cnicQuery),
    getDocs(phoneQuery)
  ]);

  if (!cnicSnap.empty) throw new Error("CNIC already exists");
  if (!phoneSnap.empty) throw new Error("Phone already exists");
};


// =======================================
// 🔥 GENERATE USER ID (ATOMIC SAFE)
// =======================================
const generateUserId = async (fullName, role, department) => {
  const counterRef = doc(db, "counters", "global");

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let count = 1;

    if (counterDoc.exists()) {
      count = counterDoc.data().value + 1;
    }

    transaction.set(counterRef, { value: count });

    const firstName = fullName.split(" ")[0];

    if (role === "manager") {
      return `MGR-${firstName}-${count}`;
    } else {
      return `${department}-${firstName}-${count}`;
    }
  });
};


// =======================================
// ✅ SIGNUP (FINAL FIXED)
// =======================================
export const signupUser = async (data) => {
  const {
    email,
    password,
    fullName,
    role,
    department,
    phone,
    cnic,
    address
  } = data;

  try {
    // 🔥 STEP 1: CHECK DUPLICATES (NOW SAFE WITH RULE UPDATE)
    await checkDuplicates(cnic, phone);

    // 🔥 STEP 2: CREATE AUTH USER
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    if (!user || !user.uid) {
      throw new Error("Auth failed. No UID received.");
    }

    // 🔥 STEP 3: GENERATE USER ID
    const userId = await generateUserId(fullName, role, department);

    // 🔥 STEP 4: SAVE TO FIRESTORE (CRITICAL FIX)
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      fullName,
      email,
      role,
      department: role === "employee" ? department : null,
      userId,
      phone,
      cnic,
      address,
      createdAt: new Date()
    });

    return user;

  } catch (error) {
    console.error("Signup Error:", error);
    throw error;
  }
};


// =======================================
// ✅ LOGIN
// =======================================
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return userCredential.user;

  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};


// =======================================
// ✅ LOGOUT
// =======================================
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};