// Сведения о клубе, которые разрешено публиковать: раздел 2 ТЗ-11/2026.
// Цены, маршруты и правила аренды взяты оттуда, без добавленных услуг.
window.TROPA_DATA = {
  trips: [
    {
      id: 'icefalls',
      name: 'Ледяные водопады',
      days: 1,
      durationLabel: '1 день',
      difficulty: 'easy',
      difficultyLabel: 'легко',
      price: 3500,
      image: '/img/trip-icefalls.jpg',
      alt: 'Зимняя тропа к ледяным водопадам',
      lead: 'Идёшь один день к замёрзшим водопадам. Сложность — легко.',
      see: 'Замёрзшие водопады.'
    },
    {
      id: 'snowshoes',
      name: 'Снегоступы для начинающих',
      days: 1,
      durationLabel: '1 день',
      difficulty: 'easy',
      difficultyLabel: 'легко',
      price: 2900,
      image: '/img/trip-snowshoes.jpg',
      alt: 'Снежная тропа для первого выхода на снегоступах',
      lead: 'Первый выход на снегоступах, если раньше на них не стоял. Сложность — легко.',
      see: 'Зимний лес на снегоступах.'
    },
    {
      id: 'sunrise',
      name: 'Рассвет на Седой горе',
      days: 1,
      durationLabel: '1 день',
      difficulty: 'medium',
      difficultyLabel: 'средне',
      price: 3900,
      image: '/img/trip-sunrise.jpg',
      alt: 'Рассвет над снежным склоном Седой горы',
      lead: 'Выход на Седую гору к рассвету. Сложность — средне.',
      see: 'Рассвет на Седой горе.'
    },
    {
      id: 'plateau',
      name: 'Снежное плато',
      days: 2,
      durationLabel: '2 дня',
      difficulty: 'medium',
      difficultyLabel: 'средне',
      price: 7900,
      image: '/img/trip-plateau.jpg',
      alt: 'Снежное плато и след тропы',
      lead: 'Два дня на снежном плато с ночёвкой. Сложность — средне.',
      see: 'Снежное плато.'
    },
    {
      id: 'traverse',
      name: 'Лыжный траверс',
      days: 3,
      durationLabel: '3 дня',
      difficulty: 'hard',
      difficultyLabel: 'сложно',
      price: 11500,
      image: '/img/trip-traverse.jpg',
      alt: 'Лыжный след через зимний перевал',
      lead: 'Три дня перехода на лыжах. Сложность — сложно.',
      see: 'Зимний траверс на лыжах.'
    },
    {
      id: 'newyear_hut',
      name: 'Новогодняя изба',
      days: 3,
      durationLabel: '31.12–02.01',
      difficulty: 'easy',
      difficultyLabel: 'легко',
      price: 15900,
      image: '/img/trip-newyear.jpg',
      alt: 'Зимняя изба в снегу',
      lead: 'Встречаешь новый год в избе. Сложность — легко.',
      see: 'Новогодняя изба.'
    }
  ],
  departures: [
    { tripId: 'snowshoes', date: '2026-12-06', seats: 8 },
    { tripId: 'icefalls', date: '2026-12-13', seats: 4 },
    { tripId: 'sunrise', date: '2026-12-13', seats: 0 },
    { tripId: 'plateau', date: '2026-12-19', seats: 6 },
    { tripId: 'snowshoes', date: '2026-12-20', seats: 11 },
    { tripId: 'sunrise', date: '2026-12-27', seats: 9 },
    { tripId: 'newyear_hut', date: '2026-12-31', seats: 5 },
    { tripId: 'icefalls', date: '2027-01-10', seats: 7 },
    { tripId: 'snowshoes', date: '2027-01-11', seats: 12 },
    { tripId: 'traverse', date: '2027-01-15', seats: 4 },
    { tripId: 'sunrise', date: '2027-01-17', seats: 3 },
    { tripId: 'plateau', date: '2027-01-23', seats: 0 },
    { tripId: 'traverse', date: '2027-01-29', seats: 6 },
    { tripId: 'plateau', date: '2027-01-30', seats: 8 }
  ],
  guides: [
    {
      id: 'guide_lead',
      title: 'Старший инструктор группы',
      text: 'Ведёт «Снежное плато» и «Лыжный траверс». В группе два инструктора, не больше 16 участников.'
    },
    {
      id: 'guide_easy',
      title: 'Инструктор лёгких маршрутов',
      text: 'Ведёт «Снегоступы для начинающих», «Ледяные водопады» и «Новогоднюю избу». С 12 лет на маршруты «легко» можно идти вместе с родителем.'
    },
    {
      id: 'guide_day',
      title: 'Инструктор однодневных выходов',
      text: 'Ведёт «Рассвет на Седой горе». Сложность этого маршрута — средне. Сбор группы — у железнодорожного вокзала, дальше трансфер.'
    }
  ],
  gear: [
    { id: 'sleeping_bag', name: 'Спальник −20 °C', price: 500 },
    { id: 'tent', name: 'Палатка (на двоих)', price: 700 },
    { id: 'snowshoes_rent', name: 'Снегоступы', price: 400 },
    { id: 'mat', name: 'Коврик', price: 150 },
    { id: 'burner', name: 'Горелка', price: 200 },
    { id: 'poles', name: 'Треккинговые палки', price: 150 }
  ],
  checklist: [
    { id: 'sleeping_bag', name: 'Спальник −20 °C', hint: 'можно взять в аренду' },
    { id: 'mat', name: 'Коврик', hint: 'можно взять в аренду' },
    { id: 'snowshoes_rent', name: 'Снегоступы', hint: 'можно взять в аренду' },
    { id: 'poles', name: 'Треккинговые палки', hint: 'можно взять в аренду' },
    { id: 'burner', name: 'Горелка', hint: 'можно взять в аренду' },
    { id: 'tent', name: 'Палатка на двоих', hint: 'можно взять в аренду' },
    { id: 'jacket', name: 'Тёплая куртка', hint: 'своё' },
    { id: 'thermo', name: 'Термобельё', hint: 'своё' },
    { id: 'hat_gloves', name: 'Шапка и перчатки', hint: 'своё' },
    { id: 'thermos', name: 'Термос', hint: 'своё' },
    { id: 'lamp', name: 'Налобный фонарь', hint: 'своё' },
    { id: 'docs', name: 'Документ, удостоверяющий личность', hint: 'своё' }
  ]
};
