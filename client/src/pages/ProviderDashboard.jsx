import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationPickerModal from "../components/LocationPickerModal.jsx";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProviderDashboard() {
  const nav = useNavigate();

  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Booking Requests (status: pending)
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingErr, setBookingErr] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState("");

  // Pending Works (status: accepted + cancelledBy user)
  const [pendingWorks, setPendingWorks] = useState([]);
  const [loadingPendingWorks, setLoadingPendingWorks] = useState(false);
  const [pendingWorksErr, setPendingWorksErr] = useState("");

  // Notification banner for cancelled works
  const [cancelNotifOpen, setCancelNotifOpen] = useState(false);

  // Work History (completed only)
  const [workHistory, setWorkHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyErr, setHistoryErr] = useState("");

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBookingId, setRejectBookingId] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("servespot_user") || "null");
      if (!u || u.role !== "provider") return nav("/signin");
      setUser(u);
    } catch {
      nav("/signin");
    }
  }, [nav]);

  const logout = () => {
    localStorage.removeItem("servespot_token");
    localStorage.removeItem("servespot_user");
    nav("/signin");
  };

  const providerCategory = user?.provider?.category || "—";

  const businessLocationLabel = useMemo(() => {
    const label = user?.provider?.businessLocation?.label || "";
    if (!label.trim()) return "null";
    const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
    return parts.slice(0, 3).join(", ") || "null";
  }, [user]);

  const serviceAreasList = user?.provider?.serviceAreas || [];

  const [form, setForm] = useState({
    mobile: "",
    photo: "",
    serviceAreasText: "",
    businessLocation: null,
    workingDays: [],
    fromTime: "",
    toTime: "",
  });

  useEffect(() => {
    if (!user) return;
    const av = user?.provider?.availability || {};
    setForm({
      mobile: user?.mobile || "",
      photo: user?.photo || "",
      serviceAreasText: (user?.provider?.serviceAreas || []).join(", "),
      businessLocation: user?.provider?.businessLocation || null,
      workingDays: Array.isArray(av.workingDays) ? av.workingDays : [],
      fromTime: av.fromTime || "",
      toTime: av.toTime || "",
    });
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, photo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const toggleDay = (day) => {
    setForm((p) => {
      const set = new Set(p.workingDays || []);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...p, workingDays: Array.from(set) };
    });
  };

  const onUpdate = async () => {
    if (!user) return;

    const serviceAreas = form.serviceAreasText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (form.workingDays.length > 0) {
      if (!form.fromTime || !form.toTime) {
        return alert("Please choose availability time (From / To) ⏰");
      }
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/provider/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("servespot_token")}`,
        },
        body: JSON.stringify({
          mobile: form.mobile,
          photo: form.photo,
          serviceAreas,
          businessLocation: form.businessLocation,
          availability: {
            workingDays: form.workingDays,
            fromTime: form.fromTime,
            toTime: form.toTime,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        alert(data.message || `Update failed (status ${res.status})`);
        return;
      }

      localStorage.setItem("servespot_user", JSON.stringify(data.user));
      setUser(data.user);

      alert("Provider profile updated ✅");
      setView("dashboard");
    } catch (e) {
      alert("Update failed (server not running)");
      console.log(e);
    }
  };

  const getMapsLink = (b) => {
    const oLat = b?.providerSnapshot?.lat;
    const oLng = b?.providerSnapshot?.lng;
    const dLat = b?.userSnapshot?.lat;
    const dLng = b?.userSnapshot?.lng;

    if (
      oLat == null || oLng == null || dLat == null || dLng == null ||
      Number.isNaN(Number(oLat)) || Number.isNaN(Number(oLng)) ||
      Number.isNaN(Number(dLat)) || Number.isNaN(Number(dLng))
    ) return "";

    return `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}`;
  };

  // ✅ Booking Requests (pending)
  const fetchPendingBookings = async () => {
    try {
      setLoadingBookings(true);
      setBookingErr("");

      const token = localStorage.getItem("servespot_token");
      const res = await fetch("http://localhost:5000/api/bookings/provider/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed (status ${res.status})`);

      setPendingBookings(data.bookings || []);
    } catch (e) {
      setBookingErr(e.message || "Failed to fetch bookings");
      setPendingBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ✅ Pending Works (accepted + cancelled by user)
  const fetchPendingWorks = async () => {
    try {
      setLoadingPendingWorks(true);
      setPendingWorksErr("");

      const token = localStorage.getItem("servespot_token");
      const res = await fetch("http://localhost:5000/api/bookings/provider/pending-works", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed (status ${res.status})`);

      const list = data.bookings || [];
      setPendingWorks(list);

      const cancelled = list.filter(
        (b) => String(b.status || "").toLowerCase() === "cancelled" && b.cancelledBy === "user"
      );
      setCancelNotifOpen(cancelled.length > 0);
    } catch (e) {
      setPendingWorksErr(e.message || "Failed to fetch pending works");
      setPendingWorks([]);
      setCancelNotifOpen(false);
    } finally {
      setLoadingPendingWorks(false);
    }
  };

  // ✅ Work History (completed only)
  const fetchWorkHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistoryErr("");

      const token = localStorage.getItem("servespot_token");
      const res = await fetch("http://localhost:5000/api/bookings/provider/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed (status ${res.status})`);

      setWorkHistory(data.bookings || []);
    } catch (e) {
      setHistoryErr(e.message || "Failed to fetch history");
      setWorkHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ auto fetch based on view
  useEffect(() => {
    if (view === "requests") fetchPendingBookings();
    if (view === "pendingworks") fetchPendingWorks();
    if (view === "history") fetchWorkHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const updateBookingStatus = async (bookingId, status, reason = "") => {
    try {
      setUpdatingBookingId(bookingId);
      const token = localStorage.getItem("servespot_token");

      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reason }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed (status ${res.status})`);

      fetchPendingBookings();
      fetchPendingWorks();
      fetchWorkHistory();
    } catch (e) {
      alert(e.message || "Failed to update booking");
    } finally {
      setUpdatingBookingId("");
    }
  };

  const openReject = (bookingId) => {
    setRejectBookingId(bookingId);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    const r = String(rejectReason || "").trim();
    if (!r) return alert("Reject reason required ❗");

    await updateBookingStatus(rejectBookingId, "rejected", r);
    setRejectOpen(false);
    setRejectBookingId("");
    setRejectReason("");
  };

  // ✅ NEW: delete cancelled work (provider cleanup)
  const deleteCancelledWork = async (bookingId) => {
    const ok = window.confirm("Delete this cancelled work? ❌");
    if (!ok) return;

    try {
      setUpdatingBookingId(bookingId);
      const token = localStorage.getItem("servespot_token");

      const res = await fetch(`http://localhost:5000/api/bookings/provider/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Delete failed");

      fetchPendingWorks();
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setUpdatingBookingId("");
    }
  };

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return { text: "REQUEST PENDING 📩", style: { color: "#f59e0b" } };
    if (s === "accepted") return { text: "PENDING WORK 🛠️", style: { color: "#2563eb" } };
    if (s === "completed") return { text: "COMPLETED ✅", style: { color: "green" } };
    if (s === "rejected") return { text: "REJECTED ❌", style: { color: "crimson" } };
    // ❌ CANCELLED badge text we won't show in Pending Works top-right anymore
    if (s === "cancelled") return { text: "", style: { color: "crimson" } };
    return { text: String(status || "—").toUpperCase(), style: { color: "#111827" } };
  };

  const availabilitySummary = useMemo(() => {
    const av = user?.provider?.availability;
    if (!av) return "—";
    const d = Array.isArray(av.workingDays) && av.workingDays.length ? av.workingDays.join(", ") : "—";
    const t = av.fromTime && av.toTime ? `${av.fromTime} - ${av.toTime}` : "—";
    return `${d} • ${t}`;
  }, [user]);

  const cancelledInsidePendingWorks = pendingWorks.filter(
    (b) => String(b.status || "").toLowerCase() === "cancelled" && b.cancelledBy === "user"
  );

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.left}>
          <div style={styles.brand}>ServeSpot</div>

          <div style={styles.menu}>
            <MenuItem label="Provider Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
            <MenuItem label="Profile Updation" active={view === "profile"} onClick={() => setView("profile")} />

            <MenuItem label="Booking Request" active={view === "requests"} onClick={() => setView("requests")} />
            <MenuItem label="Pending Works" active={view === "pendingworks"} onClick={() => setView("pendingworks")} />
            <MenuItem label="Work History" active={view === "history"} onClick={() => setView("history")} />

            <MenuItem label="Logout" danger onClick={logout} />
          </div>
        </aside>

        <main style={styles.right}>
          {view === "dashboard" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Hi {user?.name || "Provider"} 👋</h2>

              <div style={styles.dashTopRow}>
                <div style={styles.avatarLg}>
                  {user?.photo ? (
                    <img src={user.photo} alt="profile" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>No Photo</div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div><b>Service Category:</b> {providerCategory}</div>
                  <div><b>Business Location:</b> {businessLocationLabel}</div>
                  <div><b>Availability:</b> {availabilitySummary}</div>

                  <div>
                    <b>Service Areas:</b>
                    <div style={styles.areasWrap}>
                      {serviceAreasList.length ? (
                        serviceAreasList.map((a) => (
                          <span key={a} style={styles.chip}>{a}</span>
                        ))
                      ) : (
                        <span style={{ color: "#6b7280", fontWeight: 800 }}>No areas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "profile" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Profile Updation</h2>

              <div style={styles.photoRow}>
                <div style={styles.avatar}>
                  {form.photo ? (
                    <img src={form.photo} alt="profile" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>No Photo</div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={styles.label}>Profile Photo</label>
                  <input type="file" accept="image/*" onChange={onPickPhoto} />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Mobile No</label>
                <input name="mobile" value={form.mobile} onChange={onChange} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Service Areas (comma separated)</label>
                <input
                  name="serviceAreasText"
                  value={form.serviceAreasText}
                  onChange={onChange}
                  style={styles.input}
                  placeholder="Eg: T Nagar, Velachery, Anna Nagar"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Business Location</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button style={styles.btnLight} type="button" onClick={() => setPickerOpen(true)}>
                    Choose on Map
                  </button>
                  <div style={{ fontWeight: 900, color: "#111827" }}>
                    {form.businessLocation?.label?.trim() ? form.businessLocation.label : "null"}
                  </div>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Availability Days</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                  {DAYS.map((d) => {
                    const active = form.workingDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        style={{ ...styles.dayBtn, ...(active ? styles.dayBtnActive : null) }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={styles.field}>
                  <label style={styles.label}>From Time</label>
                  <input type="time" name="fromTime" value={form.fromTime} onChange={onChange} style={styles.input} />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>To Time</label>
                  <input type="time" name="toTime" value={form.toTime} onChange={onChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.bottomLeft}>
                <button style={styles.btnPrimary} onClick={onUpdate}>Update</button>
              </div>

              <LocationPickerModal
                open={pickerOpen}
                initialValue={form.businessLocation || null}
                onClose={() => setPickerOpen(false)}
                onSave={(picked) => {
                  setForm((p) => ({ ...p, businessLocation: picked }));
                  setPickerOpen(false);
                }}
              />
            </div>
          )}

          {/* ✅ Booking Requests */}
          {view === "requests" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Booking Requests 📩</h2>

              {loadingBookings && <p style={{ marginTop: 12, fontWeight: 900 }}>Loading... ⏳</p>}
              {bookingErr && <p style={{ marginTop: 12, color: "crimson", fontWeight: 900 }}>{bookingErr}</p>}

              {!loadingBookings && !bookingErr && pendingBookings.length === 0 && (
                <p style={{ marginTop: 12, fontWeight: 900 }}>No pending requests 😴</p>
              )}

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {pendingBookings.map((b) => {
                  const mapsLink = getMapsLink(b);

                  return (
                    <div key={b._id} style={styles.netflixCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>{b.userSnapshot?.name || "User"} 👤</div>
                        <div style={{ fontWeight: 900 }}>{b.distanceKm ?? "-"} km • {b.etaHours ?? "-"} hrs</div>
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gap: 6, fontWeight: 800 }}>
                        <div><b>Mobile:</b> {b.userSnapshot?.mobile || "-"}</div>
                        <div><b>Location:</b> {b.userSnapshot?.locationLabel || "-"}</div>
                        <div><b>Service:</b> {b.category || "-"}</div>
                        <div><b>Requested Date:</b> {b.scheduleDate || "—"}</div>
                        <div><b>Requested Time:</b> {b.scheduleTime || "—"}</div>

                        {mapsLink ? (
                          <a href={mapsLink} target="_blank" rel="noreferrer" style={{ fontWeight: 900 }}>
                            Open Directions 🗺️
                          </a>
                        ) : (
                          <div style={{ color: "#6b7280", fontWeight: 900 }}>
                            Directions not available (location missing)
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                        <button
                          style={styles.btnPrimary}
                          disabled={updatingBookingId === b._id}
                          onClick={() => updateBookingStatus(b._id, "accepted")}
                        >
                          {updatingBookingId === b._id ? "Updating..." : "Accept ✅"}
                        </button>

                        <button
                          style={styles.btnDanger}
                          disabled={updatingBookingId === b._id}
                          onClick={() => openReject(b._id)}
                        >
                          {updatingBookingId === b._id ? "Updating..." : "Reject ❌"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {rejectOpen && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalCard}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>Reject Reason ✍️</div>

                    <div style={{ marginTop: 12 }}>
                      <label style={styles.label}>Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Eg: Not available today..."
                        style={styles.textarea}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                      <button
                        style={styles.btnLight}
                        type="button"
                        onClick={() => {
                          setRejectOpen(false);
                          setRejectBookingId("");
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </button>

                      <button style={styles.btnDanger} onClick={submitReject}>
                        Reject ❌
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ✅ Pending Works */}
          {view === "pendingworks" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Pending Works 🛠️</h2>

              {cancelNotifOpen && cancelledInsidePendingWorks.length > 0 && (
                <div style={styles.notifBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                      ⚠️ {cancelledInsidePendingWorks.length} cancelled work(s) found!
                    </div>
                    <button style={styles.notifClose} onClick={() => setCancelNotifOpen(false)}>
                      ✖
                    </button>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    {cancelledInsidePendingWorks.slice(0, 3).map((b) => (
                      <div key={b._id} style={{ fontWeight: 800 }}>
                        • {b.userSnapshot?.name || "User"} — {b.cancelReason || "No reason"}
                      </div>
                    ))}
                    {cancelledInsidePendingWorks.length > 3 && (
                      <div style={{ fontWeight: 800, color: "#374151" }}>
                        + {cancelledInsidePendingWorks.length - 3} more cancelled...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadingPendingWorks && <p style={{ marginTop: 12, fontWeight: 900 }}>Loading... ⏳</p>}
              {pendingWorksErr && <p style={{ marginTop: 12, color: "crimson", fontWeight: 900 }}>{pendingWorksErr}</p>}

              {!loadingPendingWorks && !pendingWorksErr && pendingWorks.length === 0 && (
                <p style={{ marginTop: 12, fontWeight: 900 }}>No pending works 😴</p>
              )}

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {pendingWorks.map((b) => {
                  const mapsLink = getMapsLink(b);
                  const isCancelled = String(b.status || "").toLowerCase() === "cancelled" && b.cancelledBy === "user";

                  return (
                    <div key={b._id} style={styles.netflixCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>
                          {b.userSnapshot?.name || "User"} 👤
                        </div>

                        {/* ✅ ONLY X icon for cancelled bookings (no text) */}
                        {isCancelled ? (
                          <button
                            type="button"
                            title="Delete cancelled work"
                            style={styles.xDeleteBtn}
                            disabled={updatingBookingId === b._id}
                            onClick={() => deleteCancelledWork(b._id)}
                          >
                            {updatingBookingId === b._id ? "..." : "✖"}
                          </button>
                        ) : null}
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gap: 6, fontWeight: 800 }}>
                        <div><b>Mobile:</b> {b.userSnapshot?.mobile || "-"}</div>
                        <div><b>Location:</b> {b.userSnapshot?.locationLabel || "-"}</div>
                        <div><b>Service:</b> {b.category || "-"}</div>
                        <div><b>Date:</b> {b.scheduleDate || "—"}</div>
                        <div><b>Time:</b> {b.scheduleTime || "—"}</div>

                        {mapsLink ? (
                          <a href={mapsLink} target="_blank" rel="noreferrer" style={{ fontWeight: 900 }}>
                            Open Directions 🗺️
                          </a>
                        ) : (
                          <div style={{ color: "#6b7280", fontWeight: 900 }}>
                            Directions not available (location missing)
                          </div>
                        )}

                        {isCancelled ? (
                          <div style={{ marginTop: 8, padding: 10, borderRadius: 12, background: "#fee2e2" }}>
                            <div style={{ fontWeight: 900, color: "#991b1b" }}>
                              Cancelled by user ❌
                            </div>
                            <div style={{ marginTop: 6, fontWeight: 800, color: "#111827" }}>
                              <b>Reason:</b> {b.cancelReason?.trim() ? b.cancelReason : "—"}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "#374151", fontWeight: 900 }}>
                            Waiting for user to mark as completed ✅
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ✅ Work History (completed only) */}
          {view === "history" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Work History 🧾</h2>

              {loadingHistory && <p style={{ marginTop: 12, fontWeight: 900 }}>Loading... ⏳</p>}
              {historyErr && <p style={{ marginTop: 12, color: "crimson", fontWeight: 900 }}>{historyErr}</p>}

              {!loadingHistory && !historyErr && workHistory.length === 0 && (
                <p style={{ marginTop: 12, fontWeight: 900 }}>No completed works yet 😴</p>
              )}

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {workHistory.map((b) => (
                  <div key={b._id} style={styles.netflixCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        {b.userSnapshot?.name || "User"} 👤
                      </div>
                      <div style={{ fontWeight: 900, color: "green" }}>COMPLETED ✅</div>
                    </div>

                    <div style={{ marginTop: 10, display: "grid", gap: 6, fontWeight: 800 }}>
                      <div><b>Mobile:</b> {b.userSnapshot?.mobile || "-"}</div>
                      <div><b>Service:</b> {b.category || "-"}</div>
                      <div><b>Date:</b> {b.scheduleDate || "—"}</div>
                      <div><b>Time:</b> {b.scheduleTime || "—"}</div>
                      <div><b>Rating:</b> {b.rating || 0} / 5 ⭐</div>
                      <div>
                        <b>Review:</b>{" "}
                        <span style={{ color: "#374151" }}>{b.review || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MenuItem({ label, onClick, active, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.menuItem,
        ...(active ? styles.menuItemActive : null),
        ...(danger ? styles.menuItemDanger : null),
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },
  shell: { minHeight: "100vh", display: "flex" },

  left: {
    width: "30%",
    minWidth: 260,
    maxWidth: 420,
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  right: { width: "70%", padding: 18 },

  brand: { fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: 0.2 },
  menu: { marginTop: 8, display: "grid", gap: 10 },

  menuItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 900,
    color: "#111827",
  },
  menuItemActive: { background: "#eef2ff", borderColor: "#c7d2fe" },
  menuItemDanger: { background: "#fee2e2", borderColor: "#fecaca" },

  rightCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    minHeight: 260,
    position: "relative",
  },
  rightTitle: { margin: 0, fontSize: 20, fontWeight: 900, color: "#111827" },

  dashTopRow: {
    marginTop: 14,
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  photoRow: { marginTop: 14, display: "flex", gap: 14, alignItems: "center" },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    background: "#f9fafb",
  },
  avatarLg: {
    width: 110,
    height: 110,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    background: "#f9fafb",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarPlaceholder: { fontSize: 12, fontWeight: 900, color: "#6b7280" },

  field: { display: "grid", gap: 6, marginTop: 12 },
  label: { fontSize: 14, color: "#374151", fontWeight: 700 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    background: "#fff",
  },

  dayBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  },
  dayBtnActive: { background: "#111827", borderColor: "#111827", color: "#fff" },

  areasWrap: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontWeight: 900,
    fontSize: 12,
  },

  btnLight: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  bottomLeft: { marginTop: 16, display: "flex", justifyContent: "flex-start" },

  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    width: "fit-content",
  },

  btnDanger: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ef4444",
    background: "#fee2e2",
    cursor: "pointer",
    fontWeight: 900,
    width: "fit-content",
  },

  netflixCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f9fafb",
  },

  notifBox: {
    border: "1px solid #fecaca",
    background: "#fee2e2",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  notifClose: {
    border: "1px solid #ef4444",
    background: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },

  // ✅ NEW: X delete button (top-right)
  xDeleteBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 900,
    color: "crimson",
    lineHeight: 1,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 50,
  },

  modalCard: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  textarea: {
    width: "100%",
    minHeight: 110,
    resize: "vertical",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    background: "#fff",
    marginTop: 6,
    fontWeight: 700,
    fontFamily: "inherit",
  },
};