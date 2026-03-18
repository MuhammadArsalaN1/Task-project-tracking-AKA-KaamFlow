import { useEffect, useState, useContext, Fragment, useRef } from "react";
import EmployeeSidebar from "../../components/ui/EmployeeSidebar";
import { db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";

export default function EmployeeTasks() {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);

  const [commentInputs, setCommentInputs] = useState({});
  const [submissionLinks, setSubmissionLinks] = useState({});

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tasks, expandedRow]);

  // ===============================
  // STATUS
  // ===============================
  const getStatus = (task) => {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;

    if (task.status === "cancelled") return "Cancelled";
    if (task.status === "revision_requested") return "Revision";
    if (task.status === "completed") return "Completed";
    if (task.submissionLink) return "Submitted";
    if (deadline && now > deadline) return "Late";
    if (task.status === "in_progress") return "In Progress";

    return "Pending";
  };

  const statusStyleMap = {
    Pending: { bg: "#e5e7eb", color: "#374151" },
    "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
    Submitted: { bg: "#fef3c7", color: "#b45309" },
    Late: { bg: "#fee2e2", color: "#dc2626" },
    Completed: { bg: "#dcfce7", color: "#16a34a" },
    Revision: { bg: "#ede9fe", color: "#6d28d9" },
    Cancelled: { bg: "#111827", color: "#fff" }
  };

  // ===============================
  // FILTER + GROUP
  // ===============================
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.project_id?.toLowerCase().includes(search.toLowerCase());

    const status = getStatus(task);
    const matchesFilter = filter === "all" || filter === status;

    return matchesSearch && matchesFilter;
  });

  const grouped = filteredTasks.reduce((acc, task) => {
    const status = getStatus(task);
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});

  const getPrice = (task) =>
    task.finalPrice ??
    task.employee_counter_price ??
    task.counter_price ??
    task.price ??
    0;

  // ===============================
  // ACTIONS
  // ===============================
  const handleStart = async (id) => {
    await updateDoc(doc(db, "tasks", id), { status: "in_progress" });
  };

  const handleSubmit = async (id, isRevision = false) => {
    const link = submissionLinks[id];
    if (!link) return alert("Enter link");

    await updateDoc(doc(db, "tasks", id), {
      submissionLink: link,
      status: "submitted",
      submittedAt: new Date(),
      revisionCount: isRevision
        ? (tasks.find((t) => t.id === id)?.revisionCount || 0) + 1
        : 0
    });
  };

  const handleComment = async (id) => {
    const text = commentInputs[id];
    if (!text) return;

    await updateDoc(doc(db, "tasks", id), {
      comments: arrayUnion({
        sender: "employee",
        text,
        timestamp: new Date()
      })
    });

    setCommentInputs({ ...commentInputs, [id]: "" });
  };

  return (
    <div style={{ display: "flex" }}>
      <EmployeeSidebar />

      <div style={{ flex: 1, padding: "24px" }}>
        <h2>My Tasks</h2>

        <div style={topBar}>
          <input
            placeholder="Search..."
            style={input}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            style={input}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="Revision">Revision</option>
            <option value="Submitted">Submitted</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>

        {Object.keys(grouped).map((status) => (
          <div key={status} style={{ marginBottom: 20 }}>
            <div
              style={groupHeader}
              onClick={() =>
                setCollapsed({
                  ...collapsed,
                  [status]: !collapsed[status]
                })
              }
            >
              <h3>{status} ({grouped[status].length})</h3>
              <span>{collapsed[status] ? "▼" : "▲"}</span>
            </div>

            {!collapsed[status] && (
              <table style={table}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Title</th>
                    <th>Deadline</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {grouped[status].map((task) => {
                    const isOpen = expandedRow === task.id;

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
                          <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}</td>
                          <td>PKR {getPrice(task)}</td>

                          <td>
                            <span style={{
                              background: statusStyleMap[status]?.bg,
                              color: statusStyleMap[status]?.color,
                              padding: "4px 8px",
                              borderRadius: "6px"
                            }}>
                              {status}
                            </span>
                          </td>

                          <td>
                            {status === "Pending" && (
                              <button onClick={(e) => {
                                e.stopPropagation();
                                handleStart(task.id);
                              }}>
                                Start
                              </button>
                            )}

                            {(status === "In Progress" || status === "Late") && (
                              <>
                                <input
                                  placeholder="Drive link"
                                  style={input}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setSubmissionLinks({
                                      ...submissionLinks,
                                      [task.id]: e.target.value
                                    })
                                  }
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmit(task.id);
                                  }}
                                >
                                  Submit
                                </button>
                              </>
                            )}

                            {status === "Revision" && (
                              <>
                                <input
                                  placeholder="Updated link"
                                  style={input}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setSubmissionLinks({
                                      ...submissionLinks,
                                      [task.id]: e.target.value
                                    })
                                  }
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmit(task.id, true);
                                  }}
                                >
                                  Resubmit
                                </button>
                              </>
                            )}
                          </td>
                        </tr>

                        {isOpen && (
                          <tr>
                            <td colSpan="6">
                              <div style={expandBox}>
                                <h4>💬 Chat</h4>

                                <div style={chatBox}>
                                  {(task.comments || []).map((c, i) => {
                                    const isEmployee = c.sender === "employee";

                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          alignSelf: isEmployee ? "flex-end" : "flex-start",
                                          background: isEmployee ? "#2563eb" : "#e5e7eb",
                                          color: isEmployee ? "#fff" : "#000",
                                          padding: "8px 12px",
                                          borderRadius: "12px",
                                          maxWidth: "60%"
                                        }}
                                      >
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                                          {isEmployee ? "You" : "Manager"}
                                        </div>
                                        <div>{c.text}</div>
                                        <div style={{ fontSize: 10 }}>
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
                                    onClick={(e) => e.stopPropagation()}
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
                                  <button onClick={() => handleComment(task.id)}>
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
  maxHeight: "250px",
  overflowY: "auto",
  padding: "10px",
  background: "#f1f5f9",
  borderRadius: "10px"
};

const input = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ddd"
};

const topBar = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px"
};