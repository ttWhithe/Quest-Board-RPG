import { motion } from 'framer-motion';
import { getLevelTitle } from '../constants';

interface Props {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
        className="bg-[#f4ebd8] border-4 border-amber-700 rounded-lg shadow-[0_0_50px_rgba(245,158,11,0.5)] w-full max-w-md p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Фоновые лучи */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent opacity-50 pointer-events-none" />

        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-6xl mb-4"
        >
          🌟
        </motion.div>

        <h2 className="text-3xl font-bold text-[#3b2f2f] font-fantasy mb-2 uppercase tracking-widest text-amber-800">
          Новый уровень!
        </h2>

        <div className="w-24 h-24 bg-amber-700 text-white rounded-full border-4 border-amber-400 flex items-center justify-center font-bold text-5xl shadow-lg my-4 relative z-10">
          {level}
        </div>

        <p className="text-xl font-bold text-[#5c4033] mb-2">
          Ты достиг звания
        </p>
        <p className="text-2xl font-bold text-amber-700 font-fantasy uppercase mb-8">
          {getLevelTitle(level)}
        </p>

        <button
          onClick={onClose}
          className="btn-wood px-8 py-3 text-lg font-bold w-full relative z-10"
        >
          Продолжить путь
        </button>
      </motion.div>
    </div>
  );
}
