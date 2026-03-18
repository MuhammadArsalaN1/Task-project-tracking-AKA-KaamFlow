import { useState, useEffect } from "react";
import Sidebar from "../../components/ui/Sidebar";
import Card from "../../components/ui/Card";
import { createTask } from "../../services/taskService";
import { db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function CreateTask() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    deadline: "",
    priority: "Low",
    price: "",
    assignedTo: "",
    assignedToName: "",
    assignedToEmployeeId: "",
    comment: ""
  });

  const [employees, setEmployees] = useState([]);

  // ===============================
  // 🔥 FETCH EMPLOYEES
  // ===============================
  const fetchEmployees = async (department) => {
    try {
      if (!department) {
        setEmployees([]);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("role", "==", "employee"),
        where("department", "==", department)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }));

      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees(form.department);
  }, [form.department]);

  // ===============================
  // 🔥 HANDLE INPUT CHANGE
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ===============================
  // 🔥 HANDLE EMPLOYEE SELECT (IMPORTANT)
  // ===============================
  const handleEmployeeSelect = (e) => {
    const selectedUid = e.target.value;

    const selectedEmployee = employees.find(
      (emp) => emp.uid === selectedUid
    );

    if (!selectedEmployee) return;

    setForm({
      ...form,
      assignedTo: selectedEmployee.uid,
      assignedToName: selectedEmployee.fullName || selectedEmployee.full_name,
      assignedToEmployeeId:
        selectedEmployee.employee_id || "EMP—"
    });
  };

  // ===============================
  // 🚀 CREATE TASK
  // ===============================
  const handleCreateTask = async () => {
    try {
      if (
        !form.title ||
        !form.department ||
        !form.deadline ||
        !form.price ||
        !form.assignedTo
      ) {
        return alert("Please fill all required fields");
      }

      await createTask({
        ...form,
        price: Number(form.price)
      });

      alert("Task created & assigned 🚀");

      // RESET
      setForm({
        title: "",
        description: "",
        department: "",
        deadline: "",
        priority: "Low",
        price: "",
        assignedTo: "",
        assignedToName: "",
        assignedToEmployeeId: "",
        comment: ""
      });

      setEmployees([]);
    } catch (err) {
      console.error(err);
      alert("Error creating task");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar role="manager" />

      <div style={{ flex: 1, padding: "24px" }}>
        <h2>Create Task</h2>

        <Card>
          <h3 style={{ marginBottom: "16px" }}>New Task</h3>

          {/* TITLE */}
          <label>Task Title</label>
          <input
            className="input"
            name="title"
            value={form.title}
            onChange={handleChange}
          />

          {/* DESCRIPTION */}
          <label>Description</label>
          <input
            className="input"
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          {/* DEPARTMENT */}
          <label>Department</label>
          <select
            className="input"
            name="department"
            value={form.department}
            onChange={handleChange}
          >
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

          {/* 🔥 ASSIGN EMPLOYEE (FIXED) */}
          <label>Assign Employee</label>
          <select
            className="input"
            value={form.assignedTo}
            onChange={handleEmployeeSelect}
          >
            <option value="">Select Employee</option>

            {employees.map((emp) => (
              <option key={emp.uid} value={emp.uid}>
                {emp.fullName || emp.full_name} — {emp.employee_id || "EMP"} ({emp.email})
              </option>
            ))}
          </select>

          {/* DEADLINE */}
          <label>Deadline</label>
          <input
            className="input"
            type="datetime-local"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
          />

          {/* PRICE */}
          <label>Offering Price (PKR)</label>
          <input
            className="input"
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
          />

          {/* COMMENT */}
          <label>Comment (Optional)</label>
          <input
            className="input"
            name="comment"
            value={form.comment}
            onChange={handleChange}
          />

          {/* PRIORITY */}
          <label>Priority</label>
          <select
            className="input"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* BUTTON */}
          <button
            className="btn"
            style={{ marginTop: "16px", width: "100%" }}
            onClick={handleCreateTask}
          >
            Create & Assign Task
          </button>
        </Card>
      </div>
    </div>
  );
}