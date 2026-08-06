import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, X, HeartCrack,
  Mic, Heart, CalendarDays, MapPin, Music2, LayoutDashboard, ArrowLeft
} from 'lucide-react';
import { useInvitadas } from '../hooks/useInvitadas';
import KawaiiBackground from '../components/KawaiiBackground';
import NombreCombobox from '../components/NombreCombobox';

const TOTAL_PASOS = 3;

function RegistroPage() {
  const invitadas = useInvitadas();

  const [invitadaId, setInvitadaId] = useState('');
  const [respuestaAsistencia, setRespuestaAsistencia] = useState(null); // null | true | false
  const [paso, setPaso] = useState('bienvenida'); // bienvenida | seleccion | cancion | declinado
  const [confirmando, setConfirmando] = useState(false);

  const [cancion, setCancion] = useState('');
  const [artista, setArtista] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);

  const invitadasOrdenadas = useMemo(
    () => [...invitadas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [invitadas]
  );

  const invitadaSeleccionada = invitadas.find((i) => i.id === invitadaId);
  const yaConfirmada = Boolean(invitadaSeleccionada?.confirmada);

  const stepNumber = paso === 'seleccion' ? 2 : paso === 'cancion' ? 3 : null;

  const puedeAvanzar = Boolean(invitadaId) && (yaConfirmada || respuestaAsistencia !== null);

  const handleSeleccionInvitada = (id) => {
    setInvitadaId(id);
    setRespuestaAsistencia(null);
  };

  const handleSiguiente = async () => {
    if (!puedeAvanzar) return;
    const asistira = yaConfirmada ? true : respuestaAsistencia;

    if (!asistira) {
      setPaso('declinado');
      return;
    }

    if (!yaConfirmada) {
      setConfirmando(true);
      try {
        await updateDoc(doc(db, "invitadas", invitadaId), {
          confirmada: true,
          fechaConfirmacion: serverTimestamp()
        });
      } catch (error) {
        console.error("Error al confirmar asistencia:", error);
        alert("Hubo un detalle al confirmar tu asistencia.");
        return;
      } finally {
        setConfirmando(false);
      }
    }

    setPaso('cancion');
  };

  const handleAtras = () => {
    if (paso === 'seleccion') setPaso('bienvenida');
    else if (paso === 'cancion' || paso === 'declinado') setPaso('seleccion');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invitadaSeleccionada || !cancion.trim()) return;
    setCargando(true);

    try {
      const nuevaConfirmacion = {
        nombre: invitadaSeleccionada.nombre,
        cancion: cancion.trim(),
        artista: artista.trim() || 'Artista no especificado',
        fecha: serverTimestamp()
      };

      await addDoc(collection(db, "confirmaciones"), nuevaConfirmacion);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setMostrarToast(true);

      setCancion('');
      setArtista('');

      setTimeout(() => {
        setMostrarToast(false);
      }, 2500);

    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un detalle al guardar tu canción.");
    } finally {
      setCargando(false);
    }
  };

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
            <h3>¡Rola anotada con éxito!</h3>
            <p>¡Tu canción ya se agregó al line-up!</p>
          </div>
        </div>
      )}

      <header className="kawaii-topbar">
        <div className="kawaii-brand">Nana's Bachelorette <Sparkles size={16} /></div>
        <nav className="kawaii-nav-links">
          <Link to="/lineup" className="kawaii-nav-pill" title="Line-up">
            <Music2 size={16} />
          </Link>
          <Link to="/dashboard" className="kawaii-nav-pill" title="Dashboard">
            <LayoutDashboard size={16} />
          </Link>
        </nav>
      </header>

      <main className="kawaii-main">
        <div className="kawaii-card">

          {stepNumber && (
            <div className="kawaii-stepper">
              <span className="kawaii-stepper-label">Paso {stepNumber} de {TOTAL_PASOS}</span>
              <div className="kawaii-stepper-track">
                {Array.from({ length: TOTAL_PASOS }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className={`kawaii-stepper-dot ${n <= stepNumber ? 'is-active' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}

          {paso === 'bienvenida' && (
            <>
              <div className="kawaii-icon-badge">
                <Mic size={30} />
              </div>
              <h1 className="kawaii-title">Nana's Bachelorette</h1>
              <h2 className="kawaii-subtitle">Karaoke Party! <Sparkles size={18} /></h2>
              <p className="kawaii-description">
                ¡Únete a la fiesta! Prepara tu canción favorita y hagamos de esta
                noche un recuerdo mágico e inolvidable juntas.
              </p>
              <button className="kawaii-cta" onClick={() => setPaso('seleccion')}>
                Comenzar RSVP <Heart size={16} fill="currentColor" />
              </button>
            </>
          )}

          {paso === 'seleccion' && (
            <div className="kawaii-form-group">
              <h2 className="kawaii-step-title">¿Quién nos acompaña? <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                Encuentra tu nombre en la lista de invitados para confirmar.
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

              {invitadaSeleccionada && yaConfirmada && (
                <div className="kawaii-already-confirmed">
                  <CheckCircle2 size={18} />
                  Ya habías confirmado tu asistencia
                </div>
              )}

              {invitadaSeleccionada && !yaConfirmada && (
                <div className="kawaii-attendance">
                  <p>¿Asistirás?</p>
                  <div className="kawaii-attendance-toggle">
                    <button
                      type="button"
                      className={`kawaii-toggle-btn ${respuestaAsistencia === true ? 'is-selected' : ''}`}
                      onClick={() => setRespuestaAsistencia(true)}
                    >
                      ¡Claro que sí! <Sparkles size={14} />
                    </button>
                    <button
                      type="button"
                      className={`kawaii-toggle-btn ${respuestaAsistencia === false ? 'is-selected' : ''}`}
                      onClick={() => setRespuestaAsistencia(false)}
                    >
                      Lo siento, no puedo
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="kawaii-cta"
                onClick={handleSiguiente}
                disabled={!puedeAvanzar || confirmando}
              >
                {confirmando ? 'Confirmando...' : 'Siguiente'} <Sparkles size={16} />
              </button>

              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Atrás
              </button>
            </div>
          )}

          {paso === 'declinado' && (
            <div className="kawaii-form-group">
              <div className="kawaii-declined">
                <HeartCrack size={26} />
                <p>Qué pena que no puedas acompañarnos. ¡Te extrañaremos esa noche!</p>
              </div>
              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Atrás
              </button>
            </div>
          )}

          {paso === 'cancion' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <h2 className="kawaii-step-title">¡Ya casi! <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                Cuéntanos qué canción vas a cantar esa noche.
              </p>

              <form onSubmit={handleSubmit} className="kawaii-form-group">
                <div className="kawaii-field">
                  <label>Canción</label>
                  <input
                    type="text"
                    placeholder="Ej. Physical"
                    value={cancion}
                    onChange={(e) => setCancion(e.target.value)}
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

                <button type="submit" className="kawaii-cta" disabled={cargando}>
                  <Sparkles size={16} />
                  {cargando ? 'Guardando...' : 'Agregar al Line-up'}
                </button>
              </form>

              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Atrás
              </button>
            </div>
          )}
        </div>

        {paso === 'bienvenida' && (
          <div className="kawaii-info-pills">
            <div className="kawaii-pill">
              <CalendarDays size={20} />
              <span>Fecha</span>
              <small>Próximamente...</small>
            </div>
            <div className="kawaii-pill">
              <MapPin size={20} />
              <span>Lugar</span>
              <small>Por confirmar</small>
            </div>
            <div className="kawaii-pill">
              <Music2 size={20} />
              <span>Canciones</span>
              <small>¡Infinitas!</small>
            </div>
          </div>
        )}
      </main>

      <footer className="kawaii-footer">
        <span>Made with <Heart size={13} fill="currentColor" /> for the Bride-to-be</span>
      </footer>
    </div>
  );
}

export default RegistroPage;
