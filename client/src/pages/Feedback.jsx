import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Feedback() {
  const nav = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("servespot_token");
    const user = localStorage.getItem("servespot_user");

    // ✅ if not logged in -> go signin with redirect
    if (!token || !user) {
      nav("/signin?redirect=/feedback");
    }
  }, [nav]);

  const submit = async () => {
    const token = localStorage.getItem("servespot_token");
    if (!token) return;

    const msg = String(message || "").trim();
    if (!msg) return alert("Please enter your feedback 🙂");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed");

      alert("Feedback submitted ✅");
      setMessage("");

      // ✅ AFTER SUBMIT: go to correct dashboard (not home)
      const u = JSON.parse(localStorage.getItem("servespot_user") || "null");

      if (u?.role === "provider") nav("/dashboard/provider");
      else if (u?.role === "user") nav("/dashboard/user");
      else nav("/"); // fallback
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar showSignup />

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.title}>Give your feedback 💬</h2>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type here..."
            style={styles.textarea}
          />

          <button style={styles.btn} onClick={submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit ✅"}
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },
  main: {
    width: "min(900px, 92%)",
    margin: "0 auto",
    padding: "60px 0",
    display: "grid",
    placeItems: "center",
  },
  card: {
    width: "min(520px, 100%)",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 26px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 900, color: "#111827" },
  textarea: {
    width: "100%",
    minHeight: 140,
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    fontWeight: 700,
  },
  btn: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    width: "100%",
  },
};
