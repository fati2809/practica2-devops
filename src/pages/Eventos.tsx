import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Eventos.css";

interface Evento {
  id_event: number;
  name_event: string;
  id_building: number;
  timedate_event: string;
  status_event: number;
  id_profe: number;
  id_user: number;
}

interface Edificio {
  id_building: number;
  name_building: string;
}

interface Profesor {
  id_profe: number;
  nombre_profe: string;
}

interface Usuario {
  id_user: number;
  name_user: string;
}

function Eventos() {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventosData, setEventosData] = useState<Evento[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name_event: "",
    id_building: "",
    timedate_event: "",
    id_profe: "",
    id_user: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id_event: 0,
    name_event: "",
    id_building: "",
    timedate_event: "",
    id_profe: "",
    id_user: "",
  });

  const [modalError, setModalError] = useState("");

  const fetchEventos = () => {
    fetch("http://localhost:8000/eventos")
      .then((res) => res.json())
      .then((data) => { setEventosData(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  };

  const fetchEdificios = () => {
    fetch("http://localhost:8000/edificios")
      .then((res) => res.json())
      .then((data) => setEdificios(data))
      .catch((err) => console.error(err));
  };

  const fetchProfesores = () => {
    fetch("http://localhost:8000/profesores")
      .then((res) => res.json())
      .then((data) => setProfesores(data))
      .catch((err) => console.error(err));
  };

  const fetchUsuarios = () => {
    fetch("http://localhost:8000/usuarios")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchEventos();
    fetchEdificios();
    fetchProfesores();
    fetchUsuarios();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutMenu(false);
    navigate("/", { replace: true });
  };

  const filteredEventos = eventosData.filter((e) =>
    e.name_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNombreEdificio = (id: number) =>
    edificios.find((e) => e.id_building === id)?.name_building ?? `Edificio ${id}`;

  const getNombreProfesor = (id: number) =>
    profesores.find((p) => p.id_profe === id)?.nombre_profe ?? `Profesor ${id}`;

  const getNombreUsuario = (id: number) =>
    usuarios.find((u) => u.id_user === id)?.name_user ?? `Usuario ${id}`;

  const handleAddSubmit = async () => {
    setModalError("");
    try {
      const res = await fetch("http://localhost:8000/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: addForm.name_event,
          id_building: parseInt(addForm.id_building),
          timedate_event: addForm.timedate_event,
          id_profe: parseInt(addForm.id_profe),
          id_user: parseInt(addForm.id_user),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ name_event: "", id_building: "", timedate_event: "", id_profe: "", id_user: "" });
        fetchEventos();
      } else {
        setModalError(data.detail || "Error al agregar evento");
      }
    } catch {
      setModalError("No se pudo conectar con el servidor");
    }
  };

  const openEditModal = (evento: Evento) => {
    setModalError("");
    setEditForm({
      id_event: evento.id_event,
      name_event: evento.name_event,
      id_building: String(evento.id_building),
      timedate_event: evento.timedate_event.replace(" ", "T").substring(0, 16),
      id_profe: String(evento.id_profe),
      id_user: String(evento.id_user),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    try {
      const res = await fetch(`http://localhost:8000/eventos/${editForm.id_event}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: editForm.name_event,
          id_building: parseInt(editForm.id_building),
          timedate_event: editForm.timedate_event,
          id_profe: parseInt(editForm.id_profe),
          id_user: parseInt(editForm.id_user),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchEventos();
      } else {
        setModalError(data.detail || "Error al editar evento");
      }
    } catch {
      setModalError("No se pudo conectar con el servidor");
    }
  };

  const handleDelete = async (id_event: number, name_event: string) => {
    if (!window.confirm(`¿Eliminar el evento "${name_event}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/eventos/${id_event}`, { method: "DELETE" });
      if (res.ok) fetchEventos();
      else alert("Error al eliminar el evento");
    } catch {
      alert("No se pudo conectar con el servidor");
    }
  };

  const handleToggleStatus = async (evento: Evento) => {
    try {
      const res = await fetch(`http://localhost:8000/eventos/${evento.id_event}/toggle-status`, { method: "PATCH" });
      if (res.ok) fetchEventos();
    } catch {
      console.error("Error cambiando estado");
    }
  };

  const modalStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 1000,
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: "12px", padding: "32px",
    width: "420px", display: "flex", flexDirection: "column", gap: "16px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle };

  return (
    <div className="eventos-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/usuarios")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span className="nav-text">Usuarios</span>
          </button>

          <button className="nav-item active" onClick={() => navigate("/eventos")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span className="nav-text">Eventos</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setShowLogoutMenu(!showLogoutMenu)}>
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="user-name">Admin</span>
          </div>
          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
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
              <button className="btn-primary" onClick={() => { setModalError(""); setShowAddModal(true); }}>
                Agregar
              </button>
            </div>
            <div className="header-right">
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar evento por nombre"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
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
                    <th>Fecha y Hora</th>
                    <th>Profesor</th>
                    <th>Usuario</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventos.map((evento) => (
                    <tr key={evento.id_event}>
                      <td className="cell-name">{evento.name_event}</td>
                      <td>{getNombreEdificio(evento.id_building)}</td>
                      <td>{evento.timedate_event}</td>
                      <td>{getNombreProfesor(evento.id_profe)}</td>
                      <td>{getNombreUsuario(evento.id_user)}</td>
                      <td>
                        <span className={`status-badge ${evento.status_event === 0 ? "status-inactive" : "status-active"}`}>
                          {evento.status_event === 0 ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <button className="action-btn" title="Editar" onClick={() => openEditModal(evento)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className={`action-btn ${evento.status_event === 0 ? "action-btn-disabled" : ""}`}
                          title="Toggle Status"
                          onClick={() => handleToggleStatus(evento)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
                            <circle cx={evento.status_event === 0 ? "8" : "16"} cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="action-btn" title="Eliminar"
                          style={{ color: "#dc2626" }}
                          onClick={() => handleDelete(evento.id_event, evento.name_event)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="content-footer">
            <p className="footer-text">© 2026</p>
          </div>
        </div>
      </main>

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <div style={modalStyle} onClick={() => setShowAddModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Evento</h3>

            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <input style={inputStyle} placeholder="Nombre del evento" value={addForm.name_event}
              onChange={(e) => setAddForm(p => ({ ...p, name_event: e.target.value }))} />

            <select style={selectStyle} value={addForm.id_building}
              onChange={(e) => setAddForm(p => ({ ...p, id_building: e.target.value }))}>
              <option value="">Seleccionar edificio</option>
              {edificios.map((ed) => (
                <option key={ed.id_building} value={ed.id_building}>{ed.name_building}</option>
              ))}
            </select>

            <input style={inputStyle} type="datetime-local" value={addForm.timedate_event}
              onChange={(e) => setAddForm(p => ({ ...p, timedate_event: e.target.value }))} />

            <select style={selectStyle} value={addForm.id_profe}
              onChange={(e) => setAddForm(p => ({ ...p, id_profe: e.target.value }))}>
              <option value="">Seleccionar profesor</option>
              {profesores.map((pr) => (
                <option key={pr.id_profe} value={pr.id_profe}>{pr.nombre_profe}</option>
              ))}
            </select>

            <select style={selectStyle} value={addForm.id_user}
              onChange={(e) => setAddForm(p => ({ ...p, id_user: e.target.value }))}>
              <option value="">Seleccionar usuario</option>
              {usuarios.map((u) => (
                <option key={u.id_user} value={u.id_user}>{u.name_user}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-filter" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div style={modalStyle} onClick={() => setShowEditModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar Evento</h3>

            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <input style={inputStyle} placeholder="Nombre del evento" value={editForm.name_event}
              onChange={(e) => setEditForm(p => ({ ...p, name_event: e.target.value }))} />

            <select style={selectStyle} value={editForm.id_building}
              onChange={(e) => setEditForm(p => ({ ...p, id_building: e.target.value }))}>
              <option value="">Seleccionar edificio</option>
              {edificios.map((ed) => (
                <option key={ed.id_building} value={ed.id_building}>{ed.name_building}</option>
              ))}
            </select>

            <input style={inputStyle} type="datetime-local" value={editForm.timedate_event}
              onChange={(e) => setEditForm(p => ({ ...p, timedate_event: e.target.value }))} />

            <select style={selectStyle} value={editForm.id_profe}
              onChange={(e) => setEditForm(p => ({ ...p, id_profe: e.target.value }))}>
              <option value="">Seleccionar profesor</option>
              {profesores.map((pr) => (
                <option key={pr.id_profe} value={pr.id_profe}>{pr.nombre_profe}</option>
              ))}
            </select>

            <select style={selectStyle} value={editForm.id_user}
              onChange={(e) => setEditForm(p => ({ ...p, id_user: e.target.value }))}>
              <option value="">Seleccionar usuario</option>
              {usuarios.map((u) => (
                <option key={u.id_user} value={u.id_user}>{u.name_user}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-filter" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleEditSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Eventos;