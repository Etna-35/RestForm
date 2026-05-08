# ETNA RestForm

Веб-форма закрытия смены для ресторана «ЭТНА».

Форма открывается сотрудником с телефона, собирает данные смены, считает выручку/расходы/остаток кассы, передает отчет в Google Apps Script, записывает данные в Google Sheets и отправляет отчеты в Telegram.

## Состав репозитория

```text
index.html              # клиентская форма
Code.gs                 # основной backend для Google Apps Script
apps_script_1.js        # старая/резервная версия Apps Script
etna_smeny.xlsx         # шаблон Google Sheets
scripts/                # локальные проверки Codex
docs/                   # регламент разработки и интеграций
```

## Основные ссылки

- GitHub: https://github.com/Etna-35/RestForm
- Google Sheets: https://docs.google.com/spreadsheets/d/13xJDLf_cLcYoTful-1yZiszmgbXr5AlWIQB392pEEBI/edit
- GitHub Pages: включается в настройках репозитория, ожидаемый адрес `https://etna-35.github.io/RestForm/`

## Локальная работа

```bash
npm run serve
```

После запуска открыть:

```text
http://localhost:8000/
```

## Проверки

```bash
npm run check:syntax
npm run audit:handlers
npm run check
```

`check:syntax` проверяет встроенный JavaScript в `index.html`.

`audit:handlers` проверяет, что функции, вызываемые из HTML-обработчиков, реально определены в скрипте.

## Правило секретов

Не коммитить токены Telegram, GitHub-токены, приватные Chat ID, `.env` и любые экспортированные секреты.

Telegram Bot Token должен храниться на стороне Apps Script, а не в клиентском `index.html`.

