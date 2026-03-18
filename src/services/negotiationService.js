import { db } from "./firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

// Manager sends initial offer
export const createNegotiation = async (data) => {
  return await addDoc(collection(db, "task_negotiations"), {
    ...data,
    status: "pending",
    created_at: new Date()
  });
};

// Employee counter
export const counterOffer = async (id, counter_price) => {
  const ref = doc(db, "task_negotiations", id);

  return await updateDoc(ref, {
    counter_price,
    status: "countered",
    updated_at: new Date()
  });
};

// Manager accepts
export const acceptOffer = async (id, final_price) => {
  const ref = doc(db, "task_negotiations", id);

  return await updateDoc(ref, {
    final_price,
    status: "accepted",
    updated_at: new Date()
  });
};