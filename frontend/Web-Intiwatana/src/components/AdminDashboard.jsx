import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ─── Paleta ───────────────────────────────────────────
const C = {
  verde:     "#127369",
  oscuro:    "#10403B",
  amarillo:  "#F5C518",
  medio:     "#8AA6A3",
  gris:      "#4C5958",
  fondo:     "#f4f7f6",
  blanco:    "#ffffff",
};

// ─── Helpers ──────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString("es-PE"); }
function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

// ─── Mini Gráfico de barras ───────────────────────────
function BarChart({ data, colorActual, colorMin }) {
  if (!data.length) return <div style={{ color: C.medio, fontSize: 13, padding: "1rem 0" }}>Sin datos</div>;
  const max = Math.max(...data.flatMap(d => [d.actual, d.minimo])) || 1;
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:16, height:120, padding:"8px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:90 }}>
            <div title={`Actual: ${d.actual}`} style={{
              width:18, background: colorActual,
              height: `${(d.actual/max)*90}px`,
              borderRadius:"3px 3px 0 0", transition:"height 0.5s"
            }}/>
            <div title={`Mínimo: ${d.minimo}`} style={{
              width:18, background: colorMin,
              height: `${(d.minimo/max)*90}px`,
              borderRadius:"3px 3px 0 0", transition:"height 0.5s"
            }}/>
          </div>
          <span style={{ fontSize:10, color: C.gris, textAlign:"center", maxWidth:60, lineHeight:1.2 }}>{d.nombre}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Gráfico de dona ─────────────────────────────
function DonutChart({ data }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.valor, 0) || 1;
  const colores = [C.verde, C.amarillo, "#e74c3c", "#9b59b6", "#3498db", "#e67e22", "#1abc9c"];
  let acum = 0;
  const arcos = data.map((d, i) => {
    const pct = d.valor / total;
    const ini = acum;
    acum += pct;
    const a1 = ini * 2 * Math.PI - Math.PI/2;
    const a2 = acum * 2 * Math.PI - Math.PI/2;
    const R = 60, r = 35, cx = 70, cy = 70;
    const x1e = cx + R * Math.cos(a1), y1e = cy + R * Math.sin(a1);
    const x2e = cx + R * Math.cos(a2), y2e = cy + R * Math.sin(a2);
    const x1i = cx + r * Math.cos(a2), y1i = cy + r * Math.sin(a2);
    const x2i = cx + r * Math.cos(a1), y2i = cy + r * Math.sin(a1);
    const grande = pct > 0.5 ? 1 : 0;
    return { path: `M${x1e},${y1e} A${R},${R} 0 ${grande},1 ${x2e},${y2e} L${x1i},${y1i} A${r},${r} 0 ${grande},0 ${x2i},${y2i} Z`, color: colores[i % colores.length], label: d.nombre, valor: d.valor };
  });
  return (
    <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:16 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {arcos.map((a, i) => <path key={i} d={a.path} fill={a.color} stroke={C.blanco} strokeWidth={2}/>)}
        <circle cx={70} cy={70} r={30} fill={C.blanco}/>
        <text x={70} y={74} textAnchor="middle" fontSize={11} fill={C.gris} fontFamily="Arial">{total}</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {arcos.map((a, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.gris }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:a.color, flexShrink:0 }}/>
            <span>{a.label}</span>
            <span style={{ fontWeight:700, color:C.oscuro, marginLeft:"auto", paddingLeft:8 }}>{a.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card de estadística ──────────────────────────────
function StatCard({ icon, valor, label, color, alerta }) {
  return (
    <div style={{
      background: C.blanco, borderRadius: 14, padding: "18px 20px",
      border: `1.5px solid ${alerta ? color+"44" : "#e8eeec"}`,
      boxShadow: "0 2px 12px rgba(16,64,59,0.06)",
      display:"flex", flexDirection:"column", gap:6, position:"relative",
      minWidth: 0,
    }}>
      {alerta && <div style={{ position:"absolute", top:12, right:12, width:8, height:8, borderRadius:"50%", background:color }}/>}
      <div style={{ fontSize:22 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:800, color: C.oscuro, lineHeight:1 }}>{valor}</div>
      <div style={{ fontSize:11, fontWeight:700, color:C.medio, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────
function Badge({ text, tipo }) {
  const colors = {
    PROGRAMADO:   { bg:"rgba(18,115,105,0.12)", c:C.verde },
    EN_CURSO:     { bg:"rgba(245,197,24,0.18)",  c:"#b8860b" },
    FINALIZADO:   { bg:"rgba(52,199,89,0.15)",   c:"#15803d" },
    CANCELADO:    { bg:"rgba(220,38,38,0.12)",   c:"#dc2626" },
    ACTIVO:       { bg:"rgba(18,115,105,0.12)", c:C.verde },
    USADO:        { bg:"rgba(52,199,89,0.15)",   c:"#15803d" },
    RECIBIDO:     { bg:"rgba(245,197,24,0.18)",  c:"#b8860b" },
    EN_TRANSITO:  { bg:"rgba(18,115,105,0.12)", c:C.verde },
    ENTREGADO:    { bg:"rgba(52,199,89,0.15)",   c:"#15803d" },
    NORMAL:       { bg:"rgba(18,115,105,0.12)", c:C.verde },
    SEMACAMA:     { bg:"rgba(245,197,24,0.18)",  c:"#b8860b" },
    CAMA:         { bg:"rgba(18,115,105,0.12)", c:C.verde },
    MINIBUS:      { bg:"rgba(138,166,163,0.15)", c:C.gris },
    PERSONA:      { bg:"rgba(18,115,105,0.12)", c:C.verde },
    EMPRESA:      { bg:"rgba(245,197,24,0.18)",  c:"#b8860b" },
  };
  const s = colors[text] || { bg:"rgba(138,166,163,0.15)", c:C.gris };
  return (
    <span style={{ background:s.bg, color:s.c, borderRadius:50, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
      {text?.replace(/_/g," ")}
    </span>
  );
}

// ─── CRUD: Sucursales ─────────────────────────────────
function CrudSucursales({ headers, showToast }) {
  const [items, S] = useState([]);
  const [load, SL] = useState(true);
  const [modal, SM] = useState(null);
  const [form, SF] = useState({});
  const [conf, SC] = useState(null);
  const [saving, SSV] = useState(false);

  const cargar = useCallback(async () => {
    SL(true);
    try {
      const res = await fetch("/api/v1/sucursales", { headers });
      const data = res.ok ? await res.json() : [];
      S(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargar sucursales:", e);
      showToast("⚠ Error al cargar");
      S([]);
    } finally {
      SL(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrir = (s = null) => {
    SF(s ? {
      id: s.id,
      codigo: s.codigo || "",
      nombre: s.nombre || "",
      ciudad: s.ciudad || "",
      departamento: s.departamento || "",
      provincia: s.provincia || "",
      direccion: s.direccion || "",
      telefono: s.telefono || "",
      email: s.email || "",
      esTerminal: s.esTerminal ? "true" : "false"
    } : { codigo: "", nombre: "", ciudad: "", departamento: "", provincia: "", direccion: "", telefono: "", email: "", esTerminal: "false" });
    SM(s || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!form.codigo || !form.codigo.trim()) {
      showToast("⚠ Código es obligatorio");
      return;
    }
    if (!form.nombre || !form.nombre.trim()) {
      showToast("⚠ Nombre es obligatorio");
      return;
    }
    if (!form.ciudad || !form.ciudad.trim()) {
      showToast("⚠ Ciudad es obligatoria");
      return;
    }
    if (!form.departamento || !form.departamento.trim()) {
      showToast("⚠ Departamento es obligatorio");
      return;
    }

    SSV(true);
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

      console.log("Enviando sucursal:", body);

      const res = await fetch(
        isEdit ? `/api/v1/sucursales/${form.id}` : "/api/v1/sucursales",
        {
          method: isEdit ? "PUT" : "POST",
          headers,
          body: JSON.stringify(body)
        }
      );

      const responseText = await res.text();
      console.log("Respuesta status:", res.status);
      console.log("Respuesta body:", responseText);

      if (!res.ok) {
        try {
          const errorData = JSON.parse(responseText);
          const errorMsg = errorData.errores ? errorData.errores.join(", ") : errorData.mensaje || "Error desconocido";
          throw new Error(errorMsg);
        } catch (parseError) {
          throw new Error(responseText || "Error al guardar");
        }
      }

      const data = JSON.parse(responseText);
      S(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Sucursal actualizada" : "✓ Sucursal creada");
      SM(null);
    } catch (e) {
      console.error("Error completo:", e);
      showToast("⚠ " + (e.message || "Error desconocido"));
    } finally {
      SSV(false);
    }
  };

  const eliminar = async (id) => {
    try {
      const res = await fetch(`/api/v1/sucursales/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("No se pudo eliminar");
      S(prev => prev.filter(x => x.id !== id));
      showToast("✓ Sucursal eliminada");
    } catch (e) {
      console.error("Error eliminar:", e);
      showToast("⚠ Error: " + e.message);
    } finally {
      SC(null);
    }
  };

  return (
    <>
      <div className="adm-topbar"><div><h1 className="adm-page-title">🏢 Gestión de Sucursales</h1><p className="adm-page-sub">{items.length} sucursales registradas</p></div><button className="adm-btn-primary" onClick={() => abrir()}>+ Nueva sucursal</button></div>
      <div className="adm-table-wrap">
        {load ? (
          <div className="td-empty">Cargando...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ciudad</th>
                <th>Departamento</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Terminal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td-empty">
                    Sin sucursales registradas
                  </td>
                </tr>
              ) : (
                items.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.nombre}</strong></td>
                    <td>{s.ciudad}</td>
                    <td>{s.departamento || "—"}</td>
                    <td style={{ fontSize: 12 }}>{s.direccion || "—"}</td>
                    <td>{s.telefono || "—"}</td>
                    <td><Badge text={s.esTerminal ? "SÍ" : "NO"} tipo="estado" /></td>
                    <td><div className="td-actions"><button className="btn-edit" onClick={() => abrir(s)}>Editar</button><button className="btn-delete" onClick={() => SC(s.id)}>Eliminar</button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <ModalForm
          titulo={modal === "nuevo" ? "Nueva sucursal" : `Editar: ${form.nombre}`}
          emoji="🏢"
          onClose={() => SM(null)}
          onSubmit={guardar}
          saving={saving}
        >
          <div className="form-grid">
            <div className="lf-field">
              <label>Código *</label>
              <input value={form.codigo || ""} onChange={e => SF(f => ({ ...f, codigo: e.target.value }))} placeholder="SUC-AYA-01" required style={{ textTransform: "uppercase" }} />
            </div>
            <div className="lf-field" style={{ gridColumn: "span 1" }}>
              <label>Nombre *</label>
              <input value={form.nombre || ""} onChange={e => SF(f => ({ ...f, nombre: e.target.value }))} placeholder="Terminal Central" required />
            </div>
            <div className="lf-field"><label>Ciudad *</label><input value={form.ciudad || ""} onChange={e => SF(f => ({ ...f, ciudad: e.target.value }))} placeholder="Ayacucho" required /></div>
            <div className="lf-field"><label>Departamento *</label><input value={form.departamento || ""} onChange={e => SF(f => ({ ...f, departamento: e.target.value }))} placeholder="Ayacucho" required /></div>
            <div className="lf-field"><label>Provincia</label><input value={form.provincia || ""} onChange={e => SF(f => ({ ...f, provincia: e.target.value }))} placeholder="Huamanga" /></div>
            <div className="lf-field" style={{ gridColumn: "1/-1" }}><label>Dirección</label><input value={form.direccion || ""} onChange={e => SF(f => ({ ...f, direccion: e.target.value }))} placeholder="Av. Cusco 362" /></div>
            <div className="lf-field"><label>Teléfono</label><input value={form.telefono || ""} onChange={e => SF(f => ({ ...f, telefono: e.target.value }))} placeholder="(066) 312-000" /></div>
            <div className="lf-field"><label>Email</label><input type="email" value={form.email || ""} onChange={e => SF(f => ({ ...f, email: e.target.value }))} placeholder="contacto@sucursal.com" /></div>
            <div className="lf-field"><label>¿Es terminal?</label><select value={form.esTerminal || "false"} onChange={e => SF(f => ({ ...f, esTerminal: e.target.value }))} className="lf-select"><option value="false">No</option><option value="true">Sí</option></select></div>
          </div>
        </ModalForm>
      )}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => SC(null)} />}
    </>
  );
}

// ─── CRUD: Rutas ──────────────────────────────────────
function CrudRutas({ headers, showToast }) {
  const [rutas,S] = useState([]);
  const [suc,SS] = useState([]);
  const [load,SL] = useState(true);
  const [modal,SM] = useState(null);
  const [form,SF] = useState({});
  const [conf,SC] = useState(null);
  const [buscar,SB] = useState("");
  const [saving,SSV] = useState(false);

  const cargar = useCallback(async () => {
    SL(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/v1/rutas", { headers }),
        fetch("/api/v1/sucursales", { headers })
      ]);
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      S(Array.isArray(d1) ? d1 : []);
      SS(Array.isArray(d2) ? d2 : []);
    } catch (e) {
      console.error("Error:", e);
      showToast("⚠ Error al cargar");
      S([]);
      SS([]);
    } finally {
      SL(false);
    }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (r = null) => {
    SF(r ? {
      id: r.id,
      codigo: r.codigo || "",
      origenId: r.origen?.id?.toString() || "",
      destinoId: r.destino?.id?.toString() || "",
      distanciaKm: r.distanciaKm?.toString() || "",
      duracionHorasEstimada: r.duracionHorasEstimada?.toString() || "",
      precioBase: r.precioBase?.toString() || "",
      descripcion: r.descripcion || ""
    } : { codigo: "", origenId: "", destinoId: "", distanciaKm: "", duracionHorasEstimada: "", precioBase: "", descripcion: "" });
    SM(r || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.codigo || !form.origenId || !form.destinoId) {
      showToast("⚠ Código, origen y destino obligatorios");
      return;
    }
    if (form.origenId === form.destinoId) {
      showToast("⚠ Origen y destino no pueden ser iguales");
      return;
    }
    SSV(true);
    try {
      const isEdit = !!form.id;
      const body = {
        codigo: form.codigo.trim(),
        origenId: parseInt(form.origenId),
        destinoId: parseInt(form.destinoId),
        distanciaKm: form.distanciaKm ? parseFloat(form.distanciaKm) : null,
        duracionHorasEstimada: form.duracionHorasEstimada ? parseFloat(form.duracionHorasEstimada) : null,
        precioBase: form.precioBase ? parseFloat(form.precioBase) : null,
        descripcion: form.descripcion ? form.descripcion.trim() : null
      };
      const res = await fetch(isEdit ? `/api/v1/rutas/${form.id}` : "/api/v1/rutas", {
        method: isEdit ? "PUT" : "POST",
        headers,
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      S(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Ruta actualizada" : "✓ Ruta creada");
      SM(null);
    } catch (e) {
      showToast("⚠ " + (e.message || "Error"));
    } finally {
      SSV(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/rutas/${id}`, { method: "DELETE", headers });
      S(prev => prev.filter(x => x.id !== id));
      showToast("✓ Ruta eliminada");
    } catch (e) {
      showToast("⚠ Error");
    } finally {
      SC(null);
    }
  };

  const fil = rutas.filter(r =>
    (r.codigo || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (r.origen?.ciudad || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <div className="adm-topbar"><div><h1 className="adm-page-title">🗺 Gestión de Rutas</h1><p className="adm-page-sub">{rutas.length} rutas</p></div><button className="adm-btn-primary" onClick={() => abrir()}>+ Nueva ruta</button></div>
      <div className="adm-search-row"><input className="adm-search" placeholder="Buscar por código u origen..." value={buscar} onChange={e => SB(e.target.value)} /></div>
      <div className="adm-table-wrap">
        {load ? <div className="td-empty">Cargando...</div> : (
          <table className="adm-table">
            <thead><tr><th>Código</th><th>Origen</th><th>Destino</th><th>Distancia</th><th>Duración</th><th>Precio</th><th>Acciones</th></tr></thead>
            <tbody>
              {fil.length === 0 ? <tr><td colSpan={7} className="td-empty">Sin resultados</td></tr> : fil.map(r => (
                <tr key={r.id}>
                  <td><span className="td-codigo">{r.codigo}</span></td>
                  <td><div className="td-lugar"><span className="td-ciudad">{r.origen?.ciudad || "—"}</span><span className="td-dep">{r.origen?.departamento}</span></div></td>
                  <td><div className="td-lugar"><span className="td-ciudad">{r.destino?.ciudad || "—"}</span><span className="td-dep">{r.destino?.departamento}</span></div></td>
                  <td>{r.distanciaKm ? `${r.distanciaKm} km` : "—"}</td>
                  <td>{r.duracionHorasEstimada ? `${r.duracionHorasEstimada} h` : "—"}</td>
                  <td>{r.precioBase ? `S/ ${r.precioBase}` : "—"}</td>
                  <td><div className="td-actions"><button className="btn-edit" onClick={() => abrir(r)}>Editar</button><button className="btn-delete" onClick={() => SC(r.id)}>Eliminar</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && <ModalForm titulo={modal === "nuevo" ? "Nueva ruta" : `Editar: ${form.codigo}`} emoji="🗺" onClose={() => SM(null)} onSubmit={guardar} saving={saving}>
        <div className="form-grid">
          <div className="lf-field" style={{gridColumn:"1/-1"}}><label>Código *</label><input value={form.codigo || ""} onChange={e => SF(f => ({ ...f, codigo: e.target.value }))} placeholder="AYA-LIM-01" required /></div>
          <div className="lf-field"><label>Origen *</label><select value={form.origenId || ""} onChange={e => SF(f => ({ ...f, origenId: e.target.value }))} className="lf-select" required><option value="">Seleccionar...</option>{suc.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
          <div className="lf-field"><label>Destino *</label><select value={form.destinoId || ""} onChange={e => SF(f => ({ ...f, destinoId: e.target.value }))} className="lf-select" required><option value="">Seleccionar...</option>{suc.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
          <div className="lf-field"><label>Distancia (km)</label><input type="number" value={form.distanciaKm || ""} onChange={e => SF(f => ({ ...f, distanciaKm: e.target.value }))} placeholder="560" /></div>
          <div className="lf-field"><label>Duración (h)</label><input type="number" step="0.5" value={form.duracionHorasEstimada || ""} onChange={e => SF(f => ({ ...f, duracionHorasEstimada: e.target.value }))} placeholder="10.5" /></div>
          <div className="lf-field"><label>Precio base</label><input type="number" step="0.01" value={form.precioBase || ""} onChange={e => SF(f => ({ ...f, precioBase: e.target.value }))} placeholder="55.00" /></div>
          <div className="lf-field" style={{gridColumn:"1/-1"}}><label>Descripción</label><input value={form.descripcion || ""} onChange={e => SF(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción (opcional)" /></div>
        </div>
      </ModalForm>}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => SC(null)} />}
    </>
  );
}

// ─── CRUD: Buses ──────────────────────────────────────
function CrudBuses({ headers, showToast }) {
  const [items, S] = useState([]);
  const [suc, SS] = useState([]);
  const [load, SL] = useState(true);
  const [modal, SM] = useState(null);
  const [form, SF] = useState({});
  const [conf, SC] = useState(null);
  const [saving, SSV] = useState(false);

  const cargar = useCallback(async () => {
    SL(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/v1/buses", { headers }),
        fetch("/api/v1/sucursales", { headers })
      ]);
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      S(Array.isArray(d1) ? d1 : []);
      SS(Array.isArray(d2) ? d2 : []);
    } catch (e) {
      console.error("Error cargar buses:", e);
      showToast("⚠ Error al cargar buses");
    } finally {
      SL(false);
    }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (b = null) => {
    SF(b ? {
      id: b.id,
      placa: b.placa || "",
      marca: b.marca || "",
      modelo: b.modelo || "",
      anioFabricacion: b.anioFabricacion || "",
      tipo: b.tipo || "NORMAL",
      capacidadAsientos: b.capacidadAsientos?.toString() || "",
      numPisos: b.numPisos?.toString() || "1",
      sucursalId: b.sucursal?.id?.toString() || ""
    } : { placa: "", marca: "", modelo: "", anioFabricacion: "", tipo: "NORMAL", capacidadAsientos: "", numPisos: "1", sucursalId: "" });
    SM(b || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.placa || !form.marca || !form.capacidadAsientos) {
      showToast("⚠ Placa, marca y capacidad obligatorios");
      return;
    }
    SSV(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/buses/${form.id}` : "/api/v1/buses", {
        method: isEdit ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          placa: form.placa.toUpperCase(),
          marca: form.marca,
          modelo: form.modelo || null,
          anioFabricacion: form.anioFabricacion ? parseInt(form.anioFabricacion) : null,
          tipo: form.tipo,
          capacidadAsientos: parseInt(form.capacidadAsientos),
          numPisos: parseInt(form.numPisos) || 1,
          sucursalId: form.sucursalId ? parseInt(form.sucursalId) : null
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      S(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Bus actualizado" : "✓ Bus creado");
      SM(null);
    } catch (e) {
      console.error("Error guardar:", e);
      showToast("⚠ " + (e.message || "Error"));
    } finally {
      SSV(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/buses/${id}`, { method: "DELETE", headers });
      S(prev => prev.filter(x => x.id !== id));
      showToast("✓ Bus eliminado");
    } catch (e) {
      showToast("⚠ Error");
    } finally {
      SC(null);
    }
  };

  return (
    <>
      <div className="adm-topbar"><div><h1 className="adm-page-title">🚌 Gestión de Buses</h1><p className="adm-page-sub">{items.length} buses</p></div><button className="adm-btn-primary" onClick={() => abrir()}>+ Nuevo bus</button></div>
      <div className="adm-table-wrap">
        {load ? <div className="td-empty">Cargando...</div> : (
          <table className="adm-table">
            <thead><tr><th>Placa</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Tipo</th><th>Capacidad</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={7} className="td-empty">Sin buses</td></tr> : items.map(b => (
                <tr key={b.id}>
                  <td><span className="td-codigo">{b.placa}</span></td>
                  <td>{b.marca}</td>
                  <td>{b.modelo || "—"}</td>
                  <td>{b.anioFabricacion || "—"}</td>
                  <td><Badge text={b.tipo} tipo="estado" /></td>
                  <td>{b.capacidadAsientos} asientos</td>
                  <td><div className="td-actions"><button className="btn-edit" onClick={() => abrir(b)}>Editar</button><button className="btn-delete" onClick={() => SC(b.id)}>Eliminar</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && <ModalForm titulo={modal === "nuevo" ? "Nuevo bus" : `Editar: ${form.placa}`} emoji="🚌" onClose={() => SM(null)} onSubmit={guardar} saving={saving}>
        <div className="form-grid">
          <div className="lf-field"><label>Placa *</label><input value={form.placa || ""} onChange={e => SF(f => ({ ...f, placa: e.target.value }))} required /></div>
          <div className="lf-field"><label>Marca *</label><input value={form.marca || ""} onChange={e => SF(f => ({ ...f, marca: e.target.value }))} required /></div>
          <div className="lf-field"><label>Modelo</label><input value={form.modelo || ""} onChange={e => SF(f => ({ ...f, modelo: e.target.value }))} /></div>
          <div className="lf-field"><label>Año</label><input type="number" value={form.anioFabricacion || ""} onChange={e => SF(f => ({ ...f, anioFabricacion: e.target.value }))} /></div>
          <div className="lf-field"><label>Tipo</label><select value={form.tipo || "NORMAL"} onChange={e => SF(f => ({ ...f, tipo: e.target.value }))} className="lf-select"><option value="NORMAL">NORMAL</option><option value="SEMACAMA">SEMACAMA</option><option value="CAMA">CAMA</option><option value="MINIBUS">MINIBUS</option></select></div>
          <div className="lf-field"><label>Capacidad *</label><input type="number" value={form.capacidadAsientos || ""} onChange={e => SF(f => ({ ...f, capacidadAsientos: e.target.value }))} required /></div>
          <div className="lf-field"><label>Pisos</label><input type="number" value={form.numPisos || "1"} onChange={e => SF(f => ({ ...f, numPisos: e.target.value }))} min="1" max="2" /></div>
          <div className="lf-field" style={{gridColumn:"1/-1"}}><label>Sucursal</label><select value={form.sucursalId || ""} onChange={e => SF(f => ({ ...f, sucursalId: e.target.value }))} className="lf-select"><option value="">Sin asignar</option>{suc.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
        </div>
      </ModalForm>}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => SC(null)} />}
    </>
  );
}

// ─── CRUD: Viajes ─────────────────────────────────────
function CrudViajes({ headers, showToast }) {
  const [items, S] = useState([]);
  const [rutas, SR] = useState([]);
  const [buses, SB] = useState([]);
  const [load, SL] = useState(true);
  const [modal, SM] = useState(null);
  const [form, SF] = useState({});
  const [conf, SC] = useState(null);
  const [saving, SSV] = useState(false);

  const cargar = useCallback(async () => {
    SL(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/v1/viajes", { headers }),
        fetch("/api/v1/rutas", { headers }),
        fetch("/api/v1/buses", { headers })
      ]);
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      const d3 = r3.ok ? await r3.json() : [];
      S(Array.isArray(d1) ? d1 : []);
      SR(Array.isArray(d2) ? d2 : []);
      SB(Array.isArray(d3) ? d3 : []);
    } catch (e) {
      console.error("Error cargar viajes:", e);
      showToast("⚠ Error al cargar");
    } finally {
      SL(false);
    }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (v = null) => {
    SF(v ? {
      id: v.id,
      rutaId: v.ruta?.id?.toString() || "",
      busId: v.bus?.id?.toString() || "",
      choferId: v.chofer?.id?.toString() || "",
      fechaHoraSalida: v.fechaHoraSalida ? v.fechaHoraSalida.slice(0, 16) : "",
      fechaHoraLlegadaEstimada: v.fechaHoraLlegadaEstimada ? v.fechaHoraLlegadaEstimada.slice(0, 16) : "",
      precioAdulto: v.precioAdulto?.toString() || "",
      precioNino: v.precioNino?.toString() || "",
      estado: v.estado || "PROGRAMADO"
    } : { rutaId: "", busId: "", choferId: "", fechaHoraSalida: "", fechaHoraLlegadaEstimada: "", precioAdulto: "", precioNino: "", estado: "PROGRAMADO" });
    SM(v || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.rutaId || !form.busId || !form.fechaHoraSalida) {
      showToast("⚠ Ruta, bus y fecha obligatorios");
      return;
    }
    if (!form.precioAdulto || parseFloat(form.precioAdulto) <= 0) {
      showToast("⚠ El precio para adulto es obligatorio");
      return;
    }
    SSV(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/viajes/${form.id}` : "/api/v1/viajes", {
        method: isEdit ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          rutaId: parseInt(form.rutaId),
          busId: parseInt(form.busId),
          choferId: form.choferId ? parseInt(form.choferId) : null,
          fechaHoraSalida: form.fechaHoraSalida,
          fechaHoraLlegadaEstimada: form.fechaHoraLlegadaEstimada || null,
          precioAdulto: form.precioAdulto ? parseFloat(form.precioAdulto) : null,
          precioNino: form.precioNino ? parseFloat(form.precioNino) : null,
          estado: form.estado
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      S(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Viaje actualizado" : "✓ Viaje creado");
      SM(null);
    } catch (e) {
      console.error("Error guardar:", e);
      showToast("⚠ " + (e.message || "Error"));
    } finally {
      SSV(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/viajes/${id}`, { method: "DELETE", headers });
      S(prev => prev.filter(x => x.id !== id));
      showToast("✓ Viaje eliminado");
    } catch (e) {
      showToast("⚠ Error");
    } finally {
      SC(null);
    }
  };

  return (
    <>
      <div className="adm-topbar"><div><h1 className="adm-page-title">📅 Gestión de Viajes</h1><p className="adm-page-sub">{items.length} viajes</p></div><button className="adm-btn-primary" onClick={() => abrir()}>+ Nuevo viaje</button></div>
      <div className="adm-table-wrap">
        {load ? <div className="td-empty">Cargando...</div> : (
          <table className="adm-table">
            <thead><tr><th>Ruta</th><th>Bus</th><th>Salida</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={6} className="td-empty">Sin viajes</td></tr> : items.map(v => (
                <tr key={v.id}>
                  <td>{v.ruta?.origen?.ciudad} → {v.ruta?.destino?.ciudad}</td>
                  <td><span className="td-codigo">{v.bus?.placa}</span></td>
                  <td style={{fontSize:12}}>{fmtFecha(v.fechaHoraSalida)}</td>
                  <td>S/ {v.precioAdulto || "—"}</td>
                  <td><Badge text={v.estado} tipo="estado" /></td>
                  <td><div className="td-actions"><button className="btn-edit" onClick={() => abrir(v)}>Editar</button><button className="btn-delete" onClick={() => SC(v.id)}>Eliminar</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && <ModalForm titulo={modal === "nuevo" ? "Nuevo viaje" : "Editar viaje"} emoji="📅" onClose={() => SM(null)} onSubmit={guardar} saving={saving}>
        <div className="form-grid">
          <div className="lf-field"><label>Ruta *</label><select value={form.rutaId || ""} onChange={e => SF(f => ({ ...f, rutaId: e.target.value }))} className="lf-select" required><option value="">Seleccionar...</option>{rutas.map(r => <option key={r.id} value={r.id}>{r.codigo}</option>)}</select></div>
          <div className="lf-field"><label>Bus *</label><select value={form.busId || ""} onChange={e => SF(f => ({ ...f, busId: e.target.value }))} className="lf-select" required><option value="">Seleccionar...</option>{buses.map(b => <option key={b.id} value={b.id}>{b.placa}</option>)}</select></div>
          <div className="lf-field" style={{gridColumn:"1/-1"}}><label>Salida *</label><input type="datetime-local" value={form.fechaHoraSalida || ""} onChange={e => SF(f => ({ ...f, fechaHoraSalida: e.target.value }))} required /></div>
          <div className="lf-field" style={{gridColumn:"1/-1"}}><label>Llegada</label><input type="datetime-local" value={form.fechaHoraLlegadaEstimada || ""} onChange={e => SF(f => ({ ...f, fechaHoraLlegadaEstimada: e.target.value }))} /></div>
          <div className="lf-field"><label>Precio adulto *</label><input type="number" step="0.01" value={form.precioAdulto || ""} onChange={e => SF(f => ({ ...f, precioAdulto: e.target.value }))} required placeholder="0.00" /></div>
          <div className="lf-field"><label>Precio niño</label><input type="number" step="0.01" value={form.precioNino || ""} onChange={e => SF(f => ({ ...f, precioNino: e.target.value }))} /></div>
          <div className="lf-field" style={{gridColumn:"1/-1"}}><label>Estado</label><select value={form.estado || "PROGRAMADO"} onChange={e => SF(f => ({ ...f, estado: e.target.value }))} className="lf-select"><option value="PROGRAMADO">PROGRAMADO</option><option value="EN_CURSO">EN CURSO</option><option value="FINALIZADO">FINALIZADO</option><option value="CANCELADO">CANCELADO</option></select></div>
        </div>
      </ModalForm>}
      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => SC(null)} />}
    </>
  );
}

// ─── CRUD: Encomiendas ────────────────────────────────
function CrudEncomiendas({ headers, showToast }) {
  const [items, S] = useState([]);
  const [load, SL] = useState(true);
  const [buscar, SB] = useState("");
  const [upd, SU] = useState(null);
  const [nuevoEst, SNE] = useState("");
  const [obs, SO] = useState("");
  const [saving, SSV] = useState(false);

  const cargar = useCallback(async () => {
    SL(true);
    try {
      const r = await fetch("/api/v1/encomiendas", { headers });
      const d = r.ok ? await r.json() : [];
      S(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error("Error cargar:", e);
      showToast("⚠ Error al cargar encomiendas");
      S([]);
    } finally {
      SL(false);
    }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const actualizarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEst) {
      showToast("⚠ Selecciona nuevo estado");
      return;
    }
    SSV(true);
    try {
      const res = await fetch(`/api/v1/encomiendas/${upd.id}/estado`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ nuevoEstado: nuevoEst, observacion: obs || null })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      S(prev => prev.map(x => x.id === data.id ? data : x));
      showToast("✓ Estado actualizado");
      SU(null);
    } catch (e) {
      console.error("Error:", e);
      showToast("⚠ " + (e.message || "Error"));
    } finally {
      SSV(false);
    }
  };

  const fil = items.filter(e =>
    (e.numeroGuia || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (e.sucursalOrigen?.ciudad || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <div className="adm-topbar"><div><h1 className="adm-page-title">📦 Gestión de Encomiendas</h1><p className="adm-page-sub">{items.length} encomiendas</p></div><button className="adm-btn-outline" onClick={cargar}>↻ Actualizar</button></div>
      <div className="adm-search-row"><input className="adm-search" placeholder="Buscar guía u origen..." value={buscar} onChange={e => SB(e.target.value)} /></div>
      <div className="adm-table-wrap">
        {load ? <div className="td-empty">Cargando...</div> : (
          <table className="adm-table">
            <thead><tr><th>N° Guía</th><th>Contenido</th><th>Origen</th><th>Destino</th><th>Peso</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {fil.length === 0 ? <tr><td colSpan={7} className="td-empty">Sin encomiendas</td></tr> : fil.map(e => (
                <tr key={e.id}>
                  <td><span className="td-codigo">{e.numeroGuia || "—"}</span></td>
                  <td style={{fontSize:12}}>{e.descripcionContenido || "—"}</td>
                  <td>{e.sucursalOrigen?.ciudad || "—"}</td>
                  <td>{e.sucursalDestino?.ciudad || "—"}</td>
                  <td>{e.pesoKg || "—"} kg</td>
                  <td><Badge text={e.estado} tipo="estado" /></td>
                  <td><button className="btn-edit" onClick={() => {SU(e); SNE(e.estado); SO("");}}>Cambiar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {upd && <ModalForm titulo="Cambiar estado" emoji="📦" onClose={() => SU(null)} onSubmit={actualizarEstado} saving={saving}>
        <div className="form-grid" style={{gridTemplateColumns:"1fr"}}>
          <div className="lf-field"><label>N° Guía</label><input value={upd.numeroGuia || ""} disabled /></div>
          <div className="lf-field"><label>Nuevo estado *</label><select value={nuevoEst} onChange={e => SNE(e.target.value)} className="lf-select" required><option value="">Seleccionar...</option><option value="RECIBIDO">RECIBIDO</option><option value="EN_ALMACEN">EN ALMACÉN</option><option value="EN_TRANSITO">EN TRÁNSITO</option><option value="EN_DESTINO">EN DESTINO</option><option value="LISTO_ENTREGA">LISTO PARA ENTREGA</option><option value="ENTREGADO">ENTREGADO</option><option value="DEVUELTO">DEVUELTO</option><option value="PERDIDO">PERDIDO</option></select></div>
          <div className="lf-field"><label>Observación</label><input value={obs} onChange={e => SO(e.target.value)} placeholder="Nota adicional" /></div>
        </div>
      </ModalForm>}
    </>
  );
}

// ─── CRUD: Clientes ───────────────────────────────────

function CrudClientes({ headers, showToast }) {
  const [items, S] = useState([]);
  const [load, SL] = useState(true);
  const [buscar, SB] = useState("");
  const [detalle, SD] = useState(null);
  const [modal, SM] = useState(null);
  const [form, SF] = useState({});
  const [saving, SSV] = useState(false);
  const [conf, SC] = useState(null);

  const cargar = useCallback(async () => {
    SL(true);
    try {
      const res = await fetch("/api/v1/clientes", { headers });
      const data = res.ok ? await res.json() : [];
      S(Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargar:", e);
      showToast("⚠ Error al cargar clientes");
      S([]);
    } finally {
      SL(false);
    }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (c = null) => {
    SF(c ? {
      id: c.id,
      nombres: c.nombres || "",
      apellidos: c.apellidos || "",
      dniRuc: c.dniRuc || "",
      email: c.email || "",
      telefono: c.telefono || "",
      tipoCliente: c.tipoCliente || "PERSONA"
    } : { nombres: "", apellidos: "", dniRuc: "", email: "", telefono: "", tipoCliente: "PERSONA" });
    SM(c || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombres || !form.apellidos || !form.dniRuc) {
      showToast("⚠ Nombres, apellidos y DNI obligatorios");
      return;
    }
    SSV(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/clientes/${form.id}` : "/api/v1/clientes", {
        method: isEdit ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          dniRuc: form.dniRuc.trim(),
          email: form.email?.trim() || null,
          telefono: form.telefono?.trim() || null,
          tipoCliente: form.tipoCliente || "PERSONA"
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      S(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [...prev, data]);
      showToast(isEdit ? "✓ Cliente actualizado" : "✓ Cliente creado");
      SM(null);
    } catch (e) {
      showToast("⚠ " + (e.message || "Error"));
    } finally {
      SSV(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await fetch(`/api/v1/clientes/${id}`, { method: "DELETE", headers });
      S(prev => prev.filter(x => x.id !== id));
      showToast("✓ Cliente eliminado");
    } catch (e) {
      showToast("⚠ Error");
    } finally {
      SC(null);
    }
  };

  const fil = items.filter(c =>
    (c.nombres || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (c.dniRuc || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1 className="adm-page-title">👥 Gestión de Clientes</h1>
          <p className="adm-page-sub">{items.length} clientes</p>
        </div>
        <button className="adm-btn-primary" onClick={() => abrir()}>+ Nuevo cliente</button>
      </div>

      <div className="adm-search-row">
        <input className="adm-search" placeholder="Buscar por nombre o DNI..." value={buscar} onChange={e => SB(e.target.value)} />
      </div>

      <div className="adm-table-wrap">
        {load ? (
          <div className="td-empty">Cargando...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nombre</th><th>DNI/RUC</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fil.length === 0 ? (
                <tr><td colSpan={6} className="td-empty">Sin clientes</td></tr>
              ) : fil.map(c => (
                <tr key={c.id}>
                  <td><strong>{[c.nombres, c.apellidos].filter(Boolean).join(" ")}</strong></td>
                  <td><span className="td-codigo">{c.dniRuc}</span></td>
                  <td style={{ fontSize: 12 }}>{c.email || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td><Badge text={c.tipoCliente || "PERSONA"} tipo="estado" /></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-edit" onClick={() => SD(c)}>Ver</button>
                      <button className="btn-edit" onClick={() => abrir(c)}>Editar</button>
                      <button className="btn-delete" onClick={() => SC(c.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de formulario */}
      {modal && (
        <ModalForm titulo={modal === "nuevo" ? "Nuevo cliente" : `Editar: ${form.nombres}`} emoji="👤"
                   onClose={() => SM(null)} onSubmit={guardar} saving={saving}>

          <div className="form-grid">
            <div className="lf-field">
              <label>Nombres *</label>
              <input value={form.nombres || ""} onChange={e => SF(f => ({ ...f, nombres: e.target.value }))} required />
            </div>

            <div className="lf-field">
              <label>Apellidos *</label>
              <input value={form.apellidos || ""} onChange={e => SF(f => ({ ...f, apellidos: e.target.value }))} required />
            </div>

            <div className="lf-field">
              <label>DNI/RUC *</label>
              <input value={form.dniRuc || ""} onChange={e => SF(f => ({ ...f, dniRuc: e.target.value }))} required />
            </div>

            <div className="lf-field">
              <label>Tipo</label>
              <select value={form.tipoCliente || "PERSONA"} onChange={e => SF(f => ({ ...f, tipoCliente: e.target.value }))} className="lf-select">
                <option value="PERSONA">PERSONA</option>
                <option value="EMPRESA">EMPRESA</option>
              </select>
            </div>

            <div className="lf-field">
              <label>Email</label>
              <input type="email" value={form.email || ""} onChange={e => SF(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="lf-field">
              <label>Teléfono</label>
              <input value={form.telefono || ""} onChange={e => SF(f => ({ ...f, telefono: e.target.value }))} />
            </div>
          </div>
        </ModalForm>
      )}

      {/* Modal de detalle corregido */}
      {detalle && (
        <div className="modal-overlay" onClick={() => SD(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-badge">👤</div>
              <div>
                <div className="modal-title">{[detalle.nombres, detalle.apellidos].filter(Boolean).join(" ")}</div>
                <div className="modal-subtitle">Detalle del cliente</div>
              </div>
              <button className="modal-close" onClick={() => SD(null)}>✕</button>
            </div>

            <div className="modal-body">
              {[
                ["Nombre", `${detalle.nombres || "—"} ${detalle.apellidos || "—"}`.trim()],
                ["DNI/RUC", detalle.dniRuc || "—"],
                ["Tipo", detalle.tipoCliente || "PERSONA"],
                ["Email", detalle.email || "—"],
                ["Teléfono", detalle.telefono || "—"],
              ].map(([label, valor]) => (
                <div key={label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: 14
                }}>
                  <span style={{ color: C.gris, fontWeight: 700 }}>{label}</span>
                  <strong style={{ color: C.oscuro }}>{valor}</strong>
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: "1.2rem" }}>
                <button className="btn-cancelar" onClick={() => SD(null)} style={{ flex: 1 }}>Cerrar</button>
                <button className="btn-edit" onClick={() => { abrir(detalle); SD(null); }} style={{ flex: 1, background: C.verde, color: "white", border: "none" }}>Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => SC(null)} />}
    </>
  );
}

// ─── Modal Componentes ────────────────────────────────
function ModalForm({ titulo, emoji, onClose, onSubmit, saving, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" onClick={e => e.stopPropagation()}>
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
            <div style={{ display: "flex", gap: 10, marginTop: "1.2rem" }}>
              <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-reservar" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ onConfirmar, onCancelar }) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: 40, marginBottom: "1rem" }}>🗑️</div>
          <h3 style={{ marginBottom: ".5rem", fontFamily: "'Playfair Display',serif", color: C.oscuro }}>¿Eliminar registro?</h3>
          <p style={{ color: C.gris, fontSize: 14, marginBottom: "1.5rem" }}>Esta acción no se puede deshacer.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
            <button className="btn-delete-confirm" onClick={onConfirmar}>Sí, eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────
function DashboardHome({ headers, onNav }) {
  const [stats, setStats] = useState({ rutas: 0, viajes: 0, buses: 0, clientes: 0, encomiendas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/rutas", { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/viajes", { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/buses", { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/clientes", { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/encomiendas", { headers }).then(r => r.json()).catch(() => []),
    ]).then(([rutas, viajes, buses, clientes, encomiendas]) => {
      setStats({
        rutas: Array.isArray(rutas) ? rutas.length : 0,
        viajes: Array.isArray(viajes) ? viajes.length : 0,
        buses: Array.isArray(buses) ? buses.length : 0,
        clientes: Array.isArray(clientes) ? clientes.length : (clientes?.content?.length || 0),
        encomiendas: Array.isArray(encomiendas) ? encomiendas.length : 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: C.medio }}>Cargando dashboard...</div>;

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.oscuro} 0%, ${C.verde} 100%)`, borderRadius: 16, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 4 }}>Sistema de Transporte</div>
          <div style={{ color: C.blanco, fontSize: 32, fontWeight: 800, fontFamily: "'Playfair Display',serif" }}>INTIWATANA S.R.L.</div>
        </div>
        <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.15)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🚌</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon="🗺" valor={stats.rutas} label="Total Rutas" color={C.verde} />
        <StatCard icon="📅" valor={stats.viajes} label="Total Viajes" color={C.amarillo} />
        <StatCard icon="🚌" valor={stats.buses} label="Buses en flota" color={C.verde} />
        <StatCard icon="👥" valor={stats.clientes} label="Clientes" color={C.verde} />
        <StatCard icon="📦" valor={stats.encomiendas} label="Encomiendas" color="#e67e22" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: C.blanco, borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 12px rgba(16,64,59,0.06)", border: "1.5px solid #e8eeec" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.oscuro, marginBottom: 16 }}>Acciones rápidas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "🏢", label: "Sucursales", key: "sucursales" },
              { icon: "🗺", label: "Rutas", key: "rutas" },
              { icon: "🚌", label: "Buses", key: "buses" },
              { icon: "📅", label: "Viajes", key: "viajes" },
              { icon: "👥", label: "Clientes", key: "clientes" },
              { icon: "📦", label: "Encomiendas", key: "encomiendas" },
            ].map(a => (
              <button key={a.key} onClick={() => onNav(a.key)} style={{
                background: C.fondo, border: `1.5px solid #e2ecea`,
                borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, fontSize: 14,
                color: C.oscuro, fontWeight: 600, textAlign: "left",
                transition: "all 0.18s", fontFamily: "inherit"
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(18,115,105,0.08)"; e.currentTarget.style.borderColor = C.verde; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.fondo; e.currentTarget.style.borderColor = "#e2ecea"; }}
              >
                <span style={{ fontSize: 18 }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: C.blanco, borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 12px rgba(16,64,59,0.06)", border: "1.5px solid #e8eeec" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.oscuro, marginBottom: 16 }}>Resumen</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ color: C.gris }}>Rutas activas</span>
              <strong style={{ color: C.oscuro }}>{stats.rutas}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ color: C.gris }}>Viajes próximos</span>
              <strong style={{ color: C.oscuro }}>{stats.viajes}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ color: C.gris }}>Buses disponibles</span>
              <strong style={{ color: C.oscuro }}>{stats.buses}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.gris }}>Clientes registrados</span>
              <strong style={{ color: C.oscuro }}>{stats.clientes}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MENU ─────────────────────────────────────────────
const MENU = [
  { key: "dashboard", icon: "⊞", label: "Dashboard" },
  { key: "sucursales", icon: "🏢", label: "Sucursales" },
  { key: "rutas", icon: "🗺", label: "Rutas" },
  { key: "buses", icon: "🚌", label: "Buses" },
  { key: "viajes", icon: "📅", label: "Viajes" },
  { key: "clientes", icon: "👥", label: "Clientes" },
  { key: "encomiendas", icon: "📦", label: "Encomiendas" },
];

// ─── LAYOUT PRINCIPAL ─────────────────────────────────
export default function AdminDashboard() {
  const { session, logout } = useAuth();
  const [seccion, setSeccion] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const iniciales = (session.username || "AD").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.fondo, fontFamily: "'Source Sans 3', Arial, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sideCollapsed ? 68 : 230,
        background: C.oscuro,
        display: "flex", flexDirection: "column",
        padding: "0", position: "sticky", top: 0, height: "100vh",
        transition: "width 0.22s", flexShrink: 0, overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
          <LogoSVG width={36} height={36} />
          {!sideCollapsed && <div><div style={{ fontFamily: "'Playfair Display',serif", color: C.amarillo, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>INTIWATANA</div><div style={{ color: C.medio, fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase" }}>Admin</div></div>}
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {MENU.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setSeccion(key)} style={{
              width: "100%", background: seccion === key ? "rgba(245,197,24,0.15)" : "transparent",
              border: seccion === key ? `1.5px solid rgba(245,197,24,0.3)` : "1.5px solid transparent",
              borderRadius: 10, color: seccion === key ? C.amarillo : C.medio,
              padding: sideCollapsed ? "10px 0" : "10px 14px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, fontWeight: 600, textAlign: "left", transition: "all 0.18s",
              fontFamily: "inherit", justifyContent: sideCollapsed ? "center" : "flex-start"
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
              {!sideCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.amarillo, color: C.oscuro, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{iniciales}</div>
          {!sideCollapsed && <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ color: C.blanco, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.username}</div>
            <div style={{ color: C.medio, fontSize: 10 }}>Administrador</div>
          </div>}
          {!sideCollapsed && <button onClick={logout} title="Cerrar sesión" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 7, color: C.medio, width: 28, height: 28, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>⏻</button>}
        </div>
      </aside>

      {/* ── CONTENIDO ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ background: C.blanco, borderBottom: "1px solid #e8eeec", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSideCollapsed(s => !s)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.gris, padding: "4px 6px", borderRadius: 6 }}>☰</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.oscuro }}>{MENU.find(m => m.key === seccion)?.label || "Dashboard"}</div>
              <div style={{ fontSize: 11, color: C.medio }}>Sistema Web INTIWATANA S.R.L.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.gris }}>{new Date().toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "long" })}</div>
            <button onClick={logout} style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cerrar sesión</button>
          </div>
        </header>

        {/* Área principal */}
        <main style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {seccion === "dashboard" && <DashboardHome headers={headers} onNav={setSeccion} />}
          {seccion === "sucursales" && <CrudSucursales headers={headers} showToast={showToast} />}
          {seccion === "rutas" && <CrudRutas headers={headers} showToast={showToast} />}
          {seccion === "buses" && <CrudBuses headers={headers} showToast={showToast} />}
          {seccion === "viajes" && <CrudViajes headers={headers} showToast={showToast} />}
          {seccion === "clientes" && <CrudClientes headers={headers} showToast={showToast} />}
          {seccion === "encomiendas" && <CrudEncomiendas headers={headers} showToast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.startsWith("⚠") ? "#c0392b" : C.oscuro, color: C.blanco, padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: 9999, animation: "slideUp 0.3s ease", fontFamily: "inherit" }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .adm-topbar { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:1rem; flex-wrap:wrap; }
        .adm-page-title { font-family:'Playfair Display',serif; font-size:1.6rem; font-weight:700; color:#10403B; margin:0; }
        .adm-page-sub { font-size:13px; color:#8AA6A3; margin:2px 0 0; }
        .adm-btn-primary { background:#127369; color:#fff; border:none; border-radius:9px; padding:10px 20px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; transition:background 0.2s; }
        .adm-btn-primary:hover { background:#10403B; }
        .adm-btn-outline { background:transparent; color:#127369; border:1.5px solid #127369; border-radius:9px; padding:9px 20px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; }
        .adm-search-row { margin-bottom:14px; }
        .adm-search { width:100%; max-width:400px; border:1.5px solid #d4dbd9; border-radius:9px; padding:9px 14px; font-size:14px; font-family:inherit; color:#10403B; background:#fff; outline:none; }
        .adm-search:focus { border-color:#127369; }
        .adm-table-wrap { background:#fff; border-radius:12px; border:1px solid rgba(18,115,105,0.1); overflow:hidden; overflow-x:auto; }
        .adm-table { width:100%; border-collapse:collapse; font-size:13px; }
        .adm-table th { background:#f4f9f8; padding:11px 16px; text-align:left; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#8AA6A3; border-bottom:1px solid rgba(18,115,105,0.08); }
        .adm-table td { padding:11px 16px; border-bottom:1px solid rgba(18,115,105,0.05); color:#10403B; vertical-align:middle; }
        .adm-table tr:last-child td { border-bottom:none; }
        .adm-table tr:hover td { background:#f9fcfb; }
        .td-empty { text-align:center; color:#8AA6A3; padding:3rem; font-size:14px; }
        .td-codigo { font-family:monospace; font-size:12px; background:rgba(18,115,105,0.08); color:#127369; border-radius:5px; padding:2px 7px; font-weight:700; }
        .td-lugar { display:flex; flex-direction:column; gap:2px; }
        .td-ciudad { font-weight:700; font-size:13px; }
        .td-dep { font-size:11px; color:#8AA6A3; }
        .td-actions { display:flex; gap:6px; }
        .btn-edit { background:rgba(18,115,105,0.08); color:#127369; border:none; border-radius:6px; padding:5px 11px; font-size:12px; font-weight:700; font-family:inherit; cursor:pointer; }
        .btn-edit:hover { background:rgba(18,115,105,0.18); }
        .btn-delete { background:rgba(192,57,43,0.08); color:#c0392b; border:none; border-radius:6px; padding:5px 11px; font-size:12px; font-weight:700; font-family:inherit; cursor:pointer; }
        .btn-delete:hover { background:rgba(192,57,43,0.18); }
        .btn-delete-confirm { background:#c0392b; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; }
        .btn-cancelar { background:#f0f4f3; color:#4C5958; border:1.5px solid #d4dbd9; border-radius:8px; padding:10px 18px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; }
        .btn-reservar { background:#127369; color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; flex:1; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 1rem; }
        .lf-field { margin-bottom:1rem; }
        .lf-field label { display:block; font-size:11px; font-weight:700; color:#4C5958; margin-bottom:5px; letter-spacing:0.07em; text-transform:uppercase; }
        .lf-field input, .lf-select { width:100%; border:1.5px solid #d4dbd9; border-radius:8px; padding:10px 13px; font-size:14px; font-family:inherit; color:#10403B; background:#fff; outline:none; box-sizing:border-box; }
        .lf-field input:focus, .lf-select:focus { border-color:#127369; }
        .lf-field input:disabled { background:#f5f5f5; cursor:not-allowed; }
        .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9998; }
        .modal { background:#fff; border-radius:14px; max-width:500px; width:95%; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3); }
        .modal-header { display:flex; align-items:center; gap:14px; padding:20px 24px; border-bottom:1px solid #f0f0f0; }
        .modal-badge { width:44px; height:44px; border-radius:10px; background:rgba(18,115,105,0.1); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .modal-title { font-weight:700; font-size:16px; color:#10403B; margin:0; }
        .modal-subtitle { font-size:12px; color:#8AA6A3; margin:4px 0 0; }
        .modal-close { background:transparent; border:none; color:#8AA6A3; font-size:24px; cursor:pointer; padding:0; margin-left:auto; }
        .modal-close:hover { color:#10403B; }
        .modal-body { padding:20px 24px; }
        .modal-body form { display:flex; flex-direction:column; }
        .confirm-modal { max-width:360px; }
      `}</style>
    </div>
  );
}