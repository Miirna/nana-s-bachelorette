import { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Sparkles, Search, LayoutDashboard, Users, Music2, Settings,
  X, Menu, Heart, Disc3
} from 'lucide-react';
import { useCanciones } from '../hooks/useCanciones';
import { useInvitadas } from '../hooks/useInvitadas';
import KawaiiBackground from '../components/KawaiiBackground';

function DashboardPage() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const confirmaciones = useCanciones();
  const invitadas = useInvitadas();

  const cancionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return confirmaciones;
    return confirmaciones.filter((c) =>
      c.cancion?.toLowerCase().includes(q) ||
      c.artista?.toLowerCase().includes(q) ||
      c.nombre?.toLowerCase().includes(q)
    );
  }, [confirmaciones, busqueda]);

  const navItemClass = ({ isActive }) => `kawaii-dash-nav-item ${isActive ? 'is-active' : ''}`;

  return (
    <div className="kawaii-dash-shell">
      <aside className={`kawaii-dash-sidebar ${menuAbierto ? 'is-open' : ''}`}>
        <div className="kawaii-dash-brand">
          <div className="kawaii-dash-brand-icon"><Sparkles size={18} /></div>
          <div>
            <div className="kawaii-dash-brand-title">Despedida de Soltera de Mirna</div>
            <div className="kawaii-dash-brand-subtitle">Karaoke Party <Sparkles size={11} /></div>
          </div>
          <button
            type="button"
            className="kawaii-dash-close-btn"
            onClick={() => setMenuAbierto(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="kawaii-dash-nav">
          <NavLink to="/dashboard" end className={navItemClass} onClick={() => setMenuAbierto(false)}>
            <LayoutDashboard size={17} /> Resumen
          </NavLink>
          <NavLink to="/dashboard/invitadas" className={navItemClass} onClick={() => setMenuAbierto(false)}>
            <Users size={17} /> Invitadas
          </NavLink>
          <NavLink to="/dashboard/canciones" className={navItemClass} onClick={() => setMenuAbierto(false)}>
            <Music2 size={17} /> Canciones
          </NavLink>
          <NavLink to="/dashboard/mensajes" className={navItemClass} onClick={() => setMenuAbierto(false)}>
            <Heart size={17} /> Mensajes
          </NavLink>
          <a
            href="/ruleta"
            target="_blank"
            rel="noopener noreferrer"
            className="kawaii-dash-nav-item"
          >
            <Disc3 size={17} /> Ruleta
          </a>
        </nav>

        <div className="kawaii-dash-sidebar-footer">
          <button type="button" className="kawaii-dash-nav-item kawaii-dash-nav-item-muted" disabled>
            <Settings size={17} /> Ajustes
          </button>
        </div>
      </aside>

      {menuAbierto && (
        <div className="kawaii-dash-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      <div className="kawaii-dash-body">
        <KawaiiBackground />

        <header className="kawaii-dash-topbar">
          <button
            type="button"
            className="kawaii-dash-menu-btn"
            onClick={() => setMenuAbierto(true)}
          >
            <Menu size={20} />
          </button>
          <div className="kawaii-dash-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar canciones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="kawaii-dash-topbar-icons">
            <span className="kawaii-dash-avatar">N</span>
          </div>
        </header>

        <main className="kawaii-dash-main">
          <Outlet context={{ invitadas, confirmaciones, cancionesFiltradas, busqueda }} />
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
