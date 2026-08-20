import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Sparkles, Users, CheckCircle2, ListMusic, Clock, Music2, Crown } from 'lucide-react';

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

function DashboardResumen() {
  const { invitadas, confirmaciones } = useOutletContext();

  const invitadasSinNovia = invitadas.filter((i) => !i.esNovia);
  const totalInvitadas = invitadasSinNovia.length;
  const totalConfirmadas = invitadasSinNovia.filter((i) => i.confirmada).length;
  const totalCanciones = confirmaciones.length;
  const diasEvento = calcularDiasEvento();

  const conteoCancionesPorInvitada = useMemo(() => {
    const mapa = {};
    confirmaciones.forEach((c) => {
      mapa[c.nombre] = (mapa[c.nombre] || 0) + 1;
    });
    return mapa;
  }, [confirmaciones]);

  const nombresNovia = useMemo(
    () => new Set(invitadas.filter((i) => i.esNovia).map((i) => i.nombre)),
    [invitadas]
  );

  return (
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
            <Link to="/dashboard/canciones" className="kawaii-dash-pill-btn">
              Ver todas
            </Link>
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
                  <span className="kawaii-dash-tag">
                    Por {nombresNovia.has(c.nombre) && <Crown size={11} className="kawaii-crown-badge" />}{c.nombre}
                  </span>
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
            <div className="kawaii-table-scroll">
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
                          {inv.esNovia && <Crown size={13} className="kawaii-crown-badge" />}
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardResumen;
