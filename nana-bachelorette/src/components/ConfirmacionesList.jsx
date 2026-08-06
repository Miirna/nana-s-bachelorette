import { CheckCircle2 } from 'lucide-react';

function formatearFecha(fecha) {
  if (!fecha?.toDate) return 'justo ahora';
  return fecha.toDate().toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ConfirmacionesList({ confirmaciones }) {
  if (confirmaciones.length === 0) {
    return <p className="empty-msg">Aún no hay confirmaciones.</p>;
  }

  return (
    <div className="lineup-scroll-container">
      {confirmaciones.map((item, index) => (
        <div key={item.id || index} className="lineup-item">
          <CheckCircle2 className="confirm-check" size={22} />
          <div className="lineup-info">
            <div className="guest-name">{item.nombre}</div>
            <div className="song-details">
              <span className="artist-name">{formatearFecha(item.fecha)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConfirmacionesList;
