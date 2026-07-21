import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { Music, Disc, Sparkles, Trophy } from 'lucide-react';
import './App.css'; // Aquí pondremos los estilos neón

export default function App() {
  const [nombre, setNombre] = useState('');
  const [cancion, setCancion] = useState('');
  const [lista, setLista] = useState([]);
  const [ganadora, setGanadora] = useState(null);
  const [girando, setGirando] = useState(false);

  // Escuchar la base de datos en tiempo real
  useEffect(() => {

    const unsubscribe = onSnapshot(collection(db, "karaoke"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLista(docs);
    });
    return () => unsubscribe();
  }, []);

  // Agregar invitada y canción
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !cancion) return;

    await addDoc(collection(db, "karaoke"), {
      nombre,
      cancion,
      fecha: new Date()
    });

    setNombre('');
    setCancion('');
  };

  // Sorteo / Ruleta Aleatoria
  const girarRuleta = () => {
    if (lista.length === 0 || girando) return;
    setGirando(true);
    setGanadora(null);

    let contador = 0;
    const intervalo = setInterval(() => {
      const idxAleatorio = Math.floor(Math.random() * lista.length);
      setGanadora(lista[idxAleatorio]);
      contador++;

      if (contador > 20) { // Duración del giro
        clearInterval(intervalo);
        setGirando(false);
        // Lanzar confeti al seleccionar
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }, 100);
  };

  return (
    <div className="app-container">
      <header className="header">
        <Disc className="icon-spin" size={40} color="#ff007f" />
        <h1 className="neon-title">Nana's Bachelorette</h1>
        <p className="subtitle">Girls just want to have fun & sing karaoke! 🪩</p>
      </header>

      {/* FORMULARIO DE REGISTRO */}
      <section className="card-neon">
        <h2><Sparkles color="#00f3ff" /> Regístrate para el Karaoke</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Tu nombre / apodo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Canción y Artista (tu 1era opción)"
            value={cancion}
            onChange={(e) => setCancion(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            ¡Subir al Playlist! 🎤
          </button>
        </form>
      </section>

      {/* SECCIÓN RULETA / SORTEO */}
      <section className="card-neon ruleta-section">
        <h2><Trophy color="#ffe600" /> ¿Quién canta ahora?</h2>
        <button 
          onClick={girarRuleta} 
          disabled={girando || lista.length === 0}
          className="btn-ruleta"
        >
          {girando ? "Girando ruleta..." : "🎲 Sortea la siguiente víctima"}
        </button>

        {ganadora && (
          <div className="winner-box">
            <p className="winner-title">🎉 ¡LE TOCA A!</p>
            <h3 className="winner-name">{ganadora.nombre}</h3>
            <p className="winner-song">🎶 Canción: <span>{ganadora.cancion}</span></p>
          </div>
        )}
      </section>

      {/* PLAYLIST EN VIVO */}
      <section className="card-neon">
        <h2><Music color="#ff007f" /> Lista del Karaoke ({lista.length})</h2>
        <ul className="playlist">
          {lista.map((item) => (
            <li key={item.id} className="playlist-item">
              <strong>{item.nombre}</strong> — <span>{item.cancion}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}