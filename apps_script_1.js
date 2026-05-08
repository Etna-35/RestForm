/**
 * ЭТНА — Apps Script v2.1
 * Исправлено: обработка text/plain (CORS), формат данных
 *
 * УСТАНОВКА:
 * 1. Загрузите etna_smeny.xlsx в Google Drive
 * 2. Расширения → Apps Script → вставьте код → сохраните
 * 3. Развернуть → Создать развёртывание
 *    • Тип: Веб-приложение
 *    • Выполнять как: Я
 *    • Доступ: Все
 * 4. Скопируйте URL → вставьте в ⚙ Настройки формы
 *
 * ВАЖНО: после изменений всегда создавайте НОВОЕ развёртывание.
 */


// ═══════════════════════════════════════════════════
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════════

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
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

function getParams(ss) {
  const sheet = ss.getSheetByName('Настройки');
  if (!sheet) return { hookahRate: 300, cashDiffLimit: 500, lateHour: 6 };
  return {
    hookahRate:    Number(sheet.getRange(13, 4).getValue()) || 300,
    cashDiffLimit: Number(sheet.getRange(14, 4).getValue()) || 500,
    lateHour:      Number(sheet.getRange(15, 4).getValue()) || 6,
    ownerPin:      String(sheet.getRange(16, 4).getValue() || '0000'),
  };
}

function getDayCode(dateStr) {
  const codes = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  // Парсим дату как локальную, не UTC
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
      'Инкассация',
      'Остаток (факт)','Переводы (ref)','Остаток (расч.)','Разница',
      'План выручки','% выполнения',
    ];
    sheet.getRange(3, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#C8A96E').setHorizontalAlignment('center').setFontSize(9);
    sheet.setRowHeight(3, 36);

    [14,7,16,14,14,12,14,14,14,13,13,15,12,12,12,14,14,14,15,14,15,13,14,14]
      .forEach((w, i) => sheet.setColumnWidth(i + 1, w * 7));

    sheet.setFrozenRows(3);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ═══════════════════════════════════════════════════
//  POST — приём отчёта из формы
// ═══════════════════════════════════════════════════

function doPost(e) {
  try {
    // Принимаем и text/plain и application/json (браузер шлёт text/plain для CORS)
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    const ss     = getSpreadsheet();
    const plans  = getPlansFromSettings(ss);
    const params = getParams(ss);

    const dayCode = getDayCode(data.date);
    const plan    = plans[dayCode] || { revenue: 45000, cash: 12000 };

    // Доходы
    const terminal1 = Number(data.terminal1) || 0;
    const terminal2 = Number(data.terminal2) || 0;
    const cardRev   = terminal1 + terminal2;
    const cashRev   = Number(data.cashRev)   || 0;
    const transRev  = Number(data.transRev)  || 0;
    const totalRev  = cardRev + cashRev + transRev;

    // Расходы
    const taxiCost  = Number(data.taxiCost)  || 0;
    const washCost  = Number(data.washCost)  || 0;
    const hookahs   = Number(data.hookahs)   || 0;
    const hookahPay = hookahs * params.hookahRate;

    let extrasTotal = 0;
    try {
      extrasTotal = JSON.parse(data.extras || '[]')
        .reduce((s, ex) => s + (Number(ex.amount) || 0), 0);
    } catch (_) {}

    // Касса
    const collection   = Number(data.collection)   || 0;
    const cashOpen     = Number(data.cashOpen)      || 0;
    const cashOpenCalc = Number(data.cashOpenCalc)  || 0;
    const cashActual   = Number(data.cashActual)    || 0;

    const cashCalc = cashOpen + cashRev + transRev
                   - taxiCost - washCost - hookahPay - extrasTotal - collection;
    const cashDiff = cashActual - cashCalc;

    const pct = plan.revenue > 0 ? totalRev / plan.revenue : 0;

    // Запись в таблицу
    const sheet  = ensureDataSheet(ss);
    const newRow = Math.max(sheet.getLastRow() + 1, 4);

    // Создаём объект Date правильно (без UTC сдвига)
    const dateParts = String(data.date).split('-');
    const shiftDate = new Date(Number(dateParts[0]), Number(dateParts[1])-1, Number(dateParts[2]));

    sheet.getRange(newRow, 1, 1, 24).setValues([[
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
    ]]);

    // Форматирование
    const bg = newRow % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
    sheet.getRange(newRow, 1, 1, 24).setBackground(bg).setFontSize(10).setVerticalAlignment('middle');
    sheet.getRange(newRow, 1).setNumberFormat('DD.MM.YYYY');
    sheet.getRange(newRow, 2).setNumberFormat('@').setHorizontalAlignment('center');
    sheet.getRange(newRow, 15).setNumberFormat('0').setHorizontalAlignment('center');
    sheet.getRange(newRow, 24).setNumberFormat('0.0%').setHorizontalAlignment('right');

    const RUB = '#,##0.00\\ "₽"';
    [4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23]
      .forEach(c => sheet.getRange(newRow, c).setNumberFormat(RUB).setHorizontalAlignment('right'));

    // Цвет разницы (V=22)
    const diffCell = sheet.getRange(newRow, 22);
    if (cashDiff === 0)                              { diffCell.setFontColor('#5AB87A').setBackground('#E6F5EC'); }
    else if (Math.abs(cashDiff) <= params.cashDiffLimit) { diffCell.setFontColor('#E0A84A').setBackground('#FFF8E6'); }
    else                                             { diffCell.setFontColor('#E05A4A').setBackground('#FDECEA'); }

    // Цвет % выполнения (X=24)
    const pctCell = sheet.getRange(newRow, 24);
    if (pct >= 1)        { pctCell.setFontColor('#5AB87A').setBackground('#E6F5EC'); }
    else if (pct >= 0.8) { pctCell.setFontColor('#E0A84A').setBackground('#FFF8E6'); }
    else                 { pctCell.setFontColor('#E05A4A').setBackground('#FDECEA'); }

    return jsonResponse({
      status:     'success',
      row:        newRow,
      dayCode,
      plan,
      cashCalc,
      hookahRate: params.hookahRate,
    });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString(), stack: err.stack });
  }
}


// ═══════════════════════════════════════════════════
//  GET — запросы от формы при загрузке
// ═══════════════════════════════════════════════════

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || '';
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
      });
    }

    if (action === 'getSettings') {
      const plans  = getPlansFromSettings(ss);
      const params = getParams(ss);
      return jsonResponse({ plans, ...params }); // включает ownerPin
    }

    return jsonResponse({ status: 'ok', version: '2.1' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}
