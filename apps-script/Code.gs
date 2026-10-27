// Приёмник заявок турклуба «Тропа». Основа — приёмник темы 7 курса.
// Вставьте ID таблицы (кусок адреса между /d/ и /edit) и опубликуйте
// веб-приложение: выполнять от вашего имени, доступ «Все».
const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID';

const HEADERS = [
  'request_id', 'created_at', 'name', 'phone', 'email',
  'trip_id', 'trip_date', 'participants',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'status'
];

const TRIP_IDS = ['icefalls', 'snowshoes', 'sunrise', 'plateau', 'traverse', 'newyear_hut'];

// Даты совпадают с массивом departures в js/data.js.
const TRIP_DATES = {
  icefalls: ['2026-12-13', '2027-01-10'],
  snowshoes: ['2026-12-06', '2026-12-20', '2027-01-11'],
  sunrise: ['2026-12-27', '2027-01-17'],
  plateau: ['2026-12-19', '2027-01-30'],
  traverse: ['2027-01-15', '2027-01-29'],
  newyear_hut: ['2026-12-31']
};

const REQUEST_ID = /^REQ-[A-F0-9]{8}-[A-F0-9]{4}-4[A-F0-9]{3}-[89AB][A-F0-9]{3}-[A-F0-9]{12}$/i;

function doPost(e) {
  const params = readParams(e);
  const clean = function (key) { return String(params[key] || '').trim(); };

  const missing = ['request_id', 'name', 'phone', 'trip_id', 'trip_date', 'participants'].filter(function (key) {
    return !clean(key);
  });
  if (missing.length) return json({ ok: false, error: 'missing_required', fields: missing });

  const requestId = clean('request_id');
  if (!REQUEST_ID.test(requestId)) return json({ ok: false, error: 'invalid_request_id' });

  const name = clean('name');
  if (name.length < 2 || name.length > 60) return json({ ok: false, error: 'value_too_long' });

  const phone = normalizePhone(clean('phone'));
  if (!phone) return json({ ok: false, error: 'invalid_phone' });

  const email = clean('email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid_email' });

  const tripId = clean('trip_id');
  if (TRIP_IDS.indexOf(tripId) === -1) return json({ ok: false, error: 'invalid_trip' });

  const tripDate = clean('trip_date');
  if (!TRIP_DATES[tripId] || TRIP_DATES[tripId].indexOf(tripDate) === -1) {
    return json({ ok: false, error: 'invalid_date' });
  }

  const participants = Number(clean('participants'));
  if (!/^\d+$/.test(clean('participants')) || participants < 1 || participants > 6) {
    return json({ ok: false, error: 'invalid_participants' });
  }

  const textKeys = ['name', 'phone', 'email', 'trip_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  if (textKeys.some(function (key) { return clean(key).length > 200; })) {
    return json({ ok: false, error: 'value_too_long' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json({ ok: false, error: 'busy_retry' });
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('leads');
    if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) {
      return json({ ok: false, error: 'invalid_sheet_schema' });
    }
    const duplicate = sheet.getRange('A:A').createTextFinder(requestId)
      .matchEntireCell(true).matchCase(false).useRegularExpression(false).findNext();
    if (duplicate) return json({ ok: false, error: 'duplicate_request_id' });

    // status из браузера не читаем: новую строку всегда открывает приёмник.
    sheet.appendRow([
      requestId,
      new Date(),
      textCell(name),
      textCell(phone),
      textCell(email),
      tripId,
      Utilities.parseDate(tripDate, 'Europe/Moscow', 'yyyy-MM-dd'),
      participants,
      textCell(clean('utm_source') || 'direct'),
      textCell(clean('utm_medium') || 'none'),
      textCell(clean('utm_campaign') || 'not_set'),
      textCell(clean('utm_content') || 'not_set'),
      'new'
    ]);
    SpreadsheetApp.flush();
    return json({ ok: true, request_id: requestId });
  } catch (error) {
    return json({ ok: false, error: 'storage_error' });
  } finally {
    lock.releaseLock();
  }
}

function readParams(e) {
  if (e && e.parameter && (e.parameter.request_id || e.parameter.name)) return e.parameter;
  const raw = e && e.postData && e.postData.contents;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }
  return {};
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && (digits.charAt(0) === '7' || digits.charAt(0) === '8')) digits = digits.slice(1);
  if (digits.length !== 10) return '';
  return '+7' + digits;
}

function textCell(value) {
  return /^[=+@-]/.test(value) ? "'" + value : value;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
