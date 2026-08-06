import { useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Sparkles, Search, Heart, Bell, LayoutDashboard, Users, Music2, Settings,
  Plus, X, CheckCircle2, Clock, ListMusic
} from 'lucide-react';
import { useCanciones } from '../hooks/useCanciones';
import { useInvitadas } from '../hooks/useInvitadas';
import KawaiiBackground from '../components/KawaiiBackground';
import NombreCombobox from '../components/NombreCombobox';
import InvitadasList from '../components/InvitadasList';

// Configura aquí la fecha del evento (formato 'AAAA-MM-DD') para que se calcule el contador.
// Déjalo en null si aún no la tienes definida.
const FECHA_EVENTO = '2026-08-22';
const HORA_EVENTO = '5:30 pm';

const COLORES_AVATAR = ['#ff9ecb', '#b9a2f2', '#9bd8f5', '#a8e6c9', '#ffc971'];

function colorAvatar(nombre) {
  const codigo = (nombre || '?').charCodeAt(0) || 0;
  return COLORES_AVATAR[codigo % COLORES_AVATAR.length];
}

function calcularDiasEvento() {
  if (!FECHA_EVENTO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const evento = new Date(FECHA_EVENTO);
  const diff = Math.ceil((evento - hoy) / (1000 * 60 * 60 * 24));
  return diff;
}

function DashboardPage() {
  const [tabActiva, setTabActiva] = useState('resumen');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCancion, setMostrarModalCancion] = useState(false);
  const [invitadaIdModal, setInvitadaIdModal] = useState('');
  const [cancionModal, setCancionModal] = useState('');
  const [artistaModal, setArtistaModal] = useState('');
  const [guardandoModal, setGuardandoModal] = useState(false);

  const confirmaciones = useCanciones();
  const invitadas = useInvitadas();

  const totalInvitadas = invitadas.length;
  const totalConfirmadas = invitadas.filter((i) => i.confirmada).length;
  const totalCanciones = confirmaciones.length;
  const diasEvento = calcularDiasEvento();

  const cancionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return confirmaciones;
    return confirmaciones.filter((c) =>
      c.cancion?.toLowerCase().includes(q) ||
      c.artista?.toLowerCase().includes(q) ||
      c.nombre?.toLowerCase().includes(q)
    );
  }, [confirmaciones, busqueda]);

  const conteoCancionesPorInvitada = useMemo(() => {
    const mapa = {};
    confirmaciones.forEach((c) => {
      mapa[c.nombre] = (mapa[c.nombre] || 0) + 1;
    });
    return mapa;
  }, [confirmaciones]);

  const handleAbrirModalCancion = () => {
    setInvitadaIdModal('');
    setCancionModal('');
    setArtistaModal('');
    setMostrarModalCancion(true);
  };

  const handleAgregarCancionAdmin = async (e) => {
    e.preventDefault();
    const invitada = invitadas.find((i) => i.id === invitadaIdModal);
    if (!invitada || !cancionModal.trim()) return;

    setGuardandoModal(true);
    try {
      await addDoc(collection(db, "confirmaciones"), {
        nombre: invitada.nombre,
        cancion: cancionModal.trim(),
        artista: artistaModal.trim() || 'Artista no especificado',
        fecha: serverTimestamp()
      });
      setMostrarModalCancion(false);
    } catch (error) {
      console.error("Error al agregar canción:", error);
      alert("Hubo un detalle al agregar la canción.");
    } finally {
      setGuardandoModal(false);
    }
  };

  return (
    <div className="kawaii-dash-shell">
      <aside className="kawaii-dash-sidebar">
        <div className="kawaii-dash-brand">
          <div className="kawaii-dash-brand-icon"><Sparkles size={18} /></div>
          <div>
            <div className="kawaii-dash-brand-title">Nana's Bachelorette</div>
            <div className="kawaii-dash-brand-subtitle">Karaoke Party <Sparkles size={11} /></div>
          </div>
        </div>

        <nav className="kawaii-dash-nav">
          <button
            type="button"
            className={`kawaii-dash-nav-item ${tabActiva === 'resumen' ? 'is-active' : ''}`}
            onClick={() => setTabActiva('resumen')}
          >
            <LayoutDashboard size={17} /> Resumen
          </button>
          <button
            type="button"
            className={`kawaii-dash-nav-item ${tabActiva === 'invitadas' ? 'is-active' : ''}`}
            onClick={() => setTabActiva('invitadas')}
          >
            <Users size={17} /> Invitadas
          </button>
          <button
            type="button"
            className={`kawaii-dash-nav-item ${tabActiva === 'canciones' ? 'is-active' : ''}`}
            onClick={() => setTabActiva('canciones')}
          >
            <Music2 size={17} /> Canciones
          </button>
        </nav>

        <div className="kawaii-dash-sidebar-footer">
          <button type="button" className="kawaii-dash-add-song-btn" onClick={handleAbrirModalCancion}>
            <Plus size={16} /> Agregar Canción
          </button>
          <button type="button" className="kawaii-dash-nav-item kawaii-dash-nav-item-muted" disabled>
            <Settings size={17} /> Ajustes
          </button>
        </div>
      </aside>

      <div className="kawaii-dash-body">
        <KawaiiBackground />

        <header className="kawaii-dash-topbar">
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
            <span className="kawaii-dash-icon-btn"><Heart size={16} /></span>
            <span className="kawaii-dash-icon-btn"><Bell size={16} /></span>
            <span className="kawaii-dash-avatar">N</span>
          </div>
        </header>

        <main className="kawaii-dash-main">
          {tabActiva === 'resumen' && (
            <>
              <h1 className="kawaii-dash-page-title">Resumen del Evento <Sparkles size={18} /></h1>
              <p className="kawaii-dash-page-subtitle">
                Así va la preparación de la fiesta · 22 de agosto, {HORA_EVENTO}
              </p>

              <div className="kawaii-dash-stats">
                <div className="kawaii-dash-stat-card">
                  <div className="kawaii-dash-stat-icon kawaii-dash-stat-icon-pink"><Users size={18} /></div>
                  <div className="kawaii-dash-stat-value">{totalInvitadas}</div>
                  <div className="kawaii-dash-stat-label">Total Invitadas</div>
                </div>
                <div className="kawaii-dash-stat-card">
                  <div className="kawaii-dash-stat-icon kawaii-dash-stat-icon-green"><CheckCircle2 size={18} /></div>
                  <div className="kawaii-dash-stat-value">{totalConfirmadas}</div>
                  <div className="kawaii-dash-stat-label">Confirmadas</div>
                </div>
                <div className="kawaii-dash-stat-card">
                  <div className="kawaii-dash-stat-icon kawaii-dash-stat-icon-blue"><ListMusic size={18} /></div>
                  <div className="kawaii-dash-stat-value">{totalCanciones}</div>
                  <div className="kawaii-dash-stat-label">Canciones Listas</div>
                </div>
                <div className="kawaii-dash-stat-card">
                  <div className="kawaii-dash-stat-icon kawaii-dash-stat-icon-red"><Clock size={18} /></div>
                  <div className="kawaii-dash-stat-value">{diasEvento !== null ? diasEvento : '—'}</div>
                  <div className="kawaii-dash-stat-label">
                    {diasEvento !== null ? 'Días para el Evento' : 'Fecha por definir'}
                  </div>
                </div>
              </div>

              <div className="kawaii-dash-panels">
                <div className="kawaii-dash-panel">
                  <div className="kawaii-dash-panel-header">
                    <h3><Music2 size={16} /> Lista de Canciones</h3>
                    <button type="button" className="kawaii-dash-pill-btn" onClick={() => setTabActiva('canciones')}>
                      Ver todas
                    </button>
                  </div>

                  {confirmaciones.length === 0 ? (
                    <p className="kawaii-empty-msg">Aún no hay canciones anotadas.</p>
                  ) : (
                    <ul className="kawaii-dash-song-preview">
                      {confirmaciones.slice(0, 4).map((c, i) => (
                        <li key={c.id || i}>
                          <div className="kawaii-perfil-cancion-icon" style={{ background: colorAvatar(c.cancion) }}>
                            <Music2 size={14} />
                          </div>
                          <div className="kawaii-perfil-cancion-texto">
                            <span className="kawaii-mi-cancion-titulo">{c.cancion}</span>
                            <span className="kawaii-mi-cancion-artista">{c.artista}</span>
                          </div>
                          <span className="kawaii-dash-tag">Por {c.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="kawaii-dash-panel">
                  <div className="kawaii-dash-panel-header">
                    <h3><CheckCircle2 size={16} /> Control de Asistencia</h3>
                  </div>

                  {invitadas.length === 0 ? (
                    <p className="kawaii-empty-msg">Aún no has agregado invitadas.</p>
                  ) : (
                    <table className="kawaii-dash-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>RSVP</th>
                          <th>Canciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitadas.slice(0, 6).map((inv) => {
                          const cancionesDeElla = conteoCancionesPorInvitada[inv.nombre] || 0;
                          return (
                            <tr key={inv.id}>
                              <td>
                                <span className="kawaii-dash-avatar-sm" style={{ background: colorAvatar(inv.nombre) }}>
                                  {inv.nombre.charAt(0).toUpperCase()}
                                </span>
                                {inv.nombre}
                              </td>
                              <td>
                                {inv.confirmada ? (
                                  <span className="kawaii-dash-status kawaii-dash-status-ok">✓ Confirmada</span>
                                ) : inv.declinada ? (
                                  <span className="kawaii-dash-status kawaii-dash-status-no">No asiste</span>
                                ) : (
                                  <span className="kawaii-dash-status kawaii-dash-status-pending">Pendiente</span>
                                )}
                              </td>
                              <td>
                                {cancionesDeElla > 0
                                  ? `${cancionesDeElla} agregada${cancionesDeElla > 1 ? 's' : ''}`
                                  : inv.confirmada
                                    ? 'Necesita canción'
                                    : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {tabActiva === 'invitadas' && (
            <div className="kawaii-dash-panel-full">
              <InvitadasList invitadas={invitadas} />
            </div>
          )}

          {tabActiva === 'canciones' && (
            <div className="kawaii-dash-panel kawaii-dash-panel-full">
              <div className="kawaii-dash-panel-header">
                <h3><Music2 size={16} /> Todas las Canciones</h3>
              </div>
              {cancionesFiltradas.length === 0 ? (
                <p className="kawaii-empty-msg">
                  {busqueda ? 'No encontramos canciones con esa búsqueda.' : 'Aún no hay canciones anotadas.'}
                </p>
              ) : (
                <div className="kawaii-perfil-canciones-grid">
                  {cancionesFiltradas.map((c, i) => (
                    <div key={c.id || i} className="kawaii-perfil-cancion-card">
                      <div className="kawaii-perfil-cancion-icon kawaii-perfil-cancion-icon-num">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="kawaii-perfil-cancion-texto">
                        <span className="kawaii-mi-cancion-titulo">{c.cancion}</span>
                        <span className="kawaii-mi-cancion-artista">
                          {c.nombre}{c.artista ? ` · ${c.artista}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {mostrarModalCancion && (
        <div className="kawaii-modal-overlay" onClick={() => setMostrarModalCancion(false)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setMostrarModalCancion(false)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">Agregar Canción <Sparkles size={16} /></h3>

            <form onSubmit={handleAgregarCancionAdmin} className="kawaii-form-group">
              <div className="kawaii-field">
                <label>Invitada</label>
                <NombreCombobox
                  invitadas={invitadas}
                  value={invitadaIdModal}
                  onChange={setInvitadaIdModal}
                />
              </div>

              <div className="kawaii-field">
                <label>Canción</label>
                <input
                  type="text"
                  placeholder="Ej. Physical"
                  value={cancionModal}
                  onChange={(e) => setCancionModal(e.target.value)}
                  required
                />
              </div>

              <div className="kawaii-field">
                <div className="kawaii-label-row">
                  <label>Artista</label>
                  <span className="kawaii-optional-tag">opcional</span>
                </div>
                <input
                  type="text"
                  placeholder="Ej. Dua Lipa"
                  value={artistaModal}
                  onChange={(e) => setArtistaModal(e.target.value)}
                />
              </div>

              <button type="submit" className="kawaii-cta" disabled={guardandoModal || !invitadaIdModal || !cancionModal.trim()}>
                <Sparkles size={16} />
                {guardandoModal ? 'Guardando...' : 'Agregar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
