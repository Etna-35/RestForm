# Progress

## ✅ Что уже сделано

- Правильный репозиторий определён: `/Users/rio/Desktop/RestForm`.
- GitHub repo: `Etna-35/RestForm`.
- GitHub Pages настроен на `main`.
- Custom domain настроен через `CNAME`: `no-money-no-honey.ru`.
- Актуальный Apps Script Web App URL прописан в [index.html](/Users/rio/Desktop/RestForm/index.html:15).
- Google Sheets подключена через bound Apps Script.
- Google Drive/Sheets integration подключена; живой лист `Данные` можно читать и править напрямую.
- Apps Script deploy настроен через `clasp`.
- Текущий публичный Apps Script deployment обновлён до версии `34` (`Codex enforce data sheet schema`).
- В проект добавлены `.clasp.json`, `.claspignore`, `appsscript.json`.
- Из-за структуры bound Apps Script project синхронизируются оба backend-файла: `Code.gs` и `Код.js`.
- В лист `Данные` добавлена колонка `Яндекс еда` в блоке `ДОХОДЫ` между `Терминал 2` и `Безнал итого`.
- `Яндекс еда` учитывается как безнал и входит в общую дневную выручку.
- Стиль таблицы зафиксирован как обязательный: тёмный title band, кремовые секции, золотая строка заголовков, денежные форматы, centered headers, alternating body backgrounds.
- Лист `Данные` очищен от тестовых занесений и заполнен календарным каркасом: реальные даты в колонке A с 2026-05-01 по 2026-08-31, день недели в колонке B.
- Публичный HTTP endpoint для `seedDataCalendar` удалён после заполнения календарного каркаса; функция оставлена как manual utility.
- Централизованные настройки через Apps Script / Sheets реализованы.
- Настройки автообновляются при старте, при visibilitychange и раз в 6 часов.
- Дата по умолчанию берётся по Москве.
- Ограничение `±3 дня` убрано.
- Даты старше 2 дней блокируются для обычного пользователя.
- Ретроввод старых дат через PIN руководителя реализован.
- При ретровводе добавлен выбор сотрудника смены.
- Тексты такси обновлены.
- Server-side old-date validation добавлен.
- Потерянные после rebase inline handlers восстановлены.
- `npm run check` проходит после последних кодовых правок.
- `.codex-memory/` хранится в репозитории и уже была закоммичена ранее.
- Дублирующаяся `isLockedPastDateServer` в `Code.gs` удалена.
- Прямая отправка Telegram из браузера при submit отключена; Telegram отправляет Apps Script.
- Изменения закоммичены и запушены в `main`: `b323b1f Add Yandex Food revenue flow`.
- GitHub Pages и custom domain уже отдают обновлённый HTML с `Яндекс еда` и актуальным Apps Script URL.

## 🔄 Что в работе прямо сейчас

- Обновление `.codex-memory/` под фактическое состояние проекта после подключения Google/Sheets/Apps Script tooling и правок живой таблицы.
- Файлы в фокусе:
  - [.codex-memory/06_DECISIONS.md](/Users/rio/Desktop/RestForm/.codex-memory/06_DECISIONS.md)
  - [.codex-memory/07_PROGRESS.md](/Users/rio/Desktop/RestForm/.codex-memory/07_PROGRESS.md)
  - [.codex-memory/08_HANDOFF.md](/Users/rio/Desktop/RestForm/.codex-memory/08_HANDOFF.md)
  - [Code.gs](/Users/rio/Desktop/RestForm/Code.gs)
  - [index.html](/Users/rio/Desktop/RestForm/index.html)

## ⏭️ Что планируется дальше

1. Пользователь тестирует опубликованную форму заполнением реальных/тестовых смен.
2. Проверить сценарий обычной отправки: PIN сотрудника → текущая дата → отправка → запись в строку даты.
3. Проверить сценарий ретроввода: старая дата → PIN руководителя → выбор сотрудника → отправка → перезапись строки даты.
4. Убедиться, что отчёт попадает в Google Sheets и Telegram.
5. Перенести реальные PIN из публичного кода в управляемые настройки без публичных дефолтов.
6. Добавить автопродление календарного каркаса после 2026-08-31 или отдельную безопасную maintenance-команду.
7. Добавить PWA manifest для установки формы как приложения.
8. Добавить offline queue / повтор отправки при плохой связи.
9. Добавить историю смен в форме.

## 🐛 Известные баги / риски

- [index.html](/Users/rio/Desktop/RestForm/index.html) всё ещё содержит поля Telegram-настроек в UI, но submit больше не отправляет Telegram напрямую из браузера.
- `POST` в Apps Script выполняется с `mode: "no-cors"`, поэтому frontend не видит серверную ошибку. Это осознанный CORS tradeoff, но UX может показывать успех при backend-проблеме.
- PIN по-прежнему присутствуют как дефолты в коде. Для публичного репозитория это слабое место.
- Поиск существующей смены в `saveReport` основан только на дате. Если появятся несколько смен или несколько точек, ключ надо расширять.
- `doGet?action=migrateDataSheet` остаётся публичным maintenance action; перед production стоит решить, оставлять ли его.
- Календарный каркас сейчас покрывает только 2026-05-01..2026-08-31. После 31 августа нужен новый период или автопродление.
- Фактический end-to-end тест через опубликованную Pages-страницу и живой Apps Script после последнего deployment нужно выполнить вручную.

## ❓ Открытые вопросы

- Telegram bot username/name: `<TODO: уточнить у пользователя>`.
- Нужно ли полностью убрать возможность ввода Telegram token/chat IDs из формы и оставить настройку только в Apps Script Properties?
- Нужно ли переносить PIN сотрудников и руководителя из публичного `index.html` / `Code.gs` дефолтов в Sheets-only модель?
- Какой период заранее заполнять после 2026-08-31: помесячно, до конца года или автопродлением?
