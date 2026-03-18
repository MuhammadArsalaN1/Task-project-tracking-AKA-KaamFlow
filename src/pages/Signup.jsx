import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser } from "../services/authService";
import { validateCNIC, validatePhone } from "../utils/validators";
import { AuthContext } from "../context/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, role } = useContext(AuthContext);

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    fatherName: "",
    address: "",
    email: "",
    password: "",
    cnic: "",
    phone: "",
    role: "employee",
    department: ""
  });

  // ✅ AUTO REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (user) {
      if (role === "manager") navigate("/manager");
      else navigate("/employee");
    }
  }, [user, role, navigate]);

  // 🔥 CNIC AUTO FORMAT
  const formatCNIC = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);

    let formatted = digits;

    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    }

    return formatted;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cnic") {
      setForm({ ...form, cnic: formatCNIC(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (isSignup) {
        // ✅ VALIDATION
        if (!validateCNIC(form.cnic)) {
          throw new Error("Invalid CNIC format");
        }

        if (!validatePhone(form.phone)) {
          throw new Error("Invalid phone number");
        }

        if (!form.fatherName) {
          throw new Error("Father name is required");
        }

        if (!form.address) {
          throw new Error("Address is required");
        }

        if (form.role === "employee" && !form.department) {
          throw new Error("Please select department");
        }

        await signupUser(form);
        alert("Signup successful 🚀");

        // ✅ REDIRECT AFTER SIGNUP
        if (form.role === "manager") {
          navigate("/manager");
        } else {
          navigate("/employee");
        }

      } else {
        await loginUser(form.email, form.password);
        alert("Login successful 🔥");

        // ✅ REDIRECT AFTER LOGIN (fallback if context delay)
        if (role === "manager") {
          navigate("/manager");
        } else {
          navigate("/employee");
        }
      }

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "auto" }}>
        
        <h2>{isSignup ? "Signup" : "Login"}</h2>

        {/* 🔄 TOGGLE */}
        <p style={{ marginBottom: 10 }}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <span
            style={{ color: "blue", cursor: "pointer", marginLeft: 5 }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Login" : "Signup"}
          </span>
        </p>

        {/* SIGNUP ONLY */}
        {isSignup && (
          <>
            <input
              className="input"
              name="fullName"
              placeholder="Full Name"
              onChange={handleChange}
            />

            <input
              className="input"
              name="fatherName"
              placeholder="Father Name"
              onChange={handleChange}
            />

            <input
              className="input"
              name="address"
              placeholder="Address"
              onChange={handleChange}
            />
          </>
        )}

        {/* COMMON */}
        <input
          className="input"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          className="input"
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />

        {/* SIGNUP EXTRA */}
        {isSignup && (
          <>
            <input
              className="input"
              name="cnic"
              value={form.cnic}
              placeholder="12345-1234567-1"
              onChange={handleChange}
            />

            <input
              className="input"
              name="phone"
              placeholder="03XXXXXXXXX"
              onChange={handleChange}
            />

            <select className="input" name="role" onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>

            {form.role === "employee" && (
              <select className="input" name="department" onChange={handleChange}>
                <option value="">Select Department</option>
                <option value="WEB">Web Development</option>
                <option value="GRD">Graphic Design</option>
                <option value="JWL">3D Jewelry</option>
                <option value="VR">VR Development</option>
                <option value="AI">AI Engineering</option>
                <option value="DATA">Data Engineering</option>
                <option value="SAL">Sales</option>
                <option value="MKT">Marketing</option>
              </select>
            )}
          </>
        )}

        {/* BUTTON */}
        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Please wait..."
            : isSignup
            ? "Create Account"
            : "Login"}
        </button>
      </div>
    </div>
  );
}