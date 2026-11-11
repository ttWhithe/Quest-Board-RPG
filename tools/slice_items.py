from PIL import Image
import os

INPUT_IMAGE = "frontend/public/items/RPG items.png"
OUTPUT_DIR = "frontend/public/items"

# ВСТАВЬ СЮДА ТОЧНЫЕ КООРДИНАТЫ В ПИКСЕЛЯХ
# Открой картинку в Paint, наведи мышку на верхний левый угол 1-го предмета
START_X = 18  # например: 12
START_Y = 88  # например: 95

# Наведи мышку на нижний правый угол 100-го предмета
END_X = 717    # например: 1920
END_Y = 860    # например: 1080

def slice_image():
    img = Image.open(INPUT_IMAGE)

    # Общая ширина и высота сетки из 10x10 предметов
    grid_width = END_X - START_X
    grid_height = END_Y - START_Y

    tile_w = grid_width / 10
    tile_h = grid_height / 10

    count = 1
    for r in range(10):
        for c in range(10):
            left = START_X + int(c * tile_w)
            top = START_Y + int(r * tile_h)
            right = START_X + int((c + 1) * tile_w)
            bottom = START_Y + int((r + 1) * tile_h)

            tile = img.crop((left, top, right, bottom))

            filename = f"item_{count:03d}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            tile.save(filepath, "PNG")
            count += 1

    print(f"✅ Нарезано {count - 1} предметов.")

if __name__ == "__main__":
    slice_image()
