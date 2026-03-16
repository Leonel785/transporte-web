import { useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
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
      { hora: "10:00", tipo: "Diurno",   precio: "S/ 35–45" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 40–50" },
      { hora: "18:00", tipo: "Nocturno", precio: "S/ 45–55" },
      { hora: "21:00", tipo: "Nocturno", precio: "S/ 45–55" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
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
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003",  horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
      { nombre: "Agencia de Pongococha",            dir: "Av. Lima s/n, Camaná, Arequipa", horario: "8:00 AM – 9:00 PM",  tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Vischongo",
    imagen: "/assets/img/rutas/vischongo.jpeg",
    emoji: "🏙️", color: "#4C5958", region: "Ayacucho",
    duracion: "~2h", distancia: "~560 km",
    horarios: [
      { hora: "08:00", tipo: "Diurno",   precio: "S/ 50–70" },
      { hora: "15:00", tipo: "Tarde",    precio: "S/ 55–75" },
      { hora: "19:00", tipo: "Nocturno", precio: "S/ 60–80" },
      { hora: "22:00", tipo: "Nocturno", precio: "S/ 65–85" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Agencia de Vischongo",             dir: "Av. Túpac Amaru 3069, Lima",    horario: "Abierto 24 horas", tipo: "DESTINO" },
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
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003",   horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
      { nombre: "Agencia de Chiribamba",            dir: "Av. Martinelli s/n, Andahuaylas", horario: "7:00 AM – 9:00 PM",  tipo: "DESTINO" },
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

// ── Landing pública ────────────────────────────────────
function LandingPage({ onIrAdmin }) {
  const [origen,       setOrigen]       = useState("Ayacucho");
  const [destinoSel,   setDestinoSel]   = useState(null);
  const [modalDestino, setModalDestino] = useState(null);
  const { session } = useAuth();

  const filtrados = destinoSel
    ? DESTINOS.filter((d) => d.nombre.toLowerCase().includes(destinoSel.toLowerCase()))
    : DESTINOS;

  return (
    <>
      <nav className="nav">
        <div className="nav-logo">
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
        <button className="btn-admin-nav" onClick={onIrAdmin}>
          {session ? "🛠 Panel Admin" : "Iniciar sesión"}
        </button>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-bg-pattern" />
        <svg className="hero-mountain-svg" viewBox="0 0 1440 140" preserveAspectRatio="none">
          <polygon points="0,140 0,100 200,20 400,80 600,10 800,70 1000,15 1200,60 1440,30 1440,140" fill="white" />
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

      <div className="stats-bar">
        <div className="stat"><span className="stat-num">10+</span><span className="stat-label">Destinos</span></div>
        <div className="stat"><span className="stat-num">20+</span><span className="stat-label">Años de experiencia</span></div>
        <div className="stat"><span className="stat-num">25K+</span><span className="stat-label">Pasajeros / año</span></div>
        <div className="stat"><span className="stat-num">24/7</span><span className="stat-label">Atención</span></div>
      </div>

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

      <section className="nosotros" id="nosotros">
        <h2>¿Por qué viajar con nosotros?</h2>
        <p>
          Somos una empresa ayacuchana con más de dos décadas conectando
          comunidades y ciudades a través de los Andes peruanos. Tu comodidad
          y seguridad son nuestra prioridad.
        </p>
        <div className="valores">
          {[
            { icon: "🛡️", name: "Seguridad",   desc: "Flota moderna con mantenimiento constante" },
            { icon: "⏰", name: "Puntualidad", desc: "Cumplimos con los horarios establecidos" },
            { icon: "💺", name: "Confort",     desc: "Asientos reclinables y espaciosos" },
            { icon: "📍", name: "Cobertura",   desc: "Llegamos a destinos difíciles de acceder" },
          ].map((v) => (
            <div className="valor" key={v.name}>
              <span className="valor-icon">{v.icon}</span>
              <span className="valor-name">{v.name}</span>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="contacto">
        <div className="footer-logo">
          <LogoSVG width={36} height={36} />
          <strong>INTIWATANA S.R.L.</strong>
        </div>
        <p>Empresa de Transportes · Ayacucho, Perú · © 2026 Todos los derechos reservados</p>
        <p className="footer-contact">
          Terminal: Av. Cusco 362, Ayacucho &nbsp;|&nbsp; Tel: (066) 312-000
        </p>
      </footer>

      <ModalHorarios destino={modalDestino} onClose={() => setModalDestino(null)} />
    </>
  );
}

// ── Router interno ─────────────────────────────────────
function AppRouter() {
  const { session } = useAuth();
  const [vista, setVista] = useState("landing");

  const irAdmin = () => setVista(session ? "admin" : "login");

  if (vista === "admin"  && session)  return <AdminDashboard />;
  if (vista === "login"  && !session) return <Login />;
  if (vista === "login"  && session)  return <AdminDashboard />;

  return <LandingPage onIrAdmin={irAdmin} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}