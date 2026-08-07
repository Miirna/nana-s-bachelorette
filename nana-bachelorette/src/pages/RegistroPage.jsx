import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, X, HeartCrack, Trash2, ShieldCheck, LogOut,
  Mic, Heart, CalendarDays, MapPin, Music2, ArrowLeft, Gift
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
  const [paso, setPaso] = useState('bienvenida'); // bienvenida | asistencia | correo | confirmarCorreo | verificacion | cancion | perfil | declinado
  const [confirmando, setConfirmando] = useState(false);

  const [correoIngresado, setCorreoIngresado] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');

  const [cancion, setCancion] = useState('');
  const [artista, setArtista] = useState('');
  const [mensajeNovia, setMensajeNovia] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [toastInfo, setToastInfo] = useState({ titulo: '', mensaje: '' });
  const [mostrarModalCancion, setMostrarModalCancion] = useState(false);

  const [mostrarModalMensaje, setMostrarModalMensaje] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [guardandoMensaje, setGuardandoMensaje] = useState(false);

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

  // Paso 1 -> si ya confirmó, primero le preguntamos si su correo sigue siendo correcto;
  // si no ha confirmado, pasa al paso de asistencia
  const handleSiguientePaso1 = () => {
    if (!invitadaId || !invitadaSeleccionada) return;

    if (!yaConfirmada) {
      setPaso('asistencia');
      return;
    }

    if (!invitadaSeleccionada.email) {
      setCorreoIngresado('');
      setErrorEnvio('');
      setPaso('correo');
      return;
    }

    setPaso('confirmarCorreo');
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

    setCorreoIngresado('');
    setErrorEnvio('');
    setPaso('correo');
  };

  // Paso "confirmarCorreo" -> valida si el correo ya guardado sigue siendo el correcto
  const handleCorreoEsCorrecto = async () => {
    if (!invitadaSeleccionada?.email) return;
    const ok = await enviarCodigoA(invitadaSeleccionada.email);
    if (ok) setPaso('verificacion');
  };

  const handleCorreoNoEsCorrecto = () => {
    setCorreoIngresado('');
    setErrorEnvio('');
    setPaso('correo');
  };

  // Paso "correo" -> primera vez: solo se guarda el correo, la confirmación final queda
  // pendiente hasta que también agregue su canción (ver handleSubmit).
  // Corrigiendo correo (ya confirmada): se guarda el nuevo correo y AHÍ sí se manda el código.
  const handleContinuarCorreo = async () => {
    if (!invitadaId || !correoIngresado.trim()) return;
    const correo = correoIngresado.trim().toLowerCase();

    if (yaConfirmada) {
      const ok = await enviarCodigoA(correo);
      if (ok) setPaso('verificacion');
      return;
    }

    setErrorEnvio('');
    setConfirmando(true);
    try {
      await updateDoc(doc(db, "invitadas", invitadaId), {
        email: correo
      });
      setPaso('cancion');
    } catch (error) {
      console.error("Error al confirmar asistencia:", error);
      setErrorEnvio('Hubo un detalle al guardar tu correo. Intenta de nuevo.');
    } finally {
      setConfirmando(false);
    }
  };

  // Botón "Reenviar código" dentro del paso de verificación -> reusa el correo ya en curso
  const handleReenviarCodigo = () => {
    enviarCodigoA(correoIngresado);
  };

  // Paso "verificacion" -> solo se llega aquí ya estando confirmada; si el código es correcto, entra a su perfil
  const handleVerificarCodigo = () => {
    if (!invitadaSeleccionada) return;
    const vigente = invitadaSeleccionada.codigoExpira && Date.now() < invitadaSeleccionada.codigoExpira;

    if (!(vigente && invitadaSeleccionada.codigoVerificacion === codigoIngresado.trim())) {
      setErrorCodigo('Código incorrecto o vencido. Intenta de nuevo o reenvíalo.');
      return;
    }

    setErrorCodigo('');
    setPaso('perfil');
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
    if (paso === 'correo') setPaso(yaConfirmada ? 'confirmarCorreo' : 'asistencia');
    else if (paso === 'verificacion') setPaso('confirmarCorreo');
    else if (paso === 'confirmarCorreo') setPaso('bienvenida');
    else if (paso === 'asistencia') setPaso('bienvenida');
    else if (paso === 'cancion') setPaso('bienvenida');
    else if (paso === 'declinado' || paso === 'perfil') {
      setPaso('bienvenida');
      setInvitadaId('');
      setRespuestaAsistencia(null);
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

  const handleAbrirModalMensaje = () => {
    setMensajeModal(invitadaSeleccionada?.mensajeNovia || '');
    setMostrarModalMensaje(true);
  };

  const handleGuardarMensaje = async (e) => {
    e.preventDefault();
    if (!invitadaId) return;
    setGuardandoMensaje(true);

    try {
      await updateDoc(doc(db, "invitadas", invitadaId), {
        mensajeNovia: mensajeModal.trim()
      });
      setMostrarModalMensaje(false);
    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
      alert("Hubo un detalle al guardar tu mensaje.");
    } finally {
      setGuardandoMensaje(false);
    }
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

      if (paso === 'cancion') {
        // Hasta aquí se da por completa la confirmación: ya tiene correo Y canción.
        await updateDoc(doc(db, "invitadas", invitadaId), {
          confirmada: true,
          fechaConfirmacion: serverTimestamp(),
          ...(mensajeNovia.trim() ? { mensajeNovia: mensajeNovia.trim() } : {})
        });
        notificarConfirmacionANovia({ nombreInvitada: invitadaSeleccionada.nombre })
          .catch((error) => console.error("No se pudo notificar a la novia:", error));
      }

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      if (paso === 'cancion') {
        // Primera canción, como parte de la confirmación inicial de asistencia -> directo a su perfil
        setToastInfo({
          titulo: '¡Todo confirmado!',
          mensaje: 'Tu asistencia y tu rola ya quedaron en el line-up 💕'
        });
        setPaso('perfil');
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
      setMensajeNovia('');

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

      {mostrarModalMensaje && (
        <div className="kawaii-modal-overlay" onClick={() => setMostrarModalMensaje(false)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setMostrarModalMensaje(false)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">Mensaje para la novia <Heart size={16} /></h3>

            <form onSubmit={handleGuardarMensaje} className="kawaii-form-group">
              <div className="kawaii-field">
                <label>Tu mensaje</label>
                <textarea
                  placeholder="Escríbele unas palabras a Mirna..."
                  value={mensajeModal}
                  onChange={(e) => setMensajeModal(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>

              <button type="submit" className="kawaii-cta" disabled={guardandoMensaje}>
                <Sparkles size={16} />
                {guardandoMensaje ? 'Guardando...' : 'Guardar mensaje'}
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="kawaii-topbar">
        <div className="kawaii-brand">Despedida de Soltera de Mirna <Sparkles size={16} /></div>
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
              <h1 className="kawaii-title">Despedida de Soltera de Mirna</h1>
              <h2 className="kawaii-subtitle">Karaoke Party! <Sparkles size={18} /></h2>
              <p className="kawaii-description">
                ¡Únete a nosotros para una noche mágica y dulce de canto y amistad!.
                Prepara tu canción favorita y creemos juntos recuerdos inolvidables.
              </p>

              <div className="kawaii-info-pills">
                <div className="kawaii-pill">
                  <CalendarDays size={20} />
                  <span>Fecha</span>
                  <small>22 de agosto, 5:30 pm</small>
                </div>
                <a
                  href="https://maps.app.goo.gl/Ln6VLUGpthetiFvE9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kawaii-pill kawaii-pill-link"
                >
                  <MapPin size={20} />
                  <span>Lugar</span>
                  <small>Ver ubicación</small>
                </a>
              </div>

              <div className="kawaii-gift-note">
                <h4><Gift size={16} /> Sugerencias de Regalo</h4>
                <p>
                  ¡Tu presencia es nuestro mejor regalo! Pero si deseas tener
                  un detalle, una lluvia de sobres o un obsequio especial
                  será bien recibido con mucho cariño.
                </p>
              </div>

              <p className="kawaii-step-subtitle">A continuación busca tu nombre para confirmar tu asistencia</p>

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

              <button
                type="button"
                className="kawaii-cta"
                onClick={handleSiguientePaso1}
                disabled={!invitadaId}
              >
                {yaConfirmada ? 'Continuar' : 'Siguiente'} <Sparkles size={16} />
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

          {paso === 'confirmarCorreo' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <div className="kawaii-icon-badge">
                <ShieldCheck size={28} />
              </div>
              <h2 className="kawaii-step-title">¿Sigue siendo tu correo? <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                Tenemos registrado: <strong>{invitadaSeleccionada.email}</strong>
              </p>

              <div className="kawaii-attendance-toggle">
                <button
                  type="button"
                  className="kawaii-toggle-btn"
                  onClick={handleCorreoEsCorrecto}
                  disabled={enviandoCodigo}
                >
                  {enviandoCodigo ? 'Enviando código...' : 'Sí, es correcto'}
                </button>
                <button
                  type="button"
                  className="kawaii-toggle-btn"
                  onClick={handleCorreoNoEsCorrecto}
                  disabled={enviandoCodigo}
                >
                  No, quiero cambiarlo
                </button>
              </div>

              {errorEnvio && <p className="kawaii-error-msg">{errorEnvio}</p>}

              <button type="button" className="kawaii-back-link" onClick={handleAtras}>
                <ArrowLeft size={14} /> Atrás
              </button>
            </div>
          )}

          {paso === 'correo' && invitadaSeleccionada && (
            <div className="kawaii-form-group">
              <h2 className="kawaii-step-title">¿Cuál es tu correo? <Sparkles size={16} /></h2>
              <p className="kawaii-step-subtitle">
                {yaConfirmada
                  ? 'Escribe el correo correcto para mandarte un código y dejarte entrar a tu perfil.'
                  : 'Lo guardaremos junto con tu confirmación de asistencia.'}
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
                onClick={handleContinuarCorreo}
                disabled={!correoIngresado.trim() || enviandoCodigo || confirmando}
              >
                {enviandoCodigo
                  ? 'Enviando código...'
                  : confirmando
                    ? 'Confirmando...'
                    : (yaConfirmada ? 'Enviar código' : 'Confirmar asistencia')} <Sparkles size={16} />
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
                Te enviamos un código a {correoIngresado}. Escríbelo aquí para entrar a tu perfil.
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
                disabled={!codigoIngresado.trim()}
              >
                Verificar y entrar <Sparkles size={16} />
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

                <div className="kawaii-field">
                  <div className="kawaii-label-row">
                    <label>Mensaje para la novia</label>
                    <span className="kawaii-optional-tag">opcional</span>
                  </div>
                  <textarea
                    placeholder="Escríbele unas palabras a Mirna..."
                    value={mensajeNovia}
                    onChange={(e) => setMensajeNovia(e.target.value)}
                    rows={3}
                  />
                  <small className="kawaii-field-hint">
                    ¿No se te ocurre nada ahorita? No hay bronca, más adelante
                    podrás agregarlo desde tu perfil 💕
                  </small>
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

              <h3 className="kawaii-perfil-section-title">
                <Heart size={14} /> Mensaje para la novia
              </h3>

              {invitadaSeleccionada.mensajeNovia ? (
                <div className="kawaii-mensaje-novia-card">
                  <p>{invitadaSeleccionada.mensajeNovia}</p>
                  <button type="button" className="kawaii-dash-pill-btn" onClick={handleAbrirModalMensaje}>
                    Editar mensaje
                  </button>
                </div>
              ) : (
                <button type="button" className="kawaii-perfil-cta" onClick={handleAbrirModalMensaje}>
                  <Heart size={15} /> Dejar un mensaje
                </button>
              )}

              {/* TEMPORAL: solo para pruebas */}
              {/*<button type="button" className="kawaii-danger-link" onClick={handleBorrarConfirmacion}>
                <Trash2 size={13} /> (Prueba) Borrar mi confirmación de asistencia
              </button>*/}
            </div>
          )}

        </div>
      </main>

      <footer className="kawaii-footer">
        <span>Made with <Heart size={13} fill="currentColor" /> for the Bride-to-be</span>
      </footer>
    </div>
  );
}

export default RegistroPage;
