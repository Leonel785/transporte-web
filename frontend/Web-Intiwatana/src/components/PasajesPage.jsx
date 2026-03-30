import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ── Helpers ────────────────────────────────────────────
function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Mapa de asientos ───────────────────────────────────
function MapaAsientos({ asientos, seleccionado, onSeleccionar }) {
  if (!asientos.length) return (
    <div style={{ textAlign: "center", padding: "2rem", color: "var(--verde-medio)", fontSize: 14 }}>
      No hay información de asientos disponible.
    </div>
  );

  const maxFila = Math.max(...asientos.map((a) => a.fila || 1));

  return (
    <div className="mapa-asientos">
      <div className="mapa-leyenda">
        <span className="asiento-demo" style={{ color: "var(--verde)" }}>□ Disponible</span>
        <span className="asiento-demo" style={{ color: "var(--gris)" }}>□ Ocupado</span>
        <span className="asiento-demo" style={{ color: "var(--amarillo)" }}>□ Tu asiento</span>
      </div>
      <div className="mapa-bus">
        <div className="bus-frente">🚌 Frente del bus</div>
        {Array.from({ length: maxFila }, (_, fi) => {
          const fila = fi + 1;
          const asientosFila = asientos.filter((a) => a.fila === fila);
          return (
            <div className="bus-fila" key={fila}>
              {[1, 2, null, 3, 4].map((col, idx) => {
                if (col === null) return <div key="pasillo" className="bus-pasillo" />;
                const a = asientosFila.find((x) => x.columna === col);
                if (!a) return <div key={idx} className="asiento vacio" />;
                const ocupado = a.estado !== "DISPONIBLE";
                const esSelec = seleccionado?.id === a.id;
                return (
                  <button
                    key={a.id}
                    className={`asiento ${ocupado ? "ocupado" : "disponible"} ${esSelec ? "seleccionado" : ""}`}
                    disabled={ocupado}
                    onClick={() => onSeleccionar(esSelec ? null : a)}
                    title={`Asiento ${a.numeroAsiento} — ${a.tipo || "Estándar"}`}
                  >
                    {a.numeroAsiento}
                  </button>
                );
              })}
              <span className="bus-fila-num">{fila}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal de pago completo ─────────────────────────────
function ModalPago({ viaje, asiento, onConfirmar, onCerrar, comprando }) {
  const [paso, setPaso]             = useState(1);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [datosExtra, setDatosExtra] = useState({ numero: "", nombre: "", operacion: "" });

  if (!viaje || !asiento) return null;

  const precio = viaje.precioAdulto || viaje.precioOficial || 0;

  const metodos = [
    { value: "EFECTIVO",        label: "💵 Efectivo en terminal",       desc: "Paga al momento de abordar" },
    { value: "YAPE",            label: "📱 Yape",                       desc: "Pago móvil inmediato" },
    { value: "PLIN",            label: "📱 Plin",                       desc: "Pago móvil inmediato" },
    { value: "TARJETA_CREDITO", label: "💳 Tarjeta de crédito",         desc: "Visa, Mastercard" },
    { value: "TARJETA_DEBITO",  label: "💳 Tarjeta de débito",          desc: "Débito automático" },
    { value: "TRANSFERENCIA",   label: "🏦 Transferencia bancaria",     desc: "BCP, Interbank, BBVA" },
  ];

  const necesitaDatos = ["YAPE","PLIN","TARJETA_CREDITO","TARJETA_DEBITO","TRANSFERENCIA"].includes(metodoPago);

  const handleConfirmar = () => {
    if (necesitaDatos && !datosExtra.operacion) return;
    onConfirmar(metodoPago, datosExtra);
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal pago-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge">🎫</div>
          <div>
            <div className="modal-title">
              {paso === 1 ? "Resumen de compra" : "Método de pago"}
            </div>
            <div className="modal-subtitle">
              {viaje.ruta?.origen?.ciudad} → {viaje.ruta?.destino?.ciudad}
            </div>
          </div>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>

        <div className="modal-body">
          {/* Indicador de pasos */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {["Resumen", "Pago"].map((label, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  height: 4, borderRadius: 2, marginBottom: 4,
                  background: paso > i ? "var(--amarillo)" : paso === i + 1 ? "var(--amarillo)" : "rgba(138,166,163,0.3)",
                }} />
                <span style={{ fontSize: 11, color: paso === i + 1 ? "var(--amarillo)" : "var(--verde-medio)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {paso === 1 && (
            <>
              {/* Tarjeta resumen */}
              <div style={{
                background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)",
                borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.2rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "white", fontWeight: 700 }}>
                      {viaje.ruta?.origen?.ciudad} → {viaje.ruta?.destino?.ciudad}
                    </div>
                    <div style={{ color: "var(--verde-medio)", fontSize: 12, marginTop: 2 }}>
                      {fmtFecha(viaje.fechaHoraSalida)}
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(245,197,24,0.15)", color: "var(--amarillo)",
                    borderRadius: 50, padding: "4px 14px", fontWeight: 800, fontSize: 18,
                  }}>
                    S/ {precio}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["💺 Asiento", `N° ${asiento.numeroAsiento} — ${asiento.tipo || "Estándar"}`],
                    ["🚌 Bus", `${viaje.bus?.placa || "—"} · ${viaje.bus?.tipoBus || viaje.bus?.tipo || ""}`],
                    ["⏱ Duración", viaje.ruta?.duracionHorasEstimada ? `${viaje.ruta.duracionHorasEstimada}h` : "—"],
                    ["📍 Terminal", viaje.ruta?.origen?.nombre || "Terminal principal"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 13 }}>
                      <span style={{ color: "var(--verde-medio)", display: "block", fontSize: 11 }}>{k}</span>
                      <span style={{ color: "white", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderTop: "1px solid rgba(138,166,163,0.2)", paddingTop: 12, marginBottom: 16,
              }}>
                <span style={{ color: "var(--verde-medio)", fontSize: 14 }}>Total a pagar</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--amarillo)" }}>
                  S/ {precio}
                </span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={onCerrar} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-reservar" style={{ flex: 2 }} onClick={() => setPaso(2)}>
                  Continuar al pago →
                </button>
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <p style={{ color: "var(--verde-medio)", fontSize: 13, marginBottom: 14 }}>
                Selecciona cómo deseas pagar tu pasaje de <strong style={{ color: "white" }}>S/ {precio}</strong>
              </p>

              {/* Métodos de pago */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {metodos.map((m) => (
                  <label key={m.value} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: metodoPago === m.value ? "rgba(18,115,105,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${metodoPago === m.value ? "var(--verde)" : "rgba(138,166,163,0.2)"}`,
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                    transition: "all 0.18s",
                  }}>
                    <input
                      type="radio" name="metodo" value={m.value}
                      checked={metodoPago === m.value}
                      onChange={() => setMetodoPago(m.value)}
                      style={{ accentColor: "var(--verde)" }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: "var(--verde-medio)" }}>{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Datos adicionales según método */}
              {metodoPago === "EFECTIVO" && (
                <div style={{
                  background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13,
                  color: "var(--amarillo)",
                }}>
                  💡 Presenta tu código de reserva en el terminal para pagar y recoger tu boleto físico.
                </div>
              )}

              {(metodoPago === "YAPE" || metodoPago === "PLIN") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    background: "rgba(18,115,105,0.1)", borderRadius: 8,
                    padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)",
                  }}>
                    📱 Envía <strong style={{ color: "var(--amarillo)" }}>S/ {precio}</strong> al número{" "}
                    <strong style={{ color: "white" }}>999-888-777</strong> (INTIWATANA S.R.L.)
                  </div>
                  <div className="auth-field">
                    <label>N° de operación *</label>
                    <input
                      placeholder="Ej: 123456789"
                      value={datosExtra.operacion}
                      onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", width: "100%", fontSize: 14, fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              )}

              {(metodoPago === "TARJETA_CREDITO" || metodoPago === "TARJETA_DEBITO") && (
                <div style={{ marginBottom: 14 }}>
                  <div className="auth-field">
                    <label>Nombre en la tarjeta *</label>
                    <input
                      placeholder="JUAN PEREZ"
                      value={datosExtra.nombre}
                      onChange={(e) => setDatosExtra(p => ({ ...p, nombre: e.target.value }))}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", width: "100%", fontSize: 14, fontFamily: "inherit" }}
                    />
                  </div>
                  <div className="auth-field">
                    <label>N° de autorización *</label>
                    <input
                      placeholder="Código de 6 dígitos del banco"
                      value={datosExtra.operacion}
                      onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", width: "100%", fontSize: 14, fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              )}

              {metodoPago === "TRANSFERENCIA" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    background: "rgba(18,115,105,0.1)", borderRadius: 8,
                    padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)",
                  }}>
                    🏦 Cuenta BCP: <strong style={{ color: "white" }}>191-123456789-0-12</strong><br />
                    A nombre de: <strong style={{ color: "white" }}>INTIWATANA S.R.L.</strong><br />
                    Monto: <strong style={{ color: "var(--amarillo)" }}>S/ {precio}</strong>
                  </div>
                  <div className="auth-field">
                    <label>N° de operación *</label>
                    <input
                      placeholder="Ej: 1234567890"
                      value={datosExtra.operacion}
                      onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", width: "100%", fontSize: 14, fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={() => setPaso(1)} style={{ flex: 1 }}>
                  ← Atrás
                </button>
                <button
                  className="btn-reservar"
                  style={{
                    flex: 2,
                    opacity: (necesitaDatos && !datosExtra.operacion) ? 0.6 : 1,
                  }}
                  disabled={comprando || (necesitaDatos && !datosExtra.operacion)}
                  onClick={handleConfirmar}
                >
                  {comprando ? "⏳ Procesando pago..." : "✓ Confirmar y pagar"}
                </button>
              </div>
              <p className="modal-nota">
                * Tu boleto con código QR se generará al instante y quedará guardado en tu cuenta.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal boleto confirmado ────────────────────────────
function ModalBoletoOk({ boleto, viaje, onCerrar }) {
  if (!boleto) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header" style={{ background: "rgba(18,115,105,0.3)" }}>
          <div className="modal-badge" style={{ fontSize: 28 }}>✅</div>
          <div>
            <div className="modal-title">¡Pasaje reservado!</div>
            <div className="modal-subtitle">Tu boleto fue generado exitosamente</div>
          </div>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: "center" }}>
          {/* Animación de éxito */}
          <div style={{
            width: 70, height: 70, borderRadius: "50%",
            background: "rgba(18,115,105,0.2)", border: "3px solid var(--verde)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 1rem",
            animation: "pulse 1s ease",
          }}>
            🎫
          </div>

          <p style={{ color: "var(--verde-medio)", marginBottom: "0.5rem", fontSize: 13 }}>
            Número de boleto
          </p>
          <div style={{
            fontFamily: "monospace", fontSize: "1.3rem", fontWeight: 700,
            color: "var(--amarillo)", background: "rgba(245,197,24,0.1)",
            border: "1px solid rgba(245,197,24,0.3)", borderRadius: 10,
            padding: "0.7rem 1.2rem", marginBottom: "1.2rem",
          }}>
            {boleto.numeroBoleto}
          </div>

          {boleto.qrImagenUrl && (
            <img
              src={boleto.qrImagenUrl}
              alt="QR Boleto"
              style={{ width: 150, height: 150, borderRadius: 10, margin: "0 auto 1rem", border: "3px solid rgba(18,115,105,0.3)" }}
            />
          )}

          <div className="track-info-grid" style={{ textAlign: "left", marginBottom: "1.2rem" }}>
            {[
              ["Ruta", `${viaje?.ruta?.origen?.ciudad || "—"} → ${viaje?.ruta?.destino?.ciudad || "—"}`],
              ["Salida", fmtFecha(viaje?.fechaHoraSalida)],
              ["Asiento", `N° ${boleto.asiento?.numeroAsiento || "—"}`],
              ["Precio pagado", `S/ ${boleto.precioPagado || "—"}`],
            ].map(([k, v]) => (
              <div className="track-info-item" key={k}>
                <span className="track-info-label">{k}</span>
                <span className="track-info-value">{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(245,197,24,0.08)", borderRadius: 8, padding: "10px 14px", marginBottom: "1rem", fontSize: 12, color: "var(--amarillo)" }}>
            💡 Guarda este número. Puedes verlo en <strong>Mi cuenta → Mis viajes</strong> en cualquier momento.
          </div>

          <button className="btn-reservar" onClick={onCerrar}>
            Ver mis viajes →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Banner de bienvenida tras registro ─────────────────
function BannerBienvenida({ username, onClose }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(18,115,105,0.95), rgba(16,64,59,0.98))",
      border: "1px solid rgba(245,197,24,0.4)", borderRadius: 14,
      padding: "1.2rem 1.5rem", marginBottom: "1.5rem",
      display: "flex", alignItems: "center", gap: 16,
      animation: "slideDown 0.4s ease",
    }}>
      <div style={{ fontSize: 36 }}>🎉</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "white", fontSize: 16, marginBottom: 3 }}>
          ¡Bienvenido, {username}!
        </div>
        <div style={{ color: "var(--verde-medio)", fontSize: 13 }}>
          Tu cuenta fue creada exitosamente. Ahora puedes buscar y reservar tus pasajes.
        </div>
      </div>
      <button onClick={onClose} style={{
        background: "transparent", border: "none", color: "var(--verde-medio)",
        cursor: "pointer", fontSize: 18, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────
export default function PasajesPage() {
  const { session } = useAuth();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const recienRegistrado = searchParams.get("recienRegistrado") === "true";

  const [showBienvenida, setShowBienvenida] = useState(recienRegistrado);
  const [sucursales,  setSucursales]  = useState([]);
  const [origenId,    setOrigenId]    = useState("");
  const [destinoId,   setDestinoId]   = useState("");
  const [viajes,      setViajes]      = useState([]);
  const [buscando,    setBuscando]    = useState(false);
  const [buscado,     setBuscado]     = useState(false);

  const [viajeSelec,  setViajeSelec]  = useState(null);
  const [asientos,    setAsientos]    = useState([]);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);
  const [asientoSel,  setAsientoSel]  = useState(null);

  const [modalPago,   setModalPago]   = useState(false);
  const [comprando,   setComprando]   = useState(false);
  const [boletoOk,    setBoletoOk]    = useState(null);
  const [error,       setError]       = useState("");

  const headers = session
    ? { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }
    : { "Content-Type": "application/json" };

  // Cargar sucursales
  useEffect(() => {
    fetch("/api/v1/sucursales", { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSucursales(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Buscar viajes
  const buscar = async (e) => {
    e.preventDefault();
    if (!origenId || !destinoId) { setError("Selecciona origen y destino"); return; }
    if (origenId === destinoId) { setError("El origen y destino no pueden ser iguales"); return; }
    setError("");
    setBuscando(true);
    setViajes([]);
    setViajeSelec(null);
    setAsientos([]);
    setAsientoSel(null);
    try {
      const params = new URLSearchParams({
        origenId, destinoId,
        page: 0, size: 20,
      });
      const res = await fetch(`/api/v1/viajes/disponibles?${params}`, { headers });
      const data = await res.json();
      setViajes(data.content || data || []);
      setBuscado(true);
    } catch { setError("Error al buscar viajes"); }
    finally { setBuscando(false); }
  };

  // Cargar asientos
  const seleccionarViaje = async (viaje) => {
    setViajeSelec(viaje);
    setAsientoSel(null);
    setCargandoAsientos(true);
    try {
      const res = await fetch(`/api/v1/viajes/${viaje.id}/asientos`, { headers });
      const data = await res.json();
      setAsientos(Array.isArray(data) ? data : []);
    } catch { setAsientos([]); }
    finally { setCargandoAsientos(false); }
    setTimeout(() => document.getElementById("mapa-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Confirmar compra
  const confirmarCompra = async (metodoPago, datosExtra) => {
    if (!session) {
      navigate("/login");
      return;
    }
    setComprando(true);
    setError("");
    try {
      const body = {
        viajeId:    viajeSelec.id,
        asientoId:  asientoSel.id,
        clienteId:  0,
        metodoPago,
        referenciaPago: datosExtra.operacion || null,
        observaciones: `Pago: ${metodoPago}${datosExtra.nombre ? ` — ${datosExtra.nombre}` : ""}`,
      };

      const res = await fetch("/api/v1/boletos/comprar", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.mensaje || d.message || "Error al procesar");
      }

      const boleto = await res.json();
      setBoletoOk(boleto);
      setModalPago(false);
      setAsientos(prev => prev.map(a => a.id === asientoSel.id ? { ...a, estado: "VENDIDO" } : a));
      setAsientoSel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setComprando(false);
    }
  };

  const cerrarBoletoOk = () => {
    setBoletoOk(null);
    navigate("/cliente");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--fondo)" }}>

      {/* Navbar */}
      <nav className="nav">
        <div className="nav-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <LogoSVG width={44} height={44} />
          <div className="nav-brand">
            Emp. de Transportes
            <span>INTIWATANA S.R.L.</span>
          </div>
        </div>
        <ul className="nav-links">
          <li><a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Inicio</a></li>
          <li><a onClick={() => navigate("/pasajes")} style={{ cursor: "pointer", color: "var(--amarillo)" }}>🎫 Comprar pasaje</a></li>
        </ul>
        {session ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn-admin-nav" onClick={() => navigate("/cliente")}>
              👤 {session.username}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-admin-nav" onClick={() => navigate("/login")}>Iniciar sesión</button>
            <button className="btn-admin-nav btn-registrarse" onClick={() => navigate("/registrar")}>Registrarse</button>
          </div>
        )}
      </nav>

      {/* Hero búsqueda */}
      <div style={{
        background: "linear-gradient(135deg, var(--verde-oscuro) 0%, var(--verde) 100%)",
        padding: "3rem 2rem 4rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "2.2rem",
          color: "white", marginBottom: "0.5rem", position: "relative", zIndex: 1,
        }}>
          Busca tu viaje
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "2rem", position: "relative", zIndex: 1 }}>
          Selecciona tu origen y destino para ver los viajes disponibles
        </p>

        <form onSubmit={buscar} style={{
          background: "white", borderRadius: 60, padding: "0.5rem 0.5rem 0.5rem 1.2rem",
          display: "inline-flex", gap: "0.8rem", alignItems: "center",
          maxWidth: 620, width: "100%",
          boxShadow: "0 8px 32px rgba(16,64,59,0.4)",
          position: "relative", zIndex: 1,
        }}>
          <span style={{ color: "var(--verde)", fontSize: 18 }}>📍</span>
          <select
            value={origenId}
            onChange={(e) => setOrigenId(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14,
              color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0" }}
            required
          >
            <option value="">Origen</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>
            ))}
          </select>
          <div style={{ width: 1, height: 28, background: "#ddd" }} />
          <span style={{ color: "var(--verde)", fontSize: 18 }}>🏁</span>
          <select
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14,
              color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0" }}
            required
          >
            <option value="">Destino</option>
            {sucursales.filter((s) => s.id !== Number(origenId)).map((s) => (
              <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>
            ))}
          </select>
          <button type="submit" className="btn-buscar" disabled={buscando}
            style={{ borderRadius: 50, padding: "0.7rem 1.5rem", flexShrink: 0 }}>
            {buscando ? "..." : "Buscar"}
          </button>
        </form>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {showBienvenida && session && (
          <BannerBienvenida
            username={session.username}
            onClose={() => setShowBienvenida(false)}
          />
        )}

        {error && (
          <div className="auth-error" style={{ marginBottom: "1rem" }}>⚠️ {error}</div>
        )}

        {buscado && !buscando && (
          <>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              color: "var(--blanco)", marginBottom: "1.2rem", fontSize: "1.4rem",
            }}>
              {viajes.length === 0
                ? "😔 No hay viajes disponibles"
                : `🚌 ${viajes.length} viaje(s) disponible(s)`}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {viajes.map((v) => (
                <div
                  key={v.id}
                  className="cli-card"
                  style={{
                    cursor: "pointer",
                    border: viajeSelec?.id === v.id ? "2px solid var(--amarillo)" : "1px solid rgba(18,115,105,0.12)",
                    transform: viajeSelec?.id === v.id ? "translateX(4px)" : "none",
                  }}
                  onClick={() => seleccionarViaje(v)}
                >
                  <div className="cli-card-top">
                    <div className="cli-card-ruta">
                      <span className="cli-card-ciudad">{v.ruta?.origen?.ciudad}</span>
                      <span className="cli-card-arrow">→</span>
                      <span className="cli-card-ciudad">{v.ruta?.destino?.ciudad}</span>
                    </div>
                    <span style={{
                      background: "rgba(245,197,24,0.15)", color: "#b8860b",
                      borderRadius: 50, padding: "3px 14px", fontSize: 15, fontWeight: 800,
                    }}>
                      S/ {v.precioAdulto}
                    </span>
                  </div>
                  <div className="cli-card-body">
                    <div className="cli-card-row">
                      <span>📅 Salida</span>
                      <span>{fmtFecha(v.fechaHoraSalida)}</span>
                    </div>
                    <div className="cli-card-row">
                      <span>🚌 Bus</span>
                      <span>{v.bus?.placa} — {v.bus?.tipo}</span>
                    </div>
                    <div className="cli-card-row">
                      <span>💺 Asientos libres</span>
                      <span style={{ color: (v.asientosDisponibles > 5) ? "var(--verde)" : "#e67e22", fontWeight: 700 }}>
                        {v.asientosDisponibles} / {v.totalAsientos}
                      </span>
                    </div>
                  </div>
                  <button className="cli-track-btn" onClick={(e) => { e.stopPropagation(); seleccionarViaje(v); }}>
                    {viajeSelec?.id === v.id ? "✓ Seleccionado → elige asiento ↓" : "Seleccionar →"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {viajeSelec && (
          <div id="mapa-section" style={{ marginTop: "2.5rem" }}>
            <button onClick={() => { setViajeSelec(null); setAsientos([]); setAsientoSel(null); }}
              style={{ background: "none", border: "none", color: "var(--verde)", cursor: "pointer", fontWeight: 700, marginBottom: "1rem", fontSize: 14, fontFamily: "inherit" }}>
              ← Volver
            </button>

            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--blanco)", fontSize: "1.4rem", marginBottom: "1rem" }}>
              💺 Elige tu asiento
            </h2>

            {cargandoAsientos ? (
              <div className="cli-loading">Cargando mapa...</div>
            ) : (
              <>
                <MapaAsientos asientos={asientos} seleccionado={asientoSel} onSeleccionar={setAsientoSel} />
                {asientoSel && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(18,115,105,0.2), rgba(16,64,59,0.3))",
                    border: "1.5px solid var(--verde)", borderRadius: 14, padding: "1.2rem 1.5rem",
                    marginTop: "1.5rem", display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
                    animation: "slideUp 0.3s ease",
                  }}>
                    <div>
                      <p style={{ color: "var(--verde-medio)", fontSize: 12, marginBottom: 4 }}>Asiento seleccionado</p>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 18 }}>N° {asientoSel.numeroAsiento}</p>
                      <p style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 20, marginTop: 2 }}>S/ {viajeSelec.precioAdulto}</p>
                    </div>
                    <button className="btn-reservar" style={{ minWidth: 220 }}
                      onClick={() => {
                        if (!session) navigate("/login");
                        else setModalPago(true);
                      }}>
                      {session ? "🎫 Pagar y reservar →" : "🔐 Inicia sesión →"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalPago && <ModalPago viaje={viajeSelec} asiento={asientoSel} onConfirmar={confirmarCompra} onCerrar={() => setModalPago(false)} comprando={comprando} />}
      {boletoOk && <ModalBoletoOk boleto={boletoOk} viaje={viajeSelec} onCerrar={cerrarBoletoOk} />}

      <style>{`
        @keyframes slideDown { from{transform:translateY(-10px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}