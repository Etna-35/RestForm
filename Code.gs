/**
 * ЭТНА — Apps Script v3.0
 * Форма + API в одном веб-приложении
 *
 * УСТАНОВКА:
 * 1. Загрузите etna_smeny.xlsx в Google Drive (откроется как Sheets)
 * 2. Расширения → Apps Script
 * 3. Переименуйте "Без названия" → "ЭТНА — Отчёты смен"
 * 4. В Code.gs вставьте содержимое этого файла
 * 5. Нажмите "+" рядом с "Файлы" → HTML-файл → назовите "index"
 * 6. В index.html вставьте содержимое файла index.html
 * 7. Сохраните оба файла (Ctrl+S)
 * 8. Развернуть → Создать развёртывание
 *    • Тип: Веб-приложение
 *    • Выполнять как: Я
 *    • Доступ: Все
 * 9. Скопируйте URL — это и есть адрес формы для сотрудников
 *    Его же вставьте в ⚙ Настройки формы → Apps Script URL
 */



// ═══════════════════════════════════════════════════
//  CORS — разрешаем запросы с любого домена
// ═══════════════════════════════════════════════════

function setCorsHeaders(output) {
  // Apps Script не поддерживает кастомные заголовки напрямую,
  // но text/plain запросы не требуют preflight — CORS не нужен
  return output;
}

// ═══════════════════════════════════════════════════
//  ОТДАЧА ФОРМЫ (GET без параметров)
// ═══════════════════════════════════════════════════

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || '';

  // ── API запросы от формы ──
  if (action) {
    try {
      const ss = getSpreadsheet();

      if (action === 'getLastCash') {
        const sheet = ss.getSheetByName('Данные');
        let lastCash = 0;
        if (sheet && sheet.getLastRow() >= 4) {
          lastCash = Number(sheet.getRange(sheet.getLastRow(), 21).getValue()) || 0;
        }
        return jsonResponse({ lastCashOpen: lastCash });
      }

      if (action === 'getPlans') {
        const dateStr = e.parameter.date || new Date().toISOString().slice(0, 10);
        const dayCode = getDayCode(dateStr);
        const plans   = getPlansFromSettings(ss);
        const plan    = plans[dayCode] || { revenue: 45000, cash: 12000 };
        const params  = getParams(ss);
        return jsonResponse({
          dayCode,
          planRevenue:   plan.revenue,
          planCash:      plan.cash,
          hookahRate:    params.hookahRate,
          cashDiffLimit: params.cashDiffLimit,
          ownerPin:      params.ownerPin,
        });
      }

      if (action === 'getSettings') {
        const plans  = getPlansFromSettings(ss);
        const params = getParams(ss);
        return jsonResponse({
          plans,
          employees: getEmployeesFromSettings(ss),
          hookahRate: params.hookahRate,
          cashDiffLimit: params.cashDiffLimit,
          lateHour: params.lateHour,
          ownerName: params.ownerName,
          ownerPin: params.ownerPin,
          maxTaxi: params.maxTaxi,
          telegramConfigured: Boolean(params.botToken && (params.chatOwner || params.chatGeneral))
        });
      }

      // ── getInitData — основной запрос формы при загрузке ──
      if (action === 'getInitData') {
        const dateStr = e.parameter.date || '';
        return jsonResponse(getInitData(dateStr));
      }

      return jsonResponse({ status: 'ok', version: '3.1' });

    } catch (err) {
      return jsonResponse({ status: 'error', message: err.toString() });
    }
  }

  // ── Отдаём HTML форму ──
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ЭТНА — Закрытие смены')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}


// ═══════════════════════════════════════════════════
//  ПРИЁМ ОТЧЁТА (POST)
// ═══════════════════════════════════════════════════

function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    // Маршрутизация по action
    if (data.action === 'saveSettings') {
      return jsonResponse(saveSettings(data));
    }

    // По умолчанию — сохранение отчёта
    return jsonResponse(saveReport(data));
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString(), stack: err.stack });
  }
}



// ═══════════════════════════════════════════════════
//  ФУНКЦИИ ДЛЯ ВЫЗОВА ИЗ ФОРМЫ (google.script.run)
// ═══════════════════════════════════════════════════

/**
 * Вызывается при открытии формы — возвращает:
 * - последний расчётный остаток кассы
 * - планы на день
 * - ставку кальяна
 * - PIN владельца
 */
function getInitData(dateStr) {
  var ss     = getSpreadsheet();
  var params = getParams(ss);
  var plans  = getPlansFromSettings(ss);

  // Дата запроса (что выбрал сотрудник, напр. "2026-05-07")
  var nowMsk = new Date(new Date().getTime() + 3 * 60 * 60 * 1000);
  var todayStr = dateStr || Utilities.formatDate(nowMsk, 'GMT+3', 'yyyy-MM-dd');

  // Ищем остаток кассы за ПРЕДЫДУЩИЙ день (6 мая если запрос за 7 мая)
  var p = todayStr.split('-');
  var prevDate = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]) - 1);
  var prevStr = Utilities.formatDate(prevDate, 'GMT+3', 'yyyy-MM-dd');

  Logger.log('Today: ' + todayStr + ' | Looking for prev: ' + prevStr);

  var lastCash = 0;
  var dataSheet = ss.getSheetByName('Данные');

  if (dataSheet && dataSheet.getLastRow() >= 4) {
    var lastRow = dataSheet.getLastRow();
    var dateValues = dataSheet.getRange(4, 1, lastRow - 3, 1).getValues();

    for (var i = dateValues.length - 1; i >= 0; i--) {
      var raw = dateValues[i][0];
      if (!raw) continue;

      var rowDateStr = '';
      if (raw instanceof Date) {
        rowDateStr = Utilities.formatDate(raw, 'GMT+3', 'yyyy-MM-dd');
      } else {
        var s = String(raw).trim();
        // Формат DD.MM.YYYY или DD.MM.YYYY HH:MM:SS
        if (s.length >= 10 && s[2] === '.' && s[5] === '.') {
          rowDateStr = s.substring(6, 10) + '-' + s.substring(3, 5) + '-' + s.substring(0, 2);
        }
      }

      Logger.log('Row ' + (i + 4) + ': raw=' + String(raw).substring(0, 20) + ' parsed=' + rowDateStr);

      if (rowDateStr === prevStr) {
        lastCash = Number(dataSheet.getRange(i + 4, 21).getValue()) || 0;
        Logger.log('MATCH! cash=' + lastCash);
        break;
      }
    }
  }

  var dayCode = getDayCode(todayStr);
  var plan = plans[dayCode] || { revenue: 45000, cash: 12000 };

  return {
    lastCashOpen:  lastCash,
    planRevenue:   plan.revenue,
    planCash:      plan.cash,
    plans:         plans,
    employees:     getEmployeesFromSettings(ss),
    hookahRate:    params.hookahRate,
    cashDiffLimit: params.cashDiffLimit,
    lateHour:      params.lateHour,
    maxTaxi:       params.maxTaxi,
    ownerName:     params.ownerName,
    ownerPin:      params.ownerPin,
    telegramConfigured: Boolean(params.botToken && (params.chatOwner || params.chatGeneral)),
    dayCode:       dayCode
  };
}

/**
 * Вызывается при отправке отчёта — сохраняет данные в таблицу
 */
function saveReport(data) {
  try {
    const ss     = getSpreadsheet();
    const plans  = getPlansFromSettings(ss);
    const params = getParams(ss);

    // ── ФИКС 3: Дата без UTC сдвига ──
    // data.date приходит как "2026-05-05" — парсим как локальную дату
    const dateParts = String(data.date).split('-');
    // Дата без времени — чтобы в таблице была только дата (DD.MM.YYYY)
    const shiftDate = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2])
    );
    if (isLockedPastDateServer(shiftDate)) {
      return {
        status: 'error',
        code: 'OLD_DATE_LOCKED',
        message: 'Правки старше двух дней доступны только через руководителя'
      };
    }

    const ownerOverride = String(data.ownerOverride) === 'true' || data.ownerOverride === true;
    const ownerPinInput = String(data.ownerPin || '');
    if (isLockedPastDateServer(shiftDate)) {
      if (!ownerOverride || ownerPinInput !== String(params.ownerPin || '0000')) {
        return { status: 'error', code: 'OLD_DATE_LOCKED', message: 'Старая дата доступна только по PIN руководителя' };
      }
    }

    const dayCode = getDayCode(data.date);
    const plan    = plans[dayCode] || { revenue: 45000, cash: 12000 };

    // Доходы
    const terminal1 = Number(data.terminal1) || 0;
    const terminal2 = Number(data.terminal2) || 0;
    const netmonet  = Number(data.netmonet)  || 0;
    const cardRev   = terminal1 + terminal2 + netmonet;
    const cashRev   = Number(data.cashRev)   || 0;
    const transRev  = Number(data.transRev)  || 0;
    const totalRev  = cardRev + cashRev + transRev;

    // Расходы
    const taxiCost  = Number(data.taxiCost)  || 0;  // такси прошлой смены (вводит открывающий)
    const washCost  = Number(data.washCost)  || 0;
    const maxTaxi   = params.maxTaxi || 0;
    const hookahs   = Number(data.hookahs)   || 0;
    const hookahPay = hookahs * params.hookahRate;

    let extrasTotal = 0;
    try {
      extrasTotal = JSON.parse(data.extras || '[]')
        .reduce((s, ex) => s + (Number(ex.amount) || 0), 0);
    } catch (_) {}

    const collection   = Number(data.collection)   || 0;
    const cashOpen     = Number(data.cashOpen)      || 0;
    const cashOpenCalc = Number(data.cashOpenCalc)  || 0;
    const cashActual   = Number(data.cashActual)    || 0;

    // Такси оплачивается по безналу — не вычитаем из наличных
    const cashCalc = cashOpen + cashRev + transRev
                   - washCost - hookahPay - extrasTotal - collection;
    const cashDiff = cashActual - cashCalc;
    const pct      = plan.revenue > 0 ? totalRev / plan.revenue : 0;

    // ── ФИКС 1+2: Правильная строка — без пустых строк, с проверкой дублей ──
    const sheet = ensureDataSheet(ss);

    // Ищем первую пустую строку начиная с 4 (после заголовков)
    // И проверяем нет ли уже строки с такой датой
    const lastRow    = sheet.getLastRow();
    let   targetRow  = -1;
    let   firstEmpty = -1;

    for (let r = 4; r <= Math.max(lastRow + 1, 4); r++) {
      const cellVal = sheet.getRange(r, 1).getValue();

      // Ищем первую пустую строку
      if (!cellVal && firstEmpty === -1) {
        firstEmpty = r;
      }

      // Ищем дубль по дате (сравниваем строки дат)
      if (cellVal) {
        const cellDateStr = Utilities.formatDate(
          new Date(cellVal), 'GMT+3', 'yyyy-MM-dd'
        );
        if (cellDateStr === data.date) {
          targetRow = r;
          break;
        }
      }
    }

    // Если дубль не найден — используем первую пустую строку
    if (targetRow === -1) {
      targetRow = firstEmpty !== -1 ? firstEmpty : lastRow + 1;
    }

    const rowValues = [
      shiftDate,                    // A Дата
      dayCode,                      // B День
      data.employee || '',          // C Сотрудник
      cashOpenCalc,                 // D Откр. (расч.)
      cashOpen,                     // E Откр. (факт)
      cashOpen - cashOpenCalc,      // F Δ открытия
      terminal1,                    // G Терминал 1
      terminal2,                    // H Терминал 2
      cardRev,                      // I Безнал итого
      cashRev,                      // J Наличные
      transRev,                     // K Переводы
      totalRev,                     // L Выручка итого
      taxiCost,                     // M Такси
      washCost,                     // N Мойка
      hookahs,                      // O Кальяны (шт)
      hookahPay,                    // P Выплаты кальяны
      extrasTotal,                  // Q Доп. расходы
      collection,                   // R Инкассация
      cashActual,                   // S Остаток (факт)
      transRev,                     // T Переводы (ref)
      cashCalc,                     // U Остаток (расч.)
      cashDiff,                     // V Разница
      plan.revenue,                 // W План выручки
      pct,                          // X % выполнения
    ];

    sheet.getRange(targetRow, 1, 1, 24).setValues([rowValues]);

    // Форматирование
    const bg = targetRow % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
    sheet.getRange(targetRow, 1, 1, 24)
      .setBackground(bg).setFontSize(10).setVerticalAlignment('middle');
    sheet.getRange(targetRow, 1).setNumberFormat('DD.MM.YYYY');
    sheet.getRange(targetRow, 2).setNumberFormat('@').setHorizontalAlignment('center');
    sheet.getRange(targetRow, 15).setNumberFormat('0').setHorizontalAlignment('center');
    sheet.getRange(targetRow, 24).setNumberFormat('0.0%').setHorizontalAlignment('right');

    const RUB = '#,##0.00\\ "₽"';
    [4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23]
      .forEach(c => sheet.getRange(targetRow, c)
        .setNumberFormat(RUB).setHorizontalAlignment('right'));

    // Цвет разницы
    const diffCell = sheet.getRange(targetRow, 22);
    if (cashDiff === 0)                                  { diffCell.setFontColor('#5AB87A').setBackground('#E6F5EC'); }
    else if (Math.abs(cashDiff) <= params.cashDiffLimit) { diffCell.setFontColor('#E0A84A').setBackground('#FFF8E6'); }
    else                                                 { diffCell.setFontColor('#E05A4A').setBackground('#FDECEA'); }

    // Цвет % выполнения
    const pctCell = sheet.getRange(targetRow, 24);
    if (pct >= 1)        { pctCell.setFontColor('#5AB87A').setBackground('#E6F5EC'); }
    else if (pct >= 0.8) { pctCell.setFontColor('#E0A84A').setBackground('#FFF8E6'); }
    else                 { pctCell.setFontColor('#E05A4A').setBackground('#FDECEA'); }

    // Записываем такси прошлой смены в ПРЕДЫДУЩУЮ строку таблицы
    // (такси вводит открывающий смену — это расход прошлого дня)
    if (taxiCost > 0) {
      const prevDateParts = String(data.date).split('-');
      const prevDate = new Date(Number(prevDateParts[0]), Number(prevDateParts[1])-1, Number(prevDateParts[2]));
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = Utilities.formatDate(prevDate, 'GMT+3', 'yyyy-MM-dd');

      const lastDataRow = sheet.getLastRow();
      for (let r = 4; r <= lastDataRow; r++) {
        const cellVal = sheet.getRange(r, 1).getValue();
        if (cellVal instanceof Date) {
          const cellDateStr = Utilities.formatDate(new Date(cellVal), 'GMT+3', 'yyyy-MM-dd');
          if (cellDateStr === prevDateStr) {
            const prevTaxi = sheet.getRange(r, 13).getValue() || 0;
            sheet.getRange(r, 13).setValue(taxiCost).setNumberFormat('#,##0.00\ "₽"');
            // Аномалия — выделяем красным если превышает лимит
            if (maxTaxi > 0 && taxiCost > maxTaxi) {
              sheet.getRange(r, 13).setBackground('#FDECEA').setFontColor('#E05A4A').setFontWeight('bold');
            }
            break;
          }
        }
      }
    }

    const taxiAnomaly = maxTaxi > 0 && taxiCost > maxTaxi;
    const telegram = sendTelegramReport(data, {
      params,
      shiftDate,
      dayCode,
      planRevenue: plan.revenue,
      planCash: plan.cash,
      terminal1,
      terminal2,
      netmonet,
      cardRev,
      cashRev,
      transRev,
      totalRev,
      taxiCost,
      washCost,
      hookahs,
      hookahPay,
      extrasTotal,
      collection,
      cashActual,
      cashCalc,
      cashDiff,
      pct,
      taxiAnomaly
    });

    return { status: 'success', row: targetRow, cashCalc, isUpdate: targetRow <= lastRow, taxiAnomaly, telegram };

  } catch (err) {
    return { status: 'error', message: err.toString(), stack: err.stack };
  }
}

function sendTelegramReport(data, ctx) {
  const token = ctx.params.botToken;
  const chatOwner = ctx.params.chatOwner;
  const chatGeneral = ctx.params.chatGeneral;
  if (!token) return { status: 'skipped', reason: 'botToken is empty' };

  const result = { status: 'success', sent: [], errors: [] };
  const dateStr = Utilities.formatDate(ctx.shiftDate, 'GMT+3', 'dd.MM.yyyy') + ' (' + String(ctx.dayCode).toLowerCase() + ')';
  const pctRev = ctx.planRevenue > 0 ? Math.round(ctx.totalRev / ctx.planRevenue * 100) : 0;
  const pctCash = ctx.planCash > 0 ? Math.round((ctx.cashRev + ctx.transRev) / ctx.planCash * 100) : 0;
  const icon = pctRev >= 100 ? '🟢' : pctRev >= 80 ? '🟡' : '🔴';
  const employee = escapeTelegramText(data.employee || '');
  const photos = Array.isArray(data.photos) ? data.photos : [];

  const extraLines = parseExtras(data.extras)
    .map(ex => '  • ' + rub(ex.amount) + (ex.comment ? ' — ' + escapeTelegramText(ex.comment) : ''))
    .join('\n');

  const cashDiffLine = ctx.cashDiff === 0
    ? '✅ Касса сходится'
    : ctx.cashDiff > 0
      ? '⚠️ Излишек: ' + rub(ctx.cashDiff)
      : '❌ Недостача: ' + rub(Math.abs(ctx.cashDiff));

  const shortMsg = icon + ' *ЭТНА | Итоги смены* | ' + dateStr + '\n' +
    employee + '\n\n' +
    '━━━ ПЛАН ПО ВЫРУЧКЕ ━━━\n' +
    planBar(pctRev) + ' ' + pctRev + '%\n' +
    'Факт: *' + rub(ctx.totalRev) + '*\n' +
    'План: ' + rub(ctx.planRevenue) + '\n' +
    planStatus(pctRev) + '\n\n' +
    '━━━ ПЛАН ПО НАЛИЧНЫМ ━━━\n' +
    planBar(pctCash) + ' ' + pctCash + '%\n' +
    'Факт: *' + rub(ctx.cashRev + ctx.transRev) + '*\n' +
    'План: ' + rub(ctx.planCash) + '\n' +
    planStatus(pctCash);

  const fullMsg = '*ЭТНА  |  ' + dateStr + '*\n' +
    employee + '\n\n' +
    '━━━ ДОХОДЫ ━━━\n' +
    'Безнал (итого): ' + rub(ctx.cardRev) + '\n' +
    'Наличные: ' + rub(ctx.cashRev) + '\n' +
    'Переводы: ' + rub(ctx.transRev) + '\n\n' +
    '*Итого выручка: ' + rub(ctx.totalRev) + '*\n\n' +
    '━━━ РАСХОДЫ (прошлой смены) ━━━\n' +
    'Такси (прош. смена): ' + rub(ctx.taxiCost) + (ctx.taxiAnomaly ? ' ⚠️ ПРЕВЫШЕН ЛИМИТ' : '') + '\n' +
    'Мойка: ' + rub(ctx.washCost) + '\n' +
    'Кальянов: ' + ctx.hookahs + ' × ' + ctx.params.hookahRate + '₽ = ' + rub(ctx.hookahPay) +
    (extraLines ? '\nДоп. расходы:\n' + extraLines : '') + '\n\n' +
    '*Итого расходов: ' + rub(Number(data.totalExp) || (ctx.taxiCost + ctx.washCost + ctx.hookahPay + ctx.extrasTotal)) + '*\n\n' +
    '━━━ КАССА ━━━\n' +
    'Инкассация: ' + rub(ctx.collection) + '\n' +
    'Факт: ' + rub(ctx.cashActual) + '\n' +
    'Расчёт: ' + rub(ctx.cashCalc) + '\n' +
    cashDiffLine + '\n\n' +
    '━━━ ПЛАН ━━━\n' +
    icon + ' Выручка: ' + rub(ctx.totalRev) + ' / ' + rub(ctx.planRevenue) + ' (' + pctRev + '%)\n' +
    (pctCash >= 100 ? '✅' : '❌') + ' Наличные: ' + rub(ctx.cashRev + ctx.transRev) + ' / ' + rub(ctx.planCash);

  if (chatGeneral) {
    const sent = telegramText(token, chatGeneral, shortMsg);
    sent.ok ? result.sent.push('general') : result.errors.push(sent.error);
  }
  if (chatOwner) {
    const sent = telegramText(token, chatOwner, fullMsg);
    sent.ok ? result.sent.push('owner') : result.errors.push(sent.error);
    if (photos.length) {
      const media = telegramPhotos(token, chatOwner, photos, '📄 Чеки терминала | ' + dateStr);
      media.ok ? result.sent.push('photos') : result.errors.push(media.error);
    }
  }

  if (result.errors.length) result.status = 'partial';
  return result;
}

function telegramText(token, chatId, text) {
  try {
    const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' }),
      muteHttpExceptions: true
    });
    const body = JSON.parse(response.getContentText() || '{}');
    return body.ok ? { ok: true } : { ok: false, error: body.description || response.getContentText() };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function telegramPhotos(token, chatId, photos, caption) {
  try {
    const chunks = [];
    for (let i = 0; i < photos.length; i += 10) chunks.push(photos.slice(i, i + 10));
    chunks.forEach((chunk, chunkIndex) => {
      const payload = { chat_id: String(chatId) };
      const media = [];
      chunk.forEach((photo, index) => {
        const key = 'photo' + index;
        payload[key] = dataUrlToBlob(photo);
        const item = { type: 'photo', media: 'attach://' + key };
        if (chunkIndex === 0 && index === 0 && caption) item.caption = caption;
        media.push(item);
      });
      payload.media = JSON.stringify(media);
      const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMediaGroup', {
        method: 'post',
        payload: payload,
        muteHttpExceptions: true
      });
      const body = JSON.parse(response.getContentText() || '{}');
      if (!body.ok) throw new Error(body.description || response.getContentText());
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function dataUrlToBlob(photo) {
  const dataUrl = String(photo.dataUrl || '');
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Некорректный формат фото');
  const bytes = Utilities.base64Decode(match[2]);
  return Utilities.newBlob(bytes, photo.type || match[1] || 'image/jpeg', photo.name || 'photo.jpg');
}

function parseExtras(raw) {
  try {
    const items = JSON.parse(raw || '[]');
    return Array.isArray(items) ? items : [];
  } catch (_) {
    return [];
  }
}

function rub(value) {
  return (Number(value) || 0).toLocaleString('ru-RU') + ' ₽';
}

function planBar(pct) {
  const width = 10;
  const filled = Math.round(Math.min(Math.max(Number(pct) || 0, 0), 100) / 100 * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function planStatus(pct) {
  if (pct >= 100) return '✅ Выполнен';
  if (pct >= 80) return '🟡 Близко';
  return '🔴 Не выполнен';
}

function escapeTelegramText(value) {
  return String(value || '').replace(/([_*`\[])/g, '\\$1');
}

function isLockedPastDateServer(shiftDate) {
  const todayParts = Utilities.formatDate(new Date(), 'GMT+3', 'yyyy-MM-dd').split('-');
  const todayMsk = new Date(Number(todayParts[0]), Number(todayParts[1]) - 1, Number(todayParts[2]));
  const shiftOnly = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
  const diffDays = Math.round((todayMsk.getTime() - shiftOnly.getTime()) / 86400000);
  return diffDays > 2;
}

// ═══════════════════════════════════════════════════
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════════

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function isLockedPastDateServer(shiftDate) {
  const nowMsk = new Date(Utilities.formatDate(new Date(), 'GMT+3', 'yyyy-MM-dd') + 'T00:00:00');
  const picked = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
  const diffDays = Math.floor((nowMsk.getTime() - picked.getTime()) / 86400000);
  return diffDays > 2;
}

function getPlansFromSettings(ss) {
  const sheet = ss.getSheetByName('Настройки');
  if (!sheet) return {};
  const plans = {};
  for (let r = 4; r <= 10; r++) {
    const code    = sheet.getRange(r, 2).getValue();
    const revenue = sheet.getRange(r, 3).getValue() || 0;
    const cash    = sheet.getRange(r, 4).getValue() || 0;
    if (code) plans[String(code).trim()] = { revenue, cash };
  }
  return plans;
}

function getDefaultEmployees() {
  return [
    { name: 'Даня', pin: '3113' },
    { name: 'Элина', pin: '7407' }
  ];
}

function getEmployeesFromSettings(ss) {
  const sheet = ss.getSheetByName('Настройки');
  if (!sheet) return getDefaultEmployees();

  const employees = [];
  const startRow = 24;
  const rowCount = 30;
  const values = sheet.getRange(startRow, 1, rowCount, 3).getValues();

  values.forEach(row => {
    const name = String(row[1] || '').trim();
    const pin = String(row[2] || '').trim();
    if (name && pin) employees.push({ name, pin });
  });

  if (employees.length) return employees;

  const defaults = getDefaultEmployees();
  saveEmployeesToSettings(ss, defaults);
  return defaults;
}

function saveEmployeesToSettings(ss, employees) {
  const sheet = ss.getSheetByName('Настройки');
  if (!sheet) return;

  const startRow = 24;
  const rowCount = 30;
  sheet.getRange(startRow - 1, 1, 1, 3).setValues([['№', 'Сотрудник', 'PIN']]);
  sheet.getRange(startRow - 1, 1, 1, 3).setFontWeight('bold').setBackground('#F0E4CC');
  sheet.getRange(startRow, 1, rowCount, 3).clearContent();

  const rows = (employees || [])
    .filter(emp => emp && String(emp.name || '').trim() && String(emp.pin || '').trim())
    .slice(0, rowCount)
    .map((emp, index) => [index + 1, String(emp.name).trim(), String(emp.pin).trim()]);

  if (rows.length) sheet.getRange(startRow, 1, rows.length, 3).setValues(rows);
}

function setupDefaultSettings() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Настройки');
  if (!sheet) return { status: 'error', message: 'Лист "Настройки" не найден' };

  sheet.getRange(16, 3).setValue('Юра');
  sheet.getRange(16, 4).setValue('1461');
  saveEmployeesToSettings(ss, getDefaultEmployees());

  return {
    status: 'success',
    ownerName: 'Юра',
    ownerPin: '1461',
    employees: getDefaultEmployees()
  };
}

function getScriptSecrets() {
  const props = PropertiesService.getScriptProperties();
  return {
    botToken: props.getProperty('TELEGRAM_BOT_TOKEN') || '',
    chatOwner: props.getProperty('TELEGRAM_CHAT_OWNER') || '',
    chatGeneral: props.getProperty('TELEGRAM_CHAT_GENERAL') || ''
  };
}

function saveScriptSecrets(data) {
  const props = PropertiesService.getScriptProperties();
  if (data.botToken !== undefined && String(data.botToken || '').trim()) {
    props.setProperty('TELEGRAM_BOT_TOKEN', String(data.botToken).trim());
  }
  if (data.chatOwner !== undefined && String(data.chatOwner || '').trim()) {
    props.setProperty('TELEGRAM_CHAT_OWNER', String(data.chatOwner).trim());
  }
  if (data.chatGeneral !== undefined && String(data.chatGeneral || '').trim()) {
    props.setProperty('TELEGRAM_CHAT_GENERAL', String(data.chatGeneral).trim());
  }
}



/**
 * Сохранить настройки руководителя в лист "Настройки"
 * Вызывается через POST с action=saveSettings
 */
function saveSettings(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Настройки');
    if (!sheet) return { status: 'error', message: 'Лист "Настройки" не найден' };

    if (data.hookahRate !== undefined)  sheet.getRange(13, 4).setValue(Number(data.hookahRate) || 300);
    if (data.cashDiffLimit !== undefined) sheet.getRange(14, 4).setValue(Number(data.cashDiffLimit) || 500);
    if (data.lateHour !== undefined)    sheet.getRange(15, 4).setValue(Number(data.lateHour) || 6);
    if (data.ownerName !== undefined)   sheet.getRange(16, 3).setValue(String(data.ownerName || 'Юра'));
    if (data.ownerPin !== undefined)    sheet.getRange(16, 4).setValue(String(data.ownerPin || '1461'));
    if (data.maxTaxi !== undefined)     sheet.getRange(20, 4).setValue(Number(data.maxTaxi) || 0);
    saveScriptSecrets(data);

    // Планы по дням (если переданы)
    if (data.plans) {
      const dayMap = { 'Пн': 4, 'Вт': 5, 'Ср': 6, 'Чт': 7, 'Пт': 8, 'Сб': 9, 'Вс': 10 };
      Object.keys(data.plans).forEach(code => {
        const row = dayMap[code];
        if (row) {
          if (data.plans[code].revenue !== undefined) sheet.getRange(row, 3).setValue(Number(data.plans[code].revenue) || 0);
          if (data.plans[code].cash !== undefined)    sheet.getRange(row, 4).setValue(Number(data.plans[code].cash) || 0);
        }
      });
    }

    if (data.employees) {
      saveEmployeesToSettings(ss, data.employees);
    }

    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

function getParams(ss) {
  const sheet = ss.getSheetByName('Настройки');
  const secrets = getScriptSecrets();
  if (!sheet) return { hookahRate: 300, cashDiffLimit: 500, lateHour: 6, ownerName: 'Юра', ownerPin: '1461', ...secrets };

  const ownerName = String(sheet.getRange(16, 3).getValue() || '').trim() || 'Юра';
  const ownerPin = String(sheet.getRange(16, 4).getValue() || '').trim() || '1461';
  if (!String(sheet.getRange(16, 4).getValue() || '').trim()) sheet.getRange(16, 4).setValue(ownerPin);
  if (!String(sheet.getRange(16, 3).getValue() || '').trim()) sheet.getRange(16, 3).setValue(ownerName);

  return {
    hookahRate:    Number(sheet.getRange(13, 4).getValue()) || 300,
    cashDiffLimit: Number(sheet.getRange(14, 4).getValue()) || 500,
    lateHour:      Number(sheet.getRange(15, 4).getValue()) || 6,
    ownerName:     ownerName,
    ownerPin:      ownerPin,
    botToken:      secrets.botToken || String(sheet.getRange(17, 4).getValue() || ''),
    chatOwner:     secrets.chatOwner || String(sheet.getRange(18, 4).getValue() || ''),
    chatGeneral:   secrets.chatGeneral || String(sheet.getRange(19, 4).getValue() || ''),
    maxTaxi:       Number(sheet.getRange(20, 4).getValue()) || 0,
  };
}

function getDayCode(dateStr) {
  const codes = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const parts = String(dateStr).split('-');
  const d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
  return codes[d.getDay()];
}

function ensureDataSheet(ss) {
  let sheet = ss.getSheetByName('Данные');
  if (!sheet) sheet = ss.insertSheet('Данные', 0);

  if (sheet.getLastRow() < 3 || sheet.getRange('A3').getValue() !== 'Дата') {
    sheet.getRange('A1:X1').merge()
      .setValue('ЭТНА — Журнал закрытия смен')
      .setFontWeight('bold').setFontSize(14)
      .setFontColor('#FFFFFF').setBackground('#1A1A1A')
      .setHorizontalAlignment('center');
    sheet.setRowHeight(1, 32);

    [['A2:C2','СМЕНА'],['D2:F2','ОТКРЫТИЕ'],['G2:L2','ДОХОДЫ'],
     ['M2:Q2','РАСХОДЫ'],['R2:R2','ИНКАССАЦИЯ'],
     ['S2:V2','СВЕРКА КАССЫ'],['W2:X2','ПЛАН VS ФАКТ']
    ].forEach(([range, title]) => {
      sheet.getRange(range).merge()
        .setValue(title).setFontWeight('bold').setFontSize(9)
        .setBackground('#F0E4CC').setHorizontalAlignment('center');
    });
    sheet.setRowHeight(2, 20);

    const headers = [
      'Дата','День','Сотрудник',
      'Откр. (расч.)','Откр. (факт)','Откр. Δ',
      'Терминал 1','Терминал 2','Безнал итого',
      'Наличные','Переводы','Выручка итого',
      'Такси','Мойка','Кальяны (шт)','Выпл. кальяны','Доп. расходы',
      'Инкассация','Остаток (факт)','Переводы (ref)','Остаток (расч.)','Разница',
      'План выручки','% выполнения',
    ];
    sheet.getRange(3, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#C8A96E').setHorizontalAlignment('center').setFontSize(9);
    sheet.setRowHeight(3, 36);
    [14,7,16,14,14,12,14,14,14,13,13,15,12,12,12,14,14,14,15,14,15,13,14,14]
      .forEach((w, i) => sheet.setColumnWidth(i + 1, w * 7));
    // Устанавливаем формат столбца A как дата (без времени) для всей таблицы
    sheet.getRange('A4:A1000').setNumberFormat('DD.MM.YYYY');
    sheet.setFrozenRows(3);

    // Удаляем пустые строки с формулами если они есть (артефакт от xlsx)
    const lastR = sheet.getLastRow();
    if (lastR > 3) {
      const colA = sheet.getRange(4, 1, lastR - 3, 1).getValues();
      let firstNonEmpty = -1;
      for (let i = 0; i < colA.length; i++) {
        if (colA[i][0] !== '' && colA[i][0] !== null) { firstNonEmpty = i; break; }
      }
      if (firstNonEmpty === -1) {
        // Все строки пустые — очищаем всё после заголовков
        sheet.deleteRows(4, lastR - 3);
      }
    }
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * УТИЛИТА: Запустить один раз вручную из Apps Script
 * Убирает время из дат в столбце A листа "Данные"
 * Запуск: Apps Script → выбрать функцию fixDatesInColumnA → ▶ Выполнить
 */
function fixDatesInColumnA() {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName('Данные');
  if (!sheet || sheet.getLastRow() < 4) return;

  const lastRow = sheet.getLastRow();
  const dateRange = sheet.getRange(4, 1, lastRow - 3, 1);
  const values = dateRange.getValues();

  values.forEach((row, i) => {
    const val = row[0];
    if (val instanceof Date) {
      // Обнуляем время — оставляем только дату
      const clean = new Date(val.getFullYear(), val.getMonth(), val.getDate());
      values[i][0] = clean;
    }
  });

  dateRange.setValues(values);
  dateRange.setNumberFormat('DD.MM.YYYY');
  SpreadsheetApp.getUi().alert('Готово! Время убрано из ' + (lastRow - 3) + ' строк.');
}
