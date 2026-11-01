# Quest Board RPG — старт разработки (Day 2)

Привет. Продолжаем проект. Прикладываю 4 финальных файла — читай их полностью:
- `spec.md` — ТЗ (frozen, меняем только через Find -> Replace)
- `README.md` — витрина проекта
- `devlog.md` — хроника (Day 1 полностью завершен)
- `prompt.md` — этот файл

## Текущее состояние (что уже готово на 100%)
- **Backend:** каркас FastAPI, PostgreSQL в Docker, async SQLAlchemy, Alembic (миграции применены).
- **Модели:** `User`, `Quest`, `Event` (+ Enum'ы).
- **Инфраструктура:** Настроен JSON-логгер с `X-Request-ID`, CORS, `pytest` (покрытие 70%+), `ruff`, `mypy strict`.
- **CI:** GitHub Actions (зеленый, pre-commit установлен).
- **Frontend:** Vite + React + TS (v5.9), Tailwind, React Router, TanStack Query, Axios-клиент (с интерцепторами), i18n (RU).

## Правила работы
1. **Отвечай по-русски.**
2. **Код — в тройных бэктиках.**
3. **Правки в spec.md** — только в формате «Найди: … Замени на: …».
4. **Инкрементальность.** Один логический блок за раз. Выдал → я запустил → отписался → идём дальше.
5. **Спорные решения** — сначала вопрос с 2–3 вариантами, потом код.
6. **Git Flow:** Разработка ведется в фича-ветках (`feat/...`, `fix/...`). В `main` напрямую не пушим (кроме документации). Ветка сливается в `main` только через Pull Request при зеленом CI. Всегда напоминай мне об этом, если я предлагаю закоммитить код напрямую в `main`.

## Что делаем сейчас — Day 2 (Auth)
Мы остановились на пороге создания логики авторизации. Мне нужны файлы:
1. `app/core/security.py` — хеширование паролей (bcrypt напрямую), создание JWT (HS256, 7 дней), генерация `emblem_seed`.
2. `app/schemas/user.py` — Pydantic-схемы (`UserBase`, `UserCreate` с валидацией пароля/никнейма, `UserOut`).
3. `app/schemas/auth.py` — `LoginRequest`, `TokenResponse`.
4. `app/core/deps.py` — зависимость `get_current_user` (чтение Bearer-токена, поиск юзера в БД).
5. `app/api/auth.py` — эндпоинты `/register` (201, `EMAIL_TAKEN` при дубликате) и `/login` (200, `INVALID_CREDENTIALS`). Подключение роутера в `main.py`.

Напиши первый шаг: `security.py` и `schemas/`. Поехали.

---
*(Советы на будущее: Docker greenlet уже учтен в pyproject, TS зафиксирован на ~5.9.0)*
