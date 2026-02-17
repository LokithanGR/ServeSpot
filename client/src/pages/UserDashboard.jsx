import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationPickerModal from "../components/LocationPickerModal.jsx";

export default function UserDashboard() {
  const nav = useNavigate();

  // ✅ Providers listing states
  const [providersList, setProvidersList] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [selectedProviderObj, setSelectedProviderObj] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedService, setSelectedService] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);

  // ✅ My Bookings states (Accepted + Rejected only)
  const [bookingsHome, setBookingsHome] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);
  const [myBookingsErr, setMyBookingsErr] = useState("");

  // ✅ Work completed modal states
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);

  // ✅ NEW: Booking date/time modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  // ✅ NEW: Cancel booking loading
  const [cancelLoadingId, setCancelLoadingId] = useState("");

  // ✅ Stars helper (ratingAvg -> ⭐)
  const renderStars = (avg = 0) => {
    const a = Number(avg || 0);
    const rounded = Math.round(a); // 0..5
    let out = "";
    for (let i = 1; i <= 5; i++) out += i <= rounded ? "⭐" : "☆";
    return out;
  };

  // ✅ Helper: "2026-02-02" -> "Mon"
  const getDayShortFromISO = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return "";
    const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return map[d.getDay()];
  };

  // ✅ Helper: "10:30" -> minutes
  const timeToMinutes = (t) => {
    if (!t) return NaN;
    const m = String(t).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
    return hh * 60 + mm;
  };

  // ✅ NEW: Past schedule check (frontend block)
  const isPastSchedule = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const chosen = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(chosen.getTime())) return false;
    return chosen.getTime() < new Date().getTime();
  };

  // ✅ normalize provider workingDays (accept Mon / Monday / mon / MON)
  const normalizeDayToShort = (day) => {
    const s = String(day || "").trim().toLowerCase();
    if (!s) return "";

    if (s.startsWith("mon")) return "Mon";
    if (s.startsWith("tue")) return "Tue";
    if (s.startsWith("wed")) return "Wed";
    if (s.startsWith("thu")) return "Thu";
    if (s.startsWith("fri")) return "Fri";
    if (s.startsWith("sat")) return "Sat";
    if (s.startsWith("sun")) return "Sun";

    return "";
  };

  // categories rotate
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

  const [catIndex, setCatIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("servespot_user") || "null");
      if (!u || u.role !== "user") return nav("/signin");
      setUser(u);
    } catch {
      nav("/signin");
    }
  }, [nav]);

  // rotate category every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCatIndex((p) => (p + 1) % categories.length);
        setFade(true);
      }, 160);
    }, 2000);

    return () => clearInterval(interval);
  }, [categories.length]);

  const logout = () => {
    localStorage.removeItem("servespot_token");
    localStorage.removeItem("servespot_user");
    nav("/signin");
  };

  // ✅ short location for dashboard
  const currentLocationLabel = useMemo(() => {
    const label = user?.currentLocation?.label || "";
    if (!label.trim()) return "null";

    const parts = label
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const short = parts.slice(0, 3).join(", ");
    return short || "null";
  }, [user]);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    currentLocation: null,
    photo: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user?.name || "",
      mobile: user?.mobile || "",
      currentLocation: user?.currentLocation || null,
      photo: user?.photo || "",
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
    reader.onload = () => {
      setForm((p) => ({ ...p, photo: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const onUpdate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("servespot_token")}`,
        },
        body: JSON.stringify({
          name: form.name,
          mobile: form.mobile,
          photo: form.photo,
          currentLocation: form.currentLocation,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        alert(data.message || `Update failed (status ${res.status})`);
        return;
      }

      localStorage.setItem("servespot_user", JSON.stringify(data.user));
      setUser(data.user);
      alert("Profile updated ✅");
      setView("dashboard");
    } catch (e) {
      alert("Update failed (network/server not running)");
      console.log(e);
    }
  };

  // ✅ Fetch providers by category + user location
  const fetchProviders = async (category) => {
    try {
      setLoadingProviders(true);
      setProvidersError("");
      setProvidersList([]);
      setSelectedProviderObj(null);

      const token = localStorage.getItem("servespot_token");

      const res = await fetch(
        `http://localhost:5000/api/providers/search?category=${encodeURIComponent(
          category
        )}&radius=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || `Failed (status ${res.status})`);

      setProvidersList(data.providers || []);
    } catch (err) {
      setProvidersError(err.message || "Failed to fetch providers");
    } finally {
      setLoadingProviders(false);
    }
  };

  // ✅ availability validator (frontend)
  const validateAvailability = () => {
    if (!selectedProviderObj?.id) return false;

    if (!bookingDate || !bookingTime) {
      alert("Please choose date & time 📅⏰");
      return false;
    }

    // ✅ NEW: past date/time block
    if (isPastSchedule(bookingDate, bookingTime)) {
      alert("Please choose the correct date/time ❌");
      return false;
    }

    const avail =
      selectedProviderObj?.availability ||
      selectedProviderObj?.provider?.availability ||
      null;

    if (!avail) return true;

    const chosenDayShort = getDayShortFromISO(bookingDate); // Mon
    const workingDaysRaw = Array.isArray(avail.workingDays)
      ? avail.workingDays
      : [];

    const workingDaysShort = workingDaysRaw
      .map(normalizeDayToShort)
      .filter(Boolean);

    if (workingDaysShort.length && !workingDaysShort.includes(chosenDayShort)) {
      alert("Provider not available on that day ❌");
      return false;
    }

    const from = timeToMinutes(avail.fromTime);
    const to = timeToMinutes(avail.toTime);
    const chosen = timeToMinutes(bookingTime);

    if ([from, to, chosen].every((x) => Number.isFinite(x))) {
      if (!(chosen >= from && chosen <= to)) {
        alert("Provider not available at that time ❌");
        return false;
      }
    }

    return true;
  };

  // ✅ Book service
  const bookService = async () => {
    if (!selectedProviderObj?.id) return;

    try {
      setBookingLoading(true);
      const token = localStorage.getItem("servespot_token");

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId: selectedProviderObj.id,
          category: selectedService,
          scheduleDate: bookingDate,
          scheduleTime: bookingTime,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Booking failed");

      alert("Booking request sent ✅");
      setBookingModalOpen(false);
      setBookingDate("");
      setBookingTime("");
      setSelectedProviderObj(null);
    } catch (e) {
      alert(e.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  // ✅ Fetch My Bookings
  const fetchMyBookings = async () => {
    try {
      setLoadingMyBookings(true);
      setMyBookingsErr("");

      const token = localStorage.getItem("servespot_token");

      const res = await fetch("http://localhost:5000/api/bookings/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");

      setMyBookings(data.bookings || []);
    } catch (e) {
      setMyBookingsErr(e.message || "Failed to fetch bookings");
      setMyBookings([]);
    } finally {
      setLoadingMyBookings(false);
    }
  };

  // ✅ Delete rejected booking
  const deleteRejected = async (id) => {
    try {
      const token = localStorage.getItem("servespot_token");
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Delete failed");

      fetchMyBookings();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  // ✅ NEW: Cancel accepted booking
  const cancelBooking = async (bookingId) => {
    const ok = window.confirm("Cancel this booking? ❌");
    if (!ok) return;

    try {
      setCancelLoadingId(bookingId);
      const token = localStorage.getItem("servespot_token");

      const res = await fetch(
        `http://localhost:5000/api/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: "Cancelled by user" }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Cancel failed");

      alert("Booking cancelled ✅");
      fetchMyBookings();
    } catch (e) {
      alert(e.message || "Cancel failed");
    } finally {
      setCancelLoadingId("");
    }
  };

  const openCompleteModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setReview("");
    setCompleteOpen(true);
  };

  const submitComplete = async () => {
    if (!selectedBooking?._id) return;

    try {
      setCompleteLoading(true);
      const token = localStorage.getItem("servespot_token");

      const res = await fetch(
        `http://localhost:5000/api/bookings/${selectedBooking._id}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, review }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Complete failed");

      alert("Work completed ✅ Thank you!");
      setCompleteOpen(false);
      setSelectedBooking(null);
      fetchMyBookings();
    } catch (e) {
      alert(e.message || "Complete failed");
    } finally {
      setCompleteLoading(false);
    }
  };

  // ✅ accepted list exclude cancelled
  const acceptedList = myBookings.filter((b) => b.status === "accepted");
  const rejectedList = myBookings.filter((b) => b.status === "rejected");

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* LEFT */}
        <aside style={styles.left}>
          <div style={styles.brand}>ServeSpot</div>

          <div style={styles.menu}>
            <MenuItem
              label="User Dashboard"
              active={view === "dashboard"}
              onClick={() => setView("dashboard")}
            />
            <MenuItem
              label="Profile Updation"
              active={view === "profile"}
              onClick={() => setView("profile")}
            />
            <MenuItem
              label="Service Providers"
              active={view === "providers"}
              onClick={() => {
                setView("providers");
                setSelectedService("");
                setProvidersList([]);
                setProvidersError("");
                setSelectedProviderObj(null);
              }}
            />
            <MenuItem
              label="My Bookings"
              active={view === "bookings"}
              onClick={() => {
                setView("bookings");
                setBookingsHome(true);
                fetchMyBookings();
              }}
            />
            <MenuItem label="Logout" danger onClick={logout} />
          </div>
        </aside>

        {/* RIGHT */}
        <main style={styles.right}>
          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Hi {user?.name || "User"} 👋</h2>

              <div style={styles.dashTopRow}>
                <div style={styles.avatarLg}>
                  {user?.photo ? (
                    <img src={user.photo} alt="profile" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>No Photo</div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div><b>Email:</b> {user?.email || "-"}</div>
                  <div><b>Mobile:</b> {user?.mobile || "-"}</div>
                  <div><b>Current Location:</b> {currentLocationLabel}</div>
                </div>
              </div>

              <div style={styles.about}>
                ServeSpot helps you find trusted service providers near you — quick booking,
                easy tracking, and smooth service experience ✅
              </div>

              <div style={styles.sectionTitle}>What are you looking for? 🔎</div>

              <div
                style={{
                  ...styles.categoryCard,
                  opacity: fade ? 1 : 0,
                  transform: fade ? "translateY(0px)" : "translateY(6px)",
                }}
              >
                {categories[catIndex]}
              </div>
            </div>
          )}

          {/* PROFILE */}
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
                <label style={styles.label}>Name</label>
                <input name="name" value={form.name} onChange={onChange} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Mobile No</label>
                <input name="mobile" value={form.mobile} onChange={onChange} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Location</label>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button style={styles.btnLight} type="button" onClick={() => setPickerOpen(true)}>
                    Choose on Map
                  </button>

                  <div style={{ fontWeight: 900, color: "#111827" }}>
                    {form.currentLocation?.label?.trim() ? form.currentLocation.label : "null"}
                  </div>
                </div>
              </div>

              <div style={styles.bottomLeft}>
                <button style={styles.btnPrimary} onClick={onUpdate}>Update</button>
              </div>

              <LocationPickerModal
                open={pickerOpen}
                initialValue={form.currentLocation || null}
                onClose={() => setPickerOpen(false)}
                onSave={(picked) => {
                  setForm((p) => ({ ...p, currentLocation: picked }));
                  setPickerOpen(false);
                }}
              />
            </div>
          )}

          {/* PROVIDERS */}
          {view === "providers" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>Choose the services 🧰</h2>

              <div style={{ marginTop: 14 }}>
                <label style={styles.label}>Select Category</label>

                <select
                  value={selectedService}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedService(val);
                    fetchProviders(val);
                  }}
                  style={styles.select}
                >
                  <option value="" disabled>-- Choose a service --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {selectedService && (
                  <div style={{ marginTop: 12, fontWeight: 900, color: "#111827" }}>
                    Selected: {selectedService}
                  </div>
                )}

                {loadingProviders && (
                  <p style={{ marginTop: 12, fontWeight: 800 }}>Loading providers... ⏳</p>
                )}

                {providersError && (
                  <p style={{ marginTop: 12, color: "crimson", fontWeight: 900 }}>
                    {providersError}
                  </p>
                )}

                {!loadingProviders && !providersError && selectedService && (
                  <div style={{ marginTop: 14 }}>
                    <h3 style={{ fontWeight: 900, marginBottom: 10 }}>
                      Nearby Providers ({providersList.length}) 📍
                    </h3>

                    {providersList.length === 0 ? (
                      <p style={{ fontWeight: 800 }}>No providers found in 10km radius 😕</p>
                    ) : (
                      <ul style={{ paddingLeft: 18 }}>
                        {providersList.map((p) => (
                          <li
                            key={p.id}
                            style={{
                              marginBottom: 12,
                              fontWeight: 900,
                              cursor: "pointer",
                              lineHeight: 1.35,
                            }}
                            onClick={() => setSelectedProviderObj(p)}
                          >
                            {p.name} — {p.distanceKm} km{" "}
                            <span style={{ marginLeft: 6 }}>
                              {renderStars(p.ratingAvg)}{" "}
                              <span style={{ color: "#6b7280", fontWeight: 800 }}>
                                ({p.ratingCount ?? 0})
                              </span>
                            </span>

                            <div style={{ marginTop: 6, fontWeight: 800, color: "#374151" }}>
                              <span style={{ fontWeight: 900 }}>Available:</span>{" "}
                              {p.availability?.workingDays?.length
                                ? p.availability.workingDays.join(", ")
                                : "—"}
                              {p.availability?.fromTime && p.availability?.toTime ? (
                                <>
                                  {" "}• {p.availability.fromTime} - {p.availability.toTime}
                                </>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {selectedProviderObj && (
                      <div style={styles.providerCard}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={styles.avatarSm}>
                            {selectedProviderObj.photo ? (
                              <img src={selectedProviderObj.photo} alt="provider" style={styles.avatarImg} />
                            ) : (
                              <div style={styles.avatarPlaceholder}>No Photo</div>
                            )}
                          </div>

                          <div>
                            <h3 style={{ margin: 0, fontWeight: 900 }}>
                              {selectedProviderObj.name} 👨‍🔧
                            </h3>
                            <div style={{ fontWeight: 800, color: "#374151", marginTop: 4 }}>
                              {selectedProviderObj.category || selectedService}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 10, display: "grid", gap: 6, fontWeight: 800 }}>
                          <div><b>Mobile:</b> {selectedProviderObj.mobile || "—"}</div>
                          <div><b>Experience:</b> {selectedProviderObj.experience || "—"}</div>

                          <div>
                            <b>Ratings:</b>{" "}
                            <span style={{ fontWeight: 900 }}>
                              {renderStars(selectedProviderObj.ratingAvg)}
                            </span>{" "}
                            <span style={{ color: "#6b7280" }}>
                              ({selectedProviderObj.ratingCount ?? 0})
                            </span>
                            <span style={{ marginLeft: 8, color: "#374151", fontWeight: 900 }}>
                              {Number(selectedProviderObj.ratingAvg || 0).toFixed(1)}/5
                            </span>
                          </div>

                          <div>
                            <b>Available:</b>{" "}
                            {selectedProviderObj.availability?.workingDays?.length
                              ? selectedProviderObj.availability.workingDays.join(", ")
                              : "—"}
                            {selectedProviderObj.availability?.fromTime &&
                            selectedProviderObj.availability?.toTime ? (
                              <>
                                <br />
                                {selectedProviderObj.availability.fromTime} -{" "}
                                {selectedProviderObj.availability.toTime}
                              </>
                            ) : null}
                          </div>

                          <div><b>Distance:</b> {selectedProviderObj.distanceKm} km</div>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                          <button
                            style={styles.btnPrimary}
                            disabled={bookingLoading}
                            onClick={() => {
                              setBookingDate("");
                              setBookingTime("");
                              setBookingModalOpen(true);
                            }}
                          >
                            Book Service
                          </button>

                          <button style={styles.btnLight} type="button" onClick={() => setSelectedProviderObj(null)}>
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ✅ BOOKING MODAL */}
              {bookingModalOpen && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalCard}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      Select Date & Time 📅⏰
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={styles.label}>Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={styles.label}>Time</label>
                      <input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                      <button
                        style={styles.btnLight}
                        type="button"
                        onClick={() => setBookingModalOpen(false)}
                      >
                        Cancel
                      </button>

                      <button
                        style={styles.btnPrimary}
                        disabled={bookingLoading}
                        onClick={() => {
                          if (!validateAvailability()) return;
                          bookService();
                        }}
                      >
                        {bookingLoading ? "Booking..." : "Confirm Booking ✅"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ✅ MY BOOKINGS */}
          {view === "bookings" && (
            <div style={styles.rightCard}>
              <h2 style={styles.rightTitle}>My Bookings 📌</h2>

              {loadingMyBookings && (
                <p style={{ marginTop: 12, fontWeight: 900 }}>Loading bookings... ⏳</p>
              )}

              {myBookingsErr && (
                <p style={{ marginTop: 12, color: "crimson", fontWeight: 900 }}>
                  {myBookingsErr}
                </p>
              )}

              {!loadingMyBookings && !myBookingsErr && (
                <>
                  {/* HOME */}
                  {bookingsHome === true && (
                    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                      <div style={styles.bigCard} onClick={() => setBookingsHome("accepted")}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>Accepted ✅</div>
                        <div style={{ marginTop: 6, fontWeight: 800, color: "#374151" }}>
                          Provider accepted jobs ({acceptedList.length})
                        </div>
                      </div>

                      <div style={styles.bigCard} onClick={() => setBookingsHome("rejected")}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>Rejected ❌</div>
                        <div style={{ marginTop: 6, fontWeight: 800, color: "#374151" }}>
                          Provider rejected jobs ({rejectedList.length})
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACCEPTED LIST */}
                  {bookingsHome === "accepted" && (
                    <div style={{ marginTop: 14 }}>
                      <button style={styles.btnLight} type="button" onClick={() => setBookingsHome(true)}>
                        ⬅ Back
                      </button>

                      {acceptedList.length === 0 ? (
                        <p style={{ fontWeight: 800, marginTop: 12 }}>No accepted jobs 😴</p>
                      ) : (
                        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                          {acceptedList.map((b) => (
                            <div key={b._id} style={styles.netflixCard}>
                              <div style={{ fontWeight: 900, fontSize: 16 }}>
                                {b.providerSnapshot?.name || "Provider"} 👨‍🔧
                              </div>

                              <div style={styles.muted}>
                                {b.category} • {b.distanceKm ?? "-"} km • {b.etaHours ?? "-"} hrs
                              </div>

                              {/* ✅ show date/time */}
                              <div style={{ marginTop: 10, fontWeight: 800, color: "#e5e7eb" }}>
                                <div>
                                  <b>Date:</b>{" "}
                                  {b.scheduleDate ? String(b.scheduleDate).slice(0, 10) : "—"}
                                </div>
                                <div>
                                  <b>Time:</b> {b.scheduleTime ? b.scheduleTime : "—"}
                                </div>
                              </div>

                              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button style={styles.btnPrimary} onClick={() => openCompleteModal(b)}>
                                  Work Completed ✅
                                </button>

                                {/* ✅ NEW: Cancel Booking */}
                                <button
                                  style={styles.btnDanger}
                                  disabled={cancelLoadingId === b._id}
                                  onClick={() => cancelBooking(b._id)}
                                >
                                  {cancelLoadingId === b._id ? "Cancelling..." : "Cancel Booking ❌"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* REJECTED LIST */}
                  {bookingsHome === "rejected" && (
                    <div style={{ marginTop: 14 }}>
                      <button style={styles.btnLight} type="button" onClick={() => setBookingsHome(true)}>
                        ⬅ Back
                      </button>

                      {rejectedList.length === 0 ? (
                        <p style={{ fontWeight: 800, marginTop: 12 }}>No rejected jobs 😴</p>
                      ) : (
                        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                          {rejectedList.map((b) => (
                            <div key={b._id} style={styles.netflixCard}>
                              <div style={{ fontWeight: 900, fontSize: 16 }}>
                                {b.providerSnapshot?.name || "Provider"} 👨‍🔧
                              </div>

                              <div style={styles.muted}>
                                {b.category} • {b.distanceKm ?? "-"} km
                              </div>

                              <div style={{ marginTop: 10, fontWeight: 900, color: "#ffb4b4" }}>
                                Reject Reason:
                              </div>
                              <div style={{ marginTop: 6, fontWeight: 800, color: "#e5e7eb" }}>
                                {b.rejectReason?.trim() ? b.rejectReason : "—"}
                              </div>

                              <div style={{ marginTop: 12 }}>
                                <button style={styles.btnDanger} onClick={() => deleteRejected(b._id)}>
                                  Delete ❌
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* MODAL (Complete + rating) */}
              {completeOpen && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalCard}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>Rate & Review ⭐</div>

                    <div style={{ marginTop: 12 }}>
                      <label style={styles.label}>Rating (1 to 5)</label>
                      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={styles.select}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={styles.label}>Review</label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your experience..."
                        style={styles.textarea}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                      <button
                        style={styles.btnLight}
                        type="button"
                        onClick={() => {
                          setCompleteOpen(false);
                          setSelectedBooking(null);
                        }}
                      >
                        Cancel
                      </button>

                      <button style={styles.btnPrimary} disabled={completeLoading} onClick={submitComplete}>
                        {completeLoading ? "Submitting..." : "Submit ✅"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

  about: {
    marginTop: 14,
    color: "#374151",
    fontWeight: 700,
    lineHeight: 1.45,
  },

  sectionTitle: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  categoryCard: {
    marginTop: 10,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: 16,
    padding: "14px 16px",
    fontWeight: 900,
    color: "#111827",
    transition: "opacity 160ms ease, transform 160ms ease",
    width: "fit-content",
    minWidth: 280,
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

  avatarSm: {
    width: 64,
    height: 64,
    borderRadius: 16,
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

  btnLight: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  bottomLeft: {
    marginTop: 16,
    display: "flex",
    justifyContent: "flex-start",
  },

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

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    background: "#fff",
    fontWeight: 800,
    marginTop: 6,
  },

  providerCard: {
    marginTop: 14,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f9fafb",
  },

  bigCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f9fafb",
    cursor: "pointer",
  },

  netflixCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 14,
    background: "#0b1220",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },

  muted: { marginTop: 6, fontWeight: 800, color: "#9ca3af" },

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
