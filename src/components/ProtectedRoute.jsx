import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useContext(AuthContext);
  const location = useLocation();

  // 🔄 Show loading state (better UX)
  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        Loading...
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ❌ Role not allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on role
    if (role === "manager") return <Navigate to="/manager" replace />;
    if (role === "employee") return <Navigate to="/employee" replace />;

    // fallback
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized
  return children;
}