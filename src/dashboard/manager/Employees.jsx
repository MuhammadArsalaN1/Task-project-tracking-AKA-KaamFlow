import { useEffect, useState } from "react";
import Sidebar from "../../components/ui/Sidebar";
import { db } from "../../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setEmployees(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role === "employee")
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snap) => {
      setTasks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, []);

  const getStatus = (t) => {
    const now = new Date();
    const deadline = t.deadline ? new Date(t.deadline) : null;

    if (t.status === "completed") return "Completed";
    if (t.status === "submitted") return "Submitted";
    if (t.status === "in_progress") return "In Progress";
    if (deadline && now > deadline) return "Late";
    return "Pending";
  };

  const getStats = (emp) => {
    const empTasks = tasks.filter((t) => t.assignedTo === emp.uid);

    let completed = 0;
    let late = 0;
    let totalWork = 0;
    let totalPaid = 0;

    const now = new Date();

    empTasks.forEach((t) => {
      const price =
        t.finalPrice ??
        t.employee_counter_price ??
        t.counter_price ??
        t.price ??
        0;

      totalWork += price;

      if (t.status === "completed") completed++;

      if (
        t.deadline &&
        new Date(t.deadline) < now &&
        t.status !== "completed"
      ) {
        late++;
      }

      const paid =
        t.payments?.reduce((s, p) => s + p.amount, 0) || 0;

      totalPaid += paid;
    });

    return {
      total: empTasks.length,
      completed,
      pending: empTasks.length - completed,
      late,
      totalWork,
      totalPaid,
      pendingPayment: totalWork - totalPaid,
      completionRate:
        empTasks.length > 0
          ? Math.round((completed / empTasks.length) * 100)
          : 0,
      tasks: empTasks
    };
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar role="manager" />

      <div style={main}>
        <h2>👥 Employee Reports</h2>

        {employees.map((emp) => {
          const stats = getStats(emp);
          const isOpen = expanded === emp.id;

          return (
            <div key={emp.id} style={card}>
              {/* HEADER */}
              <div style={header}>
                <div>
                  <h3>{emp.fullName}</h3>
                  <p style={{ fontSize: 13, color: "#666" }}>
                    {emp.email}
                  </p>
                </div>

                <div style={badgeRow}>
                  <Badge label={`Tasks: ${stats.total}`} />
                  <Badge label={`Done: ${stats.completed}`} color="#16a34a" />
                  <Badge label={`Late: ${stats.late}`} color="#dc2626" />
                  <Badge label={`Pending: PKR ${stats.pendingPayment}`} color="#f59e0b" />
                </div>

                <button onClick={() => setExpanded(isOpen ? null : emp.id)}>
                  {isOpen ? "Hide" : "View"}
                </button>
              </div>

              {/* EXPANDED */}
              {isOpen && (
                <div style={expand}>
                  {/* PROFILE */}
                  <Section title="👤 Profile">
                    <Info label="ID" value={emp.userId} />
                    <Info label="Phone" value={emp.phone} />
                    <Info label="Address" value={emp.address} />
                    <Info
                      label="Joined"
                      value={
                        emp.createdAt?.toDate?.().toLocaleDateString() || "-"
                      }
                    />
                  </Section>

                  {/* PERFORMANCE */}
                  <Section title="📊 Performance">
                    <Info label="Total Tasks" value={stats.total} />
                    <Info label="Completed" value={stats.completed} />
                    <Info label="Pending" value={stats.pending} />
                    <Info label="Late" value={stats.late} />
                    <Info label="Completion %" value={`${stats.completionRate}%`} />
                  </Section>

                  {/* FINANCIAL */}
                  <Section title="💰 Financial">
                    <Info label="Total Work" value={`PKR ${stats.totalWork}`} />
                    <Info label="Paid" value={`PKR ${stats.totalPaid}`} color="#16a34a" />
                    <Info label="Pending" value={`PKR ${stats.pendingPayment}`} color="#dc2626" />
                  </Section>

                  {/* TASKS */}
                  <Section title="📋 Tasks">
                    <div style={list}>
                      {stats.tasks.map((t) => (
                        <div key={t.id} style={listRow}>
                          <span>{t.project_id}</span>
                          <span>{getStatus(t)}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* PAYMENTS */}
                  <Section title="💳 Payments">
                    <div style={list}>
                      {stats.tasks.flatMap((t) =>
                        (t.payments || []).map((p, i) => (
                          <div key={i} style={listRow}>
                            <span>{t.project_id}</span>
                            <span>PKR {p.amount}</span>
                            <span>
                              {p.date?.toDate?.().toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Section>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================= UI COMPONENTS =================

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <h4 style={{ marginBottom: 8 }}>{title}</h4>
    <div style={sectionBox}>{children}</div>
  </div>
);

const Info = ({ label, value, color }) => (
  <div style={{ marginBottom: 6 }}>
    <strong>{label}:</strong>{" "}
    <span style={{ color: color || "#111" }}>{value}</span>
  </div>
);

const Badge = ({ label, color = "#111" }) => (
  <span
    style={{
      background: "#f1f5f9",
      padding: "6px 10px",
      borderRadius: "8px",
      fontSize: 12,
      color
    }}
  >
    {label}
  </span>
);

// ================= STYLES =================

const main = {
  flex: 1,
  marginLeft: "240px",
  padding: "24px"
};

const card = {
  background: "#fff",
  padding: "16px",
  borderRadius: "12px",
  marginTop: "16px",
  border: "1px solid #eee",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px"
};

const badgeRow = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap"
};

const expand = {
  marginTop: "16px"
};

const sectionBox = {
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "8px"
};

const list = {
  maxHeight: "200px",
  overflowY: "auto"
};

const listRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  fontSize: "13px"
};