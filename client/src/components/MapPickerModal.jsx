import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

export default function MapPickerModal({
  open,
  onClose,
  center = { lat: 13.0827, lng: 80.2707 },
  value, // {lat, lng} or null
  onChange, // (latlng) => void
}) {
  const pos = useMemo(() => {
    if (value?.lat && value?.lng) return [Number(value.lat), Number(value.lng)];
    return [Number(center.lat), Number(center.lng)];
  }, [center, value]);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Pick your location</div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.mapWrap}>
          <MapContainer
            center={pos}
            zoom={15}
            style={{ height: "100%", width: "100%", borderRadius: 14 }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickPicker onPick={onChange} />
            <Marker position={pos} />
          </MapContainer>
        </div>

        <div style={styles.footer}>
          <div style={styles.coords}>
            Lat: <b>{pos[0].toFixed(6)}</b> &nbsp; Lng: <b>{pos[1].toFixed(6)}</b>
          </div>
          <button type="button" onClick={onClose} style={styles.okBtn}>
            Use this location
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    width: "min(780px, 100%)",
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(229,231,235,0.9)",
    borderRadius: 18,
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
    backdropFilter: "blur(14px)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.8)",
  },
  title: { fontWeight: 900, color: "#1f2937" },
  closeBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },
  mapWrap: {
    height: 420, // ✅ important: without height map won't show
    padding: 14,
    background: "rgba(255,255,255,0.55)",
  },
  footer: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderTop: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.8)",
  },
  coords: { color: "#374151", fontSize: 14 },
  okBtn: {
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },
};
