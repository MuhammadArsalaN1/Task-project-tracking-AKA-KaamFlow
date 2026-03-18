import { useEffect, useState, useContext } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/ui/EmployeeSidebar";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function Earnings() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("month");
  const [page, setPage] = useState(1);

  const { user } = useContext(AuthContext);
  const ITEMS_PER_PAGE = 25;

  // ===============================
  // 🔥 REAL-TIME TASKS
  // ===============================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(data);
    });

    return () => unsubscribe();
  }, [user]);

  // ===============================
  // 🧠 HELPERS
  // ===============================
  const getTotal = (t) =>
    t.finalPrice ??
    t.employee_counter_price ??
    t.counter_price ??
    t.price ??
    0;

  const now = new Date();

  // ===============================
  // 🔥 ALL PAYMENTS
  // ===============================
  const allPayments = tasks.flatMap((task) =>
    task.payments?.map((p) => ({
      project_id: task.project_id,
      amount: p.amount || 0,
      date: p.date?.toDate?.()
    })) || []
  );

  // ===============================
  // 🔥 FILTER PAYMENTS
  // ===============================
  const filteredPayments = allPayments.filter((p) => {
    if (!p.date) return false;

    const diffDays = (now - p.date) / (1000 * 60 * 60 * 24);

    if (filter === "week") return diffDays <= 7;
    if (filter === "15days") return diffDays <= 15;
    if (filter === "month") return diffDays <= 30;
    if (filter === "2months") return diffDays <= 60;

    return true;
  });

  // ===============================
  // 🔥 PROJECT SUMMARY (ALL TIME)
  // ===============================
  const projectMap = {};

  tasks.forEach((t) => {
    const total = getTotal(t);
    const payments = t.payments || [];

    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const latestDate = payments.length
      ? payments[payments.length - 1].date?.toDate?.()
      : null;

    if (!projectMap[t.project_id]) {
      projectMap[t.project_id] = {
        project_id: t.project_id,
        total: 0,
        paid: 0,
        latestDate: null
      };
    }

    projectMap[t.project_id].total += total;
    projectMap[t.project_id].paid += paid;

    if (
      latestDate &&
      (!projectMap[t.project_id].latestDate ||
        latestDate > projectMap[t.project_id].latestDate)
    ) {
      projectMap[t.project_id].latestDate = latestDate;
    }
  });

  const projectSummary = Object.values(projectMap);

  // ===============================
  // 💰 TOTALS
  // ===============================
  const totalAmount = projectSummary.reduce((s, p) => s + p.total, 0);
  const totalPaidAllTime = projectSummary.reduce((s, p) => s + p.paid, 0);
  const totalRemaining = totalAmount - totalPaidAllTime;

  const paidFiltered = filteredPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // ===============================
  // 🆕 THIS MONTH TOTAL
  // ===============================
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const thisMonthTotal = tasks.reduce((sum, t) => {
    const createdAt = t.createdAt?.toDate?.();
    if (!createdAt) return sum;

    if (createdAt >= startOfMonth) {
      return sum + getTotal(t);
    }

    return sum;
  }, 0);

  // ===============================
  // 📊 TIME SERIES CHART DATA (NEW)
  // ===============================
  const chartData = Object.values(
    filteredPayments.reduce((acc, p) => {
      if (!p.date) return acc;

      const key = p.date.toLocaleDateString();

      if (!acc[key]) {
        acc[key] = {
          date: key,
          amount: 0
        };
      }

      acc[key].amount += p.amount;
      return acc;
    }, {})
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  // ===============================
  // 📄 PAGINATION
  // ===============================
  const totalPages = Math.ceil(
    projectSummary.length / ITEMS_PER_PAGE
  );

  const paginatedProjects = projectSummary.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ===============================
  // UI
  // ===============================
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "24px", minWidth: 0 }}>
        <h2>💰 Earnings Overview</h2>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "This Week", value: "week" },
            { label: "15 Days", value: "15days" },
            { label: "1 Month", value: "month" },
            { label: "2 Months", value: "2months" }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: filter === f.value ? "#111" : "#eee",
                color: filter === f.value ? "#fff" : "#000",
                cursor: "pointer"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* CARDS */}
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          <Card title="Total Earnings 💰" value={totalAmount} />
          <Card title="This Month Total" value={thisMonthTotal} bg="#2563eb" />
          <Card title="Paid (Filtered)" value={paidFiltered} bg="#16a34a" />
          <Card title="Total Remaining 💸" value={totalRemaining} bg="#dc2626" />
        </div>

        {/* 📈 EARNINGS TREND */}
        <div
          style={{
            width: "100%",
            height: "320px",
            minHeight: "300px",
            marginTop: "20px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px"
          }}
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis />

                <Tooltip
                  formatter={(value) => [`Rs. ${value}`, "Earnings"]}
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 120 }}>
              No data
            </div>
          )}
        </div>

        {/* TABLE */}
        <div style={tableBox}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Paid Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProjects.map((p) => {
                const pending = p.total - p.paid;

                let status = "Unpaid";
                if (p.paid > 0 && p.paid < p.total) status = "Partial";
                if (p.paid >= p.total) status = "Paid";

                return (
                  <tr key={p.project_id}>
                    <td>{p.project_id}</td>
                    <td>Rs. {p.total}</td>
                    <td>Rs. {p.paid}</td>
                    <td>Rs. {pending}</td>
                    <td>
                      {p.latestDate
                        ? p.latestDate.toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ marginTop: 10 }}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Prev
            </button>

            <span> Page {page} / {totalPages || 1} </span>

            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===============================
const Card = ({ title, value, bg = "#111" }) => (
  <div
    style={{
      background: bg,
      color: "#fff",
      padding: 20,
      borderRadius: 10,
      minWidth: 180
    }}
  >
    <h4>{title}</h4>
    <p>Rs. {value}</p>
  </div>
);

const tableBox = {
  marginTop: 20,
  background: "#fff",
  padding: 20,
  borderRadius: 10
};