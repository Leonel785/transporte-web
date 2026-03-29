import { useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login, { RegisterForm, LeftPanel } from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import ClienteDashboard from "./components/ClienteDashboard";
import PasajesPage from "./components/PasajesPage";
import LogoSVG from "./components/LogoSVG";

// ── DATA REAL ─────────────────────────────────────────
const DESTINOS = [
  {
    nombre: "Vilcas Huaman",
    imagen: "/assets/img/rutas/vilcas.jpg",
    emoji: "🏛️", color: "#8AA6A3", region: "Ayacucho",
    duracion: "Local", distancia: "–",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 10–15" },
      { hora: "09:00", tipo: "Diurno",   precio: "S/ 10–15" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 10–15" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
      { nombre: "Agencia de Vilcas Huaman",         dir: "Jr. Lima 350, Ayacucho",        horario: "6:00 AM – 10:00 PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Accomarca",
    imagen: "/assets/img/rutas/accomarca.jpeg",
    emoji: "🌿", color: "#127369", region: "Ayacucho",
    duracion: "~8h 30min", distancia: "~340 km",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 35–45" },
      { hora: "08:00", tipo: "Diurno",   precio: "S/ 35–45" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 40–50" },
      { hora: "21:00", tipo: "Nocturno", precio: "S/ 45–55" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas",    tipo: "ORIGEN"  },
      { nombre: "Agencia de Accomarca",             dir: "Av. Pachacútec 378, Abancay",   horario: "Lun–Dom: 8AM – 10PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Huarcas",
    imagen: "/assets/img/rutas/huarcas.jpeg",
    emoji: "🏔️", color: "#4C5958", region: "Ayacucho",
    duracion: "~14h", distancia: "~570 km",
    horarios: [
      { hora: "07:00", tipo: "Diurno",   precio: "S/ 60–80" },
      { hora: "17:00", tipo: "Tarde",    precio: "S/ 65–85" },
      { hora: "20:00", tipo: "Nocturno", precio: "S/ 70–90" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003",        horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Agencia de Huarcas",               dir: "Av. Andrés Avelino Cáceres, Arequipa", horario: "Abierto 24 horas", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Pongococha",
    imagen: "/assets/img/rutas/pongococha.jpeg",
    emoji: "🌊", color: "#10403B", region: "Ayacucho",
    duracion: "~16h", distancia: "~650 km",
    horarios: [
      { hora: "18:00", tipo: "Nocturno", precio: "S/ 75–95" },
      { hora: "20:00", tipo: "Nocturno", precio: "S/ 75–95" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003",  horario: "Abierto 24 horas",  tipo: "ORIGEN"  },
      { nombre: "Agencia de Pongococha",            dir: "Av. Lima s/n, Camaná, Arequipa", horario: "8:00 AM – 9:00 PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Vischongo",
    imagen: "/assets/img/rutas/vischongo.jpeg",
    emoji: "🏙️", color: "#4C5958", region: "Ayacucho",
    duracion: "~2h", distancia: "~80 km",
    horarios: [
      { hora: "08:00", tipo: "Diurno",   precio: "S/ 10–15" },
      { hora: "15:00", tipo: "Tarde",    precio: "S/ 10–15" },
      { hora: "19:00", tipo: "Nocturno", precio: "S/ 10–15" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Agencia de Vischongo",             dir: "Vischongo, Cangallo, Ayacucho", horario: "Abierto 24 horas", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Andabamba",
    imagen: "/assets/img/rutas/andabamba.jpeg",
    emoji: "🏺", color: "#127369", region: "Ayacucho",
    duracion: "~12h", distancia: "~500 km",
    horarios: [
      { hora: "07:00", tipo: "Diurno",   precio: "S/ 55–75" },
      { hora: "19:00", tipo: "Nocturno", precio: "S/ 60–80" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Agencia de Andabamba",             dir: "Av. Velasco Astete s/n, Cusco", horario: "Abierto 24 horas", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Manallasacc",
    imagen: "/assets/img/rutas/manallasacc.jpeg",
    emoji: "🏜️", color: "#8AA6A3", region: "Ayacucho",
    duracion: "~8h", distancia: "~390 km",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 40–55" },
      { hora: "20:00", tipo: "Nocturno", precio: "S/ 45–60" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003",    horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
      { nombre: "Agencia de Manallasacc",           dir: "Prolongación Lambayeque 180, Ica", horario: "6:00 AM – 10:00 PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Chiribamba",
    imagen: "/assets/img/rutas/chiribamba.jpeg",
    emoji: "⛰️", color: "#10403B", region: "Ayacucho",
    duracion: "~5h", distancia: "~195 km",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 25–35" },
      { hora: "10:00", tipo: "Diurno",   precio: "S/ 25–35" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 30–40" },
      { hora: "18:00", tipo: "Nocturno", precio: "S/ 30–40" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003",   horario: "Abierto 24 horas",  tipo: "ORIGEN"  },
      { nombre: "Agencia de Chiribamba",            dir: "Av. Martinelli s/n, Andahuaylas", horario: "7:00 AM – 9:00 PM", tipo: "DESTINO" },
    ],
  },
];

// ── Modal horarios ─────────────────────────────────────
function ModalHorarios({ destino, onClose }) {
  if (!destino) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge">{destino.emoji}</div>
          <div>
            <div className="modal-title">{destino.nombre}</div>
            <div className="modal-subtitle">{destino.region} · Valle andino</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-info-row">
            <div className="modal-chip">⏱ Duración: <strong>{destino.duracion}</strong></div>
            <div className="modal-chip">📏 Distancia: <strong>{destino.distancia}</strong></div>
          </div>
          <hr className="modal-divider" />
          <div className="modal-section-label">Horarios de salida — Ayacucho → {destino.nombre}</div>
          <div className="horarios-grid">
            {destino.horarios.map((h, i) => (
              <div className="horario-pill" key={i}>
                <span className="hora">{h.hora}</span>
                <span className="hora-tipo">{h.tipo}</span>
                <span className="hora-precio">{h.precio}</span>
              </div>
            ))}
          </div>
          <hr className="modal-divider" />
          <div className="modal-section-label">Terminales</div>
          <div className="terminales-list">
            {destino.terminales.map((t, i) => (
              <div className="terminal-row" key={i}>
                <div className="terminal-icon">{t.tipo === "ORIGEN" ? "🚌" : "📍"}</div>
                <div className="terminal-info">
                  <div className="terminal-nombre">{t.nombre}</div>
                  <div className="terminal-dir">{t.dir}</div>
                  <div className="terminal-horario">{t.horario}</div>
                </div>
                <span className="terminal-badge">{t.tipo}</span>
              </div>
            ))}
          </div>
          <button className="btn-reservar" onClick={onClose}>Reservar pasaje</button>
          <p className="modal-nota">* Horarios y precios referenciales. Confirmar disponibilidad en terminal.</p>
        </div>
      </div>
    </div>
  );
}

// ── Modal Tracking público ─────────────────────────────
function ModalTracking({ onClose }) {
  const [codigo,    setCodigo]    = useState("");
  const [resultado, setResultado] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const ESTADO_LABELS = {
    RECIBIDO:      { label: "Recibido",      icon: "📦", color: "#b8860b",  bg: "rgba(245,197,24,0.15)"  },
    EN_ALMACEN:    { label: "En almacén",    icon: "🏭", color: "#127369",  bg: "rgba(18,115,105,0.15)"  },
    EN_TRANSITO:   { label: "En tránsito",   icon: "🚌", color: "#127369",  bg: "rgba(18,115,105,0.15)"  },
    EN_DESTINO:    { label: "En destino",    icon: "📍", color: "#1d4ed8",  bg: "rgba(59,130,246,0.15)"  },
    LISTO_ENTREGA: { label: "Listo entrega", icon: "📬", color: "#127369",  bg: "rgba(18,115,105,0.15)"  },
    ENTREGADO:     { label: "Entregado",     icon: "✅", color: "#15803d",  bg: "rgba(34,197,94,0.15)"   },
    DEVUELTO:      { label: "Devuelto",      icon: "↩️", color: "#7e22ce",  bg: "rgba(168,85,247,0.15)"  },
    PERDIDO:       { label: "Perdido",       icon: "⚠️", color: "#dc2626",  bg: "rgba(239,68,68,0.15)"   },
  };

  const buscar = async () => {
    if (!codigo.trim()) { setError("Ingresa el número de guía."); return; }
    setError(""); setResultado(null); setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/encomiendas/tracking/${codigo.trim().toUpperCase()}`
      );
      if (res.ok) {
        setResultado(await res.json());
      } else if (res.status === 404) {
        setError("No se encontró ninguna encomienda con ese número.");
      } else {
        setError("Error al consultar. Verifica el número e intenta nuevamente.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Verifica que el servicio esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const PASOS = ["RECIBIDO","EN_ALMACEN","EN_TRANSITO","EN_DESTINO","LISTO_ENTREGA","ENTREGADO"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge">📦</div>
          <div>
            <div className="modal-title">Rastrear Encomienda</div>
            <div className="modal-subtitle">Consulta el estado de tu envío</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Buscador */}
          <div style={{ display:"flex", gap:8, marginBottom:"1rem" }}>
            <input
              style={{
                flex:1, background:"rgba(138,166,163,0.1)",
                border:"1.5px solid rgba(138,166,163,0.25)", borderRadius:8,
                padding:"10px 13px", fontSize:14, color:"var(--blanco)",
                outline:"none", fontFamily:"inherit",
              }}
              placeholder="N° de guía — ej: ENC-2026-001"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button
              className="btn-reservar"
              style={{ width:"auto", padding:"0 1.2rem", marginTop:0 }}
              onClick={buscar}
              disabled={loading}
            >
              {loading ? "..." : "Buscar"}
            </button>
          </div>

          {error && (
            <div style={{
              background:"rgba(220,38,38,0.12)", border:"1px solid rgba(220,38,38,0.25)",
              borderRadius:8, padding:"10px 14px", color:"#fca5a5",
              fontSize:13, marginBottom:"1rem",
            }}>
              ⚠️ {error}
            </div>
          )}

          {resultado && (() => {
            const estado = resultado.estado || resultado.ultimoEstado;
            const cfg    = ESTADO_LABELS[estado] || { label: estado, icon: "•", color:"#8AA6A3", bg:"rgba(138,166,163,0.15)" };
            const idxActual = PASOS.indexOf(estado);
            const guia      = resultado.numeroGuia  || resultado.numero_guia;
            const desc      = resultado.descripcionContenido || resultado.descripcion_contenido;
            const peso      = resultado.pesoKg       || resultado.peso_kg;
            const origen    = resultado.sucursalOrigen?.ciudad  || resultado.ciudad_origen;
            const destino   = resultado.sucursalDestino?.ciudad || resultado.ciudad_destino;
            const destNom   = [
              resultado.destinatario?.nombres    || resultado.destinatario_nombres,
              resultado.destinatario?.apellidos  || resultado.destinatario_apellidos,
            ].filter(Boolean).join(" ");

            return (
              <>
                {/* Badge estado */}
                <div style={{ textAlign:"center", marginBottom:"1.2rem" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    padding:"5px 14px", borderRadius:50, fontSize:13, fontWeight:700,
                    background: cfg.bg, color: cfg.color,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="track-progress">
                  {PASOS.map((paso, i) => {
                    const done    = i <= idxActual && idxActual >= 0;
                    const current = i === idxActual;
                    const p       = ESTADO_LABELS[paso] || {};
                    return (
                      <div className={`track-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={paso}>
                        <div className="track-dot">{done ? (p.icon || "✓") : "○"}</div>
                        <div className="track-label">{p.label || paso}</div>
                        {i < PASOS.length - 1 && (
                          <div className={`track-line ${done && i < idxActual ? "done" : ""}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <hr className="modal-divider" />

                {/* Info grid */}
                <div className="track-info-grid">
                  {[
                    ["N° Guía",      guia    || "—"],
                    ["Contenido",    desc    || "—"],
                    ["Peso",         peso ? `${peso} kg` : "—"],
                    ["Costo",        resultado.costo ? `S/ ${resultado.costo}` : "—"],
                    ["Origen",       origen  || "—"],
                    ["Destino",      destino || "—"],
                    ["Destinatario", destNom || "—"],
                  ].map(([lbl, val]) => (
                    <div className="track-info-item" key={lbl}>
                      <span className="track-info-label">{lbl}</span>
                      <span className="track-info-value">{val}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ── Landing pública ────────────────────────────────────
function LandingPage({ onIrLogin }) {
  const [origen,        setOrigen]        = useState("Ayacucho");
  const [destinoSel,    setDestinoSel]    = useState(null);
  const [modalDestino,  setModalDestino]  = useState(null);
  const [showTracking,  setShowTracking]  = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  const filtrados = destinoSel
    ? DESTINOS.filter((d) => d.nombre.toLowerCase().includes(destinoSel.toLowerCase()))
    : DESTINOS;

  const esAdmin = session && (
    session.rol === "ROLE_ADMIN" ||
    session.rol === "ROLE_CAJERO" ||
    session.rol === "ROLE_CHOFER"
  );

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="nav">
        <div className="nav-logo" style={{ cursor:"pointer" }} onClick={() => navigate("/")}>
          <LogoSVG />
          <div className="nav-brand">
            Emp. de Transportes
            <span>INTIWATANA S.R.L.</span>
          </div>
        </div>

        <ul className="nav-links">
          <li><a href="#inicio">Inicio</a></li>
          <li><a href="#destinos">Destinos</a></li>
          <li><a href="#nosotros">Nosotros</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>

        <div style={{ display:"flex", gap:"0.6rem", alignItems:"center" }}>
          {/* Comprar pasaje */}
          <button
            className="btn-terminal"
            style={{ borderRadius:8, padding:"7px 14px", fontSize:13 }}
            onClick={() => navigate("/pasajes")}
          >
            🎫 Comprar pasaje
          </button>

          {session ? (
            /* Usuario logueado */
            <button
              className="nav-usuario-btn"
              onClick={() => navigate(esAdmin ? "/admin" : "/cliente")}
            >
              {session.foto ? (
                <img src={session.foto} alt="avatar" className="nav-avatar-img" />
              ) : (
                <div className="nav-avatar-iniciales">
                  {(session.username || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="nav-usuario-nombre">
                {esAdmin ? "Panel Admin" : session.username}
              </span>
            </button>
          ) : (
            /* Sin sesión */
            <>
              <button className="btn-admin-nav" onClick={onIrLogin}>
                Iniciar sesión
              </button>
              <button
                className="btn-admin-nav btn-registrarse"
                onClick={() => navigate("/registrar")}
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="inicio">
        <div className="hero-bg-pattern" />
        {/* Sin fill blanco — transparente para no cortar el fondo verde */}
        <svg className="hero-mountain-svg" viewBox="0 0 1440 140" preserveAspectRatio="none">
          <polygon
            points="0,140 0,100 200,20 400,80 600,10 800,70 1000,15 1200,60 1440,30 1440,140"
            fill="rgba(7,32,30,0.35)"
          />
        </svg>
        <div className="hero-content">
          <h1>Viaja con<br /><em>Intiwatana</em></h1>
          <p>Conectando los Andes con seguridad y puntualidad</p>
          <div className="search-box">
            <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
              <option>Ayacucho</option>
              <option>Abancay</option>
              <option>Arequipa</option>
            </select>
            <div className="search-divider" />
            <select value={destinoSel || ""} onChange={(e) => setDestinoSel(e.target.value || null)}>
              <option value="">Todos los destinos</option>
              {DESTINOS.map((d) => (
                <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
              ))}
            </select>
            <button className="btn-buscar">Buscar</button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar">
        <div className="stat"><span className="stat-num">10+</span><span className="stat-label">Destinos</span></div>
        <div className="stat"><span className="stat-num">20+</span><span className="stat-label">Años de experiencia</span></div>
        <div className="stat"><span className="stat-num">25K+</span><span className="stat-label">Pasajeros / año</span></div>
        <div className="stat"><span className="stat-num">24/7</span><span className="stat-label">Atención</span></div>
      </div>

      {/* ── ACCESOS RÁPIDOS ── */}
      <div className="acceso-rapido">
        <button className="btn-acceso" onClick={() => setShowTracking(true)}>
          <span>📦</span> Rastrear encomienda
        </button>
        <button className="btn-acceso" onClick={() => navigate("/pasajes")}>
          <span>🎫</span> Comprar pasaje
        </button>
        {!session && (
          <button className="btn-acceso" onClick={() => navigate("/registrar")}>
            <span>📝</span> Crear cuenta
          </button>
        )}
        <button
          className="btn-acceso"
          onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior:"smooth" })}
        >
          <span>📞</span> Contacto
        </button>
      </div>

      {/* ── DESTINOS ── */}
      <div className="section" id="destinos">
        <h2 className="section-title">Destinos</h2>
        <p className="section-subtitle">Elige tu destino y consulta los horarios disponibles</p>
        <div className="destinos-grid">
          {filtrados.map((d) => (
            <div className="destino-card" key={d.nombre}>
              <div className="destino-img-wrapper">
                <img
                  src={d.imagen}
                  alt={d.nombre}
                  className="destino-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.style.background = `${d.color}33`;
                  }}
                />
                {d.emoji && <span className="destino-emoji-overlay">{d.emoji}</span>}
              </div>
              <div className="destino-body">
                <div className="destino-name">{d.nombre}</div>
                <button className="btn-terminal" onClick={() => setModalDestino(d)}>
                  Reservar pasaje
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── NOSOTROS ── */}
      <section className="nosotros" id="nosotros">
        <h2>¿Por qué viajar con nosotros?</h2>
        <p>
          Somos una empresa ayacuchana .
        </p>
        <div className="valores">
          {[
            { icon: "🛡️", name: "Seguridad",    desc: "Flota moderna con mantenimiento constante"  },
            { icon: "⏰", name: "Puntualidad",  desc: "Cumplimos con los horarios establecidos"     },
            { icon: "💺", name: "Confort",      desc: "Asientos reclinables y espaciosos"           },
            { icon: "📍", name: "Cobertura",    desc: "Llegamos a destinos difíciles de acceder"    },
            { icon: "📦", name: "Encomiendas",  desc: "Envíos seguros con seguimiento en tiempo real"},
          ].map((v) => (
            <div className="valor" key={v.name}>
              <span className="valor-icon">{v.icon}</span>
              <span className="valor-name">{v.name}</span>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contacto">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">
              <LogoSVG width={36} height={36} />
              <strong>INTIWATANA S.R.L.</strong>
            </div>
            <p style={{ color:"var(--gris-verde)", fontSize:13, marginTop:6 }}>
              Empresa de Transportes · Ayacucho, Perú
            </p>
            <p className="footer-contact">Terminal: Av. Cusco 362, Ayacucho</p>
            <p className="footer-contact">Tel: (066) 312-000</p>
          </div>
          <div className="footer-links">
            <h4>Servicios</h4>
            <ul>
              <li><a href="#destinos">Destinos y horarios</a></li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowTracking(true); }}>
                  Rastrear encomienda
                </a>
              </li>
              <li><a href="#nosotros">Sobre nosotros</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Mi cuenta</h4>
            <ul>
              {session ? (
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate(esAdmin ? "/admin" : "/cliente"); }}>
                    {esAdmin ? "Panel Admin" : "Mi panel"}
                  </a>
                </li>
              ) : (
                <>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/registrar"); }}>Registrarse</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); onIrLogin(); }}>Iniciar sesión</a></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Empresa de Transportes INTIWATANA S.R.L. · Todos los derechos reservados
        </div>
      </footer>

      {/* ── MODALES ── */}
      <ModalHorarios destino={modalDestino} onClose={() => setModalDestino(null)} />
      {showTracking && <ModalTracking onClose={() => setShowTracking(false)} />}
    </>
  );
}

// ── Protección de rutas ────────────────────────────────
function RutaProtegida({ children, roles }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.rol)) return <Navigate to="/" replace />;
  return children;
}

// ── Router interno ─────────────────────────────────────
function AppRouter() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Landing pública */}
      <Route path="/" element={
        <LandingPage onIrLogin={() => navigate("/login")} />
      } />

      {/* Login */}
      <Route path="/login" element={
        session ? <Navigate to={
          (session.rol === "ROLE_ADMIN" || session.rol === "ROLE_CAJERO" || session.rol === "ROLE_CHOFER")
            ? "/admin" : "/cliente"
        } replace /> : <Login onIrRegistro={() => navigate("/registrar")} />
      } />

      {/* Registro */}
      <Route path="/registrar" element={
        session ? <Navigate to="/cliente" replace /> : (
          <div className="login-wrap">
            <LeftPanel tab="cliente" />
            <div className="login-right">
              <div className="login-box login-box--registro">
                <RegisterForm onVolver={() => navigate("/login")} />
              </div>
            </div>
          </div>
        )
      } />

      {/* Comprar pasajes */}
      <Route path="/pasajes" element={<PasajesPage />} />

      {/* Panel admin */}
      <Route path="/admin" element={
        <RutaProtegida roles={["ROLE_ADMIN", "ROLE_CAJERO", "ROLE_CHOFER"]}>
          <AdminDashboard />
        </RutaProtegida>
      } />

      {/* Panel cliente */}
      <Route path="/cliente" element={
        <RutaProtegida roles={["ROLE_CLIENTE"]}>
          <ClienteDashboard />
        </RutaProtegida>
      } />

      {/* Ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}