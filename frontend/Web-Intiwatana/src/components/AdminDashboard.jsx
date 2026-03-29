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

// ─── Fila de tabla reciente ───────────────────────────
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
  };
  const s = colors[text] || { bg:"rgba(138,166,163,0.15)", c:C.gris };
  return (
    <span style={{ background:s.bg, color:s.c, borderRadius:50, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
      {text?.replace(/_/g," ")}
    </span>
  );
}

// ─── CRUD: Rutas ──────────────────────────────────────
const RUTA_E = { codigo:"", origenId:"", destinoId:"", distanciaKm:"", duracionHorasEstimada:"", precioBase:"", descripcion:"" };
function CrudRutas({ headers, showToast }) {
  const [rutas,S]       = useState([]);
  const [suc,SS]        = useState([]);
  const [load,SL]       = useState(true);
  const [modal,SM]      = useState(null);
  const [form,SF]       = useState(RUTA_E);
  const [conf,SC]       = useState(null);
  const [buscar,SB]     = useState("");
  const [saving,SSV]    = useState(false);
  const cargar = useCallback(async()=>{ SL(true); try{ const [r,s]=await Promise.all([fetch("/api/v1/rutas",{headers}).then(r=>r.json()),fetch("/api/v1/sucursales",{headers}).then(r=>r.json())]); S(Array.isArray(r)?r:[]); SS(Array.isArray(s)?s:[]); }catch{showToast("⚠ Error al cargar rutas");} finally{SL(false);} },[]);
  useEffect(()=>{cargar();},[cargar]);
  const abrir=(r=null)=>{ SF(r?{id:r.id,codigo:r.codigo||"",origenId:r.origen?.id||"",destinoId:r.destino?.id||"",distanciaKm:r.distanciaKm||"",duracionHorasEstimada:r.duracionHorasEstimada||"",precioBase:r.precioBase||"",descripcion:r.descripcion||""}:RUTA_E); SM(r||"nuevo"); };
  const hf=e=>SF(f=>({...f,[e.target.name]:e.target.value}));
  const guardar=async(e)=>{ e.preventDefault(); SSV(true); const es=modal!=="nuevo"; const url=es?`/api/v1/rutas/${form.id}`:"/api/v1/rutas"; const body={codigo:form.codigo,origenId:Number(form.origenId),destinoId:Number(form.destinoId),distanciaKm:form.distanciaKm?Number(form.distanciaKm):null,duracionHorasEstimada:form.duracionHorasEstimada?Number(form.duracionHorasEstimada):null,precioBase:form.precioBase?Number(form.precioBase):null,descripcion:form.descripcion||null}; try{ const res=await fetch(url,{method:es?"PUT":"POST",headers,body:JSON.stringify(body)}); if(!res.ok)throw new Error((await res.json().catch(()=>({}))).mensaje||"Error"); const sv=await res.json(); S(prev=>es?prev.map(x=>x.id===sv.id?sv:x):[...prev,sv]); showToast(es?"Ruta actualizada ✓":"Ruta creada ✓"); SM(null); }catch(err){showToast("⚠ "+err.message);} finally{SSV(false);} };
  const eliminar=async(id)=>{ try{ const res=await fetch(`/api/v1/rutas/${id}`,{method:"DELETE",headers}); if(!res.ok)throw new Error(); S(prev=>prev.filter(x=>x.id!==id)); showToast("Ruta eliminada"); }catch{showToast("⚠ No se pudo eliminar");} finally{SC(null);} };
  const fil=rutas.filter(r=>(r.codigo||"").toLowerCase().includes(buscar.toLowerCase())||(r.origen?.ciudad||"").toLowerCase().includes(buscar.toLowerCase())||(r.destino?.ciudad||"").toLowerCase().includes(buscar.toLowerCase()));
  return (<>
    <div className="adm-topbar"><div><h1 className="adm-page-title">🗺 Gestión de Rutas</h1><p className="adm-page-sub">{rutas.length} rutas registradas</p></div><button className="adm-btn-primary" onClick={()=>abrir()}>+ Nueva ruta</button></div>
    <div className="adm-search-row"><input className="adm-search" placeholder="Buscar por código, origen o destino..." value={buscar} onChange={e=>SB(e.target.value)}/></div>
    <div className="adm-table-wrap">{load?<div className="td-empty">Cargando...</div>:(
      <table className="adm-table"><thead><tr><th>Código</th><th>Origen</th><th>Destino</th><th>Distancia</th><th>Duración</th><th>Precio base</th><th>Acciones</th></tr></thead>
      <tbody>{fil.length===0&&<tr><td colSpan={7} className="td-empty">Sin resultados</td></tr>}{fil.map(r=>(
        <tr key={r.id}><td><span className="td-codigo">{r.codigo}</span></td><td><div className="td-lugar"><span className="td-ciudad">{r.origen?.ciudad||"—"}</span><span className="td-dep">{r.origen?.departamento}</span></div></td><td><div className="td-lugar"><span className="td-ciudad">{r.destino?.ciudad||"—"}</span><span className="td-dep">{r.destino?.departamento}</span></div></td><td>{r.distanciaKm?`${r.distanciaKm} km`:"—"}</td><td>{r.duracionHorasEstimada?`${r.duracionHorasEstimada} h`:"—"}</td><td>{r.precioBase?`S/ ${r.precioBase}`:"—"}</td>
        <td><div className="td-actions"><button className="btn-edit" onClick={()=>abrir(r)}>Editar</button><button className="btn-delete" onClick={()=>SC(r.id)}>Eliminar</button></div></td></tr>
      ))}</tbody></table>
    )}</div>
    {modal&&<ModalForm titulo={modal==="nuevo"?"Nueva ruta":`Editar: ${form.codigo}`} emoji="🗺" onClose={()=>SM(null)} onSubmit={guardar} saving={saving}><div className="form-grid"><div className="lf-field" style={{gridColumn:"1/-1"}}><label>Código único *</label><input name="codigo" value={form.codigo} onChange={hf} placeholder="AYA-LIM-01" required/></div><div className="lf-field"><label>Sucursal origen *</label><select name="origenId" value={form.origenId} onChange={hf} required className="lf-select"><option value="">Seleccionar...</option>{suc.map(s=><option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}</select></div><div className="lf-field"><label>Sucursal destino *</label><select name="destinoId" value={form.destinoId} onChange={hf} required className="lf-select"><option value="">Seleccionar...</option>{suc.map(s=><option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}</select></div><div className="lf-field"><label>Distancia (km)</label><input type="number" name="distanciaKm" value={form.distanciaKm} onChange={hf} placeholder="560"/></div><div className="lf-field"><label>Duración (h)</label><input type="number" name="duracionHorasEstimada" value={form.duracionHorasEstimada} onChange={hf} placeholder="10.5"/></div><div className="lf-field"><label>Precio base (S/)</label><input type="number" name="precioBase" value={form.precioBase} onChange={hf} placeholder="55.00"/></div><div className="lf-field"><label>Descripción</label><input name="descripcion" value={form.descripcion} onChange={hf} placeholder="Opcional"/></div></div></ModalForm>}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>SC(null)}/>}
  </>);
}

// ─── CRUD: Sucursales ─────────────────────────────────
const SUC_E = { nombre:"", ciudad:"", departamento:"", direccion:"", telefono:"", email:"" };
function CrudSucursales({ headers, showToast }) {
  const [items,S]=useState([]); const [load,SL]=useState(true); const [modal,SM]=useState(null); const [form,SF]=useState(SUC_E); const [conf,SC]=useState(null); const [saving,SSV]=useState(false);
  const cargar=useCallback(async()=>{ SL(true); try{ const r=await fetch("/api/v1/sucursales",{headers}); S(Array.isArray(await r.json())?await r.json():[]); }catch{showToast("⚠ Error");} finally{SL(false);} },[]);
  useEffect(()=>{cargar();},[cargar]);
  const abrir=(x=null)=>{ SF(x?{id:x.id,nombre:x.nombre||"",ciudad:x.ciudad||"",departamento:x.departamento||"",direccion:x.direccion||"",telefono:x.telefono||"",email:x.email||""}:SUC_E); SM(x||"nuevo"); };
  const hf=e=>SF(f=>({...f,[e.target.name]:e.target.value}));
  const guardar=async(e)=>{ e.preventDefault(); SSV(true); const es=modal!=="nuevo"; try{ const res=await fetch(es?`/api/v1/sucursales/${form.id}`:"/api/v1/sucursales",{method:es?"PUT":"POST",headers,body:JSON.stringify(form)}); if(!res.ok)throw new Error(); const sv=await res.json(); S(prev=>es?prev.map(x=>x.id===sv.id?sv:x):[...prev,sv]); showToast(es?"Sucursal actualizada ✓":"Sucursal creada ✓"); SM(null); }catch(err){showToast("⚠ "+err.message);} finally{SSV(false);} };
  const eliminar=async(id)=>{ try{ await fetch(`/api/v1/sucursales/${id}`,{method:"DELETE",headers}); S(prev=>prev.filter(x=>x.id!==id)); showToast("Sucursal eliminada"); }catch{showToast("⚠ Error");} finally{SC(null);} };
  return (<>
    <div className="adm-topbar"><div><h1 className="adm-page-title">🏢 Gestión de Sucursales</h1><p className="adm-page-sub">{items.length} sucursales</p></div><button className="adm-btn-primary" onClick={()=>abrir()}>+ Nueva sucursal</button></div>
    <div className="adm-table-wrap">{load?<div className="td-empty">Cargando...</div>:(
      <table className="adm-table"><thead><tr><th>Nombre</th><th>Ciudad</th><th>Departamento</th><th>Dirección</th><th>Teléfono</th><th>Acciones</th></tr></thead>
      <tbody>{items.length===0&&<tr><td colSpan={6} className="td-empty">Sin sucursales</td></tr>}{items.map(s=>(
        <tr key={s.id}><td><strong>{s.nombre}</strong></td><td>{s.ciudad}</td><td>{s.departamento||"—"}</td><td style={{fontSize:12}}>{s.direccion||"—"}</td><td>{s.telefono||"—"}</td>
        <td><div className="td-actions"><button className="btn-edit" onClick={()=>abrir(s)}>Editar</button><button className="btn-delete" onClick={()=>SC(s.id)}>Eliminar</button></div></td></tr>
      ))}</tbody></table>
    )}</div>
    {modal&&<ModalForm titulo={modal==="nuevo"?"Nueva sucursal":`Editar: ${form.nombre}`} emoji="🏢" onClose={()=>SM(null)} onSubmit={guardar} saving={saving}><div className="form-grid"><div className="lf-field" style={{gridColumn:"1/-1"}}><label>Nombre *</label><input name="nombre" value={form.nombre} onChange={hf} required/></div><div className="lf-field"><label>Ciudad *</label><input name="ciudad" value={form.ciudad} onChange={hf} required/></div><div className="lf-field"><label>Departamento</label><input name="departamento" value={form.departamento} onChange={hf}/></div><div className="lf-field" style={{gridColumn:"1/-1"}}><label>Dirección</label><input name="direccion" value={form.direccion} onChange={hf}/></div><div className="lf-field"><label>Teléfono</label><input name="telefono" value={form.telefono} onChange={hf}/></div><div className="lf-field"><label>Email</label><input type="email" name="email" value={form.email} onChange={hf}/></div></div></ModalForm>}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>SC(null)}/>}
  </>);
}

// ─── CRUD: Buses ──────────────────────────────────────
const BUS_E={placa:"",marca:"",modelo:"",anio:"",tipoBus:"NORMAL",capacidad:"",sucursalId:""};
const TIPOS_BUS=["NORMAL","SEMACAMA","CAMA","MINIBUS"];
function CrudBuses({ headers, showToast }) {
  const [items,S]=useState([]); const [suc,SS]=useState([]); const [load,SL]=useState(true); const [modal,SM]=useState(null); const [form,SF]=useState(BUS_E); const [conf,SC]=useState(null); const [saving,SSV]=useState(false);
  const cargar=useCallback(async()=>{ SL(true); try{ const [b,s]=await Promise.all([fetch("/api/v1/buses",{headers}).then(r=>r.json()),fetch("/api/v1/sucursales",{headers}).then(r=>r.json())]); S(Array.isArray(b)?b:[]); SS(Array.isArray(s)?s:[]); }catch{showToast("⚠ Error");} finally{SL(false);} },[]);
  useEffect(()=>{cargar();},[cargar]);
  const abrir=(x=null)=>{ SF(x?{id:x.id,placa:x.placa||"",marca:x.marca||"",modelo:x.modelo||"",anio:x.anio||"",tipoBus:x.tipoBus||"NORMAL",capacidad:x.capacidad||"",sucursalId:x.sucursal?.id||""}:BUS_E); SM(x||"nuevo"); };
  const hf=e=>SF(f=>({...f,[e.target.name]:e.target.value}));
  const guardar=async(e)=>{ e.preventDefault(); SSV(true); const es=modal!=="nuevo"; const body={...form,anio:form.anio?Number(form.anio):null,capacidad:form.capacidad?Number(form.capacidad):null,sucursalId:form.sucursalId?Number(form.sucursalId):null}; try{ const res=await fetch(es?`/api/v1/buses/${form.id}`:"/api/v1/buses",{method:es?"PUT":"POST",headers,body:JSON.stringify(body)}); if(!res.ok)throw new Error(); const sv=await res.json(); S(prev=>es?prev.map(x=>x.id===sv.id?sv:x):[...prev,sv]); showToast(es?"Bus actualizado ✓":"Bus registrado ✓"); SM(null); }catch(err){showToast("⚠ "+err.message);} finally{SSV(false);} };
  const eliminar=async(id)=>{ try{ await fetch(`/api/v1/buses/${id}`,{method:"DELETE",headers}); S(prev=>prev.filter(x=>x.id!==id)); showToast("Bus eliminado"); }catch{showToast("⚠ Error");} finally{SC(null);} };
  return (<>
    <div className="adm-topbar"><div><h1 className="adm-page-title">🚌 Gestión de Buses</h1><p className="adm-page-sub">{items.length} buses</p></div><button className="adm-btn-primary" onClick={()=>abrir()}>+ Nuevo bus</button></div>
    <div className="adm-table-wrap">{load?<div className="td-empty">Cargando...</div>:(
      <table className="adm-table"><thead><tr><th>Placa</th><th>Marca / Modelo</th><th>Año</th><th>Tipo</th><th>Capacidad</th><th>Sucursal</th><th>Acciones</th></tr></thead>
      <tbody>{items.length===0&&<tr><td colSpan={7} className="td-empty">Sin buses</td></tr>}{items.map(b=>(
        <tr key={b.id}><td><span className="td-codigo">{b.placa}</span></td><td><strong>{b.marca}</strong> {b.modelo}</td><td>{b.anio||"—"}</td><td><Badge text={b.tipoBus}/></td><td>{b.capacidad?`${b.capacidad} asientos`:"—"}</td><td style={{fontSize:12}}>{b.sucursal?.ciudad||"—"}</td>
        <td><div className="td-actions"><button className="btn-edit" onClick={()=>abrir(b)}>Editar</button><button className="btn-delete" onClick={()=>SC(b.id)}>Eliminar</button></div></td></tr>
      ))}</tbody></table>
    )}</div>
    {modal&&<ModalForm titulo={modal==="nuevo"?"Nuevo bus":`Editar: ${form.placa}`} emoji="🚌" onClose={()=>SM(null)} onSubmit={guardar} saving={saving}><div className="form-grid"><div className="lf-field"><label>Placa *</label><input name="placa" value={form.placa} onChange={hf} required/></div><div className="lf-field"><label>Tipo</label><select name="tipoBus" value={form.tipoBus} onChange={hf} className="lf-select">{TIPOS_BUS.map(t=><option key={t} value={t}>{t}</option>)}</select></div><div className="lf-field"><label>Marca</label><input name="marca" value={form.marca} onChange={hf}/></div><div className="lf-field"><label>Modelo</label><input name="modelo" value={form.modelo} onChange={hf}/></div><div className="lf-field"><label>Año</label><input type="number" name="anio" value={form.anio} onChange={hf} min="1990" max="2030"/></div><div className="lf-field"><label>Capacidad</label><input type="number" name="capacidad" value={form.capacidad} onChange={hf}/></div><div className="lf-field" style={{gridColumn:"1/-1"}}><label>Sucursal</label><select name="sucursalId" value={form.sucursalId} onChange={hf} className="lf-select"><option value="">Sin asignar</option>{suc.map(s=><option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}</select></div></div></ModalForm>}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>SC(null)}/>}
  </>);
}

// ─── CRUD: Viajes ─────────────────────────────────────
const VIAJE_E={rutaId:"",busId:"",fechaHoraSalida:"",fechaHoraLlegada:"",precioOficial:"",estado:"PROGRAMADO"};
const EST_VIAJE=["PROGRAMADO","EN_CURSO","FINALIZADO","CANCELADO"];
function CrudViajes({ headers, showToast }) {
  const [items,S]=useState([]); const [rutas,SR]=useState([]); const [buses,SB]=useState([]); const [load,SL]=useState(true); const [modal,SM]=useState(null); const [form,SF]=useState(VIAJE_E); const [conf,SC]=useState(null); const [saving,SSV]=useState(false); const [buscar,SBu]=useState("");
  const cargar=useCallback(async()=>{ SL(true); try{ const [v,r,b]=await Promise.all([fetch("/api/v1/viajes",{headers}).then(x=>x.json()),fetch("/api/v1/rutas",{headers}).then(x=>x.json()),fetch("/api/v1/buses",{headers}).then(x=>x.json())]); S(Array.isArray(v)?v:[]); SR(Array.isArray(r)?r:[]); SB(Array.isArray(b)?b:[]); }catch{showToast("⚠ Error");} finally{SL(false);} },[]);
  useEffect(()=>{cargar();},[cargar]);
  const abrir=(x=null)=>{ SF(x?{id:x.id,rutaId:x.ruta?.id||"",busId:x.bus?.id||"",fechaHoraSalida:x.fechaHoraSalida?.slice(0,16)||"",fechaHoraLlegada:x.fechaHoraLlegada?.slice(0,16)||"",precioOficial:x.precioOficial||"",estado:x.estado||"PROGRAMADO"}:VIAJE_E); SM(x||"nuevo"); };
  const hf=e=>SF(f=>({...f,[e.target.name]:e.target.value}));
  const guardar=async(e)=>{ e.preventDefault(); SSV(true); const es=modal!=="nuevo"; const body={rutaId:Number(form.rutaId),busId:Number(form.busId),fechaHoraSalida:form.fechaHoraSalida||null,fechaHoraLlegada:form.fechaHoraLlegada||null,precioOficial:form.precioOficial?Number(form.precioOficial):null,estado:form.estado}; try{ const res=await fetch(es?`/api/v1/viajes/${form.id}`:"/api/v1/viajes",{method:es?"PUT":"POST",headers,body:JSON.stringify(body)}); if(!res.ok)throw new Error(); const sv=await res.json(); S(prev=>es?prev.map(x=>x.id===sv.id?sv:x):[...prev,sv]); showToast(es?"Viaje actualizado ✓":"Viaje creado ✓"); SM(null); }catch(err){showToast("⚠ "+err.message);} finally{SSV(false);} };
  const eliminar=async(id)=>{ try{ await fetch(`/api/v1/viajes/${id}`,{method:"DELETE",headers}); S(prev=>prev.filter(x=>x.id!==id)); showToast("Viaje eliminado"); }catch{showToast("⚠ Error");} finally{SC(null);} };
  const fil=items.filter(v=>(v.ruta?.origen?.ciudad||"").toLowerCase().includes(buscar.toLowerCase())||(v.ruta?.destino?.ciudad||"").toLowerCase().includes(buscar.toLowerCase())||(v.bus?.placa||"").toLowerCase().includes(buscar.toLowerCase()));
  return (<>
    <div className="adm-topbar"><div><h1 className="adm-page-title">📅 Gestión de Viajes</h1><p className="adm-page-sub">{items.length} viajes</p></div><button className="adm-btn-primary" onClick={()=>abrir()}>+ Nuevo viaje</button></div>
    <div className="adm-search-row"><input className="adm-search" placeholder="Buscar por origen, destino o placa..." value={buscar} onChange={e=>SBu(e.target.value)}/></div>
    <div className="adm-table-wrap">{load?<div className="td-empty">Cargando...</div>:(
      <table className="adm-table"><thead><tr><th>Ruta</th><th>Bus</th><th>Salida</th><th>Llegada</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>{fil.length===0&&<tr><td colSpan={7} className="td-empty">Sin resultados</td></tr>}{fil.map(v=>(
        <tr key={v.id}><td><div className="td-lugar"><span className="td-ciudad">{v.ruta?.origen?.ciudad||"—"} → {v.ruta?.destino?.ciudad||"—"}</span><span className="td-dep">{v.ruta?.codigo}</span></div></td><td><span className="td-codigo">{v.bus?.placa||"—"}</span></td><td style={{fontSize:12}}>{fmtFecha(v.fechaHoraSalida)}</td><td style={{fontSize:12}}>{fmtFecha(v.fechaHoraLlegadaEstimada)}</td><td>{v.precioAdulto?`S/ ${v.precioAdulto}`:"—"}</td><td><Badge text={v.estado}/></td>
        <td><div className="td-actions"><button className="btn-edit" onClick={()=>abrir(v)}>Editar</button><button className="btn-delete" onClick={()=>SC(v.id)}>Eliminar</button></div></td></tr>
      ))}</tbody></table>
    )}</div>
    {modal&&<ModalForm titulo={modal==="nuevo"?"Nuevo viaje":"Editar viaje"} emoji="📅" onClose={()=>SM(null)} onSubmit={guardar} saving={saving}><div className="form-grid"><div className="lf-field"><label>Ruta *</label><select name="rutaId" value={form.rutaId} onChange={hf} required className="lf-select"><option value="">Seleccionar...</option>{rutas.map(r=><option key={r.id} value={r.id}>{r.codigo} — {r.origen?.ciudad} → {r.destino?.ciudad}</option>)}</select></div><div className="lf-field"><label>Bus *</label><select name="busId" value={form.busId} onChange={hf} required className="lf-select"><option value="">Seleccionar...</option>{buses.map(b=><option key={b.id} value={b.id}>{b.placa} — {b.marca}</option>)}</select></div><div className="lf-field"><label>Fecha y hora de salida *</label><input type="datetime-local" name="fechaHoraSalida" value={form.fechaHoraSalida} onChange={hf} required/></div><div className="lf-field"><label>Fecha y hora de llegada</label><input type="datetime-local" name="fechaHoraLlegada" value={form.fechaHoraLlegada} onChange={hf}/></div><div className="lf-field"><label>Precio oficial (S/)</label><input type="number" step="0.01" name="precioOficial" value={form.precioOficial} onChange={hf}/></div><div className="lf-field"><label>Estado</label><select name="estado" value={form.estado} onChange={hf} className="lf-select">{EST_VIAJE.map(e=><option key={e} value={e}>{e}</option>)}</select></div></div></ModalForm>}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>SC(null)}/>}
  </>);
}

// ─── Encomiendas ──────────────────────────────────────
const EST_ENC=["RECIBIDO","EN_ALMACEN","EN_TRANSITO","EN_DESTINO","LISTO_ENTREGA","ENTREGADO","DEVUELTO","PERDIDO"];
function CrudEncomiendas({ headers, showToast }) {
  const [items,S]=useState([]); const [load,SL]=useState(true); const [buscar,SB]=useState(""); const [upd,SU]=useState(null); const [nuevoEst,SNE]=useState(""); const [obs,SO]=useState(""); const [saving,SSV]=useState(false);
  const cargar=useCallback(async()=>{ SL(true); try{ const r=await fetch("/api/v1/encomiendas",{headers}); const d=await r.json(); S(Array.isArray(d)?d:[]); }catch{showToast("⚠ Error");} finally{SL(false);} },[]);
  useEffect(()=>{cargar();},[cargar]);
  const actualizarEstado=async(e)=>{ e.preventDefault(); SSV(true); try{ const res=await fetch(`/api/v1/encomiendas/${upd.id}/estado`,{method:"PATCH",headers,body:JSON.stringify({estadoNuevo:nuevoEst,observacion:obs||null})}); if(!res.ok)throw new Error(); const sv=await res.json(); S(prev=>prev.map(x=>x.id===sv.id?sv:x)); showToast("Estado actualizado ✓"); SU(null); }catch(err){showToast("⚠ "+err.message);} finally{SSV(false);} };
  const fil=items.filter(e=>(e.numeroGuia||"").toLowerCase().includes(buscar.toLowerCase())||(e.sucursalOrigen?.ciudad||"").toLowerCase().includes(buscar.toLowerCase()));
  return (<>
    <div className="adm-topbar"><div><h1 className="adm-page-title">📦 Gestión de Encomiendas</h1><p className="adm-page-sub">{items.length} encomiendas</p></div><button className="adm-btn-outline" onClick={cargar}>↻ Actualizar</button></div>
    <div className="adm-search-row"><input className="adm-search" placeholder="Buscar por N° guía u origen..." value={buscar} onChange={e=>SB(e.target.value)}/></div>
    <div className="adm-table-wrap">{load?<div className="td-empty">Cargando...</div>:(
      <table className="adm-table"><thead><tr><th>N° Guía</th><th>Contenido</th><th>Origen → Destino</th><th>Peso</th><th>Costo</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>{fil.length===0&&<tr><td colSpan={7} className="td-empty">Sin resultados</td></tr>}{fil.map(enc=>(
        <tr key={enc.id}><td><span className="td-codigo">{enc.numeroGuia||"—"}</span></td><td style={{fontSize:12}}>{enc.descripcionContenido||"—"}</td><td style={{fontSize:12}}>{enc.sucursalOrigen?.ciudad||"—"} → {enc.sucursalDestino?.ciudad||"—"}</td><td>{enc.pesoKg??"-"} kg</td><td>{enc.costo?`S/ ${enc.costo}`:"—"}</td><td><Badge text={enc.estado}/></td>
        <td><button className="btn-edit" onClick={()=>{SU(enc);SNE(enc.estado);SO("");}}>Cambiar estado</button></td></tr>
      ))}</tbody></table>
    )}</div>
    {upd&&<ModalForm titulo="Actualizar estado" emoji="📦" onClose={()=>SU(null)} onSubmit={actualizarEstado} saving={saving}><div className="form-grid" style={{gridTemplateColumns:"1fr"}}><div className="lf-field"><label>N° Guía</label><input value={upd.numeroGuia||""} disabled style={{opacity:0.6}}/></div><div className="lf-field"><label>Nuevo estado *</label><select value={nuevoEst} onChange={e=>SNE(e.target.value)} className="lf-select" required>{EST_ENC.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div><div className="lf-field"><label>Observación</label><input value={obs} onChange={e=>SO(e.target.value)} placeholder="Ej: Recibido en terminal Lima"/></div></div></ModalForm>}
  </>);
}

// ─── Clientes ─────────────────────────────────────────
function CrudClientes({ headers, showToast }) {
  const [items,S]=useState([]); const [load,SL]=useState(true); const [buscar,SB]=useState(""); const [detalle,SD]=useState(null);
  const cargar=useCallback(async()=>{ SL(true); try{ const r=await fetch("/api/v1/clientes",{headers}); const d=await r.json(); S(Array.isArray(d)?d:[]); }catch{showToast("⚠ Error");} finally{SL(false);} },[]);
  useEffect(()=>{cargar();},[cargar]);
  const fil=items.filter(c=>(c.nombres||"").toLowerCase().includes(buscar.toLowerCase())||(c.apellidos||"").toLowerCase().includes(buscar.toLowerCase())||(c.dniRuc||"").toLowerCase().includes(buscar.toLowerCase()));
  return (<>
    <div className="adm-topbar"><div><h1 className="adm-page-title">👥 Gestión de Clientes</h1><p className="adm-page-sub">{items.length} clientes</p></div><button className="adm-btn-outline" onClick={cargar}>↻ Actualizar</button></div>
    <div className="adm-search-row"><input className="adm-search" placeholder="Buscar por nombre, DNI o email..." value={buscar} onChange={e=>SB(e.target.value)}/></div>
    <div className="adm-table-wrap">{load?<div className="td-empty">Cargando...</div>:(
      <table className="adm-table"><thead><tr><th>Nombre completo</th><th>DNI / RUC</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Ver</th></tr></thead>
      <tbody>{fil.length===0&&<tr><td colSpan={6} className="td-empty">Sin resultados</td></tr>}{fil.map(c=>(
        <tr key={c.id}><td><strong>{[c.nombres,c.apellidos].filter(Boolean).join(" ")||"—"}</strong></td><td><span className="td-codigo">{c.dniRuc||"—"}</span></td><td style={{fontSize:12}}>{c.email||"—"}</td><td>{c.telefono||"—"}</td><td><Badge text={c.tipoCliente||"PERSONA"}/></td>
        <td><button className="btn-edit" onClick={()=>SD(c)}>Ver</button></td></tr>
      ))}</tbody></table>
    )}</div>
    {detalle&&(<div className="modal-overlay" onClick={()=>SD(null)}><div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}><div className="modal-header"><div className="modal-badge">👤</div><div><div className="modal-title">{[detalle.nombres,detalle.apellidos].filter(Boolean).join(" ")}</div><div className="modal-subtitle">Detalle del cliente</div></div><button className="modal-close" onClick={()=>SD(null)}>✕</button></div><div className="modal-body">{[["DNI/RUC",detalle.dniRuc||"—"],["Email",detalle.email||"—"],["Teléfono",detalle.telefono||"—"],["Tipo",detalle.tipoCliente||"PERSONA"],["Usuario",detalle.usuario?.username||"—"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f0",fontSize:14}}><span style={{color:C.gris}}>{l}</span><strong style={{color:C.oscuro}}>{v}</strong></div>))}<button className="btn-cancelar" style={{width:"100%",marginTop:"1rem"}} onClick={()=>SD(null)}>Cerrar</button></div></div></div>)}
  </>);
}

// ─── Componentes modales reutilizables ────────────────
function ModalForm({ titulo, emoji, onClose, onSubmit, saving, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><div className="modal-badge">{emoji}</div><div><div className="modal-title">{titulo}</div><div className="modal-subtitle">Completa los datos</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body"><form onSubmit={onSubmit}>{children}<div style={{display:"flex",gap:10,marginTop:"1.2rem"}}><button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button><button type="submit" className="btn-reservar" disabled={saving}>{saving?"Guardando...":"Guardar"}</button></div></form></div>
      </div>
    </div>
  );
}
function ConfirmModal({ onConfirmar, onCancelar }) {
  return (
    <div className="modal-overlay" onClick={onCancelar}><div className="modal confirm-modal" onClick={e=>e.stopPropagation()}><div className="modal-body" style={{textAlign:"center",padding:"2rem"}}><div style={{fontSize:40,marginBottom:"1rem"}}>🗑️</div><h3 style={{marginBottom:".5rem",fontFamily:"'Playfair Display',serif",color:C.oscuro}}>¿Eliminar registro?</h3><p style={{color:C.gris,fontSize:14,marginBottom:"1.5rem"}}>Esta acción no se puede deshacer.</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button className="btn-cancelar" onClick={onCancelar}>Cancelar</button><button className="btn-delete-confirm" onClick={onConfirmar}>Sí, eliminar</button></div></div></div></div>
  );
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────
const MENU = [
  { key:"dashboard",   icon:"⊞",  label:"Dashboard"    },
  { key:"rutas",       icon:"🗺",  label:"Rutas"        },
  { key:"sucursales",  icon:"🏢",  label:"Sucursales"   },
  { key:"buses",       icon:"🚌",  label:"Buses"        },
  { key:"viajes",      icon:"📅",  label:"Viajes"       },
  { key:"clientes",    icon:"👥",  label:"Clientes"     },
  { key:"encomiendas", icon:"📦",  label:"Encomiendas"  },
];

function DashboardHome({ headers, onNav }) {
  const [stats, setStats] = useState({ rutas:0, viajes:0, buses:0, clientes:0, encomiendas:0, viajesHoy:0, encPendientes:0, ingresos:0 });
  const [rutasDist, setRutasDist] = useState([]);
  const [viajesRecientes, setViajesRecientes] = useState([]);
  const [stockBajo, setStockBajo] = useState([]); // viajes con pocos asientos
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/rutas",       { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/viajes",      { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/buses",       { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/clientes",    { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/v1/encomiendas", { headers }).then(r => r.json()).catch(() => []),
    ]).then(([rutas, viajes, buses, clientes, encomiendas]) => {
      const hoy = new Date().toDateString();
      const vHoy = (Array.isArray(viajes) ? viajes : []).filter(v => new Date(v.fechaHoraSalida).toDateString() === hoy);
      const encPend = (Array.isArray(encomiendas) ? encomiendas : []).filter(e => !["ENTREGADO","DEVUELTO","PERDIDO"].includes(e.estado));
      const ingresos = (Array.isArray(encomiendas) ? encomiendas : []).reduce((s, e) => s + (Number(e.costo) || 0), 0);

      setStats({
        rutas:         Array.isArray(rutas)        ? rutas.length        : 0,
        viajes:        Array.isArray(viajes)       ? viajes.length       : 0,
        buses:         Array.isArray(buses)        ? buses.length        : 0,
        clientes:      Array.isArray(clientes)     ? clientes.length     : 0,
        encomiendas:   Array.isArray(encomiendas)  ? encomiendas.length  : 0,
        viajesHoy:     vHoy.length,
        encPendientes: encPend.length,
        ingresos,
      });

      // Distribución rutas por destino (top 6)
      if (Array.isArray(rutas)) {
        const dist = rutas.slice(0, 6).map(r => ({ nombre: r.destino?.ciudad || r.codigo || "—", valor: 1 }));
        setRutasDist(dist);
      }

      // Viajes más recientes
      if (Array.isArray(viajes)) {
        setViajesRecientes(viajes.slice(0, 5));
      }

      // Viajes con menos asientos disponibles
      if (Array.isArray(viajes)) {
        const conAsientos = viajes.filter(v => v.asientosDisponibles !== undefined).sort((a,b) => (a.asientosDisponibles||0) - (b.asientosDisponibles||0)).slice(0, 4);
        setStockBajo(conAsientos.map(v => ({ nombre: `${v.ruta?.origen?.ciudad||"?"} → ${v.ruta?.destino?.ciudad||"?"}`, actual: v.asientosDisponibles || 0, minimo: Math.floor((v.totalAsientos || 10) * 0.2) })));
      }

      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding:"3rem", textAlign:"center", color: C.medio }}>Cargando dashboard...</div>;

  return (
    <div>
      {/* Banner valor total */}
      <div style={{ background: `linear-gradient(135deg, ${C.oscuro} 0%, ${C.verde} 100%)`, borderRadius:16, padding:"24px 28px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize:13, marginBottom:4 }}>Ingresos por Encomiendas Registradas</div>
          <div style={{ color: C.blanco, fontSize:32, fontWeight:800, fontFamily:"'Playfair Display',serif" }}>
            S/ {stats.ingresos.toLocaleString("es-PE", { minimumFractionDigits:2 })}
          </div>
        </div>
        <div style={{ width:52, height:52, background:"rgba(255,255,255,0.15)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>💰</div>
      </div>

      {/* Tarjetas estadísticas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon="🗺" valor={stats.rutas}       label="Total Rutas"      color={C.verde}   />
        <StatCard icon="📅" valor={stats.viajesHoy}   label="Viajes hoy"      color={C.amarillo} alerta={stats.viajesHoy>0} />
        <StatCard icon="🚌" valor={stats.buses}       label="Buses en flota"  color={C.verde}   />
        <StatCard icon="👥" valor={stats.clientes}    label="Clientes"        color={C.verde}   />
        <StatCard icon="📦" valor={stats.encPendientes} label="Enc. en tránsito" color="#e67e22" alerta={stats.encPendientes>0} />
        <StatCard icon="✅" valor={stats.viajes}      label="Total viajes"    color={C.verde}   />
      </div>

      {/* Gráficas */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
        {/* Dona: distribución rutas */}
        <div style={{ background:C.blanco, borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 12px rgba(16,64,59,0.06)", border:"1.5px solid #e8eeec" }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.oscuro, marginBottom:16 }}>Distribución de rutas por destino</div>
          {rutasDist.length > 0
            ? <DonutChart data={rutasDist} />
            : <div style={{ color:C.medio, fontSize:13, padding:"1.5rem 0" }}>Sin datos de rutas aún</div>
          }
        </div>

        {/* Barras: viajes con menos asientos */}
        <div style={{ background:C.blanco, borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 12px rgba(16,64,59,0.06)", border:"1.5px solid #e8eeec" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.oscuro }}>Asientos disponibles por viaje</div>
            {stockBajo.length > 0 && <span style={{ background:"rgba(230,126,34,0.15)", color:"#e67e22", borderRadius:50, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{stockBajo.length}</span>}
          </div>
          {stockBajo.length > 0
            ? <>
                <BarChart data={stockBajo} colorActual={C.verde} colorMin={C.amarillo} />
                <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:C.verde, display:"inline-block" }}/> Disponibles</span>
                  <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:C.amarillo, display:"inline-block" }}/> Mínimo 20%</span>
                </div>
              </>
            : <div style={{ color:C.medio, fontSize:13, padding:"1.5rem 0" }}>Sin viajes programados aún</div>
          }
        </div>
      </div>

      {/* Viajes recientes + Acciones rápidas */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
        {/* Viajes recientes */}
        <div style={{ background:C.blanco, borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 12px rgba(16,64,59,0.06)", border:"1.5px solid #e8eeec" }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.oscuro, marginBottom:14 }}>Viajes recientes</div>
          {viajesRecientes.length === 0
            ? <div style={{ color:C.medio, fontSize:13, padding:"1rem 0" }}>Sin viajes registrados aún</div>
            : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ borderBottom:`2px solid ${C.fondo}` }}>
                  <th style={{ textAlign:"left", padding:"6px 8px", color:C.medio, fontWeight:700, fontSize:11, letterSpacing:"0.07em", textTransform:"uppercase" }}>Ruta</th>
                  <th style={{ textAlign:"left", padding:"6px 8px", color:C.medio, fontWeight:700, fontSize:11, letterSpacing:"0.07em", textTransform:"uppercase" }}>Bus</th>
                  <th style={{ textAlign:"left", padding:"6px 8px", color:C.medio, fontWeight:700, fontSize:11, letterSpacing:"0.07em", textTransform:"uppercase" }}>Salida</th>
                  <th style={{ textAlign:"left", padding:"6px 8px", color:C.medio, fontWeight:700, fontSize:11, letterSpacing:"0.07em", textTransform:"uppercase" }}>Estado</th>
                </tr></thead>
                <tbody>{viajesRecientes.map(v => (
                  <tr key={v.id} style={{ borderBottom:`1px solid ${C.fondo}` }}>
                    <td style={{ padding:"10px 8px", color:C.oscuro, fontWeight:600 }}>{v.ruta?.origen?.ciudad||"—"} → {v.ruta?.destino?.ciudad||"—"}</td>
                    <td style={{ padding:"10px 8px" }}><span style={{ background:"rgba(18,115,105,0.1)", color:C.verde, borderRadius:6, padding:"2px 8px", fontFamily:"monospace", fontSize:12 }}>{v.bus?.placa||"—"}</span></td>
                    <td style={{ padding:"10px 8px", color:C.gris, fontSize:12 }}>{fmtFecha(v.fechaHoraSalida)}</td>
                    <td style={{ padding:"10px 8px" }}><Badge text={v.estado}/></td>
                  </tr>
                ))}</tbody>
              </table>
          }
        </div>

        {/* Acciones rápidas */}
        <div style={{ background:C.blanco, borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 12px rgba(16,64,59,0.06)", border:"1.5px solid #e8eeec" }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.oscuro, marginBottom:14 }}>Acciones rápidas</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"🗺", label:"Nueva ruta",    key:"rutas" },
              { icon:"📅", label:"Nuevo viaje",   key:"viajes" },
              { icon:"🚌", label:"Nuevo bus",     key:"buses" },
              { icon:"📦", label:"Encomiendas",   key:"encomiendas" },
              { icon:"👥", label:"Clientes",      key:"clientes" },
            ].map(a => (
              <button key={a.key} onClick={() => onNav(a.key)} style={{
                background: C.fondo, border:`1.5px solid #e2ecea`,
                borderRadius:10, padding:"12px 14px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:10, fontSize:14,
                color: C.oscuro, fontWeight:600, textAlign:"left",
                transition:"all 0.18s", fontFamily:"inherit"
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(18,115,105,0.08)"; e.currentTarget.style.borderColor = C.verde; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.fondo; e.currentTarget.style.borderColor = "#e2ecea"; }}
              >
                <span style={{ fontSize:18 }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT PRINCIPAL ─────────────────────────────────
export default function AdminDashboard() {
  const { session, logout } = useAuth();
  const [seccion, setSeccion] = useState("dashboard");
  const [toast,   setToast]   = useState("");
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${session.token}` };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const iniciales = (session.username||"AD").slice(0,2).toUpperCase();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.fondo, fontFamily:"'Source Sans 3', Arial, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sideCollapsed ? 68 : 230,
        background: C.oscuro,
        display:"flex", flexDirection:"column",
        padding:"0", position:"sticky", top:0, height:"100vh",
        transition:"width 0.22s", flexShrink:0, overflow:"hidden"
      }}>
        {/* Logo */}
        <div style={{ padding:"18px 16px 12px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10 }}>
          <LogoSVG width={36} height={36} />
          {!sideCollapsed && <div><div style={{ fontFamily:"'Playfair Display',serif", color:C.amarillo, fontSize:13, fontWeight:700, lineHeight:1 }}>INTIWATANA</div><div style={{ color:C.medio, fontSize:10, letterSpacing:"0.07em", textTransform:"uppercase" }}>Admin Panel</div></div>}
        </div>

        {/* Navegación */}
        <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
          {MENU.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setSeccion(key)} style={{
              width:"100%", background: seccion===key ? "rgba(245,197,24,0.15)" : "transparent",
              border: seccion===key ? `1.5px solid rgba(245,197,24,0.3)` : "1.5px solid transparent",
              borderRadius:10, color: seccion===key ? C.amarillo : C.medio,
              padding: sideCollapsed ? "10px 0" : "10px 14px",
              cursor:"pointer", display:"flex", alignItems:"center", gap:10,
              fontSize:13, fontWeight:600, textAlign:"left", transition:"all 0.18s",
              fontFamily:"inherit", justifyContent: sideCollapsed ? "center" : "flex-start"
            }}>
              <span style={{ fontSize:17, flexShrink:0 }}>{icon}</span>
              {!sideCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{ padding:"12px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:C.amarillo, color:C.oscuro, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{iniciales}</div>
          {!sideCollapsed && <div style={{ flex:1, overflow:"hidden" }}>
            <div style={{ color:C.blanco, fontSize:12, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{session.username}</div>
            <div style={{ color:C.medio, fontSize:10 }}>Administrador</div>
          </div>}
          {!sideCollapsed && <button onClick={logout} title="Cerrar sesión" style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", borderRadius:7, color:C.medio, width:28, height:28, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>⏻</button>}
        </div>
      </aside>

      {/* ── CONTENIDO ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <header style={{ background:C.blanco, borderBottom:"1px solid #e8eeec", padding:"0 28px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={() => setSideCollapsed(s => !s)} style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:18, color:C.gris, padding:"4px 6px", borderRadius:6 }}>☰</button>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:C.oscuro }}>{MENU.find(m=>m.key===seccion)?.label || "Dashboard"}</div>
              <div style={{ fontSize:11, color:C.medio }}>Sistema Web INTIWATANA S.R.L.</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:12, color:C.gris }}>{new Date().toLocaleDateString("es-PE", { weekday:"short", day:"2-digit", month:"long" })}</div>
            <button onClick={logout} style={{ background:"rgba(220,38,38,0.1)", color:"#dc2626", border:"1px solid rgba(220,38,38,0.2)", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cerrar sesión</button>
          </div>
        </header>

        {/* Área principal */}
        <main style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>
          {seccion === "dashboard"   && <DashboardHome  headers={headers} onNav={setSeccion} />}
          {seccion === "rutas"       && <CrudRutas       headers={headers} showToast={showToast} />}
          {seccion === "sucursales"  && <CrudSucursales  headers={headers} showToast={showToast} />}
          {seccion === "buses"       && <CrudBuses       headers={headers} showToast={showToast} />}
          {seccion === "viajes"      && <CrudViajes      headers={headers} showToast={showToast} />}
          {seccion === "clientes"    && <CrudClientes    headers={headers} showToast={showToast} />}
          {seccion === "encomiendas" && <CrudEncomiendas headers={headers} showToast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, background: toast.startsWith("⚠") ? "#c0392b" : C.oscuro, color:C.blanco, padding:"12px 20px", borderRadius:12, fontSize:14, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", zIndex:9999, animation:"slideUp 0.3s ease", fontFamily:"inherit" }}>
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
        .confirm-modal { max-width:360px; }
      `}</style>
    </div>
  );
}