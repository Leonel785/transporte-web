import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Bus, MapPin, Calendar, Clock, LogOut, CheckCircle, Ticket, Users, Navigation, AlertTriangle, RefreshCw, ChevronRight, Armchair } from "lucide-react";
import LogoSVG from "./LogoSVG";

const C = { verde:"#127369", oscuro:"#0d3330", amarillo:"#F5C518", medio:"#7a9e9b", gris:"#4C5958", fondo:"#f0f4f3", blanco:"#ffffff", rojo:"#e05252" };

function fmtFecha(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("es-PE",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); } 
  catch { return "—"; }
}

function EstadoBadge({ estado }) {
  const map = {
    PROGRAMADO: { bg:"#e0f2fe", c:"#0369a1", label:"Programado" },
    EN_CURSO:   { bg:"#fef08a", c:"#854d0e", label:"En Curso" },
    FINALIZADO: { bg:"#dcfce7", c:"#166534", label:"Finalizado" },
    CANCELADO:  { bg:"#fee2e2", c:"#dc2626", label:"Cancelado" },
  };
  const s = map[estado] || { bg:"#f0f4f3", c:C.gris, label: estado };
  return <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.c }}>{s.label}</span>;
}

// Mapa gráfico de asientos del viaje
function MapaAsientosViaje({ viajeId, headers }) {
  const [asientos, setAsientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/viajes/${viajeId}/asientos`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAsientos(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [viajeId, headers]);

  if (loading) return <div style={{ padding:"1rem", color:C.medio, fontSize:13 }}>Cargando asientos...</div>;
  if (!asientos.length) return <div style={{ padding:"1rem", color:C.medio, fontSize:13 }}>Sin información de asientos.</div>;

  const disponibles = asientos.filter(a => a.estado === "DISPONIBLE").length;
  const vendidos = asientos.filter(a => a.estado === "VENDIDO").length;
  const maxFila = Math.max(...asientos.map(a => a.fila || 1), 1);

  return (
    <div style={{ background:"#f8faf9", borderRadius:12, padding:"1rem", border:`1px solid ${C.verde}22` }}>
      <div style={{ display:"flex", gap:16, marginBottom:12, flexWrap:"wrap" }}>
        {[
          { label:"Disponibles", val:disponibles, color:C.verde },
          { label:"Vendidos", val:vendidos, color:C.rojo },
          { label:"Total", val:asientos.length, color:C.gris },
        ].map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:s.color }}/>
            <span style={{ fontSize:12, color:C.gris }}><strong style={{ color:s.color }}>{s.val}</strong> {s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"center" }}>
        <div style={{ fontSize:11, color:C.medio, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
          <Navigation size={12}/> Frente del bus
        </div>
        {Array.from({ length: maxFila }, (_, fi) => {
          const fila = fi + 1;
          const asientosFila = asientos.filter(a => a.fila === fila);
          return (
            <div key={fila} style={{ display:"flex", gap:4, alignItems:"center" }}>
              <span style={{ fontSize:10, color:C.medio, width:16, textAlign:"right" }}>{fila}</span>
              {[1,2,null,3,4].map((col, idx) => {
                if (col === null) return <div key="pasillo" style={{ width:12 }}/>;
                const a = asientosFila.find(x => x.columna === col);
                if (!a) return <div key={idx} style={{ width:28, height:28 }}/>;
                const color = a.estado === "DISPONIBLE" ? C.verde : a.estado === "VENDIDO" ? C.rojo : "#e67e22";
                return (
                  <div key={a.id} title={`Asiento ${a.numeroAsiento} - ${a.estado}`} style={{
                    width:28, height:28, borderRadius:6, background:color+"22",
                    border:`2px solid ${color}`, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:9, fontWeight:700, color,
                  }}>{a.numeroAsiento}</div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChoferDashboard() {
  const { session, logout } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [cambiando, setCambiando] = useState(null);

  const headers = { "Content-Type":"application/json", Authorization:`Bearer ${session.token}` };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/viajes/mis-viajes", { headers });
      if (res.ok) {
        const data = await res.json();
        setViajes(Array.isArray(data) ? data : data.content || []);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, nuevoEstado) => {
    setCambiando(id);
    try {
      const res = await fetch(`/api/v1/viajes/${id}/estado?estado=${nuevoEstado}`, { method:"PATCH", headers });
      if (res.ok) await cargar();
    } catch(e) { console.error(e); }
    finally { setCambiando(null); }
  };

  const viajesActivos = viajes.filter(v => ["PROGRAMADO","EN_CURSO"].includes(v.estado));
  const viajesHistorial = viajes.filter(v => !["PROGRAMADO","EN_CURSO"].includes(v.estado));

  return (
    <div style={{ minHeight:"100vh", background:C.fondo, fontFamily:"'Source Sans 3', Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ background:C.oscuro, padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <LogoSVG width={36} height={36}/>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", color:C.amarillo, fontSize:14, fontWeight:700 }}>INTIWATANA</div>
            <div style={{ color:C.medio, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase" }}>Panel de Chofer</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"white", fontSize:13, fontWeight:700 }}>{session.nombreCompleto || session.username}</div>
            <div style={{ color:C.medio, fontSize:11 }}>Chofer</div>
          </div>
          <button onClick={logout} style={{ background:"rgba(224,82,82,0.15)", border:"1px solid rgba(224,82,82,0.3)", borderRadius:8, color:"#e05252", padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
            <LogOut size={16}/> Salir
          </button>
        </div>
      </header>

      <main style={{ maxWidth:900, margin:"0 auto", padding:"24px 20px" }}>
        {/* Stats rápidas */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[
            { icon:<Bus size={22}/>, val:viajesActivos.length, label:"Viajes activos", color:C.verde },
            { icon:<Ticket size={22}/>, val:viajes.filter(v=>v.estado==="EN_CURSO").length, label:"En curso ahora", color:C.amarillo },
            { icon:<CheckCircle size={22}/>, val:viajesHistorial.length, label:"Completados", color:C.medio },
          ].map((s,i) => (
            <div key={i} style={{ background:C.blanco, borderRadius:14, padding:"16px 18px", border:`1.5px solid ${s.color}22`, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:28, fontWeight:900, color:C.oscuro, fontFamily:"'Playfair Display',serif" }}>{s.val}</div>
              <div style={{ fontSize:12, color:C.medio, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Botón actualizar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.oscuro, margin:0 }}>Mis Viajes Asignados</h2>
          <button onClick={cargar} style={{ background:C.blanco, border:`1.5px solid ${C.verde}33`, borderRadius:9, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.verde, fontWeight:700, fontFamily:"inherit" }}>
            <RefreshCw size={14}/> Actualizar
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"3rem", color:C.medio }}>
            <div style={{ width:32, height:32, border:`3px solid ${C.verde}33`, borderTopColor:C.verde, borderRadius:"50%", margin:"0 auto 12px", animation:"spin 0.8s linear infinite" }}/>
            <p>Cargando viajes...</p>
          </div>
        ) : viajes.length === 0 ? (
          <div style={{ background:C.blanco, borderRadius:14, padding:"3rem", textAlign:"center", border:`1.5px solid #e2edeb` }}>
            <Bus size={48} style={{ opacity:0.15, marginBottom:12 }}/>
            <p style={{ color:C.medio, fontWeight:600 }}>No tienes viajes asignados actualmente.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {viajes.map(v => (
              <div key={v.id} style={{ background:C.blanco, borderRadius:14, overflow:"hidden", border:`1.5px solid ${v.estado==="EN_CURSO"?C.amarillo+"66":"#e2edeb"}`, boxShadow: v.estado==="EN_CURSO"?"0 0 0 2px "+C.amarillo+"22":"0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                    {/* Ruta */}
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:17, fontWeight:700, color:C.oscuro, marginBottom:8 }}>
                        <MapPin size={18} color={C.verde}/> {v.ruta?.origen?.ciudad || "—"} <ChevronRight size={16} color={C.medio}/> {v.ruta?.destino?.ciudad || "—"}
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:12, color:C.gris, fontSize:13 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}><Calendar size={14}/> {fmtFecha(v.fechaHoraSalida)}</span>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}><Bus size={14}/> Placa: <strong>{v.bus?.placa || "—"}</strong></span>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}><Armchair size={14}/> <strong>{v.asientosDisponibles ?? "—"}</strong>/{v.totalAsientos ?? "—"} disponibles</span>
                      </div>
                    </div>
                    {/* Estado y acciones */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                      <EstadoBadge estado={v.estado}/>
                      <div style={{ display:"flex", gap:8 }}>
                        {v.estado === "PROGRAMADO" && (
                          <button disabled={cambiando===v.id} onClick={() => cambiarEstado(v.id,"EN_CURSO")} style={{ padding:"8px 16px", background:C.amarillo, color:C.oscuro, border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
                            <Navigation size={15}/> Iniciar viaje
                          </button>
                        )}
                        {v.estado === "EN_CURSO" && (
                          <button disabled={cambiando===v.id} onClick={() => cambiarEstado(v.id,"FINALIZADO")} style={{ padding:"8px 16px", background:C.verde, color:"white", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
                            <CheckCircle size={15}/> Finalizar viaje
                          </button>
                        )}
                        <button onClick={() => setExpandido(expandido===v.id?null:v.id)} style={{ padding:"8px 12px", background:"#f0f4f3", border:`1.5px solid #e2edeb`, borderRadius:8, cursor:"pointer", color:C.gris, fontSize:12, fontWeight:700, fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                          <Armchair size={14}/> {expandido===v.id?"Ocultar":"Ver asientos"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mapa de asientos desplegable */}
                {expandido === v.id && (
                  <div style={{ borderTop:`1px solid #f0f4f3`, padding:"16px 20px" }}>
                    <h4 style={{ margin:"0 0 12px", color:C.oscuro, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                      <Armchair size={16} color={C.verde}/> Mapa de asientos
                    </h4>
                    <MapaAsientosViaje viajeId={v.id} headers={headers}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
