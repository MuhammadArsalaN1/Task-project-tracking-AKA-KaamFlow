import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const getEmployees = async () => {
  const q = query(collection(db, "users"), where("role", "==", "employee"));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data()
  }));
};