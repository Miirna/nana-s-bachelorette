import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, X, Trash2, Music, List, Disc } from 'lucide-react';

function ConfirmationForm() {
  const [tabActiva, setTabActiva] = useState('registro');
  const [nombre, setNombre] = useState('');
  const [cancion, setCancion] = useState('');
  const [artista, setArtista] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [listaCanciones, setListaCanciones] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "confirmaciones"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const canciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaCanciones(canciones);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !cancion.trim()) return;
    setCargando(true);

    try {
      const nuevaInvitada = {
        nombre: nombre.trim(),
        cancion: cancion.trim(),
        artista: artista.trim() || 'Artista no especificado',
        fecha: serverTimestamp()
      };

      await addDoc(collection(db, "confirmaciones"), nuevaInvitada);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setMostrarToast(true);

      setNombre('');
      setCancion('');
      setArtista('');

      setTimeout(() => {
        setMostrarToast(false);
        setTabActiva('lineup');
      }, 2500);

    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un detalle al guardar tu canción.");
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "confirmaciones", id));
    } catch (error) {
      console.error("Error al borrar el registro:", error);
    }
  };

  return (
    <div className="app-container">

      {/* POPUP / TOAST TEMPORAL */}
      {mostrarToast && (
        <div className="toast-overlay">
          <div className="toast-card">
            <button className="toast-close" onClick={() => setMostrarToast(false)}>
              <X size={18} />
            </button>
            <div className="toast-icon">
              <CheckCircle2 color="#ff33a8" size={42} />
            </div>
            <h3>¡Rola anotada con éxito! 🎉</h3>
            <p>¡Tu canción ya se agregó al line-up!</p>
          </div>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="main-card">

        {/* 🪩 BOLA DE DISCO DE FONDO (MARCA DE AGUA) */}
        <div className="disco-ball-bg">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cuerda */}
            <line x1="50" y1="0" x2="50" y2="20" stroke="#ff33a8" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Círculo base */}
            <circle cx="50" cy="55" r="32" stroke="#ff33a8" strokeWidth="2" />
            {/* Línas horizontales de la bola */}
            <path d="M 20 45 Q 50 50 80 45" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 18 55 Q 50 62 82 55" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 22 65 Q 50 72 78 65" stroke="#ff33a8" strokeWidth="1.2" />
            {/* Líneas verticales/curvas */}
            <path d="M 50 23 Q 35 55 50 87" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 50 23 Q 65 55 50 87" stroke="#ff33a8" strokeWidth="1.2" />
            <path d="M 50 23 Q 22 55 50 87" stroke="#ff33a8" strokeWidth="1" />
            <path d="M 50 23 Q 78 55 50 87" stroke="#ff33a8" strokeWidth="1" />
            {/* Destellos / Chispas alrededor */}
            <path d="M 12 25 L 14 30 L 19 32 L 14 34 L 12 39 L 10 34 L 5 32 L 10 30 Z" fill="#00f3ff" />
            <path d="M 85 68 L 86 71 L 89 72 L 86 73 L 85 76 L 84 73 L 81 72 L 84 71 Z" fill="#00f3ff" />
          </svg>
        </div>
        
        {/* LOGO / ENCABEZADO PRINCIPAL */}
        <div className="app-header-logo">
          <h1 className="main-title">Nana's Bachelorette</h1>
          <p className="logo-tagline">
            Girls Just Want to Have Fun & Sing Karaoke
          </p>
        </div>

        {/* BARRA DE TABS / PESTAÑAS */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${tabActiva === 'registro' ? 'active' : ''}`}
            onClick={() => setTabActiva('registro')}
          >
            <Music size={18} />
            Pedir Canción
          </button>
          
          <button 
            className={`tab-btn ${tabActiva === 'lineup' ? 'active' : ''}`}
            onClick={() => setTabActiva('lineup')}
          >
            <List size={18} />
            Line-up ({listaCanciones.length})
          </button>
        </div>

        {/* CONTENIDO 1: FORMULARIO */}
        {tabActiva === 'registro' && (
          <div className="tab-content">
            <form onSubmit={handleSubmit} className="form-group">
              <div className="input-field">
                <label>TU NOMBRE</label>
                <input
                  type="text"
                  placeholder="Ej. Sofía"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="input-field">
                <label>CANCIÓN</label>
                <input
                  type="text"
                  placeholder="Ej. Physical"
                  value={cancion}
                  onChange={(e) => setCancion(e.target.value)}
                  required
                />
              </div>

              <div className="input-field">
                <div className="label-container">
                  <label>ARTISTA</label>
                  <span className="optional-tag">opcional</span>
                </div>
                <input
                  type="text"
                  placeholder="Ej. Dua Lipa"
                  value={artista}
                  onChange={(e) => setArtista(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={cargando}>
                <Sparkles size={18} />
                {cargando ? 'Guardando...' : 'Agregar al Line-up'}
              </button>
            </form>
          </div>
        )}

        {/* CONTENIDO 2: LISTA DE CANCIONES */}
        {tabActiva === 'lineup' && (
          <div className="tab-content">
            <div className="lineup-header">
              <h3> Line-up de la Noche</h3>
            </div>

            {listaCanciones.length === 0 ? (
              <p className="empty-msg">Aún no hay canciones anotadas. ¡Sé la primera!</p>
            ) : (
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
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(item.id)}
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default ConfirmationForm;