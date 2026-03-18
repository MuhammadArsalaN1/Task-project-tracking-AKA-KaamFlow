import { useEffect, useState, Fragment, useContext, useRef } from "react";
import Sidebar from "../../components/ui/Sidebar";
import {
  deleteTask,
  updateTask,
  cancelTask,
  reassignTask
} from "../../services/taskService";
import { db } from "../../services/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";

export default function Tasks() {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [employees, setEmployees] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const chatEndRef = useRef(null);

  // ===============================
  // REALTIME
  // ===============================
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "tasks"),
      where("assignedBy", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      let data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      if (data.length === 0) {
        const allSnap = await getDocs(collection(db, "tasks"));
        data = allSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      setTasks(data);
    });

    return () => unsubscribe();
  }, [user]);

  // ===============================
  // AUTO SCROLL CHAT
  // ===============================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tasks, expandedRow]);

  // ===============================
  // HELPERS
  // ===============================
  const getPrice = (task) =>
    task.finalPrice ?? task.counter_price ?? task.price ?? 0;

  const getTotalPaid = (task) =>
    task.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const getRemaining = (task) =>
    getPrice(task) - getTotalPaid(task);

  const getPaymentStatus = (task) => {
    const total = getPrice(task);
    const paid = getTotalPaid(task);

    if (paid === 0)
      return { text: "Unpaid", color: "#dc2626", bg: "#fee2e2" };

    if (paid < total)
      return { text: "Partial", color: "#b45309", bg: "#fef3c7" };

    return { text: "Paid", color: "#16a34a", bg: "#dcfce7" };
  };

  const getTaskProgressStatus = (task) => {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;

    if (task.status === "cancelled") return "Cancelled";
    if (task.status === "revision_requested") return "Revision";
    if (task.status === "completed") return "Completed";

    if (task.status === "submitted" || task.submissionLink)
      return "Submitted";

    if (task.status === "in_progress") {
      if (deadline && now > deadline) return "Late";
      return "In Progress";
    }

    return "Pending";
  };

  const getCategory = (task) => {
    if (task.status === "cancelled") return "Cancelled";
    if (task.status === "completed") {
      return getRemaining(task) > 0 ? "Partial Payment" : "Completed";
    }
    if (task.status === "submitted") return "Submitted";
    if (task.status === "in_progress") return "In Progress";
    return "Pending";
  };

  // ===============================
  // GROUPING
  // ===============================
  const groupedTasks = tasks.reduce((acc, task) => {
    const cat = getCategory(task);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {});

  // ===============================
  // COMMENT (CHAT SEND)
  // ===============================
  const handleComment = async (taskId) => {
    const text = commentInputs[taskId];
    if (!text) return;

    await updateDoc(doc(db, "tasks", taskId), {
      comments: arrayUnion({
        sender: "manager",
        text,
        timestamp: new Date()
      })
    });

    setCommentInputs({ ...commentInputs, [taskId]: "" });
  };

  // ===============================
  // NEGOTIATION UI
  // ===============================
  const renderNegotiation = (task) => (
    <div style={{ fontSize: "13px" }}>
      <div>Base: PKR {task.price || 0}</div>

      {task.counter_price && (
        <div style={{ color: "#b45309" }}>
          Counter: PKR {task.counter_price}
        </div>
      )}

      {task.finalPrice && (
        <div style={{ color: "#16a34a", fontWeight: "bold" }}>
          Final: PKR {task.finalPrice}
        </div>
      )}
    </div>
  );

  // ===============================
  // ACTIONS (UNCHANGED)
  // ===============================
  const handleAction = async (action, task) => {
    if (!action) return;

    try {
      switch (action) {
        case "counter":
          const price = prompt("Enter counter price");
          if (price) {
            await updateDoc(doc(db, "tasks", task.id), {
              counter_price: Number(price),
              negotiation_status: "manager_counter"
            });
          }
          break;

        case "approve":
        case "approveNegotiation":
          await updateDoc(doc(db, "tasks", task.id), {
            finalPrice: task.counter_price ?? task.price,
            negotiation_status: "approved"
          });
          break;

        case "approveDelivery":
          await updateDoc(doc(db, "tasks", task.id), {
            delivery_status: "approved",
            status: "completed",
            completedAt: new Date()
          });
          break;

        case "revision":
          const note = prompt("Enter revision reason");
          if (note) {
            await updateDoc(doc(db, "tasks", task.id), {
              status: "revision_requested",
              comments: arrayUnion({
                sender: "manager",
                text: note,
                timestamp: new Date()
              })
            });
          }
          break;

        case "payment":
          const amount = prompt("Enter payment amount");
          if (!amount) return;

          await updateDoc(doc(db, "tasks", task.id), {
            payments: arrayUnion({
              amount: Number(amount),
              date: new Date()
            })
          });
          break;

        case "reassign":
          setSelectedTask(task);
          await loadEmployees(task.department);
          setShowReassignModal(true);
          return;

        case "delete":
          await deleteTask(task.id);
          break;

        case "cancel":
          const reason = prompt("Cancel reason");
          if (reason) {
            await updateDoc(doc(db, "tasks", task.id), {
              status: "cancelled"
            });
            await cancelTask(task.id, reason);
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  // ===============================
  // LOAD EMPLOYEES
  // ===============================
  const loadEmployees = async (department) => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "employee"),
      where("department", "==", department)
    );

    const snap = await getDocs(q);

    setEmployees(
      snap.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }))
    );
  };

  const handleReassign = async () => {
    const emp = employees.find((e) => e.uid === selectedEmployee);
    if (!emp) return;

    await reassignTask(
      selectedTask.id,
      emp.uid,
      emp.full_name,
      emp.user_id
    );

    setShowReassignModal(false);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div style={{ display: "flex" }}>
      <Sidebar role="manager" />

      <div style={{ flex: 1, padding: "24px" }}>
        <h2>Task Management</h2>

        {Object.keys(groupedTasks).map((category) => (
          <div key={category} style={{ marginBottom: 20 }}>

            <div
              style={groupHeader}
              onClick={() =>
                setCollapsedGroups({
                  ...collapsedGroups,
                  [category]: !collapsedGroups[category]
                })
              }
            >
              <h3>{category} ({groupedTasks[category].length})</h3>
              <span>{collapsedGroups[category] ? "▼" : "▲"}</span>
            </div>

            {!collapsedGroups[category] && (
              <table style={table}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Title</th>
                    <th>Assigned</th>
                    <th>Dept</th>
                    <th>Negotiation</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Payment</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {groupedTasks[category].map((task) => {
                    const isOpen = expandedRow === task.id;
                    const paymentStatus = getPaymentStatus(task);
                    const progress = getTaskProgressStatus(task);

                    return (
                      <Fragment key={task.id}>
                        <tr
                          style={row}
                          onClick={() =>
                            setExpandedRow(isOpen ? null : task.id)
                          }
                        >
                          <td>{task.project_id}</td>
                          <td>{task.title}</td>
                          <td>{task.assignedToName}</td>
                          <td>{task.department}</td>

                          <td>{renderNegotiation(task)}</td>

                          <td>PKR {getPrice(task)}</td>
                          <td>PKR {getTotalPaid(task)}</td>
                          <td>PKR {getRemaining(task)}</td>

                          <td>
                            <span style={{
                              background: paymentStatus.bg,
                              color: paymentStatus.color,
                              padding: "4px 8px",
                              borderRadius: "6px"
                            }}>
                              {paymentStatus.text}
                            </span>
                          </td>

                          <td>
                            <span style={{
                              background: statusStyleMap[progress]?.bg,
                              color: statusStyleMap[progress]?.color,
                              padding: "4px 8px",
                              borderRadius: "6px"
                            }}>
                              {progress}
                            </span>
                          </td>

                          <td>
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                handleAction(e.target.value, task);
                                e.target.value = "";
                              }}
                            >
                              <option value="">Actions</option>
                              <option value="counter">Send Counter</option>
                              <option value="approve">Approve (Old)</option>
                              <option value="approveNegotiation">Approve Negotiation</option>
                              <option value="approveDelivery">Approve Delivery</option>
                              <option value="revision">Request Revision</option>
                              <option value="payment">Add Payment</option>
                              <option value="reassign">Reassign</option>
                              <option value="cancel">Cancel</option>
                              <option value="delete">Delete</option>
                            </select>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr>
                            <td colSpan="11">
                              <div style={expandBox}>
                                <h4>💬 Chat</h4>

                                <div style={chatBox}>
                                  {(task.comments || []).map((c, i) => {
                                    const isManager = c.sender === "manager";
                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          alignSelf: isManager ? "flex-end" : "flex-start",
                                          background: isManager ? "#2563eb" : "#e5e7eb",
                                          color: isManager ? "#fff" : "#000",
                                          padding: "8px 12px",
                                          borderRadius: "12px",
                                          maxWidth: "60%"
                                        }}
                                      >
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                                          {isManager ? "You" : "Employee"}
                                        </div>
                                        <div>{c.text}</div>
                                        <div style={{ fontSize: 10, opacity: 0.6 }}>
                                          {c.timestamp?.toDate?.().toLocaleString?.()}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div ref={chatEndRef} />
                                </div>

                                <div style={{ display: "flex", gap: 10 }}>
                                  <input
                                    style={input}
                                    placeholder="Type message..."
                                    value={commentInputs[task.id] || ""}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleComment(task.id);
                                      }
                                    }}
                                    onChange={(e) =>
                                      setCommentInputs({
                                        ...commentInputs,
                                        [task.id]: e.target.value
                                      })
                                    }
                                  />
                                  <button
                                    style={sendBtn}
                                    onClick={() => handleComment(task.id)}
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {showReassignModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option>Select Employee</option>
              {employees.map((e) => (
                <option key={e.uid} value={e.uid}>
                  {e.full_name}
                </option>
              ))}
            </select>

            <button onClick={handleReassign}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===============================
const table = { width: "100%", borderCollapse: "collapse", background: "#fff" };
const row = { borderBottom: "1px solid #eee", cursor: "pointer" };

const groupHeader = {
  background: "#fff",
  padding: "12px",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "space-between",
  cursor: "pointer"
};

const expandBox = { padding: "20px", background: "#f8fafc" };

const chatBox = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  maxHeight: "300px",
  overflowY: "auto",
  padding: "10px",
  background: "#f1f5f9",
  borderRadius: "10px"
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  flex: 1
};

const sendBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px"
};

const statusStyleMap = {
  Pending: { bg: "#e5e7eb", color: "#374151" },
  "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
  Submitted: { bg: "#fef3c7", color: "#b45309" },
  Late: { bg: "#fee2e2", color: "#dc2626" },
  Completed: { bg: "#dcfce7", color: "#16a34a" },
  Revision: { bg: "#ede9fe", color: "#6d28d9" },
  Cancelled: { bg: "#111827", color: "#ffffff" }
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const modalBox = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px"
};