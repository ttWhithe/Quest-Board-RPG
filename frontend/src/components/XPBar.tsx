import { motion } from 'framer-motion';

interface XPBarProps {
  current: number;
  max: number;
}

export function XPBar({ current, max }: XPBarProps) {
  const percent = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1 text-gray-600 font-medium">
        <span>Опыт</span>
        <span>{current} / {max} XP</span>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
