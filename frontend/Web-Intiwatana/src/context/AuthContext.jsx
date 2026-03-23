import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    // Recuperar sesión guardada al recargar página
    try {
      const saved = localStorage.getItem("iwt_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (token, username, rol, foto = null) => {
    const s = { token, username, rol, foto };
    setSession(s);
    localStorage.setItem("iwt_session", JSON.stringify(s));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("iwt_session");
  };

  const actualizarFoto = (foto) => {
    setSession(prev => {
      const s = { ...prev, foto };
      localStorage.setItem("iwt_session", JSON.stringify(s));
      return s;
    });
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, actualizarFoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}