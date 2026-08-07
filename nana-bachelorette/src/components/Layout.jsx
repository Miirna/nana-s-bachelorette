import { NavLink, Outlet } from 'react-router-dom';
import { Music, List } from 'lucide-react';
import { useCanciones } from '../hooks/useCanciones';

function Layout() {
  const listaCanciones = useCanciones();

  return (
    <div className="app-container">
      <div className="main-card">

        {/* BOLA DE DISCO DE FONDO (MARCA DE AGUA) */}
        <div className="disco-ball-bg">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="0" x2="50" y2="20" stroke="#ff33a8" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="50" cy="55" r="32" stroke="#ff33a8" strokeWidth="2" />
            <path d="M 20 45 Q 50 50 80 45" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 18 55 Q 50 62 82 55" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 22 65 Q 50 72 78 65" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 50 23 Q 35 55 50 87" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 50 23 Q 65 55 50 87" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 50 23 Q 22 55 50 87" stroke="#ff33a8" strokeWidth="1" />
            <path d="M 50 23 Q 78 55 50 87" stroke="#ff33a8" strokeWidth="1" />
            <path d="M 12 25 L 14 30 L 19 32 L 14 34 L 12 39 L 10 34 L 5 32 L 10 30 Z" fill="#00f3ff" />
            <path d="M 85 68 L 86 71 L 89 72 L 86 73 L 85 76 L 84 73 L 81 72 L 84 71 Z" fill="#00f3ff" />
          </svg>
        </div>

        {/* LOGO / ENCABEZADO PRINCIPAL */}
        <div className="app-header-logo">
          <h1 className="main-title">Despedida de Soltera de Mirna</h1>
          <p className="logo-tagline">
            Girls Just Want to Have Fun & Sing Karaoke
          </p>
        </div>

        {/* BARRA DE TABS / PESTAÑAS COMO RUTAS */}
        <div className="tabs-container">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
          >
            <Music size={18} />
            Pedir Canción
          </NavLink>

          <NavLink
            to="/lineup"
            className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
          >
            <List size={18} />
            Line-up ({listaCanciones.length})
          </NavLink>
        </div>

        {/* CONTENIDO DE LA RUTA ACTIVA */}
        <div className="tab-content">
          <Outlet context={{ listaCanciones }} />
        </div>

      </div>
    </div>
  );
}

export default Layout;
