let audioCtx = null;

function obtenerContexto() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tono(ctx, freq, inicio, duracion, { tipo = 'triangle', volumen = 0.25 } = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, inicio);
  gain.gain.linearRampToValueAtTime(volumen, inicio + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.05);
}

// Sonidito tipo "whoosh" al girar la ruleta
export function reproducirGiro() {
  try {
    const ctx = obtenerContexto();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const inicio = ctx.currentTime;
    osc.frequency.setValueAtTime(180, inicio);
    osc.frequency.exponentialRampToValueAtTime(520, inicio + 0.35);
    gain.gain.setValueAtTime(0.001, inicio);
    gain.gain.linearRampToValueAtTime(0.18, inicio + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(inicio);
    osc.stop(inicio + 0.45);
  } catch (error) {
    console.error('No se pudo reproducir el sonido de giro:', error);
  }
}

// Cancioncita tipo "¡ta-dá!" al revelar la canción ganadora
export function reproducirGanador() {
  try {
    const ctx = obtenerContexto();
    if (!ctx) return;
    const notas = [523.25, 659.25, 783.99, 1046.5]; // Do5, Mi5, Sol5, Do6
    notas.forEach((freq, i) => {
      tono(ctx, freq, ctx.currentTime + i * 0.13, 0.4, { volumen: 0.22 });
    });
    // brillito final
    tono(ctx, 1568, ctx.currentTime + 0.55, 0.5, { tipo: 'sine', volumen: 0.15 });
  } catch (error) {
    console.error('No se pudo reproducir el sonido de resultado:', error);
  }
}
