import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteField } from 'firebase/firestore';
import { Sparkles, RotateCcw, Search, ChevronLeft, ChevronRight, CheckCircle2, X, Pencil, Crown } from 'lucide-react';

const POR_PAGINA = 8;

function InvitadasList({ invitadas }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [esNoviaForm, setEsNoviaForm] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // todas | confirmadas | pendientes | declinadas
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  const [invitadaAConfirmar, setInvitadaAConfirmar] = useState(null);
  const [cancionConfirmar, setCancionConfirmar] = useState('');
  const [artistaConfirmar, setArtistaConfirmar] = useState('');
  const [confirmandoAsistencia, setConfirmandoAsistencia] = useState(false);

  const [invitadaAEditar, setInvitadaAEditar] = useState(null);
  const [nombreEditar, setNombreEditar] = useState('');
  const [emailEditar, setEmailEditar] = useState('');
  const [esNoviaEditar, setEsNoviaEditar] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const conteos = useMemo(() => {
    const sinNovia = invitadas.filter((i) => !i.esNovia);
    return {
      todas: sinNovia.length,
      confirmadas: sinNovia.filter((i) => i.confirmada).length,
      pendientes: sinNovia.filter((i) => !i.confirmada && !i.declinada).length,
      declinadas: sinNovia.filter((i) => i.declinada).length
    };
  }, [invitadas]);

  const invitadasFiltradas = useMemo(() => {
    let lista = invitadas;
    if (filtro === 'confirmadas') lista = lista.filter((i) => i.confirmada);
    else if (filtro === 'pendientes') lista = lista.filter((i) => !i.confirmada && !i.declinada);
    else if (filtro === 'declinadas') lista = lista.filter((i) => i.declinada);

    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter((i) =>
        i.nombre?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [invitadas, filtro, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(invitadasFiltradas.length / POR_PAGINA));

  useEffect(() => {
    setPaginaActual(1);
  }, [filtro, busqueda]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [paginaActual, totalPaginas]);

  const invitadasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA;
    return invitadasFiltradas.slice(inicio, inicio + POR_PAGINA);
  }, [invitadasFiltradas, paginaActual]);

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCargando(true);

    try {
      await addDoc(collection(db, "invitadas"), {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        esNovia: esNoviaForm,
        confirmada: false,
        declinada: false,
        fecha: serverTimestamp()
      });
      setNombre('');
      setEmail('');
      setEsNoviaForm(false);
      setMostrarForm(false);
    } catch (error) {
      console.error("Error al agregar invitada:", error);
      alert("Hubo un detalle al agregar a la invitada.");
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirModalAgregar = () => {
    setNombre('');
    setEmail('');
    setEsNoviaForm(false);
    setMostrarForm(true);
  };

  const handleAbrirModalConfirmar = (item) => {
    setInvitadaAConfirmar(item);
    setCancionConfirmar('');
    setArtistaConfirmar('');
  };

  const handleConfirmarAsistencia = async (e) => {
    e.preventDefault();
    if (!invitadaAConfirmar) return;
    setConfirmandoAsistencia(true);

    try {
      await updateDoc(doc(db, "invitadas", invitadaAConfirmar.id), {
        confirmada: true,
        fechaConfirmacion: serverTimestamp()
      });

      if (cancionConfirmar.trim()) {
        await addDoc(collection(db, "confirmaciones"), {
          nombre: invitadaAConfirmar.nombre,
          cancion: cancionConfirmar.trim(),
          artista: artistaConfirmar.trim() || 'Artista no especificado',
          fecha: serverTimestamp()
        });
      }

      setInvitadaAConfirmar(null);
    } catch (error) {
      console.error("Error al confirmar asistencia:", error);
      alert("Hubo un detalle al confirmar la asistencia.");
    } finally {
      setConfirmandoAsistencia(false);
    }
  };

  const handleAbrirModalEditar = (item) => {
    setInvitadaAEditar(item);
    setNombreEditar(item.nombre || '');
    setEmailEditar(item.email || '');
    setEsNoviaEditar(Boolean(item.esNovia));
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!invitadaAEditar || !nombreEditar.trim()) return;
    setGuardandoEdicion(true);

    try {
      await updateDoc(doc(db, "invitadas", invitadaAEditar.id), {
        nombre: nombreEditar.trim(),
        email: emailEditar.trim().toLowerCase(),
        esNovia: esNoviaEditar
      });
      setInvitadaAEditar(null);
    } catch (error) {
      console.error("Error al editar la invitada:", error);
      alert("Hubo un detalle al guardar los cambios.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleBorrarConfirmacion = async (id) => {
    if (!window.confirm('¿Restablecer la confirmación de esta invitada? Volverá a estar pendiente, pero no se borrará de la lista.')) return;

    try {
      await updateDoc(doc(db, "invitadas", id), {
        confirmada: false,
        declinada: false,
        fechaConfirmacion: deleteField(),
        fechaRespuesta: deleteField(),
        codigoVerificacion: deleteField(),
        codigoExpira: deleteField()
      });
    } catch (error) {
      console.error("Error al restablecer la confirmación:", error);
    }
  };

  return (
    <>
      <div className="kawaii-dash-invitadas-header">
        <div>
          <h2 className="kawaii-dash-invitadas-title">Lista de Invitadas 💖</h2>
          <p className="kawaii-dash-invitadas-subtitle">Gestiona quién viene a cantar bajo las estrellas.</p>
        </div>
        <button
          type="button"
          className="kawaii-dash-invite-btn"
          onClick={handleAbrirModalAgregar}
        >
          <Sparkles size={14} />
          Invitar Amiga
        </button>
      </div>

      <div className="kawaii-dash-search kawaii-dash-search-invitadas">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="kawaii-dash-filter-pills">
        <button
          type="button"
          className={`kawaii-dash-filter-pill ${filtro === 'todas' ? 'is-active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          Todas ({conteos.todas})
        </button>
        <button
          type="button"
          className={`kawaii-dash-filter-pill ${filtro === 'confirmadas' ? 'is-active' : ''}`}
          onClick={() => setFiltro('confirmadas')}
        >
          Confirmadas ({conteos.confirmadas})
        </button>
        <button
          type="button"
          className={`kawaii-dash-filter-pill ${filtro === 'pendientes' ? 'is-active' : ''}`}
          onClick={() => setFiltro('pendientes')}
        >
          Pendientes ({conteos.pendientes})
        </button>
        <button
          type="button"
          className={`kawaii-dash-filter-pill ${filtro === 'declinadas' ? 'is-active' : ''}`}
          onClick={() => setFiltro('declinadas')}
        >
          No asisten ({conteos.declinadas})
        </button>
      </div>

      {invitadasFiltradas.length === 0 ? (
        <p className="kawaii-empty-msg">
          {busqueda
            ? 'No encontramos invitadas con esa búsqueda.'
            : filtro === 'todas' ? 'Aún no has agregado invitadas.' : 'No hay invitadas en este filtro.'}
        </p>
      ) : (
        <>
          <div className="kawaii-dash-table-card">
            <table className="kawaii-dash-table-invitadas">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invitadasPaginadas.map((item) => (
                  <tr key={item.id}>
                    <td className="kawaii-dash-td-nombre">
                      {item.esNovia && <Crown size={14} className="kawaii-crown-badge" />}
                      {item.nombre}
                    </td>
                    <td className="kawaii-dash-td-correo">{item.email || '—'}</td>
                    <td>
                      {item.confirmada ? (
                        <span className="kawaii-dash-status kawaii-dash-status-ok">Confirmada</span>
                      ) : item.declinada ? (
                        <span className="kawaii-dash-status kawaii-dash-status-no">No puede asistir 🥲</span>
                      ) : (
                        <span className="kawaii-dash-status kawaii-dash-status-pending">Pendiente</span>
                      )}
                    </td>
                    <td>
                      <div className="kawaii-dash-td-acciones">
                        <button
                          type="button"
                          className="kawaii-mi-cancion-borrar kawaii-action-edit"
                          onClick={() => handleAbrirModalEditar(item)}
                          title="Editar invitada"
                        >
                          <Pencil size={14} />
                        </button>
                        {(item.confirmada || item.declinada) && (
                          <button
                            type="button"
                            className="kawaii-mi-cancion-borrar kawaii-action-reset"
                            onClick={() => handleBorrarConfirmacion(item.id)}
                            title="Restablecer confirmación"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {!item.confirmada && !item.declinada && (
                          <button
                            type="button"
                            className="kawaii-mi-cancion-borrar kawaii-action-confirm"
                            onClick={() => handleAbrirModalConfirmar(item)}
                            title="Confirmar asistencia"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="kawaii-dash-pagination">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                <ChevronLeft size={15} />
              </button>
              <span>Página {paginaActual} de {totalPaginas}</span>
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {invitadaAConfirmar && (
        <div className="kawaii-modal-overlay" onClick={() => setInvitadaAConfirmar(null)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setInvitadaAConfirmar(null)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">
              Confirmar a {invitadaAConfirmar.nombre} <CheckCircle2 size={16} />
            </h3>

            <form onSubmit={handleConfirmarAsistencia} className="kawaii-form-group">
              <div className="kawaii-field">
                <div className="kawaii-label-row">
                  <label>Canción</label>
                  <span className="kawaii-optional-tag">opcional</span>
                </div>
                <input
                  type="text"
                  placeholder="Ej. Physical"
                  value={cancionConfirmar}
                  onChange={(e) => setCancionConfirmar(e.target.value)}
                  autoFocus
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
                  value={artistaConfirmar}
                  onChange={(e) => setArtistaConfirmar(e.target.value)}
                />
              </div>

              <button type="submit" className="kawaii-cta" disabled={confirmandoAsistencia}>
                <CheckCircle2 size={16} />
                {confirmandoAsistencia ? 'Confirmando...' : 'Confirmar asistencia'}
              </button>
            </form>
          </div>
        </div>
      )}

      {mostrarForm && (
        <div className="kawaii-modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setMostrarForm(false)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">
              Invitar Amiga <Sparkles size={16} />
            </h3>

            <form onSubmit={handleAgregar} className="kawaii-form-group">
              <div className="kawaii-field">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre de la invitada"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="kawaii-field">
                <div className="kawaii-label-row">
                  <label>Correo</label>
                  <span className="kawaii-optional-tag">opcional</span>
                </div>
                <input
                  type="email"
                  placeholder="Correo de la invitada"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label className="kawaii-checkbox-row">
                <input
                  type="checkbox"
                  checked={esNoviaForm}
                  onChange={(e) => setEsNoviaForm(e.target.checked)}
                />
                <Crown size={14} /> Es la novia
              </label>

              <button type="submit" className="kawaii-cta" disabled={cargando || !nombre.trim()}>
                <Sparkles size={16} />
                {cargando ? 'Guardando...' : 'Añadir invitada'}
              </button>
            </form>
          </div>
        </div>
      )}

      {invitadaAEditar && (
        <div className="kawaii-modal-overlay" onClick={() => setInvitadaAEditar(null)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setInvitadaAEditar(null)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">
              Editar invitada <Pencil size={16} />
            </h3>

            <form onSubmit={handleGuardarEdicion} className="kawaii-form-group">
              <div className="kawaii-field">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre de la invitada"
                  value={nombreEditar}
                  onChange={(e) => setNombreEditar(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="kawaii-field">
                <label>Correo</label>
                <input
                  type="email"
                  placeholder="Correo de la invitada"
                  value={emailEditar}
                  onChange={(e) => setEmailEditar(e.target.value)}
                />
              </div>

              <label className="kawaii-checkbox-row">
                <input
                  type="checkbox"
                  checked={esNoviaEditar}
                  onChange={(e) => setEsNoviaEditar(e.target.checked)}
                />
                <Crown size={14} /> Es la novia
              </label>

              <button type="submit" className="kawaii-cta" disabled={guardandoEdicion || !nombreEditar.trim()}>
                <Pencil size={16} />
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default InvitadasList;
