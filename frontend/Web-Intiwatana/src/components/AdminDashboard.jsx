import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

const EMPTY_FORM = {
  codigo: "",
  origenId: "",
  destinoId: "",
  distanciaKm: "",
  duracionHorasEstimada: "",
  precioBase: "",
  descripcion: "",
};

export default function AdminDashboard() {
  const { session, logout } = useAuth();

  const [rutas,       setRutas]       = useState([]);
  const [sucursales,  setSucursales]  = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [modal,       setModal]       = useState(null);  // null | "crear" | ruta obj
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [confirmarId, setConfirmarId] = useState(null);
  const [buscar,      setBuscar]      = useState("");
  const [guardando,   setGuardando]   = useState(false);
  const [toast,       setToast]       = useState("");
  const [errorApi,    setErrorApi]    = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`,
  };

  // ── Cargar rutas y sucursales al montar ──
  useEffect(() => {
    Promise.all([
      fetch("/api/v1/rutas",      { headers }).then((r) => r.json()),
      fetch("/api/v1/sucursales", { headers }).then((r) => r.json()),
    ])
      .then(([rutasData, sucursalesData]) => {
        setRutas(Array.isArray(rutasData) ? rutasData : []);
        setSucursales(Array.isArray(sucursalesData) ? sucursalesData : []);
      })
      .catch(() => setErrorApi("No se pudo conectar con el servidor"))
      .finally(() => setCargando(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const abrirCrear = () => { setForm(EMPTY_FORM); setModal("crear"); };

  const abrirEditar = (ruta) => {
    setForm({
      id:                    ruta.id,
      codigo:                ruta.codigo        || "",
      origenId:              ruta.origen?.id    || "",
      destinoId:             ruta.destino?.id   || "",
      distanciaKm:           ruta.distanciaKm   || "",
      duracionHorasEstimada: ruta.duracionHorasEstimada || "",
      precioBase:            ruta.precioBase    || "",
      descripcion:           ruta.descripcion   || "",
    });
    setModal(ruta);
  };

  const cerrarModal = () => { setModal(null); setForm(EMPTY_FORM); };

  const handleForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── Guardar (crear o editar) ──
  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const esEditar = modal !== "crear";
    const url    = esEditar ? `/api/v1/rutas/${form.id}` : "/api/v1/rutas";
    const method = esEditar ? "PUT" : "POST";

    const body = {
      codigo:                form.codigo,
      origenId:              Number(form.origenId),
      destinoId:             Number(form.destinoId),
      distanciaKm:           form.distanciaKm           ? Number(form.distanciaKm)           : null,
      duracionHorasEstimada: form.duracionHorasEstimada ? Number(form.duracionHorasEstimada) : null,
      precioBase:            form.precioBase             ? Number(form.precioBase)             : null,
      descripcion:           form.descripcion || null,
    };

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al guardar");
      }
      const saved = await res.json();
      setRutas((prev) =>
        esEditar ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved]
      );
      showToast(esEditar ? "Ruta actualizada ✓" : "Ruta creada ✓");
      cerrarModal();
    } catch (err) {
      showToast("Error: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar ──
  const eliminar = async (id) => {
    try {
      const res = await fetch(`/api/v1/rutas/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error();
    } catch {
      showToast("Error al eliminar");
      setConfirmarId(null);
      return;
    }
    setRutas((prev) => prev.filter((r) => r.id !== id));
    setConfirmarId(null);
    showToast("Ruta eliminada");
  };

  const rutasFiltradas = rutas.filter((r) =>
    r.codigo?.toLowerCase().includes(buscar.toLowerCase()) ||
    r.origen?.ciudad?.toLowerCase().includes(buscar.toLowerCase()) ||
    r.destino?.ciudad?.toLowerCase().includes(buscar.toLowerCase())
  );

  // ── Helper nombre sucursal ──
  const nomSucursal = (s) => s ? `${s.nombre} — ${s.ciudad}` : "—";

  return (
    <div className="admin-wrap">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <LogoSVG width={44} height={44} />
          <div>
            <div className="sidebar-brand">INTIWATANA</div>
            <div className="sidebar-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-item active">🗺 Rutas</div>
          <div className="sidebar-item disabled">🚌 Buses</div>
          <div className="sidebar-item disabled">📅 Viajes</div>
          <div className="sidebar-item disabled">👥 Usuarios</div>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{session.username[0].toUpperCase()}</div>
          <div>
            <div className="sidebar-uname">{session.username}</div>
            <div className="sidebar-role">Administrador</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Cerrar sesión">⏻</button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Gestión de Rutas</h1>
            <p className="admin-page-sub">{rutas.length} rutas registradas</p>
          </div>
          <button className="btn-nuevo" onClick={abrirCrear}>+ Nueva ruta</button>
        </div>

        {errorApi && <div className="lf-error" style={{ marginBottom: "1rem" }}>⚠ {errorApi}</div>}

        <div className="admin-search-row">
          <input
            className="admin-search"
            placeholder="Buscar por código, origen o destino..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>

        {/* Tabla */}
        <div className="admin-table-wrap">
          {cargando ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--gris-verde)" }}>Cargando rutas...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Distancia</th>
                  <th>Duración (h)</th>
                  <th>Precio base</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutasFiltradas.length === 0 && (
                  <tr><td colSpan={7} className="td-empty">No se encontraron rutas</td></tr>
                )}
                {rutasFiltradas.map((r) => (
                  <tr key={r.id}>
                    <td><span className="td-codigo">{r.codigo}</span></td>
                    <td>
                      <div className="td-lugar">
                        <span className="td-ciudad">{r.origen?.ciudad || "—"}</span>
                        <span className="td-dep">{r.origen?.departamento}</span>
                      </div>
                    </td>
                    <td>
                      <div className="td-lugar">
                        <span className="td-ciudad">{r.destino?.ciudad || "—"}</span>
                        <span className="td-dep">{r.destino?.departamento}</span>
                      </div>
                    </td>
                    <td>{r.distanciaKm ? `${r.distanciaKm} km` : "—"}</td>
                    <td>{r.duracionHorasEstimada ? `${r.duracionHorasEstimada} h` : "—"}</td>
                    <td>{r.precioBase ? `S/ ${r.precioBase}` : "—"}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-edit"   onClick={() => abrirEditar(r)}>Editar</button>
                        <button className="btn-delete" onClick={() => setConfirmarId(r.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Modal Crear / Editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-badge">🗺</div>
              <div>
                <div className="modal-title">
                  {modal === "crear" ? "Nueva ruta" : `Editar: ${modal.codigo}`}
                </div>
                <div className="modal-subtitle">Completa los datos de la ruta</div>
              </div>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={guardar}>
                <div className="form-grid">
                  <div className="lf-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Código único *</label>
                    <input
                      name="codigo" value={form.codigo} onChange={handleForm}
                      placeholder="Ej: AYA-LIM-01" required
                    />
                  </div>
                  <div className="lf-field">
                    <label>Sucursal origen *</label>
                    <select name="origenId" value={form.origenId} onChange={handleForm} required className="lf-select">
                      <option value="">Seleccionar...</option>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lf-field">
                    <label>Sucursal destino *</label>
                    <select name="destinoId" value={form.destinoId} onChange={handleForm} required className="lf-select">
                      <option value="">Seleccionar...</option>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lf-field">
                    <label>Distancia (km)</label>
                    <input
                      name="distanciaKm" type="number" step="0.01" min="0"
                      value={form.distanciaKm} onChange={handleForm} placeholder="Ej: 560"
                    />
                  </div>
                  <div className="lf-field">
                    <label>Duración estimada (horas)</label>
                    <input
                      name="duracionHorasEstimada" type="number" step="0.1" min="0"
                      value={form.duracionHorasEstimada} onChange={handleForm} placeholder="Ej: 10.5"
                    />
                  </div>
                  <div className="lf-field">
                    <label>Precio base (S/)</label>
                    <input
                      name="precioBase" type="number" step="0.01" min="0"
                      value={form.precioBase} onChange={handleForm} placeholder="Ej: 55.00"
                    />
                  </div>
                  <div className="lf-field">
                    <label>Descripción</label>
                    <input
                      name="descripcion" value={form.descripcion} onChange={handleForm}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: "1.2rem" }}>
                  <button type="button" className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="btn-reservar" disabled={guardando}>
                    {guardando ? "Guardando..." : modal === "crear" ? "Crear ruta" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminar ── */}
      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 40, marginBottom: "1rem" }}>🗑️</div>
              <h3 style={{ marginBottom: ".5rem", fontFamily: "'Playfair Display', serif" }}>¿Eliminar ruta?</h3>
              <p style={{ color: "var(--gris-verde)", fontSize: 14, marginBottom: "1.5rem" }}>
                Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn-cancelar" onClick={() => setConfirmarId(null)}>Cancelar</button>
                <button className="btn-delete-confirm" onClick={() => eliminar(confirmarId)}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}
