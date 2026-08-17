import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Sparkles, Music2, Mic, Pencil, Trash2, X, CheckCircle2, Plus,
  ShieldAlert, ArrowRight, HeartCrack
} from 'lucide-react';
import { useInvitadas } from '../hooks/useInvitadas';
import { useCanciones } from '../hooks/useCanciones';
import KawaiiBackground from '../components/KawaiiBackground';
import NombreCombobox from '../components/NombreCombobox';

function MiCancionPage() {
  const invitadas = useInvitadas();
  const confirmaciones = useCanciones();

  const [invitadaId, setInvitadaId] = useState('');
  const [editandoId, setEditandoId] = useState(null); // id de la canción | 'nueva' | null
  const [cancion, setCancion] = useState('');
  const [artista, setArtista] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);

  const invitadasOrdenadas = useMemo(
    () => [...invitadas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [invitadas]
  );

  const invitadaSeleccionada = invitadas.find((i) => i.id === invitadaId);

  const misCanciones = useMemo(
    () => invitadaSeleccionada
      ? confirmaciones.filter((c) => c.nombre === invitadaSeleccionada.nombre)
      : [],
    [confirmaciones, invitadaSeleccionada]
  );

  const handleSeleccionInvitada = (id) => {
    setInvitadaId(id);
    setEditandoId(null);
    setCancion('');
    setArtista('');
  };

  const handleAbrirNueva = () => {
    setEditandoId('nueva');
    setCancion('');
    setArtista('');
  };

  const handleAbrirEditar = (c) => {
    setEditandoId(c.id);
    setCancion(c.cancion);
    setArtista(c.artista === 'Artista no especificado' ? '' : c.artista);
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setCancion('');
    setArtista('');
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!invitadaSeleccionada || !cancion.trim()) return;
    setGuardando(true);

    try {
      if (editandoId && editandoId !== 'nueva') {
        await updateDoc(doc(db, "confirmaciones", editandoId), {
          cancion: cancion.trim(),
          artista: artista.trim() || 'Artista no especificado'
        });
      } else {
        await addDoc(collection(db, "confirmaciones"), {
          nombre: invitadaSeleccionada.nombre,
          cancion: cancion.trim(),
          artista: artista.trim() || 'Artista no especificado',
          fecha: serverTimestamp()
        });
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      }

      setEditandoId(null);
      setCancion('');
      setArtista('');
      setMostrarToast(true);
      setTimeout(() => setMostrarToast(false), 2200);
    } catch (error) {
      console.error("Error al guardar la canción:", error);
      alert("Hubo un detalle al guardar tu canción.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta canción?')) return;
    try {
      await deleteDoc(doc(db, "confirmaciones", id));
      if (editandoId === id) handleCancelar();
    } catch (error) {
      console.error("Error al eliminar la canción:", error);
      alert("Hubo un detalle al eliminar la canción.");
    }
  };

  const mostrarFormulario = editandoId !== null;

  return (
    <div className="kawaii-page">
      <KawaiiBackground />

      {mostrarToast && (
        <div className="toast-overlay">
          <div className="toast-card">
            <button className="toast-close" onClick={() => setMostrarToast(false)}>
              <X size={18} />
            </button>
            <div className="toast-icon">
              <CheckCircle2 color="#ff6fb5" size={42} />
            </div>
            <h3>¡Listo!</h3>
            <p>Tu canción ya quedó guardada 🎶</p>
          </div>
        </div>
      )}

      <header className="kawaii-topbar">
        <div className="kawaii-brand">Despedida de Soltera de Mirna <Sparkles size={16} /></div>
      </header>

      <main className="kawaii-main">
        <div className="kawaii-card">
          <div className="kawaii-form-group">
            <div className="kawaii-icon-badge">
              <Mic size={30} />
            </div>
            <h1 className="kawaii-title">Mi Canción <Sparkles size={16} /></h1>
            <p className="kawaii-description">
              Busca tu nombre para agregar tu canción del karaoke, o para cambiarla si ya elegiste una.
            </p>

            <div className="kawaii-field">
              <label>Busca tu nombre</label>
              <NombreCombobox
                invitadas={invitadasOrdenadas}
                value={invitadaId}
                onChange={handleSeleccionInvitada}
              />
            </div>

            {invitadas.length === 0 && (
              <p className="kawaii-empty-msg">
                Aún no hay invitadas registradas. Pide a la organizadora que te agregue primero.
              </p>
            )}

            {invitadaSeleccionada && invitadaSeleccionada.declinada && (
              <div className="kawaii-cancion-aviso kawaii-cancion-aviso-declinada">
                <HeartCrack size={20} />
                <p>
                  Según tu respuesta, no vas a poder acompañarnos esa noche.
                  Si eso cambió, avísale a la organizadora para poder agregarte tu canción.
                </p>
              </div>
            )}

            {invitadaSeleccionada && !invitadaSeleccionada.confirmada && !invitadaSeleccionada.declinada && (
              <div className="kawaii-cancion-aviso">
                <ShieldAlert size={20} />
                <p>Antes de elegir tu canción, primero necesitamos que confirmes tu asistencia.</p>
                <Link to="/" className="kawaii-cta">
                  Confirmar mi asistencia <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {invitadaSeleccionada && invitadaSeleccionada.confirmada && (
              <>
                <div className="kawaii-already-confirmed">
                  <Music2 size={18} />
                  ¡Hola, {invitadaSeleccionada.nombre}!
                </div>

                {misCanciones.length > 0 && (
                  <>
                    <h3 className="kawaii-perfil-section-title">
                      <Sparkles size={14} /> Tus canciones
                    </h3>
                    <div className="kawaii-perfil-canciones-grid">
                      {misCanciones.map((c) => (
                        <div key={c.id} className="kawaii-perfil-cancion-card">
                          <div className="kawaii-perfil-cancion-icon">
                            <Music2 size={16} />
                          </div>
                          <div className="kawaii-perfil-cancion-texto">
                            <span className="kawaii-mi-cancion-titulo">{c.cancion}</span>
                            {c.artista !== 'Artista no especificado' && (
                              <span className="kawaii-mi-cancion-artista">{c.artista}</span>
                            )}
                          </div>
                          <div className="kawaii-dash-td-acciones">
                            <button
                              type="button"
                              className="kawaii-mi-cancion-borrar kawaii-action-edit"
                              onClick={() => handleAbrirEditar(c)}
                              title="Cambiar canción"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="kawaii-mi-cancion-borrar"
                              onClick={() => handleEliminar(c.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!mostrarFormulario && (
                  <button type="button" className="kawaii-cta" onClick={handleAbrirNueva}>
                    <Plus size={16} />
                    {misCanciones.length > 0 ? 'Agregar otra canción' : 'Agregar mi canción'}
                  </button>
                )}

                {mostrarFormulario && (
                  <form onSubmit={handleGuardar} className="kawaii-form-group">
                    <div className="kawaii-field">
                      <label>Canción</label>
                      <input
                        type="text"
                        placeholder="Ej. Physical"
                        value={cancion}
                        onChange={(e) => setCancion(e.target.value)}
                        autoFocus
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
                        value={artista}
                        onChange={(e) => setArtista(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="kawaii-cta" disabled={guardando || !cancion.trim()}>
                      <Sparkles size={16} />
                      {guardando ? 'Guardando...' : (editandoId === 'nueva' ? 'Agregar' : 'Guardar cambios')}
                    </button>

                    {misCanciones.length > 0 && (
                      <button type="button" className="kawaii-back-link" onClick={handleCancelar}>
                        Cancelar
                      </button>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MiCancionPage;
