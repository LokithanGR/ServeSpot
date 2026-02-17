import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";

export default function ProviderSignup() {
  const categories = useMemo(
    () => [
      "Women's spa / saloon",
      "Men's saloon",
      "Cleaning & Pest Control",
      "Electrician, Plumber & Carpenter",
      "AC & Appliance Repair",
      "Painting & Waterproofing",
    ],
    []
  );

  const [form, setForm] = useState({
    ownerName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",

    businessType: "freelancer", 
    shopName: "",

    category: categories[0],
    address: "",

    workingDays: [], 
    fromTime: "",
    toTime: "",

    experience: "",
    description: "",
    photo: null,
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleDay = (d) => {
    setForm((p) => {
      const has = p.workingDays.includes(d);
      return { ...p, workingDays: has ? p.workingDays.filter((x) => x !== d) : [...p.workingDays, d] };
    });
  };

  const onSubmit = async (e) => {
  e.preventDefault();

  const res = await fetch("http://localhost:5000/api/auth/register/provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerName: form.ownerName,
      mobile: form.mobile,
      email: form.email,
      password: form.password,
      businessType: form.businessType,
      shopName: form.shopName,
      category: form.category,
      address: form.address,
      workingDays: form.workingDays,
      fromTime: form.fromTime,
      toTime: form.toTime,
      experience: form.experience,
      description: form.description,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    alert(data.message || "Provider signup failed");
    return;
  }

  alert("Provider Registered ✅ Now Signin pannunga!");
};


  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.wrap}>
        <div style={styles.card}>
          <h2 style={styles.h2}>Service Provider Signup</h2>

          <form onSubmit={onSubmit} style={styles.form}>
            <Field label="Owner Name" name="ownerName" value={form.ownerName} onChange={onChange} />
            <Field label="Mobile No" name="mobile" value={form.mobile} onChange={onChange} />
            <Field label="Email" name="email" value={form.email} onChange={onChange} type="email" />

            <Field label="Password" name="password" value={form.password} onChange={onChange} type="password" />
            <Field label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} type="password" />

            <div style={styles.twoCol}>
              <div style={styles.field}>
                <label style={styles.label}>Business Type</label>
                <select name="businessType" value={form.businessType} onChange={onChange} style={styles.input}>
                  <option value="freelancer">Freelancer</option>
                  <option value="shop">Shop</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Shop Name</label>
                <input
                  name="shopName"
                  value={form.shopName}
                  onChange={onChange}
                  style={styles.input}
                  placeholder={form.businessType === "shop" ? "Enter Shop Name" : "Not required for Freelancer"}
                  disabled={form.businessType !== "shop"}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Service Category</label>
              <select name="category" value={form.category} onChange={onChange} style={styles.input}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Address</label>
              <textarea name="address" value={form.address} onChange={onChange} style={styles.textarea} rows={3} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Availability (Working days & timings)</label>
              <div style={styles.daysRow}>
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    style={{
                      ...styles.dayBtn,
                      background: form.workingDays.includes(d) ? "#eef2ff" : "#fff",
                      borderColor: form.workingDays.includes(d) ? "#c7d2fe" : "#e5e7eb",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div style={styles.twoCol}>
                <div style={styles.field}>
                  <label style={styles.label}>From</label>
                  <input name="fromTime" value={form.fromTime} onChange={onChange} type="time" style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>To</label>
                  <input name="toTime" value={form.toTime} onChange={onChange} type="time" style={styles.input} />
                </div>
              </div>
            </div>

            <Field label="Experience (Years)" name="experience" value={form.experience} onChange={onChange} type="number" />

            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea name="description" value={form.description} onChange={onChange} style={styles.textarea} rows={3} />
            </div>
            <button type="submit" style={styles.btnPrimary}>Create Provider Account</button>
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
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  h2: { margin: 0, color: "#1f2937" },
  form: { marginTop: 16, display: "grid", gap: 12 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 14, fontWeight: 700, color: "#1f2937" },
  input: { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outline: "none", background: "#fff" },
  textarea: { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outline: "none", resize: "vertical" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  locRow: { display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 10, alignItems: "center" },
  btnPrimary: { padding: "12px 14px", borderRadius: 12, border: "1px solid #c7d2fe", background: "#eef2ff", fontWeight: 800, cursor: "pointer" },
  btnSecondary: { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800, cursor: "pointer" },
  daysRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  dayBtn: { padding: "8px 10px", borderRadius: 999, border: "1px solid #e5e7eb", cursor: "pointer", fontWeight: 800 },
};