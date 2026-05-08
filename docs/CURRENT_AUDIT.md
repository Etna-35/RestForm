# Текущий аудит

Дата аудита: 2026-05-08.

## Состояние репозитория

Рабочий репозиторий подключен:

```text
https://github.com/Etna-35/RestForm
```

Основная ветка:

```text
main
```

Текущая рабочая ветка Codex:

```text
codex/dev-setup
```

## Frontend

Исправлено:

- восстановлены функции `addPhotos`, `calc`, `cashConfirm`, `closeExtra`, `openExtra`, `saveExtra`;
- восстановлены расчеты доходов, расходов, кассы, лимита такси и лимита расхождения;
- прямые вызовы Telegram API убраны из браузера;
- `npm run audit:handlers` проходит.

`maxTaxiLimit` больше не используется в клиентском коде.

## Безопасность

Исправлено:

- `getInitData` больше не возвращает `botToken`, `chatOwner`, `chatGeneral`;
- `getSettings` больше не возвращает Telegram-секреты;
- Telegram-сообщения отправляются из `Code.gs`;
- клиент отправляет в Apps Script один отчетный payload.

Остается проверить после deployment:

- запись отчета в живую Google Sheets;
- краткий Telegram-отчет в общий чат;
- полный Telegram-отчет руководителю;
- отправку фото чеков через Apps Script.

## Состояние таблицы

В `etna_smeny.xlsx` найдены листы:

- `Данные`;
- `Дашборд`;
- `Настройки`.

Это совпадает с ожидаемой структурой проекта.

## Проверки

Локально проходят:

```bash
npm run check:syntax
npm run check:apps-script
npm run audit:handlers
```
