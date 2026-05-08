# Handoff

## Последнее состояние (актуально на 2026-05-09)

Рабочая папка проекта:

```text
/Users/rio/Desktop/RestForm
```

Проект: ETNA RestForm, MVP / beta.

Актуальный Apps Script Web App URL:

```text
https://script.google.com/macros/s/AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw/exec
```

Apps Script:

```text
Script ID: 1msQzI7MU3ytVTXrfvXjDhbhIyz7KoOyvROAjugZmunpEyVO7EePFvPCf
Deployment ID: AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw
Last known version: 34
Last known description: Codex enforce data sheet schema
```

Последний кодовый коммит:

```text
b323b1f Add Yandex Food revenue flow
```

Google Sheets:

```text
Spreadsheet ID: 13xJDLf_cLcYoTful-1yZiszmgbXr5AlWIQB392pEEBI
Sheet in focus: Данные
```

## Что произошло в последней сессии

- Подключены и проверены Google Drive/Sheets integration и Apps Script deploy через `clasp`.
- В проект добавлены `.clasp.json`, `.claspignore`, `appsscript.json`.
- Из-за remote Apps Script структуры backend хранится в двух синхронных файлах: `Code.gs` и `Код.js`.
- Добавлен доход `Яндекс еда`; он входит в `Безнал итого` и `Выручка итого`.
- В live Google Sheet `Данные` колонка `Яндекс еда` стоит в I, между `Терминал 2` и `Безнал итого`.
- Оформление колонки `Яндекс еда` исправлено по стилю ETNA: centered header, gold header row, body currency format, alternating row backgrounds.
- Тестовые занесения очищены.
- В live `Данные` создан календарный каркас:
  - row 4 = 2026-05-01;
  - row 126 = 2026-08-31;
  - column A contains real date values;
  - column B contains weekday codes.
- Форма должна находить строку выбранной даты и перезаписывать её. Это позволяет пропускать дни и позже вносить их через ретроввод.
- Публичный `seedDataCalendar` HTTP endpoint убран после заполнения таблицы; сама функция осталась как ручная утилита в Apps Script.
- Дублирующаяся `isLockedPastDateServer` удалена.
- При submit браузер больше не отправляет Telegram напрямую; отчёты отправляет Apps Script server-side.

## Текущее состояние Git

Последний коммит в `main` до текущих незакоммиченных правок:

```text
abe6055 Add codex project memory pack
```

Перед обновлением memory рабочее дерево уже содержало незакоммиченные изменения:

```text
M .codex-memory/01_PROJECT.md
M .codex-memory/02_STACK.md
M .codex-memory/04_CONVENTIONS.md
M .codex-memory/06_DECISIONS.md
M .codex-memory/07_PROGRESS.md
M .codex-memory/08_HANDOFF.md
M Code.gs
M index.html
M package.json
?? .clasp.json
?? .claspignore
?? appsscript.json
?? Код.js
```

Не откатывать эти изменения: они относятся к текущей работе.

## Конкретный следующий шаг

Сразу после чтения памяти:

1. Провести end-to-end тест на опубликованной форме:
   - обычная отправка за текущую дату;
   - ретроввод за старую дату через PIN руководителя;
   - проверка, что строка нужной даты в `Данные` перезаписалась;
   - проверка Telegram.
2. Если тест выявит ошибку, читать live sheet перед правками и исправлять по фактическому состоянию.

## Файлы в фокусе

- [Code.gs](/Users/rio/Desktop/RestForm/Code.gs) — backend Apps Script, держать синхронно с `Код.js`.
- [Код.js](/Users/rio/Desktop/RestForm/Код.js) — держать синхронно с `Code.gs`.
- [index.html](/Users/rio/Desktop/RestForm/index.html) — frontend формы и submit flow.
- [.codex-memory/07_PROGRESS.md](/Users/rio/Desktop/RestForm/.codex-memory/07_PROGRESS.md) — обновлять после следующего шага.
- [.codex-memory/08_HANDOFF.md](/Users/rio/Desktop/RestForm/.codex-memory/08_HANDOFF.md) — обновлять перед завершением крупной сессии.

## Команды проверки состояния

```bash
cd "/Users/rio/Desktop/RestForm"
git status --short
git log --oneline -n 5
npm run check
```

Для локального просмотра формы:

```bash
npm run serve
```

Для Apps Script deploy:

```bash
npm run check
cp Code.gs Код.js
npm run gas:push
npx @google/clasp version "short description"
npx @google/clasp deploy -i AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw -V <version>
```

## Важные правила

- User may manually edit Google Sheets. Before table structure/formula/style changes, read the live sheet first.
- Preserve ETNA table style. Do not ask the user for colors if neighboring columns make the style clear.
- `Яндекс еда` is part of cashless revenue.
- Do not expose destructive maintenance actions publicly unless explicitly needed.
- Do not store actual Telegram tokens, Chat IDs, GitHub PAT, or PINs in docs.

## Техдолг

- Telegram settings fields still exist in client UI; submit Telegram delivery is server-side.
- Public PIN defaults in code.
- Public `migrateDataSheet` maintenance action should be reviewed before production.
- Calendar skeleton ends at 2026-08-31; need future extension plan.
- `POST no-cors` hides backend errors from frontend.
