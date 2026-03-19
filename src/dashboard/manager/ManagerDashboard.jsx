import { useEffect, useState } from "react";
import Sidebar from "../../components/ui/Sidebar";
import { db } from "../../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";

// 🔥 Components
import StatsCards from "../../components/StatsCards";
import PaymentOverview from "../../components/PaymentOverview";
import ProjectStatusBoard from "../../components/ProjectStatusBoard";
import PaymentHistory from "../../components/PaymentHistory";

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // 🔥 REAL-TIME TASKS
  // ===============================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tasks"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ===============================
  // ⏳ LOADING
  // ===============================
  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div style={layout}>
      {/* Sidebar */}
      <Sidebar role="manager" />

      {/* Main Content */}
      <div style={main}>
        <h2 style={{ marginBottom: "20px" }}>
          Manager Dashboard 📊
        </h2>

        {/* KPI */}
        <StatsCards tasks={tasks} />

        {/* Payments */}
        <PaymentOverview tasks={tasks} />

        {/* Status */}
        <ProjectStatusBoard tasks={tasks} />

        {/* Payment History */}
        <PaymentHistory tasks={tasks} />
      </div>
    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================
const layout = {
  display: "flex"
};

const main = {
  flex: 1,
  marginLeft: "240px", // 🔥 IMPORTANT (space for sidebar)
  padding: "24px",
  minWidth: 0
};