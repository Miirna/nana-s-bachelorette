import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, X, HeartCrack, PartyPopper, Trash2, ShieldCheck, LogOut,
  Mic, Heart, CalendarDays, MapPin, Music2, ArrowLeft
} from 'lucide-react';
import { useInvitadas } from '../hooks/useInvitadas';
import { useCanciones } from '../hooks/useCanciones';
import { enviarCodigoVerificacion, notificarConfirmacionANovia } from '../emailjs';
import KawaiiBackground from '../components/KawaiiBackground';
import NombreCombobox from '../components/NombreCombobox';
import CuteAvatar from '../components/CuteAvatar';

const generarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

const TOTAL_PASOS = 3;

function RegistroPage() {
  const invitadas = useInvitadas();
  const confirmaciones = useCanciones();

  const [invitadaId, setInvitadaId] = useState('');
  const [respuestaAsistencia, setRespuestaAsistencia] = useState(null); // null | true | false
  const [paso, setPaso] = useState('bienvenida'); // bienvenida | asistencia | correo | verificacion | cancion | perfil | declinado | completado
  const [confirmando, setConfirmando] = useState(false);

  const [correoIngresado, setCorreoIngresado] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');

  const [cancion, setCancion] = useState('');
  const [artista, setArtista] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [toastInfo, setToastInfo] = useState({ titulo: '', mensaje: '' });
  const [mostrarModalCancion, setMostrarModalCancion] = useState(false);
  const [resumenCancion, setResumenCancion] = useState(null); // { cancion, artista }

  const invitadasOrdenadas = useMemo(
    () => [...invitadas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [invitadas]
  );

  const invitadaSeleccionada = invitadas.find((i) => i.id === invitadaId);
  const yaConfirmada = Boolean(invitadaSeleccionada?.confirmada);

  const misCanciones = useMemo(
    () => invitadaSeleccionada
      ? confirmaciones.filter((c) => c.nombre === invitadaSeleccionada.nombre)
      : [],
    [confirmaciones, invitadaSeleccionada]
  );

  const stepNumber = paso === 'bienvenida' ? 1 : paso === 'asistencia' ? 2 : paso === 'cancion' ? 3 : null;

  const handleSeleccionInvitada = (id) => {
    setInvitadaId(id);
    setRespuestaAsistencia(null);
    setErrorEnvio('');
    setCodigoIngresado('');
    setErrorCodigo('');
  };

  // Genera, guarda y manda el código de verificación a un correo específico
  const enviarCodigoA = async (correo) => {
    if (!invitadaId || !correo) return false;

    setErrorEnvio('');
    setEnviandoCodigo(true);

    try {
      const codigo = generarCodigo();
      await updateDoc(doc(db, "invitadas", invitadaId), {
        email: correo.toLowerCase(),
        codigoVerificacion: codigo,
        codigoExpira: Date.now() + 10 * 60 * 1000 // 10 minutos
      });
      await enviarCodigoVerificacion({
        correoDestino: correo,
        nombre: invitadaSeleccionada.nombre,
        codigo
      });
      setCodigoIngresado('');
      setErrorCodigo('');
      return true;
    } catch (error) {
      console.error("Error al enviar el código:", error);
      setErrorEnvio('No pudimos enviar tu código. Intenta de nuevo.');
      return false;
    } finally {
      setEnviandoCodigo(false);
    }
  };

  // Paso 1 -> si ya confirmó, le reenviamos el código a su correo para dejarla entrar a su perfil;
  // si no ha confirmado, pasa al paso de asistencia
  const handleSiguientePaso1 = async () => {
    if (!invitadaId || !invitadaSeleccionada) return;

    if (!yaConfirmada) {
      setPaso('asistencia');
      return;
    }

    if (!invitadaSeleccionada.email) {
      setErrorEnvio('No tenemos un correo registrado para verificarte. Contacta a la organizadora.');
      return;
    }

    setCorreoIngresado(invitadaSeleccionada.email);
    const ok = await enviarCodigoA(invitadaSeleccionada.email);
    if (ok) setPaso('verificacion');
  };

  // Paso 2 -> si dice que no, declina de una vez; si dice que sí, pedimos su correo antes de confirmar
  const handleContinuarAsistencia = async () => {
    if (respuestaAsistencia === null) return;

    if (respuestaAsistencia === false) {
      setConfirmando(true);
      try {
        await updateDoc(doc(db, "invitadas", invitadaId), {
          declinada: true,
          fechaRespuesta: serverTimestamp()
        });
        setPaso('declinado');
      } catch (error) {
        console.error("Error al registrar tu respuesta:", error);
        alert("Hubo un detalle al registrar tu respuesta.");
      } finally {
        setConfirmando(false);
      }
      return;
    }

    setCorreoIngresado(invitadaSeleccionada?.email || '');
    setErrorEnvio('');
    setPaso('correo');
  };

  // Paso "correo" -> guarda el correo y manda el código de verificación
  const handleEnviarCodigo = async () => {
    if (!correoIngresado.trim()) return;
    const ok = await enviarCodigoA(correoIngresado.trim());
    if (ok) setPaso('verificacion');
  };

  // Botón "Reenviar código" dentro del paso de verificación -> reusa el correo ya en curso
  const handleReenviarCodigo = () => {
    enviarCodigoA(correoIngresado);
  };

  // Paso "verificacion" -> si el código es correcto, ahí sí confirmamos la asistencia
  const handleVerificarCodigo = async () => {
    if (!invitadaSeleccionada) return;
    const vigente = invitadaSeleccionada.codigoExpira && Date.now() < invitadaSeleccionada.codigoExpira;

    if (!(vigente && invitadaSeleccionada.codigoVerificacion === codigoIngresado.trim())) {
      setErrorCodigo('Código incorrecto o vencido. Intenta de nuevo o reenvíalo.');
      return;
    }

    setErrorCodigo('');

    // Ya estaba confirmada de antes: solo la dejamos entrar a su perfil, sin re-notificar a la novia
    if (yaConfirmada) {
      setPaso('perfil');
      return;
    }

    setConfirmando(true);
    try {
      await updateDoc(doc(db, "invitadas", invitadaId), {
        confirmada: true,
        fechaConfirmacion: serverTimestamp()
      });
      notificarConfirmacionANovia({ nombreInvitada: invitadaSeleccionada.nombre })
        .catch((error) => console.error("No se pudo notificar a la novia:", error));
      setPaso('cancion');
    } catch (error) {
      console.error("Error al confirmar asistencia:", error);
      alert("Hubo un detalle al confirmar tu asistencia.");
    } finally {
      setConfirmando(false);
    }
  };

  const handleEliminarCancion = async (id) => {
    try {
      await deleteDoc(doc(db, "confirmaciones", id));
    } catch (error) {
      console.error("Error al eliminar la canción:", error);
      alert("Hubo un detalle al eliminar la canción.");
    }
  };

  // TEMPORAL: botón de pruebas para reiniciar la confirmación de asistencia
  const handleBorrarConfirmacion = async () => {
    try {
      await updateDoc(doc(db, "invitadas", invitadaId), {
        confirmada: false
      });
      setPaso('bienvenida');
      setInvitadaId('');
    } catch (error) {
      console.error("Error al borrar la confirmación:", error);
      alert("Hubo un detalle al borrar la confirmación.");
    }
  };

  const handleAtras = () => {
    if (paso === 'correo') setPaso('asistencia');
    else if (paso === 'verificacion') setPaso(yaConfirmada ? 'bienvenida' : 'correo');
    else if (paso === 'asistencia') setPaso('bienvenida');
    else if (paso === 'cancion') setPaso('bienvenida');
    else if (paso === 'declinado' || paso === 'completado' || paso === 'perfil') {
      setPaso('bienvenida');
      setInvitadaId('');
      setRespuestaAsistencia(null);
      setResumenCancion(null);
      setCodigoIngresado('');
      setErrorCodigo('');
      setCorreoIngresado('');
    }
  };

  const handleAbrirModalCancion = () => {
    setCancion('');
    setArtista('');
    setMostrarModalCancion(true);
  };

  // Tras declinar, regresamos automáticamente al inicio
  useEffect(() => {
    if (paso !== 'declinado') return;
    const timer = setTimeout(() => {
      setPaso('bienvenida');
      setInvitadaId('');
      setRespuestaAsistencia(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [paso]);

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

      if (paso === 'cancion') {
        // Primera canción, como parte de la confirmación inicial de asistencia
        setToastInfo({
          titulo: '¡Todo confirmado!',
          mensaje: 'Tu asistencia y tu rola ya quedaron en el line-up 💕'
        });
        setResumenCancion({ cancion: nuevaConfirmacion.cancion, artista: nuevaConfirmacion.artista });
        setPaso('completado');
      } else {
        // Ya estaba confirmada, solo está agregando una canción más desde su perfil
        setToastInfo({
          titulo: '¡Canción agregada!',
          mensaje: 'Tu nueva rola ya quedó en el line-up 🎶'
        });
        setMostrarModalCancion(false);
      }

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
            <h3>{toastInfo.titulo}</h3>
            <p>{toastInfo.mensaje}</p>
          </div>
        </div>
      )}

      {mostrarModalCancion && (
        <div className="kawaii-modal-overlay" onClick={() => setMostrarModalCancion(false)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setMostrarModalCancion(false)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">Agregar canción <Sparkles size={16} /></h3>

            <form onSubmit={handleSubmit} className="kawaii-form-group">
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

              <button type="submit" className="kawaii-cta" disabled={cargando}>
                <Sparkles size={16} />
                {cargando ? 'Guardando...' : 'Agregar'}
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="kawaii-topbar">
        <div className="kawaii-brand">Nana's Bachelorette <Sparkles size={16} /></div>
        <nav className="kawaii-nav-links">
          {paso === 'perfil' && (
            <button type="button" className="kawaii-logout-btn" onClick={handleAtras}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          )}
        </nav>
      </header>

      <main className="kawaii-main">
        <div className={`kawaii-card ${paso === 'perfil' ? 'kawaii-card-wide' : ''}`}>

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
            <div className="kawaii-form-group">
              <div className="kawaii-icon-badge">
                <Mic size={30} />
              </div>
              <h1 className="kawaii-title">Nana's Bachelorette</h1>
              <h2 className="kawaii-subtitle">Karaoke Party! <Sparkles size={18} /></h2>
              <p className="kawaii-description">
                ¡Únete a nosotros para una noche mágica y dulce de canto y amistad!. 
                Prepara tu canción favorita y creemos juntos recuerdos inolvidables.
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
                  ¡Hola de nuevo, {invitadaSeleccionada.nombre}! Ya habías confirmado tu asistencia.
                </div>
              )}

              {errorEnvio && <p className="kawaii-error-msg">{errorEnvio}</p>}

              <button
                type="button"
                className="kawaii-cta"
                onClick={handleSiguientePaso1}
                disabled={!invitadaId || enviandoCodigo}
              >
                {enviandoCodigo ? 'Enviando código...' : (yaConfirmada ? 'Continuar' : 'Siguiente')} <Sparkles size={16} />
              </button>
            </div>
          )}

          {paso === 'asistencia' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <h2 className="kawaii-step-title">¿Asistirás al evento? <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                {invitadaSeleccionada.nombre}, cuéntanos si nos acompañarás esa noche.
              </p>

              <div className="kawaii-attendance">
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

              <button
                type="button"
                className="kawaii-cta"
                onClick={handleContinuarAsistencia}
                disabled={respuestaAsistencia === null || confirmando}
              >
                {confirmando ? 'Guardando...' : 'Siguiente'} <Sparkles size={16} />
              </button>

              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Atrás
              </button>
            </div>
          )}

          {paso === 'correo' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <h2 className="kawaii-step-title">¿Cuál es tu correo? <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                Lo usaremos para mandarte un código y confirmar tu lugar en la fiesta.
              </p>

              <div className="kawaii-field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={correoIngresado}
                  onChange={(e) => setCorreoIngresado(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {errorEnvio && <p className="kawaii-error-msg">{errorEnvio}</p>}

              <button
                type="button"
                className="kawaii-cta"
                onClick={handleEnviarCodigo}
                disabled={!correoIngresado.trim() || enviandoCodigo}
              >
                {enviandoCodigo ? 'Enviando código...' : 'Enviar código'} <Sparkles size={16} />
              </button>

              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Atrás
              </button>
            </div>
          )}

          {paso === 'verificacion' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <div className="kawaii-icon-badge">
                <ShieldCheck size={28} />
              </div>
              <h2 className="kawaii-step-title">Verifica tu correo <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                Te enviamos un código a {correoIngresado}. Escríbelo aquí para
                {yaConfirmada ? ' entrar a tu perfil.' : ' confirmar tu asistencia.'}
              </p>

              <div className="kawaii-field">
                <label>Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={codigoIngresado}
                  onChange={(e) => setCodigoIngresado(e.target.value)}
                />
              </div>

              {errorCodigo && <p className="kawaii-error-msg">{errorCodigo}</p>}

              <button
                type="button"
                className="kawaii-cta"
                onClick={handleVerificarCodigo}
                disabled={!codigoIngresado.trim() || confirmando}
              >
                {confirmando ? 'Confirmando...' : (yaConfirmada ? 'Verificar y entrar' : 'Verificar y confirmar')} <Sparkles size={16} />
              </button>

              <button
                type="button"
                className="kawaii-back-link"
                onClick={handleReenviarCodigo}
                disabled={enviandoCodigo}
              >
                {enviandoCodigo ? 'Reenviando...' : 'Reenviar código'}
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
                <small>Te llevaremos al inicio en un momento...</small>
              </div>
              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Volver al inicio ahora
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

          {paso === 'perfil' && invitadaSeleccionada && (
            <div className="kawaii-perfil">
              <div className="kawaii-perfil-header">
                <div className="kawaii-perfil-avatar">
                  <CuteAvatar />
                </div>

                <div className="kawaii-perfil-info">
                  <div className="kawaii-perfil-nombre">
                    {invitadaSeleccionada.nombre} <Sparkles size={15} />
                  </div>
                  <span className="kawaii-perfil-badge">
                    <CheckCircle2 size={13} /> Confirmada
                  </span>
                </div>

                <button type="button" className="kawaii-perfil-cta" onClick={handleAbrirModalCancion}>
                  <Mic size={15} /> ¡Añadir más Canciones!
                </button>
              </div>

              <h3 className="kawaii-perfil-section-title">
                <Sparkles size={14} /> Mis Canciones
              </h3>

              {misCanciones.length === 0 ? (
                <p className="kawaii-empty-msg">Aún no tienes canciones registradas.</p>
              ) : (
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
                      <button
                        type="button"
                        className="kawaii-mi-cancion-borrar"
                        onClick={() => handleEliminarCancion(c.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TEMPORAL: solo para pruebas */}
              <button type="button" className="kawaii-danger-link" onClick={handleBorrarConfirmacion}>
                <Trash2 size={13} /> (Prueba) Borrar mi confirmación de asistencia
              </button>
            </div>
          )}

          {paso === 'completado' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <div className="kawaii-icon-badge kawaii-icon-badge-success">
                <PartyPopper size={30} />
              </div>
              <h2 className="kawaii-step-title">¡Todo listo, {invitadaSeleccionada.nombre}! <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                Ya confirmamos tu asistencia
                {resumenCancion && (
                  <> y tu rola <strong>“{resumenCancion.cancion}”</strong>
                    {resumenCancion.artista !== 'Artista no especificado' && ` de ${resumenCancion.artista}`}
                  </>
                )}
                . ¡Nos vemos en el karaoke! 💕🎤
              </p>

              <Link to="/lineup" className="kawaii-cta">
                Ver el Line-up <Music2 size={16} />
              </Link>

              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Volver al inicio
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
