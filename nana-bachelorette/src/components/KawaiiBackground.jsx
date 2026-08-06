const DOODLES = [
  { top: '6%', left: '8%', size: 26, type: 'star', color: 'var(--kawaii-pink)' },
  { top: '14%', left: '82%', size: 20, type: 'heart', color: 'var(--kawaii-lavender)' },
  { top: '24%', left: '20%', size: 16, type: 'sparkle', color: 'var(--kawaii-blue)' },
  { top: '10%', left: '45%', size: 22, type: 'cloud', color: 'var(--kawaii-mint)' },
  { top: '38%', left: '90%', size: 18, type: 'star', color: 'var(--kawaii-pink)' },
  { top: '48%', left: '5%', size: 24, type: 'moon', color: 'var(--kawaii-lavender)' },
  { top: '62%', left: '85%', size: 20, type: 'heart', color: 'var(--kawaii-pink)' },
  { top: '72%', left: '12%', size: 18, type: 'sparkle', color: 'var(--kawaii-blue)' },
  { top: '80%', left: '55%', size: 22, type: 'star', color: 'var(--kawaii-mint)' },
  { top: '90%', left: '25%', size: 16, type: 'heart', color: 'var(--kawaii-lavender)' },
  { top: '55%', left: '40%', size: 18, type: 'cloud', color: 'var(--kawaii-pink)' },
  { top: '5%', left: '65%', size: 16, type: 'sparkle', color: 'var(--kawaii-mint)' },
];

function Doodle({ type, color, size }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' };

  switch (type) {
    case 'heart':
      return (
        <svg {...common}>
          <path
            d="M12 20 C6 15 2 11 2 7.5 C2 4.5 4.5 2.5 7 2.5 C9 2.5 10.5 3.7 12 6 C13.5 3.7 15 2.5 17 2.5 C19.5 2.5 22 4.5 22 7.5 C22 11 18 15 12 20 Z"
            stroke={color}
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path
            d="M12 2 L14.4 9 L22 9 L15.8 13.5 L18 21 L12 16.5 L6 21 L8.2 13.5 L2 9 L9.6 9 Z"
            stroke={color}
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path
            d="M20 13 A8 8 0 1 1 11 4 A6.2 6.2 0 0 0 20 13 Z"
            stroke={color}
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'cloud':
      return (
        <svg {...common}>
          <path
            d="M6 17 a4 4 0 0 1 0 -8 a5 5 0 0 1 9.6 -1.6 A4.5 4.5 0 0 1 18 17 Z"
            stroke={color}
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'sparkle':
    default:
      return (
        <svg {...common}>
          <path
            d="M12 2 L13.3 10.7 L22 12 L13.3 13.3 L12 22 L10.7 13.3 L2 12 L10.7 10.7 Z"
            stroke={color}
            strokeWidth="1.4"
          />
        </svg>
      );
  }
}

function KawaiiBackground() {
  return (
    <div className="kawaii-bg-decor" aria-hidden="true">
      {DOODLES.map((d, i) => (
        <span
          key={i}
          className="kawaii-doodle"
          style={{ top: d.top, left: d.left }}
        >
          <Doodle type={d.type} color={d.color} size={d.size} />
        </span>
      ))}
    </div>
  );
}

export default KawaiiBackground;
