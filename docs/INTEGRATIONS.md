# Интеграции

## GitHub

Репозиторий: https://github.com/Etna-35/RestForm

Рекомендуемая модель:

- `main` — опубликованная стабильная версия;
- `codex/*` — рабочие ветки Codex;
- изменения через Pull Request;
- GitHub Pages публикует содержимое `main`.

## GitHub Pages

Ожидаемый адрес после включения Pages:

```text
https://etna-35.github.io/RestForm/
```

В настройках GitHub:

- Settings → Pages;
- Source: GitHub Actions или Deploy from branch;
- Branch: `main`;
- Folder: `/root`.

## Google Apps Script

Файл в репозитории: `Code.gs`.

Рекомендуемая настройка deployment:

- Type: Web app;
- Execute as: owner;
- Who has access: anyone with link;
- timezone: `Europe/Moscow`.

После каждого изменения `Code.gs` нужно создавать новое развёртывание.

## Google Sheets

Живая таблица:

```text
https://docs.google.com/spreadsheets/d/13xJDLf_cLcYoTful-1yZiszmgbXr5AlWIQB392pEEBI/edit
```

Ожидаемые листы:

- `Данные`;
- `Дашборд`;
- `Настройки`.

`Code.gs` сейчас использует `SpreadsheetApp.getActiveSpreadsheet()`, значит Apps Script должен быть привязан к нужной таблице.

## Telegram

Рекомендуемая целевая схема:

```text
index.html -> Apps Script -> Telegram API
             Apps Script -> Google Sheets
```

Не рекомендуется:

```text
index.html -> Telegram API
```

Причина: при отправке из браузера Telegram Bot Token становится доступен клиенту.

## Секреты

Не хранить в репозитории:

- GitHub Personal Access Token;
- Telegram Bot Token;
- приватные Chat ID;
- приватные PIN и пароли;
- `.env`.

Для Telegram настроек предпочтительно использовать `PropertiesService` в Apps Script или защищенный серверный слой. Если настройки остаются в Google Sheets, `getInitData` не должен отдавать `botToken` в браузер.

