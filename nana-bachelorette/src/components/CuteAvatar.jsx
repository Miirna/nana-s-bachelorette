function CuteAvatar() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Gatito novia">
      {/* Velo */}
      <path
        d="M50 8 C30 8 22 28 25 45 L19 51 Q50 39 81 51 L75 45 C78 28 70 8 50 8 Z"
        fill="#ffffff"
        opacity="0.6"
      />
      {/* Orejas */}
      <path d="M28 32 L19 11 L42 26 Z" fill="#fff0f6" stroke="#ff9ecb" strokeWidth="2" strokeLinejoin="round" />
      <path d="M72 32 L81 11 L58 26 Z" fill="#fff0f6" stroke="#ff9ecb" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 29 L25 17 L38 27 Z" fill="#ffc2dd" />
      <path d="M70 29 L75 17 L62 27 Z" fill="#ffc2dd" />
      {/* Cara */}
      <circle cx="50" cy="56" r="30" fill="#fff8fb" stroke="#ff9ecb" strokeWidth="2" />
      {/* Cachetes */}
      <circle cx="29" cy="61" r="6" fill="#ffd6e8" opacity="0.8" />
      <circle cx="71" cy="61" r="6" fill="#ffd6e8" opacity="0.8" />
      {/* Ojitos felices */}
      <path d="M33 51 Q38 45 43 51" stroke="#5b3a56" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M57 51 Q62 45 67 51" stroke="#5b3a56" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* Nariz */}
      <path d="M47 59 L53 59 L50 63 Z" fill="#ff9ecb" />
      {/* Boca */}
      <path d="M50 63 Q50 67 46 67 M50 63 Q50 67 54 67" stroke="#5b3a56" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Bigotes */}
      <path
        d="M13 57 L28 59 M13 63 L28 61 M87 57 L72 59 M87 63 L72 61"
        stroke="#c9b6f7"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Flor del velo */}
      <circle cx="50" cy="13" r="4" fill="#ff9ecb" />
      <circle cx="44" cy="16" r="3" fill="#ffd6e8" />
      <circle cx="56" cy="16" r="3" fill="#ffd6e8" />
    </svg>
  );
}

export default CuteAvatar;
