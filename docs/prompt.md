# Quest Board RPG — старт разработки (Day 5)

Привет. Продолжаем проект. Прикладываю 4 файла:
- `spec.md` — ТЗ (frozen)
- `README.md` — витрина
- `devlog.md` — хроника (Day 1–4 завершены)
- `prompt.md` — этот файл

## Текущее состояние (Backend MVP — 100% готов)
- **Auth:** Модели, Alembic, `security.py`, схемы, `deps.py`, `/register`, `/login`, `/me`, `/demo` (с Redis Rate Limit).
- **Game Logic:** `core/game.py` (XP, уровни, `effective_status`, `is_completed_in_current_period`).
- **Quests:** Полный CRUD, фильтры, сортировки, `archive` и `complete` (с `FOR UPDATE` и транзакцией).
- **Events:** Полный CRUD, логика `repeats_yearly` (принудительный `true` для ДР).
- **Character:** GET (со stats) и PATCH (ник, герб, TZ).
- **Инфраструктура:** JSON-логгер, CORS, CI (GitHub Actions с Postgres и Redis), pre-commit, pytest (покрытие 73.3%).
- **Frontend (старт):** Axios-клиент с интерцепторами, `AuthContext`, страницы Login (с кнопкой Demo) и Register, защищенный роутинг.

## Уроки Day 4 (чтобы не повторять ошибки)
1. **Windows + async pytest:** Ошибка `Event loop is closed`. Решение: использовать `engine.dispose()` после каждого теста в `conftest.py` и мокать Redis через `unittest.mock`.
2. **Pydantic `date`:** Имя поля `date` перекрывает тип `date`. Решение: импортировать `import datetime` и использовать `datetime.date`.
3. **TypeScript strict:** CI падает на неиспользуемых переменных (`TS6133`). Решение: удалять неиспользуемые импорты/переменные перед коммитом.
4. **Docker SSL:** При сборке может упасть `pip install` с `SSLError`. Решение: просто перезапустить `docker compose up --build`.

## Правила работы
1. Отвечай по-русски. Код — в тройных бэктиках.
2. Инкрементальность. Один логический блок за раз.
3. Git Flow: работаем в ветке `feat/day-5`, PR в `main` со Squash Merge, только при зелёном CI.
4. **Никаких догадок:** Если нужен контекст существующих файлов — прямо проси их прислать.
5. В конце дня обновляем `devlog.md` и делаем Squash & Merge.

## Что делаем сейчас — Day 5 (Frontend Board & Quests)
Мне нужны шаги в таком порядке:
1. **API Quests (`api/quests.ts`)**: типы Quest, хуки TanStack Query для получения списка.
2. **Доска квестов (`pages/Board.tsx`)**: отрисовка карточек (QuestCard), цвета редкости/ранга из `constants.ts`.
3. **Форма создания квеста (`pages/QuestForm.tsx`)**: POST-запрос, выбор ранга, редкости, дедлайна.
4. **Действие Complete**: кнопка «Выполнить», POST-запрос, инвалидация кэша TanStack Query и простенькая анимация XP.

Напиши первый шаг: API Quests и типы (`api/quests.ts`). Поехали.
