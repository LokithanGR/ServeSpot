import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";

export default function UserSignup() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Password and Confirm Password must match!");
      return;
    }

    const res = await fetch("http://localhost:5000/api/auth/register/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        password: form.password,
        address: form.address}),
    });

    const data = await res.json();
    if (!data.ok) return alert(data.message || "Signup failed");

    alert("User Registered ✅ Now Signin pannunga!");
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.wrap}>
        <div style={styles.card}>
          <h2 style={styles.h2}>User Signup</h2>

          <form onSubmit={onSubmit} style={styles.form}>
            <Field label="Name" name="name" value={form.name} onChange={onChange} />
            <Field label="Mobile No" name="mobile" value={form.mobile} onChange={onChange} />
            <Field label="Email" name="email" value={form.email} onChange={onChange} type="email" />

            <Field label="Password" name="password" value={form.password} onChange={onChange} type="password" />
            <Field
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              type="password"
            />

            <div style={styles.field}>
              <label style={styles.label}>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={onChange}
                style={styles.textarea}
                rows={3}
              />
            </div>
            <button type="submit" style={styles.btnPrimary}>Create Account</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input {...props} style={styles.input} />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },
  wrap: { width: "min(1100px, 92%)", margin: "0 auto", padding: "40px 0" },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  h2: { margin: 0, color: "#1f2937" },
  form: { marginTop: 16, display: "grid", gap: 12 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 14, fontWeight: 700, color: "#1f2937" },
  input: { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outline: "none" },
  textarea: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    resize: "vertical",
  },

  // ✅ added one more button column
  locRow: {
    display: "grid",
    gridTemplateColumns: "220px 160px 1fr 1fr",
    gap: 10,
    alignItems: "center",
  },

  btnPrimary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    fontWeight: 800,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  hint: { fontSize: 12, color: "#6b7280" },
};
