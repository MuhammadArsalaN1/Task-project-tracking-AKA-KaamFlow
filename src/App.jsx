import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";

// ================= DASHBOARDS =================
import ManagerDashboard from "./dashboard/manager/ManagerDashboard";
import EmployeeDashboard from "./dashboard/employee/EmployeeDashboard";

// ================= MANAGER FEATURES =================
import CreateTask from "./dashboard/manager/CreateTask";
import Tasks from "./dashboard/manager/Tasks";
import Employees from "./dashboard/manager/Employees"; // 🔥 FIXED PATH

// ================= EMPLOYEE FEATURES =================
import EmployeeTasks from "./dashboard/employee/EmployeeTasks";
import Earnings from "./dashboard/employee/Earnings";

// ================= PROTECTION =================
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* 🔐 AUTH */}
      <Route path="/" element={<AuthPage />} />

      {/* ================= MANAGER ================= */}

      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/tasks"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <Tasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/create-task"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <CreateTask />
          </ProtectedRoute>
        }
      />

      {/* 🔥 EMPLOYEE MANAGEMENT PAGE */}
      <Route
        path="/manager/employees"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <Employees />
          </ProtectedRoute>
        }
      />

      {/* ================= EMPLOYEE ================= */}

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/tasks"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeTasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/earnings"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <Earnings />
          </ProtectedRoute>
        }
      />

      {/* ================= FALLBACK ================= */}

      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

export default App;