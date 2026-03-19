import { useState, useMemo } from "react";

export default function PaymentHistory({ tasks }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const ITEMS_PER_PAGE = 25;

  // ===============================
  // 🔥 FLATTEN PAYMENTS
  // ===============================
  const payments = useMemo(() => {
    return tasks.flatMap((t) =>
      (t.payments || []).map((p) => ({
        project_id: t.project_id,
        employee: t.assignedToName || "Unknown",
        amount: p.amount || 0,
        date: p.date?.toDate?.()
      }))
    );
  }, [tasks]);

  // ===============================
  // 🔍 SEARCH FILTER
  // ===============================
  const filtered = payments.filter((p) =>
    p.project_id?.toLowerCase().includes(search.toLowerCase())
  );

  // ===============================
  // 🔥 SORT (LATEST FIRST)
  // ===============================
  const sorted = filtered
    .filter((p) => p.date)
    .sort((a, b) => b.date - a.date);

  // ===============================
  // 📄 PAGINATION
  // ===============================
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);

  const paginated = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ===============================
  // 🔄 RESET PAGE ON SEARCH
  // ===============================
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div style={{ marginTop: 30 }}>
      <h3>💰 Payment History</h3>

      <div style={box}>
        {/* 🔍 SEARCH BAR */}
        <div style={topBar}>
          <input
            placeholder="Search by Project ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={input}
          />
        </div>

        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((p, i) => (
              <tr key={i}>
                <td>{p.employee}</td>
                <td style={{ fontWeight: 500 }}>{p.project_id}</td>
                <td style={{ color: "#16a34a", fontWeight: 600 }}>
                  PKR {p.amount}
                </td>
                <td>{p.date?.toLocaleDateString() || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* EMPTY */}
        {paginated.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
            No payments found
          </div>
        )}

        {/* PAGINATION */}
        <div style={pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={btn}
          >
            ← Prev
          </button>

          <span>
            Page {page} / {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            style={btn}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================
const box = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  marginTop: "10px",
  border: "1px solid #eee"
};

const topBar = {
  marginBottom: "12px",
  display: "flex",
  justifyContent: "space-between"
};

const input = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  width: "250px"
};

const pagination = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "15px"
};

const btn = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer"
};