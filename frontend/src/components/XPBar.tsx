import { motion } from 'framer-motion';

interface XPBarProps {
  current: number;
  max: number;
}

export function XPBar({ current, max }: XPBarProps) {
  const percent = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2 text-[#3b2f2f] font-bold font-fantasy tracking-wide">
        <span>Опыт</span>
        <span>{current} / {max} XP</span>
      </div>
      {/* Темный фон для пустой части полоски + рамка */}
      <div className="w-full h-5 bg-[#c4a982] border-2 border-[#5c4033] rounded-sm overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-amber-600 border-r-2 border-amber-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
