import { useState, useEffect, useCallback, useRef, useMemo, Component } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Building2, Map, Bus, CalendarDays, Users, Package,
  Route, LogOut, CheckCircle2, Ticket, Shield, Search, Plus, Pencil, Trash2,
  RefreshCw, X, ChevronLeft, ChevronRight, Navigation, Armchair, UserCircle,
  Filter, AlertCircle, Info, CreditCard, Zap, AlertTriangle, Scale,
  MapPin, Flag, Clock, ArrowRight,
} from "lucide-react";
import LogoSVG from "./LogoSVG";
import CrudAsientos from "./CrudAsientos";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("AdminDashboard error:", error, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding:"2rem", textAlign:"center" }}>
        <AlertCircle size={40} color={C.rojo} style={{ marginBottom:12 }}/>
        <h3 style={{ color:C.rojo, marginBottom:8 }}>Error al cargar este módulo</h3>
        <p style={{ color:C.gris, fontSize:13, marginBottom:16 }}>{this.state.error?.message || "Error inesperado"}</p>
        <button onClick={() => this.setState({ hasError:false, error:null })} style={{ background:C.verde, color:"white", border:"none", borderRadius:8, padding:"0.6rem 1.4rem", cursor:"pointer", fontWeight:700 }}>
          <RefreshCw size={14} style={{ marginRight:6 }}/>Reintentar
        </button>
      </div>
    );
    return this.props.children;
  }
}

const C = {
  verde:"#127369", oscuro:"#0d3330", amarillo:"#F5C518",
  medio:"#7a9e9b", gris:"#4C5958", grisClaro:"#8AA6A3",
  fondo:"#f0f4f3", blanco:"#ffffff", rojo:"#e05252", naranja:"#e67e22",
};

function fmtFecha(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso); if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-PE",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  } catch { return "—"; }
}

function useCountUp(target, duration=900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start=null;
    const step=(ts)=>{ if(!start)start=ts; const p=Math.min((ts-start)/duration,1); setVal(Math.floor(p*target)); if(p<1)requestAnimationFrame(step); };
    requestAnimationFrame(step);
  },[target,duration]);
  return val;
}
function AnimNum({ value }) { const n=useCountUp(value); return <>{n}</>; }

function Badge({ text }) {
  const map = {
    PROGRAMADO:{bg:"rgba(18,115,105,0.12)",c:C.verde},EN_CURSO:{bg:"rgba(245,197,24,0.2)",c:"#9a7a00"},
    FINALIZADO:{bg:"rgba(52,199,89,0.15)",c:"#15803d"},CANCELADO:{bg:"rgba(224,82,82,0.12)",c:C.rojo},
    ACTIVO:{bg:"rgba(18,115,105,0.12)",c:C.verde},USADO:{bg:"rgba(52,199,89,0.15)",c:"#15803d"},
    RECIBIDO:{bg:"rgba(245,197,24,0.2)",c:"#9a7a00"},EN_TRANSITO:{bg:"rgba(18,115,105,0.12)",c:C.verde},
    ENTREGADO:{bg:"rgba(52,199,89,0.15)",c:"#15803d"},NORMAL:{bg:"rgba(18,115,105,0.12)",c:C.verde},
    ECONOMICO:{bg:"rgba(18,115,105,0.12)",c:C.verde},SEMI_CAMA:{bg:"rgba(245,197,24,0.2)",c:"#9a7a00"},
    CAMA:{bg:"rgba(122,158,155,0.2)",c:C.gris},CAMA_SUITE:{bg:"rgba(148,103,189,0.15)",c:"#7b2d8b"},
    PERSONA:{bg:"rgba(18,115,105,0.12)",c:C.verde},EMPRESA:{bg:"rgba(245,197,24,0.2)",c:"#9a7a00"},
    ROLE_ADMIN:{bg:"rgba(224,82,82,0.12)",c:C.rojo},ROLE_CAJERO:{bg:"rgba(18,115,105,0.12)",c:C.verde},
    ROLE_CHOFER:{bg:"rgba(245,197,24,0.2)",c:"#9a7a00"},ROLE_CLIENTE:{bg:"rgba(122,158,155,0.2)",c:C.gris},
  };
  const s = map[text] || {bg:"rgba(122,158,155,0.15)",c:C.gris};
  return <span style={{background:s.bg,color:s.c,borderRadius:50,padding:"3px 11px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>
    <span>{text?.replace(/_/g," ") || "—"}</span>
  </span>;
}

function StatCard({ icon, valor, label, color, sub, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:hover?`linear-gradient(135deg,${color}18,${color}08)`:C.blanco,borderRadius:16,padding:"20px 22px",border:`1.5px solid ${hover?color+"55":"#e2edeb"}`,boxShadow:hover?`0 8px 28px ${color}22`:"0 2px 10px rgba(16,64,59,0.05)",cursor:onClick?"pointer":"default",transition:"all 0.25s",transform:hover?"translateY(-3px)":"none",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-12,right:-12,opacity:0.06,lineHeight:1}}>{icon}</div>
      <div style={{marginBottom:8,color}}>{icon}</div>
      <div style={{fontSize:34,fontWeight:900,color:C.oscuro,fontFamily:"'Playfair Display',serif",lineHeight:1}}><AnimNum value={valor}/></div>
      <div style={{fontSize:11,fontWeight:700,color:C.medio,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:5}}>{label}</div>
      {sub && <div style={{fontSize:11,color:C.medio,marginTop:2}}>{sub}</div>}
    </div>
  );
}

function DonutChart({ data, size=130 }) {
  if (!data?.length) return null;
  const colores=[C.verde,C.amarillo,C.rojo,C.naranja,"#9b59b6","#3498db"];
  const total=data.reduce((s,d)=>s+(d.valor||0),0)||1;
  let acum=0;
  const arcos=data.map((d,i)=>{ const pct=(d.valor||0)/total; const ini=acum; acum+=pct; const a1=ini*2*Math.PI-Math.PI/2; const a2=acum*2*Math.PI-Math.PI/2; const R=size/2-10,r=R-22,cx=size/2,cy=size/2; const x1e=cx+R*Math.cos(a1),y1e=cy+R*Math.sin(a1); const x2e=cx+R*Math.cos(a2),y2e=cy+R*Math.sin(a2); const x1i=cx+r*Math.cos(a2),y1i=cy+r*Math.sin(a2); const x2i=cx+r*Math.cos(a1),y2i=cy+r*Math.sin(a1); const grande=pct>0.5?1:0; if(pct<0.005)return null; return <path key={i} d={`M${x1e},${y1e} A${R},${R} 0 ${grande},1 ${x2e},${y2e} L${x1i},${y1i} A${r},${r} 0 ${grande},0 ${x2i},${y2i} Z`} fill={colores[i%colores.length]} opacity={0.88}/>; });
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>{arcos}</svg>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {data.map((d,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:12}}><div style={{width:10,height:10,borderRadius:3,background:colores[i%colores.length],flexShrink:0}}/><span style={{color:C.gris}}>{d.nombre}</span><strong style={{color:C.oscuro,marginLeft:"auto",paddingLeft:8}}>{d.valor}</strong></div>))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max>0?Math.round((value/max)*100):0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:6,background:"#e8f0ee",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width 1s"}}/>
      </div>
      <span style={{fontSize:11,fontWeight:700,color:C.gris,minWidth:28}}>{pct}%</span>
    </div>
  );
}

// ── Shared UI components ──────────────────────────────
function PageHeader({ title, sub, action }) {
  return (
    <div className="adm-topbar">
      <div><h2 className="adm-page-title">{title}</h2>{sub&&<p className="adm-page-sub">{sub}</p>}</div>
      {action}
    </div>
  );
}
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="adm-search-row" style={{display:"flex",alignItems:"center",gap:8}}>
      <Search size={15} color={C.medio} style={{position:"absolute",marginLeft:10,pointerEvents:"none"}}/>
      <input className="adm-search" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Buscar..."} style={{paddingLeft:32}}/>
    </div>
  );
}
function TableWrap({ load, empty, children }) {
  if (load) return <div className="adm-table-wrap"><div className="skeleton-rows">{[1,2,3,4].map(i=><div key={i} className="skeleton-row"/>)}</div></div>;
  if (empty) return <div className="adm-table-wrap"><div className="td-empty">{empty}</div></div>;
  return <div className="adm-table-wrap">{children}</div>;
}
function Field({ label, children, style }) {
  return <div className="lf-field" style={style}><label>{label}</label>{children}</div>;
}
function Actions({ onEdit, onDel, extra }) {
  return (
    <div className="td-actions">
      <button className="btn-edit" onClick={onEdit} title="Editar"><Pencil size={13}/></button>
      <button className="btn-delete" onClick={onDel} title="Eliminar"><Trash2 size={13}/></button>
      {extra}
    </div>
  );
}
function ConfirmModal({ onConfirmar, onCancelar }) {
  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal" style={{padding:"28px 24px",textAlign:"center"}}>
        <AlertTriangle size={36} color={C.rojo} style={{marginBottom:12}}/>
        <h3 style={{margin:"0 0 8px",color:C.oscuro}}>¿Confirmar eliminación?</h3>
        <p style={{color:C.gris,fontSize:13,marginBottom:20}}>Esta acción no se puede deshacer.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
          <button className="btn-delete-confirm" onClick={onConfirmar}><Trash2 size={14} style={{marginRight:6}}/>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
function ModalForm({ titulo, icon, onClose, onSubmit, saving, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:560,width:"95%"}}>
        <div className="modal-header">
          <div className="modal-badge">{icon||<Plus size={20}/>}</div>
          <div><div className="modal-title">{titulo}</div></div>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit}>
            {children}
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button type="button" className="btn-cancelar" onClick={onClose} style={{flex:1}}>Cancelar</button>
              <button type="submit" className="btn-reservar" style={{flex:2}} disabled={saving}>
                {saving?<span className="spinner"/>:<span><CheckCircle2 size={15} style={{verticalAlign:"middle",marginRight:4}}/>Guardar</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// DASHBOARD HOME
// ═══════════════════════════════════════════════════════
function DashboardHome({ headers, onNav }) {
  const [data, setData] = useState({ rutas:0,viajes:0,buses:0,clientes:0,encomiendas:0,sucursales:0,viajeStats:{},viajesOrdenados:[],programados:0,enCurso:0,finalizados:0,ocupProm:0 });
  const [load, setLoad] = useState(true);
  const [paginaViajes, setPaginaViajes] = useState(0);
  const VIAJES_POR_PAG = 8;

  const hdrsRef = useRef(headers);
  useEffect(() => { hdrsRef.current = headers; });

  useEffect(() => {
    const toArr = d => {
      if (!d) return [];
      if (Array.isArray(d)) return d;
      if (Array.isArray(d.content)) return d.content;
      if (Array.isArray(d.data)) return d.data;
      return [];
    };
    const get = (url) => fetch(url, { headers: hdrsRef.current })
      .then(r => { if (!r.ok) { console.warn(`GET ${url} →`, r.status); return null; } return r.json(); })
      .catch(e => { console.warn(`GET ${url}:`, e.message); return null; });

    Promise.all([
      get("/api/v1/rutas"),
      get("/api/v1/viajes"),
      get("/api/v1/buses"),
      get("/api/v1/clientes?page=0&size=1000"),
      get("/api/v1/encomiendas"),
      get("/api/v1/sucursales"),
    ]).then(([rutas, viajes, buses, clientesResp, encomiendas, sucursales]) => {
      const vArr = toArr(viajes);
      const cArr = toArr(clientesResp);
      const vStats = vArr.reduce((acc,v) => { acc[v.estado]=(acc[v.estado]||0)+1; return acc; }, {});
      const vProg = vArr.filter(v => v.estado === "PROGRAMADO");
      const occ = vProg.length > 0
        ? Math.round(vProg.reduce((s,v) => {
            const t = v.totalAsientos||40, lib = v.asientosDisponibles??t;
            return s + ((t-lib)/t*100);
          }, 0) / vProg.length)
        : 0;
      setData({
        rutas: toArr(rutas).length,
        viajes: vArr.length,
        buses: toArr(buses).length,
        clientes: cArr.length,
        encomiendas: toArr(encomiendas).length,
        sucursales: toArr(sucursales).length,
        viajeStats: vStats,
        programados: vStats["PROGRAMADO"]||0,
        enCurso: vStats["EN_CURSO"]||0,
        finalizados: vStats["FINALIZADO"]||0,
        ocupProm: occ,
        viajesOrdenados: [...vArr].sort((a,b) => new Date(b.fechaHoraSalida)-new Date(a.fechaHoraSalida)),
      });
      setLoad(false);
    }).catch(e => { console.error("Dashboard error:", e); setLoad(false); });
  }, []); // sin dependencias → solo corre al montar

  const donutViajes=Object.entries(data.viajeStats||{}).map(([k,v])=>({nombre:k.replace(/_/g," "),valor:v}));
  const totalPags=Math.ceil((data.viajesOrdenados?.length||0)/VIAJES_POR_PAG);
  const viajesPagina=(data.viajesOrdenados||[]).slice(paginaViajes*VIAJES_POR_PAG,(paginaViajes+1)*VIAJES_POR_PAG);

  if (load) return <div style={{textAlign:"center",padding:"4rem",color:C.medio}}><div className="pulse-logo"><Bus size={48}/></div><p style={{marginTop:12}}>Cargando datos...</p></div>;

  return (
    <div>
      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:22}}>
        <StatCard icon={<Route size={22}/>} valor={data.rutas} label="Rutas activas" color={C.verde} onClick={()=>onNav("rutas")}/>
        <StatCard icon={<CalendarDays size={22}/>} valor={data.viajes} label="Total viajes" color={C.amarillo} onClick={()=>onNav("viajes")}/>
        <StatCard icon={<Bus size={22}/>} valor={data.buses} label="Flota activa" color={C.verde} onClick={()=>onNav("buses")}/>
        <StatCard icon={<Users size={22}/>} valor={data.clientes} label="Clientes" color={C.naranja} onClick={()=>onNav("clientes")}/>
        <StatCard icon={<Package size={22}/>} valor={data.encomiendas} label="Encomiendas" color={C.rojo} onClick={()=>onNav("encomiendas")}/>
        <StatCard icon={<Building2 size={22}/>} valor={data.sucursales} label="Sucursales" color={C.gris} onClick={()=>onNav("sucursales")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* Ocupación */}
        <div className="card-panel">
          <div className="panel-title" style={{display:"flex",alignItems:"center",gap:7}}><Armchair size={15} color={C.verde}/> Ocupación promedio (viajes prog.)</div>
          <div style={{fontSize:36,fontWeight:900,color:C.verde,fontFamily:"'Playfair Display',serif",marginBottom:8}}>{data.ocupProm}%</div>
          <ProgressBar value={data.ocupProm} max={100} color={data.ocupProm>80?C.rojo:data.ocupProm>50?C.naranja:C.verde}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
            {[{l:"Programados",v:data.programados,c:C.verde},{l:"En curso",v:data.enCurso,c:C.amarillo},{l:"Finalizados",v:data.finalizados,c:C.gris}].map(s=>(
              <div key={s.l} style={{textAlign:"center",background:"#f8faf9",borderRadius:8,padding:"8px 4px"}}>
                <div style={{fontSize:20,fontWeight:900,color:s.c}}>{s.v}</div>
                <div style={{fontSize:10,color:C.medio}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Donut viajes */}
        <div className="card-panel">
          <div className="panel-title" style={{display:"flex",alignItems:"center",gap:7}}><CalendarDays size={15} color={C.verde}/> Estado de Viajes</div>
          {donutViajes.length>0?<DonutChart data={donutViajes} size={130}/>:<p style={{color:C.medio,fontSize:13}}>Sin viajes registrados</p>}
        </div>
      </div>

      {/* Tabla viajes paginada */}
      <div className="card-panel">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div className="panel-title" style={{margin:0,display:"flex",alignItems:"center",gap:7}}><Clock size={15} color={C.verde}/> Todos los viajes</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:C.medio}}>{data.viajesOrdenados?.length||0} viajes · pág. {paginaViajes+1}/{Math.max(totalPags,1)}</span>
            <button disabled={paginaViajes===0} onClick={()=>setPaginaViajes(p=>p-1)} style={{background:paginaViajes===0?"#f0f4f3":C.verde,color:paginaViajes===0?C.grisClaro:"white",border:"none",borderRadius:7,width:28,height:28,cursor:paginaViajes===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronLeft size={14}/></button>
            <button disabled={paginaViajes>=totalPags-1} onClick={()=>setPaginaViajes(p=>p+1)} style={{background:paginaViajes>=totalPags-1?"#f0f4f3":C.verde,color:paginaViajes>=totalPags-1?C.grisClaro:"white",border:"none",borderRadius:7,width:28,height:28,cursor:paginaViajes>=totalPags-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={14}/></button>
          </div>
        </div>
        {viajesPagina.length===0?(<p style={{color:C.medio,fontSize:13,padding:"1rem 0"}}>Sin viajes registrados.</p>):(
          <div style={{overflowX:"auto"}}>
            <table className="adm-table">
              <thead><tr><th>Ruta</th><th>Bus</th><th>Salida</th><th>Precio</th><th>Estado</th></tr></thead>
              <tbody>
                {viajesPagina.map(v=>(
                  <tr key={v.id} className="tr-hover">
                    <td><strong>{v.ruta?.origen?.ciudad||"—"}</strong><span style={{color:C.medio}}> → </span><strong>{v.ruta?.destino?.ciudad||"—"}</strong></td>
                    <td><span className="td-codigo">{v.bus?.placa||"—"}</span></td>
                    <td style={{fontSize:12}}>{fmtFecha(v.fechaHoraSalida)}</td>
                    <td><strong style={{color:C.verde}}>S/ {v.precioAdulto||"—"}</strong></td>
                    <td><Badge text={v.estado}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{display:"flex",gap:4,marginTop:10,justifyContent:"center",flexWrap:"wrap"}}>
          {Array.from({length:totalPags},(_,i)=>(
            <button key={i} onClick={()=>setPaginaViajes(i)} style={{width:28,height:28,borderRadius:6,border:"none",background:paginaViajes===i?C.verde:"#f0f4f3",color:paginaViajes===i?"white":C.gris,cursor:"pointer",fontWeight:700,fontSize:12}}>{i+1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// CRUD: Sucursales
// ═══════════════════════════════════════════════════════
function CrudSucursales({ headers, showToast }) {
  const [items,setItems]=useState([]);const [load,setLoad]=useState(true);const [buscar,setBuscar]=useState("");
  const [modal,setModal]=useState(null);const [form,setForm]=useState({});const [conf,setConf]=useState(null);const [saving,setSaving]=useState(false);

  const cargar=useCallback(async()=>{setLoad(true);try{const r=await fetch("/api/v1/sucursales",{headers});const d=r.ok?await r.json():[];setItems(Array.isArray(d)?d:[]);}catch{showToast("Error al cargar sucursales");}finally{setLoad(false);};},[headers,showToast]);
  useEffect(()=>{cargar();},[cargar]);

  const abrir=(s=null)=>{setForm(s?{id:s.id,nombre:s.nombre||"",codigo:s.codigo||"",ciudad:s.ciudad||"",provincia:s.provincia||"",departamento:s.departamento||"",direccion:s.direccion||"",telefono:s.telefono||"",esTerminal:s.esTerminal||false}:{nombre:"",codigo:"",ciudad:"",provincia:"",departamento:"",direccion:"",telefono:"",esTerminal:false});setModal(s||"nuevo");};

  const guardar=async(e)=>{e.preventDefault();if(!form.nombre||!form.ciudad)return showToast("Nombre y ciudad son obligatorios");setSaving(true);try{const isEdit=!!form.id;const res=await fetch(isEdit?`/api/v1/sucursales/${form.id}`:"/api/v1/sucursales",{method:isEdit?"PUT":"POST",headers,body:JSON.stringify({nombre:form.nombre,codigo:form.codigo,ciudad:form.ciudad,provincia:form.provincia,departamento:form.departamento,direccion:form.direccion,telefono:form.telefono,esTerminal:form.esTerminal})});if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.mensaje||"Error");}const data=await res.json();setItems(prev=>isEdit?prev.map(x=>x.id===data.id?data:x):[...prev,data]);showToast(isEdit?"Sucursal actualizada":"Sucursal creada");setModal(null);}catch(err){showToast(err.message);}finally{setSaving(false);};};

  const eliminar=async(id)=>{try{await fetch(`/api/v1/sucursales/${id}`,{method:"DELETE",headers});setItems(prev=>prev.filter(x=>x.id!==id));showToast("Sucursal eliminada");}catch{showToast("Error al eliminar");}finally{setConf(null);};};

  const fil=items.filter(s=>`${s.nombre} ${s.ciudad} ${s.codigo}`.toLowerCase().includes(buscar.toLowerCase()));

  return (<>
    <PageHeader title="Gestión de Sucursales" sub={`${items.length} sucursales`} action={<button className="adm-btn-primary" onClick={()=>abrir()}><Plus size={15} style={{marginRight:6}}/>Nueva sucursal</button>}/>
    <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por nombre, ciudad o código..."/>
    <TableWrap load={load} empty={!fil.length&&"Sin sucursales registradas"}>
      <table className="adm-table">
        <thead><tr><th>Nombre</th><th>Código</th><th>Ciudad</th><th>Departamento</th><th>Teléfono</th><th>Terminal</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(s=>(
            <tr key={s.id} className="tr-hover">
              <td><strong>{s.nombre}</strong></td>
              <td><span className="td-codigo">{s.codigo||"—"}</span></td>
              <td>{s.ciudad||"—"}</td>
              <td style={{fontSize:12,color:C.medio}}>{s.departamento||"—"}</td>
              <td>{s.telefono||"—"}</td>
              <td><Badge text={s.esTerminal?"SÍ":"NO"}/></td>
              <td><Actions onEdit={()=>abrir(s)} onDel={()=>setConf(s.id)}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
    {modal&&(<ModalForm titulo={modal==="nuevo"?"Nueva sucursal":"Editar sucursal"} icon={<Building2 size={20}/>} onClose={()=>setModal(null)} onSubmit={guardar} saving={saving}>
      <div className="form-grid">
        <Field label="Nombre *"><input value={form.nombre||""} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} required/></Field>
        <Field label="Código"><input value={form.codigo||""} onChange={e=>setForm(f=>({...f,codigo:e.target.value}))} placeholder="AYA-01"/></Field>
        <Field label="Ciudad *"><input value={form.ciudad||""} onChange={e=>setForm(f=>({...f,ciudad:e.target.value}))} required/></Field>
        <Field label="Provincia"><input value={form.provincia||""} onChange={e=>setForm(f=>({...f,provincia:e.target.value}))}/></Field>
        <Field label="Departamento"><input value={form.departamento||""} onChange={e=>setForm(f=>({...f,departamento:e.target.value}))}/></Field>
        <Field label="Teléfono"><input value={form.telefono||""} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></Field>
        <Field label="Dirección" style={{gridColumn:"1/-1"}}><input value={form.direccion||""} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))}/></Field>
        <Field label="¿Es terminal principal?" style={{gridColumn:"1/-1"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
            <input type="checkbox" checked={!!form.esTerminal} onChange={e=>setForm(f=>({...f,esTerminal:e.target.checked}))} style={{width:16,height:16,accentColor:C.verde}}/>
            <span style={{fontSize:13}}>Marcar como terminal principal</span>
          </label>
        </Field>
      </div>
    </ModalForm>)}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>setConf(null)}/>}
  </>);
}

// ═══════════════════════════════════════════════════════
// CRUD: Rutas
// ═══════════════════════════════════════════════════════
function CrudRutas({ headers, showToast }) {
  const [items,setItems]=useState([]);const [sucursales,setSucursales]=useState([]);const [load,setLoad]=useState(true);const [buscar,setBuscar]=useState("");
  const [modal,setModal]=useState(null);const [form,setForm]=useState({});const [conf,setConf]=useState(null);const [saving,setSaving]=useState(false);

  const cargar=useCallback(async()=>{setLoad(true);try{const[r1,r2]=await Promise.all([fetch("/api/v1/rutas",{headers}),fetch("/api/v1/sucursales",{headers})]);setItems(r1.ok?await r1.json():[]);setSucursales(r2.ok?await r2.json():[]);}catch{showToast("Error al cargar rutas");}finally{setLoad(false);};},[headers,showToast]);
  useEffect(()=>{cargar();},[cargar]);

  const abrir=(r=null)=>{setForm(r?{id:r.id,codigo:r.codigo||"",origenId:r.origen?.id?.toString()||"",destinoId:r.destino?.id?.toString()||"",distanciaKm:r.distanciaKm?.toString()||"",duracionHorasEstimada:r.duracionHorasEstimada?.toString()||"",precioBase:r.precioBase?.toString()||""}:{codigo:"",origenId:"",destinoId:"",distanciaKm:"",duracionHorasEstimada:"",precioBase:""});setModal(r||"nuevo");};

  const guardar=async(e)=>{e.preventDefault();if(!form.origenId||!form.destinoId)return showToast("Origen y destino obligatorios");setSaving(true);try{const isEdit=!!form.id;const res=await fetch(isEdit?`/api/v1/rutas/${form.id}`:"/api/v1/rutas",{method:isEdit?"PUT":"POST",headers,body:JSON.stringify({codigo:form.codigo,sucursalOrigenId:parseInt(form.origenId),sucursalDestinoId:parseInt(form.destinoId),distanciaKm:form.distanciaKm?parseFloat(form.distanciaKm):null,duracionHorasEstimada:form.duracionHorasEstimada?parseFloat(form.duracionHorasEstimada):null,precioBase:form.precioBase?parseFloat(form.precioBase):null})});if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.mensaje||"Error");}const data=await res.json();setItems(prev=>isEdit?prev.map(x=>x.id===data.id?data:x):[...prev,data]);showToast(isEdit?"Ruta actualizada":"Ruta creada");setModal(null);}catch(err){showToast(err.message);}finally{setSaving(false);};};

  const eliminar=async(id)=>{try{await fetch(`/api/v1/rutas/${id}`,{method:"DELETE",headers});setItems(prev=>prev.filter(x=>x.id!==id));showToast("Ruta eliminada");}catch{showToast("Error");}finally{setConf(null);};};

  const fil=items.filter(r=>`${r.codigo||""} ${r.origen?.ciudad||""} ${r.destino?.ciudad||""}`.toLowerCase().includes(buscar.toLowerCase()));

  return (<>
    <PageHeader title="Gestión de Rutas" sub={`${items.length} rutas`} action={<button className="adm-btn-primary" onClick={()=>abrir()}><Plus size={15} style={{marginRight:6}}/>Nueva ruta</button>}/>
    <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por código u origen/destino..."/>
    <TableWrap load={load} empty={!fil.length&&"Sin rutas registradas"}>
      <table className="adm-table">
        <thead><tr><th>Código</th><th>Ruta</th><th>Distancia</th><th>Duración est.</th><th>Precio base</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(r=>(
            <tr key={r.id} className="tr-hover">
              <td><span className="td-codigo">{r.codigo||"—"}</span></td>
              <td><div className="td-lugar"><span className="td-ciudad" style={{display:"flex",alignItems:"center",gap:5}}><MapPin size={12} color={C.verde}/>{r.origen?.ciudad||"—"} <ArrowRight size={12} color={C.medio}/> {r.destino?.ciudad||"—"}</span></div></td>
              <td>{r.distanciaKm?`${r.distanciaKm} km`:"—"}</td>
              <td>{r.duracionHorasEstimada?`${r.duracionHorasEstimada} h`:"—"}</td>
              <td><strong style={{color:C.verde}}>{r.precioBase?`S/ ${r.precioBase}`:"—"}</strong></td>
              <td><Actions onEdit={()=>abrir(r)} onDel={()=>setConf(r.id)}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
    {modal&&(<ModalForm titulo={modal==="nuevo"?"Nueva ruta":"Editar ruta"} icon={<Route size={20}/>} onClose={()=>setModal(null)} onSubmit={guardar} saving={saving}>
      <div className="form-grid">
        <Field label="Código"><input value={form.codigo||""} onChange={e=>setForm(f=>({...f,codigo:e.target.value}))} placeholder="HUA-VIL-01"/></Field>
        <Field label="Precio base (S/)"><input type="number" step="0.01" value={form.precioBase||""} onChange={e=>setForm(f=>({...f,precioBase:e.target.value}))} placeholder="0.00"/></Field>
        <Field label="Origen *">
          <select className="lf-select" value={form.origenId||""} onChange={e=>setForm(f=>({...f,origenId:e.target.value}))} required>
            <option value="">Seleccionar...</option>
            {sucursales.map(s=><option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>)}
          </select>
        </Field>
        <Field label="Destino *">
          <select className="lf-select" value={form.destinoId||""} onChange={e=>setForm(f=>({...f,destinoId:e.target.value}))} required>
            <option value="">Seleccionar...</option>
            {sucursales.filter(s=>s.id!==Number(form.origenId)).map(s=><option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>)}
          </select>
        </Field>
        <Field label="Distancia (km)"><input type="number" step="0.1" value={form.distanciaKm||""} onChange={e=>setForm(f=>({...f,distanciaKm:e.target.value}))}/></Field>
        <Field label="Duración estimada (h)"><input type="number" step="0.5" value={form.duracionHorasEstimada||""} onChange={e=>setForm(f=>({...f,duracionHorasEstimada:e.target.value}))}/></Field>
      </div>
    </ModalForm>)}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>setConf(null)}/>}
  </>);
}

// ═══════════════════════════════════════════════════════
// CRUD: Buses
// ═══════════════════════════════════════════════════════
function CrudBuses({ headers, showToast }) {
  const [items,setItems]=useState([]);const [load,setLoad]=useState(true);const [buscar,setBuscar]=useState("");
  const [modal,setModal]=useState(null);const [form,setForm]=useState({});const [conf,setConf]=useState(null);const [saving,setSaving]=useState(false);

  const cargar=useCallback(async()=>{setLoad(true);try{const r=await fetch("/api/v1/buses",{headers});const d=r.ok?await r.json():[];setItems(Array.isArray(d)?d:[]);}catch{showToast("Error al cargar buses");}finally{setLoad(false);};},[headers,showToast]);
  useEffect(()=>{cargar();},[cargar]);

  const abrir=(b=null)=>{setForm(b?{id:b.id,placa:b.placa||"",marca:b.marca||"",modelo:b.modelo||"",tipo:b.tipo||"ECONOMICO",capacidadAsientos:b.capacidadAsientos?.toString()||"",numPisos:b.numPisos?.toString()||"1",anioFabricacion:b.anioFabricacion?.toString()||"",observaciones:b.observaciones||""}:{placa:"",marca:"",modelo:"",tipo:"ECONOMICO",capacidadAsientos:"",numPisos:"1",anioFabricacion:"",observaciones:""});setModal(b||"nuevo");};

  const guardar=async(e)=>{e.preventDefault();if(!form.placa||!form.marca||!form.capacidadAsientos)return showToast("Placa, marca y capacidad son obligatorios");setSaving(true);try{const isEdit=!!form.id;const res=await fetch(isEdit?`/api/v1/buses/${form.id}`:"/api/v1/buses",{method:isEdit?"PUT":"POST",headers,body:JSON.stringify({placa:form.placa.toUpperCase(),marca:form.marca,modelo:form.modelo,tipo:form.tipo,capacidadAsientos:parseInt(form.capacidadAsientos),numPisos:parseInt(form.numPisos)||1,anioFabricacion:form.anioFabricacion?parseInt(form.anioFabricacion):null,observaciones:form.observaciones||null})});if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.mensaje||"Error");}const data=await res.json();setItems(prev=>isEdit?prev.map(x=>x.id===data.id?data:x):[...prev,data]);showToast(isEdit?"Bus actualizado":"Bus creado");setModal(null);}catch(err){showToast(err.message);}finally{setSaving(false);};};

  const eliminar=async(id)=>{try{await fetch(`/api/v1/buses/${id}`,{method:"DELETE",headers});setItems(prev=>prev.filter(x=>x.id!==id));showToast("Bus eliminado");}catch{showToast("Error");}finally{setConf(null);};};

  const fil=items.filter(b=>`${b.placa} ${b.marca} ${b.modelo||""}`.toLowerCase().includes(buscar.toLowerCase()));

  return (<>
    <PageHeader title="Gestión de Autobuses" sub={`${items.length} buses`} action={<button className="adm-btn-primary" onClick={()=>abrir()}><Plus size={15} style={{marginRight:6}}/>Nuevo bus</button>}/>
    <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por placa, marca o modelo..."/>
    <TableWrap load={load} empty={!fil.length&&"Sin buses registrados"}>
      <table className="adm-table">
        <thead><tr><th>Placa</th><th>Marca / Modelo</th><th>Tipo</th><th>Capacidad</th><th>Pisos</th><th>Año</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(b=>(
            <tr key={b.id} className="tr-hover">
              <td><span className="td-codigo">{b.placa}</span></td>
              <td><strong>{b.marca}</strong>{b.modelo&&<span style={{color:C.medio,fontSize:12}}> {b.modelo}</span>}</td>
              <td><Badge text={b.tipo}/></td>
              <td style={{textAlign:"center"}}><strong>{b.capacidadAsientos}</strong></td>
              <td style={{textAlign:"center"}}>{b.numPisos||1}</td>
              <td>{b.anioFabricacion||"—"}</td>
              <td><Actions onEdit={()=>abrir(b)} onDel={()=>setConf(b.id)}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
    {modal&&(<ModalForm titulo={modal==="nuevo"?"Nuevo bus":"Editar bus"} icon={<Bus size={20}/>} onClose={()=>setModal(null)} onSubmit={guardar} saving={saving}>
      <div className="form-grid">
        <Field label="Placa *"><input value={form.placa||""} onChange={e=>setForm(f=>({...f,placa:e.target.value.toUpperCase()}))} required placeholder="ABC-123"/></Field>
        <Field label="Marca *"><input value={form.marca||""} onChange={e=>setForm(f=>({...f,marca:e.target.value}))} required/></Field>
        <Field label="Modelo"><input value={form.modelo||""} onChange={e=>setForm(f=>({...f,modelo:e.target.value}))}/></Field>
        <Field label="Tipo">
          <select className="lf-select" value={form.tipo||"ECONOMICO"} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
            <option value="ECONOMICO">Económico</option>
            <option value="SEMI_CAMA">Semi-cama</option>
            <option value="CAMA">Cama</option>
            <option value="CAMA_SUITE">Cama Suite</option>
          </select>
        </Field>
        <Field label="Capacidad (asientos) *"><input type="number" min="1" value={form.capacidadAsientos||""} onChange={e=>setForm(f=>({...f,capacidadAsientos:e.target.value}))} required/></Field>
        <Field label="N° de pisos"><input type="number" min="1" max="2" value={form.numPisos||1} onChange={e=>setForm(f=>({...f,numPisos:e.target.value}))}/></Field>
        <Field label="Año de fabricación"><input type="number" min="1990" max={new Date().getFullYear()} value={form.anioFabricacion||""} onChange={e=>setForm(f=>({...f,anioFabricacion:e.target.value}))}/></Field>
        <Field label="Observaciones" style={{gridColumn:"1/-1"}}><input value={form.observaciones||""} onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))}/></Field>
      </div>
    </ModalForm>)}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>setConf(null)}/>}
  </>);
}


// ═══════════════════════════════════════════════════════
// Mapa gráfico de asientos (para CrudViajes)
// ═══════════════════════════════════════════════════════
function MapaAsientosGrafico({ asientos, loading }) {
  if (loading) return <div style={{padding:"1rem",color:C.medio,fontSize:13,textAlign:"center"}}>Cargando mapa...</div>;
  if (!asientos.length) return <div style={{padding:"1rem",color:C.medio,fontSize:13,textAlign:"center"}}>Sin asientos registrados para este viaje.</div>;

  const disponibles=asientos.filter(a=>a.estado==="DISPONIBLE").length;
  const vendidos=asientos.filter(a=>a.estado==="VENDIDO").length;
  const reservados=asientos.filter(a=>a.estado==="RESERVADO").length;
  const maxFila=Math.max(...asientos.map(a=>a.fila||1),1);

  const colorEstado=(estado)=>{
    if(estado==="DISPONIBLE")return{bg:C.verde+"22",border:C.verde,c:C.verde};
    if(estado==="VENDIDO")return{bg:C.rojo+"22",border:C.rojo,c:C.rojo};
    if(estado==="RESERVADO")return{bg:C.naranja+"22",border:C.naranja,c:C.naranja};
    return{bg:"#f0f4f3",border:"#d4dbd9",c:C.gris};
  };

  return (
    <div>
      {/* Leyenda */}
      <div style={{display:"flex",gap:16,marginBottom:14,flexWrap:"wrap",padding:"10px 14px",background:"#f8faf9",borderRadius:10}}>
        {[
          {color:C.verde,label:"Disponible",val:disponibles},
          {color:C.rojo,label:"Vendido",val:vendidos},
          {color:C.naranja,label:"Reservado",val:reservados},
        ].map(s=>(
          <div key={s.label} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:14,height:14,borderRadius:4,background:s.color+"33",border:`2px solid ${s.color}`}}/>
            <span style={{fontSize:12,color:C.gris}}><strong style={{color:s.color}}>{s.val}</strong> {s.label}</span>
          </div>
        ))}
        <div style={{marginLeft:"auto",fontSize:12,color:C.gris}}>Total: <strong>{asientos.length}</strong></div>
      </div>

      {/* Bus visual */}
      <div style={{background:"white",borderRadius:12,padding:"14px 10px",border:`1.5px solid ${C.verde}22`,overflowX:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 16px",background:C.oscuro,borderRadius:20,fontSize:11,color:"white",fontWeight:700}}>
            <Navigation size={12}/> FRENTE DEL BUS
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
          {Array.from({length:maxFila},(_,fi)=>{
            const fila=fi+1;
            const asientosFila=asientos.filter(a=>a.fila===fila);
            return (
              <div key={fila} style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:C.medio,width:18,textAlign:"right",flexShrink:0}}>{fila}</span>
                {[1,2,null,3,4].map((col,idx)=>{
                  if(col===null)return<div key="pas" style={{width:16}}/>;
                  const a=asientosFila.find(x=>x.columna===col);
                  if(!a)return<div key={idx} style={{width:36,height:36}}/>;
                  const s=colorEstado(a.estado);
                  const tooltip = `Asiento ${a.numeroAsiento}\nEstado: ${a.estado}${a.pasajero ? `\nPasajero: ${a.pasajero}` : ""}${a.tipo ? `\nTipo: ${a.tipo}` : ""}`;
                  return(
                    <div key={a.id} title={tooltip}
                      style={{
                        width:36,height:36,borderRadius:8,background:s.bg,border:`2px solid ${s.border}`,
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                        fontSize:10,fontWeight:700,color:s.c,cursor:"default",transition:"all 0.15s",
                        position:"relative"
                      }}>
                      {a.numeroAsiento}
                      {a.pasajero && <UserCircle size={10} style={{marginTop:-2}}/>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"center",marginTop:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 16px",background:"#f0f4f3",borderRadius:20,fontSize:11,color:C.gris}}>
            PARTE TRASERA
          </div>
        </div>
      </div>

      {/* Lista de pasajeros (Resumen) */}
      {asientos.some(a => a.pasajero) && (
        <div style={{marginTop:20,borderTop:`1px solid ${C.verde}15`,paddingTop:15}}>
          <div style={{fontSize:12,fontWeight:700,color:C.oscuro,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <Users size={14} color={C.verde}/> Listado de Pasajeros
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:8}}>
            {asientos.filter(a => a.pasajero).sort((a,b) => a.numeroAsiento.localeCompare(b.numeroAsiento)).map(a => (
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.blanco,border:`1px solid ${C.verde}22`,borderRadius:8}}>
                <div style={{width:24,height:24,borderRadius:6,background:C.verde,color:"white",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {a.numeroAsiento}
                </div>
                <div style={{overflow:"hidden"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.oscuro,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.pasajero}</div>
                  <div style={{fontSize:9,color:C.medio,textTransform:"uppercase"}}>{a.tipo || "NORMAL"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CRUD: Viajes — con asignación de chofer y mapa asientos
// ═══════════════════════════════════════════════════════
function CrudViajes({ headers, showToast }) {
  const [items,setItems]=useState([]);const [rutas,setRutas]=useState([]);const [buses,setBuses]=useState([]);const [choferes,setChoferes]=useState([]);
  const [load,setLoad]=useState(true);const [modal,setModal]=useState(null);const [form,setForm]=useState({});
  const [conf,setConf]=useState(null);const [saving,setSaving]=useState(false);
  const [filtroEstado,setFiltroEstado]=useState("");
  const [filtroOrigen,setFiltroOrigen]=useState("");
  const [filtroDestino,setFiltroDestino]=useState("");
  const [sucursales,setSucursales]=useState([]);
  const [modalAsientos,setModalAsientos]=useState(null);
  const [asientosModal,setAsientosModal]=useState([]);const [loadAsientos,setLoadAsientos]=useState(false);
  const [cancelarViaje, setCancelarViaje] = useState(null);

  const cargar=useCallback(async()=>{
    setLoad(true);
    try{
      const[r1,r2,r3,r4,r5]=await Promise.all([
        fetch("/api/v1/viajes",{headers}),
        fetch("/api/v1/rutas",{headers}),
        fetch("/api/v1/buses",{headers}),
        fetch("/api/v1/usuarios",{headers}),
        fetch("/api/v1/sucursales",{headers}),
      ]);
      const d1=r1.ok?await r1.json():[];const d2=r2.ok?await r2.json():[];
      const d3=r3.ok?await r3.json():[];const d4=r4.ok?await r4.json():[];
      const d5=r5.ok?await r5.json():[];
      setItems(Array.isArray(d1)?d1:[]);setRutas(Array.isArray(d2)?d2:[]);setBuses(Array.isArray(d3)?d3:[]);
      setSucursales(Array.isArray(d5)?d5:[]);
      // Filtrar solo choferes
      const usrs=Array.isArray(d4)?d4:[];
      setChoferes(usrs.filter(u=>u.rol==="ROLE_CHOFER"||u.rol?.includes("CHOFER")));
    }catch{showToast("Error al cargar viajes");}
    finally{setLoad(false);}
  },[headers,showToast]);

  useEffect(()=>{cargar();},[cargar]);

  const abrirAsientos=async(viajeId)=>{
    setModalAsientos(viajeId);setLoadAsientos(true);setAsientosModal([]);
    try{const r=await fetch(`/api/v1/viajes/${viajeId}/asientos`,{headers});const d=r.ok?await r.json():[];setAsientosModal(Array.isArray(d)?d:[]);}
    catch{showToast("Error al cargar asientos");}
    finally{setLoadAsientos(false);}
  };

  const abrir=(v=null)=>{
    setForm(v?{
      id:v.id,rutaId:v.ruta?.id?.toString()||"",busId:v.bus?.id?.toString()||"",
      choferId:v.chofer?.id?.toString()||"",
      fechaHoraSalida:v.fechaHoraSalida?v.fechaHoraSalida.slice(0,16):"",
      fechaHoraLlegadaEstimada:v.fechaHoraLlegadaEstimada?v.fechaHoraLlegadaEstimada.slice(0,16):"",
      precioAdulto:v.precioAdulto?.toString()||"",precioNino:v.precioNino?.toString()||"",estado:v.estado||"PROGRAMADO",
    }:{rutaId:"",busId:"",choferId:"",fechaHoraSalida:"",fechaHoraLlegadaEstimada:"",precioAdulto:"",precioNino:"",estado:"PROGRAMADO"});
    setModal(v||"nuevo");
  };

  const guardar=async(e)=>{e.preventDefault();if(!form.rutaId||!form.busId||!form.fechaHoraSalida)return showToast("Ruta, bus y fecha son obligatorios");if(!form.precioAdulto||parseFloat(form.precioAdulto)<=0)return showToast("Precio adulto obligatorio");setSaving(true);
    try{const isEdit=!!form.id;const res=await fetch(isEdit?`/api/v1/viajes/${form.id}`:"/api/v1/viajes",{method:isEdit?"PUT":"POST",headers,body:JSON.stringify({rutaId:parseInt(form.rutaId),busId:parseInt(form.busId),choferId:form.choferId?parseInt(form.choferId):null,fechaHoraSalida:form.fechaHoraSalida,fechaHoraLlegadaEstimada:form.fechaHoraLlegadaEstimada||null,precioAdulto:parseFloat(form.precioAdulto),precioNino:form.precioNino?parseFloat(form.precioNino):null,estado:form.estado})});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.mensaje||"Error");}
    const data=await res.json();setItems(prev=>isEdit?prev.map(x=>x.id===data.id?{...x,...data}:x):[...prev,data]);showToast(isEdit?"Viaje actualizado":"Viaje creado");setModal(null);}
    catch(err){showToast(err.message);}finally{setSaving(false);}
  };

  const eliminar=async(id)=>{try{await fetch(`/api/v1/viajes/${id}`,{method:"DELETE",headers});setItems(prev=>prev.filter(x=>x.id!==id));showToast("Viaje eliminado");}catch{showToast("Error");}finally{setConf(null);};};

  const ejecutarCancelacion = async () => {
    if(!cancelarViaje) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/viajes/${cancelarViaje.id}/estado?estado=CANCELADO`, { method: "PATCH", headers });
      if(res.ok) {
        showToast("Viaje cancelado correctamente");
        setCancelarViaje(null);
        await cargar();
      } else {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.mensaje || "Error al cancelar");
      }
    } catch(e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fil = items.filter(v => {
    const matchEstado = !filtroEstado || v.estado === filtroEstado;
    const matchOrigen = !filtroOrigen || v.ruta?.origen?.id === parseInt(filtroOrigen);
    const matchDestino = !filtroDestino || v.ruta?.destino?.id === parseInt(filtroDestino);
    return matchEstado && matchOrigen && matchDestino;
  });
  const prog=items.filter(v=>v.estado==="PROGRAMADO").length;
  const enCurso=items.filter(v=>v.estado==="EN_CURSO").length;

  return (<>
    <PageHeader title="Gestión de Viajes" sub={`${items.length} viajes totales`} action={<button className="adm-btn-primary" onClick={()=>abrir()}><Plus size={15} style={{marginRight:6}}/>Nuevo viaje</button>}/>

    {/* Mini stats + filtro */}
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      {[{label:"Programados",val:prog,color:C.verde},{label:"En curso",val:enCurso,color:C.amarillo},{label:"Total",val:items.length,color:C.gris}].map(s=>(
        <div key={s.label} style={{background:C.blanco,border:`1.5px solid ${s.color}33`,borderRadius:10,padding:"8px 16px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</span>
          <span style={{fontSize:12,color:C.gris}}>{s.label}</span>
        </div>
      ))}
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
        <Filter size={14} color={C.medio}/>
        <select className="lf-select" value={filtroOrigen} onChange={e=>setFiltroOrigen(e.target.value)} style={{maxWidth:160,padding:"8px 12px"}}>
          <option value="">Cualquier origen</option>
          {sucursales.map(s=><option key={s.id} value={s.id}>{s.ciudad}</option>)}
        </select>
        <select className="lf-select" value={filtroDestino} onChange={e=>setFiltroDestino(e.target.value)} style={{maxWidth:160,padding:"8px 12px"}}>
          <option value="">Cualquier destino</option>
          {sucursales.map(s=><option key={s.id} value={s.id}>{s.ciudad}</option>)}
        </select>
        <select className="lf-select" value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)} style={{maxWidth:160,padding:"8px 12px"}}>
          <option value="">Todos los estados</option>
          <option value="PROGRAMADO">Programado</option>
          <option value="EN_CURSO">En curso</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>
    </div>

    <TableWrap load={load} empty={!fil.length&&"Sin viajes registrados"}>
      <table className="adm-table">
        <thead><tr><th>Ruta</th><th>Bus</th><th>Chofer asignado</th><th>Salida</th><th>Precio adulto</th><th>Asientos</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(v=>{
            const libres=v.asientosDisponibles??"-";const total=v.totalAsientos??"-";
            const pctOcup=total&&libres!=="-"?Math.round((1-libres/total)*100):0;
            const colorAsientos=libres>5?C.verde:libres>0?C.naranja:C.rojo;
            return(
              <tr key={v.id} className="tr-hover">
                <td><div style={{display:"flex",alignItems:"center",gap:5,fontWeight:700}}><MapPin size={12} color={C.verde}/>{v.ruta?.origen?.ciudad||"—"} <ArrowRight size={11} color={C.medio}/> {v.ruta?.destino?.ciudad||"—"}</div><span style={{fontSize:11,color:C.medio}}>{v.ruta?.codigo}</span></td>
                <td><span className="td-codigo">{v.bus?.placa||"—"}</span><div style={{fontSize:11,color:C.medio}}>{v.bus?.marca}</div></td>
                <td>
                  {v.chofer ? (
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:C.verde+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <UserCircle size={16} color={C.verde}/>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:C.oscuro}}>{v.chofer.nombreCompleto||v.chofer.nombres||v.choferNombre||"—"}</div>
                        <div style={{fontSize:10,color:C.medio}}>{v.chofer.username}</div>
                      </div>
                    </div>
                  ):<span style={{fontSize:12,color:C.grisClaro,fontStyle:"italic"}}>Sin asignar</span>}
                </td>
                <td style={{fontSize:12}}>{fmtFecha(v.fechaHoraSalida)}</td>
                <td><strong style={{color:C.verde}}>S/ {v.precioAdulto||"—"}</strong></td>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Armchair size={13} color={colorAsientos}/>
                    <span style={{fontSize:12,fontWeight:700,color:colorAsientos}}>{libres}/{total}</span>
                  </div>
                  {total&&total!=="-"&&<div style={{width:60,height:4,background:"#e8f0ee",borderRadius:99,overflow:"hidden",marginTop:3}}><div style={{width:`${pctOcup}%`,height:"100%",background:colorAsientos,transition:"width 0.4s"}}/></div>}
                </td>
                <td><Badge text={v.estado}/></td>
                <td>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{display:"flex",gap:4}}>
                      <button className="btn-edit" onClick={()=>abrir(v)} title="Editar"><Pencil size={12}/></button>
                      {v.estado === "PROGRAMADO" && (
                        <button className="btn-delete" onClick={() => setCancelarViaje(v)} title="Cancelar Viaje" style={{background:C.rojo+"22",color:C.rojo}}><X size={12}/></button>
                      )}
                      <button className="btn-delete" onClick={()=>setConf(v.id)} title="Eliminar"><Trash2 size={12}/></button>
                    </div>
                    <button onClick={()=>abrirAsientos(v.id)} style={{background:`${C.amarillo}22`,border:`1px solid ${C.amarillo}66`,color:"#9a7a00",borderRadius:7,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                      <Armchair size={11}/> Asientos
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>

    {/* Modal Mapa de Asientos */}
    {modalAsientos&&(
      <div className="modal-overlay" onClick={()=>setModalAsientos(null)}>
        <div className="modal" style={{maxWidth:620,width:"95%"}} onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-badge"><Armchair size={20}/></div>
            <div><div className="modal-title">Mapa de Asientos</div><div className="modal-subtitle">Vista gráfica del viaje seleccionado</div></div>
            <button className="modal-close" onClick={()=>setModalAsientos(null)}><X size={20}/></button>
          </div>
          <div className="modal-body"><MapaAsientosGrafico asientos={asientosModal} loading={loadAsientos}/></div>
        </div>
      </div>
    )}

    {/* Modal Crear/Editar Viaje */}
    {modal&&(<ModalForm titulo={modal==="nuevo"?"Nuevo viaje":"Editar viaje"} icon={<CalendarDays size={20}/>} onClose={()=>setModal(null)} onSubmit={guardar} saving={saving}>
      <div className="form-grid">
        <Field label="Ruta *">
          <select className="lf-select" value={form.rutaId||""} onChange={e=>setForm(f=>({...f,rutaId:e.target.value}))} required>
            <option value="">Seleccionar...</option>
            {rutas.map(r=><option key={r.id} value={r.id}>{r.codigo||`Ruta ${r.id}`} — {r.origen?.ciudad} → {r.destino?.ciudad}</option>)}
          </select>
        </Field>
        <Field label="Bus *">
          <select className="lf-select" value={form.busId||""} onChange={e=>setForm(f=>({...f,busId:e.target.value}))} required>
            <option value="">Seleccionar...</option>
            {buses.map(b=><option key={b.id} value={b.id}>{b.placa} — {b.marca} ({b.capacidadAsientos} asientos)</option>)}
          </select>
        </Field>
        <Field label="Chofer asignado" style={{gridColumn:"1/-1"}}>
          <select className="lf-select" value={form.choferId||""} onChange={e=>setForm(f=>({...f,choferId:e.target.value}))}>
            <option value="">Sin chofer asignado</option>
            {choferes.map(c=><option key={c.id} value={c.id}>{c.nombres} {c.apellidos} ({c.username})</option>)}
          </select>
          {choferes.length===0&&<div style={{fontSize:11,color:C.naranja,marginTop:4,display:"flex",alignItems:"center",gap:4}}><AlertTriangle size={11}/>No hay choferes registrados. Crea uno en Personal.</div>}
        </Field>
        <Field label="Fecha y hora salida *" style={{gridColumn:"1/-1"}}>
          <input type="datetime-local" value={form.fechaHoraSalida||""} onChange={e=>setForm(f=>({...f,fechaHoraSalida:e.target.value}))} required/>
        </Field>
        <Field label="Fecha y hora llegada estimada" style={{gridColumn:"1/-1"}}>
          <input type="datetime-local" value={form.fechaHoraLlegadaEstimada||""} onChange={e=>setForm(f=>({...f,fechaHoraLlegadaEstimada:e.target.value}))}/>
        </Field>
        <Field label="Precio adulto (S/) *">
          <input type="number" step="0.01" value={form.precioAdulto||""} onChange={e=>setForm(f=>({...f,precioAdulto:e.target.value}))} required placeholder="0.00"/>
        </Field>
        <Field label="Precio niño (S/)">
          <input type="number" step="0.01" value={form.precioNino||""} onChange={e=>setForm(f=>({...f,precioNino:e.target.value}))} placeholder="0.00"/>
        </Field>
        <Field label="Estado" style={{gridColumn:"1/-1"}}>
          {(()=>{
            const trans={PROGRAMADO:["PROGRAMADO","EN_CURSO","CANCELADO"],EN_CURSO:["EN_CURSO","FINALIZADO","CANCELADO"],FINALIZADO:["FINALIZADO"],CANCELADO:["CANCELADO"]};
            const orig=(typeof modal==="object"&&modal?.estado)?modal.estado:"PROGRAMADO";
            const opts=trans[orig]||["PROGRAMADO","EN_CURSO","FINALIZADO","CANCELADO"];
            return(<select className="lf-select" value={form.estado||"PROGRAMADO"} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
              {opts.map(op=><option key={op} value={op}>{op.replace("_"," ")}</option>)}
            </select>);
          })()}
        </Field>
      </div>
    </ModalForm>)}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>setConf(null)}/>}

    {cancelarViaje && (
      <div className="modal-overlay" onClick={() => setCancelarViaje(null)}>
        <div className="modal confirm-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-badge" style={{ background: C.rojo+"22", color: C.rojo }}><AlertTriangle size={22}/></div>
            <div>
              <div className="modal-title">Cancelar Viaje Completo</div>
              <div className="modal-subtitle">Esta acción es irreversible</div>
            </div>
            <button className="modal-close" onClick={() => setCancelarViaje(null)}><X size={20}/></button>
          </div>
          <div className="modal-body">
            <div style={{ background: "#fff5f5", border: `1px solid ${C.rojo}22`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.rojo, fontWeight: 700, marginBottom: 4 }}>ATENCIÓN:</div>
              <div style={{ fontSize: 12, color: C.gris, lineHeight: 1.5 }}>
                Está por cancelar el viaje <strong>{cancelarViaje.ruta?.origen?.ciudad} → {cancelarViaje.ruta?.destino?.ciudad}</strong> programado para el <strong>{fmtFecha(cancelarViaje.fechaHoraSalida)}</strong>.
                <br/><br/>
                • Todos los asientos reservados se liberarán.<br/>
                • El estado del viaje cambiará a <strong>CANCELADO</strong>.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-cancelar" onClick={() => setCancelarViaje(null)} style={{ flex: 1 }}>Volver</button>
              <button className="btn-delete-confirm" onClick={ejecutarCancelacion} disabled={saving} style={{ flex: 1.5, justifyContent: "center" }}>
                {saving ? <span className="spinner" /> : "Confirmar Cancelación"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>);
}


// ═══════════════════════════════════════════════════════
// CRUD: Clientes
// ═══════════════════════════════════════════════════════
function CrudClientes({ headers, showToast }) {
  const [items,setItems]=useState([]);const [load,setLoad]=useState(true);const [buscar,setBuscar]=useState("");
  const [modal,setModal]=useState(null);const [form,setForm]=useState({});const [conf,setConf]=useState(null);const [saving,setSaving]=useState(false);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [historial, setHistorial] = useState({ boletos: [], encomiendas: [], load: false });

  const cargar=useCallback(async()=>{setLoad(true);try{const r=await fetch("/api/v1/clientes",{headers});const d=r.ok?await r.json():{};const arr=Array.isArray(d.content)?d.content:Array.isArray(d)?d:[];setItems(arr);}catch{showToast("Error al cargar clientes");setItems([]);}finally{setLoad(false);};},[headers,showToast]);
  useEffect(()=>{cargar();},[cargar]);

  const abrir=(c=null)=>{setForm(c?{id:c.id,nombres:c.nombres||"",apellidos:c.apellidos||"",dniRuc:c.dniRuc||"",email:c.email||"",telefono:c.telefono||"",tipoCliente:c.tipoCliente||"PERSONA"}:{nombres:"",apellidos:"",dniRuc:"",email:"",telefono:"",tipoCliente:"PERSONA"});setModal(c||"nuevo");};
  const guardar=async(e)=>{e.preventDefault();if(!form.nombres||!form.apellidos||!form.dniRuc)return showToast("Nombres, apellidos y DNI son obligatorios");setSaving(true);try{const isEdit=!!form.id;const res=await fetch(isEdit?`/api/v1/clientes/${form.id}`:"/api/v1/clientes",{method:isEdit?"PUT":"POST",headers,body:JSON.stringify({nombres:form.nombres.trim(),apellidos:form.apellidos.trim(),dniRuc:form.dniRuc.trim(),email:form.email?.trim()||null,telefono:form.telefono?.trim()||null,tipoCliente:form.tipoCliente||"PERSONA"})});if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.mensaje||"Error");}const data=await res.json();setItems(prev=>isEdit?prev.map(x=>x.id===data.id?data:x):[...prev,data]);showToast(isEdit?"Cliente actualizado":"Cliente creado");setModal(null);}catch(err){showToast(err.message);}finally{setSaving(false);};};
  const eliminar=async(id)=>{try{await fetch(`/api/v1/clientes/${id}`,{method:"DELETE",headers});setItems(prev=>prev.filter(x=>x.id!==id));showToast("Cliente eliminado");}catch{showToast("Error");}finally{setConf(null);};};

  const verHistorial = async (cliente) => {
    setModalHistorial(cliente);
    setHistorial({ boletos: [], encomiendas: [], load: true });
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/v1/boletos/cliente/${cliente.id}`, { headers }),
        fetch(`/api/v1/encomiendas/remitente/${cliente.id}`, { headers })
      ]);
      const d1 = r1.ok ? await r1.json() : { content: [] };
      const d2 = r2.ok ? await r2.json() : { content: [] };
      setHistorial({
        boletos: Array.isArray(d1.content) ? d1.content : Array.isArray(d1) ? d1 : [],
        encomiendas: Array.isArray(d2.content) ? d2.content : Array.isArray(d2) ? d2 : [],
        load: false
      });
    } catch (e) {
      showToast("Error al cargar historial");
      setHistorial(prev => ({ ...prev, load: false }));
    }
  };

  const fil=items.filter(c=>`${c.nombres} ${c.apellidos} ${c.dniRuc}`.toLowerCase().includes(buscar.toLowerCase()));

  return (<>
    <PageHeader title="Gestión de Clientes" sub={`${items.length} clientes`} action={<button className="adm-btn-primary" onClick={()=>abrir()}><Plus size={15} style={{marginRight:6}}/>Nuevo cliente</button>}/>
    <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por nombre o DNI..."/>
    <TableWrap load={load} empty={!fil.length&&"Sin clientes registrados"}>
      <table className="adm-table">
        <thead><tr><th>Nombre completo</th><th>DNI/RUC</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(c=>(
            <tr key={c.id} className="tr-hover">
              <td><strong>{[c.nombres,c.apellidos].filter(Boolean).join(" ")}</strong></td>
              <td><span className="td-codigo">{c.dniRuc}</span></td>
              <td style={{fontSize:12}}>{c.email||"—"}</td>
              <td>{c.telefono||"—"}</td>
              <td><Badge text={c.tipoCliente||"PERSONA"}/></td>
              <td>
                <Actions onEdit={()=>abrir(c)} onDel={()=>setConf(c.id)} extra={
                  <button className="btn-edit" onClick={()=>verHistorial(c)} title="Ver Historial" style={{background:C.amarillo+"22",color:"#9a7a00",marginLeft:4}}>
                    <Clock size={13}/>
                  </button>
                }/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
    {modal&&(<ModalForm titulo={modal==="nuevo"?"Nuevo cliente":"Editar cliente"} icon={<Users size={20}/>} onClose={()=>setModal(null)} onSubmit={guardar} saving={saving}>
      <div className="form-grid">
        <Field label="Nombres *"><input value={form.nombres||""} onChange={e=>setForm(f=>({...f,nombres:e.target.value}))} required/></Field>
        <Field label="Apellidos *"><input value={form.apellidos||""} onChange={e=>setForm(f=>({...f,apellidos:e.target.value}))} required/></Field>
        <Field label="DNI / RUC *"><input value={form.dniRuc||""} onChange={e=>setForm(f=>({...f,dniRuc:e.target.value}))} required/></Field>
        <Field label="Tipo">
          <select className="lf-select" value={form.tipoCliente||"PERSONA"} onChange={e=>setForm(f=>({...f,tipoCliente:e.target.value}))}>
            <option value="PERSONA">PERSONA</option><option value="EMPRESA">EMPRESA</option>
          </select>
        </Field>
        <Field label="Email"><input type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
        <Field label="Teléfono"><input value={form.telefono||""} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></Field>
      </div>
    </ModalForm>)}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>setConf(null)}/>}

    {modalHistorial && (
      <div className="modal-overlay" onClick={() => setModalHistorial(null)}>
        <div className="modal" style={{ maxWidth: 800, width: "95%" }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-badge"><Clock size={20} /></div>
            <div>
              <div className="modal-title">Historial del Cliente</div>
              <div className="modal-subtitle">{modalHistorial.nombres} {modalHistorial.apellidos} — {modalHistorial.dniRuc}</div>
            </div>
            <button className="modal-close" onClick={() => setModalHistorial(null)}><X size={20} /></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {historial.load ? (
              <div style={{ textAlign: "center", padding: "2rem" }}><span className="spinner" style={{ borderColor: C.verde, borderTopColor: "transparent" }} /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <section>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, borderBottom: `1.5px solid ${C.verde}22`, paddingBottom: 8 }}>
                    <Ticket size={18} color={C.verde} />
                    <h4 style={{ margin: 0, color: C.oscuro }}>Historial de Viajes (Boletos)</h4>
                  </div>
                  {historial.boletos.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: C.medio, background: "#f8faf9", borderRadius: 10 }}>No registra viajes comprados.</div>
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr><th>Fecha</th><th>Ruta</th><th>Bus</th><th>Asiento</th><th>Precio</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                          {historial.boletos.map(b => (
                            <tr key={b.id}>
                              <td>{fmtFecha(b.createdAt)}</td>
                              <td><strong>{b.viaje?.ruta?.origen?.ciudad}</strong> → <strong>{b.viaje?.ruta?.destino?.ciudad}</strong></td>
                              <td><span className="td-codigo">{b.viaje?.bus?.placa}</span></td>
                              <td>#{b.numeroAsiento}</td>
                              <td><strong style={{ color: C.verde }}>S/ {b.precioFinal?.toFixed(2)}</strong></td>
                              <td><Badge text={b.estado} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                <section>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, borderBottom: `1.5px solid ${C.naranja}22`, paddingBottom: 8 }}>
                    <Package size={18} color={C.naranja} />
                    <h4 style={{ margin: 0, color: C.oscuro }}>Historial de Encomiendas Enviadas</h4>
                  </div>
                  {historial.encomiendas.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: C.medio, background: "#fff9f4", borderRadius: 10 }}>No registra envíos de encomiendas.</div>
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr><th>Guía</th><th>Fecha</th><th>Destinatario</th><th>Origen/Destino</th><th>Peso</th><th>Costo</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                          {historial.encomiendas.map(e => (
                            <tr key={e.id}>
                              <td><span className="td-codigo">{e.numeroGuia}</span></td>
                              <td>{fmtFecha(e.createdAt)}</td>
                              <td>{e.destinatario?.nombres} {e.destinatario?.apellidos}</td>
                              <td style={{ fontSize: 11 }}>{e.sucursalOrigen?.ciudad} → {e.sucursalDestino?.ciudad}</td>
                              <td>{e.pesoKg} kg</td>
                              <td><strong style={{ color: C.verde }}>S/ {e.costo?.toFixed(2)}</strong></td>
                              <td><Badge text={e.estado} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>);
}

// ═══════════════════════════════════════════════════════
// CRUD: Encomiendas
// ═══════════════════════════════════════════════════════
function CrudEncomiendas({ headers, showToast }) {
  const [items,setItems]=useState([]);const [load,setLoad]=useState(true);const [buscar,setBuscar]=useState("");
  const [modal,setModal]=useState(null);const [conf,setConf]=useState(null);const [nuevoEst,setNuevoEst]=useState("");const [saving,setSaving]=useState(false);

  const cargar=useCallback(async()=>{setLoad(true);try{const r=await fetch("/api/v1/encomiendas",{headers});const d=r.ok?await r.json():[];const arr=Array.isArray(d)?d:Array.isArray(d?.content)?d.content:[];setItems(arr);}catch{showToast("Error al cargar encomiendas");}finally{setLoad(false);};},[headers,showToast]);
  useEffect(()=>{cargar();},[cargar]);

  const cambiarEstado=async(e)=>{e.preventDefault();if(!nuevoEst)return;setSaving(true);try{const res=await fetch(`/api/v1/encomiendas/${modal.id}/estado`,{method:"PATCH",headers,body:JSON.stringify({nuevoEstado:nuevoEst,observacion:`Cambio desde admin`})});if(!res.ok)throw new Error("Error al actualizar");await cargar();showToast("Estado actualizado");setModal(null);}catch(err){showToast(err.message);}finally{setSaving(false);}};

  const fil=items.filter(e=>`${e.numeroGuia||""} ${e.remitente?.nombres||""} ${e.destinatario?.nombres||""}`.toLowerCase().includes(buscar.toLowerCase()));

  const ESTADOS=["RECIBIDO","EN_ALMACEN","EN_TRANSITO","EN_DESTINO","LISTO_ENTREGA","ENTREGADO","DEVUELTO","PERDIDO"];

  return (<>
    <PageHeader title="Gestión de Encomiendas" sub={`${items.length} encomiendas`}/>
    <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por guía, remitente o destinatario..."/>
    <TableWrap load={load} empty={!fil.length&&"Sin encomiendas registradas"}>
      <table className="adm-table">
        <thead><tr><th>N° Guía</th><th>Remitente</th><th>Destinatario</th><th>Peso</th><th>Costo</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(enc=>(
            <tr key={enc.id} className="tr-hover">
              <td><span className="td-codigo">{enc.numeroGuia||`#${enc.id}`}</span></td>
              <td style={{fontSize:12}}>{enc.remitente?`${enc.remitente.nombres||""} ${enc.remitente.apellidos||""}`.trim():"—"}</td>
              <td style={{fontSize:12}}>{enc.destinatario?`${enc.destinatario.nombres||""} ${enc.destinatario.apellidos||""}`.trim():"—"}</td>
              <td>{enc.pesoKg?`${enc.pesoKg} kg`:"—"}</td>
              <td><strong style={{color:C.verde}}>{enc.costo?`S/ ${enc.costo}`:"—"}</strong></td>
              <td><Badge text={enc.estado}/></td>
              <td><button className="btn-edit" onClick={()=>{setModal(enc);setNuevoEst(enc.estado);}} title="Cambiar estado"><Pencil size={12}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
    {modal&&(
      <div className="modal-overlay"><div className="modal confirm-modal" style={{padding:"24px",maxWidth:400}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16,color:C.oscuro}}>Cambiar estado</h3>
          <button className="modal-close" onClick={()=>setModal(null)}><X size={18}/></button>
        </div>
        <p style={{fontSize:12,color:C.medio,marginBottom:12}}>Guía: <strong>{modal.numeroGuia||`#${modal.id}`}</strong></p>
        <form onSubmit={cambiarEstado}>
          <Field label="Nuevo estado">
            <select className="lf-select" value={nuevoEst} onChange={e=>setNuevoEst(e.target.value)}>
              {ESTADOS.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
            </select>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button type="button" className="btn-cancelar" onClick={()=>setModal(null)} style={{flex:1}}>Cancelar</button>
            <button type="submit" className="btn-reservar" style={{flex:2}} disabled={saving}>
              {saving?<span className="spinner"/>:<span>Actualizar estado</span>}
            </button>
          </div>
        </form>
      </div></div>
    )}
  </>);
}


// ═══════════════════════════════════════════════════════
// CRUD: Personal (Usuarios del sistema)
// ═══════════════════════════════════════════════════════
function CrudPersonal({ headers, showToast }) {
  const [items,setItems]=useState([]);const [roles,setRoles]=useState([]);const [sucursales,setSucursales]=useState([]);
  const [load,setLoad]=useState(true);const [buscar,setBuscar]=useState("");const [filtroRol,setFiltroRol]=useState("");
  const [modal,setModal]=useState(null);const [form,setForm]=useState({});const [conf,setConf]=useState(null);const [saving,setSaving]=useState(false);

  const cargar=useCallback(async()=>{setLoad(true);try{const[r1,r2,r3]=await Promise.all([fetch("/api/v1/usuarios",{headers}),fetch("/api/v1/roles",{headers}),fetch("/api/v1/sucursales",{headers})]);setItems(r1.ok?await r1.json():[]);setRoles(r2.ok?await r2.json():[]);setSucursales(r3.ok?await r3.json():[]);}catch{showToast("Error al cargar personal");}finally{setLoad(false);};},[headers,showToast]);
  useEffect(()=>{cargar();},[cargar]);

  const abrir=(u=null)=>{setForm(u?{id:u.id,username:u.username||"",nombres:u.nombres||"",apellidos:u.apellidos||"",email:u.email||"",telefono:u.telefono||"",dniRuc:u.dniRuc||"",rolId:u.rolId?.toString()||"",sucursalId:u.sucursalId?.toString()||"",password:""}:{username:"",nombres:"",apellidos:"",email:"",telefono:"",dniRuc:"",rolId:"",sucursalId:"",password:""});setModal(u||"nuevo");};

  const guardar=async(e)=>{e.preventDefault();if(!form.username||!form.nombres||!form.apellidos)return showToast("Usuario, nombres y apellidos son obligatorios");if(!form.id&&!form.password)return showToast("La contraseña es obligatoria para nuevos usuarios");setSaving(true);
    try{const isEdit=!!form.id;const payload={username:form.username,nombres:form.nombres,apellidos:form.apellidos,email:form.email||null,telefono:form.telefono||null,dniRuc:form.dniRuc||null,rolId:form.rolId?parseInt(form.rolId):undefined,sucursalId:form.sucursalId?parseInt(form.sucursalId):null};
    if(!isEdit&&form.password)payload.password=form.password;
    const res=await fetch(isEdit?`/api/v1/usuarios/${form.id}`:"/api/v1/usuarios",{method:isEdit?"PUT":"POST",headers,body:JSON.stringify(payload)});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.mensaje||err.message||"Error");}
    const data=await res.json();setItems(prev=>isEdit?prev.map(x=>x.id===data.id?data:x):[...prev,data]);showToast(isEdit?"Personal actualizado":"Personal creado");setModal(null);}
    catch(err){showToast(err.message);}finally{setSaving(false);}
  };

  const eliminar=async(id)=>{try{await fetch(`/api/v1/usuarios/${id}`,{method:"DELETE",headers});setItems(prev=>prev.filter(x=>x.id!==id));showToast("Usuario eliminado");}catch{showToast("Error");}finally{setConf(null);};};

  // Filtros combinados
  const fil=items.filter(u=>{
    const matchText=`${u.username} ${u.nombres} ${u.apellidos} ${u.email||""}`.toLowerCase().includes(buscar.toLowerCase());
    const matchRol=!filtroRol||u.rol===filtroRol||(u.rolNombre&&u.rolNombre===filtroRol);
    return matchText&&matchRol;
  });

  // Agrupar por rol para mostrar stats
  const rolStats={ROLE_ADMIN:0,ROLE_CAJERO:0,ROLE_CHOFER:0,ROLE_CLIENTE:0};
  items.forEach(u=>{if(rolStats[u.rol]!==undefined)rolStats[u.rol]++;});

  const ROLES_LABEL={ROLE_ADMIN:"Admin",ROLE_CAJERO:"Cajero",ROLE_CHOFER:"Chofer",ROLE_CLIENTE:"Cliente"};

  return (<>
    <PageHeader title="Gestión de Personal" sub={`${items.length} usuarios registrados`} action={<button className="adm-btn-primary" onClick={()=>abrir()}><Plus size={15} style={{marginRight:6}}/>Nuevo usuario</button>}/>

    {/* Stats por rol */}
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      {Object.entries(rolStats).map(([rol,cnt])=>(
        <button key={rol} onClick={()=>setFiltroRol(filtroRol===rol?"":rol)}
          style={{background:filtroRol===rol?C.verde+"22":C.blanco,border:`1.5px solid ${filtroRol===rol?C.verde:"#e2edeb"}`,borderRadius:10,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"inherit",transition:"all 0.18s"}}>
          <span style={{fontSize:18,fontWeight:900,color:C.verde}}>{cnt}</span>
          <span style={{fontSize:12,color:C.gris}}>{ROLES_LABEL[rol]||rol}</span>
        </button>
      ))}
      <button onClick={()=>setFiltroRol("")} style={{marginLeft:"auto",background:"transparent",border:"none",color:C.medio,cursor:"pointer",fontSize:12,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
        <X size={13}/>Limpiar filtros
      </button>
    </div>

    {/* Búsqueda + filtro rol */}
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:200,position:"relative"}}>
        <Search size={14} color={C.medio} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        <input className="adm-search" value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Buscar por nombre, usuario o email..." style={{paddingLeft:32,width:"100%",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <Filter size={14} color={C.medio}/>
        <select className="lf-select" value={filtroRol} onChange={e=>setFiltroRol(e.target.value)} style={{maxWidth:180,padding:"8px 12px"}}>
          <option value="">Todos los roles</option>
          {Object.entries(ROLES_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    </div>

    <TableWrap load={load} empty={!fil.length&&"Sin usuarios registrados"}>
      <table className="adm-table">
        <thead><tr><th>Usuario</th><th>Nombre completo</th><th>Rol</th><th>Sucursal</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr></thead>
        <tbody>
          {fil.map(u=>(
            <tr key={u.id} className="tr-hover">
              <td>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.verde},${C.oscuro})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{color:"white",fontSize:11,fontWeight:800}}>{(u.username||"U").slice(0,2).toUpperCase()}</span>
                  </div>
                  <span className="td-codigo">{u.username}</span>
                </div>
              </td>
              <td><strong>{[u.nombres,u.apellidos].filter(Boolean).join(" ")||"—"}</strong></td>
              <td><Badge text={u.rol||u.rolNombre}/></td>
              <td style={{fontSize:12}}>{u.sucursalNombre||"—"}</td>
              <td style={{fontSize:12}}>{u.telefono||"—"}</td>
              <td style={{fontSize:12}}>{u.email||"—"}</td>
              <td><Actions onEdit={()=>abrir(u)} onDel={()=>setConf(u.id)}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>

    {modal&&(<ModalForm titulo={modal==="nuevo"?"Nuevo usuario":"Editar usuario"} icon={<UserCircle size={20}/>} onClose={()=>setModal(null)} onSubmit={guardar} saving={saving}>
      <div className="form-grid">
        <Field label="Username *"><input value={form.username||""} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required disabled={!!form.id} placeholder="nombre_usuario"/></Field>
        {!form.id&&<Field label="Contraseña *"><input type="password" value={form.password||""} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required placeholder="Mín. 6 caracteres" minLength={6}/></Field>}
        <Field label="Nombres *"><input value={form.nombres||""} onChange={e=>setForm(f=>({...f,nombres:e.target.value}))} required/></Field>
        <Field label="Apellidos *"><input value={form.apellidos||""} onChange={e=>setForm(f=>({...f,apellidos:e.target.value}))} required/></Field>
        <Field label="Rol *">
          <select className="lf-select" value={form.rolId||""} onChange={e=>setForm(f=>({...f,rolId:e.target.value}))} required>
            <option value="">Seleccionar rol...</option>
            {roles.map(r=><option key={r.id} value={r.id}>{r.nombre?.replace("ROLE_","")} — {r.descripcion||""}</option>)}
          </select>
        </Field>
        <Field label="Sucursal">
          <select className="lf-select" value={form.sucursalId||""} onChange={e=>setForm(f=>({...f,sucursalId:e.target.value}))}>
            <option value="">Sin sucursal</option>
            {sucursales.map(s=><option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}
          </select>
        </Field>
        <Field label="DNI / RUC"><input value={form.dniRuc||""} onChange={e=>setForm(f=>({...f,dniRuc:e.target.value}))}/></Field>
        <Field label="Teléfono"><input value={form.telefono||""} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></Field>
        <Field label="Email" style={{gridColumn:"1/-1"}}><input type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
      </div>
    </ModalForm>)}
    {conf&&<ConfirmModal onConfirmar={()=>eliminar(conf)} onCancelar={()=>setConf(null)}/>}
  </>);
}

// ═══════════════════════════════════════════════════════
// CRUD: Pagos
// ═══════════════════════════════════════════════════════
function CrudPagos({ headers, showToast }) {
  const [items, setItems] = useState([]);
  const [load, setLoad] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [conf, setConf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [boleta, setBoleta] = useState(null); // Para el modal de impresión

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const r = await fetch("/api/v1/pagos", { headers });
      const d = r.ok ? await r.json() : [];
      setItems(Array.isArray(d) ? d : []);
    } catch {
      showToast("Error al cargar pagos");
    } finally {
      setLoad(false);
    }
  }, [headers, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (p = null) => {
    setForm(p ? {
      id: p.id,
      monto: p.monto?.toString() || "",
      metodo: p.metodo || "EFECTIVO",
      referencia: p.referencia || "",
      observacion: p.observacion || "",
      estado: p.estado || "COMPLETADO"
    } : { monto: "", metodo: "EFECTIVO", referencia: "", observacion: "", estado: "COMPLETADO" });
    setModal(p || "nuevo");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.monto || parseFloat(form.monto) <= 0) return showToast("Monto obligatorio y mayor a 0");
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/v1/pagos/${form.id}` : "/api/v1/pagos", {
        method: isEdit ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          monto: parseFloat(form.monto),
          metodo: form.metodo,
          referencia: form.referencia,
          observacion: form.observacion,
          estado: form.estado
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.mensaje || "Error al guardar pago");
      }
      const data = await res.json();
      setItems(prev => isEdit ? prev.map(x => x.id === data.id ? data : x) : [data, ...prev]);
      showToast(isEdit ? "Pago actualizado" : "Pago registrado");
      setModal(null);
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    try {
      const res = await fetch(`/api/v1/pagos/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setItems(prev => prev.filter(x => x.id !== id));
      showToast("Pago eliminado");
    } catch (err) {
      showToast(err.message);
    } finally {
      setConf(null);
    }
  };

  const imprimir = () => {
    window.print();
  };

  const fil = items.filter(p =>
    `${p.referencia || ""} ${p.metodo || ""} ${p.cliente || ""} ${p.referenciaEntidad || ""}`.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Gestión de Pagos"
        sub={`${items.length} pagos registrados`}
        action={<button className="adm-btn-primary" onClick={() => abrir()}><Plus size={15} style={{ marginRight: 6 }} />Registrar Pago</button>}
      />
      <SearchBar value={buscar} onChange={setBuscar} placeholder="Buscar por cliente, referencia o entidad..." />
      <TableWrap load={load} empty={!fil.length && "Sin pagos registrados"}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente / Concepto</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Referencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fil.map(p => (
              <tr key={p.id} className="tr-hover">
                <td><span className="td-codigo">#{p.id}</span></td>
                <td>{fmtFecha(p.fechaPago)}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{p.cliente || "Cliente Varios"}</strong>
                    <span style={{ fontSize: 10, color: C.medio }}>{p.referenciaEntidad || "Pago Manual"}</span>
                  </div>
                </td>
                <td><Badge text={p.metodo} /></td>
                <td><strong style={{ color: C.verde }}>S/ {p.monto?.toFixed(2)}</strong></td>
                <td><span style={{ fontSize: 12, color: C.gris }}>{p.referencia || "—"}</span></td>
                <td><Badge text={p.estado} /></td>
                <td>
                  <div className="td-actions">
                    <button className="btn-edit" onClick={() => abrir(p)} title="Editar"><Pencil size={13}/></button>
                    <button className="btn-edit" onClick={() => setBoleta(p)} title="Ver Boleta" style={{ background: C.amarillo + "22", color: "#9a7a00" }}><Ticket size={13}/></button>
                    <button className="btn-delete" onClick={() => setConf(p.id)} title="Eliminar"><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {modal && (
        <ModalForm
          titulo={modal === "nuevo" ? "Registrar Pago" : "Editar Pago"}
          icon={<CreditCard size={20} />}
          onClose={() => setModal(null)}
          onSubmit={guardar}
          saving={saving}
        >
          <div className="form-grid">
            <Field label="Monto (S/) *">
              <input type="number" step="0.01" value={form.monto || ""} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required placeholder="0.00" />
            </Field>
            <Field label="Método *">
              <select className="lf-select" value={form.metodo || "EFECTIVO"} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))} required>
                <option value="EFECTIVO">Efectivo</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </Field>
            <Field label="Referencia" style={{ gridColumn: "1/-1" }}>
              <input value={form.referencia || ""} onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))} placeholder="Número de operación, etc." />
            </Field>
            <Field label="Observación" style={{ gridColumn: "1/-1" }}>
              <input value={form.observacion || ""} onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))} placeholder="Notas adicionales..." />
            </Field>
            <Field label="Estado" style={{ gridColumn: "1/-1" }}>
              <select className="lf-select" value={form.estado || "COMPLETADO"} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} required>
                <option value="COMPLETADO">Completado</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="RECHAZADO">Rechazado</option>
                <option value="REEMBOLSADO">Reembolsado</option>
              </select>
            </Field>
          </div>
        </ModalForm>
      )}

      {boleta && (
        <div className="modal-overlay no-print-bg" onClick={() => setBoleta(null)}>
          <div className="modal boleta-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 0 }}>
            <div className="no-print" style={{ padding: "10px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: C.oscuro }}>Vista Previa de Boleta</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={imprimir} className="adm-btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}><Zap size={14} style={{ marginRight: 5 }} />Imprimir / PDF</button>
                <button onClick={() => setBoleta(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.medio }}><X size={20} /></button>
              </div>
            </div>
            
            {/* BOLETA IMPRIMIBLE */}
            <div className="printable-receipt" style={{ padding: "40px", background: "#fff", color: "#000", fontFamily: "'Courier New', Courier, monospace" }}>
              <div style={{ textAlign: "center", marginBottom: 25 }}>
                <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>INTIWATANA S.R.L.</div>
                <div style={{ fontSize: 12 }}>R.U.C. 20450678901</div>
                <div style={{ fontSize: 11 }}>Av. El Sol 123, Cusco - Perú</div>
                <div style={{ fontSize: 11 }}>Telf: (084) 234567</div>
              </div>

              <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "10px 0", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontWeight: "bold" }}>BOLETA DE VENTA ELECTRÓNICA</div>
                <div style={{ fontSize: 14 }}>B001 - {boleta.id.toString().padStart(8, "0")}</div>
              </div>

              <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>FECHA EMISIÓN:</span> <span>{new Date(boleta.fechaPago).toLocaleDateString()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>HORA EMISIÓN:</span> <span>{new Date(boleta.fechaPago).toLocaleTimeString()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>CLIENTE:</span> <span>{boleta.cliente || "Venta Directa"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>MÉTODO PAGO:</span> <span>{boleta.metodo}</span></div>
                {boleta.referencia && <div style={{ display: "flex", justifyContent: "space-between" }}><span>REF/OPER:</span> <span>{boleta.referencia}</span></div>}
              </div>

              <div style={{ borderBottom: "1px solid #000", paddingBottom: 5, marginBottom: 10, fontWeight: "bold", fontSize: 13, display: "flex" }}>
                <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
                <span style={{ width: 80, textAlign: "right" }}>TOTAL</span>
              </div>

              <div style={{ fontSize: 13, display: "flex", marginBottom: 20 }}>
                <span style={{ flex: 1 }}>{boleta.referenciaEntidad || "Servicio de Transporte / Encomienda"}</span>
                <span style={{ width: 80, textAlign: "right" }}>{boleta.monto?.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: "2px solid #000", paddingTop: 10, textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: "bold" }}>TOTAL: S/ {boleta.monto?.toFixed(2)}</div>
              </div>

              <div style={{ marginTop: 40, textAlign: "center", fontSize: 11 }}>
                <div>Gracias por su preferencia</div>
                <div style={{ marginTop: 10, fontStyle: "italic" }}>Representación impresa de la Boleta de Venta Electrónica. Consulte su comprobante en: www.intiwatana.com.pe</div>
              </div>
            </div>
          </div>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .printable-receipt, .printable-receipt * { visibility: visible; }
              .printable-receipt { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; border: none; }
              .no-print { display: none !important; }
              .no-print-bg { background: none !important; backdrop-filter: none !important; }
            }
          `}</style>
        </div>
      )}

      {conf && <ConfirmModal onConfirmar={() => eliminar(conf)} onCancelar={() => setConf(null)} />}
    </>
  );
}


// ═══════════════════════════════════════════════════════
// MENU por rol
// ═══════════════════════════════════════════════════════
const MENU_ADMIN = [
  { key:"dashboard",   icon:<LayoutDashboard size={19}/>, label:"Panel" },
  { key:"sucursales",  icon:<Building2 size={19}/>,       label:"Sucursales" },
  { key:"rutas",       icon:<Route size={19}/>,           label:"Rutas" },
  { key:"buses",       icon:<Bus size={19}/>,             label:"Autobuses" },
  { key:"viajes",      icon:<CalendarDays size={19}/>,    label:"Viajes" },
  { key:"clientes",    icon:<Users size={19}/>,           label:"Clientes" },
  { key:"pagos",       icon:<CreditCard size={19}/>,      label:"Pagos" },
  { key:"encomiendas", icon:<Package size={19}/>,         label:"Encomiendas" },
  { key:"personal",    icon:<Shield size={19}/>,          label:"Personal" },
];

const MENU_CAJERO = [
  { key:"dashboard",   icon:<LayoutDashboard size={19}/>, label:"Panel" },
  { key:"viajes",      icon:<CalendarDays size={19}/>,    label:"Viajes" },
  { key:"clientes",    icon:<Users size={19}/>,           label:"Clientes" },
  { key:"pagos",       icon:<CreditCard size={19}/>,      label:"Pagos" },
  { key:"encomiendas", icon:<Package size={19}/>,         label:"Encomiendas" },
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

  const headers = useMemo(() => ({ "Content-Type":"application/json", Authorization:`Bearer ${session.token}` }), [session.token]);

  const isAdmin = session.rol === "ROLE_ADMIN";
  const MENU = isAdmin ? MENU_ADMIN : MENU_CAJERO;

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const iniciales = (session.nombreCompleto||session.username||"AD").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const rolLabel = { ROLE_ADMIN:"Administrador", ROLE_CAJERO:"Cajero" }[session.rol] || session.rol;

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:C.fondo,fontFamily:"'Source Sans 3', Arial, sans-serif"}}>

      {/* SIDEBAR */}
      <aside style={{width:sideCollapsed?66:228,background:C.oscuro,display:"flex",flexDirection:"column",height:"100vh",transition:"width 0.24s cubic-bezier(.4,0,.2,1)",flexShrink:0,overflow:"hidden"}}>
        {/* Logo */}
        <div style={{padding:"18px 14px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10}}>
          <LogoSVG width={34} height={34}/>
          {!sideCollapsed&&<div style={{animation:"fadeIn 0.2s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",color:C.amarillo,fontSize:13,fontWeight:700,lineHeight:1}}>INTIWATANA</div>
            <div style={{color:C.medio,fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase"}}>Administración</div>
          </div>}
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {MENU.map(({key,icon,label})=>(
            <button key={key} onClick={()=>setSeccion(key)} style={{width:"100%",background:seccion===key?"rgba(245,197,24,0.14)":"transparent",border:seccion===key?"1.5px solid rgba(245,197,24,0.28)":"1.5px solid transparent",borderRadius:10,color:seccion===key?C.amarillo:C.medio,padding:sideCollapsed?"11px 0":"10px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:600,textAlign:"left",transition:"all 0.18s",fontFamily:"inherit",justifyContent:sideCollapsed?"center":"flex-start"}}
              onMouseEnter={e=>{if(seccion!==key)e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
              onMouseLeave={e=>{if(seccion!==key)e.currentTarget.style.background="transparent";}}>
              <span style={{flexShrink:0}}>{icon}</span>
              {!sideCollapsed&&<span style={{animation:"fadeIn 0.15s ease"}}>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{padding:"10px 10px 14px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.amarillo},#e8a800)`,color:C.oscuro,fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{iniciales}</div>
          {!sideCollapsed&&<div style={{flex:1,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
            <div style={{color:C.blanco,fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session.nombreCompleto?.split(" ").slice(0,2).join(" ")||session.username}</div>
            <div style={{color:C.medio,fontSize:10}}>{rolLabel}</div>
          </div>}
          {!sideCollapsed&&<button onClick={logout} title="Cerrar sesión" style={{background:"rgba(224,82,82,0.15)",border:"1px solid rgba(224,82,82,0.3)",borderRadius:7,color:"#e05252",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><LogOut size={16}/></button>}
        </div>
      </aside>

      {/* CONTENIDO */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        {/* Topbar */}
        <header style={{background:C.blanco,borderBottom:"1px solid #e2edeb",padding:"0 26px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 6px rgba(16,64,59,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setSideCollapsed(s=>!s)} style={{background:"transparent",border:"none",cursor:"pointer",color:C.gris,padding:"4px 6px",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f0f4f3"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Map size={18}/>
            </button>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:C.oscuro}}>{MENU.find(m=>m.key===seccion)?.label||"Panel"}</div>
              <div style={{fontSize:11,color:C.medio}}>Sistema Web INTIWATANA S.R.L.</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:12,color:C.gris}}>{new Date().toLocaleDateString("es-PE",{weekday:"short",day:"2-digit",month:"long"})}</div>
            <button onClick={logout} style={{background:"rgba(224,82,82,0.08)",color:C.rojo,border:"1px solid rgba(224,82,82,0.2)",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(224,82,82,0.16)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(224,82,82,0.08)"}>
              <LogOut size={14}/> Cerrar sesión
            </button>
          </div>
        </header>

        {/* Área principal */}
        <main style={{flex:1,padding:"22px 26px",overflowY:"auto"}}>
          {seccion==="dashboard"   && <DashboardHome    headers={headers} onNav={setSeccion}/>}
          {seccion==="sucursales"  && <ErrorBoundary key="suc"><CrudSucursales  headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="rutas"       && <ErrorBoundary key="rut"><CrudRutas       headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="buses"       && <ErrorBoundary key="bus"><CrudBuses       headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="viajes"      && <ErrorBoundary key="via"><CrudViajes      headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="clientes"    && <ErrorBoundary key="cli"><CrudClientes    headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="pagos"       && <ErrorBoundary key="pag"><CrudPagos       headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="encomiendas" && <ErrorBoundary key="enc"><CrudEncomiendas headers={headers} showToast={showToast}/></ErrorBoundary>}
          {seccion==="personal"    && isAdmin && <ErrorBoundary key="per"><CrudPersonal    headers={headers} showToast={showToast}/></ErrorBoundary>}
        </main>
      </div>

      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",bottom:22,right:22,background:toast.startsWith("Error")||toast.startsWith("⚠")?C.rojo:C.oscuro,color:C.blanco,padding:"13px 22px",borderRadius:12,fontSize:14,fontWeight:600,boxShadow:"0 6px 24px rgba(0,0,0,0.28)",zIndex:9999,animation:"slideUp 0.28s cubic-bezier(.4,0,.2,1)",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit",maxWidth:360}}>
          {toast.startsWith("Error")||toast.startsWith("⚠")?<AlertCircle size={16}/>:<CheckCircle2 size={16}/>}
          {toast}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Sans+3:wght@400;600;700&display=swap');
        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes slideUp {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes modalIn {from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:none}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes pulse   {0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        @keyframes skeletonShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}

        .pulse-logo{animation:pulse 1.4s ease infinite;display:inline-block;}
        .skeleton-rows{display:flex;flex-direction:column;gap:10px;padding:1rem 1.2rem;}
        .skeleton-row{height:38px;border-radius:8px;background:linear-gradient(90deg,#e8f0ee 25%,#f4f9f8 50%,#e8f0ee 75%);background-size:800px 100%;animation:skeletonShimmer 1.4s infinite linear;}
        .spinner{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;}
        .adm-topbar{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;gap:1rem;flex-wrap:wrap;}
        .adm-page-title{font-family:'Playfair Display',serif;font-size:1.55rem;font-weight:800;color:${C.oscuro};margin:0;}
        .adm-page-sub{font-size:13px;color:${C.medio};margin:3px 0 0;}
        .adm-btn-primary{background:${C.verde};color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;}
        .adm-btn-primary:hover{background:${C.oscuro};transform:translateY(-1px);}
        .adm-search-row{margin-bottom:14px;position:relative;}
        .adm-search{border:1.5px solid #d4dbd9;border-radius:10px;padding:9px 14px;font-size:13px;font-family:inherit;color:${C.oscuro};background:#fff;outline:none;width:280px;transition:border 0.18s;}
        .adm-search:focus{border-color:${C.verde};box-shadow:0 0 0 3px ${C.verde}14;}
        .adm-table-wrap{background:#fff;border-radius:14px;border:1.5px solid rgba(18,115,105,0.09);overflow:hidden;overflow-x:auto;}
        .adm-table{width:100%;border-collapse:collapse;font-size:13px;}
        .adm-table th{background:#f4f9f8;padding:11px 15px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${C.medio};border-bottom:1.5px solid rgba(18,115,105,0.07);white-space:nowrap;}
        .adm-table td{padding:11px 15px;border-bottom:1px solid rgba(18,115,105,0.05);color:${C.oscuro};vertical-align:middle;}
        .adm-table tr:last-child td{border-bottom:none;}
        .tr-hover:hover td{background:#f6fbfa;transition:background 0.12s;}
        .td-empty{text-align:center;color:${C.medio};padding:3.5rem;font-size:14px;}
        .td-codigo{font-family:monospace;font-size:11.5px;background:rgba(18,115,105,0.09);color:${C.verde};border-radius:6px;padding:2px 8px;font-weight:700;}
        .td-lugar{display:flex;flex-direction:column;gap:2px;}
        .td-ciudad{font-weight:700;font-size:13px;}
        .td-actions{display:flex;gap:6px;}
        .btn-edit{background:rgba(18,115,105,0.09);color:${C.verde};border:none;border-radius:7px;padding:6px 10px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;}
        .btn-edit:hover{background:rgba(18,115,105,0.2);}
        .btn-delete{background:rgba(224,82,82,0.09);color:${C.rojo};border:none;border-radius:7px;padding:6px 10px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;}
        .btn-delete:hover{background:rgba(224,82,82,0.2);}
        .btn-delete-confirm{background:${C.rojo};color:#fff;border:none;border-radius:9px;padding:10px 22px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:6px;}
        .btn-delete-confirm:hover{background:#c0392b;}
        .btn-cancelar{background:#f0f4f3;color:${C.gris};border:1.5px solid #d4dbd9;border-radius:9px;padding:10px 18px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
        .btn-cancelar:hover{background:#e8efed;}
        .btn-reservar{background:${C.verde};color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;flex:1;transition:all 0.18s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-reservar:hover:not(:disabled){background:${C.oscuro};}
        .btn-reservar:disabled{opacity:0.6;cursor:not-allowed;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 1.1rem;}
        .lf-field{margin-bottom:1rem;}
        .lf-field label{display:block;font-size:10.5px;font-weight:700;color:${C.gris};margin-bottom:5px;letter-spacing:0.08em;text-transform:uppercase;}
        .lf-field input,.lf-select{width:100%;border:1.5px solid #d4dbd9;border-radius:9px;padding:10px 13px;font-size:13px;font-family:inherit;color:${C.oscuro};background:#fff;outline:none;box-sizing:border-box;transition:border 0.18s;}
        .lf-field input:focus,.lf-select:focus{border-color:${C.verde};box-shadow:0 0 0 3px ${C.verde}14;}
        .lf-field input:disabled{background:#f5f7f6;color:${C.medio};cursor:not-allowed;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.46);display:flex;align-items:center;justify-content:center;z-index:9998;backdrop-filter:blur(2px);}
        .modal{background:#fff;border-radius:16px;max-width:520px;width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.26);}
        .modal-header{display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #f0f4f3;}
        .modal-badge{width:44px;height:44px;border-radius:11px;background:rgba(18,115,105,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${C.verde};}
        .modal-title{font-weight:700;font-size:16px;color:${C.oscuro};margin:0;}
        .modal-subtitle{font-size:12px;color:${C.medio};margin:4px 0 0;}
        .modal-close{background:transparent;border:none;color:${C.medio};font-size:22px;cursor:pointer;padding:0;margin-left:auto;line-height:1;transition:color 0.15s;display:flex;align-items:center;}
        .modal-close:hover{color:${C.oscuro};}
        .modal-body{padding:20px 24px;}
        .confirm-modal{max-width:360px;}
        .card-panel{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 2px 12px rgba(16,64,59,0.06);border:1.5px solid #e2edeb;margin-bottom:16px;}
        .panel-title{font-weight:700;font-size:13px;color:${C.oscuro};margin-bottom:14px;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#c5d5d3;border-radius:99px;}
        ::-webkit-scrollbar-thumb:hover{background:#a0b8b5;}
      `}</style>
    </div>
  );
}
