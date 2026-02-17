import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const nav = useNavigate();

  const admin = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("servespot_admin") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("servespot_admin_token");

  const [view, setView] = useState("home"); // home | today | users | categories | feedback

  // today report
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayErr, setTodayErr] = useState("");
  const [loggedInToday, setLoggedInToday] = useState([]);
  const [registeredToday, setRegisteredToday] = useState([]);

  // all users
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersErr, setUsersErr] = useState("");
  const [users, setUsers] = useState([]);

  // categories + providers
  const [catLoading, setCatLoading] = useState(false);
  const [catErr, setCatErr] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersErr, setProvidersErr] = useState("");
  const [providers, setProviders] = useState([]);

  // ✅ NEW: feedback
  const [fbLoading, setFbLoading] = useState(false);
  const [fbErr, setFbErr] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    if (!admin || !token) nav("/admin/login");
  }, [admin, token, nav]);

  const logout = () => {
    localStorage.removeItem("servespot_admin_token");
    localStorage.removeItem("servespot_admin");
    nav("/admin/login");
  };

  const fetchToday = async () => {
    try {
      setTodayLoading(true);
      setTodayErr("");

      const res = await fetch("http://localhost:5000/api/admin/today-report", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed");

      setLoggedInToday(data.loggedInToday || []);
      setRegisteredToday(data.registeredToday || []);
    } catch (e) {
      setTodayErr(e.message || "Failed");
      setLoggedInToday([]);
      setRegisteredToday([]);
    } finally {
      setTodayLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersErr("");

      const res = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed");

      setUsers(data.users || []);
    } catch (e) {
      setUsersErr(e.message || "Failed");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      setCatErr("");

      const res = await fetch("http://localhost:5000/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed");

      setCategories(data.categories || []);
    } catch (e) {
      setCatErr(e.message || "Failed");
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  const fetchProvidersByCategory = async (category) => {
    try {
      setProvidersLoading(true);
      setProvidersErr("");
      setProviders([]);

      const res = await fetch(
        `http://localhost:5000/api/admin/providers?category=${encodeURIComponent(
          category
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed");

      // ✅ expecting formatted providers: { id, name, mobile, email, locationShort, category }
      setProviders(data.providers || []);
    } catch (e) {
      setProvidersErr(e.message || "Failed");
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  // ✅ NEW: fetch feedbacks
  const fetchFeedbacks = async () => {
    try {
      setFbLoading(true);
      setFbErr("");

      const res = await fetch("http://localhost:5000/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed");

      setFeedbacks(data.feedbacks || []);
    } catch (e) {
      setFbErr(e.message || "Failed");
      setFeedbacks([]);
    } finally {
      setFbLoading(false);
    }
  };

  const openToday = () => {
    setView("today");
    fetchToday();
  };

  const openUsers = () => {
    setView("users");
    fetchUsers();
  };

  const openCategories = () => {
    setView("categories");
    setSelectedCat("");
    setProviders([]);
    fetchCategories();
  };

  // ✅ NEW: open feedback
  const openFeedback = () => {
    setView("feedback");
    fetchFeedbacks();
  };

  const RoleBadge = ({ role }) => {
    const r = String(role || "").toLowerCase();
    const bg = r === "provider" ? "#e0f2fe" : "#dcfce7";
    const bd = r === "provider" ? "#7dd3fc" : "#86efac";
    const tx = r === "provider" ? "#075985" : "#166534";
    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 999,
          border: `1px solid ${bd}`,
          background: bg,
          color: tx,
          fontWeight: 900,
          fontSize: 12,
        }}
      >
        {r.toUpperCase()}
      </span>
    );
  };

  return (
    <div style={styles.page}>
      {/* TOP NAV */}
      <header style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.brand}>ServeSpot</div>
          <div style={styles.welcome}>
            Welcome {admin?.name || "Loki"} !!! 😄
          </div>
        </div>

        <button style={styles.logout} onClick={logout}>
          Logout
        </button>
      </header>

      <main style={styles.main}>
        {/* HOME BUTTONS */}
        {view === "home" && (
          <div style={styles.center}>
            <div style={styles.grid}>
              <button style={styles.bigCard} onClick={openToday}>
                Today's Login Report 📊
              </button>
              <button style={styles.bigCard} onClick={openUsers}>
                All Users 👥
              </button>
              <button style={styles.bigCard} onClick={openCategories}>
                Service Categories 🧰
              </button>

              {/* ✅ NEW */}
              <button style={styles.bigCard} onClick={openFeedback}>
                User&apos;s Feedback 💬
              </button>
            </div>
          </div>
        )}

        {/* TODAY REPORT */}
        {view === "today" && (
          <div style={styles.card}>
            <div style={styles.headRow}>
              <div style={styles.h2}>Today's Login Report 📊</div>
              <button style={styles.btnLight} onClick={() => setView("home")}>
                ⬅ Back
              </button>
            </div>

            {todayLoading && <div style={styles.loading}>Loading... ⏳</div>}
            {todayErr && <div style={styles.err}>{todayErr}</div>}

            {!todayLoading && !todayErr && (
              <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
                <div style={styles.subCard}>
                  <div style={styles.subTitle}>Logged in Today</div>
                  {loggedInToday.length === 0 ? (
                    <div style={styles.muted}>No logins today 😴</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                      {loggedInToday.map((u) => (
                        <div key={u._id} style={styles.row}>
                          <div style={{ fontWeight: 900 }}>{u.name}</div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <RoleBadge role={u.role} />
                            <div style={styles.smallMuted}>{u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.subCard}>
                  <div style={styles.subTitle}>Registered Today</div>
                  {registeredToday.length === 0 ? (
                    <div style={styles.muted}>No new registrations today 😴</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                      {registeredToday.map((u) => (
                        <div key={u._id} style={styles.row}>
                          <div style={{ fontWeight: 900 }}>{u.name}</div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <RoleBadge role={u.role} />
                            <div style={styles.smallMuted}>{u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALL USERS */}
        {view === "users" && (
          <div style={styles.card}>
            <div style={styles.headRow}>
              <div style={styles.h2}>All Users 👥</div>
              <button style={styles.btnLight} onClick={() => setView("home")}>
                ⬅ Back
              </button>
            </div>

            {usersLoading && <div style={styles.loading}>Loading... ⏳</div>}
            {usersErr && <div style={styles.err}>{usersErr}</div>}

            {!usersLoading && !usersErr && (
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {users.length === 0 ? (
                  <div style={styles.muted}>No users 😴</div>
                ) : (
                  users.map((u) => (
                    <div key={u._id} style={styles.row}>
                      <div style={{ fontWeight: 900 }}>{u.name}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <RoleBadge role={u.role} />
                        <div style={styles.smallMuted}>{u.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES */}
        {view === "categories" && (
          <div style={styles.card}>
            <div style={styles.headRow}>
              <div style={styles.h2}>Service Categories 🧰</div>
              <button style={styles.btnLight} onClick={() => setView("home")}>
                ⬅ Back
              </button>
            </div>

            {catLoading && <div style={styles.loading}>Loading... ⏳</div>}
            {catErr && <div style={styles.err}>{catErr}</div>}

            {!catLoading && !catErr && (
              <>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {categories.map((c) => (
                    <button
                      key={c}
                      style={{
                        ...styles.catBtn,
                        ...(selectedCat === c ? styles.catBtnActive : null),
                      }}
                      onClick={() => {
                        setSelectedCat(c);
                        fetchProvidersByCategory(c);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    {selectedCat ? `Providers in "${selectedCat}"` : "Choose a category above 👆"}
                  </div>

                  {providersLoading && <div style={styles.loading}>Loading providers... ⏳</div>}
                  {providersErr && <div style={styles.err}>{providersErr}</div>}

                  {!providersLoading && !providersErr && selectedCat && (
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      {providers.length === 0 ? (
                        <div style={styles.muted}>No providers for this category 😕</div>
                      ) : (
                        providers.map((p) => (
                          <div key={p.id || p._id} style={styles.providerRow}>
                            <div style={{ display: "grid", gap: 4 }}>
                              <div style={{ fontWeight: 900, fontSize: 15 }}>{p.name || "—"}</div>
                              <div style={styles.smallMuted}>📍 {p.locationShort || "—"}</div>
                              <div style={styles.smallMuted}>📞 {p.mobile || "—"}</div>
                            </div>

                            <div style={{ fontWeight: 900, color: "#6b7280" }}>
                              {p.category || ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ NEW: FEEDBACK VIEW */}
        {view === "feedback" && (
          <div style={styles.card}>
            <div style={styles.headRow}>
              <div style={styles.h2}>User&apos;s Feedback 💬</div>
              <button style={styles.btnLight} onClick={() => setView("home")}>
                ⬅ Back
              </button>
            </div>

            {fbLoading && <div style={styles.loading}>Loading... ⏳</div>}
            {fbErr && <div style={styles.err}>{fbErr}</div>}

            {!fbLoading && !fbErr && (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {feedbacks.length === 0 ? (
                  <div style={styles.muted}>No feedback yet 🙂</div>
                ) : (
                  feedbacks.map((f) => (
                    <div key={f._id} style={styles.subCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900 }}>
                          {f.userName || "—"}{" "}
                          <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280", fontWeight: 900 }}>
                            ({String(f.role || "").toUpperCase()})
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, color: "#6b7280", fontSize: 12 }}>
                          {f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}
                        </div>
                      </div>

                      <div style={{ marginTop: 10, fontWeight: 800, color: "#111827", lineHeight: 1.5 }}>
                        {f.message || ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },

  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
  },
  brand: { fontWeight: 900, fontSize: 22, color: "#111827" },
  welcome: { fontWeight: 900, color: "#374151" },

  logout: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ef4444",
    background: "#fee2e2",
    cursor: "pointer",
    fontWeight: 900,
  },

  main: { width: "min(1100px, 92%)", margin: "0 auto", padding: "18px 0" },

  center: { minHeight: "70vh", display: "grid", placeItems: "center" },
  grid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(2, 1fr)",
    width: "100%",
  },

  bigCard: {
    minHeight: 140,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    minHeight: 260,
  },

  headRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  h2: { fontSize: 20, fontWeight: 900, color: "#111827" },

  btnLight: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  loading: { marginTop: 12, fontWeight: 900 },
  err: { marginTop: 12, color: "crimson", fontWeight: 900 },

  subCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f9fafb",
  },
  subTitle: { fontWeight: 900, fontSize: 16 },
  muted: { marginTop: 10, color: "#6b7280", fontWeight: 900 },
  smallMuted: { color: "#6b7280", fontWeight: 800, fontSize: 13 },

  row: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 14,
    padding: "12px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  providerRow: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 14,
    padding: "12px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  catBtn: {
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
  catBtnActive: { background: "#eef2ff", borderColor: "#c7d2fe" },
};
