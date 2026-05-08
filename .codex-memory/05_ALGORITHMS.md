# Algorithms

## Cash Calculation

Taxi is not deducted from cash because taxi is treated as previous-shift expense paid by card / aggregator.

```text
cashCalc =
  cashOpen
  + cashRev
  + transRev
  - washCost
  - hookahPay
  - extrasTotal
  - collection
```

```text
cashDiff = cashActual - cashCalc
```

Diff display:

```text
if cashDiff == 0:
  success / green
else if abs(cashDiff) <= cashDiffLimit:
  warning / yellow
else:
  danger / red
```

## Revenue

`Яндекс еда` is business revenue and is counted as cashless/card revenue.

```text
cardRev = terminal1 + terminal2 + netmonet + yandexFood
factRevenue = cardRev + cashRev + transRev
factCash = cashRev + transRev
```

Google Sheet mapping:

```text
G = terminal1
H = terminal2
I = yandexFood
J = cardRev / Безнал итого
K = cashRev
L = transRev
M = factRevenue
```

## Plan Percent

```text
pctRevenue = factRevenue / planRevenue * 100
pctCash = factCash / planCash * 100
```

Plan status:

```text
if pct >= 100:
  "Выполнен"
else if pct >= 80:
  "Близко"
else:
  "Не выполнен"
```

## Hookah Pay

```text
hookahPay = hookahs * hookahRate
```

`hookahRate` is loaded from `Настройки`.

## Taxi Previous Shift

Business wording:

```text
РАСХОДЫ НА ТАКСИ за [дата]
Вводите данные только, если оплата была картой
Такси прошлой смены
Если оплата такси была наличными, значение - 0
```

Server behavior:

```text
if taxiCost > 0:
  prevDate = selectedDate - 1 day
  find row in Данные where column A == prevDate
  write taxiCost to column N
  if taxiCost > maxTaxi:
    mark cell red
```

## Date Handling

Do not parse business dates with `new Date("YYYY-MM-DD")`; browser may treat it as UTC.

Correct JS parse:

```js
const [y, m, d] = dateStr.split("-").map(Number);
const date = new Date(y, m - 1, d);
```

Local date format:

```js
function localDateStr(d) {
  return d.getFullYear() + "-"
    + String(d.getMonth() + 1).padStart(2, "0") + "-"
    + String(d.getDate()).padStart(2, "0");
}
```

Moscow date:

```js
new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }))
```

Apps Script:

```js
Utilities.formatDate(date, "GMT+3", "yyyy-MM-dd")
```

When saving a report, Apps Script creates `shiftDate` at local noon to avoid day rollback if spreadsheet timezone settings differ:

```js
new Date(year, month - 1, day, 12, 0, 0, 0)
```

## Old-Date Lock And Retro Entry

Client:

```text
on date selected:
  if picked date is in future:
    reject
  if picked date is older than 2 days and owner not unlocked:
    show fullscreen blocker
  else:
    set selectedDate and reload init data
```

Owner retro flow:

```text
old date selected
show old-date blocker
owner clicks "Ввести PIN руководителя"
owner PIN modal opens
if PIN matches owner PIN:
  ownerRetroUnlocked = true
  selectedDate = pending old date
  open employee chooser
owner chooses employee
submit includes ownerOverride=true and ownerPin
```

Server:

```text
if date older than 2 days:
  allow only when ownerOverride == true and ownerPin == configured ownerPin
  otherwise return OLD_DATE_LOCKED
```

`Code.gs` has a single server-side `isLockedPastDateServer` definition after cleanup on 2026-05-09.

## getInitData

`getInitData(dateStr)` returns data needed to initialize the form:

- last cash open from previous date;
- plans for selected day;
- all day plans;
- employees;
- hookah rate;
- cash diff limit;
- late hour;
- max taxi;
- owner name / owner PIN;
- Telegram configured boolean.

Previous cash search:

```text
prevDate = selectedDate - 1 day
for rows in Данные from bottom to top:
  parse A as Date or DD.MM.YYYY string
  if parsed date == prevDate:
    lastCashOpen = column V / Остаток (расч.)
    break
```

## saveReport

```text
saveReport(data):
  parse data.date as local-noon date
  load settings and plans
  validate old-date lock
  calculate totals server-side
  ensure Данные sheet exists
  find existing row by date in column A
  if found: overwrite row
  else: write first empty row
  format row
  color cash diff and percent cells
  write taxi to previous date row
  send Telegram report
```

The current production table intentionally has date rows prefilled:

```text
row 4    = 2026-05-01
...
row 126  = 2026-08-31
```

This makes row identity date-based and lets missed days remain blank until the owner fills them retroactively.

Current caveat: row identity is only date-based. If multiple locations or shifts per day are added later, row key must change.

## Sheet Calendar Skeleton

Manual helper:

```text
seedDataCalendar():
  clear rows 4..1000, columns A:Y
  write dates from 2026-05-01 to 2026-08-31 into A
  write weekday code into B
  apply ETNA body formatting and currency formats
```

The public HTTP endpoint for this helper was removed after seeding. Keep it as a manual utility unless the user asks to expose maintenance actions.

## Settings Refresh

Frontend settings are loaded:

```text
on startup
on document visibility returns to visible
every 6 hours
```

Target: employees should not configure every device manually.

## Telegram

Target flow:

```text
index.html -> Apps Script -> Telegram Bot API
```

Telegram messages:

- short report to general chat;
- full report to owner chat;
- receipt photos to owner chat via media group.

Current behavior: report submit no longer sends Telegram directly from the browser. Apps Script writes the sheet row and sends Telegram server-side.
