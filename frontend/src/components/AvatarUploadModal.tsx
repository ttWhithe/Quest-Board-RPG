import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useUploadAvatar } from '../api/character';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

// Вспомогательная функция для обрезки картинки
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Canvas is empty');
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' });
      resolve(file);
    }, 'image/webp', 0.9);
  });
};

export function AvatarUploadModal({ onClose }: Props) {
  const { updateUser } = useAuth();
  const { mutateAsync: uploadAvatar, isPending } = useUploadAvatar();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setError(null);
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      const res = await uploadAvatar(croppedFile);
      updateUser(res.user); // Обновляем контекст, чтобы аватарка сразу появилась в хедере
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail?.detail || e.message || 'Ошибка загрузки');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-xl font-bold font-fantasy text-[#3b2f2f]">Смена аватара</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold">✕</button>
        </div>

        <div className="p-4 flex flex-col items-center gap-4">
          {!imageSrc ? (
            <div className="w-full h-64 border-2 border-dashed border-[#5c4033] rounded-lg flex flex-col items-center justify-center bg-[#e8dac1]/50">
              <span className="text-4xl mb-2">📸</span>
              <label className="cursor-pointer bg-amber-700 text-white px-4 py-2 rounded font-bold hover:bg-amber-800 transition-colors">
                Выбрать фото
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Квадратный кроп
                cropShape="round" // Круглая маска (как в соцсетях)
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}

          {imageSrc && (
            <div className="w-full flex items-center gap-2">
              <span className="text-sm font-bold text-[#5c4033]">Зум:</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-amber-700 border-none outline-none focus:ring-0 bg-transparent cursor-pointer"
              />
            </div>
          )}

          {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
        </div>

        <div className="p-4 border-t-2 border-[#5c4033] flex justify-end gap-2 bg-[#e8dac1]">
          <button onClick={onClose} className="px-4 py-2 font-bold text-[#5c4033] hover:text-black">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!imageSrc || isPending}
            className="px-6 py-2 bg-amber-700 text-white font-bold rounded shadow hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Загрузка...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
