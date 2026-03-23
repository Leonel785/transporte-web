import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

// ── Registro ─────────────────────────────────────────
function RegisterForm({ onVolver }) {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    nombres: "", apellidos: "", dniRuc: "", telefono: "",
    email: "", username: "", password: "", confirmar: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [ok, setOk]           = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/clientes/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres:   form.nombres,
          apellidos: form.apellidos,
          dniRuc:    form.dniRuc,
          telefono:  form.telefono  || null,
          email:     form.email     || null,
          username:  form.username,
          password:  form.password,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        // El GlobalExceptionHandler devuelve { mensaje, errores: [...] }
        const msg = d.errores?.join(", ") || d.mensaje || d.message || "Error al registrarse";
        throw new Error(msg);
      }
      const data = await res.json();
      login(data.token, data.username, data.rol || "ROLE_CLIENTE");
      navigate("/cliente", { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel-inner">
      <div className="auth-panel-header">
        <button type="button" className="auth-back-btn" onClick={onVolver}>
          ← Volver
        </button>
        <h3 className="auth-title">Crear cuenta</h3>
        <p className="auth-sub">Regístrate para acceder a tu historial y seguimiento</p>
      </div>

      {error && <div className="auth-error">⚠ {error}</div>}

      <form onSubmit={submit} className="auth-form-scroll">
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
            <label>DNI *</label>
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
        <div className="auth-field">
          <label>Usuario *</label>
          <input name="username" value={form.username} onChange={handle}
            placeholder="Elige un nombre de usuario" required />
        </div>
        <div className="auth-grid-2">
          <div className="auth-field">
            <label>Contraseña *</label>
            <input name="password" type="password" value={form.password} onChange={handle}
              placeholder="••••••••" required />
          </div>
          <div className="auth-field">
            <label>Confirmar *</label>
            <input name="confirmar" type="password" value={form.confirmar} onChange={handle}
              placeholder="••••••••" required />
          </div>
        </div>
        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Crear cuenta →"}
        </button>
        <p className="auth-footer-note">
          Al registrarte, aceptas nuestros términos de servicio.
        </p>
      </form>
    </div>
  );
}

// ── Login Principal ────────────────────────────────────
export default function Login({ onIrRegistro }) {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab]         = useState("cliente");
  const [form, setForm]       = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

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
        throw new Error(data.errores?.join(", ") || data.mensaje || data.message || "Usuario o contraseña incorrectos");
      }
      const data = await res.json();
      const rol = data.rol || (tab === "admin" ? "ROLE_ADMIN" : "ROLE_CLIENTE");
      login(data.token, data.username || form.username, rol);
      const esAdmin = rol === "ROLE_ADMIN" || rol === "ROLE_CAJERO" || rol === "ROLE_CHOFER";
      navigate(esAdmin ? "/admin" : "/cliente", { replace: true });
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
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === "cliente" ? "active" : ""}`}
              onClick={() => cambiarTab("cliente")}
            >
              <span>👤</span> Soy cliente
            </button>
            <button
              className={`auth-tab ${tab === "admin" ? "active" : ""}`}
              onClick={() => cambiarTab("admin")}
            >
              <span>🛠</span> Administrador
            </button>
          </div>

          {tab === "cliente" ? (
            <>
              <h3 className="auth-title">Bienvenido</h3>
              <p className="auth-sub">Ingresa a tu cuenta para ver tus viajes y encomiendas</p>
            </>
          ) : (
            <>
              <h3 className="auth-title">Panel Admin</h3>
              <p className="auth-sub">Ingresa tus credenciales de administrador</p>
            </>
          )}

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={submit}>
            <div className="auth-field">
              <label>Usuario</label>
              <input
                name="username" type="text"
                placeholder={tab === "admin" ? "admin" : "tu_usuario"}
                value={form.username} onChange={handle} required autoFocus
              />
            </div>
            <div className="auth-field">
              <label>Contraseña</label>
              <input
                name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={handle} required
              />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Ingresar →"}
            </button>
          </form>

          {tab === "cliente" && (
            <p className="auth-register-link">
              ¿No tienes cuenta?{" "}
              <button onClick={onIrRegistro}>
                Regístrate gratis
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel izquierdo dinámico ───────────────────────────
function LeftPanel({ tab }) {
  const features = tab === "admin"
    ? ["Gestión de rutas y destinos", "Control de sucursales", "Administración de viajes", "Gestión de usuarios"]
    : ["Historial de tus viajes", "Seguimiento de encomiendas en tiempo real", "Consulta de próximos viajes", "Gestión de tu cuenta"];

  const titulo = tab === "admin" ? <>Panel de<br />administración</> : <>Tu cuenta<br />Intiwatana</>;
  const desc   = tab === "admin"
    ? "Gestiona rutas, horarios y terminales de toda la red de transporte."
    : "Accede a tu historial de viajes y haz seguimiento de tus encomiendas desde cualquier lugar.";

  return (
    <div className="login-left">
      <div className="login-brand">
        <LogoSVG width={64} height={64} />
        <div>
          <div className="login-brand-sub">Emp. de Transportes</div>
          <div className="login-brand-name">INTIWATANA S.R.L.</div>
        </div>
      </div>
      <div className="login-left-body">
        <h2 className="login-left-title">{titulo}</h2>
        <p className="login-left-desc">{desc}</p>
        <ul className="login-features">
          {features.map((f) => (
            <li key={f}><span className="lf-dot" />{f}</li>
          ))}
        </ul>
      </div>
      <div className="login-left-foot">© 2026 Intiwatana S.R.L. · Ayacucho, Perú</div>
    </div>
  );
}

export { RegisterForm, LeftPanel };
