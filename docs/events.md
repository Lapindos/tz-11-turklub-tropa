# События сайта «Тропа»

Единственный вызов `gtag('event', …)` — `js/analytics.js`, строка 64, функция `track`.
Остальной код передаёт имя и параметры в `Tropa.track` или через атрибут `data-event`.
Имя, телефон и почта в параметры не попадают.

Режим отладки в коде выключен. Как включить его на время проверки в DebugView — в `docs/podklyuchenie.md`.

| Событие | Где задаётся | Параметры и пример |
|---|---|---|
| `page_view` | расширенная статистика GA4, без своего кода | `page_location`, `page_title` |
| `scroll` | расширенная статистика, прокрутка до 90 % | `percent_scrolled = 90` |
| `click` | расширенная статистика, внешняя ссылка | `link_url`, `outbound = true` |
| `file_download` | расширенная статистика, ссылка на `/files/checklist.pdf` | `file_name = checklist.pdf` |
| `form_start` | расширенная статистика, первое поле формы `#booking-form` | `form_id` |
| `form_submit` | расширенная статистика, отправка формы | `form_id` |
| `generate_lead` | `js/form.js`, строка 240, только после `{"ok": true}` | `lead_trip_id = snowshoes`, `participants = 2`, `lead_source = booking_form` |
| `cta_click` | атрибут `data-event` на кнопках брони и героя | `button_name = hero_routes`, `page_section = hero` |
| `trip_filter` | `js/site.js`, строка 107, смена фильтра | `difficulty = easy`, `duration_days = 1` или `all` |
| `trip_view` | `data-event` на «Подробнее» и «Карточка маршрута» | `trip_id = icefalls`, `difficulty = easy` |
| `date_select` | `data-event` на дате в календаре и в списке дат | `trip_id = sunrise`, `trip_date = 2026-12-13`, `seats_left = 0` |
| `guide_view` | `data-event` на карточке инструктора | `guide_id = guide_easy` |
| `rental_calc` | `js/site.js`, строка 327 | `items_count = 2`, `days = 2`, `rental_price = 1300` |
| `checklist_check` | `data-event` на пункте чек-листа | `item_id = mat` |
| `contact_click` | телефон и почта в шапке, подвале и на странице брони | `contact_type = phone` или `email` |
| `messenger_click` | Telegram и WhatsApp на странице брони | `messenger = telegram` |
| `social_click` | иконки в подвале и на `thanks.html` | `network = instagram`, `page_section = footer` |
| `form_error` | `js/form.js`, строки 100, 207, 235, 248 | `field_name = phone`, `error_type = format` |
| `promo_copy` | кнопка «Скопировать» на `gear.html`, по выбору | `promo_code = SNOW300` |
| `map_open` | ссылка на Яндекс Карты, по выбору | `map_service = yandex` |

Коды сложности в параметре `difficulty`: `easy` — легко, `medium` — средне, `hard` — сложно.

Ключевые события ресурса, и только они: `generate_lead`, `contact_click`, `messenger_click`.
