# Как подключить GA4 и таблицу

Сайт уже отправляет события и заявку так, как это разобрано в темах 4–7. Тег ресурса «ТРОПА — сайт» стоит на всех страницах, идентификатор `G-3R2JCQ7P84`. Адрес приёмника заявок в `js/config.js` по-прежнему пустой: пока он пустой, заявка не записывается и `generate_lead` не отправляется.

## 1. Ресурс GA4

1. Google Analytics → Администратор → Создать ресурс.
2. Название: `ТРОПА — сайт`.
3. Часовой пояс: `(GMT+03:00) Москва`. Валюта: российский рубль.
4. Веб-поток. Адрес сайта: `https://tz-11-turklub-tropa.vercel.app`.
5. В потоке включить расширенную статистику, в том числе взаимодействия с формами. Так без своего кода приходят `page_view`, `scroll`, `click`, `file_download`, `form_start`, `form_submit`.
6. Идентификатор этого ресурса — `G-3R2JCQ7P84`. Он уже стоит в `<head>` всех девяти страниц, включая `404.html`.
7. После публикации сайта в Аналитике нажмите повторную проверку тега. В исходном коде страницы должен быть `G-3R2JCQ7P84`.

Ключевыми отметить только три события: `generate_lead`, `contact_click`, `messenger_click`. Других ключевых в ресурсе быть не должно. Отметка ставится в Администратор → События → звезда, после того как событие хотя бы раз пришло.

## 2. Пользовательские параметры

Администратор → Отображение данных → Пользовательские определения → параметры события (область «Событие»):

| Параметр | Событие |
|---|---|
| `button_name` | `cta_click` |
| `page_section` | `cta_click`, `social_click` |
| `difficulty` | `trip_filter`, `trip_view` |
| `trip_id` | `trip_view`, `date_select` |
| `seats_left` | `date_select` |
| `lead_trip_id` | `generate_lead` |
| `messenger` | `messenger_click` |

Имеет смысл зарегистрировать и остальные параметры из `docs/events.md`: `participants`, `lead_source`, `duration_days`, `guide_id`, `items_count`, `days`, `rental_price`, `item_id`, `promo_code`, `map_service`, `contact_type`, `field_name`, `error_type`, `network`. Без регистрации они видны в DebugView, но не попадают в отчёты.

## 3. Проверка в DebugView

На время проверки в конфиге тега на одной странице можно добавить отладку и потом убрать:

```javascript
gtag('config', 'G-ВАШ_ID', { debug_mode: true });
```

Перед сдачей строка `debug_mode` в коде не остаётся. Другой путь — расширение Google Analytics Debugger.

Каждое событие из `docs/events.md` открыть на сайте и сохранить кадр DebugView с раскрытыми параметрами в `screens/ga4/` под именем события: `generate_lead.png`, `trip_filter.png` и так далее.

## 4. Таблица заявок

1. Создать Google Таблицу `Tropa — Bookings`.
2. Лист переименовать в `leads`.
3. Первая строка, слева направо:

```text
request_id  created_at  name  phone  email  trip_id  trip_date  participants  utm_source  utm_medium  utm_campaign  utm_content  status
```

4. Закрепить первую строку. Правила списка, подсветки и доступ — в `apps-script/SHEET.md`.
5. Расширения → Apps Script. Вставить `apps-script/Code.gs`. В `SPREADSHEET_ID` поставить кусок адреса таблицы между `/d/` и `/edit`. Часовой пояс проекта: Москва.
6. Развернуть → Новое развёртывание → Тип: веб-приложение. Запускать от вашего имени. У кого есть доступ: «Все».
7. Скопировать URL, он заканчивается на `/exec`, и вставить его в `js/config.js`:

```javascript
window.TROPA_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/……/exec'
};
```

8. Запушить сайт. Открыть страницу с метками, например ссылку U-01 из `docs/utm.csv`, отправить заявку с именем «Тест U-01». В таблице должны совпасть метки, `status` будет `new`, время проставит приёмник. Повтор той же заявки вторую строку не создаёт.

Пока URL не вставлен, форма показывает текст «Приёмник заявок ещё не подключён» и шлёт `form_error` с `error_type = server`. `generate_lead` в этот момент не уходит.

## 5. Что сделать в соцсетях и DataLens

Тексты ManyChat и две ветки — `docs/manychat.md`.
Дашборд и формулы DataLens — `docs/datalens.md`.
Когда в GA4 накопятся проверки, числа переносятся в `docs/report.md`. Свои проценты до этого туда не подставляются.
