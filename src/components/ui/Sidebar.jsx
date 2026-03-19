import { logoutUser } from "../../services/authService";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  // 🔥 Active Link Style (improved UX)
  const getLinkStyle = (path) => {
    const active = location.pathname === path;

    return {
      cursor: "pointer",
      padding: "10px 12px",
      borderRadius: "10px",
      marginBottom: "6px",
      background: active ? "#f0f4ff" : "transparent",
      fontWeight: active ? "600" : "400",
      transition: "all 0.2s ease"
    };
  };

  return (
    <div style={sidebar}>
      {/* TOP */}
      <div>
        <h3 style={title}>
          {role === "manager" ? "Manager Panel" : "Employee Panel"}
        </h3>

        {/* 🏠 Dashboard */}
        <div
          style={getLinkStyle(`/${role}`)}
          onClick={() => navigate(`/${role}`)}
        >
          🏠 Dashboard
        </div>

        {/* 📋 Tasks */}
        <div
          style={getLinkStyle(`/${role}/tasks`)}
          onClick={() => navigate(`/${role}/tasks`)}
        >
          📋 Tasks
        </div>

        {/* ➕ Create Task (Manager Only) */}
        {role === "manager" && (
          <div
            style={getLinkStyle("/manager/create-task")}
            onClick={() => navigate("/manager/create-task")}
          >
            ➕ Create Task
          </div>
        )}

        {/* 👥 Employees */}
        {role === "manager" && (
          <div
            style={getLinkStyle("/manager/employees")}
            onClick={() => navigate("/manager/employees")}
          >
            👥 Employees
          </div>
        )}
      </div>

      {/* BOTTOM */}
      <button className="btn" onClick={handleLogout} style={logoutBtn}>
        Logout
      </button>
    </div>
  );
}

// ===============================
// 🎨 STYLES
// ===============================
const sidebar = {
  width: "240px",
  height: "100vh",
  position: "fixed",      // 🔥 FIXED SIDEBAR
  top: 0,
  left: 0,
  background: "#ffffff",
  borderRight: "1px solid #eee",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  zIndex: 1000
};

const title = {
  marginBottom: "20px"
};

const logoutBtn = {
  marginTop: "20px",
  background: "#111",
  color: "#fff"
};