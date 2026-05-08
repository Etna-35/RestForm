# Handoff

## Последнее состояние

Дата handoff: 2026-05-08.

Рабочая папка проекта:

```bash
/Users/rio/Desktop/RestForm
```

Последняя завершённая инженерная работа перед созданием memory:

- Исправлен owner-authorized ретроввод.
- Восстановлены выпавшие после rebase form handlers.
- Обновлён Apps Script URL.
- Проверки прошли.
- Изменения запушены в `main`.

Последний pushed commit:

```text
c87c7fd Fix retro-entry flow and restore form handlers after rebase
```

После этого в правильной папке создана `.codex-memory/`. Папка не добавлена в `.gitignore`, потому что пользователь сказал добавлять в `.gitignore` только если память локальная.

## Конкретный следующий шаг

Сначала проверить опубликованную форму вручную:

1. Открыть `https://no-money-no-honey.ru/` или `https://etna-35.github.io/RestForm/`.
2. Проверить обычный вход сотрудника.
3. Заполнить тестовую смену без отправки реальных неверных данных или использовать тестовую дату/строку по согласованию.
4. Проверить выбор старой даты старше 2 дней.
5. Проверить PIN руководителя, выбор сотрудника и отправку ретроввода.
6. Проверить, что отчёт появляется в Google Sheets и Telegram.

После ручной проверки следующий кодовый шаг:

1. Убрать дублирующуюся `isLockedPastDateServer` из `Code.gs`.
2. Убрать client-side Telegram sending из `index.html`.
3. Оставить единую схему `index.html -> Apps Script -> Telegram / Sheets`.

## Файлы в фокусе

- [index.html](/Users/rio/Desktop/RestForm/index.html:15) — frontend, Apps Script URL, date flow, retro flow.
- [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:212) — saveReport, Sheets write, Telegram send.
- [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:579) — duplicate `isLockedPastDateServer` starts here.
- [Code.gs](/Users/rio/Desktop/RestForm/Code.gs:595) — second `isLockedPastDateServer`.
- [.codex-memory/](/Users/rio/Desktop/RestForm/.codex-memory/00_README.md) — project memory.

## Current URLs

- Apps Script Web App URL in `index.html`:
  `https://script.google.com/macros/s/AKfycbwVxQsSUWPkRlTYTvpgKpA2V0zGpGTLYbJ61LhwbuE67MAYPO0boPrFX-QuKRS3dUCa6g/exec`
- GitHub repo:
  `https://github.com/Etna-35/RestForm`
- GitHub Pages:
  `https://etna-35.github.io/RestForm/`
- Custom domain:
  `https://no-money-no-honey.ru/`
- Google Sheets ID:
  `13xJDLf_cLcYoTful-1yZiszmgbXr5AlWIQB392pEEBI`

## Verification Commands

```bash
cd "/Users/rio/Desktop/RestForm"
git status --short
git log --oneline -n 8
npm run check
npm run serve
```

Expected result at handoff creation:

```text
npm run check
OK script syntax
OK apps-script syntax
OK inline handlers
```

## Deployment Rules

Frontend-only changes:

```bash
npm run check
git add ...
git commit -m "..."
git push origin main
```

Backend changes in `Code.gs`:

1. Codex edits `Code.gs`.
2. `npm run check`.
3. User copies updated `Code.gs` into Apps Script.
4. User creates a new deployment.
5. User sends new Web App URL.
6. Codex updates `window.APPS_SCRIPT_URL`.
7. `npm run check`.
8. Commit and push.

## Temporary Hacks / Cleanup

- `Code.gs` has duplicate `isLockedPastDateServer`; remove one copy.
- `index.html` still has client-side Telegram sending. Move fully to Apps Script-only flow.
- `POST` uses `no-cors`, so frontend cannot read server response.
- Real PIN values should not remain in public code long-term.
- `.codex-memory/` is currently intended to stay in repo unless user says it should be local.

## Open Questions

- Apps Script Project ID: `<TODO: уточнить у пользователя>`.
- Telegram bot username/name: `<TODO: уточнить у пользователя>`.
- Should `.codex-memory/` be committed and pushed now?
- Should Telegram settings be removed from the manager modal after Script Properties are confirmed?
