import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue in many bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickPicker({ value, onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng, label: "" });
    },
  });
  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

async function reverseGeocode(lat, lng) {
  // Free OpenStreetMap Nominatim reverse geocode
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: {
      // Some browsers block without UA - still works usually, but keep minimal
      "Accept": "application/json",
    },
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data?.display_name || "";
}

export default function LocationPickerModal({ open, initialValue, onClose, onSave }) {
  const [val, setVal] = useState(initialValue || null);
  const [loading, setLoading] = useState(false);

  const center = useMemo(() => {
    if (val) return [val.lat, val.lng];
    return [13.0827, 80.2707]; // default Chennai
  }, [val]);

  useEffect(() => {
    if (open) setVal(initialValue || null);
  }, [open, initialValue]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = await reverseGeocode(lat, lng).catch(() => "");
        setVal({ lat, lng, label: label || "" });
        setLoading(false);
      },
      () => {
        setLoading(false);
        alert("Location permission denied / error");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const confirmSave = async () => {
    if (!val) return alert("Pick a location on map!");
    setLoading(true);
    let label = val.label;
    if (!label) {
      label = await reverseGeocode(val.lat, val.lng).catch(() => "");
    }
    setLoading(false);
    onSave({ ...val, label: label || "" });
  };

  if (!open) return null;

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.top}>
          <div style={s.title}>Choose Location</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.actions}>
          <button style={s.btn} onClick={useMyLocation} disabled={loading}>
            {loading ? "Getting..." : "Use my current location"}
          </button>
          <div style={s.hint}>Map la click pannina pin automatic marker varum ✅</div>
        </div>

        <div style={s.mapWrap}>
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickPicker value={val} onPick={setVal} />
            {val ? <Marker position={[val.lat, val.lng]} /> : null}
          </MapContainer>
        </div>

        <div style={s.footer}>
          <div style={s.preview}>
            Selected:{" "}
            <b>{val?.label?.trim() ? val.label : val ? `${val.lat.toFixed(5)}, ${val.lng.toFixed(5)}` : "null"}</b>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={s.btnGhost} onClick={onClose}>Cancel</button>
            <button style={s.btnPrimary} onClick={confirmSave} disabled={loading}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    zIndex: 9999,
  },
  modal: {
    width: "min(900px, 96vw)",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
  },
  top: {
    padding: 14,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
  },
  title: { fontWeight: 900, fontSize: 16, color: "#111827" },
  closeBtn: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "6px 10px", cursor: "pointer" },
  actions: { padding: 14, display: "grid", gap: 8 },
  hint: { fontSize: 13, fontWeight: 700, color: "#6b7280" },
  btn: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
  mapWrap: { height: 420, borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" },
  footer: { padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  preview: { fontSize: 13, fontWeight: 700, color: "#374151" },
  btnGhost: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
  btnPrimary: { border: "1px solid #111827", background: "#111827", color: "#fff", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
};
