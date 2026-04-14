import { useState, useEffect, useRef } from "react";
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

// ── Carrito lateral deslizable ─────────────────────────
function CarritoSidebar({ items, onRemove, onCheckout, open, onClose }) {
  const total = items.reduce((s, i) => s + i.precio, 0);
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 1100, opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
        background: "linear-gradient(160deg, #10403B 0%, #0c2d29 100%)",
        borderLeft: "2px solid rgba(245,197,24,0.25)",
        zIndex: 1200, display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.5)" : "none",
      }}>
        {/* Header del carrito */}
        <div style={{
          padding: "1.2rem 1.4rem",
          borderBottom: "1px solid rgba(138,166,163,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🛒</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "white", fontWeight: 700 }}>
              Mi Carrito
            </span>
            {items.length > 0 && (
              <span style={{
                background: "var(--amarillo)", color: "var(--verde-oscuro)",
                borderRadius: 50, fontSize: 11, fontWeight: 800,
                padding: "1px 7px", minWidth: 20, textAlign: "center",
              }}>{items.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(138,166,163,0.2)",
            borderRadius: 8, color: "var(--verde-medio)", cursor: "pointer",
            fontSize: 16, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.4rem" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--verde-medio)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Carrito vacío</p>
              <p style={{ fontSize: 13 }}>Agrega pasajes o encomiendas para continuar</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)",
                  borderRadius: 12, padding: "0.9rem 1rem",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{item.tipo === "encomienda" ? "📦" : "🎫"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "white", fontSize: 14, marginBottom: 2 }}>
                      {item.tipo === "encomienda" ? "Encomienda" : "Pasaje"}
                    </div>
                    <div style={{ color: "var(--verde-medio)", fontSize: 12, lineHeight: 1.5 }}>
                      {item.descripcion}
                    </div>
                    <div style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 15, marginTop: 4 }}>
                      S/ {item.precio.toFixed(2)}
                    </div>
                  </div>
                  <button onClick={() => onRemove(item.id)} style={{
                    background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)",
                    borderRadius: 6, color: "#ff6b6b", cursor: "pointer", fontSize: 13,
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer del carrito */}
        {items.length > 0 && (
          <div style={{
            padding: "1.2rem 1.4rem",
            borderTop: "1px solid rgba(138,166,163,0.15)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 14,
            }}>
              <span style={{ color: "var(--verde-medio)", fontSize: 14 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              style={{
                width: "100%", background: "linear-gradient(135deg, var(--amarillo), #e6b800)",
                color: "var(--verde-oscuro)", border: "none", borderRadius: 12,
                padding: "0.9rem", fontSize: 15, fontWeight: 800, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: "0.04em",
                boxShadow: "0 4px 16px rgba(245,197,24,0.3)",
              }}
            >
              💳 Proceder al pago
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Formulario de Encomienda ───────────────────────────
function FormEncomienda({ sucursales, onAgregarAlCarrito }) {
  const [origenId,   setOrigenId]   = useState("");
  const [destinoId,  setDestinoId]  = useState("");
  const [remitente,  setRemitente]  = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [telefono,   setTelefono]   = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [peso,       setPeso]       = useState("");
  const [tipoEnvio,  setTipoEnvio]  = useState("NORMAL");
  const [exito,      setExito]      = useState(false);

  const tarifas = { NORMAL: 10, EXPRESS: 18, FRAGIL: 22 };
  const pesoNum = parseFloat(peso) || 0;
  const tarifa  = tarifas[tipoEnvio] || 10;
  const total   = pesoNum > 0 ? Math.max(tarifa, tarifa + (pesoNum - 5) * 2) : tarifa;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origenId || !destinoId || !remitente || !destinatario || !peso) return;
    const origen  = sucursales.find((s) => String(s.id) === String(origenId));
    const destino = sucursales.find((s) => String(s.id) === String(destinoId));
    onAgregarAlCarrito({
      id: `enc-${Date.now()}`,
      tipo: "encomienda",
      descripcion: `${origen?.ciudad} → ${destino?.ciudad} · ${descripcion || "Sin descripción"} · ${pesoNum}kg · ${tipoEnvio}`,
      precio: parseFloat(total.toFixed(2)),
      datos: { origenId, destinoId, remitente, destinatario, telefono, descripcion, peso, tipoEnvio },
    });
    setExito(true);
    setTimeout(() => setExito(false), 3000);
    setRemitente(""); setDestinatario(""); setTelefono(""); setDescripcion(""); setPeso("");
  };

  const tipos = [
    { value: "NORMAL",   label: "📦 Normal",    desc: "3–5 días" },
    { value: "EXPRESS",  label: "⚡ Express",   desc: "24 horas" },
    { value: "FRAGIL",   label: "🥚 Frágil",    desc: "Cuidado especial" },
  ];

  return (
    <div style={{
      background: "rgba(18,115,105,0.08)", border: "1px solid rgba(18,115,105,0.2)",
      borderRadius: 16, padding: "1.5rem",
    }}>
      {exito && (
        <div style={{
          background: "rgba(18,115,105,0.3)", border: "1px solid var(--verde)",
          borderRadius: 10, padding: "0.8rem 1rem", marginBottom: 16,
          color: "white", fontWeight: 600, fontSize: 14,
          animation: "slideDown 0.3s ease",
        }}>
          ✅ Encomienda agregada al carrito correctamente
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Ruta */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>📍 Ciudad de origen *</label>
            <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} required
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }}>
              <option value="">Seleccionar</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>🏁 Ciudad destino *</label>
            <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }}>
              <option value="">Seleccionar</option>
              {sucursales.filter((s) => s.id !== Number(origenId)).map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}
            </select>
          </div>
        </div>

        {/* Tipo de envío */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 8 }}>Tipo de envío *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {tipos.map((t) => (
              <label key={t.value} style={{
                flex: 1, background: tipoEnvio === t.value ? "rgba(18,115,105,0.3)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${tipoEnvio === t.value ? "var(--verde)" : "rgba(138,166,163,0.2)"}`,
                borderRadius: 10, padding: "9px 8px", cursor: "pointer", textAlign: "center",
                transition: "all 0.18s",
              }}>
                <input type="radio" name="tipoEnvio" value={t.value} checked={tipoEnvio === t.value} onChange={() => setTipoEnvio(t.value)} style={{ display: "none" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--verde-medio)" }}>{t.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Datos del paquete */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>👤 Remitente *</label>
            <input value={remitente} onChange={(e) => setRemitente(e.target.value)} placeholder="Tu nombre completo" required
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>👤 Destinatario *</label>
            <input value={destinatario} onChange={(e) => setDestinatario(e.target.value)} placeholder="Nombre de quien recibe" required
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>📱 Teléfono destinatario</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="999 888 777" type="tel"
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>⚖️ Peso (kg) *</label>
            <input value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ej: 3.5" type="number" step="0.1" min="0.1" required
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>📝 Descripción del contenido</label>
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Ropa, documentos, alimentos..." maxLength={100}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit" }} />
        </div>

        {/* Cotización */}
        {pesoNum > 0 && (
          <div style={{
            background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.25)",
            borderRadius: 10, padding: "0.8rem 1rem", marginBottom: 14,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: "var(--verde-medio)", fontSize: 12 }}>Costo estimado</div>
              <div style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 20 }}>S/ {total.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--verde-medio)" }}>
              <div>Tarifa base: S/ {tarifa}</div>
              <div>{tipoEnvio} · {pesoNum} kg</div>
            </div>
          </div>
        )}

        <button type="submit" style={{
          width: "100%", background: "linear-gradient(135deg, var(--verde), #0f9183)",
          color: "white", border: "none", borderRadius: 10, padding: "0.9rem",
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.04em",
        }}>
          📦 Agregar encomienda al carrito →
        </button>
      </form>
    </div>
  );
}

// ── Modal de pago del carrito ──────────────────────────
function ModalPagoCarrito({ items, onConfirmar, onCerrar, procesando }) {
  const [paso,       setPaso]       = useState(1);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [datosExtra, setDatosExtra] = useState({ numero: "", nombre: "", operacion: "" });
  const total = items.reduce((s, i) => s + i.precio, 0);

  const metodos = [
    { value: "EFECTIVO",        label: "💵 Efectivo en terminal",   desc: "Paga al momento de embarcar" },
    { value: "YAPE",            label: "📱 Yape",                   desc: "Pago móvil inmediato" },
    { value: "PLIN",            label: "📱 Plin",                   desc: "Pago móvil inmediato" },
    { value: "TARJETA_CREDITO", label: "💳 Tarjeta de crédito",     desc: "Visa, Mastercard" },
    { value: "TARJETA_DEBITO",  label: "💳 Tarjeta de débito",      desc: "Débito automático" },
    { value: "TRANSFERENCIA",   label: "🏦 Transferencia bancaria", desc: "BCP, Interbank, BBVA" },
  ];

  const necesitaDatos = ["YAPE","PLIN","TARJETA_CREDITO","TARJETA_DEBITO","TRANSFERENCIA"].includes(metodoPago);

  const handleConfirmar = () => {
    if (necesitaDatos && !datosExtra.operacion) return;
    onConfirmar(metodoPago, datosExtra);
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal pago-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-badge">💳</div>
          <div>
            <div className="modal-title">
              {paso === 1 ? "Resumen del pedido" : paso === 2 ? "Método de pago" : "¡Pago confirmado!"}
            </div>
            <div className="modal-subtitle">{items.length} item(s) · Total S/ {total.toFixed(2)}</div>
          </div>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>

        <div className="modal-body">
          {/* Indicador pasos */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {["Resumen", "Pago", "Confirmación"].map((label, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  height: 4, borderRadius: 2, marginBottom: 4,
                  background: paso > i + 1 ? "var(--amarillo)" : paso === i + 1 ? "var(--amarillo)" : "rgba(138,166,163,0.3)",
                }} />
                <span style={{ fontSize: 11, color: paso === i + 1 ? "var(--amarillo)" : "var(--verde-medio)" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* PASO 1 — Resumen */}
          {paso === 1 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {items.map((item) => (
                  <div key={item.id} style={{
                    background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)",
                    borderRadius: 10, padding: "0.8rem 1rem",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{item.tipo === "encomienda" ? "📦" : "🎫"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>
                        {item.tipo === "encomienda" ? "Encomienda" : "Pasaje"}
                      </div>
                      <div style={{ color: "var(--verde-medio)", fontSize: 11 }}>{item.descripcion}</div>
                    </div>
                    <span style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 15 }}>S/ {item.precio.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderTop: "1px solid rgba(138,166,163,0.2)", paddingTop: 12, marginBottom: 16,
              }}>
                <span style={{ color: "var(--verde-medio)", fontSize: 14 }}>Total a pagar</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={onCerrar} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-reservar" style={{ flex: 2 }} onClick={() => setPaso(2)}>
                  Continuar al pago →
                </button>
              </div>
            </>
          )}

          {/* PASO 2 — Método de pago */}
          {paso === 2 && (
            <>
              <p style={{ color: "var(--verde-medio)", fontSize: 13, marginBottom: 14 }}>
                Selecciona cómo deseas pagar <strong style={{ color: "white" }}>S/ {total.toFixed(2)}</strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {metodos.map((m) => (
                  <label key={m.value} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: metodoPago === m.value ? "rgba(18,115,105,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${metodoPago === m.value ? "var(--verde)" : "rgba(138,166,163,0.2)"}`,
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "all 0.18s",
                  }}>
                    <input type="radio" name="metodo" value={m.value} checked={metodoPago === m.value}
                      onChange={() => setMetodoPago(m.value)} style={{ accentColor: "var(--verde)" }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: "var(--verde-medio)" }}>{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {metodoPago === "EFECTIVO" && (
                <div style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--amarillo)" }}>
                  💡 Presenta tu código de reserva en el terminal para pagar.
                </div>
              )}
              {(metodoPago === "YAPE" || metodoPago === "PLIN") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(18,115,105,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)" }}>
                    📱 Envía <strong style={{ color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</strong> al número{" "}
                    <strong style={{ color: "white" }}>999-888-777</strong> (INTIWATANA S.R.L.)
                  </div>
                  <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de operación *</label>
                  <input placeholder="Ej: 123456789" value={datosExtra.operacion}
                    onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                </div>
              )}
              {(metodoPago === "TARJETA_CREDITO" || metodoPago === "TARJETA_DEBITO") && (
                <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>Nombre en la tarjeta *</label>
                    <input placeholder="JUAN PEREZ" value={datosExtra.nombre}
                      onChange={(e) => setDatosExtra(p => ({ ...p, nombre: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de autorización *</label>
                    <input placeholder="Código de 6 dígitos del banco" value={datosExtra.operacion}
                      onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                  </div>
                </div>
              )}
              {metodoPago === "TRANSFERENCIA" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(18,115,105,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)" }}>
                    🏦 Cuenta BCP: <strong style={{ color: "white" }}>191-123456789-0-12</strong><br />
                    A nombre de: <strong style={{ color: "white" }}>INTIWATANA S.R.L.</strong><br />
                    Monto: <strong style={{ color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</strong>
                  </div>
                  <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de operación *</label>
                  <input placeholder="Ej: 1234567890" value={datosExtra.operacion}
                    onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={() => setPaso(1)} style={{ flex: 1 }}>← Atrás</button>
                <button className="btn-reservar" style={{ flex: 2, opacity: (necesitaDatos && !datosExtra.operacion) ? 0.6 : 1 }}
                  disabled={procesando || (necesitaDatos && !datosExtra.operacion)}
                  onClick={handleConfirmar}>
                  {procesando ? "⏳ Procesando..." : "✓ Confirmar y pagar"}
                </button>
              </div>
              <p className="modal-nota">* Tu comprobante se generará al instante y quedará en tu cuenta.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal pago individual (pasaje) ─────────────────────
function ModalPago({ viaje, asiento, onConfirmar, onCerrar, comprando }) {
  const [paso, setPaso]             = useState(1);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [datosExtra, setDatosExtra] = useState({ numero: "", nombre: "", operacion: "" });
  if (!viaje || !asiento) return null;
  const precio = viaje.precioAdulto || viaje.precioOficial || 0;
  const metodos = [
    { value: "EFECTIVO",        label: "💵 Efectivo en terminal",   desc: "Paga al momento de abordar" },
    { value: "YAPE",            label: "📱 Yape",                   desc: "Pago móvil inmediato" },
    { value: "PLIN",            label: "📱 Plin",                   desc: "Pago móvil inmediato" },
    { value: "TARJETA_CREDITO", label: "💳 Tarjeta de crédito",     desc: "Visa, Mastercard" },
    { value: "TARJETA_DEBITO",  label: "💳 Tarjeta de débito",      desc: "Débito automático" },
    { value: "TRANSFERENCIA",   label: "🏦 Transferencia bancaria", desc: "BCP, Interbank, BBVA" },
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
            <div className="modal-title">{paso === 1 ? "Resumen de compra" : "Método de pago"}</div>
            <div className="modal-subtitle">{viaje.ruta?.origen?.ciudad} → {viaje.ruta?.destino?.ciudad}</div>
          </div>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {["Resumen", "Pago"].map((label, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, marginBottom: 4, background: paso > i ? "var(--amarillo)" : paso === i + 1 ? "var(--amarillo)" : "rgba(138,166,163,0.3)" }} />
                <span style={{ fontSize: 11, color: paso === i + 1 ? "var(--amarillo)" : "var(--verde-medio)" }}>{label}</span>
              </div>
            ))}
          </div>
          {paso === 1 && (
            <>
              <div style={{ background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "white", fontWeight: 700 }}>
                      {viaje.ruta?.origen?.ciudad} → {viaje.ruta?.destino?.ciudad}
                    </div>
                    <div style={{ color: "var(--verde-medio)", fontSize: 12, marginTop: 2 }}>{fmtFecha(viaje.fechaHoraSalida)}</div>
                  </div>
                  <div style={{ background: "rgba(245,197,24,0.15)", color: "var(--amarillo)", borderRadius: 50, padding: "4px 14px", fontWeight: 800, fontSize: 18 }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(138,166,163,0.2)", paddingTop: 12, marginBottom: 16 }}>
                <span style={{ color: "var(--verde-medio)", fontSize: 14 }}>Total a pagar</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--amarillo)" }}>S/ {precio}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={onCerrar} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-reservar" style={{ flex: 2 }} onClick={() => setPaso(2)}>Continuar al pago →</button>
              </div>
            </>
          )}
          {paso === 2 && (
            <>
              <p style={{ color: "var(--verde-medio)", fontSize: 13, marginBottom: 14 }}>
                Selecciona cómo deseas pagar <strong style={{ color: "white" }}>S/ {precio}</strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {metodos.map((m) => (
                  <label key={m.value} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: metodoPago === m.value ? "rgba(18,115,105,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${metodoPago === m.value ? "var(--verde)" : "rgba(138,166,163,0.2)"}`,
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "all 0.18s",
                  }}>
                    <input type="radio" name="metodo" value={m.value} checked={metodoPago === m.value} onChange={() => setMetodoPago(m.value)} style={{ accentColor: "var(--verde)" }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: "var(--verde-medio)" }}>{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {metodoPago === "EFECTIVO" && (
                <div style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--amarillo)" }}>
                  💡 Presenta tu código de reserva en el terminal para pagar y recoger tu boleto físico.
                </div>
              )}
              {(metodoPago === "YAPE" || metodoPago === "PLIN") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(18,115,105,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)" }}>
                    📱 Envía <strong style={{ color: "var(--amarillo)" }}>S/ {precio}</strong> al número <strong style={{ color: "white" }}>999-888-777</strong> (INTIWATANA S.R.L.)
                  </div>
                  <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de operación *</label>
                  <input placeholder="Ej: 123456789" value={datosExtra.operacion}
                    onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                </div>
              )}
              {(metodoPago === "TARJETA_CREDITO" || metodoPago === "TARJETA_DEBITO") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>Nombre en la tarjeta *</label>
                    <input placeholder="JUAN PEREZ" value={datosExtra.nombre} onChange={(e) => setDatosExtra(p => ({ ...p, nombre: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de autorización *</label>
                    <input placeholder="Código de 6 dígitos del banco" value={datosExtra.operacion} onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                  </div>
                </div>
              )}
              {metodoPago === "TRANSFERENCIA" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(18,115,105,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)" }}>
                    🏦 Cuenta BCP: <strong style={{ color: "white" }}>191-123456789-0-12</strong><br />
                    A nombre de: <strong style={{ color: "white" }}>INTIWATANA S.R.L.</strong><br />
                    Monto: <strong style={{ color: "var(--amarillo)" }}>S/ {precio}</strong>
                  </div>
                  <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de operación *</label>
                  <input placeholder="Ej: 1234567890" value={datosExtra.operacion} onChange={(e) => setDatosExtra(p => ({ ...p, operacion: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={() => setPaso(1)} style={{ flex: 1 }}>← Atrás</button>
                <button className="btn-reservar" style={{ flex: 2, opacity: (necesitaDatos && !datosExtra.operacion) ? 0.6 : 1 }}
                  disabled={comprando || (necesitaDatos && !datosExtra.operacion)} onClick={handleConfirmar}>
                  {comprando ? "⏳ Procesando pago..." : "✓ Confirmar y pagar"}
                </button>
              </div>
              <p className="modal-nota">* Tu boleto con código QR se generará al instante y quedará guardado en tu cuenta.</p>
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
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(18,115,105,0.2)", border: "3px solid var(--verde)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 1rem", animation: "pulse 1s ease" }}>🎫</div>
          <p style={{ color: "var(--verde-medio)", marginBottom: "0.5rem", fontSize: 13 }}>Número de boleto</p>
          <div style={{ fontFamily: "monospace", fontSize: "1.3rem", fontWeight: 700, color: "var(--amarillo)", background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: 10, padding: "0.7rem 1.2rem", marginBottom: "1.2rem" }}>
            {boleto.numeroBoleto}
          </div>
          {boleto.qrImagenUrl && (
            <img src={boleto.qrImagenUrl} alt="QR Boleto" style={{ width: 150, height: 150, borderRadius: 10, margin: "0 auto 1rem", border: "3px solid rgba(18,115,105,0.3)" }} />
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
          <button className="btn-reservar" onClick={onCerrar}>Ver mis viajes →</button>
        </div>
      </div>
    </div>
  );
}

// ── Banner bienvenida ──────────────────────────────────
function BannerBienvenida({ username, onClose }) {
  return (
    <div style={{ background: "linear-gradient(135deg, rgba(18,115,105,0.95), rgba(16,64,59,0.98))", border: "1px solid rgba(245,197,24,0.4)", borderRadius: 14, padding: "1.2rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 16, animation: "slideDown 0.4s ease" }}>
      <div style={{ fontSize: 36 }}>🎉</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "white", fontSize: 16, marginBottom: 3 }}>¡Bienvenido, {username}!</div>
        <div style={{ color: "var(--verde-medio)", fontSize: 13 }}>Tu cuenta fue creada exitosamente. Ahora puedes buscar y reservar tus pasajes.</div>
      </div>
      <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--verde-medio)", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>✕</button>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────
export default function PasajesPage() {
  const { session } = useAuth();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const recienRegistrado = searchParams.get("recienRegistrado") === "true";
  const destinoParam = searchParams.get("destino") || ""; // pre-seleccionar destino desde landing

  const [showBienvenida, setShowBienvenida] = useState(recienRegistrado);
  const [sucursales,  setSucursales]  = useState([]);
  const [origenId,    setOrigenId]    = useState("");
  const [destinoId,   setDestinoId]   = useState(""); // se llenará tras cargar sucursales si hay destinoParam
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

  // Carrito
  const [carrito,       setCarrito]       = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [modalPagoCarrito, setModalPagoCarrito] = useState(false);
  const [procesandoCarrito, setProcesandoCarrito] = useState(false);
  const [pagoExitoso,   setPagoExitoso]   = useState(false);
  const [pendingAutoBuscar, setPendingAutoBuscar] = useState(null); // id destino a buscar automáticamente

  // Tab activo: "pasajes" | "encomiendas"
  const [tabActivo, setTabActivo] = useState("pasajes");

  // Auto-seleccionar destino Y buscar automáticamente si viene desde landing
  useEffect(() => {
    if (!destinoParam || !sucursales.length) return;
    const found = sucursales.find(
      (s) => s.ciudad?.toLowerCase().includes(destinoParam.toLowerCase()) ||
             s.nombre?.toLowerCase().includes(destinoParam.toLowerCase())
    );
    if (found) {
      setDestinoId(String(found.id));
      // Si no hay origen elegido, auto-seleccionar la primera sucursal que NO sea el destino
      setOrigenId(prev => {
        if (!prev || prev === String(found.id)) {
          const primerOrigen = sucursales.find(s => s.id !== found.id);
          return primerOrigen ? String(primerOrigen.id) : prev;
        }
        return prev;
      });
      // marcar para búsqueda automática
      setPendingAutoBuscar(String(found.id));
    }
  }, [sucursales, destinoParam]);

  // Cuando origenId + destinoId están listos Y viene de landing → buscar automáticamente
  useEffect(() => {
    if (!pendingAutoBuscar || !origenId || buscado) return;
    if (String(destinoId) !== pendingAutoBuscar) return;
    if (origenId === pendingAutoBuscar) return;
    const oId = origenId;
    const dId = pendingAutoBuscar;
    setPendingAutoBuscar(null);
    // pequeño delay para que headers estén disponibles
    setTimeout(() => buscarViajes(oId, dId), 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origenId, destinoId, pendingAutoBuscar, buscado]);

  const headers = session
    ? { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }
    : { "Content-Type": "application/json" };

  useEffect(() => {
    fetch("/api/v1/sucursales", { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSucursales(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Función de búsqueda reutilizable (usada por form y por auto-búsqueda)
  const buscarViajes = async (oId, dId) => {
    if (!oId || !dId) { setError("Selecciona origen y destino"); return; }
    if (oId === dId) { setError("El origen y destino no pueden ser iguales"); return; }
    setError(""); setBuscando(true); setViajes([]); setViajeSelec(null); setAsientos([]); setAsientoSel(null);
    try {
      const params = new URLSearchParams({ origenId: oId, destinoId: dId, page: 0, size: 20 });
      const res = await fetch(`/api/v1/viajes/disponibles?${params}`, { headers });
      const data = await res.json();
      setViajes(data.content || data || []);
      setBuscado(true);
    } catch { setError("Error al buscar viajes"); }
    finally { setBuscando(false); }
  };

  const buscar = async (e) => {
    e.preventDefault();
    buscarViajes(origenId, destinoId);
  };

  const seleccionarViaje = async (viaje) => {
    setViajeSelec(viaje); setAsientoSel(null); setCargandoAsientos(true);
    try {
      const res = await fetch(`/api/v1/viajes/${viaje.id}/asientos`, { headers });
      const data = await res.json();
      setAsientos(Array.isArray(data) ? data : []);
    } catch { setAsientos([]); }
    finally { setCargandoAsientos(false); }
    setTimeout(() => document.getElementById("mapa-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const confirmarCompra = async (metodoPago, datosExtra) => {
    if (!session) { navigate("/login"); return; }
    setComprando(true); setError("");
    try {
      const body = {
        viajeId: viajeSelec.id, asientoId: asientoSel.id, clienteId: 0,
        metodoPago, referenciaPago: datosExtra.operacion || null,
        observaciones: `Pago: ${metodoPago}${datosExtra.nombre ? ` — ${datosExtra.nombre}` : ""}`,
      };
      const res = await fetch("/api/v1/boletos/comprar", { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.mensaje || d.message || "Error al procesar"); }
      const boleto = await res.json();
      setBoletoOk(boleto); setModalPago(false);
      setAsientos(prev => prev.map(a => a.id === asientoSel.id ? { ...a, estado: "VENDIDO" } : a));
      setAsientoSel(null);
    } catch (err) { setError(err.message); }
    finally { setComprando(false); }
  };

  // Agregar pasaje al carrito
  const agregarPasajeAlCarrito = () => {
    if (!viajeSelec || !asientoSel) return;
    const precio = viajeSelec.precioAdulto || viajeSelec.precioOficial || 0;
    const item = {
      id: `pas-${Date.now()}`,
      tipo: "pasaje",
      descripcion: `${viajeSelec.ruta?.origen?.ciudad} → ${viajeSelec.ruta?.destino?.ciudad} · Asiento N°${asientoSel.numeroAsiento} · ${fmtFecha(viajeSelec.fechaHoraSalida)}`,
      precio: parseFloat(precio),
      datos: { viajeId: viajeSelec.id, asientoId: asientoSel.id },
    };
    setCarrito(prev => [...prev, item]);
    setCarritoAbierto(true);
    setAsientoSel(null);
  };

  const quitarDelCarrito = (id) => setCarrito(prev => prev.filter(i => i.id !== id));

  const confirmarPagoCarrito = async (metodoPago, datosExtra) => {
    if (!session) { navigate("/login"); return; }
    setProcesandoCarrito(true);
    setError("");
    const errores = [];
    try {
      // ── Procesar pasajes ──
      for (const item of carrito.filter(i => i.tipo === "pasaje")) {
        try {
          const res = await fetch("/api/v1/boletos/comprar", {
            method: "POST", headers,
            body: JSON.stringify({
              viajeId:        item.datos.viajeId,
              asientoId:      item.datos.asientoId,
              clienteId:      0,
              metodoPago,
              referenciaPago: datosExtra.operacion || null,
              observaciones:  `Carrito · ${metodoPago}${datosExtra.nombre ? " — " + datosExtra.nombre : ""}`,
            }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            errores.push(d.mensaje || d.message || `Error en pasaje ${item.id}`);
          }
        } catch (e) { errores.push(e.message); }
      }

      // ── Procesar encomiendas ── guardadas en la BD con el endpoint correcto
      for (const item of carrito.filter(i => i.tipo === "encomienda")) {
        try {
          const d = item.datos;
          const payload = {
            sucursalOrigenId:    Number(d.origenId),
            sucursalDestinoId:   Number(d.destinoId),
            remitenteNombre:     d.remitente,
            destinatarioNombre:  d.destinatario,
            destinatarioTelefono: d.telefono || "",
            descripcionContenido: d.descripcion || "Sin descripción",
            pesoKg:              parseFloat(d.peso) || 0,
            tipoEnvio:           d.tipoEnvio || "NORMAL",
            costo:               item.precio,
            metodoPago,
            referenciaPago:      datosExtra.operacion || null,
            observaciones:       `Pago: ${metodoPago}${datosExtra.nombre ? " — " + datosExtra.nombre : ""}`,
          };
          const res = await fetch("/api/v1/encomiendas", {
            method: "POST", headers,
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const respData = await res.json().catch(() => ({}));
            errores.push(respData.mensaje || respData.message || `Error en encomienda: ${item.descripcion}`);
          }
        } catch (e) { errores.push(e.message); }
      }

      if (errores.length > 0) {
        setError("Algunos items tuvieron errores: " + errores.join(" | "));
      }

      // Vaciar carrito y mostrar éxito incluso si hubo errores parciales
      setCarrito([]);
      setModalPagoCarrito(false);
      setPagoExitoso(true);
      setTimeout(() => setPagoExitoso(false), 6000);
    } catch (err) {
      setError(err.message || "Error inesperado al procesar el pago");
    } finally {
      setProcesandoCarrito(false);
    }
  };

  const cerrarBoletoOk = () => { setBoletoOk(null); navigate("/cliente"); };

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
          <li><a onClick={() => { setTabActivo("pasajes"); navigate("/pasajes"); }} style={{ cursor: "pointer", color: tabActivo === "pasajes" ? "var(--amarillo)" : undefined }}>🎫 Pasajes</a></li>
          <li><a onClick={() => setTabActivo("encomiendas")} style={{ cursor: "pointer", color: tabActivo === "encomiendas" ? "var(--amarillo)" : undefined }}>📦 Encomiendas</a></li>
        </ul>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Botón carrito */}
          <button
            onClick={() => setCarritoAbierto(true)}
            style={{
              position: "relative", background: carrito.length > 0 ? "rgba(245,197,24,0.15)" : "rgba(255,255,255,0.06)",
              border: carrito.length > 0 ? "1.5px solid rgba(245,197,24,0.5)" : "1.5px solid rgba(138,166,163,0.2)",
              borderRadius: 10, color: carrito.length > 0 ? "var(--amarillo)" : "var(--verde-medio)",
              cursor: "pointer", padding: "0.45rem 0.9rem", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}
          >
            🛒 Carrito
            {carrito.length > 0 && (
              <span style={{
                background: "var(--amarillo)", color: "var(--verde-oscuro)",
                borderRadius: 50, fontSize: 10, fontWeight: 900,
                padding: "1px 6px", marginLeft: 2,
              }}>{carrito.length}</span>
            )}
          </button>

          {session ? (
            <button className="btn-admin-nav" onClick={() => navigate("/cliente")}>
              👤 {session.username}
            </button>
          ) : (
            <>
              <button className="btn-admin-nav" onClick={() => navigate("/login")}>Iniciar sesión</button>
              <button className="btn-admin-nav btn-registrarse" onClick={() => navigate("/registrar")}>Registrarse</button>
            </>
          )}
        </div>
      </nav>

      {/* Banner de pago exitoso */}
      {pagoExitoso && (
        <div style={{
          background: "linear-gradient(135deg, rgba(18,115,105,0.98), rgba(16,64,59,0.99))",
          border: "1px solid rgba(245,197,24,0.5)", padding: "1rem 2rem",
          display: "flex", alignItems: "center", gap: 16, justifyContent: "center",
          animation: "slideDown 0.4s ease",
        }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
            ¡Pago procesado con éxito! Tu comprobante está disponible en <strong style={{ color: "var(--amarillo)" }}>Mi cuenta</strong>.
          </span>
          <button onClick={() => setPagoExitoso(false)} style={{ background: "transparent", border: "none", color: "var(--verde-medio)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* TABS hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--verde-oscuro) 0%, var(--verde) 100%)",
        padding: "2.5rem 2rem 3.5rem", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Tab switcher */}
        <div style={{
          display: "inline-flex", background: "rgba(0,0,0,0.25)", borderRadius: 50,
          padding: "4px", gap: 4, marginBottom: "1.5rem", position: "relative", zIndex: 1,
        }}>
          {[{ key: "pasajes", label: "🎫 Comprar Pasaje" }, { key: "encomiendas", label: "📦 Enviar Encomienda" }].map((tab) => (
            <button key={tab.key} onClick={() => setTabActivo(tab.key)} style={{
              background: tabActivo === tab.key ? "var(--amarillo)" : "transparent",
              color: tabActivo === tab.key ? "var(--verde-oscuro)" : "rgba(255,255,255,0.75)",
              border: "none", borderRadius: 50, padding: "0.55rem 1.4rem", fontSize: 14,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.25s",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {tabActivo === "pasajes" && (
          <>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "white", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
              Busca tu viaje
            </h1>
            <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "2rem", position: "relative", zIndex: 1 }}>
              Selecciona tu origen y destino para ver los viajes disponibles
            </p>
            <form onSubmit={buscar} style={{
              background: "white", borderRadius: 60, padding: "0.5rem 0.5rem 0.5rem 1.2rem",
              display: "inline-flex", gap: "0.8rem", alignItems: "center",
              maxWidth: 620, width: "100%",
              boxShadow: "0 8px 32px rgba(16,64,59,0.4)", position: "relative", zIndex: 1,
            }}>
              <span style={{ color: "var(--verde)", fontSize: 18 }}>📍</span>
              <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} required
                style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0" }}>
                <option value="">Origen</option>
                {sucursales.map((s) => <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>)}
              </select>
              <div style={{ width: 1, height: 28, background: "#ddd" }} />
              <span style={{ color: "var(--verde)", fontSize: 18 }}>🏁</span>
              <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required
                style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0" }}>
                <option value="">Destino</option>
                {sucursales.filter((s) => s.id !== Number(origenId)).map((s) => <option key={s.id} value={s.id}>{s.ciudad} — {s.nombre}</option>)}
              </select>
              <button type="submit" className="btn-buscar" disabled={buscando} style={{ borderRadius: 50, padding: "0.7rem 1.5rem", flexShrink: 0 }}>
                {buscando ? "..." : "Buscar"}
              </button>
            </form>
          </>
        )}

        {tabActivo === "encomiendas" && (
          <>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "white", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
              Envía tu encomienda
            </h1>
            <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
              Rápido, seguro y al mejor precio — llega con nuestros buses
            </p>
            {/* Beneficios */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: "1rem", position: "relative", zIndex: 1 }}>
              {[["📦","Embalaje seguro"],["⚡","Servicio express"],["📍","Rastreo en tiempo real"],["🤝","Entrega garantizada"]].map(([ic, tx]) => (
                <div key={tx} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: 12, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{ic}</span><span>{tx}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {showBienvenida && session && <BannerBienvenida username={session.username} onClose={() => setShowBienvenida(false)} />}

        {/* Banner destino pre-seleccionado desde landing */}
        {destinoParam && destinoId && tabActivo === "pasajes" && (
          <div style={{
            background: "rgba(18,115,105,0.15)", border: "1px solid rgba(18,115,105,0.35)",
            borderRadius: 12, padding: "0.9rem 1.2rem", marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: 12, animation: "slideDown 0.4s ease",
          }}>
            <span style={{ fontSize: 20 }}>🏁</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Destino pre-seleccionado: </span>
              <span style={{ color: "var(--amarillo)", fontWeight: 700, fontSize: 14 }}>{destinoParam}</span>
              <span style={{ color: "var(--verde-medio)", fontSize: 13 }}> — Selecciona el origen y busca los viajes disponibles.</span>
            </div>
          </div>
        )}

        {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>⚠️ {error}</div>}

        {/* ── SECCIÓN ENCOMIENDAS ── */}
        {tabActivo === "encomiendas" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 28 }}>📦</div>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--blanco)", fontSize: "1.5rem", marginBottom: 2 }}>
                  Solicitar envío de encomienda
                </h2>
                <p style={{ color: "var(--verde-medio)", fontSize: 13 }}>
                  Completa el formulario y agrega al carrito para pagar junto con tus pasajes
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>
              <FormEncomienda sucursales={sucursales} onAgregarAlCarrito={(item) => {
                setCarrito(prev => [...prev, item]);
                setCarritoAbierto(true);
              }} />

              {/* Info lateral */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "rgba(18,115,105,0.1)", border: "1px solid rgba(18,115,105,0.2)", borderRadius: 14, padding: "1.2rem" }}>
                  <h3 style={{ color: "white", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>💰 Tarifas de envío</h3>
                  {[
                    { tipo: "Normal 📦", precio: "S/ 10", desc: "Hasta 5 kg · 3–5 días" },
                    { tipo: "Express ⚡", precio: "S/ 18", desc: "Hasta 5 kg · 24 horas" },
                    { tipo: "Frágil 🥚",  precio: "S/ 22", desc: "Hasta 5 kg · Cuidado especial" },
                  ].map((t) => (
                    <div key={t.tipo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(138,166,163,0.15)" }}>
                      <div>
                        <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{t.tipo}</div>
                        <div style={{ color: "var(--verde-medio)", fontSize: 11 }}>{t.desc}</div>
                      </div>
                      <span style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 15 }}>{t.precio}</span>
                    </div>
                  ))}
                  <p style={{ color: "var(--verde-medio)", fontSize: 11, marginTop: 10 }}>+ S/ 2 por kg adicional sobre los 5 kg</p>
                </div>
                <div style={{ background: "rgba(245,197,24,0.07)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: 12, padding: "1rem" }}>
                  <h3 style={{ color: "var(--amarillo)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📋 Requisitos</h3>
                  {["DNI del remitente","Datos completos del destinatario","Descripción del contenido","Peso exacto del paquete"].map((r) => (
                    <div key={r} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ color: "var(--verde)", fontSize: 14 }}>✓</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECCIÓN PASAJES ── */}
        {tabActivo === "pasajes" && (
          <>
            {/* Cargando viajes (auto-búsqueda) */}
            {buscando && (
              <div style={{
                textAlign: "center", padding: "3rem 1rem",
                color: "var(--verde-medio)", fontSize: 15,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, animation: "pulse 1s infinite" }}>🚌</div>
                <p style={{ fontWeight: 600 }}>Buscando viajes disponibles...</p>
              </div>
            )}

            {buscado && !buscando && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--blanco)", marginBottom: "1.2rem", fontSize: "1.4rem" }}>
                  {viajes.length === 0 ? "😔 Sin viajes para esta ruta" : `🚌 ${viajes.length} viaje(s) disponible(s)`}
                </h2>
                {viajes.length === 0 && (
                  <div style={{
                    background: "rgba(18,115,105,0.1)", border: "1px solid rgba(18,115,105,0.25)",
                    borderRadius: 14, padding: "1.5rem", textAlign: "center",
                    marginBottom: "1.5rem",
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🚌</div>
                    <p style={{ color: "var(--verde-medio)", fontSize: 14, marginBottom: 8 }}>
                      No encontramos viajes programados para esta ruta en este momento.
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 16 }}>
                      Puedes intentar con otro origen, cambiar la ruta o consultar directamente en el terminal.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => { setBuscado(false); setViajes([]); setOrigenId(""); setDestinoId(""); }}
                        style={{
                          background: "rgba(18,115,105,0.3)", border: "1.5px solid var(--verde)",
                          color: "white", borderRadius: 8, padding: "0.6rem 1.2rem",
                          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        🔄 Cambiar ruta
                      </button>
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        style={{
                          background: "rgba(245,197,24,0.15)", border: "1.5px solid rgba(245,197,24,0.4)",
                          color: "var(--amarillo)", borderRadius: 8, padding: "0.6rem 1.2rem",
                          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        ↑ Volver al buscador
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {viajes.map((v) => (
                    <div key={v.id} className="cli-card" style={{
                      cursor: "pointer",
                      border: viajeSelec?.id === v.id ? "2px solid var(--amarillo)" : "1px solid rgba(18,115,105,0.12)",
                      transform: viajeSelec?.id === v.id ? "translateX(4px)" : "none",
                    }} onClick={() => seleccionarViaje(v)}>
                      <div className="cli-card-top">
                        <div className="cli-card-ruta">
                          <span className="cli-card-ciudad">{v.ruta?.origen?.ciudad}</span>
                          <span className="cli-card-arrow">→</span>
                          <span className="cli-card-ciudad">{v.ruta?.destino?.ciudad}</span>
                        </div>
                        <span style={{ background: "rgba(245,197,24,0.15)", color: "#b8860b", borderRadius: 50, padding: "3px 14px", fontSize: 15, fontWeight: 800 }}>
                          S/ {v.precioAdulto}
                        </span>
                      </div>
                      <div className="cli-card-body">
                        <div className="cli-card-row"><span>📅 Salida</span><span>{fmtFecha(v.fechaHoraSalida)}</span></div>
                        <div className="cli-card-row"><span>🚌 Bus</span><span>{v.bus?.placa} — {v.bus?.tipo}</span></div>
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
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {/* Agregar al carrito */}
                          <button
                            style={{
                              background: "rgba(18,115,105,0.3)", border: "1.5px solid var(--verde)",
                              color: "white", borderRadius: 10, padding: "0.75rem 1.2rem",
                              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            }}
                            onClick={agregarPasajeAlCarrito}
                          >
                            🛒 Agregar al carrito
                          </button>
                          {/* Comprar directo */}
                          <button className="btn-reservar" style={{ minWidth: 200 }}
                            onClick={() => { if (!session) navigate("/login"); else setModalPago(true); }}>
                            {session ? "🎫 Pagar y reservar →" : "🔐 Inicia sesión →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Carrito lateral */}
      <CarritoSidebar
        items={carrito}
        onRemove={quitarDelCarrito}
        onCheckout={() => { setCarritoAbierto(false); if (!session) navigate("/login"); else setModalPagoCarrito(true); }}
        open={carritoAbierto}
        onClose={() => setCarritoAbierto(false)}
      />

      {/* Modales */}
      {modalPago && <ModalPago viaje={viajeSelec} asiento={asientoSel} onConfirmar={confirmarCompra} onCerrar={() => setModalPago(false)} comprando={comprando} />}
      {boletoOk && <ModalBoletoOk boleto={boletoOk} viaje={viajeSelec} onCerrar={cerrarBoletoOk} />}
      {modalPagoCarrito && (
        <ModalPagoCarrito
          items={carrito}
          onConfirmar={confirmarPagoCarrito}
          onCerrar={() => setModalPagoCarrito(false)}
          procesando={procesandoCarrito}
        />
      )}

      <style>{`
        @keyframes slideDown { from{transform:translateY(-10px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        select option { background: #10403B; color: white; }
      `}</style>
    </div>
  );
}