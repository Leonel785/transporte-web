import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function EstadoBadge({ valor, mapa }) {
  const cfg = (mapa && mapa[valor]) || { label: valor || "—", cls: "badge-pendiente", icon: "•" };
  return <span className={`estado-badge ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>;
}

const ESTADO_VIAJE = {
  PROGRAMADO: { label: "Programado", cls: "badge-pendiente",  icon: "📅" },
  EN_CURSO:   { label: "En curso",   cls: "badge-transito",   icon: "🚌" },
  FINALIZADO: { label: "Finalizado", cls: "badge-entregado",  icon: "✅" },
  CANCELADO:  { label: "Cancelado",  cls: "badge-cancelado",  icon: "❌" },
};

const ESTADO_BOLETO = {
  ACTIVO:      { label: "Activo",      cls: "badge-confirmado", icon: "🎫" },
  USADO:       { label: "Usado",       cls: "badge-entregado",  icon: "✅" },
  CANCELADO:   { label: "Cancelado",   cls: "badge-cancelado",  icon: "❌" },
  REEMBOLSADO: { label: "Reembolsado", cls: "badge-devuelto",   icon: "↩️" },
};

// ─── Hook fetch autenticado ───────────────────────────────────────────────────
function useApi(token) {
  return useCallback(async (method, path, body = null) => {
    const res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || err.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }, [token]);
}

// ─── Toasts ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, tipo = "ok") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, tipo }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.tipo === "ok" ? "#2D6A4F" : "#dc2626",
          color: "#fff", padding: "12px 18px", borderRadius: 10,
          fontSize: 14, fontWeight: 500, minWidth: 260,
          boxShadow: "0 4px 20px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "slideInRight .3s ease",
        }}>
          {t.tipo === "ok" ? "✅" : "❌"} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ titulo, onClose, onSave, guardando, children }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge">📝</div>
          <div><div className="modal-title">{titulo}</div></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(138,166,163,.15)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ background: "rgba(138,166,163,.12)", border: "none", color: "var(--verde-medio)", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={guardando} className="btn-reservar" style={{ marginTop: 0, padding: "9px 24px", opacity: guardando ? 0.6 : 1 }}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────
const S = {
  th:   { background: "rgba(7,32,30,.85)", color: "rgba(250,250,248,.8)", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "10px 14px", textAlign: "left", whiteSpace: "nowrap" },
  td:   { padding: "11px 14px", borderBottom: "1px solid rgba(138,166,163,.1)", verticalAlign: "middle" },
  btnE: { background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.3)", color: "#3b82f6", padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnD: { background: "rgba(220,38,38,.1)",  border: "1px solid rgba(220,38,38,.3)",  color: "#dc2626", padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  inp:  { width: "100%", background: "rgba(138,166,163,.1)", border: "1.5px solid rgba(138,166,163,.25)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "var(--blanco)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  lbl:  { display: "block", fontSize: 11, fontWeight: 700, color: "var(--verde-medio)", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 5 },
  fld:  { marginBottom: "1rem" },
  g2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  card: { background: "rgba(7,32,30,.6)", border: "1px solid rgba(138,166,163,.15)", borderRadius: 12, overflow: "hidden" },
  top:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" },
  btnN: { background: "var(--amarillo)", border: "none", color: "#07201E", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 },
  srch: { background: "rgba(138,166,163,.1)", border: "1.5px solid rgba(138,166,163,.2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--blanco)", fontFamily: "inherit", outline: "none", width: "100%", maxWidth: 320 },
  pg:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", borderTop: "1px solid rgba(138,166,163,.12)", fontSize: 12, color: "var(--verde-medio)", flexWrap: "wrap", gap: "0.5rem" },
  pgB:  { background: "rgba(138,166,163,.12)", border: "1px solid rgba(138,166,163,.2)", color: "var(--verde-medio)", width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
  pgA:  { background: "var(--amarillo)", border: "1px solid var(--amarillo)", color: "#07201E", fontWeight: 700, width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
};

// ─── Tabla reutilizable ───────────────────────────────────────────────────────
function Tabla({ cols, rows, cargando, error, onRecargar, renderFila, pagSize = 12 }) {
  const [pag, setPag] = useState(0);
  useEffect(() => setPag(0), [rows]);
  const total = Math.ceil(rows.length / pagSize);
  const slice = rows.slice(pag * pagSize, (pag + 1) * pagSize);

  if (cargando) return <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--verde-medio)" }}>⏳ Cargando...</div>;
  if (error)    return (
    <div style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.25)", borderRadius: 10, padding: "1rem 1.25rem", color: "#fca5a5", fontSize: 13, margin: "1rem" }}>
      ⚠️ {error} {onRecargar && <button onClick={onRecargar} style={{ ...S.btnN, marginLeft: "1rem", padding: "5px 14px" }}>↺ Reintentar</button>}
    </div>
  );
  if (!rows.length) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--verde-medio)", fontSize: 14 }}>📭 Sin registros aún.</div>;

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{cols.map(c => <th key={c} style={S.th}>{c}</th>)}</tr></thead>
          <tbody>{slice.map((r, i) => renderFila(r, i))}</tbody>
        </table>
      </div>
      {total > 1 && (
        <div style={S.pg}>
          <span>Mostrando {pag * pagSize + 1}–{Math.min((pag + 1) * pagSize, rows.length)} de {rows.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button style={S.pgB} disabled={pag === 0} onClick={() => setPag(p => p - 1)}>‹</button>
            {Array.from({ length: total }, (_, i) => (
              <button key={i} style={i === pag ? S.pgA : S.pgB} onClick={() => setPag(i)}>{i + 1}</button>
            ))}
            <button style={S.pgB} disabled={pag >= total - 1} onClick={() => setPag(p => p + 1)}>›</button>
          </div>
        </div>
      )}
    </>
  );
}

const tr = (onE, onL) => ({ onMouseEnter: e => { e.currentTarget.style.background = "rgba(18,115,105,.08)"; onE && onE(e); }, onMouseLeave: e => { e.currentTarget.style.background = ""; onL && onL(e); } });

// ══════════════════════════════════════════════════════════════
// RUTAS — GET /api/v1/rutas
// ══════════════════════════════════════════════════════════════
function PanelRutas({ api, toast, sucursales }) {
  const [data, setData]       = useState([]);
  const [load, setLoad]       = useState(true);
  const [err,  setErr]        = useState("");
  const [q,    setQ]          = useState("");
  const [modal, setModal]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  const fetch_ = useCallback(async () => {
    setLoad(true); setErr("");
    try { const d = await api("GET", "/api/v1/rutas"); setData(Array.isArray(d) ? d : []); }
    catch (e) { setErr(e.message); } finally { setLoad(false); }
  }, [api]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const filtradas = data.filter(r => {
    const s = q.toLowerCase();
    return (r.codigo || "").toLowerCase().includes(s) ||
           (r.origen?.ciudad || "").toLowerCase().includes(s) ||
           (r.destino?.ciudad || "").toLowerCase().includes(s);
  });

  const fld = k => ({ value: form[k] ?? "", onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), style: S.inp });

  const guardar = async () => {
    setSaving(true);
    try {
      const body = {
        codigo: form.codigo, origenId: Number(form.origenId), destinoId: Number(form.destinoId),
        distanciaKm: form.distanciaKm ? Number(form.distanciaKm) : null,
        duracionHorasEstimada: form.duracion ? Number(form.duracion) : null,
        precioBase: form.precio ? Number(form.precio) : null,
        descripcion: form.descripcion || null,
      };
      modal === "nuevo"
        ? (await api("POST", "/api/v1/rutas", body), toast("Ruta creada ✓"))
        : (await api("PUT", `/api/v1/rutas/${modal.id}`, body), toast("Ruta actualizada ✓"));
      setModal(null); fetch_();
    } catch (e) { toast(e.message, "err"); } finally { setSaving(false); }
  };

  const del = async r => {
    if (!confirm(`¿Eliminar ruta ${r.codigo}?`)) return;
    try { await api("DELETE", `/api/v1/rutas/${r.id}`); toast("Eliminada"); fetch_(); }
    catch (e) { toast(e.message, "err"); }
  };

  return (
    <>
      <div style={S.top}>
        <div><h1 className="admin-page-title">Rutas</h1><p className="admin-page-sub">{data.length} rutas activas</p></div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input style={S.srch} placeholder="🔍 Código o ciudad..." value={q} onChange={e => setQ(e.target.value)} />
          <button style={S.btnN} onClick={() => { setForm({ codigo: "", origenId: "", destinoId: "", distanciaKm: "", duracion: "", precio: "", descripcion: "" }); setModal("nuevo"); }}>+ Nueva ruta</button>
        </div>
      </div>
      <div style={S.card}>
        <Tabla cols={["#", "Código", "Origen", "Destino", "Km", "Horas", "Precio base", "Acciones"]}
          rows={filtradas} cargando={load} error={err} onRecargar={fetch_}
          renderFila={r => (
            <tr key={r.id} {...tr()}>
              <td style={S.td}>{r.id}</td>
              <td style={S.td}><strong>{r.codigo}</strong></td>
              <td style={S.td}>{r.origen?.ciudad || "—"}<br /><small style={{ color: "var(--verde-medio)" }}>{r.origen?.nombre}</small></td>
              <td style={S.td}>{r.destino?.ciudad || "—"}<br /><small style={{ color: "var(--verde-medio)" }}>{r.destino?.nombre}</small></td>
              <td style={S.td}>{r.distanciaKm ?? "—"}</td>
              <td style={S.td}>{r.duracionHorasEstimada ?? "—"}</td>
              <td style={S.td}><strong style={{ color: "var(--amarillo)" }}>S/ {r.precioBase ?? "—"}</strong></td>
              <td style={S.td}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={S.btnE} onClick={() => { setForm({ codigo: r.codigo, origenId: r.origen?.id || "", destinoId: r.destino?.id || "", distanciaKm: r.distanciaKm || "", duracion: r.duracionHorasEstimada || "", precio: r.precioBase || "", descripcion: r.descripcion || "" }); setModal(r); }}>✏️ Editar</button>
                  <button style={S.btnD} onClick={() => del(r)}>🗑</button>
                </div>
              </td>
            </tr>
          )} />
      </div>
      {modal && (
        <Modal titulo={modal === "nuevo" ? "Nueva ruta" : `Editar ${modal.codigo}`} onClose={() => setModal(null)} onSave={guardar} guardando={saving}>
          <div style={S.g2}>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Código *</label><input {...fld("codigo")} placeholder="Ej: AYA-VIL-01" /></div>
            <div style={S.fld}><label style={S.lbl}>Sucursal origen *</label>
              <select {...fld("origenId")} style={S.inp}>
                <option value="">Seleccionar...</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>)}
              </select>
            </div>
            <div style={S.fld}><label style={S.lbl}>Sucursal destino *</label>
              <select {...fld("destinoId")} style={S.inp}>
                <option value="">Seleccionar...</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>)}
              </select>
            </div>
            <div style={S.fld}><label style={S.lbl}>Distancia (km)</label><input {...fld("distanciaKm")} type="number" /></div>
            <div style={S.fld}><label style={S.lbl}>Duración estimada (h)</label><input {...fld("duracion")} type="number" step="0.5" /></div>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Precio base (S/)</label><input {...fld("precio")} type="number" step="0.50" /></div>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Descripción</label><input {...fld("descripcion")} /></div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// BUSES — GET /api/v1/buses
// ══════════════════════════════════════════════════════════════
function PanelBuses({ api, toast }) {
  const [data, setData]     = useState([]);
  const [load, setLoad]     = useState(true);
  const [err,  setErr]      = useState("");
  const [q,    setQ]        = useState("");
  const [modal, setModal]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({});

  const TIPOS = ["MINIBUS", "BUS_SIMPLE", "BUS_DOBLE_PISO", "VAN"];

  const fetch_ = useCallback(async () => {
    setLoad(true); setErr("");
    try { const d = await api("GET", "/api/v1/buses"); setData(Array.isArray(d) ? d : []); }
    catch (e) { setErr(e.message); } finally { setLoad(false); }
  }, [api]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const filtrados = data.filter(b => {
    const s = q.toLowerCase();
    return (b.placa || "").toLowerCase().includes(s) || (b.marca || "").toLowerCase().includes(s);
  });

  const fld = k => ({ value: form[k] ?? "", onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), style: S.inp });

  const guardar = async () => {
    setSaving(true);
    try {
      const body = {
        placa: form.placa, marca: form.marca, modelo: form.modelo,
        anioFabricacion: form.anio ? Number(form.anio) : null,
        capacidadAsientos: form.cap ? Number(form.cap) : null,
        numPisos: Number(form.pisos) || 1,
        tipo: form.tipo, observaciones: form.obs || null,
      };
      modal === "nuevo"
        ? (await api("POST", "/api/v1/buses", body), toast("Bus registrado ✓"))
        : (await api("PUT", `/api/v1/buses/${modal.id}`, body), toast("Bus actualizado ✓"));
      setModal(null); fetch_();
    } catch (e) { toast(e.message, "err"); } finally { setSaving(false); }
  };

  const del = async b => {
    if (!confirm(`¿Dar de baja bus ${b.placa}?`)) return;
    try { await api("DELETE", `/api/v1/buses/${b.id}`); toast("Bus eliminado"); fetch_(); }
    catch (e) { toast(e.message, "err"); }
  };

  const nuevo = () => { setForm({ placa: "", marca: "", modelo: "", anio: "", cap: "", pisos: 1, tipo: "BUS_SIMPLE", obs: "" }); setModal("nuevo"); };
  const editar = b => { setForm({ placa: b.placa, marca: b.marca || "", modelo: b.modelo || "", anio: b.anioFabricacion || "", cap: b.capacidadAsientos || "", pisos: b.numPisos || 1, tipo: b.tipo || "BUS_SIMPLE", obs: b.observaciones || "" }); setModal(b); };

  return (
    <>
      <div style={S.top}>
        <div><h1 className="admin-page-title">Buses</h1><p className="admin-page-sub">{data.length} vehículos en flota</p></div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input style={S.srch} placeholder="🔍 Placa o marca..." value={q} onChange={e => setQ(e.target.value)} />
          <button style={S.btnN} onClick={nuevo}>+ Nuevo bus</button>
        </div>
      </div>
      <div style={S.card}>
        <Tabla cols={["#", "Placa", "Marca / Modelo", "Año", "Asientos", "Pisos", "Tipo", "Acciones"]}
          rows={filtrados} cargando={load} error={err} onRecargar={fetch_}
          renderFila={b => (
            <tr key={b.id} {...tr()}>
              <td style={S.td}>{b.id}</td>
              <td style={S.td}><strong style={{ fontFamily: "monospace", letterSpacing: 1 }}>{b.placa}</strong></td>
              <td style={S.td}>{b.marca} {b.modelo}</td>
              <td style={S.td}>{b.anioFabricacion || "—"}</td>
              <td style={S.td}>{b.capacidadAsientos ?? "—"}</td>
              <td style={S.td}>{b.numPisos || 1}</td>
              <td style={S.td}><span style={{ fontSize: 11, background: "rgba(232,160,32,.15)", color: "#b8860b", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>{b.tipo || "—"}</span></td>
              <td style={S.td}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={S.btnE} onClick={() => editar(b)}>✏️ Editar</button>
                  <button style={S.btnD} onClick={() => del(b)}>🗑</button>
                </div>
              </td>
            </tr>
          )} />
      </div>
      {modal && (
        <Modal titulo={modal === "nuevo" ? "Nuevo bus" : `Editar bus ${modal.placa}`} onClose={() => setModal(null)} onSave={guardar} guardando={saving}>
          <div style={S.g2}>
            <div style={S.fld}><label style={S.lbl}>Placa *</label><input {...fld("placa")} placeholder="Ej: ABC-123" disabled={modal !== "nuevo"} /></div>
            <div style={S.fld}><label style={S.lbl}>Tipo</label>
              <select {...fld("tipo")} style={S.inp}>{TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select>
            </div>
            <div style={S.fld}><label style={S.lbl}>Marca</label><input {...fld("marca")} placeholder="Ej: Mercedes-Benz" /></div>
            <div style={S.fld}><label style={S.lbl}>Modelo</label><input {...fld("modelo")} placeholder="Ej: OF-1721" /></div>
            <div style={S.fld}><label style={S.lbl}>Año fabricación</label><input {...fld("anio")} type="number" /></div>
            <div style={S.fld}><label style={S.lbl}>Capacidad asientos</label><input {...fld("cap")} type="number" /></div>
            <div style={S.fld}><label style={S.lbl}>Pisos</label>
              <select {...fld("pisos")} style={S.inp}><option value={1}>1 piso</option><option value={2}>2 pisos</option></select>
            </div>
            <div style={S.fld}><label style={S.lbl}>Observaciones</label><input {...fld("obs")} /></div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// VIAJES — GET /api/v1/viajes/mis-viajes
// ══════════════════════════════════════════════════════════════
function PanelViajes({ api, toast, rutas, buses }) {
  const [data, setData]     = useState([]);
  const [load, setLoad]     = useState(true);
  const [err,  setErr]      = useState("");
  const [q,    setQ]        = useState("");
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({});

  const fetch_ = useCallback(async () => {
    setLoad(true); setErr("");
    try {
      const d = await api("GET", "/api/v1/viajes/mis-viajes?page=0&size=200");
      setData(d?.content ?? (Array.isArray(d) ? d : []));
    } catch (e) { setErr(e.message); } finally { setLoad(false); }
  }, [api]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const filtrados = data.filter(v => {
    const s = q.toLowerCase();
    return (v.ruta?.codigo || "").toLowerCase().includes(s) ||
           (v.bus?.placa   || "").toLowerCase().includes(s) ||
           (v.estado       || "").toLowerCase().includes(s);
  });

  const fld = k => ({ value: form[k] ?? "", onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), style: S.inp });

  const guardar = async () => {
    setSaving(true);
    try {
      await api("POST", "/api/v1/viajes", {
        rutaId: Number(form.rutaId), busId: Number(form.busId),
        fechaHoraSalida: form.fecha || null,
        precio: form.precio ? Number(form.precio) : null,
      });
      toast("Viaje programado ✓"); setModal(false); fetch_();
    } catch (e) { toast(e.message, "err"); } finally { setSaving(false); }
  };

  const cambiarEstado = async (v, estado) => {
    try { await api("PATCH", `/api/v1/viajes/${v.id}/estado?estado=${estado}`); toast(`Estado → ${estado}`); fetch_(); }
    catch (e) { toast(e.message, "err"); }
  };

  const del = async v => {
    if (!confirm("¿Eliminar este viaje?")) return;
    try { await api("DELETE", `/api/v1/viajes/${v.id}`); toast("Viaje eliminado"); fetch_(); }
    catch (e) { toast(e.message, "err"); }
  };

  return (
    <>
      <div style={S.top}>
        <div><h1 className="admin-page-title">Viajes</h1><p className="admin-page-sub">{data.length} viajes cargados</p></div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input style={S.srch} placeholder="🔍 Ruta, bus, estado..." value={q} onChange={e => setQ(e.target.value)} />
          <button style={S.btnN} onClick={() => { setForm({ rutaId: "", busId: "", fecha: "", precio: "" }); setModal(true); }}>+ Programar viaje</button>
        </div>
      </div>
      <div style={S.card}>
        <Tabla cols={["#", "Ruta", "Bus", "Salida", "Precio", "Disponibles", "Estado", "Acciones"]}
          rows={filtrados} cargando={load} error={err} onRecargar={fetch_}
          renderFila={v => (
            <tr key={v.id} {...tr()}>
              <td style={S.td}>{v.id}</td>
              <td style={S.td}><strong>{v.ruta?.codigo || "—"}</strong><br /><small style={{ color: "var(--verde-medio)" }}>{v.ruta?.origen?.ciudad} → {v.ruta?.destino?.ciudad}</small></td>
              <td style={S.td}>{v.bus?.placa || "—"}</td>
              <td style={S.td}>{fmtFecha(v.fechaHoraSalida)}</td>
              <td style={S.td}><strong style={{ color: "var(--amarillo)" }}>S/ {v.precio ?? "—"}</strong></td>
              <td style={S.td}>{v.asientosDisponibles ?? "—"}</td>
              <td style={S.td}><EstadoBadge valor={v.estado} mapa={ESTADO_VIAJE} /></td>
              <td style={S.td}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {v.estado === "PROGRAMADO" && <button style={S.btnE} onClick={() => cambiarEstado(v, "EN_CURSO")}>▶ Iniciar</button>}
                  {v.estado === "EN_CURSO"   && <button style={S.btnE} onClick={() => cambiarEstado(v, "FINALIZADO")}>✅ Finalizar</button>}
                  {v.estado === "PROGRAMADO" && <button style={S.btnD} onClick={() => del(v)}>🗑</button>}
                </div>
              </td>
            </tr>
          )} />
      </div>
      {modal && (
        <Modal titulo="Programar viaje" onClose={() => setModal(false)} onSave={guardar} guardando={saving}>
          <div style={S.g2}>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Ruta *</label>
              <select {...fld("rutaId")} style={S.inp}>
                <option value="">Seleccionar ruta...</option>
                {rutas.map(r => <option key={r.id} value={r.id}>{r.codigo} — {r.origen?.ciudad} → {r.destino?.ciudad}</option>)}
              </select>
            </div>
            <div style={S.fld}><label style={S.lbl}>Bus *</label>
              <select {...fld("busId")} style={S.inp}>
                <option value="">Seleccionar bus...</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.placa} — {b.marca} ({b.capacidadAsientos} asientos)</option>)}
              </select>
            </div>
            <div style={S.fld}><label style={S.lbl}>Precio (S/)</label><input {...fld("precio")} type="number" step="0.50" /></div>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Fecha y hora de salida</label><input {...fld("fecha")} type="datetime-local" /></div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// BOLETOS — GET /api/v1/boletos/viaje/:id
// ══════════════════════════════════════════════════════════════
function PanelBoletos({ api, toast, viajes }) {
  const [vId,   setVId]     = useState("");
  const [data,  setData]    = useState([]);
  const [load,  setLoad]    = useState(false);
  const [err,   setErr]     = useState("");
  const [q,     setQ]       = useState("");
  const [modal, setModal]   = useState(false);
  const [saving,setSaving]  = useState(false);
  const [form,  setForm]    = useState({});

  const cargar = useCallback(async vid => {
    if (!vid) return;
    setLoad(true); setErr(""); setData([]);
    try {
      const d = await api("GET", `/api/v1/boletos/viaje/${vid}?page=0&size=200`);
      setData(d?.content ?? (Array.isArray(d) ? d : []));
    } catch (e) { setErr(e.message); } finally { setLoad(false); }
  }, [api]);

  const filtrados = data.filter(b => {
    const s = q.toLowerCase();
    return (b.numeroBoleto || "").toLowerCase().includes(s) ||
           ((b.cliente ? `${b.cliente.nombres} ${b.cliente.apellidos}` : b.pasajeroNombre) || "").toLowerCase().includes(s);
  });

  const fld = k => ({ value: form[k] ?? "", onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), style: S.inp });

  const vender = async () => {
    setSaving(true);
    try {
      let clienteId = null;
      if (form.dni) {
        try { const c = await api("GET", `/api/v1/clientes/dni/${form.dni}`); clienteId = c?.id; } catch {}
      }
      await api("POST", "/api/v1/boletos/vender", {
        viajeId: Number(vId), clienteId,
        pasajeroNombre: form.nombre || null,
        pasajeroDni: form.dni || null,
        numeroAsiento: form.asiento ? Number(form.asiento) : null,
        precio: form.precio ? Number(form.precio) : null,
      });
      toast("Boleto vendido ✓"); setModal(false); cargar(vId);
    } catch (e) { toast(e.message, "err"); } finally { setSaving(false); }
  };

  const cancelar = async b => {
    if (!confirm(`¿Cancelar boleto ${b.numeroBoleto}?`)) return;
    try { await api("PATCH", `/api/v1/boletos/${b.id}/cancelar`); toast("Cancelado"); cargar(vId); }
    catch (e) { toast(e.message, "err"); }
  };

  return (
    <>
      <div style={S.top}>
        <div><h1 className="admin-page-title">Boletos</h1><p className="admin-page-sub">Selecciona un viaje</p></div>
      </div>
      <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <select style={{ ...S.srch, maxWidth: 440 }} value={vId} onChange={e => { setVId(e.target.value); cargar(e.target.value); }}>
          <option value="">— Selecciona un viaje —</option>
          {viajes.map(v => (
            <option key={v.id} value={v.id}>
              #{v.id} · {v.ruta?.codigo} · {v.ruta?.origen?.ciudad} → {v.ruta?.destino?.ciudad} · {fmtFecha(v.fechaHoraSalida)}
            </option>
          ))}
        </select>
        {vId && <>
          <input style={{ ...S.srch, maxWidth: 240 }} placeholder="🔍 Buscar..." value={q} onChange={e => setQ(e.target.value)} />
          <button style={S.btnN} onClick={() => { setForm({ dni: "", nombre: "", asiento: "", precio: "" }); setModal(true); }}>🎟 Vender boleto</button>
        </>}
      </div>
      {vId && (
        <div style={S.card}>
          <Tabla cols={["N° Boleto", "Pasajero", "DNI", "Asiento", "Precio pagado", "Estado", "Acciones"]}
            rows={filtrados} cargando={load} error={err} onRecargar={() => cargar(vId)}
            renderFila={b => (
              <tr key={b.id} {...tr()}>
                <td style={S.td}><span style={{ fontFamily: "monospace", fontSize: 12 }}>{b.numeroBoleto}</span></td>
                <td style={S.td}>{b.cliente ? `${b.cliente.nombres} ${b.cliente.apellidos}` : (b.pasajeroNombre || "—")}</td>
                <td style={S.td}>{b.cliente?.dniRuc || b.pasajeroDni || "—"}</td>
                <td style={S.td}>{b.asiento?.numeroAsiento ?? "—"}</td>
                <td style={S.td}><strong style={{ color: "var(--amarillo)" }}>S/ {b.precioPagado ?? "—"}</strong></td>
                <td style={S.td}><EstadoBadge valor={b.estado} mapa={ESTADO_BOLETO} /></td>
                <td style={S.td}>{b.estado === "ACTIVO" && <button style={S.btnD} onClick={() => cancelar(b)}>❌ Cancelar</button>}</td>
              </tr>
            )} />
        </div>
      )}
      {modal && (
        <Modal titulo="Vender boleto" onClose={() => setModal(false)} onSave={vender} guardando={saving}>
          <div style={S.g2}>
            <div style={S.fld}><label style={S.lbl}>DNI pasajero</label><input {...fld("dni")} placeholder="Ej: 45678901" /></div>
            <div style={S.fld}><label style={S.lbl}>Nombre pasajero</label><input {...fld("nombre")} placeholder="Si no tiene cuenta" /></div>
            <div style={S.fld}><label style={S.lbl}>N° asiento</label><input {...fld("asiento")} type="number" /></div>
            <div style={S.fld}><label style={S.lbl}>Precio (S/)</label><input {...fld("precio")} type="number" step="0.50" /></div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// CLIENTES — GET /api/v1/clientes
// ══════════════════════════════════════════════════════════════
function PanelClientes({ api, toast }) {
  const [data,  setData]    = useState([]);
  const [load,  setLoad]    = useState(true);
  const [err,   setErr]     = useState("");
  const [q,     setQ]       = useState("");
  const [pag,   setPag]     = useState(0);
  const [total, setTotal]   = useState(1);
  const [modal, setModal]   = useState(null);
  const [saving,setSaving]  = useState(false);
  const [form,  setForm]    = useState({});

  const fetch_ = useCallback(async (busq = "", p = 0) => {
    setLoad(true); setErr("");
    try {
      const url = busq
        ? `/api/v1/clientes?q=${encodeURIComponent(busq)}&page=${p}&size=20`
        : `/api/v1/clientes?page=${p}&size=20`;
      const d = await api("GET", url);
      setData(d?.content ?? (Array.isArray(d) ? d : []));
      setTotal(d?.totalPages ?? 1); setPag(p);
    } catch (e) { setErr(e.message); } finally { setLoad(false); }
  }, [api]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const fld = k => ({ value: form[k] ?? "", onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), style: S.inp });

  const guardar = async () => {
    setSaving(true);
    try {
      await api("PUT", `/api/v1/clientes/${modal.id}`, form);
      toast("Cliente actualizado ✓"); setModal(null); fetch_(q, pag);
    } catch (e) { toast(e.message, "err"); } finally { setSaving(false); }
  };

  const del = async c => {
    if (!confirm(`¿Eliminar a ${c.nombres} ${c.apellidos}?`)) return;
    try { await api("DELETE", `/api/v1/clientes/${c.id}`); toast("Eliminado"); fetch_(q, pag); }
    catch (e) { toast(e.message, "err"); }
  };

  return (
    <>
      <div style={S.top}>
        <div><h1 className="admin-page-title">Clientes</h1><p className="admin-page-sub">Pasajeros registrados</p></div>
        <input style={S.srch} placeholder="🔍 Nombre o DNI..." value={q}
          onChange={e => { setQ(e.target.value); fetch_(e.target.value, 0); }} />
      </div>
      <div style={S.card}>
        <Tabla cols={["#", "Nombre completo", "DNI / RUC", "Teléfono", "Email", "Tipo", "Acciones"]}
          rows={data} cargando={load} error={err} onRecargar={() => fetch_(q, pag)} pagSize={20}
          renderFila={c => (
            <tr key={c.id} {...tr()}>
              <td style={S.td}>{c.id}</td>
              <td style={S.td}><strong>{c.nombres} {c.apellidos}</strong></td>
              <td style={S.td}><span style={{ fontFamily: "monospace" }}>{c.dniRuc || "—"}</span></td>
              <td style={S.td}>{c.telefono || "—"}</td>
              <td style={S.td}>{c.email || "—"}</td>
              <td style={S.td}>{c.tipoCliente || "PERSONA"}</td>
              <td style={S.td}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={S.btnE} onClick={() => { setForm({ nombres: c.nombres || "", apellidos: c.apellidos || "", dniRuc: c.dniRuc || "", telefono: c.telefono || "", email: c.email || "", tipoCliente: c.tipoCliente || "PERSONA" }); setModal(c); }}>✏️ Editar</button>
                  <button style={S.btnD} onClick={() => del(c)}>🗑</button>
                </div>
              </td>
            </tr>
          )} />
        {total > 1 && (
          <div style={S.pg}>
            <span>Página {pag + 1} de {total}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={S.pgB} disabled={pag === 0} onClick={() => fetch_(q, pag - 1)}>‹ Anterior</button>
              <button style={S.pgB} disabled={pag >= total - 1} onClick={() => fetch_(q, pag + 1)}>Siguiente ›</button>
            </div>
          </div>
        )}
      </div>
      {modal && (
        <Modal titulo={`Editar cliente #${modal.id}`} onClose={() => setModal(null)} onSave={guardar} guardando={saving}>
          <div style={S.g2}>
            <div style={S.fld}><label style={S.lbl}>Nombres *</label><input {...fld("nombres")} /></div>
            <div style={S.fld}><label style={S.lbl}>Apellidos *</label><input {...fld("apellidos")} /></div>
            <div style={S.fld}><label style={S.lbl}>DNI / RUC</label><input {...fld("dniRuc")} /></div>
            <div style={S.fld}><label style={S.lbl}>Teléfono</label><input {...fld("telefono")} /></div>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Email</label><input {...fld("email")} type="email" /></div>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}>
              <label style={S.lbl}>Tipo de cliente</label>
              <select {...fld("tipoCliente")} style={S.inp}>
                <option value="PERSONA">PERSONA</option>
                <option value="EMPRESA">EMPRESA</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// SUCURSALES — GET /api/v1/sucursales
// ══════════════════════════════════════════════════════════════
function PanelSucursales({ api, toast }) {
  const [data,  setData]    = useState([]);
  const [load,  setLoad]    = useState(true);
  const [err,   setErr]     = useState("");
  const [modal, setModal]   = useState(null);
  const [saving,setSaving]  = useState(false);
  const [form,  setForm]    = useState({});

  const fetch_ = useCallback(async () => {
    setLoad(true); setErr("");
    try { const d = await api("GET", "/api/v1/sucursales"); setData(Array.isArray(d) ? d : []); }
    catch (e) { setErr(e.message); } finally { setLoad(false); }
  }, [api]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const fld = k => ({ value: form[k] ?? "", onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), style: S.inp });

  const guardar = async () => {
    setSaving(true);
    try {
      const body = { ...form, esTerminal: form.esTerminal === true || form.esTerminal === "true" };
      modal === "nuevo"
        ? (await api("POST", "/api/v1/sucursales", body), toast("Sucursal creada ✓"))
        : (await api("PUT", `/api/v1/sucursales/${modal.id}`, body), toast("Sucursal actualizada ✓"));
      setModal(null); fetch_();
    } catch (e) { toast(e.message, "err"); } finally { setSaving(false); }
  };

  const del = async s => {
    if (!confirm(`¿Eliminar sucursal ${s.nombre}?`)) return;
    try { await api("DELETE", `/api/v1/sucursales/${s.id}`); toast("Eliminada"); fetch_(); }
    catch (e) { toast(e.message, "err"); }
  };

  const nuevo  = () => { setForm({ codigo: "", nombre: "", ciudad: "", departamento: "", direccion: "", telefono: "", esTerminal: false }); setModal("nuevo"); };
  const editar = s => { setForm({ codigo: s.codigo || "", nombre: s.nombre || "", ciudad: s.ciudad || "", departamento: s.departamento || "", direccion: s.direccion || "", telefono: s.telefono || "", esTerminal: s.esTerminal || false }); setModal(s); };

  return (
    <>
      <div style={S.top}>
        <div><h1 className="admin-page-title">Sucursales</h1><p className="admin-page-sub">{data.length} sucursales</p></div>
        <button style={S.btnN} onClick={nuevo}>+ Nueva sucursal</button>
      </div>
      <div style={S.card}>
        <Tabla cols={["#", "Código", "Nombre", "Ciudad", "Departamento", "Teléfono", "Terminal", "Acciones"]}
          rows={data} cargando={load} error={err} onRecargar={fetch_}
          renderFila={s => (
            <tr key={s.id} {...tr()}>
              <td style={S.td}>{s.id}</td>
              <td style={S.td}><span style={{ fontFamily: "monospace", fontSize: 12 }}>{s.codigo}</span></td>
              <td style={S.td}><strong>{s.nombre}</strong></td>
              <td style={S.td}>{s.ciudad}</td>
              <td style={S.td}>{s.departamento}</td>
              <td style={S.td}>{s.telefono || "—"}</td>
              <td style={S.td}>{s.esTerminal ? <span className="estado-badge badge-confirmado">🚉 Sí</span> : <span style={{ color: "var(--verde-medio)", fontSize: 12 }}>No</span>}</td>
              <td style={S.td}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={S.btnE} onClick={() => editar(s)}>✏️ Editar</button>
                  <button style={S.btnD} onClick={() => del(s)}>🗑</button>
                </div>
              </td>
            </tr>
          )} />
      </div>
      {modal && (
        <Modal titulo={modal === "nuevo" ? "Nueva sucursal" : `Editar: ${modal.nombre}`} onClose={() => setModal(null)} onSave={guardar} guardando={saving}>
          <div style={S.g2}>
            <div style={S.fld}><label style={S.lbl}>Código *</label><input {...fld("codigo")} placeholder="Ej: SUC-AYA-01" /></div>
            <div style={S.fld}><label style={S.lbl}>Nombre *</label><input {...fld("nombre")} /></div>
            <div style={S.fld}><label style={S.lbl}>Ciudad *</label><input {...fld("ciudad")} /></div>
            <div style={S.fld}><label style={S.lbl}>Departamento</label><input {...fld("departamento")} /></div>
            <div style={{ ...S.fld, gridColumn: "1/-1" }}><label style={S.lbl}>Dirección</label><input {...fld("direccion")} /></div>
            <div style={S.fld}><label style={S.lbl}>Teléfono</label><input {...fld("telefono")} /></div>
            <div style={S.fld}><label style={S.lbl}>¿Es terminal?</label>
              <select value={form.esTerminal} onChange={e => setForm(f => ({ ...f, esTerminal: e.target.value === "true" }))} style={S.inp}>
                <option value="false">No</option><option value="true">Sí</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD PRINCIPAL
// ══════════════════════════════════════════════════════════════
const MENU = [
  { key: "rutas",      icon: "🗺️",  label: "Rutas"      },
  { key: "buses",      icon: "🚌",  label: "Buses"      },
  { key: "viajes",     icon: "📅",  label: "Viajes"     },
  { key: "boletos",    icon: "🎟️",  label: "Boletos"    },
  { key: "clientes",   icon: "👥",  label: "Clientes"   },
  { key: "sucursales", icon: "🏢",  label: "Sucursales" },
];

export default function AdminDashboard() {
  const { session, logout } = useAuth();
  const api                 = useApi(session?.token);
  const { toasts, add: toast } = useToast();

  const [seccion,    setSeccion]    = useState("rutas");
  const [sucursales, setSucursales] = useState([]);
  const [rutas,      setRutas]      = useState([]);
  const [buses,      setBuses]      = useState([]);
  const [viajes,     setViajes]     = useState([]);
  const [stats,      setStats]      = useState({});

  // Cargar datos compartidos
  useEffect(() => {
    api("GET", "/api/v1/sucursales").then(d => setSucursales(Array.isArray(d) ? d : [])).catch(() => {});
    api("GET", "/api/v1/rutas").then(d => setRutas(Array.isArray(d) ? d : [])).catch(() => {});
    api("GET", "/api/v1/buses").then(d => setBuses(Array.isArray(d) ? d : [])).catch(() => {});
    api("GET", "/api/v1/viajes/mis-viajes?page=0&size=200").then(d => setViajes(d?.content ?? [])).catch(() => {});
    // Stats mini
    Promise.all([
      api("GET", "/api/v1/rutas").catch(() => []),
      api("GET", "/api/v1/buses").catch(() => []),
      api("GET", "/api/v1/clientes?page=0&size=1").catch(() => null),
      api("GET", "/api/v1/viajes/mis-viajes?page=0&size=1").catch(() => null),
    ]).then(([r, b, c, v]) => setStats({
      rutas: Array.isArray(r) ? r.length : 0,
      buses: Array.isArray(b) ? b.length : 0,
      clientes: c?.totalElements ?? 0,
      viajes: v?.totalElements ?? 0,
    }));
  }, [api]);

  const iniciales = (session?.username || "AD").slice(0, 2).toUpperCase();

  return (
    <div className="admin-wrap">
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <LogoSVG width={44} height={44} />
          <div>
            <div className="sidebar-brand">INTIWATANA</div>
            <div className="sidebar-sub">Panel Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {MENU.map(({ key, icon, label }) => (
            <div key={key} className={`sidebar-item ${seccion === key ? "active" : ""}`} onClick={() => setSeccion(key)}>
              {icon} {label}
            </div>
          ))}
        </nav>

        {/* Stats rápidas */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(138,166,163,.12)" }}>
          {[["Rutas", stats.rutas], ["Buses", stats.buses], ["Clientes", stats.clientes], ["Viajes", stats.viajes]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--verde-medio)", marginBottom: 4 }}>
              <span>{l}</span><strong style={{ color: "var(--amarillo)" }}>{v ?? "—"}</strong>
            </div>
          ))}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{iniciales}</div>
          <div>
            <div className="sidebar-uname">{session?.username}</div>
            <div className="sidebar-role">{session?.rol?.replace("ROLE_", "") || "Admin"}</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Cerrar sesión">⏻</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        {seccion === "rutas"      && <PanelRutas      api={api} toast={toast} sucursales={sucursales} />}
        {seccion === "buses"      && <PanelBuses      api={api} toast={toast} />}
        {seccion === "viajes"     && <PanelViajes     api={api} toast={toast} rutas={rutas} buses={buses} />}
        {seccion === "boletos"    && <PanelBoletos    api={api} toast={toast} viajes={viajes} />}
        {seccion === "clientes"   && <PanelClientes   api={api} toast={toast} />}
        {seccion === "sucursales" && <PanelSucursales api={api} toast={toast} />}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}