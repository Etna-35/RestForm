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

```text
cardRev = terminal1 + terminal2 + netmonet
factRevenue = cardRev + cashRev + transRev
factCash = cashRev + transRev
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
  write taxiCost to column M
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
    lastCashOpen = column U
    break
```

## saveReport

```text
saveReport(data):
  parse data.date as local date
  load settings and plans
  validate old-date lock
  calculate totals server-side
  ensure Данные sheet exists
  find existing row by date
  if found: overwrite row
  else: write first empty row
  format row
  color cash diff and percent cells
  write taxi to previous date row
  send Telegram report
```

Current caveat: row identity is only date-based. If multiple locations or shifts per day are added later, row key must change.

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

Current caveat: `index.html` still contains older direct Telegram send logic; cleanup should move all Telegram sending to Apps Script only.
