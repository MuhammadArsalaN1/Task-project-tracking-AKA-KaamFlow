import { useContext, useEffect, useState } from "react";
import EmployeeSidebar from "../../components/ui/EmployeeSidebar";
import Card from "../../components/ui/Card";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

export default function EmployeeDashboard() {
  const { user, profile, loading } = useContext(AuthContext);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    submitted: 0,
    revision: 0,
    completed: 0,

    totalEarnings: 0,      // 🔥 ALL payments
    monthlyTotal: 0,       // 🔥 created this month
    monthlyPaid: 0,        // 🔥 payments this month
    totalRemaining: 0      // 🔥 correct remaining
  });

  const [loadingStats, setLoadingStats] = useState(true);

  // ===============================
  // 🧠 PRICE (FIXED)
  // ===============================
  const getTaskPrice = (task) =>
    task.finalPrice ??
    task.employee_counter_price ??
    task.counter_price ??
    task.price ??
    0;

  // ===============================
  // 📅 MONTH CHECK
  // ===============================
  const isSameMonth = (date) => {
    if (!date) return false;

    const d = date?.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);

    const now = new Date();

    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // ===============================
  // 🔥 LOAD STATS (FIXED)
  // ===============================
  const loadStats = async () => {
    try {
      if (!user) return;

      const q = query(
        collection(db, "tasks"),
        where("assignedTo", "==", user.uid)
      );

      const snap = await getDocs(q);

      let statsData = {
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        submitted: 0,
        revision: 0,
        completed: 0,

        totalEarnings: 0,
        monthlyTotal: 0,
        monthlyPaid: 0,
        totalRemaining: 0
      };

      let totalWorkValue = 0;
      let totalPaidAllTime = 0;

      snap.docs.forEach((doc) => {
        const task = doc.data();
        const price = getTaskPrice(task);

        statsData.total++;
        totalWorkValue += price;

        // ===============================
        // STATUS
        // ===============================
        if (task.status === "pending") statsData.pending++;
        if (task.status === "assigned") statsData.assigned++;
        if (task.status === "in_progress") statsData.inProgress++;
        if (task.status === "submitted") statsData.submitted++;
        if (task.status === "revision_requested") statsData.revision++;
        if (task.status === "completed") statsData.completed++;

        // ===============================
        // 🔥 MONTHLY TOTAL (ONLY CREATED)
        // ===============================
        if (isSameMonth(task.createdAt)) {
          statsData.monthlyTotal += price;
        }

        // ===============================
        // 🔥 PAYMENTS (REAL EARNINGS)
        // ===============================
        if (task.payments?.length) {
          task.payments.forEach((p) => {
            totalPaidAllTime += p.amount;
            statsData.totalEarnings += p.amount;

            if (isSameMonth(p.date)) {
              statsData.monthlyPaid += p.amount;
            }
          });
        }
      });

      // ===============================
      // 🔥 FINAL REMAINING
      // ===============================
      statsData.totalRemaining = totalWorkValue - totalPaidAllTime;

      setStats(statsData);
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      loadStats();
    }
  }, [user, loading]);

  if (loading || !profile) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex" }}>
      <EmployeeSidebar />

      <div style={{ flex: 1, padding: "24px" }}>
        <h2 style={{ marginBottom: "20px" }}>Employee Dashboard</h2>

        <Card>
          <h3>Welcome, {profile.fullName} 👋</h3>
          <p><strong>ID:</strong> {profile.userId}</p>
          <p><strong>Department:</strong> {profile.department}</p>
        </Card>

        {/* 💰 PAYMENTS */}
        <div style={paymentGrid}>
          <Card>
            <h4>This Month Total</h4>
            <h2>PKR {stats.monthlyTotal}</h2>
          </Card>

          <Card>
            <h4>Paid This Month 💰</h4>
            <h2 style={{ color: "#16a34a" }}>
              PKR {stats.monthlyPaid}
            </h2>
          </Card>

          <Card>
            <h4>Total Remaining 💸</h4>
            <h2 style={{ color: "#dc2626" }}>
              PKR {stats.totalRemaining}
            </h2>
          </Card>
        </div>

        {/* 📊 TASK STATS */}
        <div style={grid}>
          <Card><h4>Total Tasks</h4><h2>{stats.total}</h2></Card>
          <Card><h4>Pending</h4><h2>{stats.pending}</h2></Card>
          <Card><h4>Assigned</h4><h2>{stats.assigned}</h2></Card>
          <Card><h4>In Progress</h4><h2>{stats.inProgress}</h2></Card>
          <Card><h4>Submitted</h4><h2>{stats.submitted}</h2></Card>
          <Card><h4>Revision</h4><h2>{stats.revision}</h2></Card>
          <Card><h4>Completed</h4><h2>{stats.completed}</h2></Card>

          <Card>
            <h4>Total Earnings 💰</h4>
            <h2>PKR {stats.totalEarnings}</h2>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ===============================
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginTop: "20px"
};

const paymentGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginTop: "20px"
};