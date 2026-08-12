import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Music2, RotateCcw, Disc3, X, Crown, Mic } from 'lucide-react';
import { useCanciones } from '../hooks/useCanciones';
import { useInvitadas } from '../hooks/useInvitadas';
import KawaiiBackground from '../components/KawaiiBackground';
import { reproducirGiro, reproducirGanador } from '../utils/sonidos';

const COLORES_RULETA = ['#ffb3d9', '#c9b6f7', '#9bd8f5', '#a8e6c9', '#ffe08a', '#ffb8a8'];
const EXTRA_VUELTAS = 6;
const DURACION_MS = 4200;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function RuletaPage() {
  const confirmaciones = useCanciones();
  const invitadas = useInvitadas();
  const [cantadasIds, setCantadasIds] = useState(() => new Set());
  const [rotacion, setRotacion] = useState(0);
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const rotacionRef = useRef(0);
  const timeoutRef = useRef(null);

  const disponibles = useMemo(
    () => confirmaciones.filter((c) => !cantadasIds.has(c.id)),
    [confirmaciones, cantadasIds]
  );

  const nombresNovia = useMemo(
    () => new Set(invitadas.filter((i) => i.esNovia).map((i) => i.nombre)),
    [invitadas]
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const n = disponibles.length;
  const sliceAngle = n > 0 ? 360 / n : 0;
  const cx = 150;
  const cy = 150;
  const r = 145;

  const handleGirar = () => {
    if (girando || n === 0) return;
    setResultado(null);
    setGirando(true);
    reproducirGiro();

    const indice = Math.floor(Math.random() * n);
    const elegido = disponibles[indice];
    const centroSlice = indice * sliceAngle + sliceAngle / 2;
    const actualMod = ((rotacionRef.current % 360) + 360) % 360;
    const delta = ((360 - centroSlice - actualMod) % 360 + 360) % 360;
    const nuevaRotacion = rotacionRef.current + EXTRA_VUELTAS * 360 + delta;
    rotacionRef.current = nuevaRotacion;
    setRotacion(nuevaRotacion);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setGirando(false);
      setResultado(elegido);
      setCantadasIds((prev) => new Set(prev).add(elegido.id));
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
      reproducirGanador();
    }, DURACION_MS);
  };

  const handleReiniciar = () => {
    setCantadasIds(new Set());
    setResultado(null);
  };

  return (
    <div className="kawaii-page">
      <KawaiiBackground />

      <header className="kawaii-topbar">
        <div className="kawaii-brand">Despedida de Soltera de Mirna <Sparkles size={16} /></div>
      </header>

      <main className="kawaii-main">
        <div className="kawaii-card kawaii-card-wide kawaii-ruleta-card">
          <h1 className="kawaii-title kawaii-ruleta-title">Ruleta de Canciones <Disc3 size={22} /></h1>
          <p className="kawaii-description">
            {confirmaciones.length === 0
              ? 'Aún no hay canciones confirmadas para la ruleta.'
              : n > 0
                ? `Quedan ${n} canción${n === 1 ? '' : 'es'} por cantar esta noche 🎤`
                : '¡Ya se cantaron todas las canciones! 🎉'}
          </p>

          <div className="kawaii-ruleta-wrapper">
            <div className="kawaii-ruleta-puntero" />
            <svg
              className="kawaii-ruleta-svg"
              viewBox="0 0 300 300"
              style={{
                transform: `rotate(${rotacion}deg)`,
                transitionDuration: girando ? `${DURACION_MS}ms` : '0ms'
              }}
            >
              {n === 0 ? (
                <circle cx={cx} cy={cy} r={r} fill="#fff0f6" stroke="#ff9ecb" strokeWidth="2" />
              ) : n === 1 ? (
                <circle cx={cx} cy={cy} r={r} fill={COLORES_RULETA[0]} stroke="#fff" strokeWidth="2" />
              ) : (
                disponibles.map((c, i) => {
                  const start = i * sliceAngle;
                  const end = start + sliceAngle;
                  const mid = start + sliceAngle / 2;
                  const flip = mid > 90 && mid < 270;
                  return (
                    <g key={c.id}>
                      <path
                        d={describeSlice(cx, cy, r, start, end)}
                        fill={COLORES_RULETA[i % COLORES_RULETA.length]}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <g transform={`rotate(${mid}, ${cx}, ${cy})`}>
                        <text
                          x={cx}
                          y={cy - r * 0.62}
                          textAnchor="middle"
                          className="kawaii-ruleta-label"
                          transform={flip ? `rotate(180, ${cx}, ${cy - r * 0.62})` : undefined}
                        >
                          {nombresNovia.has(c.nombre) ? '👑 ' : ''}{(c.nombre || '').split(' ')[0]}
                        </text>
                      </g>
                    </g>
                  );
                })
              )}
              <circle cx={cx} cy={cy} r={26} fill="#fff" stroke="#ff8fc7" strokeWidth="3" />
            </svg>
          </div>

          <button
            type="button"
            className="kawaii-cta"
            onClick={handleGirar}
            disabled={girando || n === 0}
          >
            <Disc3 size={16} />
            {girando ? 'Girando...' : 'Girar la Ruleta'}
          </button>

          {confirmaciones.length > 0 && (
            <button type="button" className="kawaii-back-link" onClick={handleReiniciar}>
              <RotateCcw size={14} /> Reiniciar ruleta
            </button>
          )}
        </div>

      </main>

      {resultado && !girando && (
        <div className="kawaii-modal-overlay" onClick={() => setResultado(null)}>
          <div className="kawaii-modal-card kawaii-ruleta-resultado" onClick={(e) => e.stopPropagation()}>
            <button className="toast-close" onClick={() => setResultado(null)}>
              <X size={18} />
            </button>
            <Music2 size={26} />
            <h2>{resultado.cancion}</h2>
            {resultado.artista && resultado.artista !== 'Artista no especificado' && (
              <p className="kawaii-ruleta-artista">{resultado.artista}</p>
            )}
            <div className="kawaii-ruleta-cantante">
              🎤 Le toca cantar a{' '}
              {nombresNovia.has(resultado.nombre) && <Crown size={14} className="kawaii-crown-badge" />}
              <strong>{resultado.nombre}</strong>
            </div>
            {(resultado.urlKaraoke || resultado.urlCancion) && (
              <div className="kawaii-ruleta-videos">
                {resultado.urlKaraoke && (
                  <a
                    href={resultado.urlKaraoke}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kawaii-cta kawaii-ruleta-ver-video"
                  >
                    <Mic size={16} /> Ver Karaoke
                  </a>
                )}
                {resultado.urlCancion && (
                  <a
                    href={resultado.urlCancion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kawaii-cta kawaii-ruleta-ver-video kawaii-ruleta-ver-video-cancion"
                  >
                    <Music2 size={16} /> Ver Canción
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RuletaPage;
