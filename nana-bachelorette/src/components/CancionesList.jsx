function CancionesList({ listaCanciones }) {
  if (listaCanciones.length === 0) {
    return <p className="empty-msg">Aún no hay canciones anotadas. ¡Sé la primera!</p>;
  }

  return (
    <div className="lineup-scroll-container">
      {listaCanciones.map((item, index) => (
        <div key={item.id || index} className="lineup-item">
          <div className="lineup-number">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="lineup-info">
            <div className="guest-name">{item.nombre}</div>
            <div className="song-details">
              <span className="song-title">{item.cancion}</span>
              {item.artista && (
                <>
                  <span className="dot">•</span>
                  <span className="artist-name">{item.artista}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CancionesList;
