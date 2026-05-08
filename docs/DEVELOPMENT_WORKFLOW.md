# Алгоритм разработки

## 1. Рабочая ветка

Все изменения делать не напрямую в `main`, а в ветках с префиксом `codex/`.

Пример:

```bash
git checkout main
git pull
git checkout -b codex/form-fix
```

## 2. Перед изменениями

Проверить состояние:

```bash
git status
npm run check:syntax
```

Если `audit:handlers` падает, сначала решить, это известная незавершенная часть формы или новая ошибка.

## 3. Изменение frontend

Основной файл формы: `index.html`.

После правок:

```bash
npm run check
npm run serve
```

Проверить вручную:

- ввод PIN;
- открытие формы;
- смену даты;
- расчет доходов;
- расчет расходов;
- доп. расходы;
- фото чеков;
- отправку отчета;
- экран успеха.

## 4. Изменение Apps Script

Основной файл backend: `Code.gs`.

После правок:

```bash
npm run check:apps-script
```

1. Скопировать `Code.gs` в Google Apps Script.
2. Сохранить проект.
3. Создать новое развёртывание, не редактировать старое.
4. Если URL изменился, обновить `window.APPS_SCRIPT_URL` в `index.html`.
5. Проверить `getInitData` и тестовую отправку отчета.

## 5. Изменение Google Sheets

Шаблон: `etna_smeny.xlsx`.

Живая таблица: Google Sheets по ссылке из `README.md`.

Если меняется структура колонок листа `Данные`, нужно одновременно обновить:

- `Code.gs`;
- формулы/дашборд в Google Sheets;
- описание полей в документации;
- frontend payload в `index.html`.

## 6. Публикация

После проверки:

```bash
git status
git add .
git commit -m "Describe change"
git push origin codex/form-fix
```

Дальше открыть Pull Request в GitHub и смерджить в `main`.

GitHub Pages должен публиковать `main` автоматически, если Pages включен в настройках репозитория.

## 7. Контрольный чеклист перед production

- Нет токенов и секретов в `index.html`.
- `npm run check` проходит.
- Apps Script развернут новым deployment.
- `window.APPS_SCRIPT_URL` указывает на актуальный deployment.
- Тестовый отчет попал в Google Sheets.
- Telegram получил краткий и полный отчет.
- Фото чеков отправляются руководителю.
