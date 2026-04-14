import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ─── Paleta ───────────────────────────────────────────
const C = {
  verde:    "#127369",
  oscuro:   "#0d3330",
  amarillo: "#F5C518",
  medio:    "#7a9e9b",
  gris:     "#4C5958",
  fondo:    "#f0f4f3",
  blanco:   "#ffffff",
  rojo:     "#e05252",
  naranja:  "#e67e22",
};

// ─── Helpers ──────────────────────────────────────────
function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Hook: contador animado ───────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(prog * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─── Componente: número animado ───────────────────────
function AnimNum({ value }) {
  const n = useCountUp(value);
  return <>{n}</>;
}

// ─── Componente: Badge ────────────────────────────────
function Badge({ text }) {
  const map = {
    PROGRAMADO:  { bg: "rgba(18,115,105,0.12)", c: C.verde },
    EN_CURSO:    { bg: "rgba(245,197,24,0.2)",  c: "#9a7a00" },
    FINALIZADO:  { bg: "rgba(52,199,89,0.15)",  c: "#15803d" },
    CANCELADO:   { bg: "rgba(224,82,82,0.12)",  c: C.rojo },
    ACTIVO:      { bg: "rgba(18,115,105,0.12)", c: C.verde },
    USADO:       { bg: "rgba(52,199,89,0.15)",  c: "#15803d" },
    RECIBIDO:    { bg: "rgba(245,197,24,0.2)",  c: "#9a7a00" },
    EN_TRANSITO: { bg: "rgba(18,115,105,0.12)", c: C.verde },
    ENTREGADO:   { bg: "rgba(52,199,89,0.15)",  c: "#15803d" },
    NORMAL:      { bg: "rgba(18,115,105,0.12)", c: C.verde },
    SEMACAMA:    { bg: "rgba(245,197,24,0.2)",  c: "#9a7a00" },
    CAMA:        { bg: "rgba(122,158,155,0.2)", c: C.gris },
    MINIBUS:     { bg: "rgba(122,158,155,0.2)", c: C.gris },
    PERSONA:     { bg: "rgba(18,115,105,0.12)", c: C.verde },
    EMPRESA:     { bg: "rgba(245,197,24,0.2)",  c: "#9a7a00" },
    SÍ:          { bg: "rgba(18,115,105,0.12)", c: C.verde },
    NO:          { bg: "rgba(122,158,155,0.15)",c: C.gris },
  };
  const s = map[text] || { bg: "rgba(122,158,155,0.15)", c: C.gris };
  return (
    <span style={{
      background: s.bg, color: s.c,
      borderRadius: 50, padding: "3px 11px",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {text?.replace(/_/g, " ")}
    </span>
  );
}

// ─── Componente: StatCard animada ─────────────────────
function StatCard({ icon, valor, label, color, sub, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? `linear-gradient(135deg, ${color}18, ${color}08)` : C.blanco,
        borderRadius: 16,
        padding: "20px 22px",
        border: `1.5px solid ${hover ? color + "55" : "#e2edeb"}`,
        boxShadow: hover
          ? `0 8px 28px ${color}22`
          : "0 2px 10px rgba(16,64,59,0.05)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        transform: hover ? "translateY(-3px)" : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -12, right: -12,
        fontSize: 64, opacity: 0.06, lineHeight: 1,
        transition: "transform 0.3s", transform: hover ? "scale(1.15) rotate(-5deg)" : "none",
      }}>{icon}</div>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: 34, fontWeight: 900, color: C.oscuro,
        fontFamily: "'Playfair Display', serif", lineHeight: 1,
      }}>
        <AnimNum value={valor} />
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.medio,
        letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 5,
      }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.medio, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Componente: Barra de progreso animada ────────────
function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: "#e8f0ee",
        borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: "width 1s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.gris, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

// ─── Mini Donut Chart ─────────────────────────────────
function DonutChart({ data, size = 130 }) {
  if (!data?.length) return null;
  const colores = [C.verde, C.amarillo, C.rojo, C.naranja, "#9b59b6", "#3498db", "#1abc9c"];
  const total = data.reduce((s, d) => s + (d.valor || 0), 0) || 1;
  let acum = 0;
  const arcos = data.map((d, i) => {
    const pct = (d.valor || 0) / total;
    const ini = acum; acum += pct;
    const a1 = ini * 2 * Math.PI - Math.PI / 2;
    const a2 = acum * 2 * Math.PI - Math.PI / 2;
    const R = size / 2 - 10, r = R - 22, cx = size / 2, cy = size / 2;
    const x1e = cx + R * Math.cos(a1), y1e = cy + R * Math.sin(a1);
    const x2e = cx + R * Math.cos(a2), y2e = cy + R * Math.sin(a2);
    const x1i = cx + r * Math.cos(a2), y1i = cy + r * Math.sin(a2);
    const x2i = cx + r * Math.cos(a1), y2i = cy + r * Math.sin(a1);
    const grande = pct > 0.5 ? 1 : 0;
    if (pct < 0.005) return null;
    return {
      path: `M${x1e},${y1e} A${R},${R} 0 ${grande},1 ${x2e},${y2e} L${x1i},${y1i} A${r},${r} 0 ${grande},0 ${x2i},${y2i} Z`,
      color: colores[i % colores.length],
      label: d.nombre, valor: d.valor,
    };
  }).filter(Boolean);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {arcos.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} stroke={C.blanco} strokeWidth={2} />
        ))}
        <circle cx={size / 2} cy={size / 2} r={(size / 2 - 10) - 22} fill={C.blanco} />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          fontSize={13} fill={C.oscuro} fontWeight="800" fontFamily="'Playfair Display',serif">
          {total}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {arcos.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.gris }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
            <span>{a.label}</span>
            <strong style={{ color: C.oscuro, marginLeft: "auto", paddingLeft: 10 }}>{a.valor}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal base ───────────────────────────────────────
function ModalForm({ titulo, emoji, onClose, onSubmit, saving, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" onClick={e => e.stopPropagation()}
        style={{ animation: "modalIn 0.22s cubic-bezier(.4,0,.2,1)" }}>
        <div className="modal-header">
          <div className="modal-badge">{emoji}</div>
          <div>
            <div className="modal-title">{titulo}</div>
            <div className="modal-subtitle">Completa los datos</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit}>
            {children}
            <div style={{ display: "flex", gap: 10, marginTop: "1.4rem" }}>
              <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-reservar" disabled={saving}>
                {saving ? <span className="spinner" /> : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ onConfirmar, onCancelar, mensaje }) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}
        style={{ animation: "modalIn 0.18s ease" }}>
        <div className="modal-body" style={{ textAlign: "center", padding: "2.2rem" }}>
          <div style={{ fontSize: 44, marginBottom: "1rem" }}>🗑️</div>
          <h3 style={{ marginBottom: ".5rem", fontFamily: "'Playfair Display',serif", color: C.oscuro }}>
            ¿Eliminar registro?
          </h3>
          <p style={{ color: C.medio, fontSize: 14, marginBottom: "1.5rem" }}>
            {mensaje || "Esta acción no se puede deshacer."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
            <button className="btn-delete-confirm" onClick={onConfirmar}>Sí, eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tabla wrapper ────────────────────────────────────
function TableWrap({ load, empty, children }) {
  return (
    <div className="adm-table-wrap">
      {load
        ? <div className="td-loading"><div className="skeleton-rows">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div></div>
        : empty
          ? <div className="td-empty">😕 {empty}</div>
          : children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SECCIÓN: Dashboard Principal
// ═══════════════════════════════════════════════════════
function DashboardHome({ headers, onNav }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [rutas, viajes, buses, clientes, encomiendas, sucursales] = await Promise.all([
          fetch("/api/v1/rutas", { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/v1/viajes", { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/v1/buses", { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/v1/clientes", { headers }).then(r => r.ok ? r.json() : {}).catch(() => {}),
          fetch("/api/v1/encomiendas", { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/v1/sucursales", { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        ]);

        const viajesArr = Array.isArray(viajes) ? viajes : [];
        const busesArr  = Array.isArray(buses)  ? buses  : [];
        const rutasArr  = Array.isArray(rutas)  ? rutas  : [];
        const sucArr    = Array.isArray(sucursales) ? sucursales : [];
        const encArr    = Array.isArray(encomiendas) ? encomiendas : [];
        const clientesN = Array.isArray(clientes) ? clientes.length
          : (clientes?.content?.length ?? clientes?.totalElements ?? 0);

        // Estadísticas de viajes por estado
        const viajeStats = viajesArr.reduce((acc, v) => {
          acc[v.estado] = (acc[v.estado] || 0) + 1;
          return acc;
        }, {});

        // Encomiendas por estado
        const encStats = encArr.reduce((acc, e) => {
          acc[e.estado] = (acc[e.estado] || 0) + 1;
          return acc;
        }, {});

        setData({
          rutas: rutasArr.length,
          viajes: viajesArr.length,
          buses: busesArr.length,
          clientes: clientesN,
          encomiendas: encArr.length,
          sucursales: sucArr.length,
          viajeStats,
          encStats,
          viajesRecientes: viajesArr.slice(0, 5),
          programados: viajeStats["PROGRAMADO"] || 0,
          enCurso: viajeStats["EN_CURSO"] || 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <div className="pulse-logo">🚌</div>
      <p style={{ color: C.medio, marginTop: 12 }}>Cargando dashboard...</p>
    </div>
  );

  const donutViajes = Object.entries(data.viajeStats || {}).map(([k, v]) => ({ nombre: k.replace(/_/g, " "), valor: v }));
  const donutEnc    = Object.entries(data.encStats   || {}).map(([k, v]) => ({ nombre: k.replace(/_/g, " "), valor: v }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Hero banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.oscuro} 0%, ${C.verde} 100%)`,
        borderRadius: 18, padding: "26px 30px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -20, top: -20,
          width: 180, height: 180,
          background: "rgba(255,255,255,0.04)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", right: 40, top: 10,
          width: 100, height: 100,
          background: "rgba(245,197,24,0.08)",
          borderRadius: "50%",
        }} />
        <div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Panel de control
          </div>
          <div style={{ color: C.blanco, fontSize: 28, fontWeight: 800, fontFamily: "'Playfair Display',serif" }}>
            INTIWATANA S.R.L.
          </div>
          <div style={{ color: C.amarillo, fontSize: 13, marginTop: 4 }}>
            {data.programados} viajes programados · {data.enCurso} en curso
          </div>
        </div>
        <div style={{ fontSize: 60, opacity: 0.9 }}>🚌</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon="🗺" valor={data.rutas}       label="Rutas activas"   color={C.verde}   onClick={() => onNav("rutas")} />
        <StatCard icon="📅" valor={data.viajes}      label="Total viajes"    color={C.amarillo} onClick={() => onNav("viajes")} />
        <StatCard icon="🚌" valor={data.buses}       label="Flota de buses"  color={C.verde}   onClick={() => onNav("buses")} />
        <StatCard icon="👥" valor={data.clientes}    label="Clientes"        color={C.naranja} onClick={() => onNav("clientes")} />
        <StatCard icon="📦" valor={data.encomiendas} label="Encomiendas"     color={C.rojo}    onClick={() => onNav("encomiendas")} />
        <StatCard icon="🏢" valor={data.sucursales}  label="Sucursales"      color={C.gris}    onClick={() => onNav("sucursales")} />
      </div>

      {/* Fila de gráficos + acciones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 20 }}>
        {/* Donut Viajes */}
        <div className="card-panel">
          <div className="panel-title">📊 Estado de Viajes</div>
          {donutViajes.length > 0
            ? <DonutChart data={donutViajes} size={120} />
            : <p style={{ color: C.medio, fontSize: 13 }}>Sin datos</p>}
        </div>

        {/* Donut Encomiendas */}
        <div className="card-panel">
          <div className="panel-title">📦 Estado Encomiendas</div>
          {donutEnc.length > 0
            ? <DonutChart data={donutEnc} size={120} />
            : <p style={{ color: C.medio, fontSize: 13 }}>Sin encomiendas</p>}
        </div>

        {/* Acciones rápidas */}
        <div className="card-panel">
          <div className="panel-title">⚡ Acceso rápido</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "🏢", label: "Sucursales", key: "sucursales" },
              { icon: "🗺", label: "Rutas", key: "rutas" },
              { icon: "🚌", label: "Buses", key: "buses" },
              { icon: "📅", label: "Viajes", key: "viajes" },
              { icon: "👥", label: "Clientes", key: "clientes" },
              { icon: "📦", label: "Encomiendas", key: "encomiendas" },
            ].map(a => (
              <button key={a.key} className="quick-btn" onClick={() => onNav(a.key)}>
                <span>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Viajes recientes */}
      {data.viajesRecientes?.length > 0 && (
        <div className="card-panel">
          <div className="panel-title">🕐 Viajes recientes</div>
          <table className="adm-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Ruta</th><th>Bus</th><th>Salida</th><th>Precio</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.viajesRecientes.map(v => (
                <tr key={v.id} className="tr-hover">
                  <td>{v.ruta?.origen?.ciudad || "—"} → {v.ruta?.destino?.ciudad || "—"}</td>
                  <td><span className="td-codigo">{v.bus?.placa || "—"}</span></td>
                  <td style={{ fontSize: 12 }}>{fmtFecha(v.fechaHoraSalida)}</td>
                  <td>S/ {v.precioAdulto || "—"}</td>
                  <td><Badge text={v.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Sucursales
// ═══════════════════════════════════════════════════════
function CrudSucursales({ headers, showToast }) {
  const [items, setItems] = useState([]);
  const [load, setLoad] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [conf, setConf] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const res = await fetch("/api/v1/sucursales", { headers });
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } catch { showToast("⚠ Error al cargar"); setItems([]); }
    finally { setLoad(false); }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (s = null) => {
    setForm(s ? {
      id: s.id, codigo: s.codigo || "", nombre: s.nombre || "",
      ciudad: s.ciudad || "", departamento: s.departamento || "",
      provincia: s.provincia || "", direccion: s.direccion || "",
      telefono: s.telefono || "", email: s.email || "",
      esTerminal: s.esTerminal ? "true" : "false",
    } : { codigo: "", nombre: "", ciudad: "", departamento: "", provincia: "", direccion: "", telefono: "", email: "", esTerminal: "false" });
    setModal(s || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.codigo?.trim()) return showToast("⚠ Código obligatorio");
    if (!form.nombre?.trim()) return showToast("⚠ Nombre obligatorio");
    if (!form.ciudad?.trim()) return showToast("⚠ Ciudad obligatoria");
    if (!form.departamento?.trim()) return showToast("⚠ Departamento obligatorio");
    setSaving(true);
    const isEdit = !!form.id;
    try {
      const body = {
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        ciudad: form.ciudad.trim(),
        departamento: form.departamento.trim(),
        provincia: form.provincia?.trim() || null,
        direccion: form.direccion?.trim() || null,
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        esTerminal: form.esTerminal === "true",
      };
      const res = await fetch(isEdit ? `/api/v1/sucursales/${form.id}` : "/api/v1/sucursales", {
        method: isEdit ? "PUT" : "POST", headers, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.mensaje || err.errores?.join(", ") || "Error al guardar");
      }
      const data = await res.json();
      setItems(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Sucursal actualizada" : "✓ Sucursal creada");
      setModal(null);
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    try {
      const res = await fetch(`/api/v1/sucursales/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setItems(prev => prev.filter(x => x.id !== id));
      showToast("✓ Sucursal eliminada");
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setConf(null); }
  };

  return (
    <>
      <PageHeader title="🏢 Gestión de Sucursales" sub={`${items.length} sucursales`}
        action={<button className="adm-btn-primary" onClick={() => abrir()}>+ Nueva sucursal</button>} />
      <TableWrap load={load} empty={!items.length && "Sin sucursales registradas"}>
        <table className="adm-table">
          <thead><tr><th>Código</th><th>Nombre</th><th>Ciudad</th><th>Departamento</th><th>Teléfono</th><th>Terminal</th><th>Acciones</th></tr></thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="tr-hover">
                <td><span className="td-codigo">{s.codigo}</span></td>
                <td><strong>{s.nombre}</strong></td>
                <td>{s.ciudad}</td>
                <td>{s.departamento || "—"}</td>
                <td>{s.telefono || "—"}</td>
                <td><Badge text={s.esTerminal ? "SÍ" : "NO"} /></td>
                <td><Actions onEdit={() => abrir(s)} onDel={() => setConf(s.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {modal && (
        <ModalForm titulo={modal === "nuevo" ? "Nueva sucursal" : `Editar: ${form.nombre}`}
          emoji="🏢" onClose={() => setModal(null)} onSubmit={guardar} saving={saving}>
          <div className="form-grid">
            <Field label="Código *"><input value={form.codigo || ""} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="AYA-01" required style={{ textTransform: "uppercase" }} /></Field>
            <Field label="Nombre *"><input value={form.nombre || ""} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Terminal Central" required /></Field>
            <Field label="Ciudad *"><input value={form.ciudad || ""} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} placeholder="Ayacucho" required /></Field>
            <Field label="Departamento *"><input value={form.departamento || ""} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))} placeholder="Ayacucho" required /></Field>
            <Field label="Provincia"><input value={form.provincia || ""} onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))} placeholder="Huamanga" /></Field>
            <Field label="Teléfono"><input value={form.telefono || ""} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></Field>
            <Field label="Email" style={{ gridColumn: "1/-1" }}><input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Dirección" style={{ gridColumn: "1/-1" }}><input value={form.direccion || ""} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></Field>
            <Field label="¿Es terminal?">
              <select className="lf-select" value={form.esTerminal || "false"} onChange={e => setForm(f => ({ ...f, esTerminal: e.target.value }))}>
                <option value="false">No</option><option value="true">Sí</option>
              </select>
            </Field>
          </div>
        </ModalForm>
      )}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => setConf(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Rutas
// ═══════════════════════════════════════════════════════
function CrudRutas({ headers, showToast }) {
  const [rutas, setRutas] = useState([]);
  const [suc, setSuc] = useState([]);
  const [load, setLoad] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [conf, setConf] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/v1/rutas", { headers }),
        fetch("/api/v1/sucursales", { headers }),
      ]);
      // FIX: /api/v1/rutas es público (sin auth) pero el filtro de activo fallaba
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      setRutas(Array.isArray(d1) ? d1 : []);
      setSuc(Array.isArray(d2) ? d2 : []);
    } catch { showToast("⚠ Error al cargar"); }
    finally { setLoad(false); }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (r = null) => {
    setForm(r ? {
      id: r.id, codigo: r.codigo || "",
      origenId: r.origen?.id?.toString() || "",
      destinoId: r.destino?.id?.toString() || "",
      distanciaKm: r.distanciaKm?.toString() || "",
      duracionHorasEstimada: r.duracionHorasEstimada?.toString() || "",
      precioBase: r.precioBase?.toString() || "",
      descripcion: r.descripcion || "",
    } : { codigo: "", origenId: "", destinoId: "", distanciaKm: "", duracionHorasEstimada: "", precioBase: "", descripcion: "" });
    setModal(r || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.codigo || !form.origenId || !form.destinoId) return showToast("⚠ Código, origen y destino obligatorios");
    if (form.origenId === form.destinoId) return showToast("⚠ Origen y destino no pueden ser iguales");
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/rutas/${form.id}` : "/api/v1/rutas", {
        method: isEdit ? "PUT" : "POST", headers,
        body: JSON.stringify({
          codigo: form.codigo.trim(),
          origenId: parseInt(form.origenId),
          destinoId: parseInt(form.destinoId),
          distanciaKm: form.distanciaKm ? parseFloat(form.distanciaKm) : null,
          duracionHorasEstimada: form.duracionHorasEstimada ? parseFloat(form.duracionHorasEstimada) : null,
          precioBase: form.precioBase ? parseFloat(form.precioBase) : null,
          descripcion: form.descripcion?.trim() || null,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.mensaje || "Error"); }
      const data = await res.json();
      setRutas(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Ruta actualizada" : "✓ Ruta creada");
      setModal(null);
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/rutas/${id}`, { method: "DELETE", headers });
      setRutas(prev => prev.filter(x => x.id !== id));
      showToast("✓ Ruta eliminada");
    } catch { showToast("⚠ Error"); }
    finally { setConf(null); }
  };

  const fil = rutas.filter(r =>
    (r.codigo || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (r.origen?.ciudad || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (r.destino?.ciudad || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <PageHeader title="🗺 Gestión de Rutas" sub={`${rutas.length} rutas`}
        action={<button className="adm-btn-primary" onClick={() => abrir()}>+ Nueva ruta</button>} />
      <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar código, origen o destino..." />
      <TableWrap load={load} empty={!fil.length && "Sin rutas registradas"}>
        <table className="adm-table">
          <thead><tr><th>Código</th><th>Origen</th><th>Destino</th><th>Distancia</th><th>Duración</th><th>Precio</th><th>Acciones</th></tr></thead>
          <tbody>
            {fil.map(r => (
              <tr key={r.id} className="tr-hover">
                <td><span className="td-codigo">{r.codigo}</span></td>
                <td><div className="td-lugar"><span className="td-ciudad">{r.origen?.ciudad || "—"}</span><span className="td-dep">{r.origen?.departamento}</span></div></td>
                <td><div className="td-lugar"><span className="td-ciudad">{r.destino?.ciudad || "—"}</span><span className="td-dep">{r.destino?.departamento}</span></div></td>
                <td>{r.distanciaKm ? `${r.distanciaKm} km` : "—"}</td>
                <td>{r.duracionHorasEstimada ? `${r.duracionHorasEstimada} h` : "—"}</td>
                <td><strong style={{ color: C.verde }}>S/ {r.precioBase || "—"}</strong></td>
                <td><Actions onEdit={() => abrir(r)} onDel={() => setConf(r.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {modal && (
        <ModalForm titulo={modal === "nuevo" ? "Nueva ruta" : `Editar: ${form.codigo}`}
          emoji="🗺" onClose={() => setModal(null)} onSubmit={guardar} saving={saving}>
          <div className="form-grid">
            <Field label="Código *" style={{ gridColumn: "1/-1" }}><input value={form.codigo || ""} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="AYA-LIM-01" required /></Field>
            <Field label="Origen *">
              <select className="lf-select" value={form.origenId || ""} onChange={e => setForm(f => ({ ...f, origenId: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {suc.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}
              </select>
            </Field>
            <Field label="Destino *">
              <select className="lf-select" value={form.destinoId || ""} onChange={e => setForm(f => ({ ...f, destinoId: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {suc.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}
              </select>
            </Field>
            <Field label="Distancia (km)"><input type="number" value={form.distanciaKm || ""} onChange={e => setForm(f => ({ ...f, distanciaKm: e.target.value }))} placeholder="560" /></Field>
            <Field label="Duración (h)"><input type="number" step="0.5" value={form.duracionHorasEstimada || ""} onChange={e => setForm(f => ({ ...f, duracionHorasEstimada: e.target.value }))} placeholder="10.5" /></Field>
            <Field label="Precio base (S/)"><input type="number" step="0.01" value={form.precioBase || ""} onChange={e => setForm(f => ({ ...f, precioBase: e.target.value }))} placeholder="55.00" /></Field>
            <Field label="Descripción"><input value={form.descripcion || ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Opcional" /></Field>
          </div>
        </ModalForm>
      )}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => setConf(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Buses — FIX: muestra sucursal correctamente
// ═══════════════════════════════════════════════════════
function CrudBuses({ headers, showToast }) {
  const [items, setItems] = useState([]);
  const [suc, setSuc] = useState([]);
  const [load, setLoad] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [conf, setConf] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/v1/buses", { headers }),
        fetch("/api/v1/sucursales", { headers }),
      ]);
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      setItems(Array.isArray(d1) ? d1 : []);
      setSuc(Array.isArray(d2) ? d2 : []);
    } catch { showToast("⚠ Error al cargar"); }
    finally { setLoad(false); }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (b = null) => {
    setForm(b ? {
      id: b.id,
      placa: b.placa || "",
      marca: b.marca || "",
      modelo: b.modelo || "",
      anioFabricacion: b.anioFabricacion || "",
      tipo: b.tipo || "NORMAL",
      capacidadAsientos: b.capacidadAsientos?.toString() || "",
      numPisos: b.numPisos?.toString() || "1",
      // FIX: el backend retorna sucursal embebida en el objeto bus
      sucursalId: b.sucursal?.id?.toString() || b.sucursalId?.toString() || "",
    } : { placa: "", marca: "", modelo: "", anioFabricacion: "", tipo: "NORMAL", capacidadAsientos: "", numPisos: "1", sucursalId: "" });
    setModal(b || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.placa || !form.marca || !form.capacidadAsientos) return showToast("⚠ Placa, marca y capacidad son obligatorios");
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/buses/${form.id}` : "/api/v1/buses", {
        method: isEdit ? "PUT" : "POST", headers,
        body: JSON.stringify({
          placa: form.placa.toUpperCase(),
          marca: form.marca,
          modelo: form.modelo || null,
          anioFabricacion: form.anioFabricacion ? parseInt(form.anioFabricacion) : null,
          tipo: form.tipo,
          capacidadAsientos: parseInt(form.capacidadAsientos),
          numPisos: parseInt(form.numPisos) || 1,
          sucursalId: form.sucursalId ? parseInt(form.sucursalId) : null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.mensaje || "Error al guardar"); }
      const data = await res.json();
      // FIX: enriquecer con datos de sucursal para mostrarla en tabla
      if (data.sucursalId && !data.sucursal) {
        const sucFound = suc.find(s => s.id === data.sucursalId);
        if (sucFound) data.sucursal = sucFound;
      }
      setItems(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Bus actualizado" : "✓ Bus creado");
      setModal(null);
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/buses/${id}`, { method: "DELETE", headers });
      setItems(prev => prev.filter(x => x.id !== id));
      showToast("✓ Bus eliminado");
    } catch { showToast("⚠ Error"); }
    finally { setConf(null); }
  };

  // Nombre de sucursal: puede venir como objeto o como id
  const getSucNombre = (b) => {
    if (b.sucursal?.nombre) return b.sucursal.nombre;
    if (b.sucursalId) {
      const found = suc.find(s => s.id === b.sucursalId);
      return found?.nombre || `ID: ${b.sucursalId}`;
    }
    return "—";
  };

  return (
    <>
      <PageHeader title="🚌 Gestión de Buses" sub={`${items.length} buses en flota`}
        action={<button className="adm-btn-primary" onClick={() => abrir()}>+ Nuevo bus</button>} />
      <TableWrap load={load} empty={!items.length && "Sin buses registrados"}>
        <table className="adm-table">
          <thead><tr><th>Placa</th><th>Marca / Modelo</th><th>Año</th><th>Tipo</th><th>Capacidad</th><th>Sucursal</th><th>Acciones</th></tr></thead>
          <tbody>
            {items.map(b => (
              <tr key={b.id} className="tr-hover">
                <td><span className="td-codigo">{b.placa}</span></td>
                <td>
                  <strong>{b.marca}</strong>
                  {b.modelo && <span style={{ color: C.medio, fontSize: 12, marginLeft: 4 }}>· {b.modelo}</span>}
                </td>
                <td>{b.anioFabricacion || "—"}</td>
                <td><Badge text={b.tipo} /></td>
                <td>
                  <span style={{ fontWeight: 700 }}>{b.capacidadAsientos}</span>
                  <span style={{ color: C.medio, fontSize: 11 }}> asientos</span>
                </td>
                {/* FIX: mostrar sucursal correctamente */}
                <td>{getSucNombre(b)}</td>
                <td><Actions onEdit={() => abrir(b)} onDel={() => setConf(b.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {modal && (
        <ModalForm titulo={modal === "nuevo" ? "Nuevo bus" : `Editar: ${form.placa}`}
          emoji="🚌" onClose={() => setModal(null)} onSubmit={guardar} saving={saving}>
          <div className="form-grid">
            <Field label="Placa *"><input value={form.placa || ""} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} required placeholder="ABC-123" /></Field>
            <Field label="Marca *"><input value={form.marca || ""} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} required placeholder="Mercedes-Benz" /></Field>
            <Field label="Modelo"><input value={form.modelo || ""} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="OF-1721" /></Field>
            <Field label="Año fabricación"><input type="number" value={form.anioFabricacion || ""} onChange={e => setForm(f => ({ ...f, anioFabricacion: e.target.value }))} placeholder="2020" /></Field>
            <Field label="Tipo">
              <select className="lf-select" value={form.tipo || "NORMAL"} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="NORMAL">NORMAL</option>
                <option value="SEMACAMA">SEMACAMA</option>
                <option value="CAMA">CAMA</option>
                <option value="MINIBUS">MINIBUS</option>
              </select>
            </Field>
            <Field label="Capacidad *"><input type="number" value={form.capacidadAsientos || ""} onChange={e => setForm(f => ({ ...f, capacidadAsientos: e.target.value }))} required placeholder="40" /></Field>
            <Field label="Pisos"><input type="number" value={form.numPisos || "1"} onChange={e => setForm(f => ({ ...f, numPisos: e.target.value }))} min="1" max="2" /></Field>
            <Field label="Sucursal asignada">
              <select className="lf-select" value={form.sucursalId || ""} onChange={e => setForm(f => ({ ...f, sucursalId: e.target.value }))}>
                <option value="">Sin asignar</option>
                {suc.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}
              </select>
            </Field>
          </div>
        </ModalForm>
      )}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => setConf(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Viajes — FIX: conteo correcto y datos completos
// ═══════════════════════════════════════════════════════
function CrudViajes({ headers, showToast }) {
  const [items, setItems] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [load, setLoad] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [conf, setConf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/v1/viajes", { headers }),
        fetch("/api/v1/rutas", { headers }),
        fetch("/api/v1/buses", { headers }),
      ]);
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      const d3 = r3.ok ? await r3.json() : [];
      setItems(Array.isArray(d1) ? d1 : []);
      setRutas(Array.isArray(d2) ? d2 : []);
      setBuses(Array.isArray(d3) ? d3 : []);
    } catch { showToast("⚠ Error al cargar viajes"); }
    finally { setLoad(false); }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (v = null) => {
    setForm(v ? {
      id: v.id,
      rutaId: v.ruta?.id?.toString() || "",
      busId: v.bus?.id?.toString() || "",
      choferId: v.chofer?.id?.toString() || "",
      fechaHoraSalida: v.fechaHoraSalida ? v.fechaHoraSalida.slice(0, 16) : "",
      fechaHoraLlegadaEstimada: v.fechaHoraLlegadaEstimada ? v.fechaHoraLlegadaEstimada.slice(0, 16) : "",
      precioAdulto: v.precioAdulto?.toString() || "",
      precioNino: v.precioNino?.toString() || "",
      estado: v.estado || "PROGRAMADO",
    } : { rutaId: "", busId: "", choferId: "", fechaHoraSalida: "", fechaHoraLlegadaEstimada: "", precioAdulto: "", precioNino: "", estado: "PROGRAMADO" });
    setModal(v || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.rutaId || !form.busId || !form.fechaHoraSalida) return showToast("⚠ Ruta, bus y fecha son obligatorios");
    if (!form.precioAdulto || parseFloat(form.precioAdulto) <= 0) return showToast("⚠ Precio adulto obligatorio");
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/viajes/${form.id}` : "/api/v1/viajes", {
        method: isEdit ? "PUT" : "POST", headers,
        body: JSON.stringify({
          rutaId: parseInt(form.rutaId),
          busId: parseInt(form.busId),
          choferId: form.choferId ? parseInt(form.choferId) : null,
          fechaHoraSalida: form.fechaHoraSalida,
          fechaHoraLlegadaEstimada: form.fechaHoraLlegadaEstimada || null,
          precioAdulto: parseFloat(form.precioAdulto),
          precioNino: form.precioNino ? parseFloat(form.precioNino) : null,
          estado: form.estado,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.mensaje || "Error"); }
      const data = await res.json();
      setItems(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Viaje actualizado" : "✓ Viaje creado");
      setModal(null);
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/viajes/${id}`, { method: "DELETE", headers });
      setItems(prev => prev.filter(x => x.id !== id));
      showToast("✓ Viaje eliminado");
    } catch { showToast("⚠ Error"); }
    finally { setConf(null); }
  };

  const fil = filtroEstado ? items.filter(v => v.estado === filtroEstado) : items;

  // Stats rápidas
  const prog = items.filter(v => v.estado === "PROGRAMADO").length;
  const enCurso = items.filter(v => v.estado === "EN_CURSO").length;

  return (
    <>
      <PageHeader title="📅 Gestión de Viajes" sub={`${items.length} viajes totales`}
        action={<button className="adm-btn-primary" onClick={() => abrir()}>+ Nuevo viaje</button>} />

      {/* Mini stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: "Programados", val: prog, color: C.verde },
          { label: "En curso", val: enCurso, color: C.amarillo },
          { label: "Total", val: items.length, color: C.gris },
        ].map(s => (
          <div key={s.label} style={{
            background: C.blanco, border: `1.5px solid ${s.color}33`,
            borderRadius: 10, padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 12, color: C.gris }}>{s.label}</span>
          </div>
        ))}
        <select className="lf-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ marginLeft: "auto", maxWidth: 180, padding: "8px 12px" }}>
          <option value="">Todos los estados</option>
          <option value="PROGRAMADO">Programado</option>
          <option value="EN_CURSO">En curso</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <TableWrap load={load} empty={!fil.length && "Sin viajes registrados"}>
        <table className="adm-table">
          <thead><tr><th>Ruta</th><th>Bus</th><th>Salida</th><th>Llegada est.</th><th>Precio adulto</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {fil.map(v => (
              <tr key={v.id} className="tr-hover">
                <td>
                  <div className="td-lugar">
                    <span className="td-ciudad">{v.ruta?.origen?.ciudad || "—"} → {v.ruta?.destino?.ciudad || "—"}</span>
                    <span className="td-dep">{v.ruta?.codigo}</span>
                  </div>
                </td>
                <td><span className="td-codigo">{v.bus?.placa || "—"}</span></td>
                <td style={{ fontSize: 12 }}>{fmtFecha(v.fechaHoraSalida)}</td>
                <td style={{ fontSize: 12 }}>{fmtFecha(v.fechaHoraLlegadaEstimada)}</td>
                <td><strong style={{ color: C.verde }}>S/ {v.precioAdulto || "—"}</strong></td>
                <td><Badge text={v.estado} /></td>
                <td><Actions onEdit={() => abrir(v)} onDel={() => setConf(v.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {modal && (
        <ModalForm titulo={modal === "nuevo" ? "Nuevo viaje" : "Editar viaje"}
          emoji="📅" onClose={() => setModal(null)} onSubmit={guardar} saving={saving}>
          <div className="form-grid">
            <Field label="Ruta *">
              <select className="lf-select" value={form.rutaId || ""} onChange={e => setForm(f => ({ ...f, rutaId: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {rutas.map(r => <option key={r.id} value={r.id}>{r.codigo} — {r.origen?.ciudad} → {r.destino?.ciudad}</option>)}
              </select>
            </Field>
            <Field label="Bus *">
              <select className="lf-select" value={form.busId || ""} onChange={e => setForm(f => ({ ...f, busId: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.placa} — {b.marca} ({b.capacidadAsientos} asientos)</option>)}
              </select>
            </Field>
            <Field label="Fecha y hora salida *" style={{ gridColumn: "1/-1" }}>
              <input type="datetime-local" value={form.fechaHoraSalida || ""} onChange={e => setForm(f => ({ ...f, fechaHoraSalida: e.target.value }))} required />
            </Field>
            <Field label="Fecha y hora llegada estimada" style={{ gridColumn: "1/-1" }}>
              <input type="datetime-local" value={form.fechaHoraLlegadaEstimada || ""} onChange={e => setForm(f => ({ ...f, fechaHoraLlegadaEstimada: e.target.value }))} />
            </Field>
            <Field label="Precio adulto (S/) *">
              <input type="number" step="0.01" value={form.precioAdulto || ""} onChange={e => setForm(f => ({ ...f, precioAdulto: e.target.value }))} required placeholder="0.00" />
            </Field>
            <Field label="Precio niño (S/)">
              <input type="number" step="0.01" value={form.precioNino || ""} onChange={e => setForm(f => ({ ...f, precioNino: e.target.value }))} placeholder="0.00" />
            </Field>
            <Field label="Estado" style={{ gridColumn: "1/-1" }}>
              <select className="lf-select" value={form.estado || "PROGRAMADO"} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                <option value="PROGRAMADO">PROGRAMADO</option>
                <option value="EN_CURSO">EN CURSO</option>
                <option value="FINALIZADO">FINALIZADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </Field>
          </div>
        </ModalForm>
      )}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => setConf(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Clientes
// ═══════════════════════════════════════════════════════
function CrudClientes({ headers, showToast }) {
  const [items, setItems] = useState([]);
  const [load, setLoad] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [conf, setConf] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const res = await fetch("/api/v1/clientes", { headers });
      const data = res.ok ? await res.json() : {};
      setItems(Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []);
    } catch { showToast("⚠ Error al cargar"); setItems([]); }
    finally { setLoad(false); }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (c = null) => {
    setForm(c ? {
      id: c.id, nombres: c.nombres || "", apellidos: c.apellidos || "",
      dniRuc: c.dniRuc || "", email: c.email || "",
      telefono: c.telefono || "", tipoCliente: c.tipoCliente || "PERSONA",
    } : { nombres: "", apellidos: "", dniRuc: "", email: "", telefono: "", tipoCliente: "PERSONA" });
    setModal(c || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombres || !form.apellidos || !form.dniRuc) return showToast("⚠ Nombres, apellidos y DNI son obligatorios");
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/clientes/${form.id}` : "/api/v1/clientes", {
        method: isEdit ? "PUT" : "POST", headers,
        body: JSON.stringify({
          nombres: form.nombres.trim(), apellidos: form.apellidos.trim(),
          dniRuc: form.dniRuc.trim(), email: form.email?.trim() || null,
          telefono: form.telefono?.trim() || null, tipoCliente: form.tipoCliente || "PERSONA",
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.mensaje || "Error"); }
      const data = await res.json();
      setItems(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Cliente actualizado" : "✓ Cliente creado");
      setModal(null);
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/clientes/${id}`, { method: "DELETE", headers });
      setItems(prev => prev.filter(x => x.id !== id));
      showToast("✓ Cliente eliminado");
    } catch { showToast("⚠ Error"); }
    finally { setConf(null); }
  };

  const fil = items.filter(c =>
    `${c.nombres} ${c.apellidos} ${c.dniRuc}`.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <PageHeader title="👥 Gestión de Clientes" sub={`${items.length} clientes`}
        action={<button className="adm-btn-primary" onClick={() => abrir()}>+ Nuevo cliente</button>} />
      <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por nombre o DNI..." />
      <TableWrap load={load} empty={!fil.length && "Sin clientes registrados"}>
        <table className="adm-table">
          <thead><tr><th>Nombre</th><th>DNI/RUC</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Acciones</th></tr></thead>
          <tbody>
            {fil.map(c => (
              <tr key={c.id} className="tr-hover">
                <td><strong>{[c.nombres, c.apellidos].filter(Boolean).join(" ")}</strong></td>
                <td><span className="td-codigo">{c.dniRuc}</span></td>
                <td style={{ fontSize: 12 }}>{c.email || "—"}</td>
                <td>{c.telefono || "—"}</td>
                <td><Badge text={c.tipoCliente || "PERSONA"} /></td>
                <td><Actions onEdit={() => abrir(c)} onDel={() => setConf(c.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {modal && (
        <ModalForm titulo={modal === "nuevo" ? "Nuevo cliente" : `Editar: ${form.nombres}`}
          emoji="👤" onClose={() => setModal(null)} onSubmit={guardar} saving={saving}>
          <div className="form-grid">
            <Field label="Nombres *"><input value={form.nombres || ""} onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} required /></Field>
            <Field label="Apellidos *"><input value={form.apellidos || ""} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} required /></Field>
            <Field label="DNI / RUC *"><input value={form.dniRuc || ""} onChange={e => setForm(f => ({ ...f, dniRuc: e.target.value }))} required /></Field>
            <Field label="Tipo">
              <select className="lf-select" value={form.tipoCliente || "PERSONA"} onChange={e => setForm(f => ({ ...f, tipoCliente: e.target.value }))}>
                <option value="PERSONA">PERSONA</option>
                <option value="EMPRESA">EMPRESA</option>
              </select>
            </Field>
            <Field label="Email"><input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Teléfono"><input value={form.telefono || ""} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></Field>
          </div>
        </ModalForm>
      )}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => setConf(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Encomiendas
// ═══════════════════════════════════════════════════════
function CrudEncomiendas({ headers, showToast }) {
  const [items, setItems] = useState([]);
  const [load, setLoad] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [upd, setUpd] = useState(null);
  const [nuevoEst, setNuevoEst] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const r = await fetch("/api/v1/encomiendas", { headers });
      const d = r.ok ? await r.json() : [];
      setItems(Array.isArray(d) ? d : []);
    } catch { showToast("⚠ Error al cargar"); setItems([]); }
    finally { setLoad(false); }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const actualizarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEst) return showToast("⚠ Selecciona nuevo estado");
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/encomiendas/${upd.id}/estado`, {
        method: "PATCH", headers,
        body: JSON.stringify({ nuevoEstado: nuevoEst, observacion: obs || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).mensaje || "Error");
      const data = await res.json();
      setItems(prev => prev.map(x => x.id === data.id ? data : x));
      showToast("✓ Estado actualizado");
      setUpd(null);
    } catch (err) { showToast("⚠ " + err.message); }
    finally { setSaving(false); }
  };

  const fil = items.filter(e =>
    (e.numeroGuia || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (e.sucursalOrigen?.ciudad || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <PageHeader title="📦 Gestión de Encomiendas" sub={`${items.length} encomiendas`}
        action={<button className="adm-btn-outline" onClick={cargar}>↻ Actualizar</button>} />
      <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por guía u origen..." />
      <TableWrap load={load} empty={!fil.length && "Sin encomiendas"}>
        <table className="adm-table">
          <thead><tr><th>N° Guía</th><th>Contenido</th><th>Origen</th><th>Destino</th><th>Peso</th><th>Costo</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {fil.map(e => (
              <tr key={e.id} className="tr-hover">
                <td><span className="td-codigo">{e.numeroGuia || "—"}</span></td>
                <td style={{ fontSize: 12 }}>{e.descripcionContenido || "—"}</td>
                <td>{e.sucursalOrigen?.ciudad || "—"}</td>
                <td>{e.sucursalDestino?.ciudad || "—"}</td>
                <td>{e.pesoKg || "—"} kg</td>
                <td><strong style={{ color: C.verde }}>S/ {e.costo || "—"}</strong></td>
                <td><Badge text={e.estado} /></td>
                <td>
                  <button className="btn-edit" onClick={() => { setUpd(e); setNuevoEst(e.estado); setObs(""); }}>
                    Cambiar estado
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {upd && (
        <ModalForm titulo="Cambiar estado de encomienda" emoji="📦"
          onClose={() => setUpd(null)} onSubmit={actualizarEstado} saving={saving}>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <Field label="N° Guía"><input value={upd.numeroGuia || ""} disabled /></Field>
            <Field label="Nuevo estado *">
              <select className="lf-select" value={nuevoEst} onChange={e => setNuevoEst(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {["RECIBIDO","EN_ALMACEN","EN_TRANSITO","EN_DESTINO","LISTO_ENTREGA","ENTREGADO","DEVUELTO","PERDIDO"].map(s =>
                  <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                )}
              </select>
            </Field>
            <Field label="Observación">
              <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Nota adicional (opcional)" />
            </Field>
          </div>
        </ModalForm>
      )}
    </>
  );
}

// ─── Pequeños helpers de UI ───────────────────────────
function PageHeader({ title, sub, action }) {
  return (
    <div className="adm-topbar" style={{ animation: "fadeUp 0.3s ease" }}>
      <div>
        <h1 className="adm-page-title">{title}</h1>
        <p className="adm-page-sub">{sub}</p>
      </div>
      {action}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="adm-search-row">
      <div style={{ position: "relative", display: "inline-block" }}>
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.medio, fontSize: 14 }}>🔍</span>
        <input
          className="adm-search"
          style={{ paddingLeft: 32 }}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div className="lf-field" style={style}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Actions({ onEdit, onDel }) {
  return (
    <div className="td-actions">
      <button className="btn-edit" onClick={onEdit}>Editar</button>
      <button className="btn-delete" onClick={onDel}>Eliminar</button>
    </div>
  );
}

// ─── Menú de navegación ───────────────────────────────
const MENU = [
  { key: "dashboard",   icon: "⊞",  label: "Panel" },
  { key: "sucursales",  icon: "🏢", label: "Sucursales" },
  { key: "rutas",       icon: "🗺", label: "Rutas" },
  { key: "buses",       icon: "🚌", label: "autobuses" },
  { key: "viajes",      icon: "📅", label: "Viajes" },
  { key: "clientes",    icon: "👥", label: "Clientes" },
  { key: "encomiendas", icon: "📦", label: "Encomiendas" },
];

// ═══════════════════════════════════════════════════════
// LAYOUT PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { session, logout } = useAuth();
  const [seccion, setSeccion] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const toastTimer = useRef(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`,
  };

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const iniciales = (session.username || "AD").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.fondo, fontFamily: "'Source Sans 3', Arial, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sideCollapsed ? 66 : 228,
        background: C.oscuro,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        transition: "width 0.24s cubic-bezier(.4,0,.2,1)",
        flexShrink: 0, overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: "18px 14px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <LogoSVG width={34} height={34} />
          {!sideCollapsed && (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", color: C.amarillo, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>INTIWATANA</div>
              <div style={{ color: C.medio, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Administración</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {MENU.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setSeccion(key)} style={{
              width: "100%",
              background: seccion === key ? "rgba(245,197,24,0.14)" : "transparent",
              border: seccion === key ? "1.5px solid rgba(245,197,24,0.28)" : "1.5px solid transparent",
              borderRadius: 10,
              color: seccion === key ? C.amarillo : C.medio,
              padding: sideCollapsed ? "11px 0" : "10px 13px",
              cursor: "pointer", display: "flex", alignItems: "center",
              gap: 10, fontSize: 13, fontWeight: 600, textAlign: "left",
              transition: "all 0.18s", fontFamily: "inherit",
              justifyContent: sideCollapsed ? "center" : "flex-start",
            }}
              onMouseEnter={e => { if (seccion !== key) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (seccion !== key) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
              {!sideCollapsed && <span style={{ animation: "fadeIn 0.15s ease" }}>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.amarillo}, #e8a800)`,
            color: C.oscuro, fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{iniciales}</div>
          {!sideCollapsed && (
            <div style={{ flex: 1, overflow: "hidden", animation: "fadeIn 0.15s ease" }}>
              <div style={{ color: C.blanco, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.username}</div>
              <div style={{ color: C.medio, fontSize: 10 }}>Admin</div>
            </div>
          )}
          {!sideCollapsed && (
            <button onClick={logout} title="Cerrar sesión" style={{
              background: "rgba(224,82,82,0.15)", border: "1px solid rgba(224,82,82,0.3)",
              borderRadius: 7, color: "#e05252", width: 28, height: 28,
              cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            }}>⏻</button>
          )}
        </div>
      </aside>

      {/* ── CONTENIDO ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          background: C.blanco,
          borderBottom: "1px solid #e2edeb",
          padding: "0 26px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 1px 6px rgba(16,64,59,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSideCollapsed(s => !s)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 18, color: C.gris, padding: "4px 6px", borderRadius: 7,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f4f3"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >☰</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.oscuro }}>
                {MENU.find(m => m.key === seccion)?.label || "Panel"}
              </div>
              <div style={{ fontSize: 11, color: C.medio }}>Sistema Web INTIWATANA S.R.L.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.gris }}>
              {new Date().toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "long" })}
            </div>
            <button onClick={logout} style={{
              background: "rgba(224,82,82,0.08)", color: C.rojo,
              border: "1px solid rgba(224,82,82,0.2)", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(224,82,82,0.16)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(224,82,82,0.08)"}
            >Cerrar sesión</button>
          </div>
        </header>

        {/* Área principal */}
        <main style={{ flex: 1, padding: "22px 26px", overflowY: "auto" }}>
          {seccion === "dashboard"   && <DashboardHome    headers={headers} onNav={setSeccion} />}
          {seccion === "sucursales"  && <CrudSucursales   headers={headers} showToast={showToast} />}
          {seccion === "rutas"       && <CrudRutas        headers={headers} showToast={showToast} />}
          {seccion === "buses"       && <CrudBuses        headers={headers} showToast={showToast} />}
          {seccion === "viajes"      && <CrudViajes       headers={headers} showToast={showToast} />}
          {seccion === "clientes"    && <CrudClientes     headers={headers} showToast={showToast} />}
          {seccion === "encomiendas" && <CrudEncomiendas  headers={headers} showToast={showToast} />}
        </main>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 22, right: 22,
          background: toast.startsWith("⚠") ? C.rojo : C.oscuro,
          color: C.blanco, padding: "13px 22px", borderRadius: 12,
          fontSize: 14, fontWeight: 600,
          boxShadow: "0 6px 24px rgba(0,0,0,0.28)",
          zIndex: 9999, animation: "slideUp 0.28s cubic-bezier(.4,0,.2,1)",
          display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
          maxWidth: 360,
        }}>
          {toast}
        </div>
      )}

      {/* ── ESTILOS GLOBALES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Sans+3:wght@400;600;700&display=swap');

        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        @keyframes modalIn  { from { opacity:0; transform:scale(0.96) translateY(10px) } to { opacity:1; transform:none } }
        @keyframes spin     { to { transform:rotate(360deg) } }
        @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes skeletonShimmer {
          0%   { background-position: -400px 0 }
          100% { background-position:  400px 0 }
        }

        .pulse-logo { font-size:50px; animation:pulse 1.4s ease infinite; display:inline-block; }

        /* Skeleton loading */
        .td-loading { padding:1rem 0; }
        .skeleton-rows { display:flex; flex-direction:column; gap:10px; padding:1rem 1.2rem; }
        .skeleton-row {
          height:38px; border-radius:8px;
          background: linear-gradient(90deg, #e8f0ee 25%, #f4f9f8 50%, #e8f0ee 75%);
          background-size: 800px 100%;
          animation: skeletonShimmer 1.4s infinite linear;
        }

        .spinner {
          display:inline-block; width:16px; height:16px;
          border:2.5px solid rgba(255,255,255,0.3);
          border-top-color:#fff;
          border-radius:50%; animation:spin 0.7s linear infinite;
        }

        /* Layout */
        .adm-topbar { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:1rem; flex-wrap:wrap; }
        .adm-page-title { font-family:'Playfair Display',serif; font-size:1.55rem; font-weight:800; color:${C.oscuro}; margin:0; }
        .adm-page-sub   { font-size:13px; color:${C.medio}; margin:3px 0 0; }

        /* Botones */
        .adm-btn-primary { background:${C.verde}; color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.18s; }
        .adm-btn-primary:hover { background:${C.oscuro}; transform:translateY(-1px); box-shadow:0 4px 14px ${C.verde}44; }
        .adm-btn-outline { background:transparent; color:${C.verde}; border:1.5px solid ${C.verde}; border-radius:10px; padding:9px 18px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.18s; }
        .adm-btn-outline:hover { background:${C.verde}12; }

        /* Búsqueda */
        .adm-search-row  { margin-bottom:14px; }
        .adm-search      { border:1.5px solid #d4dbd9; border-radius:10px; padding:9px 14px; font-size:13px; font-family:inherit; color:${C.oscuro}; background:#fff; outline:none; width:280px; transition:border 0.18s; }
        .adm-search:focus{ border-color:${C.verde}; box-shadow:0 0 0 3px ${C.verde}14; }

        /* Tabla */
        .adm-table-wrap  { background:#fff; border-radius:14px; border:1.5px solid rgba(18,115,105,0.09); overflow:hidden; overflow-x:auto; }
        .adm-table       { width:100%; border-collapse:collapse; font-size:13px; }
        .adm-table th    { background:#f4f9f8; padding:11px 15px; text-align:left; font-size:10.5px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:${C.medio}; border-bottom:1.5px solid rgba(18,115,105,0.07); white-space:nowrap; }
        .adm-table td    { padding:11px 15px; border-bottom:1px solid rgba(18,115,105,0.05); color:${C.oscuro}; vertical-align:middle; }
        .adm-table tr:last-child td { border-bottom:none; }
        .tr-hover:hover td { background:#f6fbfa; transition:background 0.12s; }
        .td-empty  { text-align:center; color:${C.medio}; padding:3.5rem; font-size:14px; }
        .td-codigo { font-family:monospace; font-size:11.5px; background:rgba(18,115,105,0.09); color:${C.verde}; border-radius:6px; padding:2px 8px; font-weight:700; }
        .td-lugar  { display:flex; flex-direction:column; gap:2px; }
        .td-ciudad { font-weight:700; font-size:13px; }
        .td-dep    { font-size:11px; color:${C.medio}; }
        .td-actions{ display:flex; gap:6px; }

        /* Botones de acción */
        .btn-edit          { background:rgba(18,115,105,0.09); color:${C.verde}; border:none; border-radius:7px; padding:5px 12px; font-size:12px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.15s; }
        .btn-edit:hover    { background:rgba(18,115,105,0.2); }
        .btn-delete        { background:rgba(224,82,82,0.09); color:${C.rojo}; border:none; border-radius:7px; padding:5px 12px; font-size:12px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.15s; }
        .btn-delete:hover  { background:rgba(224,82,82,0.2); }
        .btn-delete-confirm{ background:${C.rojo}; color:#fff; border:none; border-radius:9px; padding:10px 22px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.15s; }
        .btn-delete-confirm:hover { background:#c0392b; }
        .btn-cancelar      { background:#f0f4f3; color:${C.gris}; border:1.5px solid #d4dbd9; border-radius:9px; padding:10px 18px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; }
        .btn-cancelar:hover{ background:#e8efed; }
        .btn-reservar      { background:${C.verde}; color:#fff; border:none; border-radius:10px; padding:10px 22px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; flex:1; transition:all 0.18s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-reservar:hover:not(:disabled){ background:${C.oscuro}; }
        .btn-reservar:disabled{ opacity:0.6; cursor:not-allowed; }

        /* Formulario */
        .form-grid  { display:grid; grid-template-columns:1fr 1fr; gap:0 1.1rem; }
        .lf-field   { margin-bottom:1rem; }
        .lf-field label { display:block; font-size:10.5px; font-weight:700; color:${C.gris}; margin-bottom:5px; letter-spacing:0.08em; text-transform:uppercase; }
        .lf-field input, .lf-select { width:100%; border:1.5px solid #d4dbd9; border-radius:9px; padding:10px 13px; font-size:13px; font-family:inherit; color:${C.oscuro}; background:#fff; outline:none; box-sizing:border-box; transition:border 0.18s; }
        .lf-field input:focus, .lf-select:focus { border-color:${C.verde}; box-shadow:0 0 0 3px ${C.verde}14; }
        .lf-field input:disabled { background:#f5f7f6; color:${C.medio}; cursor:not-allowed; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.46); display:flex; align-items:center; justify-content:center; z-index:9998; backdrop-filter:blur(2px); }
        .modal         { background:#fff; border-radius:16px; max-width:520px; width:95%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.26); }
        .modal-header  { display:flex; align-items:center; gap:14px; padding:20px 24px; border-bottom:1px solid #f0f4f3; }
        .modal-badge   { width:44px; height:44px; border-radius:11px; background:rgba(18,115,105,0.1); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .modal-title   { font-weight:700; font-size:16px; color:${C.oscuro}; margin:0; }
        .modal-subtitle{ font-size:12px; color:${C.medio}; margin:4px 0 0; }
        .modal-close   { background:transparent; border:none; color:${C.medio}; font-size:22px; cursor:pointer; padding:0; margin-left:auto; line-height:1; transition:color 0.15s; }
        .modal-close:hover { color:${C.oscuro}; }
        .modal-body    { padding:20px 24px; }
        .modal-body form { display:flex; flex-direction:column; }
        .confirm-modal { max-width:360px; }

        /* Cards de panel */
        .card-panel    { background:#fff; border-radius:14px; padding:18px 20px; box-shadow:0 2px 12px rgba(16,64,59,0.06); border:1.5px solid #e2edeb; }
        .panel-title   { font-weight:700; font-size:13px; color:${C.oscuro}; margin-bottom:14px; }

        /* Quick btn */
        .quick-btn {
          background:#f4f9f8; border:1.5px solid #e2edeb; border-radius:9px;
          padding:9px 13px; cursor:pointer; display:flex; align-items:center;
          gap:9px; font-size:13px; color:${C.oscuro}; font-weight:600;
          text-align:left; transition:all 0.15s; font-family:inherit; width:100%;
        }
        .quick-btn:hover { background:rgba(18,115,105,0.08); border-color:${C.verde}; transform:translateX(3px); }

        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#c5d5d3; border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#a0b8b5; }
      `}</style>
    </div>
  );
}