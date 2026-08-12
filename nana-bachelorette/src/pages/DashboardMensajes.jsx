import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pin, Sparkles, Crown } from 'lucide-react';

const COLORES_NOTA = [
  { bg: '#fff4c2', border: '#f5da7a' },
  { bg: '#d7f3df', border: '#a8e6c9' },
  { bg: '#ffd9e8', border: '#ffb3d9' },
  { bg: '#d7ecfa', border: '#9bd8f5' },
  { bg: '#e8dcfb', border: '#c9b6f7' }
];

const ROTACIONES = [-4, 3, -2, 4, -3, 2, -5, 5];

function DashboardMensajes() {
  const { invitadas } = useOutletContext();

  const mensajes = useMemo(
    () => invitadas.filter((i) => i.mensajeNovia?.trim()),
    [invitadas]
  );

  return (
    <div className="kawaii-dash-panel-full">
      <div className="kawaii-memory-wall-header">
        <h2 className="kawaii-memory-wall-title">Memory Wall <Sparkles size={20} /></h2>
        <p className="kawaii-memory-wall-subtitle">Mensajes dulces para la novia 💕</p>
      </div>

      {mensajes.length === 0 ? (
        <p className="kawaii-empty-msg">Aún no hay mensajes. Cuando alguien deje uno, aparecerá aquí.</p>
      ) : (
        <div className="kawaii-memory-wall-grid">
          {mensajes.map((inv, i) => {
            const color = COLORES_NOTA[i % COLORES_NOTA.length];
            const rotacion = ROTACIONES[i % ROTACIONES.length];
            return (
              <div
                key={inv.id}
                className="kawaii-nota"
                style={{
                  background: color.bg,
                  borderColor: color.border,
                  transform: `rotate(${rotacion}deg)`
                }}
              >
                <Pin size={18} className="kawaii-nota-pin" />
                <p className="kawaii-nota-texto">“{inv.mensajeNovia}”</p>
                <div className="kawaii-nota-firma">
                  — {inv.esNovia && <Crown size={12} className="kawaii-crown-badge" />}{inv.nombre}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardMensajes;
