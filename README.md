# Quest Board RPG

RPG-трекер задач в стилистике доски квестов средневековой магической гильдии.
Задания имеют ранг сложности (S–F) и редкость-срочность (common–legendary), начисляют XP,
формируют персонажа пользователя и отображаются на временной шкале.

**Демо-режим:** «Войти как гость» — без регистрации, с засеянными квестами и событиями.

## ✨ Features

- ⚔️ **RPG-механика**: Квесты с рангами сложности (S-F) и редкостью (common-legendary). Начисление XP и рост уровня.
- 📜 **Свиток времени**: Визуализация дедлайнов и событий на 24-часовой шкале.
- 🛡️ **Процедурный герб**: Уникальный SVG-герб для каждого игрока на основе seed-значения.
- ⚡ **Умные статусы**: Система сама определяет просроченные квесты (`effective_status`).
- 🎭 **Demo-режим**: Мгновенный вход с готовым набором данных (с защитой от спама через Redis).
- 🎨 **Плавный UI**: Анимации начисления опыта (Framer Motion) и адаптивный дизайн.

## Стек

- **Backend:** Python 3.12, FastAPI (async), SQLAlchemy 2.0, asyncpg, Alembic
- **БД:** PostgreSQL 16
- **Кэш / Rate Limit:** Redis 7
- **Frontend:** React 18 + TypeScript + Vite, TanStack Query, Tailwind CSS, react-i18next, Framer Motion
- **Тесты:** pytest (+ pytest-cov), Vitest
- **Качество кода:** ruff, mypy (strict), pre-commit
- **CI:** GitHub Actions
- **Запуск:** Docker + docker-compose

## Быстрый старт

Требования: Docker 24+, Node 20+, npm 10+.

```bash
git clone https://github.com/ttWhithe/Quest-Board-RPG.git && cd Quest-Board-RPG

# Бэкенд + БД
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose up --build

# Фронт (в отдельном терминале)
cd frontend
npm install
npm run dev
```

- Фронт: http://localhost:5173
- API: http://localhost:8000/api/v1
- Docs (Swagger): http://localhost:8000/docs

## Структура

```
Quest-Board-RPG/
├── backend/       # FastAPI + SQLAlchemy + Alembic
├── frontend/      # React + Vite + TypeScript
├── docs/          # Документация (ТЗ, дневник, промпты)
├── tools/         # Скрипты для запуска (.bat)
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## Документация

- Полное ТЗ — [docs/spec.md](docs/spec.md)
- Хроника разработки — [docs/devlog.md](docs/devlog.md)

## Скриншоты

_(После реализации здесь будут GIF-анимации доски, карточки квеста, свитка времени и персонажа)_

## Roadmap

- i18n (RU/EN)
- Полный календарь-грид
- Достижения и стрики
- Drag & drop
- Уведомления
- Экспорт статистики
- История выполнений (`quest_completions`)

## Лицензия

MIT (или иная — по выбору).
