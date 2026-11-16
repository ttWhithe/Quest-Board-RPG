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

## Текущее состояние (Day 16 завершен)
- **Backend:** Модель `UserAchievement`, загрузка аватарок (WebP/Pillow), API для достижений, кастомизация герба.
- **Frontend:** Глобальный редизайн достижений (блок, книга деяний, бейджи на удостоверении). Система тостов (`ToastContext`). Глобальная модалка уровня.
- **Infra:** Docker, CI (зеленый).

## Что делаем сейчас — Day 17 (Achievements Engine & Refactoring)
1. **Движок достижений (Backend):**
   - Перевод `achievements.json` на схему `condition` (квесты, инвентарь, время, таланты).
   - Сервис `check_and_unlock_achievements` (проверка условий при завершении квеста, экипировке, апгрейде талантов).
   - Написание тестов на выдачу ачивок (Sad Path: повторный unlock).
2. **Рефакторинг:** Разбить `Character.tsx` (вынести `AdventurerLicense`, `AvatarBlock` в отдельные компоненты).
