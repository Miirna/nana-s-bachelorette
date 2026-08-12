import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Trash2, ChevronLeft, ChevronRight, Crown, Plus, X, Sparkles, Link2, Mic, Music2 } from 'lucide-react';
import NombreCombobox from './NombreCombobox';

const POR_PAGINA = 8;

function CancionesAdminList({ canciones, busqueda, invitadas }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [filtroInvitadaId, setFiltroInvitadaId] = useState('');

  const [mostrarModalCancion, setMostrarModalCancion] = useState(false);
  const [invitadaIdModal, setInvitadaIdModal] = useState('');
  const [cancionModal, setCancionModal] = useState('');
  const [artistaModal, setArtistaModal] = useState('');
  const [guardandoModal, setGuardandoModal] = useState(false);

  const [cancionUrlEditar, setCancionUrlEditar] = useState(null);
  const [urlKaraokeInput, setUrlKaraokeInput] = useState('');
  const [urlCancionInput, setUrlCancionInput] = useState('');
  const [guardandoUrl, setGuardandoUrl] = useState(false);

  const invitadasOrdenadas = useMemo(
    () => [...invitadas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [invitadas]
  );

  const invitadaFiltro = invitadas.find((i) => i.id === filtroInvitadaId);

  const nombresNovia = useMemo(
    () => new Set(invitadas.filter((i) => i.esNovia).map((i) => i.nombre)),
    [invitadas]
  );

  const cancionesFiltradasPorInvitada = useMemo(() => {
    if (!invitadaFiltro) return canciones;
    return canciones.filter((c) => c.nombre === invitadaFiltro.nombre);
  }, [canciones, invitadaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(cancionesFiltradasPorInvitada.length / POR_PAGINA));

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroInvitadaId]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [paginaActual, totalPaginas]);

  const cancionesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA;
    return cancionesFiltradasPorInvitada.slice(inicio, inicio + POR_PAGINA);
  }, [cancionesFiltradasPorInvitada, paginaActual]);

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta canción del line-up?')) return;

    try {
      await deleteDoc(doc(db, "confirmaciones", id));
    } catch (error) {
      console.error("Error al borrar la canción:", error);
      alert("Hubo un detalle al borrar la canción.");
    }
  };

  const handleAbrirModalUrl = (c) => {
    setCancionUrlEditar(c);
    setUrlKaraokeInput(c.urlKaraoke || '');
    setUrlCancionInput(c.urlCancion || '');
  };

  const handleGuardarUrl = async (e) => {
    e.preventDefault();
    if (!cancionUrlEditar || (!urlKaraokeInput.trim() && !urlCancionInput.trim())) return;
    setGuardandoUrl(true);

    try {
      await updateDoc(doc(db, "confirmaciones", cancionUrlEditar.id), {
        urlKaraoke: urlKaraokeInput.trim(),
        urlCancion: urlCancionInput.trim()
      });
      setCancionUrlEditar(null);
    } catch (error) {
      console.error("Error al guardar las URLs:", error);
      alert("Hubo un detalle al guardar las URLs.");
    } finally {
      setGuardandoUrl(false);
    }
  };

  const handleAbrirModalCancion = () => {
    setInvitadaIdModal('');
    setCancionModal('');
    setArtistaModal('');
    setMostrarModalCancion(true);
  };

  const handleAgregarCancionAdmin = async (e) => {
    e.preventDefault();
    const invitada = invitadas.find((i) => i.id === invitadaIdModal);
    if (!invitada || !cancionModal.trim()) return;

    setGuardandoModal(true);
    try {
      await addDoc(collection(db, "confirmaciones"), {
        nombre: invitada.nombre,
        cancion: cancionModal.trim(),
        artista: artistaModal.trim() || 'Artista no especificado',
        fecha: serverTimestamp()
      });
      setMostrarModalCancion(false);
    } catch (error) {
      console.error("Error al agregar canción:", error);
      alert("Hubo un detalle al agregar la canción.");
    } finally {
      setGuardandoModal(false);
    }
  };

  return (
    <>
      <div className="kawaii-dash-invitadas-header">
        <div>
          <h2 className="kawaii-dash-invitadas-title">Todas las Canciones 🎶</h2>
          <p className="kawaii-dash-invitadas-subtitle">Gestiona el line-up del karaoke.</p>
        </div>
        <button
          type="button"
          className="kawaii-dash-invite-btn"
          onClick={handleAbrirModalCancion}
        >
          <Plus size={14} />
          Agregar Canción
        </button>
      </div>

      <div className="kawaii-dash-cancion-filtro">
        <NombreCombobox
          invitadas={invitadasOrdenadas}
          value={filtroInvitadaId}
          onChange={setFiltroInvitadaId}
          placeholder="Filtrar por invitada..."
        />
      </div>

      {cancionesFiltradasPorInvitada.length === 0 ? (
        <p className="kawaii-empty-msg">
          {invitadaFiltro
            ? `${invitadaFiltro.nombre} aún no ha agregado canciones.`
            : busqueda
              ? 'No encontramos canciones con esa búsqueda.'
              : 'Aún no hay canciones anotadas.'}
        </p>
      ) : (
        <>
          <div className="kawaii-dash-table-card">
            <table className="kawaii-dash-table-invitadas">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Canción</th>
                  <th>Artista</th>
                  <th>Invitada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cancionesPaginadas.map((c, i) => (
                  <tr key={c.id || i}>
                    <td>{String((paginaActual - 1) * POR_PAGINA + i + 1).padStart(2, '0')}</td>
                    <td className="kawaii-dash-td-nombre">
                      {c.cancion}
                      {c.urlKaraoke && (
                        <a
                          href={c.urlKaraoke}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="kawaii-video-tag"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mic size={11} /> Karaoke
                        </a>
                      )}
                      {c.urlCancion && (
                        <a
                          href={c.urlCancion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="kawaii-video-tag kawaii-video-tag-cancion"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Music2 size={11} /> Canción
                        </a>
                      )}
                    </td>
                    <td className="kawaii-dash-td-correo">{c.artista || '—'}</td>
                    <td>
                      {nombresNovia.has(c.nombre) && <Crown size={14} className="kawaii-crown-badge" />}
                      {c.nombre}
                    </td>
                    <td>
                      <div className="kawaii-dash-td-acciones">
                        <button
                          type="button"
                          className={`kawaii-mi-cancion-borrar ${c.urlKaraoke || c.urlCancion ? 'kawaii-action-edit' : 'kawaii-action-confirm'}`}
                          onClick={() => handleAbrirModalUrl(c)}
                          title={c.urlKaraoke || c.urlCancion ? 'Editar URLs' : 'Agregar URLs'}
                        >
                          <Link2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="kawaii-mi-cancion-borrar"
                          onClick={() => handleEliminar(c.id)}
                          title="Eliminar canción"
                        >
                          <Trash2 size={15} />
                        </button>
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

      {mostrarModalCancion && (
        <div className="kawaii-modal-overlay" onClick={() => setMostrarModalCancion(false)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setMostrarModalCancion(false)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">Agregar Canción <Sparkles size={16} /></h3>

            <form onSubmit={handleAgregarCancionAdmin} className="kawaii-form-group">
              <div className="kawaii-field">
                <label>Invitada</label>
                <NombreCombobox
                  invitadas={invitadas}
                  value={invitadaIdModal}
                  onChange={setInvitadaIdModal}
                />
              </div>

              <div className="kawaii-field">
                <label>Canción</label>
                <input
                  type="text"
                  placeholder="Ej. Physical"
                  value={cancionModal}
                  onChange={(e) => setCancionModal(e.target.value)}
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
                  value={artistaModal}
                  onChange={(e) => setArtistaModal(e.target.value)}
                />
              </div>

              <button type="submit" className="kawaii-cta" disabled={guardandoModal || !invitadaIdModal || !cancionModal.trim()}>
                <Sparkles size={16} />
                {guardandoModal ? 'Guardando...' : 'Agregar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {cancionUrlEditar && (
        <div className="kawaii-modal-overlay" onClick={() => setCancionUrlEditar(null)}>
          <div className="kawaii-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setCancionUrlEditar(null)}>
              <X size={18} />
            </button>
            <h3 className="kawaii-step-title">
              URLs de la canción <Link2 size={16} />
            </h3>
            <p className="kawaii-step-subtitle kawaii-cancion-url-subtitle">
              {cancionUrlEditar.cancion} — {cancionUrlEditar.nombre}
            </p>

            <form onSubmit={handleGuardarUrl} className="kawaii-form-group">
              <div className="kawaii-field">
                <div className="kawaii-label-row">
                  <label><Mic size={13} /> URL Karaoke</label>
                  <span className="kawaii-optional-tag">opcional</span>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlKaraokeInput}
                  onChange={(e) => setUrlKaraokeInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="kawaii-field">
                <div className="kawaii-label-row">
                  <label><Music2 size={13} /> URL Canción</label>
                  <span className="kawaii-optional-tag">opcional</span>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlCancionInput}
                  onChange={(e) => setUrlCancionInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="kawaii-cta"
                disabled={guardandoUrl || (!urlKaraokeInput.trim() && !urlCancionInput.trim())}
              >
                <Link2 size={16} />
                {guardandoUrl ? 'Guardando...' : 'Guardar URLs'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CancionesAdminList;
