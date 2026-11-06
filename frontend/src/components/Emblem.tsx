interface EmblemProps {
  seed: string;
  size?: number;
}

export function Emblem({ seed, size = 120 }: EmblemProps) {
  // Простейший хеш для получения детерминированных чисел из seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  // Генерация цветов на основе хеша
  const h1 = hash % 360;
  const h2 = (hash >> 2) % 360;
  const h3 = (hash >> 4) % 360;

  const color1 = `hsl(${h1}, 70%, 50%)`;
  const color2 = `hsl(${h2}, 60%, 40%)`;
  const bgColor = `hsl(${h3}, 30%, 20%)`;

  // Вариант узора (0, 1 или 2)
  const variant = hash % 3;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
      {/* Форма щита */}
      <path
        d="M 50 5 L 90 15 L 90 50 C 90 80 50 95 50 95 C 50 95 10 80 10 50 L 10 15 Z"
        fill={bgColor}
        stroke={color1}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Внутренний узор */}
      {variant === 0 && (
        <circle cx="50" cy="50" r="20" fill={color2} />
      )}
      {variant === 1 && (
        <polygon points="50,25 70,50 50,75 30,50" fill={color2} />
      )}
      {variant === 2 && (
        <>
          <line x1="25" y1="30" x2="75" y2="70" stroke={color2} strokeWidth="8" strokeLinecap="round" />
          <line x1="75" y1="30" x2="25" y2="70" stroke={color2} strokeWidth="8" strokeLinecap="round" />
        </>
      )}

      {/* Блик для объема */}
      <path
        d="M 25 20 Q 50 10 75 20"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
