// Поведение страниц: фильтр маршрутов, календарь, аренда, меню.
// События GA4 отсюда не отправляются напрямую. Для них вызывается Tropa.track,
// а сам gtag('event') живёт в js/analytics.js.
(function () {
  'use strict';

  var data = window.TROPA_DATA;
  if (!data) return;

  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTH_TITLE = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  function tripById(id) {
    return data.trips.find(function (trip) { return trip.id === id; }) || null;
  }

  function rub(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0₽';
  }

  function formatDay(iso) {
    var parts = iso.split('-');
    return Number(parts[2]) + ' ' + MONTHS[Number(parts[1]) - 1];
  }

  function nearestOpen(tripId, fromDate) {
    var from = new Date(fromDate + 'T00:00:00');
    var best = null;
    var bestDistance = Infinity;
    data.departures.forEach(function (item) {
      if (item.tripId !== tripId || item.seats <= 0 || item.date === fromDate) return;
      var distance = Math.abs(new Date(item.date + 'T00:00:00') - from);
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    });
    return best;
  }

  function includedText(trip) {
    var base = 'В стоимости: два инструктора, трансфер от железнодорожного вокзала, групповое снаряжение и страховка от несчастного случая.';
    if (trip.days > 1) return base + ' В многодневном походе ещё горячее питание.';
    return base;
  }

  var menuButton = document.querySelector('.nav-toggle');
  var menu = document.querySelector('#site-nav');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function renderTrips(list, filter) {
    list.innerHTML = '';
    var visible = data.trips.filter(function (trip) {
      var difficultyOk = filter.difficulty === 'all' || trip.difficulty === filter.difficulty;
      var daysOk = filter.days === 'all' || String(trip.days) === String(filter.days);
      return difficultyOk && daysOk;
    });
    if (!visible.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Такого сочетания сложности и длительности в зимнем сезоне нет.';
      list.appendChild(empty);
      return;
    }
    visible.forEach(function (trip) {
      var card = document.createElement('article');
      card.className = 'card';
      card.innerHTML =
        '<img src="' + trip.image + '" alt="' + trip.alt + '" width="800" height="500">' +
        '<div class="card-body">' +
          '<h3>' + trip.name + '</h3>' +
          '<p class="meta">' + trip.durationLabel + ' · ' + trip.difficultyLabel + ' · ' + rub(trip.price) + '</p>' +
          '<p>' + trip.lead + '</p>' +
          '<div class="details" id="details-' + trip.id + '" hidden>' +
            '<p>Что увидим: ' + trip.see + ' Точный километраж и набор высоты скажем до выезда.</p>' +
            '<p>' + includedText(trip) + '</p>' +
          '</div>' +
          '<div class="card-actions">' +
            '<button type="button" class="button button-ghost" data-event="trip_view" data-trip-id="' + trip.id + '" data-difficulty="' + trip.difficulty + '" data-details="details-' + trip.id + '" aria-expanded="false" aria-controls="details-' + trip.id + '">Подробнее</button>' +
            '<a class="button" href="/contacts.html?trip_id=' + trip.id + '" data-event="cta_click" data-button-name="book_' + trip.id + '" data-page-section="trips">Забронировать</a>' +
          '</div>' +
        '</div>';
      list.appendChild(card);
    });
  }

  var filterForm = document.querySelector('#trip-filter');
  var tripResults = document.querySelector('#trip-results');
  if (filterForm && tripResults) {
    filterForm.addEventListener('submit', function (event) { event.preventDefault(); });

    function currentFilter() {
      var difficulty = (filterForm.querySelector('input[name="difficulty"]:checked') || {}).value || 'all';
      var days = (filterForm.querySelector('input[name="duration_days"]:checked') || {}).value || 'all';
      return { difficulty: difficulty, days: days };
    }

    function applyFilter(sendEvent) {
      var filter = currentFilter();
      renderTrips(tripResults, filter);
      if (!sendEvent || !window.Tropa) return;
      window.Tropa.track('trip_filter', {
        difficulty: filter.difficulty,
        duration_days: filter.days === 'all' ? 'all' : Number(filter.days)
      });
    }

    var hash = window.location.hash.replace('#', '');
    if (hash === 'easy' || hash === 'medium' || hash === 'hard') {
      var preset = filterForm.querySelector('input[name="difficulty"][value="' + hash + '"]');
      if (preset) preset.checked = true;
      applyFilter(true);
    } else {
      applyFilter(false);
    }

    filterForm.addEventListener('change', function () { applyFilter(true); });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-details]');
    if (!button) return;
    var panel = document.getElementById(button.getAttribute('data-details'));
    if (!panel) return;
    var willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });

  var upcoming = document.querySelector('#upcoming-list');
  if (upcoming) {
    data.departures.slice().sort(function (a, b) {
      return a.date < b.date ? -1 : 1;
    }).slice(0, 4).forEach(function (item) {
      var trip = tripById(item.tripId);
      if (!trip) return;
      var card = document.createElement('article');
      card.className = 'card card-compact';
      var seats = item.seats > 0
        ? '<p class="seats">Свободно мест: ' + item.seats + '</p>'
        : '<p class="seats seats-none">Мест нет</p>';
      var next = item.seats > 0 ? '' : (function () {
        var other = nearestOpen(item.tripId, item.date);
        if (!other) return '';
        return '<a class="text-link" href="/calendar.html#date-' + other.date + '">Ближайшая другая дата этого маршрута — ' + formatDay(other.date) + '</a>';
      })();
      card.innerHTML =
        '<div class="card-body">' +
          '<p class="meta">' + formatDay(item.date) + '</p>' +
          '<h3>' + trip.name + '</h3>' +
          '<p>' + trip.durationLabel + ' · ' + trip.difficultyLabel + ' · ' + rub(trip.price) + '</p>' +
          seats + next +
          '<div class="card-actions">' +
            '<a class="button button-ghost" href="/trips.html#' + trip.difficulty + '" data-event="trip_view" data-trip-id="' + trip.id + '" data-difficulty="' + trip.difficulty + '">Карточка маршрута</a>' +
            (item.seats > 0
              ? '<a class="button" href="/contacts.html?trip_id=' + trip.id + '&trip_date=' + item.date + '" data-event="cta_click" data-button-name="book_date_' + trip.id + '" data-page-section="upcoming">Забронировать</a>'
              : '') +
          '</div>' +
        '</div>';
      upcoming.appendChild(card);
    });
  }

  var guideList = document.querySelector('#guide-list');
  if (guideList) {
    data.guides.forEach(function (guide) {
      var card = document.createElement('article');
      card.className = 'card card-guide';
      card.innerHTML =
        '<div class="card-body">' +
          '<h3>' + guide.title + '</h3>' +
          '<p>' + guide.text + '</p>' +
          '<button type="button" class="button button-ghost" data-event="guide_view" data-guide-id="' + guide.id + '">Смотреть направление</button>' +
        '</div>';
      guideList.appendChild(card);
    });
  }

  var calendar = document.querySelector('#calendar');
  if (calendar) renderCalendar(calendar);

  function renderCalendar(root) {
    [{ year: 2026, month: 11 }, { year: 2027, month: 0 }].forEach(function (spec) {
      var wrap = document.createElement('section');
      wrap.className = 'month';
      var title = document.createElement('h3');
      title.textContent = MONTH_TITLE[spec.month] + ' ' + spec.year;
      wrap.appendChild(title);
      var grid = document.createElement('div');
      grid.className = 'month-grid';
      ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].forEach(function (label) {
        var cell = document.createElement('div');
        cell.className = 'weekday';
        cell.textContent = label;
        grid.appendChild(cell);
      });
      var first = new Date(spec.year, spec.month, 1);
      var offset = (first.getDay() + 6) % 7;
      var days = new Date(spec.year, spec.month + 1, 0).getDate();
      for (var blank = 0; blank < offset; blank += 1) {
        var pad = document.createElement('div');
        pad.className = 'day day-empty';
        grid.appendChild(pad);
      }
      for (var day = 1; day <= days; day += 1) {
        var iso = spec.year + '-' + String(spec.month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        var items = data.departures.filter(function (item) { return item.date === iso; });
        var cell = document.createElement('div');
        cell.className = 'day' + (items.length ? ' day-busy' : '');
        cell.id = 'date-' + iso;
        var number = document.createElement('span');
        number.className = 'day-num';
        number.textContent = String(day);
        cell.appendChild(number);
        items.forEach(function (item) {
          var trip = tripById(item.tripId);
          var shortName = { icefalls: 'Лёд', snowshoes: 'Снег', sunrise: 'Гора', plateau: 'Плато', traverse: 'Лыжи', newyear_hut: 'Изба' };
          var button = document.createElement('button');
          button.type = 'button';
          button.className = 'day-trip' + (item.seats > 0 ? '' : ' is-full');
          button.setAttribute('data-event', 'date_select');
          button.setAttribute('data-trip-id', item.tripId);
          button.setAttribute('data-trip-date', item.date);
          button.setAttribute('data-seats-left', String(item.seats));
          button.setAttribute('aria-label', (trip ? trip.name : item.tripId) + ', ' + formatDay(item.date) + (item.seats > 0 ? ', свободно ' + item.seats : ', мест нет'));
          button.textContent = shortName[item.tripId] || item.tripId;
          cell.appendChild(button);
        });
        grid.appendChild(cell);
      }
      wrap.appendChild(grid);
      root.appendChild(wrap);
    });

    var list = document.querySelector('#departure-list');
    if (list) {
      data.departures.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (item) {
        var trip = tripById(item.tripId);
        var row = document.createElement('li');
        var next = '';
        if (item.seats <= 0) {
          var other = nearestOpen(item.tripId, item.date);
          next = other ? ' Ближайшая другая дата — ' + formatDay(other.date) + '.' : '';
        }
        row.innerHTML = '<button type="button" data-event="date_select" data-trip-id="' + item.tripId + '" data-trip-date="' + item.date + '" data-seats-left="' + item.seats + '">' +
          formatDay(item.date) + ' · ' + (trip ? trip.name : item.tripId) +
          (item.seats > 0 ? ' · свободно ' + item.seats : ' · Мест нет.' + next) +
          '</button>';
        list.appendChild(row);
      });
    }

    var panel = document.querySelector('#date-panel');
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-trip-date]');
      if (!button || !panel) return;
      var trip = tripById(button.getAttribute('data-trip-id'));
      var date = button.getAttribute('data-trip-date');
      var seats = Number(button.getAttribute('data-seats-left'));
      panel.hidden = false;
      var next = seats > 0 ? '' : (function () {
        var other = nearestOpen(trip.id, date);
        if (!other) return '<p>Другой даты с местами для этого маршрута в календаре нет.</p>';
        return '<p class="seats-none">Мест нет. Ближайшая другая дата этого маршрута — ' + formatDay(other.date) + '.</p>' +
          '<a class="button" href="/contacts.html?trip_id=' + trip.id + '&trip_date=' + other.date + '" data-event="cta_click" data-button-name="next_date_' + trip.id + '" data-page-section="calendar">Забронировать ' + formatDay(other.date) + '</a>';
      })();
      panel.innerHTML =
        '<h3>' + trip.name + '</h3>' +
        '<p>' + formatDay(date) + ' · ' + trip.difficultyLabel + ' · ' + rub(trip.price) + '</p>' +
        (seats > 0
          ? '<p class="seats">Свободно мест: ' + seats + '</p><a class="button" href="/contacts.html?trip_id=' + trip.id + '&trip_date=' + date + '" data-event="cta_click" data-button-name="calendar_' + trip.id + '" data-page-section="calendar">Забронировать</a>'
          : next);
    });
  }

  var checklist = document.querySelector('#checklist');
  if (checklist) {
    data.checklist.forEach(function (item) {
      var row = document.createElement('li');
      row.innerHTML =
        '<label class="check">' +
          '<input type="checkbox" data-event="checklist_check" data-item-id="' + item.id + '">' +
          '<span>' + item.name + ' <small>' + item.hint + '</small></span>' +
        '</label>';
      checklist.appendChild(row);
    });
  }

  var rentalList = document.querySelector('#rental-list');
  var rentalDays = document.querySelector('#rental-days');
  var rentalResult = document.querySelector('#rental-result');
  var rentalButton = document.querySelector('#rental-button');
  if (rentalList && rentalDays && rentalResult) {
    data.gear.forEach(function (item) {
      var label = document.createElement('label');
      label.className = 'check';
      label.innerHTML = '<input type="checkbox" value="' + item.id + '"><span>' + item.name + ' — ' + rub(item.price) + ' за сутки</span>';
      rentalList.appendChild(label);
    });

    var lastSignature = '';

    function calculate(sendEvent) {
      var selected = Array.prototype.filter.call(rentalList.querySelectorAll('input:checked'), function (input) {
        return data.gear.some(function (item) { return item.id === input.value; });
      }).map(function (input) {
        return data.gear.find(function (item) { return item.id === input.value; });
      });
      var days = Number(rentalDays.value);
      if (!selected.length || !Number.isInteger(days) || days < 1) {
        rentalResult.textContent = 'Отметьте предметы и укажите число суток.';
        return;
      }
      var perDay = selected.reduce(function (sum, item) { return sum + item.price; }, 0);
      var total = perDay * days;
      var formula = '(' + selected.map(function (item) { return item.price; }).join(' + ') + ') × ' + days + ' = ' + rub(total);
      rentalResult.textContent = formula;
      if (!sendEvent || !window.Tropa) return;
      var signature = selected.map(function (item) { return item.id; }).sort().join(',') + ':' + days + ':' + total;
      if (signature === lastSignature) return;
      lastSignature = signature;
      window.Tropa.track('rental_calc', {
        items_count: selected.length,
        days: days,
        rental_price: total
      });
    }

    rentalList.addEventListener('change', function () { calculate(true); });
    rentalDays.addEventListener('input', function () { calculate(true); });
    if (rentalButton) rentalButton.addEventListener('click', function () { calculate(true); });
    calculate(false);
  }

  var promo = document.querySelector('#promo-copy');
  var promoStatus = document.querySelector('#promo-status');
  if (promo) {
    promo.addEventListener('click', function () {
      var code = promo.getAttribute('data-promo-code') || 'SNOW300';
      var done = function () {
        if (promoStatus) promoStatus.textContent = 'Промокод ' + code + ' скопирован.';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(done);
      } else {
        done();
      }
    });
  }

  var bookingNumber = document.querySelector('#booking-number');
  if (bookingNumber) {
    var requestId = new URLSearchParams(window.location.search).get('request_id') || '';
    var valid = /^REQ-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(requestId);
    bookingNumber.textContent = valid ? requestId : 'Номер появится здесь после отправки формы брони.';
  }
})();
