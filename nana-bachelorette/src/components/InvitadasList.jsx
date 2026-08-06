import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, Trash2 } from 'lucide-react';

function InvitadasList({ invitadas }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);

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

  const handleEliminar = async (id) => {
    try {
      await deleteDoc(doc(db, "invitadas", id));
    } catch (error) {
      console.error("Error al borrar invitada:", error);
    }
  };

  return (
    <>
      <div className="lineup-header">
        <h3>Invitadas</h3>
        <button
          type="button"
          className="btn-add-invitada"
          onClick={() => setMostrarForm(v => !v)}
        >
          <UserPlus size={16} />
          Agregar
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleAgregar} className="add-invitada-form">
          <input
            type="text"
            placeholder="Nombre de la invitada"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
            required
          />
          <input
            type="email"
            placeholder="Correo de la invitada (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={cargando}>
            {cargando ? '...' : 'Añadir'}
          </button>
        </form>
      )}

      {invitadas.length === 0 ? (
        <p className="empty-msg">Aún no has agregado invitadas.</p>
      ) : (
        <div className="lineup-scroll-container">
          {invitadas.map((item) => (
            <div key={item.id} className="lineup-item">
              <div className="lineup-info">
                <div className="guest-name">{item.nombre}</div>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleEliminar(item.id)}
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default InvitadasList;
