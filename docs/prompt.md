# Quest Board RPG — старт разработки (Day 3)

Привет. Продолжаем проект. Прикладываю 4 файла:
- `spec.md` — ТЗ (frozen)
- `README.md` — витрина
- `devlog.md` — хроника (Day 1 и Day 2 завершены)
- `prompt.md` — этот файл

## Текущее состояние (100% готово)
- **Backend (Auth):** Модели `User/Quest/Event`, Alembic, `security.py` (bcrypt, JWT), `schemas/user.py`, `deps.py` (get_current_user), `api/auth.py` (register/login/me), обработчики ошибок в `main.py`.
- **Инфраструктура:** Настроен JSON-логгер, CORS, CI (GitHub Actions) на все ветки, pre-commit, pytest (покрытие 91%).
- **Frontend:** Заглушка Vite + React, базовый роутинг.

## Уроки Day 2 (чтобы не повторять ошибки)
1. **Windows:** Для работы `zoneinfo` локально добавлен пакет `tzdata` в `pyproject.toml`.
2. **Тесты БД на Windows:** В `conftest.py` добавлен фикс `DATABASE_URL` (localhost вместо db).
3. **Mypy:** `types-PyJWT` требует `cast(str, jwt.encode(...))` из-за старого стаба.

## Правила работы
1. Отвечай по-русски. Код — в тройных бэктиках.
2. Инкрементальность. Один логический блок за раз.
3. Git Flow: работаем в ветке `feat/quests`, PR в `main` со Squash Merge, только при зелёном CI.
4. **Никаких догадок:** Если для написания кода или фикса нужен контекст существующих файлов — прямо проси их прислать, не пытайся угадать содержимое.

## Что делаем сейчас — Day 3 (Quests CRUD + Game Logic)
Мне нужны файлы:
1. `app/core/game.py` — формулы XP (`calc_xp`), уровня (`level_for_xp`), и `effective_status`.
2. `app/schemas/quest.py` — Pydantic-схемы.
3. `app/api/quests.py` — CRUD эндпоинты и `/complete` с блокировкой `FOR UPDATE`.

Напиши первый шаг: `game.py` и `schemas/quest.py`. Поехали.
