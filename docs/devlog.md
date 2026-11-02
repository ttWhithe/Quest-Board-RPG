# Devlog — Quest Board RPG

Хроника разработки. Обновляется в конце каждого рабочего блока.

> Формат записи: `## [YYYY-MM-DD HH:MM] — краткий заголовок`
> Внутри: что сделано, что залипло, решения, что дальше.

## Шаблон

```markdown
## [YYYY-MM-DD HH:MM] — заголовок
- **Сделано:**
- **Застрял / потратил время на:**
- **Решение:**
- **Дальше:**
```

## [2026-11-01] — Day 0: фиксация ТЗ
- Стек утверждён (spec.md §2), зависимости зафиксированы (§2.1).
- Скоуп зафиксирован (spec.md §4).
- Уточнены: demo seed XP (238, level 3), character stats, complete edges, concurrency (FOR UPDATE), auth validations, полный каталог ошибок, wireframes.
- Решено: без деплоя, запуск через docker-compose.
- Файлы разделены: `spec.md` (ТЗ), `README.md` (быстрый старт), `devlog.md` (эта хроника).
- **Дальше:** каркас репо, docker-compose, модели, Alembic initial, auth.

## [2026-11-01 13:10] — Day 1: скелет репозитория + Docker
- **Сделано:**
  - Репо-каркас по §8: `backend/`, `frontend/` (пусто до Vite), `.github/workflows/`, `tools/`.
  - `backend/pyproject.toml`: deps §2.1 + dev, конфиг ruff, strict mypy (+ pydantic plugin), pytest.
  - `backend/Dockerfile` (python:3.12-slim).
  - `docker-compose.yml`: `db` (postgres:16-alpine) + `api` (volume, --reload).
  - `tools/scaffold.bat`, `tools/start-all.bat`.
- **Застрял:** Отсутствие `framer-motion` в ТЗ, конфликт портов 5432/8000 с другим проектом. Решено остановкой старого контейнера.
- **Дальше:** Настройка конфигов и БД.

## [2026-11-01 13:25] — config + db + logging
- **Сделано:** `app/config.py` (pydantic-settings), `app/db.py` (async engine), `app/log_setup.py` (JSON + RequestID middleware), `app/main.py` (CORS + middleware).
- **Решение:** `X-Request-ID` возвращается в ответе на все статусы. `uvicorn.access` отключен, чтобы не дублировать логи.
- **Дальше:** Alembic.

## [2026-11-01 13:50] — Alembic (async) & Models
- **Сделано:** `alembic.ini`, async `env.py`. Написаны модели `User`, `Quest`, `Event` (+ `enums.py`, `base.py`). Сгенерирована и применена миграция `fb283dc65afe`.
- **Застрял:** `ModuleNotFoundError: greenlet`. SQLAlchemy требует его для async.
- **Решение:** В `pyproject.toml` зависимость изменена на `sqlalchemy[asyncio]`.
- **Дальше:** Тесты и линтеры.

## [2026-11-01 14:05] — Backend tests & linting
- **Сделано:** `conftest.py` (httpx ASGI), `test_health.py`. Настроен `ruff` (исключен `alembic/`), `mypy` strict.
- **Застрял:** mypy ругался на `Mapped["User"]` (F821).
- **Решение:** Добавлен `if TYPE_CHECKING:` для импорта связанных моделей.
- **Дальше:** Frontend.

## [2026-11-01 14:50] — Frontend scaffold
- **Сделано:** Vite + React + TS, Tailwind, все зависимости (framer-motion, axios, router, query, i18n). Настроен `constants.ts`, `ru.json`, `index.ts` (i18n).
- **Застрял:** Конфликт TypeScript 7.0.2 и `typescript-eslint` (ERESOLVE).
- **Решение:** Понижение версии TS до `~5.9.0` в `package.json`.
- **Дальше:** Роутинг и API-клиент.

## [2026-11-01 14:55] — API client & Routing
- **Сделано:** `api/client.ts` (axios + interceptors), `App.tsx` (QueryClient, BrowserRouter, Layout, роуты `/board`, `/login`).
- **Дальше:** CI и первый коммит.

## [2026-11-01 15:10] — Day 1 завершен: CI, pre-commit, первый коммит
- **Сделано:**
  - `.github/workflows/ci.yml`: 3 джобы (backend, frontend, docker).
  - `.pre-commit-config.yaml` (ruff + check files).
  - Первый коммит запушен на GitHub, CI зеленый.
- **Застрял:** CI упал с `Total coverage: 41%`.
- **Решение:** Модели исключены из покрытия (`.coveragerc`), добавлен `test_db.py` для проверки коннекта к Postgres.
- **Решение по процессу:** Переходим на Git Flow. Прямые пуши в `main` с кодом запрещены. Разработка ведется в ветках `feat/...`, слияние — только через PR с зеленым CI. Это исключит попадание красных крестиков в историю основной ветки.
- **Дальше:** Day 2 — Auth (Security, JWT, Bcrypt).

## [2026-11-02 19:40] — Day 2, шаг 1: security + schemas + тесты
- **Сделано:** `app/core/security.py` (bcrypt, JWT, emblem_seed), `app/schemas/user.py` (`UserCreate` + кастомные ошибки), `app/schemas/auth.py`. Создан `.venv`, добавлен `.editorconfig`. Ветка `feat/auth-schemas` запушена. **Из-за упавшего CI (46% покрытия) написаны тесты на `security.py` и `schemas/` (покрытие 91%), пофикшены локальные тесты БД (добавлен `tzdata`, настроен `conftest.py`).**
- **Застрял / потратил время на:** `import-not-found` bcrypt/jwt в mypy (запускал из системного Python); несуществующий `types-bcrypt`; `types-PyJWT 1.7.1` описывает PyJWT 1.x (`bytes` вместо `str`); `UP017` (`timezone.utc` → `UTC`); падение тестов на Windows (нет зоны `Europe/Moscow`, неверный хост БД).
- **Решение:** bcrypt даёт свои types — стаб не нужен; `cast(str, jwt.encode(...))`; `_settings = get_settings()`. Случайный коммит в `main` перенесён на `feat/auth-schemas`. Для Windows добавлен `tzdata`, в `conftest.py` прописан `localhost` для `DATABASE_URL`. CI зелёный.
- **Дальше:** шаг 2 — `app/core/deps.py` (`get_current_user`), затем шаг 3 — эндпоинты в `api/auth.py`.

## [2026-11-02 19:50] — Day 2, шаг 2: get_current_user
- **Сделано:** `app/core/deps.py` с зависимостью `get_current_user` (Bearer-токен, проверка JWT, поиск юзера в БД). Линтеры и CI зелёные.
- **Дальше:** шаг 3 — эндпоинты `api/auth.py` и кастомные обработчики ошибок в `main.py`.

## [2026-11-02 20:00] — Day 2, шаг 3: эндпоинты Auth
- **Сделано:** `app/api/auth.py` (`/register`, `/login`, `/me`), глобальные обработчики ошибок в `app/main.py` (маппинг Pydantic-ошибок в формат `{detail, code}`). Вручную проверено через Swagger: регистрация, логин, авторизация по токену. CI зелёный.
- **Дальше:** День 3 — квесты (CRUD, игровая логика XP, эффективный статус).

## Шаблон для следующих дней

```markdown
## [YYYY-MM-DD HH:MM] — заголовок
- **Сделано:**
- **Застрял / потратил время на:**
- **Решение:**
- **Дальше:**
```
