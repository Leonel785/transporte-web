import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ── Panel izquierdo decorativo ─────────────────────────
export function LeftPanel({ tab }) {
  return (
    <div className="login-left">
      <div className="login-left-pattern" />
      <div className="login-left-body">
        <div>
          <LogoSVG width={56} height={56} style={{ marginBottom: "1rem" }} />
          <div className="login-left-title">INTIWATANA</div>
          <div className="login-left-desc">
            {tab === "admin"
              ? "Panel de administración seguro para gestionar tu flota de transporte"
              : "Viaja seguro por los Andes peruanos. Reserva tu pasaje en línea."}
          </div>
        </div>
        <ul className="login-features">
          {tab === "admin" ? (
            <>
              <li>
                <span className="lf-dot" />
                Gestión de rutas y viajes
              </li>
              <li>
                <span className="lf-dot" />
                Control de flota
              </li>
              <li>
                <span className="lf-dot" />
                Seguimiento de encomiendas
              </li>
              <li>
                <span className="lf-dot" />
                Administración de clientes
              </li>
            </>
          ) : (
            <>
              <li>
                <span className="lf-dot" />
                Reserva tu pasaje online
              </li>
              <li>
                <span className="lf-dot" />
                Elige tu asiento
              </li>
              <li>
                <span className="lf-dot" />
                Rastrea tus encomiendas
              </li>
              <li>
                <span className="lf-dot" />
                Historial de viajes
              </li>
            </>
          )}
        </ul>
      </div>
      <div className="login-left-foot">
        © 2026 INTIWATANA S.R.L. · Todos los derechos reservados
      </div>
    </div>
  );
}

// ── Formulario de registro ─────────────────────────────
export function RegisterForm({ onVolver }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombres: "", apellidos: "", dniRuc: "", telefono: "",
    email: "", username: "", password: "", confirmar: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paso, setPaso] = useState(1);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const avanzar = (e) => {
    e.preventDefault();
    if (!form.nombres || !form.apellidos || !form.dniRuc || !form.email) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError("");
    setPaso(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/clientes/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres: form.nombres,
          apellidos: form.apellidos,
          dniRuc: form.dniRuc,
          telefono: form.telefono || null,
          email: form.email || null,
          username: form.username,
          password: form.password,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = d.errores?.join(", ") || d.mensaje || d.message || "Error al registrarse";
        throw new Error(msg);
      }
      const data = await res.json();
      // ✅ Pasar toda la respuesta del backend
      login(data);
      // ✅ Redirigir a reservar pasajes
      navigate("/pasajes", { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel-inner">
      <div className="auth-panel-header">
        <button type="button" className="auth-back-btn" onClick={paso === 2 ? () => setPaso(1) : onVolver}>
          ← {paso === 2 ? "Anterior" : "Volver"}
        </button>
        <h3 className="auth-title">Crear cuenta</h3>
        <p className="auth-sub">Regístrate para comprar pasajes y rastrear encomiendas</p>

        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          {[1, 2].map((n) => (
            <div key={n} style={{
              width: 32, height: 4, borderRadius: 2,
              background: paso >= n ? "var(--amarillo)" : "rgba(138,166,163,0.3)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--verde-medio)", marginTop: 6, textAlign: "center" }}>
          Paso {paso} de 2
        </p>
      </div>

      {error && <div className="auth-error">⚠ {error}</div>}

      {paso === 1 ? (
        <form onSubmit={avanzar} className="auth-form-scroll">
          <div className="auth-grid-2">
            <div className="auth-field">
              <label>Nombre *</label>
              <input name="nombres" value={form.nombres} onChange={handle}
                placeholder="Juan" required />
            </div>
            <div className="auth-field">
              <label>Apellido *</label>
              <input name="apellidos" value={form.apellidos} onChange={handle}
                placeholder="Pérez" required />
            </div>
            <div className="auth-field">
              <label>DNI / RUC *</label>
              <input name="dniRuc" value={form.dniRuc} onChange={handle}
                placeholder="12345678" required minLength={7} maxLength={15} />
            </div>
            <div className="auth-field">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handle}
                placeholder="9XX XXX XXX" />
            </div>
          </div>
          <div className="auth-field">
            <label>Correo electrónico *</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              placeholder="correo@ejemplo.com" required />
          </div>
          <button className="auth-btn" type="submit">
            Continuar →
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="auth-form-scroll">
          <div className="auth-field">
            <label>Nombre de usuario *</label>
            <input name="username" value={form.username} onChange={handle}
              placeholder="Elige un usuario único" required />
          </div>
          <div className="auth-grid-2">
            <div className="auth-field">
              <label>Contraseña *</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                placeholder="Mín. 6 caracteres" required minLength={6} />
            </div>
            <div className="auth-field">
              <label>Confirmar *</label>
              <input name="confirmar" type="password" value={form.confirmar} onChange={handle}
                placeholder="Repite la contraseña" required />
            </div>
          </div>
          <div style={{
            background: "rgba(18,115,105,0.1)", border: "1px solid rgba(18,115,105,0.2)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13,
            color: "var(--verde-medio)",
          }}>
            <strong style={{ color: "var(--blanco)", display: "block", marginBottom: 4 }}>
              Resumen de tu cuenta
            </strong>
            {form.nombres} {form.apellidos} · DNI: {form.dniRuc} · {form.email}
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "✓ Crear cuenta →"}
          </button>
          <p className="auth-footer-note">
            Al registrarte, aceptas nuestros términos de servicio.
          </p>
        </form>
      )}
    </div>
  );
}

// ── Login Principal ────────────────────────────────────
export default function Login({ onIrRegistro }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("cliente");
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const cambiarTab = (t) => { setTab(t); setError(""); setForm({ username: "", password: "" }); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.mensaje || data.message || "Usuario o contraseña incorrectos");
      }
      const data = await res.json();
      // ✅ Pasar toda la respuesta del backend
      login(data);

      // ✅ Redireccionar según el rol
      if (data.rol === "ROLE_CLIENTE") {
        navigate("/pasajes", { replace: true });
      } else if (["ROLE_ADMIN", "ROLE_CAJERO", "ROLE_CHOFER"].includes(data.rol)) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <LeftPanel tab={tab} />
      <div className="login-right">
        <div className="login-box">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === "cliente" ? "active" : ""}`} onClick={() => cambiarTab("cliente")}>
              <span>👤</span> Soy cliente
            </button>
            <button className={`auth-tab ${tab === "admin" ? "active" : ""}`} onClick={() => cambiarTab("admin")}>
              <span>🛠</span> Administrador
            </button>
          </div>

          {tab === "cliente" ? (
            <>
              <h3 className="auth-title">Bienvenido</h3>
              <p className="auth-sub">Ingresa para reservar tu pasaje</p>
            </>
          ) : (
            <>
              <h3 className="auth-title">Panel Admin</h3>
              <p className="auth-sub">Ingresa tus credenciales de administrador</p>
            </>
          )}

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label>Usuario</label>
              <input name="username" value={form.username} onChange={handle}
                placeholder="tu_usuario" required autoFocus />
            </div>
            <div className="auth-field">
              <label>Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                placeholder="••••••••" required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar →"}
            </button>
          </form>

          {tab === "cliente" && (
            <p className="auth-footer-note">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--amarillo)", cursor: "pointer", fontWeight: 700, fontSize: "inherit" }}
                onClick={() => navigate("/registrar")}
              >
                Regístrate gratis
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}