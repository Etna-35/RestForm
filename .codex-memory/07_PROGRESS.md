# Progress

## ✅ Что уже сделано

- Правильный репозиторий определён: `/Users/rio/Desktop/RestForm`.
- GitHub repo: `Etna-35/RestForm`.
- GitHub Pages настроен на `main`.
- Custom domain настроен через `CNAME`: `no-money-no-honey.ru`.
- Актуальный Apps Script Web App URL прописан в [index.html](/Users/rio/Desktop/RestForm/index.html:15).
- Google Sheets подключена через bound Apps Script.
- Основные файлы проекта на месте:
  - `index.html`
  - `Code.gs`
  - `etna_smeny.xlsx`
  - `README.md`
  - `docs/*`
  - `scripts/*`
- Централизованные настройки через Apps Script / Sheets реализованы.
- Настройки автообновляются при старте, при visibilitychange и раз в 6 часов.
- Дата по умолчанию берётся по Москве.
- Ограничение `±3 дня` убрано.
- Даты старше 2 дней блокируются для обычного пользователя.
- Ретроввод старых дат через PIN руководителя реализован.
- При ретровводе добавлен выбор сотрудника смены.
- Тексты такси обновлены.
- Server-side old-date validation добавлен в [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:227).
- Потерянные после rebase inline handlers восстановлены.
- `npm run check` проходит на момент создания memory.
- Последний известный pushed commit: `c87c7fd Fix retro-entry flow and restore form handlers after rebase`.
- Создана папка `.codex-memory/` в правильной папке проекта.

## 🔄 Что в работе прямо сейчас

Создана система памяти проекта в `/Users/rio/Desktop/RestForm/.codex-memory/`.

Файлы в фокусе:

- [index.html](/Users/rio/Desktop/RestForm/index.html:15) — frontend and Apps Script URL.
- [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:212) — Apps Script backend.
- [.codex-memory/08_HANDOFF.md](/Users/rio/Desktop/RestForm/.codex-memory/08_HANDOFF.md) — текущий handoff.

Текущее состояние Git после создания memory: `.codex-memory/` будет untracked, пока не будет закоммичен.

## ⏭️ Что планируется дальше

1. Протестировать форму на опубликованном домене после GitHub Pages обновления.
2. Проверить реальный сценарий: PIN сотрудника → выбор даты → обычная отправка.
3. Проверить реальный сценарий ретроввода: старая дата → PIN руководителя → выбор сотрудника → отправка.
4. Убедиться, что отчёт попадает в Google Sheets и Telegram.
5. Убрать client-side Telegram code из `index.html`, оставить Telegram только через Apps Script.
6. Удалить дублирующуюся `isLockedPastDateServer` в `Code.gs`.
7. Перенести реальные PIN из публичного кода в управляемые настройки.
8. Добавить PWA manifest для установки формы как приложения.
9. Добавить offline queue / повтор отправки при плохой связи.
10. Добавить историю смен в форме.

## 🐛 Известные баги / риски

- [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:579) и [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:595) содержат две функции `isLockedPastDateServer`. Проверки проходят, но это нужно убрать для ясности.
- [index.html](/Users/rio/Desktop/RestForm/index.html:1190) всё ещё содержит client-side Telegram flow с `bot-token`, `chat-owner`, `chat-general`. Целевая архитектура — Apps Script-only Telegram.
- `POST` в Apps Script выполняется с `mode: "no-cors"`, поэтому frontend не видит серверную ошибку. Это осознанный CORS tradeoff, но UX может показывать успех при backend-проблеме.
- PIN по-прежнему присутствуют как дефолты в коде. Для публичного репозитория это слабое место.
- Поиск существующей смены в `saveReport` основан только на дате. Если появятся несколько смен или несколько точек, ключ надо расширять.
- Фактический end-to-end тест через опубликованную Pages-страницу и живой Apps Script после последнего deployment нужно выполнить вручную.

## ❓ Открытые вопросы

- Apps Script Project ID: `<TODO: уточнить у пользователя>`.
- Telegram bot username/name: `<TODO: уточнить у пользователя>`.
- Нужно ли коммитить и пушить `.codex-memory/` прямо сейчас или оставить локально до отдельного подтверждения?
- Подтвердить, что финальная Telegram-архитектура — только Apps Script, без клиентской отправки.
- Нужно ли полностью убрать возможность ввода Telegram token/chat IDs из формы и оставить настройку только в Apps Script Properties?
- Нужно ли переносить PIN сотрудников и руководителя из публичного `index.html` / `Code.gs` дефолтов в Sheets-only модель?
