# Devlog — Quest Board RPG

Хроника разработки. Обновляется в конце каждого рабочего блока.

> Формат записи: `## [YYYY-MM-DD HH:MM] — краткий заголовок`
> Внутри: что сделано, что залипло, решения, что дальше.
> **Правило:** 1 логический шаг = 1 запись здесь.
> **Путь:** файл лежит в `docs/devlog.md` (не в `backend/`).

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

## [2026-11-03 15:30] — Day 3, шаг 1-2: Игровая логика и Quests CRUD
- **Сделано:**
  - `core/game.py`: формулы XP (`calc_xp`), уровней (`level_for_xp`, `xp_into_level`, `xp_for_next_level`), `effective_status`, `is_completed_in_current_period` (с учетом TZ).
  - `schemas/quest.py`: Pydantic-схемы для создания, обновления (с whitelist) и ответов (включая `effective_status`).
  - `api/quests.py`: полный CRUD (фильтры по `effective_status`, сортировки через `CASE`), `archive` и `complete` с `SELECT ... FOR UPDATE` и атомарным инкрементом `total_xp`.
  - `main.py`: исправлен обработчик `RequestValidationError` для корректной отдачи `VALIDATION_ERROR` вместо дефолтных типов Pydantic.
- **Застрял / потратил время на:**
  - Ошибка `AssertionError: Status code 204 must not have a response body` при `DELETE` (FastAPI).
  - Нестыковка в `main.py`: стандартные ошибки Pydantic отдавали код `missing` вместо `VALIDATION_ERROR`.
  - Pre-commit не пропустил длинный комментарий в тесте (E501).
- **Решение:**
  - Явно возвращаем `Response(status_code=204)` в `delete_quest`.
  - Добавлен маппинг: если ошибка не из кастомного списка — отдаем `VALIDATION_ERROR`.
  - Разбил комментарий на две строки.
- **Дальше:** PR в `main`, проверка CI. После мержа — Шаг 3 (`/character`).

## [2026-11-03 16:30] — Day 3, шаг 3: Карточка персонажа и фиксы покрытия
- **Сделано:**
  - `schemas/character.py`: схемы для `stats`, `by_rank` и валидация PATCH-запроса.
  - `api/character.py`: `GET /character` (подсчет выполненных/проваленных и XP) и `PATCH /character`.
  - Написаны юнит-тесты на схемы и game logic. Покрытие поднято до 71.5%.
  - Внедрены правила: 1 день = 1 ветка = 1 squash-коммит, 1 шаг = 1 запись в devlog.
- **Застрял / потратил время на:**
  - Падение CI на покрытии (69.54%) из-за большого объема нового кода без тестов.
  - Конфликт `ruff` (E501) из-за длинных строк в тестах и схемах.
- **Решение:** Написаны быстрые юнит-тесты на `CharacterUpdate` и `game.py`, длинные строки разбиты.
- **Дальше:** Day 4 — API для Событий (`/events`) и Demo-режим (`/auth/demo`).

## [2026-11-04 19:25] — Day 4, шаг 1: API Событий (`/events`)
- **Сделано:**
  - `schemas/event.py`: Pydantic-схемы (Create, Update, Out). Валидация `title` (strip + запрет пустых строк).
  - `api/events.py`: полный CRUD (`GET`, `POST`, `PATCH`, `DELETE`).
  - Логика `repeats_yearly`: `kind='birthday'` принудительно ставит `true` при создании и не дает сбросить в `false` при PATCH (422 `BIRTHDAY_MUST_REPEAT`).
  - `main.py`: подключен роутер `events` с префиксом `/api/v1`.
  - `enums.py`: классы переведены на `enum.StrEnum` (фикс Ruff `UP042`).
- **Застрял / потратил время на:**
  - `TypeError: unsupported operand type(s) for |: 'NoneType' and 'NoneType'` при старте. Поле `date` в Pydantic-схеме затеняло импортированный тип `date`.
  - `ImportError: cannot import name 'get_db'` в `events.py`.
- **Решение:**
  - В `schemas/event.py` сделан `import datetime` и обращение к `datetime.date`.
  - Заменили `get_db` на `get_session` в зависимостях FastAPI.
- **Дальше:** Шаг 2 — Demo-режим (`POST /auth/demo`) и Redis Rate Limit.

## [2026-11-04 20:20] — Day 4, шаг 2: Demo-режим и Redis
- **Сделано:**
  - `docker-compose.yml`: добавлен сервис `redis:7-alpine` и том `redisdata`.
  - `config.py`: добавлена переменная `REDIS_URL`.
  - `core/redis.py`: асинхронный клиент Redis.
  - `core/rate_limit.py`: зависимость `check_demo_rate_limit` (атомарный INCR + EXPIRE, 5 запросов/час).
  - `core/demo.py`: генерация детерминированного сида (13 квестов, 4 события, `total_xp=238`). Очистка старых демо-юзеров (>7 дней).
  - `api/auth.py`: эндпоинт `POST /auth/demo`, возвращающий JWT.
- **Застрял / потратил время на:**
  - Сборка Docker упала с `SSLError` из-за обрыва соединения при скачивании `pip` пакетов. (Помог перезапуск команды).
  - Ruff ругался на длину строк в `demo.py` и неотсортированные импорты.
  - Пропал интернет.
- **Решение:**
  - Разбил создание квестов в `demo.py` на многострочные вызовы (соблюдение E501).
  - Прогнал `ruff check . --fix`.
- **Дальше:** Шаг 3 — интеграционные тесты (фикс покрытия CI) и Шаг 4 — старт Frontend.

## [2026-11-04 21:10] — Day 4, шаг 3: Интеграционные тесты и фикс CI
- **Сделано:**
  - В `.github/workflows/ci.yml` добавлен сервис `redis:7-alpine` и переменная `REDIS_URL`.
  - Написаны интеграционные тесты `test_demo.py`: проверка создания юзера, 13 квестов, 4 событий и `total_xp=238`.
  - Написан тест на Rate Limit (проверка 429 при 6-м запросе).
  - В `conftest.py` добавлен фикс `WindowsSelectorEventLoopPolicy` и автоочистка пула БД (`engine.dispose()`).
  - В тестах Redis замокан через `unittest.mock.AsyncMock`, чтобы не зависеть от инфраструктуры.
- **Застрял / потратил время на:**
  - Долгая борьба с ошибками `RuntimeError: Event loop is closed` и `got Future attached to a different loop`. На Windows `pytest-asyncio` создает новый Event Loop на каждый тест, ломая глобальные клиенты БД и Redis.
  - Падение CI на покрытии (68.66%).
- **Решение:**
  - Изолировали тесты от реальной БД и Redis (замокали инкремент в Redis, принудительно очищаем пул БД после каждого теста).
  - Покрытие поднято до **73.38%**, CI зеленый.
- **Дальше:** Шаг 4 — Старт Frontend (Axios-клиент, страницы Login/Register, защищенный роутинг).

## [2026-11-04 21:15] — Day 4, шаг 4: Frontend Start (Auth, Routing)
- **Сделано:**
  - `types.ts`: типы `User` и `AuthResponse`.
  - `api/auth.ts`: методы для `login`, `register`, `demo`, `me`.
  - `contexts/AuthContext.tsx`: провайдер авторизации (хранение токена, авто-логаут при 401).
  - `components/ProtectedRoute.tsx`: защита роутов от неавторизованного доступа.
  - `pages/Login.tsx` и `pages/Register.tsx`: формы с валидацией, отправкой данных и кнопкой Demo-режима.
  - `App.tsx`: обновлен роутинг, добавлен `AuthProvider` и хедер с информацией о пользователе и кнопкой «Выйти».
- **Застрял / потратил время на:**
  - CI упал на сборке фронтенда с `error TS6133: 't' is declared but its value is never read` (строгий TypeScript).
- **Решение:**
  - Удален неиспользуемый хук `useTranslation` из компонента `Header`.
- **Дальше:** Day 4 завершен. Слияние в `main` через Squash & Merge. Day 5 — Доска квестов (Board).

## [2026-11-05 19:00] — Day 5, шаг 1: API Quests (типы + useQuests)
- **Сделано:**
  - `frontend/src/api/quests.ts`: типы `Quest`, `QuestFilters`, `QuestSort`, `QuestEffectiveStatus`, `QuestListResponse`.
  - Фабрика `questKeys` (базис для инвалидации в шагах 3-4).
  - Хук `useQuests(filters)` на TanStack Query v5 (`staleTime: 30s`).
  - `normalizeFilters()` — стабильный `queryKey` (пустые фильтры не плодят кэш).
  - Уточнён импорт по факту `client.ts`: `import { api } from './client'` (named, не default).
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** шаг 2 — `pages/Board.tsx` (QuestCard, цвета редкости/ранга из `constants.ts`).

## [2026-11-05 19:05] — Day 5, шаг 2: Доска квестов и QuestCard
- **Сделано:**
  - `components/QuestCard.tsx`: визуализация квеста. Цвет рамки и текста из `RARITY_COLORS`, бейдж из `RANK_COLORS`. Добавлено зачеркивание и красный крест для `effective_status === 'completed'`.
  - `pages/Board.tsx`: сетка (Tailwind grid), панель фильтров (статус, ранг, редкость, сортировка) и состояния загрузки/пустоты. Интегрирован `useQuests`.
  - `App.tsx`: `BoardPlaceholder` заменен на реальный `Board`.
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** шаг 3 — Форма создания квеста (`pages/QuestForm.tsx`).

## [2026-11-05 19:20] — Day 5, фикс CI (TS1484, TS6133)
- **Сделано:** Исправлены ошибки строгого TS. Типы (`Quest`, `QuestFilters`) переведены на `import type` (требование `verbatimModuleSyntax`). Удалены неиспользуемые импорты в `App.tsx` и `Board.tsx`.
- **Застрял / потратил время на:** Vite dev server не делает type-checking. Ошибки выявились только в `npm run build` (CI).
- **Решение:** Теперь перед пушем всегда прогоняю `npm run build`.

## [2026-11-05 19:33] — Day 5, шаг 3: Модалка создания квеста
- **Сделано:**
  - `api/quests.ts`: добавлен хук `useCreateQuest` (POST /quests) с инвалидацией кэша.
  - `components/QuestForm.tsx`: форма создания (ранг, редкость, дедлайн, повторение). Конвертация `datetime-local` в UTC ISO.
  - `pages/Board.tsx`: кнопка "Новый квест" теперь открывает модальное окно поверх доски (UX-улучшение по сравнению с отдельной страницей).
- **Застрял / потратил время на:** —
- **Решение:** Решили отойти от ТЗ (роут /quests/new) в пользу модального окна для удобства пользователя.
- **Дальше:** шаг 4 — кнопка "Выполнить" и анимация XP.

## [2026-11-05 19:55] — Day 5, шаг 4: Выполнение квеста и анимация XP
- **Сделано:**
  - `api/quests.ts`: добавлен хук `useCompleteQuest` и тип `CompleteQuestResponse`.
  - `contexts/AuthContext.tsx`: добавлена функция `updateUser` для обновления глобального состояния `total_xp` после выполнения.
  - `components/QuestCard.tsx`: кнопка «Выполнить», интеграция мутации. Добавлена анимация `+XP` через Framer Motion (`AnimatePresence`).
- **Застрял / потратил время на:** —
- **Решение:** Ошибки бэкенда (409 ALREADY_COMPLETED) выводятся через `alert`.
- **Дальше:** Финальный PR в main (Squash Merge) и обновление статуса проекта.

## [2026-11-06 20:05] — Day 6, шаг 1: API Character (типы + хуки)
- **Сделано:**
  - `frontend/src/api/character.ts`: типы `CharacterStats`, `CharacterResponse`, `CharacterUpdate`; `CharacterRank` реэкспортирован как алиас `QuestRank` (без дублирования union).
  - Фабрика `characterKeys` (`all`, `detail`) — по образцу `questKeys`.
  - Хуки `useCharacter` (GET) и `useUpdateCharacter` (PATCH) на TanStack Query v5, `staleTime: 30s`.
  - В `useUpdateCharacter` после PATCH — `setQueryData(characterKeys.detail(), data)` (мгновенный отклик).
- **Застрял / потратил время на:** —
- **Решение:**
  - `PATCH /character` возвращает полный `CharacterOut` (см. `backend/app/api/character.py`) — поэтому `setQueryData`, а не `invalidate`.
  - `AuthContext` обновляет `user` через `useState` + `authApi.me()`, а не TanStack Query — поэтому инвалидация `['auth','me']` была бы мёртвым кодом; синхронизация `user` перенесена в шаг 2 через `updateUser(data.user)`.
- **Дальше:** шаг 2 — `pages/Character.tsx` (XP-бар, статистика, процедурный герб).

## [2026-11-06 20:25] — Day 6, шаг 2: Карточка персонажа (Character page)
- **Сделано:**
  - `components/Emblem.tsx`: процедурный SVG-щит на основе хеша от `emblem_seed` (цвета и узор).
  - `components/XPBar.tsx`: полоса опыта с анимацией заполнения через Framer Motion.
  - `pages/Character.tsx`: запрос `useCharacter`, отрисовка герба, уровня, XP-бара, статистики (выполнено/провалено) и графика по рангам.
  - Внедрены экшены смены ника (через `prompt`) и смены герба (генерация нового `seed`), с синхронизацией `AuthContext` через `updateUser`.
  - `App.tsx`: добавлен защищенный роут `/character`.
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** шаг 3 — События (`pages/Events.tsx`).

## [2026-11-06 20:40] — Day 6, шаг 3: События (Events CRUD)
- **Сделано:**
  - `api/events.ts`: типы, ключи и хуки (useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent).
  - `components/EventForm.tsx`: форма создания/редактирования (ДР принудительно ставит "Ежегодно").
  - `pages/Events.tsx`: сетка карточек с иконками по типу, модалка, удаление с подтверждением.
  - `App.tsx`: добавлен роут `/events` и ссылка в хедере.
  - `prompt.md`: добавлены правила 9 (навигация cd) и 10 (визуальная проверка).
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** шаг 4 — Свиток времени (Calendar).

## [2026-11-06 20:52] — Day 6, шаг 4: Свиток времени (Calendar)
- **Сделано:**
  - `components/ScrollOfTime.tsx`: горизонтальная шкала 00:00–24:00, красная линия "сейчас" (при выбранном сегодняшнем дне), маркеры квестов (с тултипами).
  - `pages/Calendar.tsx`: навигация по дням (назад, вперед, "Сегодня"). Запрос квестов с `deadline_date`, фильтрация событий по правилам ежегодного повторения (Spec §6.3).
  - `App.tsx`: добавлен роут `/calendar` и ссылка в хедере.
- **Застрял / потратил время на:** —
- **Решение:** Для позиционирования маркеров и линии используется вычисление процента от 1440 минут (24 часа * 60).
- **Дальше:** шаг 5 — Обновление README.md.

## [2026-11-06 21:20] — Day 6, шаг 6: UI Polish & Roadmap
- **Сделано:**
  - `ScrollOfTime.tsx`: добавлен `setInterval` для обновления времени каждую минуту (красная линия теперь "живая"). Исправлено центрирование красной точки.
  - `App.tsx`: переход с `Link` на `NavLink` для подсветки активной вкладки. Добавлена мини-иконка герба в хедере.
  - `README.md` и `spec.md`: в Roadmap внесены идеи по кастомным иконкам уровней, SVG-символам гильдий и аватарам.
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** Финальный Squash & Merge Day 6.

## [2026-11-06 21:35] — Day 6, шаг 7: Финальный полишинг и Changelog
- **Сделано:**
  - `ScrollOfTime.tsx`: идеальное центрирование красной линии и точки (фикс `border-l-2` на `w-0.5`).
  - `spec.md`: добавлена запись в Changelog (v1.6).
  - `prompt.md`: добавлено правило обновлять Changelog перед PR.
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** Day 6 завершен. PR, Squash & Merge, очистка веток.

## [2026-11-07 19:50] — Day 7, шаг 1: Настройка Vitest
- **Сделано:**
  - В `package.json` добавлены `vitest` и `@vitest/coverage-v8`, скрипты `test` и `test:run` (с флагом `--passWithNoTests`).
  - Создан отдельный `vitest.config.ts` через `mergeConfig` с `vite.config.ts` (решает конфликт типов Vite 8 + Vitest).
  - В `tsconfig.app.json` добавлен тип `"vitest/globals"`.
- **Застрял / потратил время на:** Конфликт типов `PluginOption` между Vite 8 (Rolldown) и Vitest. Ошибка `No test files found` (код 1).
- **Решение:** Разделение конфигов Vite и Vitest. Флаг `--passWithNoTests` для пустых прогонов.
- **Дальше:** Шаг 2 — утилиты `rarityColor`/`rankColor` и их тесты.

## [2026-11-07 20:05] — Day 7, шаг 2: Утилиты colors + тесты
- **Сделано:** В `constants.ts` добавлены функции `rarityColor` и `rankColor` (с безопасным фолбэком). Написаны юнит-тесты в `constants.test.ts` (покрыты все цвета + Sad Path на неизвестные значения).
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** Шаг 3 — утилиты времени (`formatDeadline`, `minutesToPercent`).

## [2026-11-07 20:16] — Day 7, шаг 3: Утилиты времени + тесты
- **Сделано:** Создан `utils/date.ts` (вынесены `minutesToPercent`, `formatTime`, `formatDeadline`). Обновлены компоненты `ScrollOfTime` и `QuestCard` для использования утилит. Написаны тесты в `date.test.ts` (включая граничные случаи и `null`).
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** Шаг 4 — Обновление CI (добавить `npm test -- --run` в GitHub Actions).

## [2026-11-07 20:22] — Day 7, шаг 4: Обновление CI
- **Сделано:** В `.github/workflows/ci.yml` в джобе `frontend` раскомментирован и активирован шаг с тестами (`npm test -- --run`).
- **Застрял / потратил время на:** —
- **Решение:** —
- **Дальше:** Шаг 5 — Финальный PR, обновление `spec.md` и Squash & Merge.

## [2026-11-07 20:35] — Day 7, шаг 5: Финальный PR
- **Сделано:** Обновлены `spec.md` (Changelog v1.7) и `prompt.md` (разделение на `PROMPT-rules.md` и ежедневный план). Подготовлен финальный PR.
- **Дальше:** Day 8 — E2E / Полишинг / Деплой.

## [2026-11-08 12:45] — Day 8, шаг 1: Скелетоны загрузки
- **Сделано:** Создан `frontend/src/components/Skeletons.tsx` с компонентами `QuestCardSkeleton`, `CharacterSkeleton`, `EventCardSkeleton`, `CalendarSkeleton`.
- **Дальше:** Интегрировать скелетоны в страницы Board, Character, Events, Calendar (заменить текущие индикаторы загрузки).

## [2026-11-08 12:50] — Day 8, шаг 1: Скелетоны загрузки
- **Сделано:** Создан `frontend/src/components/Skeletons.tsx` (светлая тема, `bg-gray-200` shimmer) с `QuestCardSkeleton`, `CharacterSkeleton`, `EventCardSkeleton`, `CalendarSkeleton`. Интегрированы в `Board`, `Character`, `Events`, `Calendar` вместо текстовых «Загрузка ...». Заголовки страниц сохранены, чтобы layout не прыгал.
- **Застрял / потратил время на:** — (первый прогон скелетонов был под тёмную тему; увидел светлый UI страниц, перевыпустил под светлую палитру).
- **Решение:** —
- **Дальше:** Шаг 2 — адаптивность (мобильные разрешения, бургер-навигация если понадобится).

## [2026-11-08 13:30] — Day 8, шаг 2: UI Редизайн (Dark Fantasy & Parchment)
- **Сделано:**
  - Полный редизайн интерфейса: темный фон таверны, пергаментные карточки, сургучные печати для рангов.
  - Кастомные шрифты (Philosopher, Alegreya).
  - Убрана возможность выделения текста (кроме инпутов).
  - Мобильная адаптация: добавлено бургер-меню, sticky-хедер.
  - В `QuestCard` добавлен расчет потенциального XP до выполнения и огромный красный крест для выполненных квестов.
  - В `ScrollOfTime` добавлен список квестов дня под шкалой.
- **Застрял:** Tailwind не видел кастомные цвета из-за пустого `theme.extend`. TypeScript ругался на неиспользуемые импорты после рефакторинга.
- **Решение:** Обновлен `tailwind.config.js`, лишние импорты удалены.
- **Дальше:** Шаг 3 — Dockerization.

## [2026-11-08 15:30] — Day 8, шаг 3: Dockerization & Deploy Prep
- **Сделано:**
  - Написан `frontend/Dockerfile` (multi-stage: Node -> Nginx) и `nginx.conf` (проксирование на `/api`).
  - Настроены профили Docker (`profiles: ["prod"]`): фронтенд собирается в контейнер только при необходимости деплоя.
  - Обновлен `start-all.bat`: теперь для разработки поднимаются только БД и API в Docker, а фронт работает через локальный Vite (HMR).
  - Создан `.env.production.example` и обновлен `README.md` (инструкция по деплою).
- **Застрял / потратил время на:** Ошибка сборки Docker из-за неиспользуемого `RANK_COLORS` (TS6133). Первая сборка заняла 20 минут из-за скачивания базовых образов и `node_modules`.
- **Решение:** Удален неиспользуемый импорт. Создан `frontend/.dockerignore`, чтобы не тащить `node_modules` в контекст сборки (сборка ускорилась до 1.5 минут).
- **Дальше:** MVP полностью готов! Слияние в `main`, переход к Post-MVP или реальному деплою.

## [2026-11-09 20:20] — Day 9, шаг 1: модель UserTalent + миграция
- **Сделано:** `backend/app/models/user_talent.py` (unique `user_id+talent_code`, FK ON DELETE CASCADE, `index=True` на `user_id`). В `user.py` добавлен relationship `talents` с `cascade="all, delete-orphan"`. В `models/__init__.py` зарегистрирован `UserTalent` — без этого autogenerate не видит таблицу. Миграция `e5cc359ca348_create_user_talents.py` сгенерирована Alembic-ом, применена, проверена через `\d user_talents`, обратимость подтверждена (`downgrade -1` → `upgrade head`).
- **Застрял / потратил время на:** первую миграцию выдал вручную с выдуманным `revision_id` — пришлось откатывать и удалять. Второй autogenerate дал пустую миграцию (`pass`), потому что `UserTalent` не был импортирован в `app/models/__init__.py` — metadata была без него.
- **Решение:** миграции генерируются только через `alembic revision --autogenerate`; новые модели обязательно регистрируются в `models/__init__.py` до autogenerate.
- **Дальше:** Шаг 2 — `core/talents.py` (каталог + `available_talent_points`, `total_xp_bonus_percent`, `can_upgrade`) и тесты.

## [2026-11-09 20:35] — Day 9, шаг 2: Каталог талантов и чистые функции
- **Сделано:** `backend/app/core/talents.py` (каталог `TALENTS`, `available_talent_points`, `total_xp_bonus_percent`, `can_upgrade`). Написаны тесты в `test_talents.py` (все ветки, включая Sad Path).
- **Дальше:** Шаг 3 — API `GET /api/v1/talents` и `POST /api/v1/talents/{code}/upgrade`.

## [2026-11-09 20:58] — Day 9, шаг 3: API талантов
- **Сделано:** `backend/app/schemas/talent.py` (схемы `TalentOut`, `TalentListResponse`, `TalentUpgradeResponse`). `backend/app/api/talents.py` (`GET /talents` и `POST /talents/{code}/upgrade`). В `main.py` подключен `talents_router`. Написаны интеграционные тесты `test_talents_api.py` с полным циклом (регистрация → выполнение квеста → апгрейд таланта).
- **Застрял / потратил время на:** при написании тестов сначала использовал несуществующую фикстуру `auth_headers` (в `conftest.py` её нет). Написан локальный хелпер `_get_auth_headers`.
- **Решение:** для получения токена в тестах используется регистрация нового пользователя через `POST /api/v1/auth/register`.
- **Дальше:** Шаг 4 — Применение бонуса к XP в `POST /quests/{id}/complete` и вывод `xp_bonus_percent` в `GET /character`.

## [2026-11-09 21:15] — Day 9, шаг 4: Применение бонуса талантов к XP
- **Сделано:** В `core/game.py` в `calc_xp` добавлен опциональный аргумент `talent_bonus_percent` (по умолчанию 0). В `api/quests.py` при выполнении квеста теперь подтягиваются таланты и бонус применяется к начисляемому XP. В `schemas/character.py` и `api/character.py` добавлено поле `xp_bonus_percent`. Написан интеграционный тест `test_talent_bonus_applied`, доказывающий, что с талантом "Ученик гильдии" (2%) квест на 600 XP дает 612 XP.
- **Застрял / потратил время на:** —
- **Решение:** Бонус применяется внутри `calc_xp` как дополнительный множитель `(1 + bonus_percent / 100)`, что сохраняет единую точку правды для формул.
- **Дальше:** Шаг 5 — UI для Дерева Талантов на фронтенде.

## [2026-11-09 21:32] — Day 9, шаг 5: UI Дерева Талантов
- **Сделано:** Создан `frontend/src/api/talents.ts` (хуки `useTalents`, `useUpgradeTalent`). В `pages/Character.tsx` добавлен блок «Дерево Талантов» с отображением доступных очков, карточек талантов, их требований (prerequisites) и кнопок прокачки. Добавлен вывод `xp_bonus_percent` возле XP-бара.
- **Застрял / потратил время на:** —
- **Решение:** При успешном апгрейде таланта инвалидируются запросы как `talents`, так и `character`, чтобы обновить общий процент бонуса к опыту.
- **Дальше:** Финальный PR и Squash & Merge для Day 9.

## [2026-11-09 23:30] — Day 9, шаг 6: PoE-style UI и завершение дня
- **Сделано:** На фронтенде добавлена библиотека `react-zoom-pan-pinch`. Создана отдельная страница `/talents` (Дерево Талантов), добавлена вкладка в шапку. Реализован зум колесиком (плавный, от центра) и панорамирование. Линии между узлами отрисовываются через SVG `<path>` с изгибами (Безье) и свечением для активных узлов. Убран старый блок талантов со страницы персонажа.
- **Застрял / потратил время на:** Долгая борьба с UX зума (библиотека пыталась зумить к курсору, из-за чего были скачки), лишний скроллбар на странице. Также первая итерация генерации JSON для дерева через ИИ и скрипт дала линейную/некрасивую структуру.
- **Решение:** Зум настроен через `smooth={false}`, `step={0.05}`. Убран скроллбар через `absolute inset-0` и `overflow-hidden`. Принято решение оставить текущий JSON, полировка графа перенесена на будущее.
- **Дальше:** Day 10 — Полировка дерева талантов (если нужно) или переход к следующей Post-MVP фиче (например, Карта подземелья или Достижения).

## [2026-11-10] — Day 10, шаг 1: Раскладка ветки «Иллюзий» и подсветка путей
- **Сделано:**
  - `tools/process_svg.py`: парсит SVG с узлами (круги) и линиями (связи), пересчитывает координаты в систему веб-приложения (центр `(0,0)`, Y вверх), ориентирует рёбра от корня (BFS по глубине).
  - `backend/app/core/talent_tree.json`: перезаписан только стартом и веткой «Иллюзий» (13 узлов) — для отладки. Остальные 17 веток временно удалены.
  - `frontend/src/pages/Talents.tsx`:
    - Исправлен `activePathEdges` → теперь ищет **все** кратчайшие пути (BFS от старта + обратный BFS от цели).
    - Добавлена раскраска путей: **общий участок** (до развилки) — синий `#3B82F6`, **каждая ветка после развилки** — свой цвет (оранжевый, зелёный, красный и т.д.).
    - Сохранение `scale`, `positionX`, `positionY` в `sessionStorage` (фикс сброса зума при возврате).
    - Временные буквы-подписи (A–M) на узлах ветки «Иллюзий» для сверки с Figma.
- **Застрял / потратил время на:**
  - Ветка переворачивалась на 180° (ошибка знака в `new_y`).
  - BFS возвращал только первый путь, из-за чего подсвечивался один из двух равнозначных маршрутов.
  - Одинаковый цвет для всех веток из-за неверного индекса цвета.
  - Рёбра ориентировались в случайном направлении из-за парсинга `<line>` «как есть».
- **Решение:**
  - Исправлен знак: `new_y = CENTER_Y_OFFSET + dy`.
  - Алгоритм: два BFS (от старта и от цели) + подсчёт частоты каждого ребра. Если ребро во всех путях — синий, если в одном — цвет ветки.
  - Ориентация рёбер: строим неориентированный граф, BFS от корня даёт глубину, ребро направляем от меньшей глубины к большей.
- **Дальше:** сгенерировать остальные 17 веток (клонирование с поворотом на 20° или отрисовка в Figma), убрать отладочные буквы, обновить Changelog.

## [2026-11-09 23:30] — Day 9, шаг 6: PoE-style UI и завершение дня

## Шаблон для следующих дней

```markdown
## [YYYY-MM-DD HH:MM] — заголовок
- **Сделано:**
- **Застрял / потратил время на:**
- **Решение:**
- **Дальше:**
```
