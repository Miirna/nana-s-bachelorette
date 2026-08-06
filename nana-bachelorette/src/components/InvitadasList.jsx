import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteField } from 'firebase/firestore';
import { Sparkles, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const POR_PAGINA = 8;

function InvitadasList({ invitadas }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // todas | confirmadas | pendientes | declinadas
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  const conteos = useMemo(() => ({
    todas: invitadas.length,
    confirmadas: invitadas.filter((i) => i.confirmada).length,
    pendientes: invitadas.filter((i) => !i.confirmada && !i.declinada).length,
    declinadas: invitadas.filter((i) => i.declinada).length
  }), [invitadas]);

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
        confirmada: false,
        declinada: false,
        fecha: serverTimestamp()
      });
      setNombre('');
      setEmail('');
      setMostrarForm(false);
    } catch (error) {
      console.error("Error al agregar invitada:", error);
      alert("Hubo un detalle al agregar a la invitada.");
    } finally {
      setCargando(false);
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
          onClick={() => setMostrarForm((v) => !v)}
        >
          <Sparkles size={14} />
          Invitar Amiga
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleAgregar} className="kawaii-form-group kawaii-dash-add-form">
          <div className="kawaii-field">
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
            <input
              type="email"
              placeholder="Correo de la invitada (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="kawaii-cta" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Añadir invitada'}
          </button>
        </form>
      )}

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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitadasPaginadas.map((item) => (
                  <tr key={item.id}>
                    <td className="kawaii-dash-td-nombre">{item.nombre}</td>
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
                      {(item.confirmada || item.declinada) && (
                        <button
                          type="button"
                          className="kawaii-mi-cancion-borrar"
                          onClick={() => handleBorrarConfirmacion(item.id)}
                          title="Restablecer confirmación"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
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
    </>
  );
}

export default InvitadasList;
