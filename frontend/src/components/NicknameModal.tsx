import { useState } from 'react';
import { useUpdateCharacter } from '../api/character';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  currentNickname: string;
  onClose: () => void;
}

export function NicknameModal({ currentNickname, onClose }: Props) {
  const { updateUser } = useAuth();
  const { mutate: updateCharacter, isPending } = useUpdateCharacter();

  const [nickname, setNickname] = useState(currentNickname);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = () => {
    if (!nickname.trim() || nickname === currentNickname) {
      onClose();
      return;
    }

    setErrorMsg(null);
    updateCharacter({ nickname: nickname.trim() }, {
      onSuccess: (res) => {
        updateUser(res.user);
        onClose();
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.detail?.detail || err.response?.data?.detail || 'Ошибка при смене ника');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-xl font-bold font-fantasy text-[#3b2f2f]">Изменить имя</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-[#5c4033] mb-2">Новое имя:</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#e8dac1] border-2 border-[#5c4033] text-[#3b2f2f] px-3 py-2 rounded focus:outline-none focus:border-amber-700 font-bold"
              placeholder="Введите имя..."
              maxLength={32}
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-2 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded text-center">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-[#5c4033] flex justify-end gap-2 bg-[#e8dac1]">
          <button onClick={onClose} className="px-4 py-2 font-bold text-[#5c4033] hover:text-black">Отмена</button>
          <button onClick={handleSave} disabled={isPending} className="px-6 py-2 bg-amber-700 text-white font-bold rounded shadow hover:bg-amber-800 disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
