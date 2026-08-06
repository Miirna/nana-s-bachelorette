import { useState } from 'react';
import { CalendarCheck, Music, Users } from 'lucide-react';
import { useCanciones } from '../hooks/useCanciones';
import { useInvitadas } from '../hooks/useInvitadas';
import ConfirmacionesList from '../components/ConfirmacionesList';
import CancionesList from '../components/CancionesList';
import InvitadasList from '../components/InvitadasList';

function DashboardPage() {
  const [tabActiva, setTabActiva] = useState('confirmaciones');
  const confirmaciones = useCanciones();
  const invitadas = useInvitadas();

  return (
    <div className="app-container">
      <div className="main-card">
        <div className="app-header-logo">
          <h1 className="main-title">Dashboard</h1>
          <p className="logo-tagline">Nana's Bachelorette</p>
        </div>

        <div className="tabs-container tabs-container-3">
          <button
            className={`tab-btn ${tabActiva === 'confirmaciones' ? 'active' : ''}`}
            onClick={() => setTabActiva('confirmaciones')}
          >
            <CalendarCheck size={16} />
            Confirmadas ({confirmaciones.length})
          </button>

          <button
            className={`tab-btn ${tabActiva === 'canciones' ? 'active' : ''}`}
            onClick={() => setTabActiva('canciones')}
          >
            <Music size={16} />
            Canciones
          </button>

          <button
            className={`tab-btn ${tabActiva === 'invitadas' ? 'active' : ''}`}
            onClick={() => setTabActiva('invitadas')}
          >
            <Users size={16} />
            Invitadas ({invitadas.length})
          </button>
        </div>

        <div className="tab-content">
          {tabActiva === 'confirmaciones' && (
            <>
              <div className="lineup-header">
                <h3>Confirmaciones al Evento</h3>
              </div>
              <ConfirmacionesList confirmaciones={confirmaciones} />
            </>
          )}

          {tabActiva === 'canciones' && (
            <>
              <div className="lineup-header">
                <h3>Lista de Canciones</h3>
              </div>
              <CancionesList listaCanciones={confirmaciones} />
            </>
          )}

          {tabActiva === 'invitadas' && (
            <InvitadasList invitadas={invitadas} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
