import Sidebar from "../../components/ui/Sidebar";

export default function ManagerDashboard() {
  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <Sidebar role="manager" />

      {/* Main */}
      <div style={{ flex: 1, padding: "24px" }}>
        <h2 style={{ marginBottom: "20px" }}>Manager Dashboard</h2>

        {/* Future content */}
        <p>Welcome, Manager 👋</p>
        <p>Use sidebar to manage tasks, employees, and analytics.</p>
      </div>
    </div>
  );
}