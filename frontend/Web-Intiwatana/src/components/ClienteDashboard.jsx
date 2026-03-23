import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ── Configuración de estados según CHECK del schema ───
const ESTADO_BOLETO = {
  ACTIVO:      { label: "Activo",      cls: "badge-confirmado", icon: "🎫" },
  USADO:       { label: "Usado",       cls: "badge-entregado",  icon: "✅" },
  CANCELADO:   { label: "Cancelado",   cls: "badge-cancelado",  icon: "❌" },
  REEMBOLSADO: { label: "Reembolsado", cls: "badge-devuelto",   icon: "↩️" },
};

const ESTADO_ENCOMIENDA = {
  RECIBIDO:      { label: "Recibido",       cls: "badge-recibido",  icon: "📦" },
  EN_ALMACEN:    { label: "En almacén",     cls: "badge-pendiente", icon: "🏭" },
  EN_TRANSITO:   { label: "En tránsito",    cls: "badge-transito",  icon: "🚌" },
  EN_DESTINO:    { label: "En destino",     cls: "badge-destino",   icon: "📍" },
  LISTO_ENTREGA: { label: "Listo entrega",  cls: "badge-transito",  icon: "📬" },
  ENTREGADO:     { label: "Entregado",      cls: "badge-entregado", icon: "✅" },
  DEVUELTO:      { label: "Devuelto",       cls: "badge-devuelto",  icon: "↩️" },
  PERDIDO:       { label: "Perdido",        cls: "badge-cancelado", icon: "⚠️" },
};

const ESTADO_VIAJE = {
  PROGRAMADO: { label: "Programado", cls: "badge-pendiente", icon: "📅" },
  EN_CURSO:   { label: "En curso",   cls: "badge-transito",  icon: "🚌" },
  FINALIZADO: { label: "Finalizado", cls: "badge-entregado", icon: "✅" },
  CANCELADO:  { label: "Cancelado",  cls: "badge-cancelado", icon: "❌" },
};

function EstadoBadge({ estado, mapa }) {
  const cfg = (mapa && mapa[estado]) || { label: estado || "—", cls: "badge-pendiente", icon: "•" };
  return <span className={`estado-badge ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>;
}

function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Modal de seguimiento ───────────────────────────────
function TrackingModal({ encomienda, movimientos, loadingMov, onClose }) {
  if (!encomienda) return null;

  // Pasos según los CHECK del schema: RECIBIDO → EN_ALMACEN → EN_TRANSITO → EN_DESTINO → LISTO_ENTREGA → ENTREGADO
  const PASOS = ["RECIBIDO", "EN_ALMACEN", "EN_TRANSITO", "EN_DESTINO", "LISTO_ENTREGA", "ENTREGADO"];
  const idxActual = PASOS.indexOf(encomienda.estado);

  // Extraer campos usando snake_case (respuesta de la vista) o camelCase (DTO Java)
  const numGuia  = encomienda.numero_guia       || encomienda.numeroGuia;
  const desc     = encomienda.descripcion_contenido || encomienda.descripcionContenido;
  const pesoKg   = encomienda.peso_kg           || encomienda.pesoKg;
  const cOrigen  = encomienda.ciudad_origen     || encomienda.sucursalOrigen?.ciudad;
  const cDestino = encomienda.ciudad_destino    || encomienda.sucursalDestino?.ciudad;
  const sOrigen  = encomienda.sucursal_origen   || encomienda.sucursalOrigen?.nombre;
  const sDestino = encomienda.sucursal_destino  || encomienda.sucursalDestino?.nombre;
  const destNom  = [
    encomienda.destinatario_nombres  || encomienda.destinatario?.nombres,
    encomienda.destinatario_apellidos || encomienda.destinatario?.apellidos,
  ].filter(Boolean).join(" ");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cli-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge">📦</div>
          <div>
            <div className="modal-title">Guía #{numGuia}</div>
            <div className="modal-subtitle">{desc} · {pesoKg} kg</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <EstadoBadge estado={encomienda.estado} mapa={ESTADO_ENCOMIENDA} />
          </div>

          {/* Barra de progreso */}
          <div className="track-progress">
            {PASOS.map((paso, i) => {
              const done   = i <= idxActual && idxActual >= 0;
              const actual = i === idxActual;
              const cfg    = ESTADO_ENCOMIENDA[paso] || {};
              return (
                <div className={`track-step ${done ? "done" : ""} ${actual ? "current" : ""}`} key={paso}>
                  <div className="track-dot">{done ? cfg.icon : "○"}</div>
                  <div className="track-label">{cfg.label || paso}</div>
                  {i < PASOS.length - 1 && (
                    <div className={`track-line ${done && i < idxActual ? "done" : ""}`} />
                  )}
                </div>
              );
            })}
          </div>

          <hr className="modal-divider" />

          <div className="track-info-grid">
            <div className="track-info-item">
              <span className="track-info-label">Origen</span>
              <span className="track-info-value">{cOrigen || "—"}</span>
              {sOrigen && <span style={{ fontSize: "11px", color: "var(--gris-verde)" }}>{sOrigen}</span>}
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Destino</span>
              <span className="track-info-value">{cDestino || "—"}</span>
              {sDestino && <span style={{ fontSize: "11px", color: "var(--gris-verde)" }}>{sDestino}</span>}
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Destinatario</span>
              <span className="track-info-value">{destNom || "—"}</span>
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Costo</span>
              <span className="track-info-value">S/ {encomienda.costo || "—"}</span>
            </div>
          </div>

          <hr className="modal-divider" />
          <div className="modal-section-label">Historial de movimientos</div>

          {loadingMov ? (
            <div className="cli-loading" style={{ padding: "1rem" }}>Cargando...</div>
          ) : movimientos.length === 0 ? (
            <p style={{ color: "var(--gris-verde)", fontSize: "13px" }}>Sin movimientos registrados aún.</p>
          ) : (
            <div className="timeline">
              {movimientos.map((m, i) => {
                // Los campos vienen de v_movimientos_encomienda_detalle o del endpoint REST
                const estadoNuevo  = m.estado_nuevo  || m.estadoNuevo;
                const sucNombre    = m.sucursal_nombre || m.sucursalNombre || m.sucursalActual?.nombre;
                const fechaHora    = m.fecha_hora     || m.fechaHora;
                const obs          = m.observacion;
                const cfg = ESTADO_ENCOMIENDA[estadoNuevo] || {};
                return (
                  <div className={`timeline-item ${i === 0 ? "active" : ""}`} key={m.id || i}>
                    <div className="timeline-dot" />
                    <div className="timeline-text">
                      <strong>{cfg.icon} {cfg.label || estadoNuevo}</strong>
                      {sucNombre && <span> — {sucNombre}</span>}
                      <br />
                      <span style={{ fontSize: "11px", color: "var(--verde-medio)" }}>
                        {fmtFecha(fechaHora)}
                      </span>
                      {obs && (
                        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--verde-medio)" }}>
                          {obs}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel: Historial de boletos ────────────────────────
function HistorialBoletos({ boletos, loading }) {
  if (loading) return <div className="cli-loading">Cargando historial de viajes...</div>;
  if (!boletos.length) return (
    <div className="cli-empty">
      <span>🎫</span>
      <p>Aún no tienes boletos registrados</p>
      <small>Cuando compres un pasaje, aparecerá aquí</small>
    </div>
  );

  return (
    <div className="cli-cards">
      {boletos.map((b) => {
        // Soporta tanto snake_case (vista SQL) como camelCase (DTO Java)
        const numeroBoleto  = b.numero_boleto  || b.numeroBoleto;
        const precioPagado  = b.precio_pagado  || b.precioPagado;
        const estado        = b.estado;
        const ciudadOrigen  = b.ciudad_origen  || b.viaje?.ruta?.origen?.ciudad;
        const ciudadDestino = b.ciudad_destino || b.viaje?.ruta?.destino?.ciudad;
        const fechaSalida   = b.fecha_hora_salida || b.viaje?.fechaHoraSalida;
        const numAsiento    = b.numero_asiento || b.asiento?.numeroAsiento;
        const estadoViaje   = b.estado_viaje   || b.viaje?.estado;

        return (
          <div className="cli-card" key={b.id}>
            <div className="cli-card-top">
              <div className="cli-card-ruta">
                <span className="cli-card-ciudad">{ciudadOrigen || "—"}</span>
                <span className="cli-card-arrow">→</span>
                <span className="cli-card-ciudad">{ciudadDestino || "—"}</span>
              </div>
              <EstadoBadge estado={estado} mapa={ESTADO_BOLETO} />
            </div>
            <div className="cli-card-body">
              <div className="cli-card-row">
                <span>📅 Salida</span>
                <span>{fmtFecha(fechaSalida)}</span>
              </div>
              <div className="cli-card-row">
                <span>💺 Asiento</span>
                <span>{numAsiento || "—"}</span>
              </div>
              <div className="cli-card-row">
                <span>💵 Precio pagado</span>
                <span>S/ {precioPagado || "—"}</span>
              </div>
              <div className="cli-card-row">
                <span>🎫 N° Boleto</span>
                <span className="cli-mono">{numeroBoleto || "—"}</span>
              </div>
              {estadoViaje && (
                <div className="cli-card-row">
                  <span>🚌 Estado del viaje</span>
                  <EstadoBadge estado={estadoViaje} mapa={ESTADO_VIAJE} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Panel: Encomiendas ─────────────────────────────────
function PanelEncomiendas({ encomiendas, loading, headers }) {
  const [tracking,    setTracking]    = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMov,  setLoadingMov]  = useState(false);
  const [buscar,      setBuscar]      = useState("");

  const filtradas = encomiendas.filter((e) => {
    const guia = (e.numero_guia || e.numeroGuia || "").toLowerCase();
    const desc = (e.descripcion_contenido || e.descripcionContenido || "").toLowerCase();
    const q    = buscar.toLowerCase();
    return guia.includes(q) || desc.includes(q);
  });

  const verTracking = async (enc) => {
    setTracking(enc);
    setMovimientos([]);
    setLoadingMov(true);
    try {
      const res = await fetch(`/api/v1/encomiendas/${enc.id}/movimientos`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMovimientos(Array.isArray(data) ? data : []);
      }
    } catch { /* sin movimientos */ }
    finally { setLoadingMov(false); }
  };

  if (loading) return <div className="cli-loading">Cargando encomiendas...</div>;

  return (
    <>
      <div className="cli-search-row">
        <input
          className="cli-search"
          placeholder="Buscar por N° de guía o contenido..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </div>

      {!filtradas.length ? (
        <div className="cli-empty">
          <span>📦</span>
          <p>No se encontraron encomiendas</p>
          <small>Tus envíos como remitente aparecerán aquí</small>
        </div>
      ) : (
        <div className="cli-cards">
          {filtradas.map((enc) => {
            const guia     = enc.numero_guia       || enc.numeroGuia;
            const desc     = enc.descripcion_contenido || enc.descripcionContenido;
            const peso     = enc.peso_kg           || enc.pesoKg;
            const origen   = enc.ciudad_origen     || enc.sucursalOrigen?.ciudad;
            const destino  = enc.ciudad_destino    || enc.sucursalDestino?.ciudad;
            const destNom  = [
              enc.destinatario_nombres   || enc.destinatario?.nombres,
              enc.destinatario_apellidos || enc.destinatario?.apellidos,
            ].filter(Boolean).join(" ");
            const ultimoEst = enc.ultimo_estado    || enc.ultimoEstado;
            const ultimaAct = enc.ultima_actualizacion || enc.ultimaActualizacion;

            return (
              <div className="cli-card" key={enc.id}>
                <div className="cli-card-top">
                  <span className="cli-mono">{guia || "—"}</span>
                  <EstadoBadge estado={enc.estado} mapa={ESTADO_ENCOMIENDA} />
                </div>
                <div className="cli-card-body">
                  <div className="cli-card-row">
                    <span>📦 Contenido</span>
                    <span style={{ textAlign: "right", maxWidth: "55%" }}>{desc || "—"}</span>
                  </div>
                  <div className="cli-card-row">
                    <span>⚖️ Peso</span>
                    <span>{peso} kg</span>
                  </div>
                  <div className="cli-card-row">
                    <span>📍 Ruta</span>
                    <span>{origen || "—"} → {destino || "—"}</span>
                  </div>
                  <div className="cli-card-row">
                    <span>👤 Destinatario</span>
                    <span>{destNom || "—"}</span>
                  </div>
                  <div className="cli-card-row">
                    <span>💵 Costo</span>
                    <span>S/ {enc.costo || "—"}</span>
                  </div>
                  {ultimaAct && (
                    <div className="cli-card-row">
                      <span>🕐 Última actualización</span>
                      <span style={{ fontSize: "12px" }}>{fmtFecha(ultimaAct)}</span>
                    </div>
                  )}
                </div>
                <button className="cli-track-btn" onClick={() => verTracking(enc)}>
                  🔍 Ver seguimiento
                </button>
              </div>
            );
          })}
        </div>
      )}

      <TrackingModal
        encomienda={tracking}
        movimientos={movimientos}
        loadingMov={loadingMov}
        onClose={() => setTracking(null)}
      />
    </>
  );
}

// ── Dashboard Principal Cliente ────────────────────────
export default function ClienteDashboard() {
  const { session, logout } = useAuth();
  const [seccion,     setSeccion]     = useState("boletos");
  const [boletos,     setBoletos]     = useState([]);
  const [encomiendas, setEncomiendas] = useState([]);
  const [loadBoletos, setLoadBoletos] = useState(true);
  const [loadEncom,   setLoadEncom]   = useState(false);
  const [perfil,      setPerfil]      = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${session.token}`,
  };

  useEffect(() => {
    // Perfil del cliente (GET /api/v1/clientes/mi-perfil)
    fetch("/api/v1/clientes/mi-perfil", { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setPerfil(d))
      .catch(() => {});

    // Boletos (GET /api/v1/boletos/mis-boletos)
    fetch("/api/v1/boletos/mis-boletos", { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setBoletos(Array.isArray(d) ? d : []))
      .catch(() => setBoletos([]))
      .finally(() => setLoadBoletos(false));
  }, []);

  const cargarEncomiendas = () => {
    if (encomiendas.length) return;
    setLoadEncom(true);
    // GET /api/v1/encomiendas/mis-encomiendas
    fetch("/api/v1/encomiendas/mis-encomiendas", { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setEncomiendas(Array.isArray(d) ? d : []))
      .catch(() => setEncomiendas([]))
      .finally(() => setLoadEncom(false));
  };

  const cambiarSeccion = (s) => {
    setSeccion(s);
    if (s === "encomiendas") cargarEncomiendas();
  };

  const iniciales = session.username
    ? session.username.slice(0, 2).toUpperCase()
    : "CL";

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <LogoSVG width={44} height={44} />
          <div>
            <div className="sidebar-brand">INTIWATANA</div>
            <div className="sidebar-sub">Mi cuenta</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {[
            { key: "boletos",     label: "🎫 Mis viajes"   },
            { key: "encomiendas", label: "📦 Encomiendas"  },
            { key: "perfil",      label: "👤 Mi perfil"    },
          ].map(({ key, label }) => (
            <div
              key={key}
              className={`sidebar-item ${seccion === key ? "active" : ""}`}
              onClick={() => cambiarSeccion(key)}
            >
              {label}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{iniciales}</div>
          <div>
            <div className="sidebar-uname">{session.username}</div>
            <div className="sidebar-role">Cliente</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Cerrar sesión">⏻</button>
        </div>
      </aside>

      <main className="admin-main">
        {seccion === "boletos" && (
          <>
            <div className="admin-topbar">
              <div>
                <h1 className="admin-page-title">Mis viajes</h1>
                <p className="admin-page-sub">{boletos.length} boleto(s) en tu historial</p>
              </div>
            </div>
            <HistorialBoletos boletos={boletos} loading={loadBoletos} />
          </>
        )}

        {seccion === "encomiendas" && (
          <>
            <div className="admin-topbar">
              <div>
                <h1 className="admin-page-title">Mis encomiendas</h1>
                <p className="admin-page-sub">Seguimiento de tus envíos como remitente</p>
              </div>
            </div>
            <PanelEncomiendas
              encomiendas={encomiendas}
              loading={loadEncom}
              headers={headers}
            />
          </>
        )}

        {seccion === "perfil" && (
          <>
            <div className="admin-topbar">
              <div>
                <h1 className="admin-page-title">Mi perfil</h1>
                <p className="admin-page-sub">Información de tu cuenta</p>
              </div>
            </div>
            <div className="cli-perfil">
              <div className="cli-perfil-avatar">{iniciales}</div>
              <div className="cli-perfil-grid">
                {perfil ? (
                  <>
                    <div className="cli-perfil-item">
                      <span>Nombre completo</span>
                      <strong>
                        {[perfil.nombres, perfil.apellidos].filter(Boolean).join(" ") || "—"}
                      </strong>
                    </div>
                    <div className="cli-perfil-item">
                      <span>DNI / RUC</span>
                      <strong className="cli-mono">
                        {perfil.dniRuc || perfil.dni_ruc || "—"}
                      </strong>
                    </div>
                    <div className="cli-perfil-item">
                      <span>Correo</span>
                      <strong>{perfil.email || "—"}</strong>
                    </div>
                    <div className="cli-perfil-item">
                      <span>Teléfono</span>
                      <strong>{perfil.telefono || "—"}</strong>
                    </div>
                    <div className="cli-perfil-item">
                      <span>Usuario</span>
                      <strong>{session.username}</strong>
                    </div>
                    <div className="cli-perfil-item">
                      <span>Tipo</span>
                      <strong>
                        {perfil.tipoCliente || perfil.tipo_cliente || "PERSONA"}
                      </strong>
                    </div>
                  </>
                ) : (
                  <p style={{ color: "var(--gris-verde)", padding: "1rem 0" }}>
                    Cargando datos...
                  </p>
                )}
              </div>
              <button
                className="auth-btn"
                style={{ marginTop: "1.5rem", maxWidth: "200px" }}
                onClick={logout}
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
