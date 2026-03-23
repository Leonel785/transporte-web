import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  if (!asientos.length) return null;

  const maxFila = Math.max(...asientos.map((a) => a.fila || 1));

  return (
    <div className="mapa-asientos">
      <div className="mapa-leyenda">
        <span className="asiento-demo disponible">□ Disponible</span>
        <span className="asiento-demo ocupado">□ Ocupado</span>
        <span className="asiento-demo seleccionado">□ Tu asiento</span>
      </div>
      <div className="mapa-bus">
        <div className="bus-frente">🚌 Frente</div>
        {Array.from({ length: maxFila }, (_, fi) => {
          const fila = fi + 1;
          const asientosFila = asientos.filter((a) => a.fila === fila);
          return (
            <div className="bus-fila" key={fila}>
              {[1, 2, null, 3, 4].map((col, idx) => {
                if (col === null) return <div key="pasillo" className="bus-pasillo" />;
                const a = asientosFila.find((x) => x.columna === col);
                if (!a) return <div key={idx} className="asiento vacio" />;
                const ocupado   = a.estado !== "DISPONIBLE";
                const esSelec   = seleccionado?.id === a.id;
                return (
                  <button
                    key={a.id}
                    className={`asiento ${ocupado ? "ocupado" : "disponible"} ${esSelec ? "seleccionado" : ""}`}
                    disabled={ocupado}
                    onClick={() => onSeleccionar(esSelec ? null : a)}
                    title={`Asiento ${a.numeroAsiento} - ${a.tipo}`}
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

// ── Modal de confirmación de compra ───────────────────
function ModalCompra({ viaje, asiento, onConfirmar, onCerrar, comprando }) {
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");

  if (!viaje || !asiento) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge">🎫</div>
          <div>
            <div className="modal-title">Confirmar reserva</div>
            <div className="modal-subtitle">
              {viaje.ruta?.origen?.ciudad} → {viaje.ruta?.destino?.ciudad}
            </div>
          </div>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body">
          <div className="track-info-grid" style={{ marginBottom: "1.2rem" }}>
            <div className="track-info-item">
              <span className="track-info-label">Salida</span>
              <span className="track-info-value">{fmtFecha(viaje.fechaHoraSalida)}</span>
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Asiento</span>
              <span className="track-info-value">N° {asiento.numeroAsiento} ({asiento.tipo})</span>
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Precio</span>
              <span className="track-info-value" style={{ color: "var(--amarillo)", fontWeight: 700 }}>
                S/ {viaje.precioAdulto}
              </span>
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Bus</span>
              <span className="track-info-value">{viaje.bus?.placa} — {viaje.bus?.tipo}</span>
            </div>
          </div>

          <div className="auth-field">
            <label>Método de pago</label>
            <select
              className="auth-select"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            >
              <option value="EFECTIVO">💵 Efectivo</option>
              <option value="YAPE">📱 Yape</option>
              <option value="PLIN">📱 Plin</option>
              <option value="TARJETA_CREDITO">💳 Tarjeta de crédito</option>
              <option value="TARJETA_DEBITO">💳 Tarjeta de débito</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: "1.2rem" }}>
            <button className="btn-cancelar" onClick={onCerrar} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button
              className="btn-reservar"
              style={{ flex: 1 }}
              disabled={comprando}
              onClick={() => onConfirmar(metodoPago)}
            >
              {comprando ? "Procesando..." : "✓ Confirmar y pagar"}
            </button>
          </div>
          <p className="modal-nota">
            * Tu boleto se generará inmediatamente con código QR.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Modal boleto confirmado ────────────────────────────
function ModalBoletoOk({ boleto, onCerrar }) {
  if (!boleto) return null;
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: "rgba(18,115,105,0.3)" }}>
          <div className="modal-badge">✅</div>
          <div>
            <div className="modal-title">¡Pasaje reservado!</div>
            <div className="modal-subtitle">Tu boleto fue generado exitosamente</div>
          </div>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--verde-medio)", marginBottom: "1rem", fontSize: "14px" }}>
            Número de boleto
          </p>
          <div style={{
            fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 700,
            color: "var(--amarillo)", background: "rgba(245,197,24,0.1)",
            border: "1px solid rgba(245,197,24,0.3)", borderRadius: 10,
            padding: "0.8rem 1.2rem", marginBottom: "1.2rem",
          }}>
            {boleto.numeroBoleto}
          </div>
          {boleto.qrImagenUrl && (
            <img
              src={boleto.qrImagenUrl}
              alt="QR Boleto"
              style={{ width: 160, height: 160, borderRadius: 8, margin: "0 auto 1rem" }}
            />
          )}
          <div className="track-info-grid" style={{ textAlign: "left", marginBottom: "1rem" }}>
            <div className="track-info-item">
              <span className="track-info-label">Asiento</span>
              <span className="track-info-value">N° {boleto.asiento?.numeroAsiento}</span>
            </div>
            <div className="track-info-item">
              <span className="track-info-label">Precio pagado</span>
              <span className="track-info-value">S/ {boleto.precioPagado}</span>
            </div>
          </div>
          <button className="btn-reservar" onClick={onCerrar}>
            Ver mis viajes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────
export default function PasajesPage() {
  const { session } = useAuth();
  const navigate    = useNavigate();

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

  const [modalCompra, setModalCompra] = useState(false);
  const [comprando,   setComprando]   = useState(false);
  const [boletoOk,    setBoletoOk]    = useState(null);
  const [error,       setError]       = useState("");

  const headers = session
    ? { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }
    : { "Content-Type": "application/json" };

  // Cargar sucursales al montar
  useEffect(() => {
    fetch("/api/v1/sucursales", { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSucursales(Array.isArray(d) ? d : (d.content || [])))
      .catch(() => {});
  }, []);

  // Buscar viajes disponibles
  const buscar = async (e) => {
    e.preventDefault();
    if (!origenId || !destinoId) return;
    if (origenId === destinoId) { setError("El origen y destino no pueden ser iguales"); return; }
    setError("");
    setBuscando(true);
    setViajes([]);
    setViajeSelec(null);
    setAsientos([]);
    setAsientoSel(null);
    try {
      const url = `/api/v1/viajes/disponibles?origenId=${origenId}&destinoId=${destinoId}`;
      const res = await fetch(url);
      const data = await res.json();
      setViajes(data.content || data || []);
      setBuscado(true);
    } catch { setError("Error al buscar viajes"); }
    finally { setBuscando(false); }
  };

  // Seleccionar viaje → cargar asientos
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
    // Scroll al mapa
    setTimeout(() => document.getElementById("mapa-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Confirmar compra
  const confirmarCompra = async (metodoPago) => {
    if (!session) { navigate("/login"); return; }
    setComprando(true);
    setError("");
    try {
      const res = await fetch("/api/v1/boletos/comprar", {
        method: "POST",
        headers,
        body: JSON.stringify({
          viajeId:    viajeSelec.id,
          asientoId:  asientoSel.id,
          clienteId:  0, // ignorado por el backend — usa el JWT
          metodoPago,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.errores?.join(", ") || d.mensaje || "Error al procesar el pago");
      }
      const boleto = await res.json();
      setBoletoOk(boleto);
      setModalCompra(false);
      // Actualizar disponibilidad del asiento en el mapa
      setAsientos((prev) =>
        prev.map((a) => a.id === asientoSel.id ? { ...a, estado: "VENDIDO" } : a)
      );
      setAsientoSel(null);
    } catch (err) {
      setError(err.message);
      setModalCompra(false);
    } finally { setComprando(false); }
  };

  const cerrarBoletoOk = () => {
    setBoletoOk(null);
    if (session) navigate("/cliente");
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
          <li><a onClick={() => navigate("/pasajes")} style={{ cursor: "pointer", color: "var(--amarillo)" }}>
            Comprar pasaje
          </a></li>
        </ul>
        {session ? (
          <button className="btn-admin-nav" onClick={() => navigate("/cliente")}>
            👤 {session.username}
          </button>
        ) : (
          <button className="btn-admin-nav" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        )}
      </nav>

      {/* Hero búsqueda */}
      <div style={{
        background: "linear-gradient(135deg, var(--verde-oscuro) 0%, var(--verde) 100%)",
        padding: "3rem 2rem",
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "2rem",
          color: "white", marginBottom: "0.5rem",
        }}>
          Busca tu viaje
        </h1>
        <p style={{ color: "var(--verde-medio)", marginBottom: "2rem" }}>
          Selecciona tu origen y destino para ver los viajes disponibles
        </p>

        <form onSubmit={buscar} style={{
          background: "white", borderRadius: 60, padding: "0.5rem 1rem",
          display: "inline-flex", gap: "0.8rem", alignItems: "center",
          maxWidth: 600, width: "100%", boxShadow: "0 8px 32px rgba(16,64,59,0.3)",
        }}>
          <select
            value={origenId}
            onChange={(e) => setOrigenId(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14,
              color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem" }}
            required
          >
            <option value="">📍 Origen</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>
            ))}
          </select>
          <div style={{ width: 1, height: 28, background: "#ddd" }} />
          <select
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14,
              color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem" }}
            required
          >
            <option value="">🏁 Destino</option>
            {sucursales.filter((s) => s.id !== Number(origenId)).map((s) => (
              <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>
            ))}
          </select>
          <button type="submit" className="btn-buscar" disabled={buscando}>
            {buscando ? "..." : "Buscar"}
          </button>
        </form>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>⚠ {error}</div>}

        {/* Lista de viajes */}
        {buscado && !buscando && (
          <>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              color: "var(--blanco)", marginBottom: "1.2rem", fontSize: "1.4rem",
            }}>
              {viajes.length === 0
                ? "No hay viajes disponibles para esta ruta"
                : `${viajes.length} viaje(s) disponible(s)`}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {viajes.map((v) => (
                <div
                  key={v.id}
                  className="cli-card"
                  style={{
                    cursor: "pointer",
                    border: viajeSelec?.id === v.id
                      ? "2px solid var(--amarillo)"
                      : "1px solid rgba(18,115,105,0.12)",
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
                      borderRadius: 50, padding: "3px 12px", fontSize: 13, fontWeight: 700,
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
                      <span>{v.bus?.marca} {v.bus?.modelo} — {v.bus?.tipo?.replace("_", " ")}</span>
                    </div>
                    <div className="cli-card-row">
                      <span>💺 Asientos libres</span>
                      <span style={{ color: v.asientosDisponibles > 5 ? "var(--verde)" : "#c0392b", fontWeight: 700 }}>
                        {v.asientosDisponibles} / {v.totalAsientos}
                      </span>
                    </div>
                    {v.ruta?.duracionHorasEstimada && (
                      <div className="cli-card-row">
                        <span>⏱ Duración estimada</span>
                        <span>{v.ruta.duracionHorasEstimada} horas</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "0 1.2rem 1.2rem" }}>
                    <button
                      className="cli-track-btn"
                      onClick={(e) => { e.stopPropagation(); seleccionarViaje(v); }}
                    >
                      {viajeSelec?.id === v.id ? "✓ Seleccionado — elige tu asiento ↓" : "Seleccionar viaje →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Mapa de asientos */}
        {viajeSelec && (
          <div id="mapa-section" style={{ marginTop: "2rem" }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              color: "var(--blanco)", marginBottom: "0.5rem", fontSize: "1.4rem",
            }}>
              Elige tu asiento
            </h2>
            <p style={{ color: "var(--verde-medio)", marginBottom: "1.5rem", fontSize: 14 }}>
              {viajeSelec.ruta?.origen?.ciudad} → {viajeSelec.ruta?.destino?.ciudad} ·{" "}
              {fmtFecha(viajeSelec.fechaHoraSalida)}
            </p>

            {cargandoAsientos ? (
              <div className="cli-loading">Cargando asientos...</div>
            ) : (
              <MapaAsientos
                asientos={asientos}
                seleccionado={asientoSel}
                onSeleccionar={setAsientoSel}
              />
            )}

            {asientoSel && (
              <div style={{
                background: "rgba(18,115,105,0.15)", border: "1px solid var(--verde)",
                borderRadius: 12, padding: "1.2rem", marginTop: "1.5rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: "1rem",
              }}>
                <div>
                  <p style={{ color: "var(--verde-medio)", fontSize: 13, marginBottom: 4 }}>
                    Asiento seleccionado
                  </p>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                    N° {asientoSel.numeroAsiento} — {asientoSel.tipo} · S/ {viajeSelec.precioAdulto}
                  </p>
                </div>
                <button
                  className="btn-reservar"
                  style={{ minWidth: 200 }}
                  onClick={() => {
                    if (!session) { navigate("/login"); return; }
                    setModalCompra(true);
                  }}
                >
                  {session ? "Reservar y pagar →" : "Iniciar sesión para reservar →"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalCompra && (
        <ModalCompra
          viaje={viajeSelec}
          asiento={asientoSel}
          onConfirmar={confirmarCompra}
          onCerrar={() => setModalCompra(false)}
          comprando={comprando}
        />
      )}
      {boletoOk && (
        <ModalBoletoOk boleto={boletoOk} onCerrar={cerrarBoletoOk} />
      )}
    </div>
  );
}
