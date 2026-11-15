interface EmblemProps {
  seed: string;
  guildSymbol?: string | null;
  size?: number;
}

const SHAPES = {
  shield: "M 50 5 L 90 15 L 90 50 C 90 80 50 95 50 95 C 50 95 10 80 10 50 L 10 15 Z",
  circle: "M 50 5 A 45 45 0 1 1 50 95 A 45 45 0 1 1 50 5 Z",
  diamond: "M 50 5 L 95 50 L 50 95 L 5 50 Z",
  pointed: "M 50 5 L 90 20 L 80 70 L 50 95 L 20 70 L 10 20 Z",
};

export function Emblem({ seed, guildSymbol, size = 120 }: EmblemProps) {
  let customData = null;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const h1 = hash % 360;
  const h2 = (hash >> 2) % 360;
  const h3 = (hash >> 4) % 360;

  // Пытаемся распарсить seed как JSON с кастомными настройками
  try {
    const parsed = JSON.parse(seed);
    if (parsed && typeof parsed === 'object' && parsed.symbol) {
      customData = parsed;
    }
  } catch (e) {
    // Если не JSON — работаем со старым seed
  }

  // Если пользователь выбрал кастомный герб через модалку
  if (customData) {
    const path = SHAPES[customData.shape as keyof typeof SHAPES] || SHAPES.shield;
    return (
      <div className="relative flex items-center justify-center drop-shadow-lg" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0">
          <path d={path} fill="#1a1512" stroke={customData.borderColor || '#5c4033'} strokeWidth="6" strokeLinejoin="round" />
        </svg>
        <div
          className="relative z-10"
          style={{
            width: size * 0.55,
            height: size * 0.55,
            WebkitMaskImage: `url(/icons/${customData.symbol}.svg)`,
            maskImage: `url(/icons/${customData.symbol}.svg)`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            backgroundColor: customData.iconColor || '#f59e0b',
          }}
        />
      </div>
    );
  }

  // Если передан просто guildSymbol (старая логика)
  if (guildSymbol) {
    return (
      <div className="relative flex items-center justify-center drop-shadow-lg" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0">
          <path d={SHAPES.shield} fill="#1a1512" stroke="#5c4033" strokeWidth="4" strokeLinejoin="round" />
        </svg>
        <div
          className="relative z-10"
          style={{
            width: size * 0.6,
            height: size * 0.6,
            WebkitMaskImage: `url(/icons/${guildSymbol}.svg)`,
            maskImage: `url(/icons/${guildSymbol}.svg)`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            backgroundColor: '#f59e0b',
          }}
        />
      </div>
    );
  }

  // Процедурный герб (дефолт)
  const color1 = `hsl(${h1}, 70%, 50%)`;
  const color2 = `hsl(${h2}, 60%, 40%)`;
  const bgColor = `hsl(${h3}, 30%, 20%)`;
  const variant = hash % 3;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
      <path d={SHAPES.shield} fill={bgColor} stroke={color1} strokeWidth="4" strokeLinejoin="round" />
      {variant === 0 && <circle cx="50" cy="50" r="20" fill={color2} />}
      {variant === 1 && <polygon points="50,25 70,50 50,75 30,50" fill={color2} />}
      {variant === 2 && (
        <>
          <line x1="25" y1="30" x2="75" y2="70" stroke={color2} strokeWidth="8" strokeLinecap="round" />
          <line x1="75" y1="30" x2="25" y2="70" stroke={color2} strokeWidth="8" strokeLinecap="round" />
        </>
      )}
      <path d="M 25 20 Q 50 10 75 20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
