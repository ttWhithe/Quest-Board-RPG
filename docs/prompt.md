# Quest Board RPG — старт разработки (Day 4)

Привет. Продолжаем проект. Прикладываю 4 файла:
- `spec.md` — ТЗ (frozen)
- `README.md` — витрина
- `devlog.md` — хроника (Day 1–3 завершены)
- `prompt.md` — этот файл

## Текущее состояние (Backend 80% готов)
- **Auth:** Модели `User/Quest/Event`, Alembic, `security.py`, `schemas/user.py`, `deps.py` (`get_current_user`), `api/auth.py` (register/login/me).
- **Game Logic:** `core/game.py` (XP, уровни, `effective_status`, `is_completed_in_current_period`).
- **Quests:** Полный CRUD, фильтры, сортировки, `archive` и `complete` (с `FOR UPDATE` и транзакцией).
- **Character:** GET (со stats) и PATCH (whitelist: ник, герб, TZ).
- **Инфраструктура:** JSON-логгер, CORS, CI (GitHub Actions), pre-commit, pytest (юнит-тесты, покрытие 71.5%).
- **Frontend:** Заглушка Vite + React, базовый роутинг (еще не подключен к API).

## Уроки Day 3 (чтобы не повторять ошибки)
1. **204 No Content:** FastAPI падает с `AssertionError`, если возвращаешь 204 с телом. Нужно использовать `response_class=Response` и возвращать `Response(status_code=204)`.
2. **Ошибки Pydantic:** Стандартные ошибки отдают `type="missing"`, а не `VALIDATION_ERROR`. В `main.py` добавлен маппинг.
3. **Concurrency:** При `complete` инкремент XP делать строго через `update(User).values(total_xp=User.total_xp + xp)`, а не `+=` в Python.
4. **Pre-commit:** На Windows автоматически фиксит `mixed line endings` (CRLF -> LF) и пробелы. Если hook падает — просто сделай `git add` еще раз и повтори коммит.
5. **Mypy + Enum:** Для сравнения `Mapped[Enum]` со строками в `Literal` используем `.value` или явное приведение, чтобы strict mypy не ругался.

## Правила работы
1. Отвечай по-русски. Код — в тройных бэктиках.
2. Инкрементальность. Один логический блок за раз.
3. Git Flow: работаем в ветке `feat/day-4`, PR в `main` со Squash Merge, только при зелёном CI.
4. **Никаких догадок:** Если нужен контекст существующих файлов — прямо проси их прислать.
5. В конце дня обновляем `devlog.md` и делаем Squash & Merge.

## Что делаем сейчас — Day 4 (Events, Demo & Frontend Start)
Мне нужны шаги в таком порядке:
1. **API Событий (`/events`)**: CRUD (GET, POST, PATCH, DELETE) с логикой `repeats_yearly` для дней рождения (§6.3).
2. **Demo-режим (`POST /auth/demo`)**: Создание пользователя с детерминированным сидом (13 квестов, 4 события, `total_xp=238`) и Redis Rate Limit (5 запросов/час с IP).
3. **Интеграционные тесты**: Проверка `/complete` (XP, атомарность), 404 для чужих квестов, 409 `IMMUTABLE_AFTER_COMPLETION`.
4. **Frontend (старт)**: Подключение Axios-клиента к API, страница логина/регистрации, базовый роутинг с защитой (если нет токена -> редирект).

Напиши первый шаг: API Событий (`schemas/event.py` и `api/events.py`). Поехали.
