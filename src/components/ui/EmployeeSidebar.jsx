import { logoutUser } from "../../services/authService";
import { useNavigate, useLocation } from "react-router-dom";

export default function EmployeeSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Active Link Style (same as manager)
  const getLinkStyle = (path) => ({
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: "8px",
    marginBottom: "6px",
    background: location.pathname === path ? "#f0f4ff" : "transparent",
    fontWeight: location.pathname === path ? "600" : "400"
  });

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  return (
    <div
      style={{
        width: "240px",
        height: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #eee",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      {/* TOP */}
      <div>
        <h3 style={{ marginBottom: "20px" }}>Employee Panel</h3>

        {/* 🏠 Dashboard */}
        <div
          style={getLinkStyle("/employee")}
          onClick={() => navigate("/employee")}
        >
          🏠 Dashboard
        </div>

        {/* 📋 My Tasks */}
        <div
          style={getLinkStyle("/employee/tasks")}
          onClick={() => navigate("/employee/tasks")}
        >
          📋 My Tasks
        </div>

        {/* 💰 Earnings (future) */}
        <div
          style={getLinkStyle("/employee/earnings")}
          onClick={() => navigate("/employee/earnings")}
        >
          💰 Earnings
        </div>
      </div>

      {/* BOTTOM */}
      <button
        className="btn"
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          background: "#111",
          color: "#fff"
        }}
      >
        Logout
      </button>
    </div>
  );
}