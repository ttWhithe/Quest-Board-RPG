# Quest Board RPG — Техническое задание (ТЗ)

> **Версия:** 1.11 · **Дата:** 2026-11-11
> Веб-приложение: RPG-трекер задач в стилистике доски квестов средневековой магической гильдии.
> Пет-проект для портфолио. Один разработчик. Цель — работающий MVP с честным инженерным процессом.
> Дневник разработки — в `devlog.md`, быстрый старт — в `README.md`.

## Содержание

- §1. Vision
- §2. Технологический стек
  - §2.1. Зависимости
- §3. Язык интерфейса
- §4. Скоуп
  - §4.1. Must-have
  - §4.2. Вне MVP
  - §4.3. Принципы «быстро и MVP»
- §5. Игровая механика
  - §5.1. XP за выполнение
  - §5.2. Уровень
  - §5.3. Статусы и рекуррентность
  - §5.4. Визуальные константы и палитра
  - §5.5. XP — граничные случаи
  - §5.6. Таймзоны
- §6. Модель данных
  - §6.1. users · §6.2. quests · §6.3. events · §6.4. Индексы · §6.5. updated_at
- §7. API (v1, префикс `/api/v1`)
  - §7.1. Auth · §7.2. Quests (фильтры/сортировки) · §7.3. PATCH whitelist
  - §7.4. complete (транзакция) · §7.5. effective_status
  - §7.6. Events и Character · §7.7. Примеры · §7.8. Demo seed · §7.9. Каталог ошибок
- §8. Структура репозитория · §8.1. Карта роутов
- §9. Запуск (для README)
- §10. Стратегия тестирования · §10.1–§10.4
- §11. Definition of Done (MVP)
- §14. Observability
- §15. UX wireframes
- §16. Changelog

> §12–13 зарезервированы: §12 — дневник (переехал в `devlog.md`), §13 — roadmap (переехал в `README.md`). Ссылки `§14` из §7.9/§10.1 остаются валидными.

## 1. Vision

Трекер задач, который ощущается как доска квестов в RPG: задания имеют ранг (S–F) и редкость (common–legendary),
начисляют XP, формируют персонажа пользователя (уровень, герб, статистика) и отображаются на временной шкале («Свиток времени»).

**Гипотеза MVP:** продукт работает end-to-end — регистрация → создание квеста → выполнение → рост уровня и статистики.
Демо-режим позволяет оценить продукт без регистрации.

## 2. Технологический стек

| Слой | Технология | Примечание |
|---|---|---|
| Backend | Python 3.12, FastAPI | async |
| ORM | SQLAlchemy 2.0 (async) + asyncpg | |
| Миграции | Alembic | с первого дня |
| БД | PostgreSQL 16 | в Docker |
| Auth | JWT (access, срок 7 дней), bcrypt напрямую (не passlib) | refresh — вне MVP |
| Cache/Rate Limit | Redis 7 (для защиты demo-режима) | |
| Frontend | Vite + React 18 + TypeScript, Framer Motion (для анимаций) | |
| Стили | Tailwind CSS + CSS-переменные для редкости | без UI-кита |
| Стейт/данные | TanStack Query + React Router + date-fns | auth через React Context |
| Тесты | pytest + pytest-asyncio + httpx, pytest-cov, Vitest | строгое покрытие |
| CI | GitHub Actions (ruff + mypy + pytest-cov + vite build) | |
| Контейнеризация | Docker + docker-compose (db + redis + api) | фронт локально через Vite |
| Деплой | VPS (Timeweb/Beget) + Docker Compose | живая ссылка в README |

### 2.1 Зависимости (фиксируем версии)

**Backend (`backend/pyproject.toml`):**

```toml
fastapi = "^0.115"
"uvicorn[standard]" = "^0.32"
"sqlalchemy[asyncio]" = "^2.0"
asyncpg = "^0.30"
alembic = "^1.14"
pydantic = "^2.9"
pydantic-settings = "^2.6"
pyjwt = "^2.10"
bcrypt = "^4.2"
python-multipart = "^0.0.17"
pytest = "^8.3"
pytest-asyncio = "^0.24"
pytest-cov = "^5.0"
httpx = "^0.27"
ruff = "^0.7"
mypy = "^1.11"
pre-commit = "^3.8"
redis = "^5.1"
```

**Frontend (`frontend/package.json`):**

```json
{
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "react-router-dom": "^6.27",
    "@tanstack/react-query": "^5.59",
    "axios": "^1.7",
    "date-fns": "^4.1",
    "clsx": "^2.1",
    "react-i18next": "^15.1",
    "i18next": "^24.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4",
    "typescript": "^5.6",
    "vite": "^5.4",
    "vitest": "^2.1"
  }
}
```

## 3. Язык интерфейса

- Основной: русский.
- Английский — вне MVP, но `react-i18next` ставим сразу, ключи закладываем с первого дня.

**Конвенция ключей:** плоские, вложенные JSON по странице/домену.
Файлы: `frontend/src/i18n/ru.json`, `frontend/src/i18n/en.json` (пустой-заглушка до post-MVP).
Доступ: `const { t } = useTranslation(); t('board.title')`.

Пример `frontend/src/i18n/ru.json` (сокращённо):

```json
{
  "common": { "save": "Сохранить", "cancel": "Отмена", "delete": "Удалить", "loading": "Загрузка…" },
  "auth": { "login": "Вход", "register": "Регистрация", "demo": "Войти как гость" },
  "board": { "title": "Доска квестов", "empty": "Квестов пока нет", "filterAll": "Все" },
  "quest": {
    "create": "Новый квест",
    "fields": { "title": "Название", "description": "Описание", "rank": "Ранг", "rarity": "Редкость", "deadline": "Дедлайн" },
    "status": { "active": "В процессе", "completed": "Выполнен", "failed": "Провален", "archived": "В архиве" }
  },
  "character": { "level": "Уровень", "xp": "Опыт", "stats": "Статистика" }
}
```

## 4. Скоуп

### 4.1 Must-have (ядро MVP)

**Семантика игровых осей (важно для UI и сортировок):**
- **Редкость (`rarity`) = срочность** квеста. Визуально — цвет карточки/свечение (как в MMO).
- **Ранг (`rank`, S–F) = сложность** квеста. Визуально — текстовый бейдж. Определяет базовый XP.
- Это ортогональные оси: `S + common` (сложный, но не срочный) и `F + legendary` (пустяк, но горит) — валидные комбинации.

Остальное:
- Регистрация/логин по email+паролю, JWT.
- CRUD квестов: title, description, rank (S–F), rarity (5 уровней), deadline, status.
- Доска квестов: карточки с цветом редкости, фильтры по статусу/рангу/редкости, сортировка по дедлайну.
- Выполнение квеста → начисление XP → уровень.
- Повторяющиеся квесты: `none | daily | weekly`.
- Карточка персонажа: ник, уровень, XP-бар, герб, статистика (выполнено/провалено/по рангам).
- События-напоминания (4 вида): ДР (`birthday`), праздники (`holiday`), напоминания (`reminder`), кастомные (`custom`). Без XP.
- Свиток времени (упрощённый): горизонтальная шкала 00:00–23:59, красная линия «сейчас», маркеры квестов выбранного дня.
- Выполненные квесты зачёркнуты красным «Х» (CSS).
- Demo-режим: кнопка «Войти как гость», засеянные квесты/события, изолированный `is_demo=true` пользователь. Защита от спама через Redis Rate Limit (не более 5 demo-запросов в час с одного IP).


### 4.2 Вне MVP (roadmap, документируем в README)
- Drag & drop на доске.
- Достижения, стрики, ежедневные награды.
- Уведомления (email/push).
- i18n EN.
- Полноценный 24-часовой грид календаря с пересечениями.
- OAuth, смена темы, мобильное приложение.
- Платежи/донат (в футере — статичная ссылка «Buy me a coffee»).

### 4.3 Принципы «быстро и MVP»
- Одна точка правды для игровых формул: `backend/app/core/game.py` + `frontend/src/constants.ts`.
- Никаких `levels`-таблиц: уровень вычисляется из `total_xp`.
- XP хранится денормализованно в `users.total_xp`.
- Рекуррентные квесты не клонируются — период проверяется при чтении.

### 4.4. Post-MVP: Идеи для развития (мозговой штурм)
*Фиксируем здесь, чтобы не потерять. Реализация — строго после сдачи основного MVP.*
- **Дерево талантов:** Плоские статы (+1% к XP за уровень) и утилитарные пассивки (продление дедлайна). Очки даются за уровень персонажа.
- **Карта подземелья (Path of the Hero):** Визуальная карта на SVG. Генерируется алгоритмом (Recursive Backtracker). Каждый выполненный квест открывает шаг и снимает "Туман войны".
- **MMO-метки на карте:** Желтый `!` (срочный), Зеленый `?` (активный), Череп (проваленный), `★` (событие).
- **Боссы:** Глобальные цели (например, 500 XP), прогресс которых уменьшается от выполнения обычных квестов.
- **Титулы:** За ачивки (например, "Убийца Драконов").
- **Шеринг:** Генерация PNG-карточки персонажа для соцсетей (html-to-image).
- **Кастомные иконки уровней:** Формы (щит, лига) и цвета (редкости), зависящие от текущего уровня.
- **Гербовые символы:** Детализированные SVG-символы гильдии (дракон, рыцарь и т.д.) внутри щита.
- **Аватар пользователя:** Возможность загрузки фотографии персонажа.
- **🎨 Масштабный UI/UX Редизайн (D&D Style):** Переход от базового Tailwind к полноценному фэнтезийному интерфейсу.
  - **Визуальный стиль:** Стилистика D&D (темное фэнтези, текстуры пергамента, старинные карты, фэнтезийные шрифты).
  - **Адаптив (Mobile-First):** Полная переработка сеток, карточек и модальных окон под мобильные устройства (бургер-меню, скроллируемые календари).
  - **Кастомные ассеты:** Замена процедурных ромбиков на детализированные SVG-символы (драконы, рыцари) и уникальные иконки уровней.
  - **Кастомные компоненты:** Отказ от стандартных браузерных `select` и `input` в пользу стилизованных UI-элементов (дропдауны, чекбоксы в виде рун).
- **⚙️ Инженерные и архитектурные улучшения (Engineering Roadmap):**
  - **Real-time синхронизация (WebSockets/SSE):** Внедрение протокола для мгновенного обновления состояния доски и статистики на всех открытых вкладках пользователя без перезагрузки страницы.
  - **Оптимизация и кэширование (Redis):** Внедрение слоя кэширования для тяжелых эндпоинтов (например, `GET /character`, `GET /events`) для снижения нагрузки на PostgreSQL и уменьшения времени отклика API.
  - **Профилирование БД и SQL-оптимизация:** Проведение нагрузочного тестирования (например, Apache JMeter / Locust) для анализа запросов (`EXPLAIN ANALYZE`), настройка составных индексов и оптимизация ORM-запросов SQLAlchemy (избавление от N+1).
  - **Алгоритмы на графах (Talent Tree / Dungeon Map):** Реализация графовых структур данных на бэкенде для генерации деревьев пассивных навыков или процедурной карты приключений (поиск в ширину/глубину, алгоритм Recursive Backtracker).
  - **Полный CI/CD пайплайн:** Контейнеризация Frontend-части (Nginx), настройка GitHub Actions для автоматической сборки Docker-образов и безопасного деплоя на VPS (Zero-Downtime Deployment) при мерже в `main`.
- **🛠 Hardcore ARPG Mechanics (Itemization & Crafting System):**
  - **Масштабируемый Инвентарь:** Проектирование реляционной структуры для хранения 10 000+ предметов на пользователя. Использование виртуализированных списков (React Window) на фронтенде и композитных индексов в PostgreSQL для быстрой фильтрации.
  - **Процедурная Генерация и Крафт:** Система редкости предметов (Common -> Legendary). Улучшение предметов с экспоненциальным ростом затрат (Item Level). Наложение префиксов и суффиксов (Affixes) с эффектами (например, "Великий железный меч павшего короля").
  - **Система Сокетов (Sockets & Gems):** Возможность сверления сокетов в экипировке. Вставка камней (гемов), дающих уникальные статы. Механика деструктивной замены (старый гем/аффикс уничтожается при замене).
  - **Базовые Атрибуты (Core Stats):** Система характеристик персонажа (Сила, Ловкость, Интеллект, Выносливость), которые напрямую влияют на геймплей: урон по боссам, шанс выпадения лута (Magic Find), устойчивость к дебаффам и получаемый опыт.
  - **Экипировка (Weapons/Armor/Jewelry):** Разделение предметов на классы со своими слотами. Визуализация экипировки на процедурном гербе персонажа.
  - **Система Баффов и Дебаффов (Auras & Curses):** Временные эффекты (с тикающими таймерами на UI), влияющие на геймплей (например, +20% к XP на 1 час, или дебафф "Проклятие лени" -10% к XP).
  - **Гильдейская Витрина (Guild Card Showcase):** Выбор и закрепление до 5 достижений/титулов (с цветовым кодированием редкости), которые отображаются на экспортируемой PNG-карточке персонажа.
  - **Сабстаты и Диапазоны (RNG Affixes):** Генерация вторичных характеристик (сабстатов) со случайным роллом значений в заданном диапазоне (например, "Сила +[2-5]"). Привязка к уровню предмета (Item Level).
  - **Сет-Бонусы (Set Synergies):** Объединение предметов в сеты ("Железный воин"). Ношение 2/4/6 предметов из сета дает накопительные бонусы (например, +2 к силе за 2 предмета, +10 к защите за 6 предметов). Требует Many-to-Many связей в БД.
  - **Слоты Экипировки (Equipment Slots):** Визуальная "кукла" персонажа с раздельными слотами: Голова, Торс, Ноги, Ступни, Оружие (Main Hand), Щит (Off Hand), Кольца (x2), Амулет.
  - **Классы Оружия:** Разделение на типы (Кинжал, Меч, Щит, Катана, Лук, Двуручный меч, Копье, Топор, Коса, Магический посох). Каждый тип имеет свой базовый урон, скорость атаки и доступные сокеты.
  - **UI Инвентаря и Тултипов:** Сложные всплывающие тултипы предметов (с цветовым кодированием редкости, разбивкой на аффиксы, бонусы сетов и описанием). Использование Virtual DOM (виртуализация) для отрисовки массивов предметов без просадок FPS.
- **Атмосферное аудио (Web Audio API):** Интеграция фонового эмбиента и звуковых эффектов интерфейса (с возможностью отключения).

## 5. Игровая механика

### 5.1 XP за выполнение

```
XP = base[rank] × mult[rarity] × urgency_mult
```

- `base`: F=10, E=20, D=35, C=55, B=80, A=120, S=200
- `mult`: common=1.0, uncommon=1.2, rare=1.5, epic=2.0, legendary=3.0
- `urgency_mult`: 1.5 или 1.0 — см. §5.5
- Результат округляется вниз до целого (`math.floor`).

### 5.2 Уровень

```
level = floor(sqrt(total_xp / 50)) + 1
```

- `xp_threshold(n)` = `50 × (n−1)²` — минимальный `total_xp`, чтобы **достичь уровня n**.
- Уровень 1: `[0, 50)`; уровень 2: `[50, 200)`; уровень 3: `[200, 450)`; уровень n: `[50·(n−1)², 50·n²)`.
- `xp_into_level(total_xp)` = `total_xp − 50·(level−1)²` — сколько XP набрано внутри текущего уровня.
- `xp_for_next_level(level)` = `50·level² − 50·(level−1)²` = `50·(2·level − 1)` — сколько XP нужно, чтобы подняться с `level` на `level+1`.
- `level` — **вычисляемое** значение, в БД не хранится (см. §4.3, §6.1).

**Проверочный ряд (покрывается тестами §10.1):**

| `total_xp` | `level` | `xp_into_level` | `xp_for_next_level` |
|---|---|---|---|
| 0   | 1 | 0   | 50  |
| 49  | 1 | 49  | 50  |
| 50  | 2 | 0   | 150 |
| 199 | 2 | 149 | 150 |
| 200 | 3 | 0   | 250 |
| 300 | 3 | 100 | 250 |

### 5.3 Статусы и рекуррентность
- `status` (в БД): `active | completed | archived`.
- Просроченный `active` квест **в БД остаётся `active`**, а в API отдаётся вычисленный `effective_status='failed'` (см. §7.5).
- Рекуррентность (`recurrence`):
  - `none` → завершение ставит `status=completed`.
  - `daily | weekly` → завершение обновляет `last_completed_at`, статус остаётся `active`;
    квест считается «выполненным в текущем периоде», если `last_completed_at` попадает в текущие сутки/неделю **в таймзоне пользователя** (см. §5.6).
  - XP начисляется только один раз за период.
- Ранг/редкость квеста неизменяемы после первого выполнения (защита от читерства). Whitelist полей для PATCH — см. §7.3.

### 5.4 Визуальные константы и палитра

**Редкость (= срочность), hex-значения:**

| Rarity | Цвет | CSS-переменная |
|---|---|---|
| common | `#9CA3AF` | `--rarity-common` |
| uncommon | `#22C55E` | `--rarity-uncommon` |
| rare | `#3B82F6` | `--rarity-rare` |
| epic | `#A855F7` | `--rarity-epic` |
| legendary | `#F59E0B` | `--rarity-legendary` |

**Ранг (= сложность), hex-значения для бейджа:**

| Rank | Цвет |
|---|---|
| S | `#EF4444` |
| A | `#F97316` |
| B | `#EAB308` |
| C | `#22C55E` |
| D | `#3B82F6` |
| E | `#8B5CF6` |
| F | `#6B7280` |

- Палитра — в `frontend/src/constants.ts` (`RARITY_COLORS`, `RANK_COLORS`), покрывается тестом `rarityColor(rarity)`.
- Выполненный квест: красный «Х» (символ `✕` или SVG-крест), `text-decoration: line-through` по заголовку.

### 5.5 XP — граничные случаи

`urgency_mult` = **1.5** тогда и только тогда, когда **все три** условия истинны:
1. `recurrence = 'none'` (для `daily`/`weekly` бонуса нет — у инстанса нет своего дедлайна),
2. `deadline IS NOT NULL`,
3. `0 ≤ (deadline − now) < 24h` (строго `< 24h`; при `deadline = now` — бонус применяется, при `deadline < now` — уже нет).

Во всех остальных случаях `urgency_mult = 1.0`, в том числе:
- `deadline` отсутствует,
- `deadline` в прошлом (просрочен на 1 час, 5 дней и т.д.),
- `deadline ≥ now + 24h`.

### 5.6 Таймзоны и определение «текущих суток/недели»

- В БД все моменты времени — `timestamptz` (UTC по факту хранения).
- У пользователя есть поле `users.timezone` (IANA, e.g. `Europe/Moscow`), default `UTC`.
- При регистрации фронт шлёт `Intl.DateTimeFormat().resolvedOptions().timeZone`. При `PATCH /character` можно поменять.
- **Границы «сегодня» для `daily`** и **«этой недели» для `weekly`** вычисляются в таймзоне пользователя.
- **Начало недели — понедельник** (ISO 8601).
- «Свиток времени» показывает моменты в таймзоне пользователя; группировка по дням для `?deadline_date=YYYY-MM-DD` — тоже в таймзоне пользователя.
- Бонус `urgency_mult` (§5.5) считается в абсолютном времени (UTC), независимо от таймзоны.

## 6. Модель данных

### 6.1 `users`

| Поле | Тип | Примечание |
|---|---|---|
| id | UUID PK | |
| email | varchar unique nullable | NULL для demo |
| password_hash | varchar nullable | NULL для demo |
| nickname | varchar(32) | |
| emblem_seed | varchar(64) | seed для генерации герба |
| timezone | varchar(64) | IANA, default `'UTC'` |
| total_xp | int default 0 | денормализация, источник правды |
| is_demo | bool default false | |
| created_at | timestamptz | |
| updated_at | timestamptz | on update |

### 6.2 `quests`

| Поле | Тип | Примечание |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK→users.id ON DELETE CASCADE | |
| title | varchar(200) | |
| description | text nullable | |
| rank | enum(S,A,B,C,D,E,F) | |
| rarity | enum(common,uncommon,rare,epic,legendary) | |
| deadline | timestamptz nullable | |
| status | enum(active,completed,archived) default active | **`failed` в БД отсутствует** — только в `effective_status` |
| recurrence | enum(none,daily,weekly) default none | |
| last_completed_at | timestamptz nullable | для рекуррентных |
| completion_count | int default 0 | денормализация |
| xp_awarded_total | int default 0 | денормализация |
| created_at | timestamptz | |
| updated_at | timestamptz | on update |

**Source of truth:** для `completion_count` и `xp_awarded_total` отдельной таблицы истории выполнений в MVP **нет**. Эти поля — единственный источник правды; пересчитать из истории нельзя. В `POST /quests/{id}/complete` они и `users.total_xp` обновляются в одной транзакции (см. §7.4).

### 6.3 `events`

| Поле | Тип | Примечание |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK→users.id ON DELETE CASCADE | |
| title | varchar(200) | |
| date | date | «первая» дата события |
| kind | enum(birthday,holiday,reminder,custom) | |
| repeats_yearly | bool default false | при `kind='birthday'` всегда `true` (см. ниже) |
| created_at | timestamptz | |
| updated_at | timestamptz | on update |

**Логика отображения (однозначная):**
- `repeats_yearly = false`: событие «сегодняшнее» тогда и только тогда, когда `date` = сегодняшняя дата (в TZ пользователя).
- `repeats_yearly = true`: событие «сегодняшнее», если у `date` совпадает месяц+день с сегодняшним **и** текущий год ≥ год(`date`). До года `date` включительно не показывается.
- На календаре «Свитка времени» в конкретный день показываются события, прошедшие проверку выше для этого дня.

**Принудительный `repeats_yearly` для ДР:**
- `POST /events` с `kind='birthday'` → форсит `repeats_yearly=true` (поле в запросе игнорируется, не ошибка).
- `PATCH /events/{id}` с `kind='birthday'` и `repeats_yearly=false` → **422 `BIRTHDAY_MUST_REPEAT`**.
- `PATCH` с `kind` ≠ `'birthday'` — `repeats_yearly` свободно.

### 6.4 Индексы
- `users(email) unique`.
- `quests(user_id, status)`, `quests(user_id, deadline)`.
- `events(user_id, date)`.

### 6.5 Конвенция `updated_at`
Присутствует во всех таблицах. Обновляется приложением (SQLAlchemy `onupdate=func.now()`), не триггером — проще и достаточно для MVP.

## 7. API (v1, префикс `/api/v1`)

Общие правила:
- Аутентификация: заголовок `Authorization: Bearer <access_token>`.
- JWT: HS256, claims `{ sub: "<user_id>", exp: <unix>, iat: <unix> }`, срок 7 дней.
- Все защищённые эндпоинты возвращают 401 при отсутствии/истёкшем токене.
- В объекте `user` в ответах **никогда** не отдаётся `password_hash`.

### 7.1 Auth

**Схема `User` в ответах:**

```json
{
  "id": "uuid",
  "email": "a@b.c",
  "nickname": "Arthas",
  "emblem_seed": "dragon-42",
  "timezone": "Europe/Moscow",
  "total_xp": 300,
  "is_demo": false,
  "created_at": "2025-01-15T10:00:00Z"
}
```

| Метод | Путь | Тело → Ответ |
|---|---|---|
| POST | `/auth/register` | `{email, password, nickname, timezone?}` → `{access_token, token_type:"bearer", user}` |
| POST | `/auth/login` | `{email, password}` → `{access_token, token_type:"bearer", user}` |
| POST | `/auth/demo` | — → `{access_token, token_type:"bearer", user}` (создаёт `is_demo=true`; payload — §7.8; защита Redis Rate Limit: 5 запросов/час с IP) |
| GET | `/auth/me` | → `User` |

**Валидации (register и login):**
- **email:** `strip().lower()`, RFC-5322-basic, `≤ 254` символов. При регистрации — unique: duplicate → **409 `EMAIL_TAKEN`**. При логине — единый `401 INVALID_CREDENTIALS` независимо от того, что не так (email или пароль), чтобы не раскрывать существование аккаунта.
- **password:** `8 ≤ len(password)` **и** `len(password.encode('utf-8')) ≤ 72` (72 — лимит bcrypt в байтах, не символах; кириллица/эмодзи считаются по UTF-8).
  - `len(password) < 8` → **422 `PASSWORD_TOO_SHORT`**.
  - `len(password.encode('utf-8')) > 72` → **422 `PASSWORD_TOO_LONG`**.
- **nickname:** `2 ≤ len ≤ 32`, разрешены буквы (в т.ч. кириллица), цифры, пробел, `-`, `_`. Иначе **422 `INVALID_NICKNAME`**.
- **timezone:** если передан — валидируется через `zoneinfo.ZoneInfo`, иначе **422 `INVALID_TIMEZONE`**. Не передан — `'UTC'`.

**Demo TTL и cleanup:** каждый `POST /auth/demo` перед созданием нового demo-пользователя удаляет существующих `is_demo=true` с `created_at < now() − 7 дней` (каскадно — их квесты и события). Отдельный cron не нужен.

### 7.2 Quests — фильтры и сортировки

`GET /quests?status=&rank=&rarity=&sort=&deadline_date=&limit=&offset=`

- `status` — один из: `active | completed | failed | archived`. Работает по **effective_status** (см. §7.5). Пустое значение = без фильтра.
- `rank` — один из `S|A|B|C|D|E|F`. Пусто = все.
- `rarity` — один из `common|uncommon|rare|epic|legendary`. Пусто = все.
- `deadline_date` — `YYYY-MM-DD` в TZ пользователя; матчит квесты, у которых `deadline` попадает на этот локальный день. Пусто = без фильтра. Используется «Свитком времени».
- **sort** — один из (некорректное значение → 422 `VALIDATION_ERROR`):
  - `deadline_asc` (default) — ближайший дедлайн первым, `NULL` — в конце.
  - `deadline_desc` — дальний дедлайн первым, `NULL` — в конце.
  - `created_desc` — новые квесты первыми (по `quests.created_at`).
  - `created_asc` — старые первыми.
  - `rank_desc` — **сложные первыми**: `S → A → B → C → D → E → F`.
  - `rank_asc` — **простые первыми**: `F → E → D → C → B → A → S`.
  - `rarity_desc` — **срочные первыми**: `legendary → epic → rare → uncommon → common`.
  - `rarity_asc` — `common → uncommon → rare → epic → legendary`.
- **Тайм-брейкер:** при равенстве значений в сортируемом поле — `created_at DESC` (детерминированно, чтобы не было флаки в тестах).
- **Фильтры + sort:** независимы. `deadline_date` ограничивает набор, `sort` упорядочивает результат **внутри отфильтрованного набора**. Комбинация `deadline_date` + `sort=created_desc` валидна.
- **Пагинация:** `limit` default `50`, max `200` (`>200` → 422 `VALIDATION_ERROR`); `offset` default `0`, min `0`. Ответ — `{ items, total, limit, offset }`. `total` — количество после применения фильтров, без учёта пагинации.

| Метод | Путь | Примечание |
|---|---|---|
| GET | `/quests` | список квестов текущего юзера (см. §7.6 про пагинацию) |
| POST | `/quests` | создать (тело — см. §7.7) |
| GET | `/quests/{id}` | 404 при чужом (см. §7.9) |
| PATCH | `/quests/{id}` | whitelist полей — см. §7.3 |
| DELETE | `/quests/{id}` | |
| POST | `/quests/{id}/complete` | начисляет XP (с учётом периода для рекуррентных); тело пустое |
| POST | `/quests/{id}/archive` | ставит `status='archived'`; тело пустое |

### 7.3 PATCH `/quests/{id}` — whitelist полей

- **До первого выполнения (`completion_count = 0`)**: `title`, `description`, `rank`, `rarity`, `deadline`, `recurrence`.
- **После первого выполнения (`completion_count > 0`)**: только `title`, `description`, `deadline`. Попытка изменить `rank`, `rarity`, `recurrence` → **409 `IMMUTABLE_AFTER_COMPLETION`**.
- **Никогда через PATCH**: `status`, `user_id`, `id`, `last_completed_at`, `completion_count`, `xp_awarded_total`, `created_at`, `updated_at`.
- `status` меняется только через `POST /{id}/complete` и `POST /{id}/archive`.

### 7.4 `POST /quests/{id}/complete` — правила и транзакция

**Транзакционная семантика (важно для конкурентности):**
Внутри одной транзакции БД:
1. `SELECT * FROM quests WHERE id = :id FOR UPDATE` — блокируем строку.
2. Проверка владельца (`quest.user_id == current_user.id`); иначе → **404 `NOT_FOUND`** (см. §7.9 — чужие ресурсы неотличимы от несуществующих).
3. Проверки статуса (см. таблицу ниже) → при провале 409, транзакция откатывается.
4. Вычисление XP.
5. `UPDATE quests …` (статус / `last_completed_at` / счётчики).
6. `UPDATE users SET total_xp = total_xp + :xp …` — атомарный инкремент.
7. `COMMIT`.

> **Важно:** XP считается **только** через `calc_xp` из §5.1 + §5.5. Дублирования формул нет.
> **Важно:** вся операция — одна транзакция с `SELECT … FOR UPDATE`. Параллельный `complete` увидит обновлённое состояние и получит 409.

Параллельный `complete` того же квеста ждёт на `FOR UPDATE` и после коммита первого получит 409 по статусу. Двойного начисления нет.

**Матрица ответов:**

| Условие | Результат |
|---|---|
| `quest.user_id ≠ current_user.id` | 404 `NOT_FOUND` |
| `status = 'archived'` | 409 `QUEST_ARCHIVED` |
| `recurrence = 'none'` и `status = 'completed'` | 409 `ALREADY_COMPLETED` |
| `recurrence ∈ {daily, weekly}` и `last_completed_at` в текущем периоде (TZ пользователя) | 409 `ALREADY_COMPLETED_IN_PERIOD` |
| `recurrence = 'none'`, `status = 'active'`, `deadline < now` (просрочен в БД, в API выглядит `failed`) | **200 OK** — выполнить можно; `urgency_mult = 1.0` (см. §5.5) |
| иначе | **200 OK** |

**Тело успешного ответа:** см. §7.7.

### 7.5 `effective_status` — вычисляемый статус

В БД хранится `status` ∈ `{active, completed, archived}`. В ответах API возвращаются **и** `status`, **и** `effective_status`. Правила:

- `status = 'archived'` → `effective_status = 'archived'`.
- `status = 'completed'` → `effective_status = 'completed'`.
- `recurrence ∈ {daily, weekly}` и `last_completed_at` в текущем периоде (TZ пользователя) → `effective_status = 'completed'`.
- иначе если `deadline < now` → `effective_status = 'failed'`.
- иначе → `effective_status = 'active'`.

> **Важно:** фильтр `?status=` работает **только по `effective_status`**, никогда по сырому `status` из БД.
> **Важно:** в ответах API всегда **оба** поля — `status` (из БД) и `effective_status` (вычисленное). Фронт фильтрует и красит по `effective_status`.

**Фильтр `?status=failed`** возвращает записи с `effective_status='failed'` (просроченные `active` в БД включены).
**Фильтр `?status=active`** возвращает только `effective_status='active'` (просроченные сюда не попадают).
**Фильтр `?status=completed`** — по `effective_status`, т.е. включает текущий закрытый период рекуррентных.

### 7.6 Events и Character

**Events:**

| Метод | Путь | Примечание |
|---|---|---|
| GET | `/events` | без пагинации в MVP |
| POST | `/events` | `{title, date, kind, repeats_yearly?}`; `kind='birthday'` → `repeats_yearly` форсится `true` |
| PATCH | `/events/{id}` | whitelist: `title, date, kind, repeats_yearly`; `kind='birthday'` + `repeats_yearly=false` → 422 |
| DELETE | `/events/{id}` | |

**Character:**

| Метод | Путь | Ответ |
|---|---|---|
| GET | `/character` | `{user, level, xp_into_level, xp_for_next_level, stats}` |
| PATCH | `/character` | whitelist: `nickname`, `emblem_seed`, `timezone` (валидации — как в §7.1) |

**Определения `stats` (однозначно):**

- `completed_total` = `SUM(quests.completion_count) по всем квестам юзера` — **число выполнений**, а не квестов. Рекуррентный «Утренняя зарядка» с 30 выполнениями даст 30, а не 1.
- `failed_total` = `COUNT(quests WHERE effective_status = 'failed')` — **число квестов**, которые сейчас просрочены и не завершены. Рекуррентные сюда не попадают (у них `deadline` обычно `NULL`).
- `by_rank` = `{ rank: SUM(completion_count) GROUP BY rank }` — **число выполнений по рангам** (не число квестов). Ранги без выполнений присутствуют со значением 0.

Пример:

```json
{
  "completed_total": 42,
  "failed_total": 3,
  "by_rank": { "S": 2, "A": 5, "B": 8, "C": 12, "D": 10, "E": 3, "F": 2 }
}
```

### 7.7 Примеры запросов/ответов

> **Важно:** все три примера ниже — **единый поток** от одного пользователя:
> `register` → `POST /quests` → `POST /quests/{id}/complete`.
> `total_xp` аккумулируется, поэтому `user_after` в шаге 3 = `0 + 600 = 600`.

**Шаг 1. POST `/auth/register`**

```json
// Request
{ "email": "Hero@Example.com", "password": "s3cret!", "nickname": "Arthas", "timezone": "Europe/Moscow" }
```

```json
// Response 201 — email нормализован в lowercase
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "u-uuid",
    "email": "hero@example.com",
    "nickname": "Arthas",
    "emblem_seed": "dragon-42",
    "timezone": "Europe/Moscow",
    "total_xp": 0,
    "is_demo": false,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Шаг 2. POST `/quests`**

```json
// Request
{
  "title": "Убить дракона",
  "description": "В пещере к северу от деревни",
  "rank": "S",
  "rarity": "legendary",
  "deadline": "2025-01-20T18:00:00Z",
  "recurrence": "none"
}
```

```json
// Response 201
{
  "id": "q-uuid",
  "user_id": "u-uuid",
  "title": "Убить дракона",
  "description": "В пещере к северу от деревни",
  "rank": "S",
  "rarity": "legendary",
  "deadline": "2025-01-20T18:00:00Z",
  "status": "active",
  "effective_status": "active",
  "recurrence": "none",
  "last_completed_at": null,
  "completion_count": 0,
  "xp_awarded_total": 0,
  "created_at": "2025-01-15T10:05:00Z",
  "updated_at": "2025-01-15T10:05:00Z"
}
```

**Шаг 3. POST `/quests/{id}/complete` → 200**

Расчёт XP для `S / legendary`: `base[S]=200 × mult[legendary]=3.0 = 600`. `deadline` через 5 дней → `urgency_mult=1.0` (§5.5). `xp_awarded=600`. Новый `total_xp = 0 + 600 = 600` (уровень и границы — см. §5.2).

```json
{
  "quest": {
    "id": "q-uuid",
    "status": "completed",
    "effective_status": "completed",
    "completion_count": 1,
    "xp_awarded_total": 600,
    "last_completed_at": "2025-01-15T10:10:00Z"
  },
  "xp_awarded": 600,
  "user_after": { "total_xp": 600, "level": 4, "xp_into_level": 150, "xp_for_next_level": 350 }
}
```

**Ошибки `complete`** — 404 `NOT_FOUND`, 409 `QUEST_ARCHIVED`, 409 `ALREADY_COMPLETED`, 409 `ALREADY_COMPLETED_IN_PERIOD` (см. §7.4, §7.9).

**GET `/quests?status=active&sort=deadline_asc&limit=2`**

```json
{ "items": [ /* Quest[] */ ], "total": 8, "limit": 2, "offset": 0 }
```

### 7.8 Demo seed — спецификация

При `POST /auth/demo` создаётся пользователь + детерминированный набор данных. Идентично каждый раз, кроме случайного `emblem_seed`.

**Demo user:** `nickname = "Странник"`, `timezone = "Europe/Moscow"`, `emblem_seed` — случайный, `is_demo=true`.

**3 completed квеста** (все `status='completed'`, `last_completed_at` в прошлом). Сумма `xp_awarded_total` = **238** — по формулам без ручных подкруток:

| Квест | Ранг | Редкость | base×mult | xp_awarded_total |
|---|---|---|---|---|
| «Разобрать сумку» | C | uncommon | 55 × 1.2 | 66 |
| «Доставить письмо» | B | rare | 80 × 1.5 | 120 |
| «Собрать травы» | D | rare | 35 × 1.5 | 52 (floor 52.5) |
| **Итого** | | | | **238** |

`users.total_xp = 238` (то есть `level = 3`, `xp_into_level = 38`, `xp_for_next_level = 250`).

**1 просроченный `active`** (в API `effective_status='failed'`):
- `A / epic` «Оплатить счёт», `deadline = now − 2 дня`.

**2 рекуррентных:**
- `daily / F / common` «Утренняя зарядка», `last_completed_at = null`.
- `weekly / D / uncommon` «Недельный отчёт», `last_completed_at = null`.

**7 обычных `active`:**

| Ранг / редкость | Название | Дедлайн |
|---|---|---|
| S / legendary | «Финальный босс: сдать проект» | +3 дня |
| S / rare | «Переговоры с драконом» | +20 часов (**urgency 1.5×**) |
| A / epic | «Прочитать главу» | — |
| B / uncommon | «Позвонить кузнецу» | +5 дней |
| C / common | «Купить зелья» | +1 день |
| D / common | «Прибраться в гильдии» | — |
| E / common | «Покормить кота» | +6 часов |

**4 события:**

| kind | repeats_yearly | Название | date |
|---|---|---|---|
| birthday | true | «ДР Гильдмастера» | сегодня + 3 дня (год текущий) |
| holiday | true | «Новый год» | 1 января текущего года |
| custom | false | «Совет гильдии» | +7 дней |
| reminder | false | «Забрать заказ» | +2 дня |

**Итоговая проверка консистентности (обязательный тест):** `user.total_xp == SUM(quests.xp_awarded_total)`.

### 7.9 Каталог ошибок

**Формат ответа:** `{ "detail": "human message", "code": "SOME_CODE" }`.

**Правило 403 vs 404:** 403 **не используем**. Все запросы к чужим ресурсам возвращают **404 `NOT_FOUND`** — не раскрываем существование чужих квестов/событий.

| HTTP | `code` | Когда |
|---|---|---|
| 400 | `BAD_REQUEST` | Невалидный JSON / отсутствует обязательное поле в теле |
| 401 | `UNAUTHORIZED` | Нет `Authorization` / токен невалиден / протух |
| 401 | `INVALID_CREDENTIALS` | Неверная пара email+password на `/auth/login` |
| 404 | `NOT_FOUND` | Ресурс не существует **или** принадлежит другому пользователю |
| 409 | `EMAIL_TAKEN` | `POST /auth/register` с существующим email |
| 409 | `IMMUTABLE_AFTER_COMPLETION` | `PATCH /quests/{id}` меняет `rank`/`rarity`/`recurrence` после первого выполнения |
| 409 | `ALREADY_COMPLETED` | `complete` для `recurrence='none'` при `status='completed'` |
| 409 | `ALREADY_COMPLETED_IN_PERIOD` | `complete` для рекуррентного в уже закрытом периоде |
| 409 | `QUEST_ARCHIVED` | `complete` для `status='archived'` |
| 422 | `VALIDATION_ERROR` | Базовая ошибка Pydantic (формат полей, enum, длины) |
| 422 | `PASSWORD_TOO_SHORT` | `len(password) < 8` |
| 422 | `PASSWORD_TOO_LONG` | `len(password.encode('utf-8')) > 72` (bcrypt) |
| 422 | `INVALID_NICKNAME` | nickname вне правил §7.1 |
| 422 | `INVALID_TIMEZONE` | timezone не найдена через `zoneinfo` |
| 422 | `BIRTHDAY_MUST_REPEAT` | `PATCH /events/{id}` пытается выставить `repeats_yearly=false` при `kind='birthday'` |
| 500 | `INTERNAL_ERROR` | Непойманное исключение (логируется с request_id, см. §14) |

**Фронт** различает ошибки по `code`, а не по `detail` (текст может меняться).

## 8. Структура репозитория

```
questboard/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic
│   │   ├── api/              # auth, quests, events, character
│   │   ├── core/             # security.py, game.py, deps.py
│   │   ├── log_setup.py      # middleware + formatter (см. §14)
│   │   └── tests/
│   ├── alembic/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/            # Login, Register, Board, QuestForm, Character, Calendar, Events
│   │   ├── components/       # QuestCard, RarityBadge, RankBadge, XPBar, Emblem, ScrollOfTime
│   │   ├── api/              # axios-клиент + хуки TanStack Query
│   │   ├── hooks/
│   │   ├── i18n/             # ru.json, en.json, index.ts
│   │   ├── constants.ts      # RANK_BASE, RARITY_MULT, RANK_COLORS, RARITY_COLORS
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

### 8.1 Карта роутов фронта

| Route | Page | Запросы |
|---|---|---|
| `/login` | Login | `POST /auth/login`, `POST /auth/demo` |
| `/register` | Register | `POST /auth/register` |
| `/` | redirect | → `/board` если есть токен, иначе `/login` |
| `/board` | Board | `GET /quests` (фильтры/sort), `POST /quests/{id}/complete`, `POST /quests/{id}/archive` |
| `/quests/new` | QuestForm (create) | `POST /quests` |
| `/quests/:id/edit` | QuestForm (edit) | `GET /quests/:id`, `PATCH /quests/:id` |
| `/character` | Character | `GET /character`, `PATCH /character` |
| `/calendar` | Calendar (Свиток времени) | `GET /quests?deadline_date=YYYY-MM-DD`, `GET /events` |
| `/events` | Events | `GET /events`, `POST /events`, `PATCH /events/{id}`, `DELETE /events/{id}` |

Auth хранится в `localStorage` (ключ `qb_token`), интерцептор axios добавляет `Authorization: Bearer …` автоматически. При 401 — редирект на `/login`.

### 8.2. Git Flow и правила коммитов
- **Ежедневное ветвление:** Каждый рабочий день начинается с создания новой ветки от `main` (`git checkout -b feat/day-N-name`).
- **Инкрементальность:** 1 логический шаг (например, «схемы и game.py») = 1 запись в `devlog.md`.
- **Разработка:** Все изменения (код, тесты, devlog, prompt) коммитятся в эту ветку.
- **CI:** В ветке могут быть красные статусы CI в процессе работы, но перед созданием PR он должен быть зеленым.
- **Слияние (Squash Merge):** В конце дня создается Pull Request в `main`. Слияние происходит строго через **Squash and merge** (1 день = 1 коммит в `main`). Ветка после слияния удаляется.
- **Многострочные коммиты в Windows (cmd):** Для передачи многострочного сообщения используется несколько флагов `-m` (например, `git commit -m "Заголовок" -m "- Пункт 1" -m "- Пункт 2"`).

## 9. Запуск (для README)

```bash
# 1. Клонировать
git clone <repo> && cd questboard

# 2. Поднять БД и бэкенд
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose up --build      # api на :8000, db на :5432, миграции применяются автоматически

# 3. Фронт (в отдельном терминале)
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

**Корневой `.env.example`:**

```env
POSTGRES_USER=questboard
POSTGRES_PASSWORD=questboard
POSTGRES_DB=questboard
DATABASE_URL=postgresql+asyncpg://questboard:questboard@db:5432/questboard
JWT_SECRET=change-me
JWT_EXPIRES_DAYS=7
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
```

**`frontend/.env.example`:**

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 10. Стратегия тестирования (минимум, но честный)

### 10.1 Backend (pytest + pytest-asyncio + httpx)
- Юнит: `calc_xp` — все ранги × редкости, граничные условия `<24ч`, `=24ч`, `deadline < now`, `deadline is None`, `recurrence != 'none'`; округление вниз.
- Юнит: `level_for_xp` / `xp_into_level` / `xp_for_next_level` — границы (0, 49, 50, 199, 200, 449, 450, 2000, 20000).
- Юнит: `effective_status(quest, now, tz)` — все ветки §7.5.
- Юнит: `is_completed_in_current_period` для daily/weekly в разных TZ (в т.ч. переход через полночь в `Asia/Tokyo` при UTC now).
- Интеграция: `register → login → /auth/me`.
- Интеграция: полный CRUD квеста + `complete` проверяет прирост `total_xp`.
- Интеграция: PATCH неизменяемых полей после выполнения → 409 `IMMUTABLE_AFTER_COMPLETION`.
- Интеграция: чужой квест → 404 `NOT_FOUND` (см. §7.9).
- Интеграция: повторный `complete` для `recurrence='none'` → 409 `ALREADY_COMPLETED`.
- Интеграция: `complete` для `status='archived'` → 409 `QUEST_ARCHIVED`.
- Интеграция: demo-логин → создаётся 13 квестов (3 completed + 1 overdue + 2 recurring + 7 active) и 4 события; `user.total_xp == 238`; повторный demo-логин создаёт нового юзера, старый (старше 7 дней) удаляется.

### 10.2 Frontend (Vitest)
- Утилиты: `formatDeadline`, `minutesToPercent`, `rarityColor`, `rankColor`, `rankBadgeLabel`.
- Компонентные тесты — вне MVP.

### 10.3 E2E (опционально, при наличии дня)
- Playwright: регистрация → создание квеста → выполнение → XP вырос.

### 10.4 CI (GitHub Actions)

Файл `.github/workflows/ci.yml`:
- **Триггеры:** `push` в любые ветки, `pull_request` в `main`.
- **Правило merge (Branch Protection):** В `main` код попадает только через Pull Request при условии, что все джобы (backend, frontend, docker) прошли успешно (зеленый CI).
- **Backend job** (`backend`):
  - `runs-on: ubuntu-latest`, `services: postgres:16` (healthcheck).
  - Python 3.12, `actions/setup-python@v5` с `cache: pip`.
  - Шаги: `pip install -e ".[dev]"` → `ruff check .` → `mypy app` → `alembic upgrade head` → `pytest -q --cov=app --cov-fail-under=70`.
- **Frontend job** (`frontend`):
  - `runs-on: ubuntu-latest`.
  - Node 20, `actions/setup-node@v4` с `cache: npm` (working-directory `frontend`).
  - Шаги: `npm ci` → `npm run build` → `npm test -- --run`.
- **Docker job** (`docker`): зависит от обоих, `docker compose build` (sanity, без запуска).

Оба job-а выполняются параллельно; `docker` — только если оба зелёные.

## 11. Definition of Done (MVP)

- [ ] `docker compose up --build` + `npm run dev` дают рабочий продукт end-to-end по README.
- [ ] Все Must-have из п.4.1 реализованы.
- [ ] CI зелёный на main (включая строгий `mypy`).
- [ ] Покрытие тестами (`pytest-cov`) ≥ 70%.
- [ ] ≥ 12 backend-тестов, ≥ 5 frontend-тестов.
- [ ] Реализована анимация начисления XP (Framer Motion) и процедурная генерация герба персонажа.
- [ ] README со скриншотами и GIF демо-режима.
- [ ] `spec.md` заполнен, дневник разработки ведётся.

## 14. Observability

Минимальный, но осмысленный лог-слой — закладываем сразу.

- **Формат:** JSON-лог через stdlib `logging` + кастомный formatter (без внешних зависимостей).
- **Request ID:** middleware в FastAPI:
  - читает `X-Request-ID` из запроса или генерирует UUID4,
  - кладёт в `contextvars` и возвращает в ответе в заголовке `X-Request-ID`,
  - прикладывается к каждой строке лога в рамках запроса.
- **Лог-строка запроса** (INFO, после ответа):

  ```json
  {"ts":"2026-01-15T10:00:00Z","level":"INFO","event":"http_request","request_id":"…","method":"POST","path":"/api/v1/quests","status":201,"duration_ms":37,"user_id":"u-uuid"}
  ```

- **Ошибки (ERROR/EXC):** тот же формат + `error` (текст) + `traceback` (для 5xx).
- **Уровень** контролируется `LOG_LEVEL` (см. §9), default `INFO`.
- **Метрики/трейсинг** — вне MVP, отметить в README как roadmap.

## 15. UX wireframes (ASCII-наброски)

**Доска квестов (`/board`)**

```
┌──────────────────────────────────────────────────┐
│ [⚔ QuestBoard]  Доска квестов  [Персонаж] [+Новый]│
├──────────────────────────────────────────────────┤
│ Статус:[Все▾]  Ранг:[Все▾]  Редкость:[Все▾]      │
│ Сортировка:[Дедлайн ↑▾]                          │
├──────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │ [S] ●●●●● │  │ [S] ●●●   │  │ [A] ●●●●  │     │
│  │ Legendary │  │ Rare      │  │ Epic      │     │
│  │ Фин.босс  │  │ Дракон    │  │ Глава     │     │
│  │ +3 дня    │  │ +20 ч     │  │ без дедл. │     │
│  │ [Выполн.] │  │ [Выполн.] │  │ [Выполн.] │     │
│  └───────────┘  └───────────┘  └───────────┘     │
│  ┌───────────┐  ┌───────────┐                    │
│  │ [B] ●●●   │  │ [C] ●     │                    │
│  │ Обычный   │  │ Обычный   │                    │
│  │ ✕Разобрать│  │ ✕Купить   │  ← выполненные     │
│  │  сумку    │  │  зелья    │     (зачёркнуты)    │
│  └───────────┘  └───────────┘                    │
└──────────────────────────────────────────────────┘
```

**Карточка квеста (модалка деталей)**

```
┌────────────────────────────────────┐
│ [S]                    [●●●●● Leg] │
│ Убить дракона                      │
│ ────────────────────────────────── │
│ В пещере к северу от деревни.      │
│                                    │
│ Ранг:    S   (сложность)           │
│ Редкость: legendary (срочность)    │
│ Дедлайн: 20 янв 18:00 (через 20ч)  │
│ Награда: 600 XP (1.5× за срочность)│
│                                    │
│ [Выполнить]  [Редактировать]  [×]  │
└────────────────────────────────────┘
```

**Свиток времени (`/calendar`)**

```
┌─────────────────────────────────────────────┐
│ [←]  15 января 2025  [→]      [Сегодня]      │
├─────────────────────────────────────────────┤
│ 00:00   06:00   12:00   18:00   24:00        │
│ ──●──────●──────●───▲──●───────●───────●──    │
│              │     Сейчас (14:32)            │
│              ● квест C                       │
│                    ● квест E                 │
│     ★ ДР Гильдмастера (событие)              │
└─────────────────────────────────────────────┘
Легенда: ● квест (цвет = редкость), ★ событие,
▲ красная линия «сейчас».
```

**Персонаж (`/character`)**

```
┌────────────────────────────────────────┐
│   ╔═════╗                              │
│   ║ ⚔ ⛨ ║   Странник                   │
│   ╚═════╝   Уровень 3                  │
│                                        │
│   [████░░░░░░░░░░░░]  38 / 250 XP      │
│                                        │
│   Выполнено: 42    Провалено: 3        │
│   ────────────────────────────────     │
│   По рангам (выполнений):              │
│   S:2  A:5  B:8  C:12  D:10  E:3  F:2  │
│                                        │
│   [Изменить ник]  [Сменить герб]       │
└────────────────────────────────────────┘
```

**Общие принципы:**
- Палитра редкости и ранга — CSS-переменные из §5.4.
- Красный «Х» — `✕` (U+2715), 24×24, `color: #EF4444`, поверх заголовка.
- Пустые состояния — иконка + текст `t('board.empty')`.
- Лоадеры — скелетоны карточек, без спиннеров.
- **Анимации**: При нажатии «Выполнить» квест сгорает/зачеркивается с анимацией (Framer Motion), от карточки вверх улетает плашка `+XP`.
- **Герб персонажа**: Процедурная генерация SVG-щита на основе `emblem_seed` (случайные цвета, узоры, символы).


## 16. Changelog

- **v1.11 (2026-11-11):**
  - **Backend:** `talent_tree.json` переведен на схему v2 (`effects` с массивом `values` для разных рангов). Логика подсчета бонусов обновлена (кумулятивная сумма).
  - **Backend:** Добавлены эндпоинты `GET /character/stats` (расчет характеристик из талантов) и `GET /character/inventory` (чтение из `items.json`). Добавлены JSON-заглушки для достижений и предметов (100 шт).
  - **Frontend:** Страница `/character` переверстана в полноценный RPG-дашборд. Добавлен семиугольник характеристик (SVG), список статов, кукла экипировки и инвентарь (сетка 4x6).
  - **Frontend:** Реализована модалка полного инвентаря с фильтрами и механизмом «закрепления» предметов (через `localStorage`).

- **v1.10 (2026-11-10):**
  - **Post-MVP:** Дерево Талантов полностью пересобрано из 18 SVG-созвездий (перенос в `frontend/public/talents/`) + центральная легаси-ветка характеристик из старого JSON.
  - **Frontend:** DFS-подсветка всех путей (кратчайшие — цветные, длинные — красные), кнопка «Сброс вида», `limitToBounds`, разделение стилей легаси/скайрим (пунктир + opacity 50%).
  - **Backend:** `talents.py` поддерживает `skyrim_start`; легаси-тесты помечены `skip`.

- **v1.9 (2026-11-09):**
  - **Backend:** Добавлена модель `UserTalent` и миграция. Реализован API для талантов (`GET /talents`, `POST /talents/{code}/upgrade`). Бонус к XP от талантов применяется при выполнении квестов. В `Character` добавлен `xp_bonus_percent`. Дерево талантов загружается из JSON-файла.
  - **Frontend:** Создана страница `/talents` с отрисовкой графа в стиле PoE (зум, панорамирование, изогнутые SVG-линии, свечение). В шапку добавлена вкладка «Таланты».
  - **Docs:** Обновлен `devlog.md`.

- **v1.8 (2026-11-08):**
  - **UI/UX:** Полный визуальный редизайн под стиль D&D (шрифты, пергамент, сургучные печати, мобильное бургер-меню).
  - **Frontend:** Добавлены скелетоны загрузки (`Skeletons.tsx`). Добавлен расчет потенциального XP в `QuestCard`. Список квестов добавлен в `ScrollOfTime`.
  - **Infra:** Фронтенд контейнеризован (`frontend/Dockerfile`, `nginx.conf`). Настроено проксирование `/api` через Nginx. `docker-compose.yml` обновлен: добавлены профили для разделения Dev и Prod режимов.
  - **Docs:** Добавлена инструкция по деплою на VPS в `README.md`. Добавлен `.env.production.example`.

- **v1.7 (2026-11-07):**
  - **Frontend Testing:** Настроен Vitest, добавлены тесты для констант (`constants.ts`) и утилит времени (`utils/date.ts`). Всего 8 тестов, покрытие Sad Path.
  - **CI:** GitHub Actions теперь запускает `npm test -- --run` для фронтенда.
  - **Рефакторинг:** Логика времени вынесена из `QuestCard` и `ScrollOfTime` в `utils/date.ts`.
  - **Docs:** Правила вынесены в `PROMPT-rules.md`, `prompt.md` облегчен под ежедневные задачи.

- **v1.6 (2026-11-06):**
  - **Frontend:** Реализована карточка персонажа (XP-бар, процедурный SVG-герб, статистика по рангам).
  - **Frontend:** Реализована страница событий (CRUD, логика `repeats_yearly` для ДР, модальные окна).
  - **Frontend:** Реализован «Свиток времени» (Calendar) с живой шкалой (обновление раз в минуту), красной линией «сейчас» и маркерами квестов.
  - **UI/UX:** Добавлена подсветка активной вкладки (`NavLink`), мини-иконка герба в шапке, улучшено центрирование маркеров.
  - **Docs:** Обновлен `README.md` (скриншоты, инструкция), в `prompt.md` добавлены правила по Git Flow, навигации и Conventional Commits.
  - **Post-MVP:** В §4.4 добавлены идеи кастомных иконок уровней и аватаров.

- **v1.5 (2026-11-05):**
  - **Изменение роутинга:** Создание квеста реализовано через модальное окно на `/board` (отступили от `/quests/new` для улучшения UX). Компонент `QuestForm` изолирован.
  - **Строгий TypeScript:** В проекте включен `verbatimModuleSyntax`. Все импорты типов должны использовать `import type { TypeName }`.
  - **Процесс коммитов:** Коммиты пишутся на английском языке без использования Markdown-разметки. Многострочные коммиты — через флаги `-m`.
  - **CI и типы:** Vite dev server не делает type-checking. Перед пушем обязательно проверять ошибки в IDE (Problems) или запускать `npm run build`.

- **v1.4 (2026-11-04):**
  - §6.3 / §7.6: Зафиксирована логика Событий (`api/events.py`), принудительный `repeats_yearly=true` для дней рождения.
  - §7.1 / §7.8: Реализован Demo-режим (`/auth/demo`) с детерминированным сидом (13 квестов, 4 события) и Rate Limit на Redis (5 запросов/час).
  - §2: Redis 7 добавлен в инфраструктуру (`docker-compose.yml`, CI).
  - §8.1: Старт Frontend. Реализован Axios-клиент, `AuthContext`, страницы Login/Register и защищенный роутинг.
  - §10.1: Написаны интеграционные тесты для Demo-режима (покрытие 73.3%). Исправлены конфликты Event Loop на Windows при тестировании.
  - §8.2: В `prompt.md` обновлены правила работы и уроки Day 4.

- **v1.3 (2026-11-03):**
  - §8.2: Уточнены правила Git Flow (1 день = 1 ветка = 1 squash-коммит, 1 шаг = 1 запись в devlog).
  - §7.2–7.5: Зафиксирована реализация Quests CRUD и Game Logic (`core/game.py`, `api/quests.py`).
  - §7.6: Зафиксирована реализация Character API (`api/character.py`).
  - §7.9: Добавлен маппинг стандартных ошибок Pydantic в `VALIDATION_ERROR` для строгого соответствия контракту.

- **v1.2 (2026-11-02):**
  - Добавлен раздел §4.4 с Post-MVP идеями (дерево талантов, карта подземелья, MMO-метки).

- **v1.1.1 (2026-11-01):**
  - §8: `logging.py` переименован в `log_setup.py` (конфликт со stdlib `logging`).
  - §2.1: `sqlalchemy` изменен на `sqlalchemy[asyncio]` (требуется `greenlet` для async).
  - Frontend: TypeScript зафиксирован на `~5.9` (из-за конфликта `typescript-eslint` с TS 7).
  - Frontend: добавлены `framer-motion`, `@types/react`, `@types/react-dom`, `postcss`, `autoprefixer`.

- **v1.1 (2026-11-01):**
  - §7.7: примеры `register → create → complete` помечены как единый поток; `user_after.total_xp` исправлен `900 → 600`, `xp_into_level` `200 → 150` (по формуле §5.2).
  - §7.1: лимит bcrypt уточнён как байты UTF-8, не символы.
  - §4.1: перечень событий дополнен `reminder`.
  - §11 → §14: зафиксировано, что §12–13 зарезервированы (вынесены в `devlog.md`, `README.md`).
  - §5.2: добавлен проверочный ряд `0 / 49 / 50 / 199 / 200`.
  - §7.2: пагинация (limit 50 default / 200 max), семантика `rank_desc`/`rank_asc`, тайм-брейкер, поведение при `deadline_date` + `sort`.
  - Добавлены TOC, версия, bold-акценты на ключевых правилах (§7.4, §7.5).

- **v1.0:** первичная фиксация ТЗ.
