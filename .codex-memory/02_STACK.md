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

No external npm dependencies are currently used.

## GitHub Pages

- Repository: `https://github.com/Etna-35/RestForm`
- Deploy branch: `main`
- Deploy folder: repository root (`/root`)
- Custom domain file: `CNAME`
- Custom domain: `no-money-no-honey.ru`
- GitHub Pages URL: `https://etna-35.github.io/RestForm/`

## Google Apps Script

- Main file in repo: `Code.gs`
- Web App URL in frontend: `window.APPS_SCRIPT_URL` in `index.html`
- Current Web App URL: `https://script.google.com/macros/s/AKfycbwVxQsSUWPkRlTYTvpgKpA2V0zGpGTLYbJ61LhwbuE67MAYPO0boPrFX-QuKRS3dUCa6g/exec`
- Script Project ID: `<TODO: уточнить у пользователя>`
- Web app deployment:
  - Execute as: owner
  - Access: anyone with link
  - Timezone: Moscow / `GMT+3` logic in code
- Triggers:
  - HTTP `doGet(e)`
  - HTTP `doPost(e)`
  - No time-driven trigger currently required.
- Manual utility:
  - `fixDatesInColumnA()`
  - `setupDefaultSettings()`

Important deployment rule: after any `Code.gs` change, user creates a new Apps Script deployment and sends the new URL; Codex then updates `window.APPS_SCRIPT_URL`.

## Google Sheets

Live spreadsheet:

- ID: `13xJDLf_cLcYoTful-1yZiszmgbXr5AlWIQB392pEEBI`
- Template in repo: `etna_smeny.xlsx`
- Expected tabs:
  - `Данные`
  - `Дашборд`
  - `Настройки`

`Code.gs` uses `SpreadsheetApp.getActiveSpreadsheet()`, so Apps Script must be bound to the correct spreadsheet.

### Sheet `Данные`

24 columns:

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
| I | Безнал итого |
| J | Наличные |
| K | Переводы |
| L | Выручка итого |
| M | Такси |
| N | Мойка |
| O | Кальяны (шт) |
| P | Выпл. кальяны |
| Q | Доп. расходы |
| R | Инкассация |
| S | Остаток (факт) |
| T | Переводы (ref) |
| U | Остаток (расч.) |
| V | Разница |
| W | План выручки |
| X | % выполнения |

### Sheet `Настройки`

- Rows 4-10, columns B/C/D: day plans by weekday.
- Row 13, D: hookah rate.
- Row 14, D: cash difference limit.
- Row 15, D: late hour.
- Row 16, C/D: owner name / owner PIN.
- Row 20, D: max taxi.
- Rows 23-53, A:C: employees list (`№`, `Сотрудник`, `PIN`).
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
