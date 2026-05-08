# Stack

## Frontend

- Static HTML app: `index.html`.
- Vanilla JavaScript inside `index.html`.
- CSS inside `index.html`.
- No bundler and no frontend framework.
- Mobile-first UI.
- System date picker: native `input[type=date]`.
- Local state: `localStorage` with `e_` prefix.
- Photo handling: browser File API / FormData.

## Local Tooling

Actual versions on 2026-05-08:

- Node.js: `v25.6.1`
- npm: `11.9.0`
- Python: `3.10.11`

`package.json` scripts:

- `npm run serve` — starts `python3 -m http.server 8000`.
- `npm run check:syntax` — validates inline JavaScript in `index.html`.
- `npm run check:apps-script` — runs `node --check --input-type=commonjs < Code.gs`.
- `npm run audit:handlers` — checks that inline HTML handlers point to defined functions.
- `npm run check` — runs all checks above.
- `npm run gas:login` — starts `clasp` OAuth login.
- `npm run gas:status` — checks Apps Script sync status.
- `npm run gas:pull` — pulls Apps Script project files.
- `npm run gas:push` — pushes local Apps Script files.
- `npm run gas:version` — creates Apps Script version.
- `npm run gas:deploy` — deploys Apps Script.

No external npm dependencies are currently used.

## GitHub Pages

- Repository: `https://github.com/Etna-35/RestForm`
- Deploy branch: `main`
- Deploy folder: repository root (`/root`)
- Custom domain file: `CNAME`
- Custom domain: `no-money-no-honey.ru`
- GitHub Pages URL: `https://etna-35.github.io/RestForm/`

## Google Apps Script

- Main repo backend file: `Code.gs`.
- Remote Apps Script also contains Cyrillic file `Код.js`; keep it synchronized with `Code.gs` because the bound project previously had both files and duplicate entrypoints can shadow each other.
- Manifest: `appsscript.json`.
- `clasp` config: `.clasp.json`.
- Push allowlist: `.claspignore` includes only `Code.gs`, `Код.js`, `appsscript.json`.
- Web App URL in frontend: `window.APPS_SCRIPT_URL` in `index.html`.
- Current Web App URL: `https://script.google.com/macros/s/AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw/exec`
- Script ID: `1msQzI7MU3ytVTXrfvXjDhbhIyz7KoOyvROAjugZmunpEyVO7EePFvPCf`
- Deployment ID: `AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw`
- Last known deployed version: `34`.
- Web app deployment:
  - Execute as: owner / deploying user.
  - Access: anyone with link.
  - Timezone: `Europe/Moscow`; code also uses `GMT+3` for business dates.
- Triggers:
  - HTTP `doGet(e)`
  - HTTP `doPost(e)`
  - No time-driven trigger currently required.
- Manual utilities:
  - `fixDatesInColumnA()`
  - `setupDefaultSettings()`
- `seedDataCalendar()` — manual utility used to reset `Данные` and fill date rows from 2026-05-01 to 2026-08-31. It is not exposed as public HTTP action after deployment version 32.

Apps Script deployment rule:

1. Run `npm run check`.
2. Copy backend changes to both `Code.gs` and `Код.js`.
3. Run `npm run gas:push`.
4. Create a version with `npx @google/clasp version "description"`.
5. Deploy to the existing deployment ID with `npx @google/clasp deploy -i AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw -V <version>`.
6. Verify the Web App URL still responds.

## Google Sheets

Live spreadsheet:

- ID: `13xJDLf_cLcYoTful-1yZiszmgbXr5AlWIQB392pEEBI`
- Template in repo: `etna_smeny.xlsx`
- Expected tabs:
  - `Данные`
  - `Дашборд`
  - `Настройки`

`Code.gs` uses `SpreadsheetApp.getActiveSpreadsheet()`, so Apps Script must remain bound to the correct spreadsheet.

### Sheet `Данные`

Canonical schema is 25 columns, A:Y:

| Column | Field |
|---|---|
| A | Дата |
| B | День |
| C | Сотрудник |
| D | Откр. (расч.) |
| E | Откр. (факт) |
| F | Откр. Δ |
| G | Терминал 1 |
| H | Терминал 2 |
| I | Яндекс еда |
| J | Безнал итого |
| K | Наличные |
| L | Переводы |
| M | Выручка итого |
| N | Такси |
| O | Мойка |
| P | Кальяны (шт) |
| Q | Выпл. кальяны |
| R | Доп. расходы |
| S | Инкассация |
| T | Остаток (факт) |
| U | Переводы (ref) |
| V | Остаток (расч.) |
| W | Разница |
| X | План выручки |
| Y | % выполнения |

Current live data skeleton:

- Rows 4..126 contain dates from 2026-05-01 through 2026-08-31.
- Column A contains real date values, not text.
- Column B contains weekday codes (`Пн`, `Вт`, etc.).
- Report submission should update the row matching the selected date; if no row exists, it may fall back to the first empty row.
- `ensureDataSheet()` enforces canonical A:Y schema and removes columns after Y on `Данные`.

### Sheet `Настройки`

- Rows 4-10, columns B/C/D: day plans by weekday.
- Row 13, D: hookah rate.
- Row 14, D: cash difference limit.
- Row 15, D: late hour.
- Row 16, C/D: owner name / owner PIN.
- Row 20, D: max taxi.
- Row 23, A:C: employees header (`№`, `Сотрудник`, `PIN`).
- Rows 24-53, A:C: employees list.
- Telegram fallback may still read rows 17-19, but target storage is Script Properties.

## Telegram Bot API

- Integration type: outgoing requests from Apps Script to Telegram Bot API.
- Polling: not used.
- Webhook: not used.
- Methods:
  - `sendMessage`
  - `sendMediaGroup`
- Bot name / username: `<TODO: уточнить у пользователя>`
- Token storage: Apps Script `PropertiesService`, property `TELEGRAM_BOT_TOKEN`.
- Owner chat storage: Apps Script `PropertiesService`, property `TELEGRAM_CHAT_OWNER`.
- General chat storage: Apps Script `PropertiesService`, property `TELEGRAM_CHAT_GENERAL`.

Target architecture is server-side Telegram sending via Apps Script. Current `index.html` still contains older client-side Telegram sending code path; it should be removed in a future cleanup.

## Google Fonts

- `Unbounded` for brand, headings, buttons, numbers and accent labels.
- `Golos Text` for form text and inputs.

## Environment And Secrets

Do not write actual values into repo:

- GitHub Personal Access Token.
- Telegram Bot Token.
- Telegram private Chat IDs.
- Employee PINs and owner PINs.
- `.env` files.

Public / non-secret runtime pointers:

- `window.APPS_SCRIPT_URL` in `index.html`.
- `CNAME` for GitHub Pages domain.
