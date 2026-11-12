from PIL import Image, ImageOps
import numpy as np
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)

INPUT_IMAGE = os.path.join(BASE_DIR, "frontend", "public", "items", "test.png")
OUTPUT_DIR = os.path.join(BASE_DIR, "frontend", "public", "items")

def slice_by_magenta_clusters():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print("Загружаем картинку...")
    img = Image.open(INPUT_IMAGE).convert("RGB")
    arr = np.array(img)

    r, g, b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
    mask = (r > 180) & (g < 80) & (b > 180)

    y_coords, x_coords = np.where(mask)

    def get_line_centers(coords, min_pixels=100):
        unique, counts = np.unique(coords, return_counts=True)
        valid_lines = unique[counts > min_pixels]

        if len(valid_lines) == 0: return []

        clusters = []
        current_cluster = [valid_lines[0]]

        for i in range(1, len(valid_lines)):
            if valid_lines[i] - valid_lines[i-1] <= 10:
                current_cluster.append(valid_lines[i])
            else:
                clusters.append(int(np.mean(current_cluster)))
                current_cluster = [valid_lines[i]]
        clusters.append(int(np.mean(current_cluster)))
        return clusters

    x_lines = get_line_centers(x_coords)
    y_lines = get_line_centers(y_coords)

    print(f"🔍 Найдено {len(x_lines)} вертикальных и {len(y_lines)} горизонтальных линий.")

    if len(x_lines) != 11 or len(y_lines) != 11:
        print("⚠️ ОШИБКА: Не найдено 11 линий.")
        return

    count = 1
    # PADDING лучше уменьшить до 1 или 2, чтобы предметы внутри 100х100 были крупнее
    PADDING = 2

    # Цвет фона для "зазоров".
    # Можно поставить (0, 0, 0, 0) для прозрачности,
    # или взять темно-коричневый цвет фона игры (например, (20, 15, 10))
    BG_COLOR = (20, 15, 10)

    for r_idx in range(10):
        for c_idx in range(10):
            left = x_lines[c_idx] + PADDING
            top = y_lines[r_idx] + PADDING
            right = x_lines[c_idx+1] - PADDING
            bottom = y_lines[r_idx+1] - PADDING

            tile = img.crop((left, top, right, bottom))

            # --- НОВЫЙ БЛОК: РЕСАЙЗ ДО 100x100 ---
            # ImageOps.pad автоматически вписывает картинку в 100х100,
            # сохраняет пропорции и центрирует её.
            final_tile = ImageOps.pad(
                tile,
                size=(100, 100),
                method=Image.Resampling.LANCZOS, # Высококачественное сглаживание
                color=BG_COLOR,                  # Цвет зазоров
                centering=(0.5, 0.5)             # Центрируем
            )
            # -------------------------------------

            filename = f"item_{count:03d}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)

            # Сохраняем уже финальную версию
            final_tile.save(filepath, "PNG")
            count += 1

    print(f"✅ Успешно нарезано и отресайзено {count - 1} предметов!")

if __name__ == "__main__":
    slice_by_magenta_clusters()
