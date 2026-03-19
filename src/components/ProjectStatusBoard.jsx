export default function ProjectStatusBoard({ tasks }) {

  // ===============================
  // 🔥 STATUS LOGIC
  // ===============================
  const getStatus = (t) => {
    const now = new Date();
    const deadline = t.deadline ? new Date(t.deadline) : null;

    if (t.status === "completed") return "Completed";
    if (t.status === "submitted") return "Submitted";
    if (t.status === "in_progress") return "In Progress";
    if (deadline && now > deadline) return "Late";

    return "Pending";
  };

  // ===============================
  // 🎨 STATUS COLORS
  // ===============================
  const statusStyles = {
    Pending: { bg: "#e5e7eb", color: "#374151" },
    "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
    Submitted: { bg: "#fef3c7", color: "#b45309" },
    Late: { bg: "#fee2e2", color: "#dc2626" },
    Completed: { bg: "#dcfce7", color: "#16a34a" }
  };

  // ===============================
  // 📊 GROUP TASKS
  // ===============================
  const grouped = tasks.reduce((acc, t) => {
    const s = getStatus(t);
    if (!acc[s]) acc[s] = [];
    acc[s].push(t);
    return acc;
  }, {});

  // ===============================
  // 🔥 ORDER (IMPORTANT UX)
  // ===============================
  const orderedStatuses = [
    "Late",
    "Pending",
    "In Progress",
    "Submitted",
    "Completed"
  ];

  // ===============================
  // UI
  // ===============================
  return (
    <div style={{ marginTop: 30 }}>
      <h3 style={{ marginBottom: 12 }}>📋 Project Status</h3>

      <div style={grid}>
        {orderedStatuses.map((status) => {
          const items = grouped[status] || [];

          return (
            <div key={status} style={box}>
              
              {/* HEADER */}
              <div style={header}>
                <span
                  style={{
                    ...badge,
                    background: statusStyles[status]?.bg,
                    color: statusStyles[status]?.color
                  }}
                >
                  {status}
                </span>

                <strong>{items.length}</strong>
              </div>

              {/* LIST */}
              <div style={{ marginTop: 10 }}>
                {items.slice(0, 5).map((t) => (
                  <div key={t.id} style={item}>
                    <div style={{ fontWeight: 500 }}>
                      {t.project_id}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {t.assignedToName || "Unassigned"}
                    </div>
                  </div>
                ))}

                {/* SHOW MORE */}
                {items.length > 5 && (
                  <div style={more}>
                    +{items.length - 5} more...
                  </div>
                )}

                {items.length === 0 && (
                  <div style={empty}>No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px"
};

const box = {
  background: "#fff",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  border: "1px solid #eee",
  minHeight: "150px"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const badge = {
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600
};

const item = {
  padding: "8px",
  borderBottom: "1px solid #f1f5f9"
};

const more = {
  marginTop: 8,
  fontSize: 12,
  color: "#2563eb",
  cursor: "pointer"
};

const empty = {
  marginTop: 10,
  fontSize: 12,
  opacity: 0.5
};