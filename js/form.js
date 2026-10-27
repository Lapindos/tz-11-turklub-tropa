// Форма брони. generate_lead уходит только после ответа приёмника {"ok": true}.
// Это требование раздела 4.3 ТЗ: событие фиксирует принятую заявку, а не нажатие кнопки.
(function () {
  'use strict';

  var form = document.querySelector('#booking-form');
  if (!form || !window.TROPA_DATA || !window.Tropa) return;

  var status = document.querySelector('#form-status');
  var submitButton = form.querySelector('[type="submit"]');
  var requestField = form.elements.namedItem('request_id');
  var tripSelect = form.elements.namedItem('trip_id');
  var dateSelect = form.elements.namedItem('trip_date');
  var query = new URLSearchParams(window.location.search);

  function tripById(id) {
    return window.TROPA_DATA.trips.find(function (trip) { return trip.id === id; }) || null;
  }

  function datesFor(tripId) {
    return window.TROPA_DATA.departures.filter(function (item) {
      return item.tripId === tripId;
    });
  }

  function fillUtm() {
    var utm = window.Tropa.getUtm();
    Object.keys(utm).forEach(function (key) {
      var input = form.elements.namedItem(key);
      if (input) input.value = utm[key];
    });
  }

  function fillTrips() {
    window.TROPA_DATA.trips.forEach(function (trip) {
      var option = document.createElement('option');
      option.value = trip.id;
      option.textContent = trip.name + ' · ' + trip.durationLabel + ' · ' + trip.difficultyLabel;
      tripSelect.appendChild(option);
    });
    var requested = query.get('trip_id');
    if (requested && tripById(requested)) tripSelect.value = requested;
  }

  function formatDate(iso) {
    var parts = iso.split('-');
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return Number(parts[2]) + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0];
  }

  function fillDates() {
    var tripId = tripSelect.value;
    var previous = dateSelect.value || query.get('trip_date') || '';
    dateSelect.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = tripId ? 'Выберите дату' : 'Сначала выберите маршрут';
    dateSelect.appendChild(placeholder);
    datesFor(tripId).forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.date;
      option.textContent = formatDate(item.date) + (item.seats > 0 ? ' · свободно ' + item.seats : ' · мест нет');
      if (item.seats <= 0) option.disabled = true;
      dateSelect.appendChild(option);
    });
    if (previous && !dateSelect.querySelector('option[value="' + previous + '"][disabled]')) {
      var exists = Array.prototype.some.call(dateSelect.options, function (option) {
        return option.value === previous && !option.disabled;
      });
      if (exists) dateSelect.value = previous;
    }
  }

  function showError(name, message) {
    var box = form.querySelector('[data-error-for="' + name + '"]');
    var field = form.elements.namedItem(name);
    if (box) {
      box.hidden = !message;
      box.textContent = message || '';
    }
    if (field && 'setAttribute' in field) {
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
  }

  function clearErrors() {
    form.querySelectorAll('[data-error-for]').forEach(function (box) {
      box.hidden = true;
      box.textContent = '';
    });
    Array.prototype.forEach.call(form.elements, function (field) {
      if (field.removeAttribute) field.removeAttribute('aria-invalid');
    });
    status.textContent = '';
  }

  function fail(name, errorType, message) {
    showError(name, message);
    window.Tropa.track('form_error', { field_name: name, error_type: errorType });
    status.textContent = 'Заявка не отправлена. Исправьте отмеченное поле.';
    var field = form.elements.namedItem(name);
    if (field && field.focus) field.focus();
  }

  function normalizePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11 && (digits.charAt(0) === '7' || digits.charAt(0) === '8')) {
      digits = digits.slice(1);
    }
    if (digits.length !== 10) return '';
    return '+7' + digits;
  }

  function makeRequestId() {
    if (window.crypto && crypto.randomUUID) {
      return 'REQ-' + crypto.randomUUID().toUpperCase();
    }
    var hex = '';
    for (var i = 0; i < 32; i += 1) hex += Math.floor(Math.random() * 16).toString(16);
    return ('REQ-' + hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-4' + hex.slice(13, 16) + '-a' + hex.slice(17, 20) + '-' + hex.slice(20)).toUpperCase();
  }

  function serverMessage(code) {
    var messages = {
      missing_required: 'Приёмник не увидел обязательное поле.',
      invalid_request_id: 'Некорректный номер заявки. Обновите страницу и отправьте форму ещё раз.',
      invalid_phone: 'Приёмник не принял телефон. Нужен формат +7 и 10 цифр.',
      invalid_email: 'Приёмник не принял почту.',
      invalid_trip: 'Такого маршрута нет в списке.',
      invalid_date: 'Этой даты нет в календаре маршрута.',
      invalid_participants: 'В одной брони может быть от 1 до 6 участников.',
      value_too_long: 'Одно из полей длиннее 200 символов.',
      duplicate_request_id: 'Заявка с этим номером уже есть в таблице. Вторая строка не создана.',
      busy_retry: 'Приёмник занят. Нажмите «Забронировать» ещё раз: номер заявки сохранится.',
      invalid_sheet_schema: 'Лист leads не совпадает со столбцами из ТЗ. Проверьте первую строку таблицы.',
      storage_error: 'Таблица не записала строку. Попробуйте ещё раз.'
    };
    return messages[code] || 'Приёмник отклонил заявку.';
  }

  fillTrips();
  fillDates();
  fillUtm();
  tripSelect.addEventListener('change', fillDates);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    // Обычная отправка страницу не перезагружает, поэтому расширенная статистика
    // не видит form_submit. Событие уходит отсюда в момент нажатия кнопки.
    window.Tropa.track('form_submit', {
      form_id: 'booking-form',
      form_destination: window.location.pathname,
      form_submit_text: 'Забронировать'
    });
    clearErrors();
    fillUtm();

    var name = form.elements.namedItem('name').value.trim();
    var phone = normalizePhone(form.elements.namedItem('phone').value);
    var email = form.elements.namedItem('email').value.trim();
    var tripId = tripSelect.value;
    var tripDate = dateSelect.value;
    var participantsRaw = form.elements.namedItem('participants').value.trim();
    var participants = Number(participantsRaw);
    var ageOk = form.elements.namedItem('age_ok').checked;
    var consent = form.elements.namedItem('consent').checked;

    if (name.length < 2 || name.length > 60) {
      fail('name', name ? 'format' : 'empty', 'Имя — от 2 до 60 символов.');
      return;
    }
    if (!phone) {
      fail('phone', form.elements.namedItem('phone').value.trim() ? 'format' : 'empty', 'Телефон: +7 и ещё 10 цифр.');
      return;
    }
    form.elements.namedItem('phone').value = phone;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fail('email', 'format', 'Проверьте почту или оставьте поле пустым.');
      return;
    }
    if (!tripById(tripId)) {
      fail('trip_id', tripId ? 'format' : 'empty', 'Выберите маршрут из списка.');
      return;
    }
    var departure = datesFor(tripId).find(function (item) { return item.date === tripDate; });
    if (!departure || departure.seats <= 0) {
      fail('trip_date', tripDate ? 'format' : 'empty', 'Выберите дату, на которой ещё есть места.');
      return;
    }
    if (!/^\d+$/.test(participantsRaw) || participants < 1 || participants > 6) {
      fail('participants', participantsRaw ? 'range' : 'empty', 'В одной брони от 1 до 6 участников.');
      return;
    }
    if (!ageOk) {
      fail('age_ok', 'empty', 'Подтвердите: вам есть 18 лет или вы идёте с родителем.');
      return;
    }
    if (!consent) {
      fail('consent', 'empty', 'Нужно согласие на обработку персональных данных.');
      return;
    }

    var tooLong = ['name', 'phone', 'email', 'trip_id', 'trip_date', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].some(function (key) {
      return String(form.elements.namedItem(key).value || '').length > 200;
    });
    if (tooLong) {
      fail('name', 'format', 'Одно из полей длиннее 200 символов.');
      return;
    }

    var scriptUrl = (window.TROPA_CONFIG && window.TROPA_CONFIG.scriptUrl) || '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(scriptUrl)) {
      window.Tropa.track('form_error', { field_name: 'form', error_type: 'server' });
      status.textContent = 'Приёмник заявок ещё не подключён. Вставьте URL веб-приложения Apps Script в файл js/config.js и опубликуйте сайт заново.';
      return;
    }

    if (!requestField.value) requestField.value = makeRequestId();

    var payload = new URLSearchParams({
      request_id: requestField.value,
      name: name,
      phone: phone,
      email: email,
      trip_id: tripId,
      trip_date: tripDate,
      participants: String(participants),
      utm_source: form.elements.namedItem('utm_source').value,
      utm_medium: form.elements.namedItem('utm_medium').value,
      utm_campaign: form.elements.namedItem('utm_campaign').value,
      utm_content: form.elements.namedItem('utm_content').value
    });

    submitButton.disabled = true;
    status.textContent = 'Отправляем заявку ' + requestField.value + '…';

    fetch(scriptUrl, { method: 'POST', body: payload })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (!result || result.ok !== true) {
          window.Tropa.track('form_error', { field_name: 'form', error_type: 'server' });
          status.textContent = serverMessage(result && result.error);
          submitButton.disabled = false;
          return;
        }
        window.Tropa.track('generate_lead', {
          lead_trip_id: tripId,
          participants: participants,
          lead_source: 'booking_form'
        });
        window.location.href = '/thanks.html?request_id=' + encodeURIComponent(result.request_id || requestField.value);
      })
      .catch(function () {
        window.Tropa.track('form_error', { field_name: 'form', error_type: 'server' });
        status.textContent = 'Не удалось получить ответ приёмника. Номер заявки сохранён: повторная отправка не создаст вторую строку.';
        submitButton.disabled = false;
      });
  });
})();
