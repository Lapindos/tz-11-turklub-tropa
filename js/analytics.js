// Все вызовы gtag('event') собраны в этом файле.
// Кнопки и ссылки описываются в разметке атрибутом data-event.
// Имя, телефон и почта посетителя сюда не передаются.
(function () {
  'use strict';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var UTM_DEFAULTS = {
    utm_source: 'direct',
    utm_medium: 'none',
    utm_campaign: 'not_set',
    utm_content: 'not_set'
  };

  function captureUtm() {
    var query = new URLSearchParams(window.location.search);
    var found = {};
    var any = false;
    UTM_KEYS.forEach(function (key) {
      var value = (query.get(key) || '').trim();
      if (!value) return;
      found[key] = value.slice(0, 100);
      any = true;
    });
    if (!any) return;
    try {
      sessionStorage.setItem('tropa_utm', JSON.stringify(found));
    } catch (error) {
      // В приватном режиме хранилище может быть закрыто. Метки остаются в адресе.
    }
  }

  function getUtm() {
    captureUtm();
    var saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem('tropa_utm') || '{}') || {};
    } catch (error) {
      saved = {};
    }
    var result = {};
    UTM_KEYS.forEach(function (key) {
      result[key] = saved[key] || UTM_DEFAULTS[key];
    });
    return result;
  }

  function clip(value) {
    return String(value == null ? '' : value).slice(0, 100);
  }

  // Единственная точка отправки события. form.js и site.js вызывают её, а не gtag.
  function track(name, params) {
    var payload = {};
    if (params) {
      Object.keys(params).forEach(function (key) {
        var value = params[key];
        if (value == null || value === '') return;
        var safeKey = String(key).slice(0, 40);
        payload[safeKey] = typeof value === 'number' ? value : clip(value);
      });
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }
  }

  function paramsFromElement(element) {
    var params = {};
    Array.prototype.forEach.call(element.attributes, function (attr) {
      if (attr.name.indexOf('data-') !== 0 || attr.name === 'data-event') return;
      params[attr.name.slice(5).replace(/-/g, '_')] = attr.value;
    });
    return params;
  }

  function sendFromElement(element) {
    var name = element.getAttribute('data-event');
    if (!name) return;
    track(name, paramsFromElement(element));
  }

  captureUtm();

  // Клик по кнопке и ссылке. Поля формы обрабатывает событие change, чтобы не было дубля.
  document.addEventListener('click', function (event) {
    var element = event.target.closest('[data-event]');
    if (!element || element.matches('input, select, textarea')) return;
    sendFromElement(element);
  });

  document.addEventListener('change', function (event) {
    var element = event.target.closest('[data-event]');
    if (!element || !element.matches('input, select, textarea')) return;
    sendFromElement(element);
  });

  window.Tropa = {
    track: track,
    getUtm: getUtm
  };
})();
