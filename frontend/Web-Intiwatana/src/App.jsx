import { useState } from "react";
import "./App.css";

// ── DATA ──────────────────────────────────────────────
const DESTINOS = [
  {
    nombre: "Vilcas Huaman",
    imagen: "/assets/img/rutas/vilcas.jpg",
    emoji: "🏛️",
    color: "#8AA6A3",
    region: "Ayacucho",
    duracion: "Local",
    distancia: "–",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 10–15" },
      { hora: "09:00", tipo: "Diurno",   precio: "S/ 10–15" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 10–15" },
    ],
    terminales: [
      { nombre: "Terminal del Sur Madre Covadonga", dir: "Av. Cusco 362, Ayacucho 05003", horario: "Abierto 24 horas", tipo: "ORIGEN" },
      { nombre: "Terminal Jr. Lima",                dir: "Jr. Lima 350, Ayacucho",         horario: "6:00 AM – 10:00 PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Abancay",
    imagen: "/assets/img/rutas/abancay.jpg",
    emoji: "🌿",
    color: "#127369",
    region: "Apurímac",
    duracion: "~8h 30min",
    distancia: "~340 km",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 35–45" },
      { hora: "08:00", tipo: "Diurno",   precio: "S/ 35–45" },
      { hora: "10:00", tipo: "Diurno",   precio: "S/ 35–45" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 40–50" },
      { hora: "18:00", tipo: "Nocturno", precio: "S/ 45–55" },
      { hora: "21:00", tipo: "Nocturno", precio: "S/ 45–55" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari",     dir: "Av. Pérez de Cuéllar 2263, Ayacucho", horario: "Abierto 24 horas",     tipo: "ORIGEN"  },
      { nombre: "Terminal Terrestre Abancay", dir: "Av. Pachacútec 378, Abancay",          horario: "Lun–Dom: 8AM – 10PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Arequipa",
    imagen: "/assets/img/rutas/arequipa.jpg",
    emoji: "🏔️",
    color: "#4C5958",
    region: "Arequipa",
    duracion: "~14h",
    distancia: "~570 km",
    horarios: [
      { hora: "07:00", tipo: "Diurno",   precio: "S/ 60–80" },
      { hora: "17:00", tipo: "Tarde",    precio: "S/ 65–85" },
      { hora: "20:00", tipo: "Nocturno", precio: "S/ 70–90" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari",      dir: "Av. Pérez de Cuéllar 2263, Ayacucho",  horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Terminal Terrestre Arequipa", dir: "Av. Andrés Avelino Cáceres, Arequipa", horario: "Abierto 24 horas", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Camaná",
    imagen: "/assets/img/rutas/camana.jpg",
    emoji: "🌊",
    color: "#10403B",
    region: "Arequipa",
    duracion: "~16h",
    distancia: "~650 km",
    horarios: [
      { hora: "18:00", tipo: "Nocturno", precio: "S/ 75–95" },
      { hora: "20:00", tipo: "Nocturno", precio: "S/ 75–95" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari", dir: "Av. Pérez de Cuéllar 2263, Ayacucho", horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
      { nombre: "Terminal Camaná",        dir: "Av. Lima s/n, Camaná, Arequipa",      horario: "8:00 AM – 9:00 PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Lima",
    imagen: "/assets/img/rutas/lima.jpg",
    emoji: "🏙️",
    color: "#4C5958",
    region: "Lima",
    duracion: "~10h",
    distancia: "~560 km",
    horarios: [
      { hora: "08:00", tipo: "Diurno",   precio: "S/ 50–70" },
      { hora: "15:00", tipo: "Tarde",    precio: "S/ 55–75" },
      { hora: "19:00", tipo: "Nocturno", precio: "S/ 60–80" },
      { hora: "22:00", tipo: "Nocturno", precio: "S/ 65–85" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari", dir: "Av. Pérez de Cuéllar 2263, Ayacucho", horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Terminal Plaza Norte",   dir: "Av. Túpac Amaru 3069, Lima",           horario: "Abierto 24 horas", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Cusco",
    imagen: "/assets/img/rutas/cusco.jpg",
    emoji: "🏺",
    color: "#127369",
    region: "Cusco",
    duracion: "~12h",
    distancia: "~500 km",
    horarios: [
      { hora: "07:00", tipo: "Diurno",   precio: "S/ 55–75" },
      { hora: "19:00", tipo: "Nocturno", precio: "S/ 60–80" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari",   dir: "Av. Pérez de Cuéllar 2263, Ayacucho", horario: "Abierto 24 horas", tipo: "ORIGEN"  },
      { nombre: "Terminal Terrestre Cusco", dir: "Av. Velasco Astete s/n, Cusco",        horario: "Abierto 24 horas", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Ica",
    imagen: "/assets/img/rutas/ica.jpg",
    emoji: "🏜️",
    color: "#8AA6A3",
    region: "Ica",
    duracion: "~8h",
    distancia: "~390 km",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 40–55" },
      { hora: "20:00", tipo: "Nocturno", precio: "S/ 45–60" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari", dir: "Av. Pérez de Cuéllar 2263, Ayacucho", horario: "Abierto 24 horas",   tipo: "ORIGEN"  },
      { nombre: "Terminal Ica",           dir: "Prolongación Lambayeque 180, Ica",    horario: "6:00 AM – 10:00 PM", tipo: "DESTINO" },
    ],
  },
  {
    nombre: "Andahuaylas",
    imagen: "/assets/img/rutas/andahuaylas.jpg",
    emoji: "⛰️",
    color: "#10403B",
    region: "Apurímac",
    duracion: "~5h",
    distancia: "~195 km",
    horarios: [
      { hora: "06:00", tipo: "Diurno",   precio: "S/ 25–35" },
      { hora: "10:00", tipo: "Diurno",   precio: "S/ 25–35" },
      { hora: "14:00", tipo: "Tarde",    precio: "S/ 30–40" },
      { hora: "18:00", tipo: "Nocturno", precio: "S/ 30–40" },
    ],
    terminales: [
      { nombre: "Terrapuerto Plaza Wari", dir: "Av. Pérez de Cuéllar 2263, Ayacucho", horario: "Abierto 24 horas",  tipo: "ORIGEN"  },
      { nombre: "Terminal Andahuaylas",   dir: "Av. Martinelli s/n, Andahuaylas",      horario: "7:00 AM – 9:00 PM", tipo: "DESTINO" },
    ],
  },
];

// ── LOGO SVG ──────────────────────────────────────────
function LogoSVG({ width = 52, height = 52 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="82" rx="46" ry="12" fill="#10403B" />
      <polygon points="50,10 20,70 80,70" fill="#1a7a6e" />
      <polygon points="50,10 35,50 65,50" fill="#0f6b60" />
      <polygon points="28,40 8,75 48,75" fill="#1d8a7a" />
      <polygon points="28,40 18,62 38,62" fill="#155e54" />
      <polygon points="72,40 52,75 92,75" fill="#1d8a7a" />
      <polygon points="72,40 62,62 82,62" fill="#155e54" />
      <polygon points="44,24 50,10 56,24 50,20" fill="#edf0f0" />
      <polygon points="46,32 50,20 54,32 50,28" fill="#d0d8d6" />
      <ellipse cx="58" cy="58" rx="7" ry="4" fill="#4da6d0" opacity="0.9" />
      <circle cx="50" cy="28" r="9" fill="#F5C518" />
      <circle cx="50" cy="28" r="7" fill="#FFD700" />
      <line x1="50" y1="17" x2="50" y2="15" stroke="#F5C518" strokeWidth="2" />
      <line x1="50" y1="39" x2="50" y2="41" stroke="#F5C518" strokeWidth="2" />
      <line x1="39" y1="28" x2="37" y2="28" stroke="#F5C518" strokeWidth="2" />
      <line x1="61" y1="28" x2="63" y2="28" stroke="#F5C518" strokeWidth="2" />
      <line x1="42" y1="20" x2="40.5" y2="18.5" stroke="#F5C518" strokeWidth="2" />
      <line x1="58" y1="20" x2="59.5" y2="18.5" stroke="#F5C518" strokeWidth="2" />
      <line x1="42" y1="36" x2="40.5" y2="37.5" stroke="#F5C518" strokeWidth="2" />
      <line x1="58" y1="36" x2="59.5" y2="37.5" stroke="#F5C518" strokeWidth="2" />
    </svg>
  );
}

// ── MODAL HORARIOS ────────────────────────────────────
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
          <button className="btn-reservar" onClick={onClose}>
            Reservar pasaje
          </button>
          <p className="modal-nota">
            * Horarios y precios referenciales. Confirmar disponibilidad en terminal.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────
export default function App() {
  const [origen, setOrigen] = useState("Ayacucho");
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
  const [modalDestino, setModalDestino] = useState(null);

  const destinosFiltrados = destinoSeleccionado
    ? DESTINOS.filter((d) =>
        d.nombre.toLowerCase().includes(destinoSeleccionado.toLowerCase())
      )
    : DESTINOS;

  return (
    <>
      {/* ── NAVBAR ── */}
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
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="inicio">
        <div className="hero-bg-pattern" />
        <svg className="hero-mountain-svg" viewBox="0 0 1440 140" preserveAspectRatio="none">
          <polygon
            points="0,140 0,100 200,20 400,80 600,10 800,70 1000,15 1200,60 1440,30 1440,140"
            fill="white"
          />
        </svg>
        <div className="hero-content">
          <h1>
            Viaja con<br />
            <em>Intiwatana</em>
          </h1>
          <p>Conectando los Andes con seguridad y puntualidad</p>
          <div className="search-box">
            <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
              <option>Ayacucho</option>
              <option>Abancay</option>
              <option>Arequipa</option>
            </select>
            <div className="search-divider" />
            <select
              value={destinoSeleccionado || ""}
              onChange={(e) => setDestinoSeleccionado(e.target.value || null)}
            >
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
        <div className="stat">
          <span className="stat-num">15+</span>
          <span className="stat-label">Destinos</span>
        </div>
        <div className="stat">
          <span className="stat-num">20+</span>
          <span className="stat-label">Años de experiencia</span>
        </div>
        <div className="stat">
          <span className="stat-num">50K+</span>
          <span className="stat-label">Pasajeros / año</span>
        </div>
        <div className="stat">
          <span className="stat-num">24/7</span>
          <span className="stat-label">Atención</span>
        </div>
      </div>

      {/* ── DESTINOS ── */}
      <div className="section" id="destinos">
        <h2 className="section-title">Destinos</h2>
        <p className="section-subtitle">
          Elige tu destino y consulta los horarios disponibles
        </p>
        <div className="destinos-grid">
          {destinosFiltrados.map((d) => (
            <div className="destino-card" key={d.nombre}>

              {/* 👇 IMAGEN REEMPLAZA AL PLACEHOLDER */}
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
                <button
                  className="btn-terminal"
                  onClick={() => setModalDestino(d)}
                >
                  Ver Terminales
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

      {/* ── FOOTER ── */}
      <footer id="contacto">
        <div className="footer-logo">
          <LogoSVG width={36} height={36} />
          <strong>INTIWATANA S.R.L.</strong>
        </div>
        <p>Empresa de Transportes · Ayacucho, Perú · © 2026 Todos los derechos reservados</p>
        <p className="footer-contact">
          Terminal: Jr. Lima 350, Ayacucho &nbsp;|&nbsp; Tel: (066) 312-000
        </p>
      </footer>

      {/* ── MODAL ── */}
      <ModalHorarios
        destino={modalDestino}
        onClose={() => setModalDestino(null)}
      />
    </>
  );
}