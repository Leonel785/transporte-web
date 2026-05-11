import { useState, useEffect, useCallback, useRef, Component } from "react";
import { createPortal } from "react-dom";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("PasajesPage crash:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "var(--fondo)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "2rem" }}>
          <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 16, padding: "2rem", maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Ocurrió un error inesperado</div>
            <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 20 }}>{this.state.error?.message || "Error desconocido"}</div>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{ background: "var(--amarillo)", color: "var(--verde-oscuro)", border: "none", borderRadius: 10, padding: "0.8rem 2rem", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";
import { DESTINOS } from "../App";
import {
  MapPin, Flag, Bus, ShoppingCart, User, Ticket, Package, X,
  Clock, CreditCard, Building2, Smartphone, AlertTriangle, CheckCircle,
  Search, Calendar, ChevronRight, Armchair, Loader2, Frown,
  ArrowRight, Scale, FileText, Zap, Info, Navigation,
  LogIn, LayoutDashboard,
} from "lucide-react";

function fmtFecha(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-PE", {
      weekday: "short", day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function getImagenDestino(nombreCiudad) {
  if (!nombreCiudad) return null;
  const lower = nombreCiudad.toLowerCase();
  const found = DESTINOS.find((d) =>
    d.nombre.toLowerCase().includes(lower) ||
    lower.includes(d.nombre.toLowerCase().split(" ")[0].toLowerCase())
  );
  return found?.imagen || null;
}

const AsientoBtn = ({ asiento, ocupado, esSelec, onSeleccionar }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ocupado) onSeleccionar(asiento);
  };
  return (
    <div
      role="button"
      tabIndex={ocupado ? -1 : 0}
      aria-label={`Asiento ${asiento.numeroAsiento}`}
      aria-pressed={esSelec}
      aria-disabled={ocupado}
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(e); }}
      style={{
        width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, cursor: ocupado ? "not-allowed" : "pointer", userSelect: "none",
        transition: "all 0.15s",
        background: ocupado ? "rgba(138,166,163,0.15)" : esSelec ? "var(--amarillo)" : "rgba(18,115,105,0.3)",
        border: `1.5px solid ${ocupado ? "rgba(138,166,163,0.2)" : esSelec ? "var(--amarillo)" : "var(--verde)"}`,
        color: ocupado ? "rgba(138,166,163,0.4)" : esSelec ? "var(--verde-oscuro)" : "white",
        boxShadow: esSelec ? "0 0 0 3px rgba(245,197,24,0.3)" : "none",
      }}
    >
      {asiento.numeroAsiento}
    </div>
  );
};

function MapaAsientos({ asientos, seleccionados, onSeleccionar }) {
  const lista = Array.isArray(asientos) ? asientos : [];
  const sel = Array.isArray(seleccionados) ? seleccionados : [];

  if (!lista.length) return (
    <div style={{ textAlign: "center", padding: "2rem", color: "var(--verde-medio)", fontSize: 14 }}>
      No hay información de asientos disponible.
    </div>
  );

  const maxFila = lista.reduce((max, a) => Math.max(max, a.fila || 1), 1);

  return (
    <div className="mapa-asientos">
      <div className="mapa-leyenda">
        <span style={{ color: "var(--verde)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Armchair size={13} /> Disponible</span>
        <span style={{ color: "var(--gris)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Armchair size={13} /> Ocupado</span>
        <span style={{ color: "var(--amarillo)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Armchair size={13} /> Tu selección</span>
      </div>
      <div className="mapa-bus">
        <div className="bus-frente" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Bus size={16} /> Frente del bus
        </div>
        {Array.from({ length: maxFila }, (_, fi) => {
          const fila = fi + 1;
          const asientosFila = lista.filter((a) => a.fila === fila);
          return (
            <div className="bus-fila" key={`fila-${fila}`}>
              {[1, 2, null, 3, 4].map((col, idx) => {
                if (col === null) return <div key={`pasillo-${fila}`} className="bus-pasillo" />;
                const a = asientosFila.find((x) => x.columna === col);
                if (!a) return <div key={`vacio-${fila}-${idx}`} style={{ width: 36, height: 36 }} />;
                const ocupado = a.estado !== "DISPONIBLE";
                const esSelec = sel.some((s) => s.id === a.id);
                return (
                  <AsientoBtn
                    key={`asiento-${a.id}`}
                    asiento={a}
                    ocupado={ocupado}
                    esSelec={esSelec}
                    onSeleccionar={onSeleccionar}
                  />
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

function CarritoSidebar({ items, onRemove, onCheckout, open, onClose }) {
  const total = items.reduce((s, i) => s + i.precio, 0);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1100, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.3s" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, background: "linear-gradient(160deg, #10403B 0%, #0c2d29 100%)", borderLeft: "2px solid rgba(245,197,24,0.25)", zIndex: 1200, display: "flex", flexDirection: "column", transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.5)" : "none" }}>
        <div style={{ padding: "1.2rem 1.4rem", borderBottom: "1px solid rgba(138,166,163,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingCart size={22} color="var(--amarillo)" />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "white", fontWeight: 700 }}>Mi Carrito</span>
            {items.length > 0 && <span style={{ background: "var(--amarillo)", color: "var(--verde-oscuro)", borderRadius: 50, fontSize: 11, fontWeight: 800, padding: "1px 7px", minWidth: 20, textAlign: "center" }}>{items.length}</span>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(138,166,163,0.2)", borderRadius: 8, color: "var(--verde-medio)", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.4rem" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--verde-medio)" }}>
              <ShoppingCart size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Carrito vacío</p>
              <p style={{ fontSize: 13 }}>Agrega pasajes o encomiendas para continuar</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => (
                <div key={item.id} style={{ background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)", borderRadius: 12, padding: "0.9rem 1rem", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>{item.tipo === "encomienda" ? <Package size={22} color="var(--amarillo)" /> : <Ticket size={22} color="var(--amarillo)" />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "white", fontSize: 14, marginBottom: 2 }}>{item.tipo === "encomienda" ? "Encomienda" : "Pasaje"}</div>
                    <div style={{ color: "var(--verde-medio)", fontSize: 12, lineHeight: 1.5 }}>{item.descripcion}</div>
                    <div style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 15, marginTop: 4 }}>S/ {item.precio.toFixed(2)}</div>
                  </div>
                  <button onClick={() => onRemove(item.id)} style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 6, color: "#ff6b6b", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div style={{ padding: "1.2rem 1.4rem", borderTop: "1px solid rgba(138,166,163,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ color: "var(--verde-medio)", fontSize: 14 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} style={{ width: "100%", background: "linear-gradient(135deg, var(--amarillo), #e6b800)", color: "var(--verde-oscuro)", border: "none", borderRadius: 12, padding: "0.9rem", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(245,197,24,0.3)" }}>
              <CreditCard size={18} /> Proceder al pago
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── FormEncomienda ────────────────────────────────────────────────────────────
// FIXED: árbol DOM estable en el preview de costo — sin montaje/desmontaje
//        condicional de nodos que causaba el error removeChild.
function FormEncomienda({ sucursales, onAgregarAlCarrito }) {
  const [origenId, setOrigenId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [remitente, setRemitente] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [peso, setPeso] = useState("");
  const [tipoEnvio, setTipoEnvio] = useState("NORMAL");
  const [exito, setExito] = useState(false);

  const TARIFAS = { NORMAL: 10, EXPRESS: 18, FRAGIL: 22 };

  // Cálculo defensivo: "" | "0." | NaN → 0
  const pesoNum = peso === "" || peso === "0." ? 0 : (parseFloat(String(peso).replace(",", ".")) || 0);
  const tarifaBase = TARIFAS[tipoEnvio] || 10;
  const extraKg = pesoNum > 5 ? Math.round((pesoNum - 5) * 2 * 100) / 100 : 0;
  const costoTotal = Math.max(tarifaBase + extraKg, tarifaBase);
  const hayPeso = pesoNum > 0;

  // FIXED: permite borrar el campo completamente sin crashear
  const handlePesoChange = (e) => {
    let val = e.target.value;
    // Permitir campo completamente vacío
    if (val === "") { setPeso(""); return; }
    // Reemplazar coma por punto
    val = val.replace(",", ".");
    // Solo dígitos y un punto decimal
    val = val.replace(/[^0-9.]/g, "");
    const firstDot = val.indexOf(".");
    if (firstDot !== -1) {
      val = val.slice(0, firstDot + 1) + val.slice(firstDot + 1).replace(/\./g, "");
    }
    setPeso(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origenId || !destinoId || !remitente || !destinatario || !peso || pesoNum <= 0) return;
    const origen = sucursales.find((s) => String(s.id) === String(origenId));
    const destino = sucursales.find((s) => String(s.id) === String(destinoId));
    onAgregarAlCarrito({
      id: `enc-${Date.now()}`,
      tipo: "encomienda",
      descripcion: `${origen?.ciudad} → ${destino?.ciudad} · ${descripcion || "Sin descripción"} · ${pesoNum}kg · ${tipoEnvio}`,
      precio: parseFloat(costoTotal.toFixed(2)),
      datos: { origenId, destinoId, remitente, destinatario, telefono, descripcion, peso, tipoEnvio }
    });
    setExito(true);
    setTimeout(() => setExito(false), 3000);
    setRemitente(""); setDestinatario(""); setTelefono(""); setDescripcion(""); setPeso("");
  };

  const tipos = [
    { value: "NORMAL", label: "Normal", desc: "3–5 días", icon: <Package size={15} /> },
    { value: "EXPRESS", label: "Express", desc: "24 horas", icon: <Zap size={15} /> },
    { value: "FRAGIL", label: "Frágil", desc: "Cuidado especial", icon: <AlertTriangle size={15} /> },
  ];

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle = { color: "var(--verde-medio)", fontSize: 12, display: "flex", alignItems: "center", gap: 5, marginBottom: 5 };

  return (
    <div style={{ background: "rgba(18,115,105,0.08)", border: "1px solid rgba(18,115,105,0.2)", borderRadius: 16, padding: "1.5rem" }}>
      {exito && (
        <div style={{ background: "rgba(18,115,105,0.3)", border: "1px solid var(--verde)", borderRadius: 10, padding: "0.8rem 1rem", marginBottom: 16, color: "white", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={18} color="var(--verde)" /> Encomienda agregada al carrito correctamente
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}><MapPin size={13} /> Ciudad de origen *</label>
            <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} required style={inputStyle}>
              <option value="">Seleccionar</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}><Flag size={13} /> Ciudad destino *</label>
            <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required style={inputStyle}>
              <option value="">Seleccionar</option>
              {sucursales.filter((s) => s.id !== Number(origenId)).map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}><Package size={13} /> Tipo de envío *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {tipos.map((t) => (
              <label key={t.value} style={{ flex: 1, background: tipoEnvio === t.value ? "rgba(18,115,105,0.3)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${tipoEnvio === t.value ? "var(--verde)" : "rgba(138,166,163,0.2)"}`, borderRadius: 10, padding: "9px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.18s" }}>
                <input type="radio" name="tipoEnvio" value={t.value} checked={tipoEnvio === t.value} onChange={() => setTipoEnvio(t.value)} style={{ display: "none" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{t.icon} {t.label}</div>
                <div style={{ fontSize: 11, color: "var(--verde-medio)", marginTop: 2 }}>{t.desc}</div>
                <div style={{ fontSize: 12, color: "var(--amarillo)", fontWeight: 800, marginTop: 3 }}>S/ {TARIFAS[t.value]}</div>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}><User size={13} /> Remitente *</label>
            <input value={remitente} onChange={(e) => setRemitente(e.target.value)} placeholder="Tu nombre completo" type="text" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}><User size={13} /> Destinatario *</label>
            <input value={destinatario} onChange={(e) => setDestinatario(e.target.value)} placeholder="Nombre de quien recibe" type="text" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}><Smartphone size={13} /> Teléfono destinatario</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="999 888 777" type="tel" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}><Scale size={13} /> Peso (kg) *</label>
            <input
              value={peso}
              onChange={handlePesoChange}
              placeholder="Ej: 3.5"
              type="text"
              inputMode="decimal"
              required
              style={{ ...inputStyle, border: hayPeso ? "1.5px solid var(--verde)" : "1.5px solid rgba(138,166,163,0.3)" }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}><FileText size={13} /> Descripción del contenido *</label>
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Ropa, documentos, alimentos..." maxLength={100} required style={inputStyle} />
        </div>

        {/* ── Preview de costo ─────────────────────────────────────────────── */}
        {/* FIXED: árbol DOM completamente estable — sin nodos que aparezcan   */}
        {/* o desaparezcan. Solo cambian estilos y texto, nunca la estructura. */}
        <div style={{
          background: "rgba(245,197,24,0.08)",
          border: `1.5px solid ${hayPeso ? "rgba(245,197,24,0.5)" : "rgba(245,197,24,0.2)"}`,
          borderRadius: 12, padding: "1rem 1.2rem", marginBottom: 14,
          transition: "border-color 0.2s",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 0 }}>
            <div>
              <div style={{ color: "var(--verde-medio)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Costo estimado</div>
              <div style={{ color: "var(--amarillo)", fontWeight: 900, fontSize: 28, lineHeight: 1 }}>
                S/ {costoTotal.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--verde-medio)" }}>
              <div style={{ marginBottom: 3 }}>
                Tarifa base ({tipoEnvio}): <strong style={{ color: "white" }}>S/ {tarifaBase}</strong>
              </div>
              {/* Línea de peso — siempre presente, solo cambia el contenido */}
              <div style={{ color: hayPeso ? "white" : "rgba(138,166,163,0.6)", fontStyle: hayPeso ? "normal" : "italic" }}>
                {hayPeso
                  ? `${pesoNum} kg${pesoNum > 5 ? ` · +${(pesoNum - 5).toFixed(1)} kg extra` : " · sin recargo"}`
                  : "Ingresa el peso"
                }
              </div>
            </div>
          </div>
          {/* Fila de recargo — siempre en el DOM, solo visible cuando aplica */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            borderTop: "1px solid rgba(245,197,24,0.2)", marginTop: 8, paddingTop: 8,
            fontSize: 12,
            opacity: pesoNum > 5 ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.2s",
          }}>
            <span style={{ color: "var(--verde-medio)" }}>
              Recargo por {pesoNum > 5 ? (pesoNum - 5).toFixed(1) : "0.0"} kg extra (× S/2)
            </span>
            <span style={{ color: "#fbbf24", fontWeight: 700 }}>
              + S/ {extraKg.toFixed(2)}
            </span>
          </div>
        </div>

        {/* FIXED: botón submit sin position alternante */}
        <button
          type="submit"
          style={{
            width: "100%",
            background: hayPeso ? "linear-gradient(135deg, var(--verde), #0f9183)" : "rgba(18,115,105,0.3)",
            color: "white",
            border: hayPeso ? "none" : "1px solid rgba(18,115,105,0.4)",
            borderRadius: 10, padding: "0.9rem", fontSize: 14, fontWeight: 700,
            cursor: hayPeso ? "pointer" : "not-allowed",
            fontFamily: "inherit", letterSpacing: "0.04em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
            opacity: hayPeso ? 1 : 0.6,
          }}
        >
          <Package size={18} /> Agregar encomienda al carrito <ChevronRight size={16} />
        </button>
      </form>
    </div>
  );
}

// ── ModalPago ─────────────────────────────────────────────────────────────────
// FIXED: botón "Confirmar y pagar" sin position alternante
function ModalPago({ viaje, asientosSeleccionados, itemsCarrito, onConfirmar, onCerrar, comprando }) {
  const [paso, setPaso] = useState(1);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [datosExtra, setDatosExtra] = useState({ operacion: "", nombre: "" });

  const isCarrito = itemsCarrito !== undefined;
  const precioUnit = viaje ? (viaje.precioAdulto || viaje.precioOficial || viaje.precio || 0) : 0;
  const totalCarrito = isCarrito ? itemsCarrito.reduce((s, i) => s + (parseFloat(i.precio) || 0), 0) : 0;
  const totalPasajes = !isCarrito ? (asientosSeleccionados?.length || 0) * (parseFloat(precioUnit) || 0) : 0;
  const total = isCarrito ? totalCarrito : totalPasajes;

  const metodos = [
    { value: "EFECTIVO", label: "Efectivo en terminal", desc: "Paga al momento", icon: <CreditCard size={20} /> },
    { value: "YAPE", label: "Yape", desc: "Pago móvil inmediato", icon: <Smartphone size={20} /> },
    { value: "PLIN", label: "Plin", desc: "Pago móvil inmediato", icon: <Smartphone size={20} /> },
    { value: "TARJETA_CREDITO", label: "Tarjeta de crédito", desc: "Visa, Mastercard", icon: <CreditCard size={20} /> },
    { value: "TARJETA_DEBITO", label: "Tarjeta de débito", desc: "Débito automático", icon: <CreditCard size={20} /> },
    { value: "TRANSFERENCIA", label: "Transferencia bancaria", desc: "BCP, Interbank, BBVA", icon: <Building2 size={20} /> },
  ];

  const necesitaDatos = ["YAPE", "PLIN", "TARJETA_CREDITO", "TARJETA_DEBITO", "TRANSFERENCIA"].includes(metodoPago);
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(138,166,163,0.3)", borderRadius: 8, padding: "10px 13px", color: "white", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal pago-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-badge">{isCarrito ? <ShoppingCart size={22} /> : <Ticket size={22} />}</div>
          <div>
            <div className="modal-title">{paso === 1 ? "Resumen del pedido" : "Método de pago"}</div>
            <div className="modal-subtitle">{isCarrito ? `${itemsCarrito.length} item(s) · Total S/ ${total.toFixed(2)}` : `${viaje?.ruta?.origen?.ciudad} → ${viaje?.ruta?.destino?.ciudad}`}</div>
          </div>
          <button className="modal-close" onClick={onCerrar}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {["Resumen", "Pago"].map((label, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, marginBottom: 4, background: paso > i + 1 || paso === i + 1 ? "var(--amarillo)" : "rgba(138,166,163,0.3)" }} />
                <span style={{ fontSize: 11, color: paso === i + 1 ? "var(--amarillo)" : "var(--verde-medio)" }}>{label}</span>
              </div>
            ))}
          </div>
          {paso === 1 && (
            <>
              {isCarrito ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: "50vh", overflowY: "auto" }}>
                  {itemsCarrito.map((item) => (
                    <div key={item.id} style={{ background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)", borderRadius: 10, padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
                      {item.tipo === "encomienda" ? <Package size={20} color="var(--amarillo)" /> : <Ticket size={20} color="var(--amarillo)" />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>{item.tipo === "encomienda" ? "Encomienda" : "Pasaje"}</div>
                        <div style={{ color: "var(--verde-medio)", fontSize: 11 }}>{item.descripcion}</div>
                      </div>
                      <span style={{ color: "var(--amarillo)", fontWeight: 800 }}>S/ {item.precio.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.2rem" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "white", fontWeight: 700, marginBottom: 8 }}>{viaje?.ruta?.origen?.ciudad} → {viaje?.ruta?.destino?.ciudad}</div>
                  <div style={{ color: "var(--verde-medio)", fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> {fmtFecha(viaje?.fechaHoraSalida)}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                    <div>
                      <div style={{ color: "var(--verde-medio)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Armchair size={11} /> Asientos ({asientosSeleccionados?.length})</div>
                      <div style={{ color: "white", fontWeight: 600 }}>{asientosSeleccionados?.map((a) => `N°${a.numeroAsiento}`).join(", ")}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--verde-medio)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Bus size={11} /> Bus</div>
                      <div style={{ color: "white", fontWeight: 600 }}>{viaje?.bus?.placa || "—"}</div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(138,166,163,0.2)", paddingTop: 12, marginBottom: 16 }}>
                <span style={{ color: "var(--verde-medio)", fontSize: 14 }}>Total a pagar</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={onCerrar} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-reservar" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setPaso(2)}>
                  Continuar al pago <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
          {paso === 2 && (
            <>
              <p style={{ color: "var(--verde-medio)", fontSize: 13, marginBottom: 14 }}>Selecciona cómo deseas pagar <strong style={{ color: "white" }}>S/ {total.toFixed(2)}</strong></p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14, maxHeight: "40vh", overflowY: "auto" }}>
                {metodos.map((m) => (
                  <label key={m.value} style={{ display: "flex", alignItems: "center", gap: 12, background: metodoPago === m.value ? "rgba(18,115,105,0.2)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${metodoPago === m.value ? "var(--verde)" : "rgba(138,166,163,0.2)"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "all 0.18s" }}>
                    <input type="radio" name="metodo" value={m.value} checked={metodoPago === m.value} onChange={() => setMetodoPago(m.value)} style={{ accentColor: "var(--verde)", width: 16, height: 16 }} />
                    <span style={{ color: "var(--amarillo)" }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: "var(--verde-medio)" }}>{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {metodoPago === "EFECTIVO" && (
                <div style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--amarillo)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={15} /> Presenta tu código de reserva en el terminal para pagar.
                </div>
              )}
              {(metodoPago === "YAPE" || metodoPago === "PLIN") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(18,115,105,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Smartphone size={15} color="var(--amarillo)" /> Envía <strong style={{ color: "var(--amarillo)" }}>S/ {total.toFixed(2)}</strong> al número <strong style={{ color: "white" }}>999-888-777</strong>
                  </div>
                  <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de operación *</label>
                  <input placeholder="Ej: 123456789" value={datosExtra.operacion} onChange={(e) => setDatosExtra((p) => ({ ...p, operacion: e.target.value }))} style={inputStyle} />
                </div>
              )}
              {metodoPago === "TRANSFERENCIA" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(18,115,105,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "var(--verde-medio)", display: "flex", gap: 8 }}>
                    <Building2 size={15} color="var(--amarillo)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>Transfiere a la cuenta BCP: <strong style={{ color: "white" }}>123-456789-0-12</strong><br />A nombre de: <strong style={{ color: "white" }}>E.T. INTIWATANA S.R.L.</strong></div>
                  </div>
                  <label style={{ color: "var(--verde-medio)", fontSize: 12, display: "block", marginBottom: 5 }}>N° de operación *</label>
                  <input placeholder="Número de operación bancaria" value={datosExtra.operacion} onChange={(e) => setDatosExtra((p) => ({ ...p, operacion: e.target.value }))} style={inputStyle} />
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancelar" onClick={() => setPaso(1)} style={{ flex: 1 }}>Volver</button>
                {/* FIXED: sin position alternante — solo renderizado condicional simple */}
                <button
                  className="btn-reservar"
                  style={{
                    flex: 2,
                    opacity: (necesitaDatos && !datosExtra.operacion) || comprando ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                  disabled={comprando || (necesitaDatos && !datosExtra.operacion)}
                  onClick={() => onConfirmar(metodoPago, datosExtra)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {comprando ? (
                      <>
                        <Loader2 size={16} className="spin-icon" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Confirmar y pagar</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalBoardingPass({ boletos, viaje, onCerrar }) {
  if (!boletos || !boletos.length) return null;
  const bList = Array.isArray(boletos) ? boletos : [boletos];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--verde), #0f9183)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 0 0 8px rgba(18,115,105,0.2)" }}>
            <CheckCircle size={34} color="white" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.6rem", margin: "0 0 4px" }}>¡Compra exitosa!</h2>
          <p style={{ color: "var(--verde-medio)", fontSize: 14, margin: 0 }}>Tu{bList.length > 1 ? "s boleto" : " boleto"}{bList.length > 1 ? "s han" : " ha"} sido reservado{bList.length > 1 ? "s" : ""} correctamente</p>
        </div>

        {bList.map((boleto, idx) => {
          const origen = boleto.viaje?.ruta?.origen?.ciudad || viaje?.ruta?.origen?.ciudad || "—";
          const destino = boleto.viaje?.ruta?.destino?.ciudad || viaje?.ruta?.destino?.ciudad || "—";
          const fechaSalida = fmtFecha(boleto.viaje?.fechaHoraSalida || viaje?.fechaHoraSalida);
          const bus = boleto.viaje?.bus?.placa || viaje?.bus?.placa || "—";
          const asiento = boleto.asiento?.numeroAsiento || "—";
          const precio = boleto.precioPagado ?? viaje?.precioAdulto ?? "—";
          const numeroBoleto = boleto.numeroBoleto || "—";
          const pasajero = boleto.cliente?.nombreCompleto || boleto.cliente?.nombre || "PASAJERO";

          return (
            <div key={idx} style={{ marginBottom: idx < bList.length - 1 ? 20 : 0 }}>
              <div style={{ background: "white", borderRadius: "20px 20px 0 0", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ background: "linear-gradient(135deg, #10403B 0%, #127369 100%)", padding: "1.4rem 1.6rem", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(245,197,24,0.08)" }} />
                  <div style={{ position: "absolute", bottom: -30, left: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bus size={18} color="var(--amarillo)" />
                        <span style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>INTIWATANA S.R.L.</span>
                      </div>
                      <span style={{ background: "rgba(245,197,24,0.15)", border: "1px solid rgba(245,197,24,0.4)", color: "var(--amarillo)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>CONFIRMADO</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Origen</div>
                        <div style={{ color: "white", fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1 }}>{origen}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(245,197,24,0.2)", border: "1.5px solid rgba(245,197,24,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ArrowRight size={16} color="var(--amarillo)" />
                        </div>
                      </div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Destino</div>
                        <div style={{ color: "white", fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1 }}>{destino}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ position: "relative", height: 24, background: "white" }}>
                  <div style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.88)" }} />
                  <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.88)" }} />
                  <div style={{ position: "absolute", left: 24, right: 24, top: "50%", borderTop: "2px dashed #e5e7eb" }} />
                </div>
                <div style={{ background: "white", padding: "0.8rem 1.6rem 1.4rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Pasajero</div>
                      <div style={{ color: "#111827", fontWeight: 700, fontSize: 15 }}>{pasajero}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>N° de Boleto</div>
                      <div style={{ color: "#127369", fontWeight: 700, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all" }}>{numeroBoleto}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 0", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", marginBottom: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}><Clock size={10} /> Salida</div>
                      <div style={{ color: "#111827", fontWeight: 600, fontSize: 12 }}>{fechaSalida}</div>
                    </div>
                    <div style={{ textAlign: "center", borderLeft: "1px solid #f3f4f6", borderRight: "1px solid #f3f4f6" }}>
                      <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}><Bus size={10} /> Bus</div>
                      <div style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{bus}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}><Armchair size={10} /> Asiento</div>
                      <div style={{ color: "#127369", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{asiento}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 12 }}>
                      <CreditCard size={14} /> Total pagado
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 22, color: "#10403B" }}>S/ {typeof precio === "number" ? precio.toFixed(2) : precio}</div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: "0 0 20px 20px", padding: "1rem 1.6rem", borderTop: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 12, marginBottom: 12 }}>
                  <Info size={14} color="#127369" />
                  Presenta este boleto en la terminal al momento de abordaje.
                </div>
                <button onClick={onCerrar} style={{ width: "100%", background: "linear-gradient(135deg, #10403B, #127369)", color: "white", border: "none", borderRadius: 12, padding: "0.85rem", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Cerrar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ViajeCard({ viaje, seleccionado, onSeleccionar }) {
  const origen = viaje?.ruta?.origen?.ciudad || "—";
  const destino = viaje?.ruta?.destino?.ciudad || "—";
  const imgDestino = getImagenDestino(destino);
  const asientosLibres = viaje.asientosDisponibles ?? "—";
  const totalAsientos = viaje.totalAsientos ?? "—";
  const pctOcupado = totalAsientos && asientosLibres !== "—" ? (1 - asientosLibres / totalAsientos) : 0;
  const colorAsientos = asientosLibres > 5 ? "var(--verde)" : asientosLibres > 0 ? "#e67e22" : "#e53e3e";

  return (
    <div style={{
      background: seleccionado ? "linear-gradient(135deg, rgba(18,115,105,0.25), rgba(16,64,59,0.35))" : "rgba(255,255,255,0.03)",
      border: `1.5px solid ${seleccionado ? "var(--verde)" : "rgba(138,166,163,0.15)"}`,
      borderRadius: 16, overflow: "hidden", transition: "all 0.25s",
      boxShadow: seleccionado ? "0 0 0 2px rgba(18,115,105,0.4), 0 8px 24px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
      display: "flex", flexDirection: "column",
    }}>
      {imgDestino ? (
        <div style={{ position: "relative", height: 110, overflow: "hidden" }}>
          <img src={imgDestino} alt={destino} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)", transition: "all 0.3s" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,64,59,0.95) 0%, rgba(16,64,59,0.2) 60%, transparent 100%)" }} />
          <div style={{ position: "absolute", top: 10, right: 10, background: "var(--amarillo)", color: "var(--verde-oscuro)", borderRadius: 20, padding: "4px 12px", fontWeight: 900, fontSize: 15, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            S/ {viaje.precioAdulto}
          </div>
          <div style={{ position: "absolute", bottom: 10, left: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "white", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{origen}</span>
            <ArrowRight size={13} color="var(--amarillo)" />
            <span style={{ color: "white", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{destino}</span>
          </div>
        </div>
      ) : (
        <div style={{ background: seleccionado ? "rgba(18,115,105,0.3)" : "rgba(18,115,105,0.1)", padding: "0.8rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(138,166,163,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Navigation size={16} color="var(--amarillo)" />
            <span style={{ color: "white", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14 }}>{origen} → {destino}</span>
          </div>
          <span style={{ background: "var(--amarillo)", color: "var(--verde-oscuro)", borderRadius: 20, padding: "3px 10px", fontWeight: 900, fontSize: 14 }}>S/ {viaje.precioAdulto}</span>
        </div>
      )}
      <div style={{ padding: "0.9rem 1rem", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <Clock size={14} color="var(--verde-medio)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ color: "var(--verde-medio)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Salida</div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 12 }}>{fmtFecha(viaje.fechaHoraSalida)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <Bus size={14} color="var(--verde-medio)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ color: "var(--verde-medio)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bus</div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 12 }}>{viaje.bus?.placa || "—"}</div>
              {viaje.bus?.tipo && <div style={{ color: "var(--verde-medio)", fontSize: 11 }}>{viaje.bus.tipo}</div>}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Armchair size={13} color={colorAsientos} />
              <span style={{ color: "var(--verde-medio)", fontSize: 12 }}>Asientos disponibles</span>
            </div>
            <span style={{ color: colorAsientos, fontWeight: 700, fontSize: 13 }}>{asientosLibres} / {totalAsientos}</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(138,166,163,0.15)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${pctOcupado * 100}%`, background: colorAsientos, transition: "width 0.4s ease" }} />
          </div>
        </div>
        <button className="btn-reservar" style={{ width: "100%", padding: "9px 16px", fontSize: 13, display: "flex", gap: 7, alignItems: "center", justifyContent: "center", background: seleccionado ? "linear-gradient(135deg, var(--verde), #0f9183)" : "linear-gradient(135deg, var(--amarillo), #e6b800)", color: seleccionado ? "white" : "var(--verde-oscuro)" }} onClick={() => onSeleccionar(viaje)}>
          <Armchair size={15} /> {seleccionado ? "Cambiar asiento" : "Elegir asiento"}
        </button>
      </div>
    </div>
  );
}

export default function PasajesPageWrapper() {
  return <ErrorBoundary><PasajesPage /></ErrorBoundary>;
}

function PasajesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destinoParam = searchParams.get("destino") || "";
  const fechaParam = searchParams.get("fecha") || "";

  const headersRef = useRef(null);
  headersRef.current = session
    ? { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }
    : { "Content-Type": "application/json" };
  const headers = headersRef.current;

  const [sucursales, setSucursales] = useState([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(true);
  const [errorSucursales, setErrorSucursales] = useState(false);
  const [origenId, setOrigenId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [fecha, setFecha] = useState(fechaParam);
  const [viajes, setViajes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [viajeSelec, setViajeSelec] = useState(null);
  const [asientos, setAsientos] = useState([]);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);
  const [asientosSel, setAsientosSel] = useState([]);
  const [modalMapa, setModalMapa] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [boletosOk, setBoletosOk] = useState(null);
  const [error, setError] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [modalPagoCarrito, setModalPagoCarrito] = useState(false);
  const [procesandoCarrito, setProcesandoCarrito] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [tabActivo, setTabActivo] = useState("pasajes");

  const cargarSucursales = useCallback(async () => {
    setCargandoSucursales(true); setErrorSucursales(false);
    const urls = ["/api/v1/sucursales", "/api/v1/sucursales/terminales"];
    for (const url of urls) {
      try {
        const r = await fetch(url);
        if (!r.ok) { console.warn("GET", url, "→", r.status); continue; }
        const data = await r.json();
        const lista = Array.isArray(data) ? data
          : Array.isArray(data?.content) ? data.content : [];
        if (lista.length > 0) {
          const unicas = lista.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
          setSucursales(unicas);
          setCargandoSucursales(false);
          return;
        }
        console.warn(url, "devolvió lista vacía");
      } catch (e) { console.warn("Error fetch", url, e.message); }
    }
    if (headersRef.current?.Authorization) {
      try {
        const r = await fetch("/api/v1/sucursales", { headers: headersRef.current });
        if (r.ok) {
          const data = await r.json();
          const lista = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
          if (lista.length > 0) { setSucursales(lista.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)); setCargandoSucursales(false); return; }
        }
      } catch (e) { console.warn("Error con token:", e.message); }
    }
    setErrorSucursales(true);
    setCargandoSucursales(false);
  }, []);

  useEffect(() => { cargarSucursales(); }, []);

  const buscarViajes = async (oId, dId) => {
    if (!oId || !dId) { setError("Selecciona origen y destino"); return; }
    if (String(oId) === String(dId)) { setError("El origen y destino no pueden ser iguales"); return; }
    setError(""); setBuscando(true); setViajes([]); setViajeSelec(null); setAsientos([]); setAsientosSel([]);
    try {
      const paramsObj = { origenId: oId, destinoId: dId, page: 0, size: 20 };
      if (fecha) { paramsObj.desde = `${fecha}T00:00:00`; paramsObj.hasta = `${fecha}T23:59:59`; }
      const params = new URLSearchParams(paramsObj);
      const res = await fetch(`/api/v1/viajes/disponibles?${params}`);
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.mensaje || err.message || `Error del servidor (${res.status})`); }
      const data = await res.json();
      const lista = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setViajes(lista); setBuscado(true);
    } catch (err) {
      setError(err.message || "Error al buscar viajes."); setViajes([]); setBuscado(true);
    } finally { setBuscando(false); }
  };

  const buscar = (e) => { e.preventDefault(); buscarViajes(origenId, destinoId); };

  const didAutoSearch = useRef(false);
  useEffect(() => {
    if (!destinoParam || !sucursales.length || didAutoSearch.current) return;
    const lower = destinoParam.toLowerCase().replace(/%20/g, " ");
    const found = sucursales.find((s) =>
      s.ciudad?.toLowerCase().includes(lower) ||
      s.nombre?.toLowerCase().includes(lower) ||
      lower.includes(s.ciudad?.toLowerCase() || "____")
    );
    if (!found) return;
    const ayacucho = sucursales.find((s) => s.ciudad?.toLowerCase().includes("ayacucho"));
    const primerOrigen = sucursales.find((s) => s.id !== found.id);
    const oId = ayacucho && ayacucho.id !== found.id
      ? String(ayacucho.id)
      : primerOrigen ? String(primerOrigen.id) : null;
    if (!oId) return;
    didAutoSearch.current = true;
    setOrigenId(oId);
    setDestinoId(String(found.id));
    buscarViajes(oId, String(found.id));
  }, [sucursales, destinoParam]);

  const seleccionarViaje = async (viaje) => {
    setViajeSelec(viaje); setAsientosSel([]); setCargandoAsientos(true); setModalMapa(true);
    try {
      const res = await fetch(`/api/v1/viajes/${viaje.id}/asientos`, { headers });
      const data = await res.json();
      setAsientos(Array.isArray(data) ? data : []);
    } catch { setAsientos([]); }
    finally { setCargandoAsientos(false); }
  };

  const toggleAsiento = (asiento) => {
    setAsientosSel((prev) => prev.find((a) => a.id === asiento.id) ? prev.filter((a) => a.id !== asiento.id) : [...prev, asiento]);
  };

  const agregarPasajesAlCarrito = () => {
    if (!viajeSelec || !asientosSel.length) return;
    const precio = parseFloat(viajeSelec.precioAdulto || viajeSelec.precioOficial || viajeSelec.precio || 0);
    const nuevos = asientosSel.map((a) => ({ id: `pas-${Date.now()}-${a.id}`, tipo: "pasaje", descripcion: `${viajeSelec.ruta?.origen?.ciudad} → ${viajeSelec.ruta?.destino?.ciudad} · Asiento N°${a.numeroAsiento} · ${fmtFecha(viajeSelec.fechaHoraSalida)}`, precio, datos: { viajeId: viajeSelec.id, asientoId: a.id } }));
    setCarrito((prev) => [...prev, ...nuevos]);
    setCarritoAbierto(true); setModalMapa(false);
  };

  const confirmarCompra = async (metodoPago, datosExtra) => {
    if (!session) { navigate("/login"); return; }
    setComprando(true); setError("");
    const resultados = [];
    try {
      for (const asiento of asientosSel) {
        const body = { viajeId: viajeSelec.id, asientoId: asiento.id, clienteId: session.clienteId || 0, metodoPago, referenciaPago: datosExtra.operacion || null, observaciones: `Portal web · ${metodoPago}` };
        const res = await fetch("/api/v1/boletos/comprar", { method: "POST", headers, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.mensaje || d.message || `Error en asiento N°${asiento.numeroAsiento}`); }
        const boleto = await res.json();
        resultados.push(boleto);
        setAsientos((prev) => prev.map((a) => a.id === asiento.id ? { ...a, estado: "VENDIDO" } : a));
      }
      setModalPago(false);
      setModalMapa(false);
      setAsientosSel([]);
      setTimeout(() => { setBoletosOk(resultados); }, 50);
    } catch (err) { setError(err.message || "Error al procesar la compra."); }
    finally { setComprando(false); }
  };

  const confirmarPagoCarrito = async (metodoPago, datosExtra) => {
    if (!session) { navigate("/login"); return; }
    setProcesandoCarrito(true); setError("");
    const errores = [];
    try {
      for (const item of carrito.filter((i) => i.tipo === "pasaje")) {
        try {
          const body = { viajeId: item.datos.viajeId, asientoId: item.datos.asientoId, clienteId: session.clienteId || 0, metodoPago, referenciaPago: datosExtra.operacion || null, observaciones: `Carrito · ${metodoPago}` };
          const res = await fetch("/api/v1/boletos/comprar", { method: "POST", headers, body: JSON.stringify(body) });
          if (!res.ok) { const d = await res.json().catch(() => ({})); errores.push(d.mensaje || d.message || `Error en pasaje`); }
        } catch (e) { errores.push(e.message); }
      }
      for (const item of carrito.filter((i) => i.tipo === "encomienda")) {
        try {
          const d = item.datos;
          const payload = { sucursalOrigenId: Number(d.origenId), sucursalDestinoId: Number(d.destinoId), destinatarioNombre: d.destinatario, destinatarioTelefono: d.telefono || "", descripcionContenido: d.descripcion || "Sin descripción", pesoKg: parseFloat(String(d.peso).replace(",", ".")) || 0, metodoPago, referenciaPago: datosExtra.operacion || null, observaciones: `Remitente: ${d.remitente}`, costo: item.precio };
          const res = await fetch("/api/v1/encomiendas/solicitar", { method: "POST", headers, body: JSON.stringify(payload) });
          if (!res.ok) { const rd = await res.json().catch(() => ({})); errores.push(rd.mensaje || rd.message || `Error en encomienda`); }
        } catch (e) { errores.push(e.message); }
      }
      if (errores.length) setError("Algunos items tuvieron errores: " + errores.join(" | "));
      setCarrito([]); setModalPagoCarrito(false); setPagoExitoso(true);
      setTimeout(() => setPagoExitoso(false), 6000);
    } catch (err) { setError(err.message || "Error inesperado."); }
    finally { setProcesandoCarrito(false); }
  };

  const getPrecioViaje = (viaje) => parseFloat(viaje?.precioAdulto ?? viaje?.precioOficial ?? viaje?.precio ?? 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--fondo)" }}>
      <nav className="nav">
        <div className="nav-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <LogoSVG width={44} height={44} />
          <div className="nav-brand">INTIWATANA S.R.L.<span>Transportes</span></div>
        </div>
        <ul className="nav-links hidden md:flex items-center">
          <li><a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Inicio</a></li>
          <li><a onClick={() => setTabActivo("pasajes")} style={{ cursor: "pointer", color: tabActivo === "pasajes" ? "var(--amarillo)" : undefined, display: "flex", alignItems: "center", gap: 6 }}><Ticket size={15} /> Pasajes</a></li>
          <li><a onClick={() => setTabActivo("encomiendas")} style={{ cursor: "pointer", color: tabActivo === "encomiendas" ? "var(--amarillo)" : undefined, display: "flex", alignItems: "center", gap: 6 }}><Package size={15} /> Encomiendas</a></li>
        </ul>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setCarritoAbierto(true)} style={{ position: "relative", background: carrito.length > 0 ? "rgba(245,197,24,0.15)" : "rgba(255,255,255,0.06)", border: carrito.length > 0 ? "1.5px solid rgba(245,197,24,0.5)" : "1.5px solid rgba(138,166,163,0.2)", borderRadius: 10, color: carrito.length > 0 ? "var(--amarillo)" : "var(--verde-medio)", cursor: "pointer", padding: "0.45rem 0.9rem", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
            <ShoppingCart size={16} /> Carrito
            {carrito.length > 0 && <span style={{ background: "var(--amarillo)", color: "var(--verde-oscuro)", borderRadius: 50, fontSize: 10, fontWeight: 900, padding: "1px 6px", marginLeft: 2 }}>{carrito.length}</span>}
          </button>
          {session ? (
            <button className="btn-admin-nav btn-registrarse" onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LayoutDashboard size={15} /> {session.nombreCompleto?.split(" ")[0] || "Mi cuenta"}
            </button>
          ) : (
            <button className="btn-admin-nav btn-registrarse" onClick={() => navigate("/login")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LogIn size={15} /> Entrar
            </button>
          )}
        </div>
      </nav>

      {pagoExitoso && (
        <div style={{ background: "linear-gradient(135deg, rgba(18,115,105,0.98), rgba(16,64,59,0.99))", border: "1px solid rgba(245,197,24,0.5)", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
          <CheckCircle size={20} color="var(--amarillo)" />
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>¡Pago procesado con éxito! Revisa tu historial de compras.</span>
          <button onClick={() => setPagoExitoso(false)} style={{ background: "transparent", border: "none", color: "var(--verde-medio)", cursor: "pointer" }}><X size={16} /></button>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", padding: "0.8rem 2rem", display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <AlertTriangle size={18} color="#fca5a5" />
          <span style={{ color: "#fca5a5", fontSize: 14 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer" }}><X size={16} /></button>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg, var(--verde-oscuro) 0%, var(--verde) 100%)", padding: "2.5rem 2rem 3.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.25)", borderRadius: 50, padding: "4px", gap: 4, marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
          {[
            { key: "pasajes", label: "Comprar Pasaje", icon: <Ticket size={15} /> },
            { key: "encomiendas", label: "Enviar Encomienda", icon: <Package size={15} /> },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setTabActivo(tab.key)} style={{ background: tabActivo === tab.key ? "var(--amarillo)" : "transparent", color: tabActivo === tab.key ? "var(--verde-oscuro)" : "rgba(255,255,255,0.75)", border: "none", borderRadius: 50, padding: "0.55rem 1.4rem", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 7 }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {tabActivo === "pasajes" && (
          <>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "white", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>Busca tu viaje</h1>
            <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "2rem", position: "relative", zIndex: 1 }}>Selecciona tu origen y destino para ver los viajes disponibles</p>
            {cargandoSucursales ? (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span className="spin-icon"><Loader2 size={16} /></span> Cargando terminales...</p>
            ) : errorSucursales ? (
              <div style={{ color: "#fca5a5", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <AlertTriangle size={16} /> No se pudieron cargar las sucursales.{" "}
                <button onClick={cargarSucursales} style={{ background: "none", border: "none", color: "var(--amarillo)", cursor: "pointer", fontWeight: 700 }}>Reintentar</button>
              </div>
            ) : (
              <form onSubmit={buscar} translate="no" style={{ background: "white", borderRadius: 60, padding: "0.5rem 0.5rem 0.5rem 1.2rem", display: "inline-flex", gap: "0.8rem", alignItems: "center", maxWidth: 660, width: "100%", boxShadow: "0 8px 32px rgba(16,64,59,0.4)", position: "relative", zIndex: 1 }}>
                <MapPin size={18} color="var(--verde-oscuro)" />
                <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} required style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0" }}>
                  <option value="">Origen</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}
                </select>
                <div style={{ width: 1, height: 28, background: "#ddd" }} />
                <Flag size={18} color="var(--verde-oscuro)" />
                <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0" }}>
                  <option value="">Destino</option>
                  {sucursales.filter((s) => s.id !== Number(origenId)).map((s) => <option key={s.id} value={s.id}>{s.ciudad}</option>)}
                </select>
                <div style={{ width: 1, height: 28, background: "#ddd" }} />
                <Calendar size={18} color="var(--verde-oscuro)" />
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "var(--verde-oscuro)", background: "transparent", padding: "0.5rem 0", fontFamily: "inherit" }} />
                {/* FIXED: sin position alternante en el spinner */}
                <button type="submit" className="btn-buscar" disabled={buscando}
                  style={{ borderRadius: 50, padding: "0.7rem 1.5rem", flexShrink: 0, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {buscando
                    ? <span className="spin-icon"><Loader2 size={16} /></span>
                    : <><Search size={16} /> Buscar</>
                  }
                </button>
              </form>
            )}
          </>
        )}

        {tabActivo === "encomiendas" && (
          <>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "white", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>Envía tu encomienda</h1>
            <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>Rápido, seguro y al mejor precio — llega con nuestros buses</p>
          </>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {tabActivo === "encomiendas" && (
          <div>
            {!session && (
              <div style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: 12, padding: "1rem 1.4rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 12 }}>
                <Info size={20} color="var(--amarillo)" />
                <div style={{ flex: 1, fontSize: 13, color: "var(--amarillo)" }}>
                  <strong>Inicia sesión</strong> para guardar tus encomiendas y hacer seguimiento.{" "}
                  <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>Entrar aquí</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
              <Package size={28} color="var(--amarillo)" />
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--blanco)", fontSize: "1.5rem", marginBottom: 2 }}>Solicitar envío de encomienda</h2>
                <p style={{ color: "var(--verde-medio)", fontSize: 13 }}>Completa el formulario y agrega al carrito para pagar junto con tus pasajes</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
              <FormEncomienda sucursales={sucursales} onAgregarAlCarrito={(item) => { setCarrito((prev) => [...prev, item]); setCarritoAbierto(true); }} />
              <div style={{ background: "rgba(18,115,105,0.1)", border: "1px solid rgba(18,115,105,0.2)", borderRadius: 14, padding: "1.2rem" }}>
                <h3 style={{ color: "white", fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><CreditCard size={16} color="var(--amarillo)" /> Tarifas de envío</h3>
                {[
                  { tipo: "Normal", precio: "S/ 10", desc: "Hasta 5 kg · 3–5 días", icon: <Package size={14} /> },
                  { tipo: "Express", precio: "S/ 18", desc: "Hasta 5 kg · 24 horas", icon: <Zap size={14} /> },
                  { tipo: "Frágil", precio: "S/ 22", desc: "Hasta 5 kg · Cuidado especial", icon: <AlertTriangle size={14} /> },
                ].map((t) => (
                  <div key={t.tipo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(138,166,163,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--verde-medio)" }}>{t.icon}</span>
                      <div>
                        <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{t.tipo}</div>
                        <div style={{ color: "var(--verde-medio)", fontSize: 11 }}>{t.desc}</div>
                      </div>
                    </div>
                    <span style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 15 }}>{t.precio}</span>
                  </div>
                ))}
                <p style={{ color: "var(--verde-medio)", fontSize: 11, marginTop: 10 }}>+S/ 2 por cada kg adicional a los primeros 5 kg</p>
              </div>
            </div>
          </div>
        )}

        {tabActivo === "pasajes" && (
          <>
            {buscando && (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--verde-medio)", fontSize: 15 }}>
                <span className="spin-icon"><Loader2 size={40} style={{ marginBottom: 16, opacity: 0.6 }} /></span>
                <p style={{ fontWeight: 600 }}>Buscando viajes disponibles...</p>
              </div>
            )}
            {buscado && !buscando && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <Bus size={24} color="var(--amarillo)" />
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--blanco)", fontSize: "1.4rem", margin: 0 }}>
                    {viajes.length === 0 ? "Sin viajes para esta ruta" : `${viajes.length} viaje(s) disponible(s)`}
                  </h2>
                </div>
                {viajes.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.2rem" }}>
                    {viajes.map((v) => <ViajeCard key={v.id} viaje={v} seleccionado={viajeSelec?.id === v.id} onSeleccionar={seleccionarViaje} />)}
                  </div>
                )}
                {viajes.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--verde-medio)" }}>
                    <Frown size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ fontWeight: 600, color: "white", marginBottom: 8 }}>No encontramos viajes disponibles</p>
                    <p style={{ fontSize: 13 }}>Prueba con otra fecha o diferente combinación de origen/destino.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {modalMapa && viajeSelec && createPortal(
        <div className="modal-overlay" onClick={() => setModalMapa(false)}>
          <div className="modal" style={{ maxWidth: 700, width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-badge"><Armchair size={22} /></div>
              <div>
                <div className="modal-title">Elige tus asientos</div>
                <div className="modal-subtitle">Puedes seleccionar uno o varios asientos</div>
              </div>
              <button className="modal-close" onClick={() => setModalMapa(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ background: "var(--fondo)" }}>
              {cargandoAsientos ? (
                <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--verde-medio)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span className="spin-icon"><Loader2 size={20} /></span> Cargando mapa de asientos...
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
                  <MapaAsientos asientos={asientos} seleccionados={asientosSel} onSeleccionar={toggleAsiento} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "rgba(18,115,105,0.12)", border: "1px solid rgba(18,115,105,0.25)", borderRadius: 12, padding: "1.2rem" }}>
                      <h3 style={{ color: "white", fontWeight: 600, marginBottom: 16, fontSize: 16, borderBottom: "1px solid rgba(138,166,163,0.2)", paddingBottom: 10 }}>Resumen de selección</h3>
                      {(() => {
                        const selList = asientosSel;
                        const precioUnit = getPrecioViaje(viajeSelec);
                        const totalSel = selList.length * precioUnit;
                        return selList.length === 0 ? (
                          <>
                            <p style={{ color: "var(--verde-medio)", fontSize: 13, fontStyle: "italic" }}>No has seleccionado ningún asiento aún.</p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(138,166,163,0.2)" }}>
                              <span style={{ color: "var(--verde-medio)", fontSize: 13 }}>Total (0 asientos)</span>
                              <span style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 20 }}>S/ 0.00</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                              {selList.map((a) => (
                                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                                  <span style={{ color: "var(--verde-medio)", display: "flex", alignItems: "center", gap: 5 }}><Armchair size={13} /> Asiento {a.numeroAsiento}</span>
                                  <span style={{ color: "white", fontWeight: 700 }}>S/ {precioUnit.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(138,166,163,0.2)" }}>
                              <span style={{ color: "var(--verde-medio)", fontSize: 13 }}>Total ({selList.length} asientos)</span>
                              <span style={{ color: "var(--amarillo)", fontWeight: 800, fontSize: 20 }}>S/ {totalSel.toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    {!session && (
                      <div style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--amarillo)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Info size={15} /> Necesitas{" "}
                        <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontWeight: 700, padding: 0, textDecoration: "underline" }}>iniciar sesión</button> para comprar.
                      </div>
                    )}
                    <button className="btn-reservar" style={{ width: "100%", padding: "0.9rem", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, opacity: asientosSel.length === 0 ? 0.5 : 1 }} disabled={asientosSel.length === 0} onClick={() => { if (!session) { navigate("/login"); return; } setModalPago(true); }}>
                      <CreditCard size={17} /> Pagar ahora
                    </button>
                    <button style={{ width: "100%", padding: "0.9rem", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, background: "rgba(18,115,105,0.4)", border: "1px solid var(--verde)", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: asientosSel.length === 0 ? 0.5 : 1 }} disabled={asientosSel.length === 0} onClick={agregarPasajesAlCarrito}>
                      <ShoppingCart size={17} /> Agregar al carrito
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        , document.body)}

      {createPortal(
        <CarritoSidebar items={carrito} onRemove={(id) => setCarrito((prev) => prev.filter((i) => i.id !== id))} onCheckout={() => { if (!session) { navigate("/login"); return; } setCarritoAbierto(false); setModalPagoCarrito(true); }} open={carritoAbierto} onClose={() => setCarritoAbierto(false)} />,
        document.body
      )}

      {modalPago && createPortal(<ModalPago viaje={viajeSelec} asientosSeleccionados={asientosSel} onConfirmar={confirmarCompra} onCerrar={() => setModalPago(false)} comprando={comprando} />, document.body)}
      {modalPagoCarrito && createPortal(<ModalPago itemsCarrito={carrito} onConfirmar={confirmarPagoCarrito} onCerrar={() => setModalPagoCarrito(false)} comprando={procesandoCarrito} />, document.body)}
      {boletosOk && !modalPago && !modalMapa && createPortal(<ModalBoardingPass boletos={boletosOk} viaje={viajeSelec} onCerrar={() => { setBoletosOk(null); }} />, document.body)}
    </div>
  );
} 