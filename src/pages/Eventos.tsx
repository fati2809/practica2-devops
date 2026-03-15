import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Eventos.css";
import { useGoogleCalendar } from "./useGoogleCalendar";

interface Evento {
  id_event: number;
  name_event: string;
  id_building: number;
  name_building: string;
  planta_event: string;
  timedate_event: string;
  timedate_end_event: string | null;
  status_event: number;
  id_profe: number;
  id_user: number;
  capacidad_event: number;
  prioridad_event: number;
  capacidad_planta_baja: number;
  capacidad_planta_alta: number;
  google_event_id?: string | null; // ID del evento en Google Calendar (guárdalo en tu BD si quieres sync)
}

interface Edificio {
  id_building: number;
  name_building: string;
  capacidad_planta_baja: number;
  capacidad_planta_alta: number;
}

interface Profesor { id_profe: number; nombre_profe: string; }
interface Usuario  { id_user: number;  name_user: string;    }

// ── Toast de advertencia ───────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type: "displaced" | "reassigned" | "calendar_success" | "calendar_error";
  onClose: () => void;
}

function WarningToast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    displaced:        { border: "#f59e0b", iconBg: "#fef3c7", iconColor: "#f59e0b", titleColor: "#92400e", title: "⚡ Evento desplazado por prioridad" },
    reassigned:       { border: "#3b82f6", iconBg: "#eff6ff", iconColor: "#3b82f6", titleColor: "#1e40af", title: "ℹ️ Evento reasignado automáticamente" },
    calendar_success: { border: "#16a34a", iconBg: "#dcfce7", iconColor: "#16a34a", titleColor: "#14532d", title: "📅 Guardado en Google Calendar" },
    calendar_error:   { border: "#dc2626", iconBg: "#fee2e2", iconColor: "#dc2626", titleColor: "#7f1d1d", title: "❌ Error en Google Calendar" },
  }[type];

  return (
    <div style={{
      position: "fixed", bottom: "28px", right: "28px", zIndex: 2000,
      background: "#fff", borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      border: `1.5px solid ${config.border}`,
      padding: "16px 20px", maxWidth: "420px", display: "flex", gap: "12px",
      animation: "slideInToast 0.3s ease",
    }}>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
        backgroundColor: config.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {type === "displaced" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="2.5">
            <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        )}
        {type === "reassigned" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
        {type === "calendar_success" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        {type === "calendar_error" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: config.titleColor, marginBottom: "4px" }}>
          {config.title}
        </div>
        <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>{message}</div>
      </div>
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#9ca3af", padding: "0", alignSelf: "flex-start", fontSize: "18px", lineHeight: 1,
      }}>×</button>
    </div>
  );
}

// ── Botón Google Calendar ─────────────────────────────────────────────────────
function GoogleCalendarButton({
  isReady, isSignedIn, status, onSave, onSignIn, onSignOut,
}: {
  isReady: boolean;
  isSignedIn: boolean;
  status: string;
  onSave: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const loading = status === "loading";

  if (!isReady) return (
    <button disabled style={{
      display: "flex", alignItems: "center", gap: "7px",
      padding: "8px 14px", borderRadius: "8px", border: "1px solid #e5e7eb",
      background: "#f9fafb", color: "#9ca3af", fontSize: "13px", cursor: "not-allowed",
    }}>
      <GoogleCalIcon size={16} color="#9ca3af" />
      Cargando Google…
    </button>
  );

  if (!isSignedIn) return (
    <button onClick={onSignIn} style={{
      display: "flex", alignItems: "center", gap: "7px",
      padding: "8px 14px", borderRadius: "8px",
      border: "1px solid #dadce0", background: "#fff", color: "#3c4043",
      fontSize: "13px", fontWeight: 500, cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)")}
    >
      <GoogleCalIcon size={16} />
      Conectar Google Calendar
    </button>
  );

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button onClick={onSave} disabled={loading} style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "8px 14px", borderRadius: "8px",
        border: "1px solid #1a73e8", background: loading ? "#e8f0fe" : "#1a73e8",
        color: loading ? "#1a73e8" : "#fff",
        fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}>
        <GoogleCalIcon size={16} color={loading ? "#1a73e8" : "#fff"} />
        {loading ? "Guardando…" : "📅 Guardar en Calendar"}
      </button>
      <button onClick={onSignOut} title="Desconectar Google" style={{
        padding: "6px 10px", borderRadius: "8px", border: "1px solid #e5e7eb",
        background: "#fff", color: "#6b7280", fontSize: "12px", cursor: "pointer",
      }}>
        Desconectar
      </button>
    </div>
  );
}

function GoogleCalIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color || "#1a73e8"} strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={color || "#1a73e8"} strokeWidth="2" strokeLinecap="round"/>
      <line x1="8"  y1="2" x2="8"  y2="6" stroke={color || "#1a73e8"} strokeWidth="2" strokeLinecap="round"/>
      <line x1="3"  y1="10" x2="21" y2="10" stroke={color || "#1a73e8"} strokeWidth="2"/>
      <text x="12" y="19" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color || "#1a73e8"}>G</text>
    </svg>
  );
}

// ── Helpers de formato ────────────────────────────────────────────────────────
function formatFecha(raw: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw.replace(" ", "T"));
  if (isNaN(d.getTime())) return raw;
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  let hours   = d.getHours();
  const mins  = String(d.getMinutes()).padStart(2, "0");
  const ampm  = hours >= 12 ? "PM" : "AM";
  hours       = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
}

function PlantaCell({ planta, capBaja, capAlta }: { planta: string; capBaja: number; capAlta: number }) {
  const esBaja = planta === "baja";
  const cap    = esBaja ? capBaja : capAlta;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, backgroundColor: esBaja ? "#3b82f6" : "#8b5cf6" }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: esBaja ? "#1d4ed8" : "#7c3aed" }}>
          Planta {esBaja ? "baja" : "alta"}
        </span>
      </div>
      <span style={{ fontSize: "11px", color: "#6b7280", paddingLeft: "13px" }}>{cap > 0 ? `${cap} personas` : "—"}</span>
    </div>
  );
}

function FechaCell({ inicio, fin }: { inicio: string; fin: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", backgroundColor: "#3b82f6", borderRadius: "4px", padding: "1px 5px", letterSpacing: "0.3px", flexShrink: 0 }}>INICIO</span>
        <span style={{ fontSize: "13px", color: "#111827" }}>{formatFecha(inicio)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", backgroundColor: fin ? "#8b5cf6" : "#d1d5db", borderRadius: "4px", padding: "1px 5px", letterSpacing: "0.3px", flexShrink: 0 }}>FIN</span>
        <span style={{ fontSize: "13px", color: fin ? "#111827" : "#9ca3af" }}>{formatFecha(fin)}</span>
      </div>
    </div>
  );
}

function PlantaSelector({ value, onChange, edificio }: { value: string; onChange: (v: string) => void; edificio: Edificio | null }) {
  const plantas = [
    { key: "baja", label: "Planta baja", color: "#3b82f6", bg: "#eff6ff", cap: edificio?.capacidad_planta_baja ?? 0 },
    { key: "alta", label: "Planta alta", color: "#8b5cf6", bg: "#f5f3ff", cap: edificio?.capacidad_planta_alta ?? 0 },
  ];
  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {plantas.map(p => {
        const active = value === p.key;
        return (
          <button key={p.key} type="button" onClick={() => onChange(p.key)} style={{
            flex: 1, padding: "10px 8px", borderRadius: "10px", cursor: "pointer",
            border: `2px solid ${active ? p.color : "#e5e7eb"}`,
            backgroundColor: active ? p.bg : "#f9fafb",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: p.color }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: p.color }}>{p.label}</span>
            </div>
            <span style={{ fontSize: "12px", color: active ? p.color : "#9ca3af", fontWeight: active ? 700 : 400 }}>
              {edificio ? `${p.cap} personas` : "Selecciona edificio"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const PRIORIDAD: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  1: { label: "Baja",  color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  2: { label: "Media", color: "#d97706", bg: "#fef9c3", dot: "#eab308" },
  3: { label: "Alta",  color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

function SemaforoBadge({ nivel }: { nivel: number }) {
  const cfg = PRIORIDAD[nivel] ?? PRIORIDAD[1];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", backgroundColor: cfg.bg, color: cfg.color, fontSize: "12px", fontWeight: 600 }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PrioridadSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2, 3].map((n) => {
        const cfg    = PRIORIDAD[n];
        const active = String(value) === String(n);
        return (
          <button key={n} type="button" onClick={() => onChange(String(n))} style={{
            flex: 1, padding: "9px 6px", borderRadius: "8px", cursor: "pointer",
            border: `2px solid ${active ? cfg.dot : "#e5e7eb"}`,
            backgroundColor: active ? cfg.bg : "#f9fafb",
            color: cfg.color, fontWeight: 600, fontSize: "13px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: cfg.dot }} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const modalOverlay: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modalCard: React.CSSProperties = {
  background: "#fff", borderRadius: "12px", padding: "32px",
  width: "460px", display: "flex", flexDirection: "column", gap: "14px",
  maxHeight: "92vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "-6px",
};

function detectWarningType(msg: string): "displaced" | "reassigned" {
  if (msg.includes("fue reasignado automáticamente")) return "displaced";
  return "reassigned";
}

// ─────────────────────────────────────────────────────────────────────────────
function Eventos() {
  const navigate = useNavigate();

  // Google Calendar hook
  const gcal = useGoogleCalendar();

  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm]         = useState("");
  const [eventosData, setEventosData]       = useState<Evento[]>([]);
  const [edificios, setEdificios]           = useState<Edificio[]>([]);
  const [profesores, setProfesores]         = useState<Profesor[]>([]);
  const [usuarios, setUsuarios]             = useState<Usuario[]>([]);
  const [loading, setLoading]               = useState(true);
  const [modalError, setModalError]         = useState("");

  type ToastItem = { message: string; type: "displaced" | "reassigned" | "calendar_success" | "calendar_error" };
  const [toast, setToast] = useState<ToastItem | null>(null);

  const emptyAdd = {
    name_event: "", id_building: "", planta_event: "baja",
    timedate_event: "", timedate_end_event: "",
    id_profe: "", id_user: "", capacidad_event: "0", prioridad_event: "1",
  };

  const [showAddModal, setShowAddModal]   = useState(false);
  const [addForm, setAddForm]             = useState(emptyAdd);
  const [lastCreatedEvento, setLastCreatedEvento] = useState<Evento | null>(null); // para "Guardar en Calendar" post-creación

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id_event: 0, name_event: "", id_building: "", planta_event: "baja",
    timedate_event: "", timedate_end_event: "",
    id_profe: "", id_user: "", capacidad_event: "0", prioridad_event: "1",
    google_event_id: "" as string | null,
  });

  const fetchEventos   = () => fetch("http://localhost:8000/eventos").then(r => r.json()).then(d => { setEventosData(d); setLoading(false); }).catch(e => { console.error(e); setLoading(false); });
  const fetchEdificios = () => fetch("http://localhost:8000/edificios").then(r => r.json()).then(setEdificios).catch(console.error);
  const fetchProfesores= () => fetch("http://localhost:8000/profesores").then(r => r.json()).then(setProfesores).catch(console.error);
  const fetchUsuarios  = () => fetch("http://localhost:8000/usuarios").then(r => r.json()).then(setUsuarios).catch(console.error);

  useEffect(() => { fetchEventos(); fetchEdificios(); fetchProfesores(); fetchUsuarios(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("user"); localStorage.removeItem("token");
    setShowLogoutMenu(false); navigate("/", { replace: true });
  };

  const filteredEventos = eventosData.filter(e =>
    e.name_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const edificioAdd  = edificios.find(e => e.id_building === parseInt(addForm.id_building))  ?? null;
  const edificioEdit = edificios.find(e => e.id_building === parseInt(editForm.id_building)) ?? null;

  const getNombreProfesor = (id: number) => profesores.find(p => p.id_profe === id)?.nombre_profe ?? `Profesor ${id}`;
  const getNombreUsuario  = (id: number) => usuarios.find(u => u.id_user === id)?.name_user ?? `Usuario ${id}`;

  const getCapMax = (form: typeof addForm, edificio: Edificio | null) => {
    if (!edificio) return Infinity;
    return form.planta_event === "baja" ? edificio.capacidad_planta_baja : edificio.capacidad_planta_alta;
  };

  const showToast = (message: string, type: ToastItem["type"]) => {
    setToast({ message, type });
  };

  // Mostrar errores del hook de Google Calendar como toast (ej: dominio no permitido)
  useEffect(() => {
    if (gcal.errorMsg && gcal.status === "error") {
      showToast(gcal.errorMsg, "calendar_error");
    }
  }, [gcal.errorMsg, gcal.status]);

  // ── Crear evento ────────────────────────────────────────────────────────────
  const handleAddSubmit = async () => {
    setModalError("");
    const capMax = getCapMax(addForm, edificioAdd);
    const capVal = parseInt(addForm.capacidad_event) || 0;
    if (capVal > capMax) { setModalError(`La capacidad no puede superar ${capMax} personas (planta ${addForm.planta_event}).`); return; }
    if (addForm.timedate_end_event && addForm.timedate_event && addForm.timedate_end_event <= addForm.timedate_event) {
      setModalError("La fecha/hora de fin debe ser posterior a la de inicio."); return;
    }
    try {
      const res = await fetch("http://localhost:8000/eventos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: addForm.name_event, id_building: parseInt(addForm.id_building),
          planta_event: addForm.planta_event, timedate_event: addForm.timedate_event,
          timedate_end_event: addForm.timedate_end_event || null,
          id_profe: parseInt(addForm.id_profe), id_user: parseInt(addForm.id_user),
          capacidad_event: capVal, prioridad_event: parseInt(addForm.prioridad_event) || 1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        await fetchEventos();
        if (data.warning) setTimeout(() => showToast(data.warning, detectWarningType(data.warning)), 150);

        // ── Guardar automáticamente en Google Calendar si ya está conectado ──
        if (gcal.isSignedIn && addForm.timedate_event) {
          const edificioNombre = edificios.find(e => e.id_building === parseInt(addForm.id_building))?.name_building;
          const googleId = await gcal.saveEvent({
            name_event:        addForm.name_event,
            timedate_event:    addForm.timedate_event,
            timedate_end_event: addForm.timedate_end_event || null,
            name_building:     edificioNombre ?? null,
            planta_event:      addForm.planta_event,
            capacidad_event:   capVal,
          });
          if (googleId) {
            showToast(`"${addForm.name_event}" agregado a tu Google Calendar.`, "calendar_success");
          } else if (gcal.errorMsg) {
            showToast(gcal.errorMsg, "calendar_error");
          }
        }

        setAddForm(emptyAdd);
      } else {
        setModalError(data.detail || "Error al agregar evento");
      }
    } catch { setModalError("No se pudo conectar con el servidor"); }
  };

  // ── Editar evento ───────────────────────────────────────────────────────────
  const openEditModal = (ev: Evento) => {
    setModalError("");
    setEditForm({
      id_event: ev.id_event, name_event: ev.name_event,
      id_building: String(ev.id_building), planta_event: ev.planta_event ?? "baja",
      timedate_event: ev.timedate_event.replace(" ", "T").substring(0, 16),
      timedate_end_event: ev.timedate_end_event ? ev.timedate_end_event.replace(" ", "T").substring(0, 16) : "",
      id_profe: String(ev.id_profe), id_user: String(ev.id_user),
      capacidad_event: String(ev.capacidad_event ?? 0),
      prioridad_event: String(ev.prioridad_event ?? 1),
      google_event_id: ev.google_event_id ?? null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    const capMax = getCapMax(editForm, edificioEdit);
    const capVal = parseInt(editForm.capacidad_event) || 0;
    if (capVal > capMax) { setModalError(`La capacidad no puede superar ${capMax} personas (planta ${editForm.planta_event}).`); return; }
    if (editForm.timedate_end_event && editForm.timedate_event && editForm.timedate_end_event <= editForm.timedate_event) {
      setModalError("La fecha/hora de fin debe ser posterior a la de inicio."); return;
    }
    try {
      const res = await fetch(`http://localhost:8000/eventos/${editForm.id_event}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: editForm.name_event, id_building: parseInt(editForm.id_building),
          planta_event: editForm.planta_event, timedate_event: editForm.timedate_event,
          timedate_end_event: editForm.timedate_end_event || null,
          id_profe: parseInt(editForm.id_profe), id_user: parseInt(editForm.id_user),
          capacidad_event: capVal, prioridad_event: parseInt(editForm.prioridad_event) || 1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        await fetchEventos();
        if (data.warning) setTimeout(() => showToast(data.warning, detectWarningType(data.warning)), 150);

        // ── Actualizar en Google Calendar si hay google_event_id ─────────────
        if (gcal.isSignedIn && editForm.google_event_id && editForm.timedate_event) {
          const edificioNombre = edificios.find(e => e.id_building === parseInt(editForm.id_building))?.name_building;
          const ok = await gcal.updateEvent(editForm.google_event_id, {
            name_event:        editForm.name_event,
            timedate_event:    editForm.timedate_event,
            timedate_end_event: editForm.timedate_end_event || null,
            name_building:     edificioNombre ?? null,
            planta_event:      editForm.planta_event,
            capacidad_event:   capVal,
          });
          if (ok) showToast(`"${editForm.name_event}" actualizado en Google Calendar.`, "calendar_success");
          else if (gcal.errorMsg) showToast(gcal.errorMsg, "calendar_error");
        }
      } else {
        setModalError(data.detail || "Error al editar evento");
      }
    } catch { setModalError("No se pudo conectar con el servidor"); }
  };

  // ── Guardar evento existente en Calendar manualmente (botón en tabla) ──────
  const handleSaveToCalendar = async (ev: Evento) => {
    const googleId = await gcal.saveEvent({
      name_event:        ev.name_event,
      timedate_event:    ev.timedate_event,
      timedate_end_event: ev.timedate_end_event,
      name_building:     ev.name_building,
      planta_event:      ev.planta_event,
      capacidad_event:   ev.capacidad_event,
    });
    if (googleId) showToast(`"${ev.name_event}" guardado en tu Google Calendar.`, "calendar_success");
    else if (gcal.errorMsg) showToast(gcal.errorMsg, "calendar_error");
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el evento "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/eventos/${id}`, { method: "DELETE" });
      if (res.ok) fetchEventos(); else alert("Error al eliminar el evento");
    } catch { alert("No se pudo conectar con el servidor"); }
  };

  const handleToggleStatus = async (ev: Evento) => {
    try {
      const res = await fetch(`http://localhost:8000/eventos/${ev.id_event}/toggle-status`, { method: "PATCH" });
      if (res.ok) fetchEventos();
    } catch { console.error("Error cambiando estado"); }
  };

  const ModalFields = (
    form: typeof addForm | typeof editForm,
    setForm: React.Dispatch<React.SetStateAction<any>>,
    edificioActual: Edificio | null
  ) => {
    const plantaKey = (form as any).planta_event as string;
    const capMax    = edificioActual ? (plantaKey === "baja" ? edificioActual.capacidad_planta_baja : edificioActual.capacidad_planta_alta) : null;
    const capVal    = parseInt((form as any).capacidad_event) || 0;
    const overLimit = capMax !== null && capVal > capMax;

    return (
      <>
        <span style={labelStyle}>Nombre del evento</span>
        <input style={inputStyle} placeholder="Nombre del evento" value={(form as any).name_event}
          onChange={e => setForm((p: any) => ({ ...p, name_event: e.target.value }))} />

        <span style={labelStyle}>Edificio</span>
        <select style={inputStyle} value={(form as any).id_building}
          onChange={e => setForm((p: any) => ({ ...p, id_building: e.target.value, planta_event: "baja" }))}>
          <option value="">Seleccionar edificio</option>
          {edificios.map(ed => <option key={ed.id_building} value={ed.id_building}>{ed.name_building}</option>)}
        </select>

        <span style={labelStyle}>Planta</span>
        <PlantaSelector value={(form as any).planta_event} onChange={v => setForm((p: any) => ({ ...p, planta_event: v }))} edificio={edificioActual} />

        <span style={labelStyle}>Fecha y hora de inicio</span>
        <input style={inputStyle} type="datetime-local" value={(form as any).timedate_event}
          onChange={e => setForm((p: any) => ({ ...p, timedate_event: e.target.value }))} />

        <span style={labelStyle}>Fecha y hora de fin</span>
        <input
          style={{ ...inputStyle, borderColor: (form as any).timedate_end_event && (form as any).timedate_event && (form as any).timedate_end_event <= (form as any).timedate_event ? "#ef4444" : "#d1d5db" }}
          type="datetime-local" value={(form as any).timedate_end_event} min={(form as any).timedate_event}
          onChange={e => setForm((p: any) => ({ ...p, timedate_end_event: e.target.value }))}
        />
        {(form as any).timedate_end_event && (form as any).timedate_event &&
          (form as any).timedate_end_event <= (form as any).timedate_event && (
          <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>⚠️ La hora de fin debe ser posterior a la de inicio.</span>
        )}

        <span style={labelStyle}>Capacidad requerida (personas)</span>
        <input
          style={{ ...inputStyle, borderColor: overLimit ? "#ef4444" : "#d1d5db", backgroundColor: overLimit ? "#fff5f5" : undefined }}
          type="number" min="0" placeholder={capMax !== null ? `Máx. ${capMax}` : "Ej: 100"}
          value={(form as any).capacidad_event}
          onChange={e => setForm((p: any) => ({ ...p, capacidad_event: e.target.value }))}
        />
        {overLimit && (
          <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>
            ⚠️ La capacidad máxima de la planta {plantaKey} es <strong>{capMax} personas</strong>.
          </span>
        )}

        <span style={labelStyle}>Prioridad</span>
        <PrioridadSelector value={(form as any).prioridad_event} onChange={v => setForm((p: any) => ({ ...p, prioridad_event: v }))} />

        <span style={labelStyle}>Profesor</span>
        <select style={inputStyle} value={(form as any).id_profe}
          onChange={e => setForm((p: any) => ({ ...p, id_profe: e.target.value }))}>
          <option value="">Seleccionar profesor</option>
          {profesores.map(pr => <option key={pr.id_profe} value={pr.id_profe}>{pr.nombre_profe}</option>)}
        </select>

        <span style={labelStyle}>Usuario</span>
        <select style={inputStyle} value={(form as any).id_user}
          onChange={e => setForm((p: any) => ({ ...p, id_user: e.target.value }))}>
          <option value="">Seleccionar usuario</option>
          {usuarios.map(u => <option key={u.id_user} value={u.id_user}>{u.name_user}</option>)}
        </select>
      </>
    );
  };

  return (
    <div className="eventos-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/usuarios")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <span className="nav-text">Usuarios</span>
          </button>
          <button className="nav-item active" onClick={() => navigate("/eventos")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <span className="nav-text">Eventos</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/edificios")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M3 9h18"/></svg></span>
            <span className="nav-text">Edificios</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/divisiones")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M3 14h7v7H3z"/><path d="M14 14h7v7h-7z"/></svg></span>
            <span className="nav-text">Divisiones</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setShowLogoutMenu(!showLogoutMenu)}>
            <div className="user-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <span className="user-name">Admin</span>
          </div>
          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <div className="top-nav">
          <span className="top-nav-text inactive">Dashboards</span>
          <span className="top-nav-separator">/</span>
          <span className="top-nav-text active">Eventos</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">Eventos</h2>
              <button className="btn-primary" onClick={() => { setModalError(""); setShowAddModal(true); }}>Agregar</button>
            </div>
            {/* ── Botón Google Calendar en el header ── */}
            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <GoogleCalendarButton
                isReady={gcal.isReady}
                isSignedIn={gcal.isSignedIn}
                status={gcal.status}
                onSave={() => {}}         // el guardado masivo no aplica aquí; se hace por fila
                onSignIn={gcal.signIn}
                onSignOut={gcal.signOut}
              />
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" placeholder="Buscar evento por nombre" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="search-input" />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Cargando eventos...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Edificio</th>
                    <th>Planta / Capacidad</th>
                    <th>Fecha y Hora</th>
                    <th>Prioridad</th>
                    <th>Profesor</th>
                    <th>Usuario</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventos.map(ev => (
                    <tr key={ev.id_event}>
                      <td className="cell-name">{ev.name_event}</td>
                      <td>{ev.name_building ?? `Edificio ${ev.id_building}`}</td>
                      <td><PlantaCell planta={ev.planta_event ?? "baja"} capBaja={ev.capacidad_planta_baja ?? 0} capAlta={ev.capacidad_planta_alta ?? 0} /></td>
                      <td><FechaCell inicio={ev.timedate_event} fin={ev.timedate_end_event} /></td>
                      <td><SemaforoBadge nivel={ev.prioridad_event ?? 1} /></td>
                      <td>{getNombreProfesor(ev.id_profe)}</td>
                      <td>{getNombreUsuario(ev.id_user)}</td>
                      <td>
                        <span className={`status-badge ${ev.status_event === 0 ? "status-inactive" : "status-active"}`}>
                          {ev.status_event === 0 ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td className="cell-actions">
                        {/* ── Botón guardar en Google Calendar por fila ── */}
                        {gcal.isSignedIn && (
                          <button
                            className="action-btn"
                            title="Guardar en Google Calendar"
                            onClick={() => handleSaveToCalendar(ev)}
                          >
                            <GoogleCalIcon size={15} color="#1a73e8" />
                          </button>
                        )}
                        <button className="action-btn" title="Editar" onClick={() => openEditModal(ev)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className={`action-btn ${ev.status_event === 0 ? "action-btn-disabled" : ""}`} title="Toggle Status" onClick={() => handleToggleStatus(ev)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx={ev.status_event === 0 ? "8" : "16"} cy="12" r="3"/></svg>
                        </button>
                        <button className="action-btn" title="Eliminar" style={{ color: "#dc2626" }} onClick={() => handleDelete(ev.id_event, ev.name_event)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="content-footer"><p className="footer-text">© 2026</p></div>
        </div>
      </main>

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Evento</h3>
            {modalError && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>{modalError}</div>}
            {ModalFields(addForm, setAddForm, edificioAdd)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddSubmit}>
                {gcal.isSignedIn ? "Guardar y añadir a Calendar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar Evento</h3>
            {modalError && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>{modalError}</div>}
            {ModalFields(editForm, setEditForm, edificioEdit)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleEditSubmit}>
                {gcal.isSignedIn && editForm.google_event_id ? "Guardar y actualizar Calendar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <WarningToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Eventos;