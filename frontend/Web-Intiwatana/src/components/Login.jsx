import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LogoSVG from "./LogoSVG";

export default function Login() {
  const { login } = useAuth();
  const [form,     setForm]     = useState({ username: "", password: "" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
        throw new Error(data.message || "Usuario o contraseña incorrectos");
      }
      const data = await res.json();
      login(data.token, form.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      {/* Panel izquierdo */}
      <div className="login-left">
        <div className="login-brand">
          <LogoSVG width={64} height={64} />
          <div>
            <div className="login-brand-sub">Emp. de Transportes</div>
            <div className="login-brand-name">INTIWATANA S.R.L.</div>
          </div>
        </div>
        <div className="login-left-body">
          <h2 className="login-left-title">Panel de<br />administración</h2>
          <p className="login-left-desc">
            Gestiona rutas, horarios y terminales de toda la red de transporte.
          </p>
          <ul className="login-features">
            {["Gestión de rutas y destinos", "Control de sucursales", "Administración de viajes", "Gestión de usuarios"].map((f) => (
              <li key={f}><span className="lf-dot" />{f}</li>
            ))}
          </ul>
        </div>
        <div className="login-left-foot">© 2026 Intiwatana S.R.L. · Ayacucho, Perú</div>
      </div>

      {/* Panel derecho */}
      <div className="login-right">
        <div className="login-box">
          <h3 className="lf-title">Iniciar sesión</h3>
          <p className="lf-sub">Ingresa tus credenciales de administrador</p>

          {error && <div className="lf-error">⚠ {error}</div>}

          <form onSubmit={submit}>
            <div className="lf-field">
              <label>Usuario</label>
              <input
                name="username" type="text" placeholder="admin"
                value={form.username} onChange={handle} required autoFocus
              />
            </div>
            <div className="lf-field">
              <label>Contraseña</label>
              <input
                name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={handle} required
              />
            </div>
            <button className="lf-btn" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Ingresar →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
