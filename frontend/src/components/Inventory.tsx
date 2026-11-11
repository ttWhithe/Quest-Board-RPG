import { useState } from 'react';

export function Inventory() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="parchment-card p-6">
      <div className="flex justify-between items-center mb-4 border-b-2 border-tavern-wood pb-2">
        <h3 className="text-xl font-bold text-gray-800 font-fantasy">Инвентарь</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-amber-700 hover:text-amber-900 font-bold underline"
        >
          Полный инвентарь
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square border border-[#5c4033] bg-[#e8dac1] rounded-sm flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
          >
            {i === 0 && <span className="text-2xl">🗡️</span>}
            {i === 1 && <span className="text-2xl">💍</span>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4 border-b border-[#5c4033] pb-2">
              <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">Сумка странника</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-[#5c4033] hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-center text-gray-500 italic mt-10 mb-10">
              Пока здесь пусто... (в разработке)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
