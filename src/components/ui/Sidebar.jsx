import { logoutUser } from "../../services/authService";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  // 🔥 Active Link Style
  const getLinkStyle = (path) => ({
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: "8px",
    marginBottom: "6px",
    background: location.pathname === path ? "#f0f4ff" : "transparent",
    fontWeight: location.pathname === path ? "600" : "400"
  });

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
        <h3 style={{ marginBottom: "20px" }}>
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

        {/* 👥 Employees (Manager Only - future use) */}
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