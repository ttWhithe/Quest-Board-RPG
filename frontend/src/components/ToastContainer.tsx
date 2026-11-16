import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="pointer-events-auto bg-[#1a1512] border-2 rounded-lg p-4 shadow-2xl flex items-start gap-3 w-80 relative overflow-hidden"
            style={{ borderColor: toast.color || '#5c4033' }}
          >
            {/* Свечение на фоне */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(circle at top right, ${toast.color || '#5c4033'}, transparent)` }}
            />

            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-black/30 rounded-md border border-white/10 z-10">
              {toast.icon ? (
                <div
                  className="w-6 h-6"
                  style={{
                    WebkitMaskImage: `url(/icons/${toast.icon}.svg)`,
                    maskImage: `url(/icons/${toast.icon}.svg)`,
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    backgroundColor: toast.color || '#f4ebd8',
                  }}
                />
              ) : (
                <span className="text-xl">🏆</span>
              )}
            </div>

            <div className="flex-1 z-10">
              <h4 className="font-bold text-sm font-fantasy uppercase tracking-wider" style={{ color: toast.color || '#f4ebd8' }}>
                {toast.title}
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 leading-tight">{toast.description}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors z-10"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
