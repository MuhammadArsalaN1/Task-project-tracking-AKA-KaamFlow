import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  runTransaction,
  query,
  orderBy,
  arrayUnion,
  increment
} from "firebase/firestore";
import { getPakistanDateISO } from "../utils/time";


// ===============================
// ✅ GET ALL TASKS
// ===============================
export const getTasks = async () => {
  const q = query(
    collection(db, "tasks"),
    orderBy("task_number", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};


// ===============================
// ✅ CREATE TASK
// ===============================
export const createTask = async (task) => {
  const counterRef = doc(db, "counters", "task_counter");

  let newNumber;

  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {
      newNumber = 1;
      transaction.set(counterRef, { current: 1 });
      return;
    }

    const current = counterDoc.data().current || 0;
    newNumber = current + 1;

    transaction.update(counterRef, {
      current: newNumber
    });
  });

  const dept = (task.department || "GEN").toUpperCase();
  const project_id = `PRJ-${dept}-${newNumber}`;

  return await addDoc(collection(db, "tasks"), {
    ...task,

    // 🆔 ID
    project_id,
    task_number: newNumber,

    // 📌 STATUS
    status: "assigned",
    progress: 0,
    revisions: 0,

    // 👨‍💻 ASSIGNMENT
    assignedTo: task.assignedTo,
    assignedToName: task.assignedToName || "",
    assignedToEmployeeId: task.assignedToEmployeeId || "",
    assignedAt: getPakistanDateISO(),

    // 💰 PRICING
    priceHistory: [
      {
        sender: "manager",
        price: task.price || 0,
        comment: task.comment || "",
        timestamp: new Date()
      }
    ],
    finalPrice: task.price || 0,
    price_status: "pending",

    // 💬 COMMENTS
    comments: task.comment
      ? [
          {
            sender: "manager",
            text: task.comment,
            timestamp: new Date()
          }
        ]
      : [],

    // 📊 SYSTEM
    created_at: new Date(),
    updated_at: new Date()
  });
};


// ===============================
// ✅ UPDATE TASK
// ===============================
export const updateTask = async (id, data) => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    ...data,
    updated_at: new Date()
  });
};


// ===============================
// ✅ DELETE TASK
// ===============================
export const deleteTask = async (id) => {
  const ref = doc(db, "tasks", id);
  return await deleteDoc(ref);
};


// ===============================
// 🔁 REQUEST REVISION
// ===============================
export const requestRevision = async (id, note = "") => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    status: "revision_requested",
    revisions: increment(1),
    ...(note && {
      comments: arrayUnion({
        sender: "manager",
        text: note,
        timestamp: new Date()
      })
    }),
    updated_at: new Date()
  });
};


// ===============================
// 💰 EMPLOYEE SUBMIT PRICE
// ===============================
export const submitPrice = async (id, price, comment = "") => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    priceHistory: arrayUnion({
      sender: "employee",
      price,
      comment,
      timestamp: new Date()
    }),
    price_status: "pending",
    updated_at: new Date()
  });
};


// ===============================
// 💰 MANAGER COUNTER PRICE
// ===============================
export const counterPrice = async (id, price, comment = "") => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    priceHistory: arrayUnion({
      sender: "manager",
      price,
      comment,
      timestamp: new Date()
    }),
    price_status: "countered",
    updated_at: new Date()
  });
};


// ===============================
// 💰 ACCEPT PRICE → START WORK
// ===============================
export const acceptPrice = async (id, finalPrice) => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    finalPrice,
    price_status: "accepted",
    status: "in_progress",
    updated_at: new Date()
  });
};


// ===============================
// ✅ MARK COMPLETED (APPROVE DELIVERY)
// ===============================
export const markCompleted = async (id) => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    status: "completed",
    completed_at: new Date(),
    updated_at: new Date()
  });
};


// ===============================
// ❌ CANCEL TASK
// ===============================
export const cancelTask = async (id, reason = "") => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    status: "cancelled",
    cancel_reason: reason,
    updated_at: new Date()
  });
};


// ===============================
// 🔁 REASSIGN TASK
// ===============================
export const reassignTask = async (
  id,
  newUserId,
  newName,
  newEmployeeId
) => {
  const ref = doc(db, "tasks", id);

  return await updateDoc(ref, {
    assignedTo: newUserId,
    assignedToName: newName,
    assignedToEmployeeId: newEmployeeId,
    reassigned_at: new Date(),
    status: "assigned",
    updated_at: new Date()
  });
};