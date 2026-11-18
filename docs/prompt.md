# Quest Board RPG — старт разработки (Day 13 / Post-MVP)

Привет. Продолжаем проект. Прикладываю файлы:
- `spec.md` — ТЗ (frozen)
- `README.md` — витрина
- `devlog.md` — хроника
- `PROMPT-copy-paste-files.md` — правила форматирования ответов ИИ
- `PROMPT-rules.md` — **обязательные правила, архитектура и уроки**
- `prompt.md` — этот файл (состояние на текущий день)
- `https://github.com/ttWhithe/Quest-Board-RPG` — ссылка на репозиторий

> ⚠️ **ПЕРЕД НАЧАЛОМ РАБОТЫ ОБЯЗАТЕЛЬНО ПРОЧИТАЙ `PROMPT-rules.md`**.

## Текущее состояние (Day 17 завершен)
- **Backend:** Движок достижений на `condition`-схеме. 100 достижений (84 auto + 16 manual-TODO). Все триггеры подключены (quests, talents, character, events, auth). Ручной `/unlock` удалён.
- **Frontend:** Тосты за новые ачивки в `QuestCard`. `Character.tsx` (~90 строк, `AdventurerLicense` вынесен).
- **Infra:** Docker, CI (зеленый).

## Что делаем сейчас — Day 18 (Achievements Engine — доработка)
1. **Backend (TODO Day 17):**
   - Юнит-тесты на каждый `condition.type`.
   - Интеграционный тест `equip item → ach_inv_5`.
   - `talents_branch_*` (ach_t_7/8/9/10) — добавить поле `branch` в `talent_tree.json`.
   - `talents_notable` (ach_t_6) — проверить наличие `type: "notable"` в `talent_tree.json`.
   - Item-награды — создавать `UserItem` при `reward.type == "item"`.
   - Level-up от achievement XP — триггерить `level_reached` на следующем событии (сейчас возможен пропуск).
   - `GET /achievements` — батч-преагрегация (сейчас ~84 SELECT'а).
   - `load_json("items.json")` в `_handle_equipped_slots` — добавить `lru_cache`.
2. **Frontend:**
   - Показ прогресса залоченных ачивок (progress-bar) — если ещё не реализовано.
   - Тосты для ачивок, полученных вне `QuestCard` (login, daily-reward, profile change) — добавить `new_achievements` в `/auth/me` или polling.
3. **Docs/Infra:**
   - Завершить PR Day 17 (squash-merge).
