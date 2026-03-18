import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";

// Dashboards
import ManagerDashboard from "./dashboard/manager/ManagerDashboard";
import EmployeeDashboard from "./dashboard/employee/EmployeeDashboard";

// Manager Features
import CreateTask from "./dashboard/manager/CreateTask";
import Tasks from "./dashboard/manager/Tasks";

// Employee Features
import EmployeeTasks from "./dashboard/employee/EmployeeTasks";
import Earnings from "./dashboard/employee/Earnings"; // ✅ ADD THIS

// Protection
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* 🔐 Auth */}
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

      {/* 💰 Earnings (REAL-TIME FIREBASE) */}
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