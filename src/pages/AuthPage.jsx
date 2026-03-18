import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Tabs,
  Tab,
  MenuItem
} from "@mui/material";

import { signupUser, loginUser } from "../services/authService";
import { validateCNIC, validatePhone } from "../utils/validators";
import { AuthContext } from "../context/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useContext(AuthContext);

  const [tab, setTab] = useState(0);
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

  const isSignup = tab === 1;

  // 🔥 SAFE ROLE-BASED REDIRECT
  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "manager") navigate("/manager");
      else navigate("/employee");
    }
  }, [user, role, authLoading, navigate]);

  // 🔥 CNIC FORMAT
  const formatCNIC = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);

    if (digits.length <= 5) return digits;
    if (digits.length <= 12)
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "cnic" ? formatCNIC(value) : value
    }));
  };

  // ✅ VALIDATION
  const validateForm = () => {
    if (!form.email || !form.password) {
      throw new Error("Email & Password required");
    }

    if (isSignup) {
      if (!form.fullName) throw new Error("Full name required");
      if (!form.fatherName) throw new Error("Father name required");
      if (!form.address) throw new Error("Address required");

      if (!validateCNIC(form.cnic)) throw new Error("Invalid CNIC");
      if (!validatePhone(form.phone)) throw new Error("Invalid phone");

      if (form.role === "employee" && !form.department) {
        throw new Error("Select department");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      validateForm();

      if (isSignup) {
        await signupUser(form);
        alert("Signup successful 🚀");
      } else {
        await loginUser(form.email, form.password);
        alert("Login successful 🔥");
      }

      // ✅ Reset only non-auth critical fields
      setForm((prev) => ({
        ...prev,
        password: "",
      }));

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fb"
      }}
    >
      <Card
        sx={{
          width: 420,
          borderRadius: 4,
          p: 2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid #eee"
        }}
      >
        <CardContent>

          <Typography variant="h5" align="center" mb={1} fontWeight={600}>
            {isSignup ? "Create Account" : "Welcome Back"}
          </Typography>

          <Typography variant="body2" align="center" color="text.secondary" mb={2}>
            {isSignup ? "Signup to get started" : "Login to your account"}
          </Typography>

          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label="Login" />
            <Tab label="Signup" />
          </Tabs>

          <Box display="flex" flexDirection="column" gap={2}>

            {isSignup && (
              <>
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Father Name"
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  fullWidth
                />
              </>
            )}

            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
            />

            {isSignup && (
              <>
                <TextField
                  label="CNIC"
                  name="cnic"
                  value={form.cnic}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  select
                  label="Role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      role: e.target.value,
                      department: ""
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </TextField>

                {form.role === "employee" && (
                  <TextField
                    select
                    label="Department"
                    value={form.department}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        department: e.target.value
                      }))
                    }
                    fullWidth
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    <MenuItem value="WEB">Web Development</MenuItem>
                    <MenuItem value="GRD">Graphic Design</MenuItem>
                    <MenuItem value="JWL">3D Jewelry</MenuItem>
                    <MenuItem value="VR">VR Development</MenuItem>
                    <MenuItem value="AI">AI Engineering</MenuItem>
                    <MenuItem value="DATA">Data Engineering</MenuItem>
                    <MenuItem value="SAL">Sales</MenuItem>
                    <MenuItem value="MKT">Marketing</MenuItem>
                  </TextField>
                )}
              </>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                mt: 1,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600
              }}
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
            </Button>

          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}