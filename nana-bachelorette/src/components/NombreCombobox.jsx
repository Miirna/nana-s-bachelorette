import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

function NombreCombobox({ invitadas, value, onChange, placeholder = 'Escribe o selecciona tu nombre...' }) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Mantiene el texto sincronizado con la invitada seleccionada (externa o interna)
  useEffect(() => {
    const inv = invitadas.find((i) => i.id === value);
    setQuery(inv ? inv.nombre : '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const filtradas = query.trim()
    ? invitadas.filter((i) => i.nombre.toLowerCase().includes(query.trim().toLowerCase()))
    : invitadas;

  const handleSelect = (inv) => {
    setQuery(inv.nombre);
    onChange(inv.id);
    setAbierto(false);
  };

  const handleInputChange = (e) => {
    const texto = e.target.value;
    setQuery(texto);
    if (!abierto) setAbierto(true);

    // Si ya había una invitada seleccionada y el texto ya no coincide, se limpia la selección
    if (value) {
      const inv = invitadas.find((i) => i.id === value);
      if (!inv || inv.nombre !== texto) {
        onChange('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtradas.length > 0) handleSelect(filtradas[0]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    setAbierto(false);
    if (!value) setQuery('');
  };

  return (
    <div className={`kawaii-combobox ${abierto ? 'is-open' : ''}`} ref={wrapperRef}>
      <div className="kawaii-combobox-trigger">
        <Search size={16} className="kawaii-combobox-icon" />
        <input
          ref={inputRef}
          type="text"
          className="kawaii-combobox-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setAbierto(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <ChevronDown size={16} className="kawaii-combobox-chevron" />
      </div>

      <div className="kawaii-combobox-panel">
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
