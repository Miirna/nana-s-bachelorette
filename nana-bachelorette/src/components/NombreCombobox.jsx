import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

function NombreCombobox({ invitadas, value, onChange, placeholder = 'Selecciona tu nombre...' }) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const seleccionada = invitadas.find((i) => i.id === value);

  useEffect(() => {
    if (!abierto) return;

    const handleClickFuera = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) setQuery('');
  }, [abierto]);

  const filtradas = query.trim()
    ? invitadas.filter((i) => i.nombre.toLowerCase().includes(query.trim().toLowerCase()))
    : invitadas;

  const handleSelect = (inv) => {
    onChange(inv.id);
    setAbierto(false);
  };

  return (
    <div className={`kawaii-combobox ${abierto ? 'is-open' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="kawaii-combobox-trigger"
        onClick={() => setAbierto((o) => !o)}
      >
        <Search size={16} className="kawaii-combobox-icon" />
        <span className={seleccionada ? 'kawaii-combobox-value' : 'kawaii-combobox-placeholder'}>
          {seleccionada ? seleccionada.nombre : placeholder}
        </span>
        <ChevronDown size={16} className="kawaii-combobox-chevron" />
      </button>

      <div className="kawaii-combobox-panel">
        <input
          type="text"
          className="kawaii-combobox-search"
          placeholder="Escribe tu nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <ul className="kawaii-combobox-list">
          {filtradas.length === 0 && (
            <li className="kawaii-combobox-empty">Sin resultados...</li>
          )}
          {filtradas.map((inv) => (
            <li
              key={inv.id}
              className={`kawaii-combobox-option ${inv.id === value ? 'is-selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(inv);
              }}
            >
              <span>{inv.nombre}</span>
              {inv.id === value && <Check size={14} />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default NombreCombobox;
