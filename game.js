/* =============================================================================
 *  PixelGuardian — маленькая 2D-игра на HTML5 Canvas
 *  -----------------------------------------------------------------------------
 *  Структура файла:
 *    1. Константы, палитра и баланс игры
 *    2. Доступ к DOM и контексту холста
 *    3. Утилиты и пиксельные спрайты космических кораблей
 *    4. Космический фон: параллакс-звёзды, планеты, туманности
 *    5. Игровые классы: Player, Bullet, Enemy, EnemyBullet, PowerUp, Boss, Particle
 *    6. Звук (Web Audio API)
 *    7. Состояние игры и пользовательский ввод (клавиатура + мышь + сенсор)
 *    8. Сенсорное управление для телефона (джойстик и кнопки)
 *    9. Логика: уровни, боссы, бонусы, столкновения, стрельба, спавн врагов
 *   10. Интерфейс: экраны меню, паузы, проигрыша и пиксельные кнопки
 *   11. Отрисовка: объекты, HP Bar босса, HUD, объявления
 *   12. Главный игровой цикл и запуск
 * ============================================================================= */


'use strict';

/* =============================== 1. КОНСТАНТЫ ============================== */

// Логический размер игрового поля. CSS может масштабировать холст, но вся
// математика игры считается именно в этих координатах.
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Палитра: все цвета собраны в одном месте, поэтому игру легко перекрасить.
const COLORS = {
  bgTop:      '#070a18',                  // верх фона (глубокий космос)
  bgBottom:   '#02030a',                  // низ фона
  player:     '#3aa0ff',                  // корпус корабля стража
  playerDark: '#10336b',                  // тёмная обводка корабля стража
  playerHi:   '#9fdcff',                  // светлый блик на корпусе стража
  visor:      '#eaf4ff',                  // светлый «кокпит» стража
  bullet:     '#ffe66d',                  // снаряды
  bulletCore: '#fffbe0',                  // яркое ядро снаряда
  enemy:      '#ff4d4d',                  // корпус корабля врага
  enemyDark:  '#5c0f1a',                  // тёмная обводка корабля врага
  enemyHi:    '#ff9c9c',                  // блик на корпусе врага
  enemyPlate: '#ffd9d9',                  // светлые бронеплиты врага
  hud:        '#dfe9ff',                  // текст интерфейса
  crosshair:  'rgba(255, 230, 109, .9)',  // прицел
  panel:      'rgba(4, 7, 16, .86)',      // затемнение на экранах паузы/проигрыша
  accent:     '#7fd4ff',                  // акцентный цвет интерфейса
  flameInner: '#fff3b0',                  // ядро пламени двигателей
  flameOuter: '#ff8c42',                  // внешняя часть пламени
  muzzle:     '#fff6c2',                  // вспышка у дула после выстрела
  enemyGlow:  '#ffe08a',                  // пульсирующий огонь врага

  // --- Боссы и бонусы (Шаг 2) ---
  boss:         '#c94bff',                // корпус босса
  bossDark:     '#330c58',                // обводка босса
  bossHi:       '#e6a8ff',                // блик на броне босса
  bossCore:     '#ffe6ff',                // светящееся ядро босса
  bossGun:      '#8f5bd6',                // бортовые пушки босса
  bossBullet:   '#ff7ad9',                // снаряды босса
  hpBarFill:    '#ff4d4d',                // заливка полоски здоровья
  hpBarEmpty:   '#3a0f22',                // пустая часть полоски
  medkit:       '#4dff88',                // аптечка (восстановление жизни)
  weapon:       '#ffd166',                // усиление выстрела
  weaponAccent: '#ff8c42',                // «шевроны» на иконке усиления
  powerupDark:  '#08160f',                // обводка иконок бонусов
  carrier:      '#ff9f1c',                // редкий враг-носитель бонуса
  carrierDark:  '#5c2c00',                // его обводка
  carrierHi:    '#ffe6c2',                // светлые плиты носителя
  emptySlot:    'rgba(27, 95, 191, .30)', // пустая ячейка жизни в HUD
  emptySlotIn:  'rgba(58, 160, 255, .16)',

  // --- Космический фон (параллакс) ---
  spaceTop:   '#060a1a',                  // верх градиента космоса
  spaceMid:   '#0b1030',                  // середина градиента
  spaceLow:   '#050711',                  // низ градиента
  nebulaA:    'rgba(96, 58, 200, .34)',   // фиолетовая туманность
  nebulaB:    'rgba(24, 104, 196, .30)',  // синяя туманность
  nebulaC:    'rgba(196, 52, 138, .20)',  // розовая туманность
  starWhite:  '#ffffff',                  // дальние звёзды
  starBlue:   '#cfe6ff',                  // синеватые звёзды
  starWarm:   '#ffe9b8',                  // тёплые звёзды
  planetRim:  '#050914',                  // тёмная кромка планеты
  comet:      '#dff0ff',                  // падающая звезда

  // --- Интерфейс (меню и кнопки) ---
  menuPanel:   'rgba(6, 11, 26, .90)',    // фон панели меню
  menuShadow:  'rgba(0, 0, 0, .55)',      // тень под панелью и кнопками
  menuBorder:  '#2f7fd6',                 // рамка кнопки
  menuBorderHi:'#7fd4ff',                 // рамка кнопки под курсором
  menuButton:  '#111c3a',                 // фон кнопки
  menuButtonHi:'#1d3775',                 // фон кнопки под курсором
  menuText:    '#dfe9ff',                 // текст кнопки
  menuTextHi:  '#ffffff',                 // текст кнопки под курсором
  menuDim:     'rgba(223, 233, 255, .55)',// пояснения
  menuTitle:   '#7fd4ff',                 // заголовок экрана
  menuGold:    '#ffe66d',                 // акценты (рекорд, подсказки)
  titleTop:    '#eaf6ff',                 // первая половина названия — «Pixel»
  titleShadow: '#04101f',                 // объёмная тень под названием игры
  titleGlow:   'rgba(127, 212, 255, ',    // неоновый ореол названия (дописывается альфа)
  buttonGlow:  'rgba(127, 212, 255, ',    // свечение главной кнопки

  // --- Сенсорное управление (телефон) ---
  stickBase:  'rgba(127, 212, 255, .12)', // основание джойстика
  stickRing:  'rgba(127, 212, 255, .45)', // кольцо джойстика
  stickKnob:  'rgba(215, 240, 255, .78)', // «шайба» джойстика
  fireBase:   'rgba(255, 120, 120, .16)', // кнопка огня
  fireRing:   'rgba(255, 150, 150, .55)', // кольцо кнопки огня
  fireKnob:   'rgba(255, 205, 205, .85)', // центр кнопки огня
};

// Баланс игры. Меняйте эти числа, чтобы сделать игру проще или сложнее.
const PLAYER_SIZE        = 44;    // размер стража в пикселях (спрайт 22x22 × 2)
const PLAYER_SPEED       = 250;   // скорость движения, пикселей в секунду
const PLAYER_LIVES       = 3;     // сколько попаданий держит страж
const PLAYER_INVULN_TIME = 1.2;   // секунд неуязвимости после попадания
const BULLET_SIZE        = 8;     // размер снаряда
const BULLET_SPEED       = 500;   // скорость снаряда, пикселей в секунду
const FIRE_COOLDOWN      = 0.16;  // пауза между выстрелами при удержании огня
const ENEMY_SIZE         = 40;    // размер врага (спрайт 20x20 × 2)
const ENEMY_BASE_SPEED   = 70;    // стартовая скорость падения врага
const ENEMY_SPEED_GROWTH = 2.4;   // прибавка к скорости врага за каждую секунду игры
const ENEMY_SPAWN_START  = 0.95;  // пауза между спавнами в начале, секунд
const ENEMY_SPAWN_MIN    = 0.32;  // минимальная пауза между спавнами
const SPAWN_RAMP         = 0.022; // как быстро растёт частота спавна
const SCORE_PER_KILL     = 10;    // очки за уничтоженного врага
const EXPLOSION_PARTS    = 10;    // количество частиц во взрыве
const MUZZLE_TIME        = 0.06;  // сколько секунд держится вспышка у дула
const MASTER_VOLUME      = 0.5;   // общая громкость звука (0..1)

/* ------------------- Уровни, боссы и бонусы (Шаг 2) ---------------------- */
const MAX_LIVES           = 5;     // предел жизней: аптечка выше не поднимает
const KILLS_PER_LEVEL     = 15;    // сколько врагов сбить, чтобы прилетел босс
const BOSS_WIDTH          = 168;   // ширина корабля босса (спрайт 42x30 × 4)
const BOSS_BASE_HP        = 40;    // здоровье босса на первом уровне
const BOSS_HP_GROWTH      = 14;    // прибавка здоровья на каждом новом уровне
const BOSS_ENTER_Y        = 112;   // высота, на которую босс «въезжает» сверху
const BOSS_BASE_SPEED     = 74;    // скорость дрейфа босса вбок
const BOSS_FIRE_BASE      = 1.7;   // пауза между атаками на первом уровне, секунд
const BOSS_FIRE_STEP      = 0.16;  // насколько пауза короче на каждом уровне
const BOSS_FIRE_MIN       = 0.7;   // чаще этого босс не стреляет
const BOSS_SCORE          = 300;   // очки за босса (умножаются на номер уровня)
const BOSS_WARN_TIME      = 1.8;   // сколько длится «WARNING!» до вылета босса
const ENEMY_BULLET_SIZE   = 10;    // размер снаряда босса
const ENEMY_BULLET_SPEED  = 210;   // скорость снаряда босса
const POWERUP_SIZE        = 30;    // размер иконки бонуса (спрайт 15x15 × 2)
const POWERUP_SPEED       = 70;    // скорость падения бонуса
const POWERUP_DROP_CHANCE = 0.08;  // шанс бонуса с обычного врага
const RARE_ENEMY_CHANCE   = 0.12;  // доля редких врагов-носителей бонусов
const RARE_ENEMY_HP       = 2;     // редкий враг держит два попадания
const RARE_SCORE_MUL      = 3;     // очки за редкого врага
const WEAPON_TIME         = 12;    // сколько секунд действует усиление выстрела
const WEAPON_COOLDOWN_MUL = 0.6;   // во столько раз быстрее перезарядка при усилении
const WEAPON_SPREAD       = 0.14;  // угол боковых снарядов, радиан
const ANNOUNCE_TIME       = 2.2;   // сколько секунд висит объявление по центру

/* ------------------------- Космос, меню и телефон ------------------------ */
const BEST_SCORE_KEY      = 'pixelguardian.best';  // ключ рекорда в localStorage
const MENU_BUTTON_WIDTH   = 330;   // ширина кнопки меню
const MENU_BUTTON_HEIGHT  = 52;    // высота кнопки меню
const STICK_RADIUS        = 62;    // радиус виртуального джойстика, пикселей
const STICK_DEAD_ZONE     = 0.16;  // мёртвая зона джойстика (доля от радиуса)
const FIRE_BUTTON_R       = 56;    // радиус экранной кнопки огня
const PAUSE_BUTTON_R      = 22;    // радиус экранной кнопки паузы

// Слои звёзд для параллакса: дальние едва ползут, ближние летят быстро.
const STAR_LAYERS = [
  { count: 130, speed:  10, drift: 0,   size: 1, alpha: 0.5, color: COLORS.starBlue },
  { count:  70, speed:  34, drift: 3,   size: 2, alpha: 0.7, color: COLORS.starWhite },
  { count:  34, speed:  78, drift: 9,   size: 3, alpha: 0.9, color: COLORS.starWarm },
];

// Клавиши, для которых отключаем стандартное поведение браузера
// (иначе стрелки и пробел будут прокручивать страницу).
const PREVENT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

/* ========================= 2. DOM И КОНТЕКСТ ХОЛСТА ======================== */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Синхронизируем буфер холста с логическим размером поля.
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
ctx.imageSmoothingEnabled = false; // без сглаживания — картинка остаётся «пиксельной»

/* ====================== 3. УТИЛИТЫ И ПИКСЕЛЬНЫЕ СПРАЙТЫ =================== */

/** Ограничивает число диапазоном [min, max]. */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Случайное дробное число в диапазоне [min, max). */
const rand = (min, max) => min + Math.random() * (max - min);

/** Случайное целое число в диапазоне [min, max]. */
const randInt = (min, max) => Math.floor(rand(min, max + 1));

/**
 * Проверка столкновения двух прямоугольников (AABB).
 * Принимает любые объекты с полями x, y, w, h.
 */
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Рисует «пиксельный» квадрат: тёмная обводка + светлая внутренняя часть.
 * Используется для элементов HUD (например, значков оставшихся жизней).
 */
function drawPixelBox(x, y, w, h, darkColor, lightColor, border = 3) {
  ctx.fillStyle = darkColor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = lightColor;
  ctx.fillRect(x + border, y + border, w - border * 2, h - border * 2);
}

/* ------------------ Пиксельные спрайты космических кораблей ---------------- */
/*
 * Спрайт — это массив строк, где один символ = один «пиксель» рисунка.
 * Буквы берутся из палитры спрайта, а точка означает прозрачный пиксель.
 * Формат удобно править: сам корабль виден прямо в коде.
 */

/** Корабль стража: 22x22 «пикселя», нос смотрит вверх. */
const SPRITES = {
  player: [
    '..........dd..........',
    '..........bb..........',
    '.........dbbd.........',
    '.........dccd.........',
    '.........dccd.........',
    '........dbccbd........',
    '........dbccbd........',
    '.......dbbccbbd.......',
    '.......dbbccbbd.......',
    '......dbhbccbhbd......',
    '.....dbbhbccbhbbd.....',
    '....dbbhbbccbbhbbd....',
    '...dbbhbbbddbbbhbbd...',
    '..dbbbhbbbddbbbhbbbd..',
    '.dbbhhbbbbbbbbbbhhbbd.',
    'dbbhbbbbbbbbbbbbbbhbbd',
    'dbbhbbbbbbbbbbbbbbhbbd',
    'dbbdbbhbbbbbbbbhbbdbbd',
    'dbbdbbhbbbbbbbbhbbdbbd',
    '.ddbbbbbbddddbbbbbbdd.',
    '..dbboobbd..dbboobbd..',
    '...dooood....dooood...',
  ],

  /** Корабль врага: 20x20 «пикселей», нос смотрит вниз — прямо на стража. */
  enemy: [
    '.dd..............dd.',
    '.dbd............dbd.',
    '.dbbd..........dbbd.',
    '.dbbbd........dbbbd.',
    '.dbhbbd......dbbhbd.',
    '.dbhbbbd....dbbbhbd.',
    '..dbhbbbd..dbbbhbd..',
    '...dbhbbbddbbbhbd...',
    'ddbbhhbbbbbbbbhhbbdd',
    'dbbhccbbbbbbbbcchbbd',
    'dbbhccbbbbbbbbcchbbd',
    'dbbhcccbbbbbbccchbbd',
    'dbbhhbbbbbbbbbbhhbbd',
    '..dbbhbbbbbbbbhbbd..',
    '...dbbbbbbbbbbbbd...',
    '...dbbbbbbbbbbbbd...',
    '....dbbbbbbbbbbd....',
    '.....dbeeeeeebd.....',
    '......dbeeeebd......',
    '.......deeeed.......',
  ],

  /** Корабль босса: 42x30 «пикселей» — тяжёлый дредноут с мостиком и ядром. */
  boss: [
    '......dbbbbbbbbbbbbbbbbbbbbbbbbbbbbd......',
    '.....dbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbd.....',
    '....dbbhdbbbbbdbbbbbbbbbbbbdbbbbbdhbbd....',
    '...dbbhhdbbbbbbdbbbbbbbbbbdbbbbbbdhhbbd...',
    '..dbbhhbbbbbbbbbbbbbbbbbbbbbbbbbbbbhhbbd..',
    '.dbbhhbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbhhbbd.',
    'dbbhhbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbhhbbd',
    'dbbhhbbbbbbbbbbdccccccccccdbbbbbbbbbbhhbbd',
    'dbbhhbbbbbbbbbbdccccccccccdbbbbbbbbbbhhbbd',
    'dbbhhbbbbbbbbbbdccccccccccdbbbbbbbbbbhhbbd',
    'dggghhbbbbbbbbbdccccccccccdbbbbbbbbbhhgggd',
    'dggghhbbbbbbbbbdccccccccccdbbbbbbbbbhhgggd',
    'dggghhbbbbbbbbbdccccccccccdbbbbbbbbbhhgggd',
    'dggghbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbhgggd',
    'dggghbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbhgggd',
    'dbbhhbbbbddbbbbddbbbbbbbbddbbbbddbbbbhhbbd',
    '.dbbhhbbbbddbbbddbbbbbbbbddbbbddbbbbhhbbd.',
    '.dbbhhbbbbddbbbddbbbbbbbbddbbbddbbbbhhbbd.',
    '..dbbhbbbbbbbbbbeeeeeeeeeebbbbbbbbbbhbbd..',
    '..dbbhbbbbbbbbbbeeeeeeeeeebbbbbbbbbbhbbd..',
    '...dbbhbbbbbbbbbeeeeeeeeeebbbbbbbbbhbbd...',
    '...dbhbbbbbbbbbbeeeeeeeeeebbbbbbbbbbhbd...',
    '....dbhbbbbbbbbbeeeeeeeeeebbbbbbbbbhbd....',
    '.....dbbhbbbbbbddddddddddddbbbbbbhbbd.....',
    '......dbbhbbbbbbbbbbbbbbbbbbbbbbhbbd......',
    '.......dbbhbbbbbbbbbbbbbbbbbbbbhbbd.......',
    '.........dbhhbbbbbbbbbbbbbbbbhhbd.........',
    '...........dbhbbbbbbbbbbbbbbhbd...........',
    '.............dbhbbbbbbbbbbhbd.............',
    '...............dbbbbbbbbbbd...............',
  ],

  /** Редкий враг-носитель бонусов: 20x20 «пикселей», Х-образные крылья. */
  carrier: [
    'dd................dd',
    'dbd..............dbd',
    'dbbd............dbbd',
    'dbbbd..........dbbbd',
    '.dbbbd........dbbbd.',
    '.dbbbbd......dbbbbd.',
    '..dbbbdd....ddbbbd..',
    '..dbbccccccccccbbd..',
    '.dbbccccbccbccccbbd.',
    'dbbcccccbccbcccccbbd',
    'dbbcccccbccbcccccbbd',
    '.dbbccccbccbccccbbd.',
    '..dbbccccccccccbbd..',
    '...dbbbd....dbbbd...',
    '...dbbbd....dbbbd...',
    '..ddbbbbd..dbbbbdd..',
    '..dbbbbbd..dbbbbbd..',
    '...dbbbbd..dbbbbd...',
    '....dbd......dbd....',
    '....dod......dod....',
  ],

  /** Аптечка: 15x15 «пикселей» — зелёная коробка с белым крестом. */
  medkit: [
    '..ddddddddddd..',
    '.dgggggggggggd.',
    'dgggggggggggggd',
    'dgggggggggggggd',
    'dgggggwwwgggggd',
    'dgggggwwwgggggd',
    'dggwwwwwwwwwggd',
    'dggwwwwwwwwwggd',
    'dgggggwwwgggggd',
    'dgggggwwwgggggd',
    'dgggggggggggggd',
    'dgggggggggggggd',
    'dgggggggggggggd',
    '.dgggggggggggd.',
    '..ddddddddddd..',
  ],

  /** Усиление выстрела: 15x15 «пикселей» — жёлтая коробка с двойной стрелкой. */
  weapon: [
    '..ddddddddddd..',
    '.dwwwwwwwwwwwd.',
    'dwwwwwwowwwwwwd',
    'dwwwwwooowwwwwd',
    'dwwwwooooowwwwd',
    'dwwwooooooowwwd',
    'dwwwwwwwwwwwwwd',
    'dwwwwwwowwwwwwd',
    'dwwwwwooowwwwwd',
    'dwwwwooooowwwwd',
    'dwwwooooooowwwd',
    'dwwwwwwwwwwwwwd',
    'dwwwwwwwwwwwwwd',
    '.dwwwwwwwwwwwd.',
    '..ddddddddddd..',
  ],
};

/** Палитры спрайтов: буква -> цвет (цвета берём из общей палитры игры). */
const PALETTES = {
  player:       { d: COLORS.playerDark, b: COLORS.player, c: COLORS.visor, h: COLORS.playerHi,
                  o: COLORS.flameOuter },
  playerFlash:  { d: '#ffffff', b: '#ffffff', c: '#ffffff', h: '#ffffff', o: '#ffffff' },
  enemy:        { d: COLORS.enemyDark, b: COLORS.enemy, c: COLORS.enemyPlate, h: COLORS.enemyHi,
                  e: COLORS.enemyGlow },
  enemyFlash:   { d: '#ffffff', b: '#ffffff', c: '#ffffff', h: '#ffffff', e: '#ffffff' },
  carrier:      { d: COLORS.carrierDark, b: COLORS.carrier, c: COLORS.carrierHi,
                  o: COLORS.flameOuter },
  carrierFlash: { d: '#ffffff', b: '#ffffff', c: '#ffffff', o: '#ffffff' },
  boss:         { d: COLORS.bossDark, b: COLORS.boss, c: COLORS.bossHi, h: COLORS.bossHi,
                  e: COLORS.bossCore, g: COLORS.bossGun },
  bossFlash:    { d: '#ffffff', b: '#ffffff', c: '#ffffff', h: '#ffffff', e: '#ffffff',
                  g: '#ffffff' },
  medkit:       { d: COLORS.powerupDark, g: COLORS.medkit, w: '#ffffff' },
  weapon:       { d: COLORS.powerupDark, w: COLORS.weapon, o: COLORS.weaponAccent },
};

// Размер одного «пикселя» спрайта на экране. Считаем его от размера хитбокса,
// поэтому нарисованный корабль точно совпадает со зоной столкновения.
const PLAYER_PIXEL  = PLAYER_SIZE / SPRITES.player.length;    // 44 / 22 = 2
const ENEMY_PIXEL   = ENEMY_SIZE / SPRITES.enemy.length;      // 40 / 20 = 2
const CARRIER_PIXEL = ENEMY_SIZE / SPRITES.carrier.length;    // 40 / 20 = 2
const POWERUP_PIXEL = POWERUP_SIZE / SPRITES.medkit.length;   // 30 / 15 = 2
const BOSS_PIXEL    = BOSS_WIDTH / SPRITES.boss[0].length;    // 168 / 42 = 4
const BOSS_HEIGHT   = SPRITES.boss.length * BOSS_PIXEL;       // 30 * 4 = 120

// Колонки сопел двигателей стража (в «пикселях» спрайта) — из них бьёт пламя.
const PLAYER_NOZZLES = [5, 15];

/** Кеш «запечённых» спрайтов: ключ -> offscreen-холст (или null, если не вышло). */
const spriteCache = new Map();

/**
 * Запасной способ отрисовки: рисуем спрайт по одному «пикселю».
 * Нужен на случай, если браузер не выдал offscreen-холст.
 */
function drawSpritePixels(sprite, x, y, pixel, palette) {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row];
    for (let col = 0; col < line.length; col++) {
      const color = palette[line[col]];
      if (!color) continue; // точка (или неизвестная буква) => прозрачный пиксель
      ctx.fillStyle = color;
      ctx.fillRect(x + col * pixel, y + row * pixel, pixel, pixel);
    }
  }
}

/**
 * Один раз «запекает» спрайт в offscreen-холст и запоминает его.
 * Благодаря этому каждый кадр вместо ~200 маленьких fillRect на корабль
 * выполняется один drawImage — важно, когда на экране десятки врагов.
 */
function getSpriteImage(key, sprite, pixel, palette) {
  if (spriteCache.has(key)) return spriteCache.get(key);

  const offscreen = document.createElement('canvas');
  offscreen.width = sprite[0].length * pixel;
  offscreen.height = sprite.length * pixel;

  const offCtx = offscreen.getContext('2d');
  let image = null;

  if (offCtx) {
    offCtx.imageSmoothingEnabled = false; // никакого размытия — только чёткие пиксели
    for (let row = 0; row < sprite.length; row++) {
      const line = sprite[row];
      for (let col = 0; col < line.length; col++) {
        const color = palette[line[col]];
        if (!color) continue;
        offCtx.fillStyle = color;
        offCtx.fillRect(col * pixel, row * pixel, pixel, pixel);
      }
    }
    image = offscreen;
  }

  spriteCache.set(key, image);
  return image;
}

/** Отрисовка спрайта: сначала кеш, а если его нет — рисуем по пикселям. */
function drawSprite(key, sprite, pixel, palette, x, y) {
  const image = getSpriteImage(key, sprite, pixel, palette);
  const sx = Math.round(x);  // округление до целых — «пиксельный» вид без размытия
  const sy = Math.round(y);

  if (image) {
    ctx.drawImage(image, sx, sy);
    return;
  }
  drawSpritePixels(sprite, sx, sy, pixel, palette);
}

/* ==================== 4. КОСМИЧЕСКИЙ ФОН (ПАРАЛЛАКС) ===================== */

/**
 * Достаёт из цвета прежний цвет с другой прозрачностью.
 * Нужно, чтобы затухание туманностей задавалось одной строкой-палитрой.
 */
function colorWithAlpha(color, alpha) {
  return color.replace(/rgba?\(([^)]+)\)/, (match, body) => {
    const parts = body.split(',');
    return 'rgba(' + parts[0].trim() + ', ' + parts[1].trim() + ', ' + parts[2].trim() + ', ' + alpha + ')';
  });
}

// Цвета планет: от тёмного (ночная сторона) к светлому (дневная сторона).
const PLANET_PALETTES = [
  ['#1a1038', '#3b2470', '#6b45ad', '#b48fe0'],   // фиолетовая
  ['#08202f', '#114a6e', '#2c86b8', '#8ed3ee'],   // голубая
  ['#2b1410', '#5e2b1c', '#a85432', '#e39b6a'],   // марсианская
  ['#0a2620', '#14513f', '#2b8b68', '#96e0bf'],   // изумрудная
  ['#2b2711', '#575018', '#9c8c2f', '#e6d68c'],   // песочная
];

/**
 * Пиксельная планета: рисуется один раз в собственный холст, а в игре просто
 * «приклеивается» на фон. Свет считается по нормали к сфере, поэтому у планеты
 * есть освещённая и ночная сторона, тёмная кромка и кратеры/полосы.
 *
 * @param {number} radius радиус планеты в пикселях
 * @param {string[]} palette четыре оттенка: тень, полутень, свет, блик
 * @param {boolean} ringed добавить кольцо (газовый гигант)
 * @param {'rocky'|'gas'} style кратеры или полосы
 * @returns {HTMLCanvasElement|null}
 */
function bakePlanet(radius, palette, ringed, style) {
  const px = 3;                                                  // «пиксель» планеты
  const span = Math.ceil((radius * (ringed ? 3.6 : 2)) / px) * px;
  const holder = document.createElement('canvas');
  holder.width = span;
  holder.height = span;

  const paint = holder.getContext('2d');
  if (!paint) return null;
  paint.imageSmoothingEnabled = false;

  const center = span / 2;
  const lightX = -0.5, lightY = -0.55, lightZ = 0.67;            // свет слева-сверху

  // Кратеры каменных планет: несколько случайных пятен, чуть темнее фона.
  const craters = [];
  if (style === 'rocky') {
    for (let i = 0; i < 7; i++) {
      const angle = rand(0, Math.PI * 2);
      const distance = rand(0.2, 0.75) * radius;
      craters.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        r: rand(0.09, 0.2) * radius,
      });
    }
  }

  // Кольцо рисуем в два прохода: сначала задняя половина (за планетой),
  // потом передняя — так кольцо правильно обнимает шар.
  const drawRing = (front) => {
    if (!ringed) return;
    paint.globalAlpha = 0.8;
    for (let y = 0; y < span; y += px) {
      const ey = (y + px / 2 - center) / (radius * 0.42);
      if (front ? ey < 0 : ey >= 0) continue;
      for (let x = 0; x < span; x += px) {
        const ex = (x + px / 2 - center) / (radius * 1.62);
        const rr = Math.hypot(ex, ey);
        if (rr > 1.02 || rr < 0.63) continue;
        paint.fillStyle = rr < 0.78 ? palette[1] : palette[2];
        paint.fillRect(x, y, px, px);
      }
    }
    paint.globalAlpha = 1;
  };

  drawRing(false);

  for (let y = 0; y < span; y += px) {
    for (let x = 0; x < span; x += px) {
      const dx = (x + px / 2 - center) / radius;
      const dy = (y + px / 2 - center) / radius;
      const distance = Math.hypot(dx, dy);
      if (distance > 1) continue;                                // вне шара — прозрачно

      const nz = Math.sqrt(Math.max(0, 1 - distance * distance));
      let light = dx * lightX + dy * lightY + nz * lightZ;
      if (style === 'gas') light += Math.sin((y / span) * 9 + dx * 1.6) * 0.14;  // полосы
      for (const crater of craters) {
        if (Math.hypot(x + px / 2 - center - crater.x, y + px / 2 - center - crater.y) < crater.r) {
          light -= 0.24;                                         // кратер в тени
        }
      }

      let color;
      if (distance > 0.93) color = COLORS.planetRim;             // тёмная кромка
      else if (light > 0.7) color = palette[3];
      else if (light > 0.32) color = palette[2];
      else if (light > -0.12) color = palette[1];
      else color = palette[0];

      paint.fillStyle = color;
      paint.fillRect(x, y, px, px);
    }
  }

  drawRing(true);
  return holder;
}

/** Запекает набор планет заранее: в бою холсты больше не создаются. */
function bakePlanetPool() {
  const pool = [];
  for (let i = 0; i < PLANET_PALETTES.length; i++) {
    const image = bakePlanet(
      rand(44, 88),
      PLANET_PALETTES[i],
      i % 2 === 1,                        // половина планет — с кольцами
      i % 3 === 0 ? 'gas' : 'rocky'
    );
    if (image) pool.push(image);
  }
  return pool;
}

/** Запекает «плиту» дальнего космоса: градиент плюс мягкие туманности. */
function bakeSpacePlate() {
  const plate = document.createElement('canvas');
  plate.width = CANVAS_WIDTH;
  plate.height = CANVAS_HEIGHT;
  const paint = plate.getContext('2d');
  if (!paint) return null;

  // Глубокий космос: тёмный верх, чуть более светлая середина, чёрный низ.
  const gradient = paint.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, COLORS.spaceTop);
  gradient.addColorStop(0.45, COLORS.spaceMid);
  gradient.addColorStop(1, COLORS.spaceLow);
  paint.fillStyle = gradient;
  paint.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Туманности: цветные пятна, плавно растворяющиеся к краям.
  const clouds = [
    { x: 0.16, y: 0.10, size: 0.62, color: COLORS.nebulaA },
    { x: 0.88, y: 0.26, size: 0.50, color: COLORS.nebulaB },
    { x: 0.58, y: 0.86, size: 0.55, color: COLORS.nebulaC },
    { x: 0.04, y: 0.72, size: 0.42, color: COLORS.nebulaB },
  ];
  for (const cloud of clouds) {
    const cx = CANVAS_WIDTH * cloud.x;
    const cy = CANVAS_HEIGHT * cloud.y;
    const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * cloud.size;
    const glow = paint.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, cloud.color);
    glow.addColorStop(0.5, colorWithAlpha(cloud.color, 0.12));
    glow.addColorStop(1, colorWithAlpha(cloud.color, 0));
    paint.fillStyle = glow;
    paint.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  return plate;
}

/**
 * Живой космический фон.
 *
 * Три слоя звёзд летят с разной скоростью — получается параллакс: дальние
 * едва ползут, ближние проносятся мимо. Планеты медленно проплывают на своей
 * «глубине», редкие кометы добавляют движения. Плита фона (градиент и
 * туманности) запекается один раз, поэтому кадр стоит одного drawImage.
 */
const space = {
  plate: null,     // запечённый дальний фон
  pool: [],        // заготовки планет (холсты)
  stars: [],       // точки звёзд всех слоёв
  planets: [],     // проплывающие планеты
  comets: [],      // падающие звёзды
  time: 0,
  cometTimer: 0,

  /** Полная пересборка фона: вызывается при старте игры. */
  reset() {
    this.time = 0;
    this.cometTimer = rand(4, 10);
    this.stars = [];
    this.comets = [];
    this.planets = [];

    STAR_LAYERS.forEach((layer, index) => {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: rand(0, CANVAS_WIDTH),
          y: rand(0, CANVAS_HEIGHT),
          layer: index,
          phase: rand(0, Math.PI * 2),   // фаза мерцания
        });
      }
    });

    this.plate = bakeSpacePlate();
    this.pool = bakePlanetPool();

    // Планеты распределяем по высоте, чтобы они появлялись не все сразу.
    for (let i = 0; i < 3; i++) this.spawnPlanet(-i * 260 - 80);
  },

  /** Ставит на фон новую планету из заготовок (y — центр планеты). */
  spawnPlanet(y) {
    if (!this.pool.length) return;
    const image = this.pool[randInt(0, this.pool.length - 1)];
    const half = image.width / 2;
    this.planets.push({
      image,
      x: rand(half * 0.4, CANVAS_WIDTH - half * 0.4),
      y,
      speed: rand(3, 11),
      alpha: rand(0.65, 1),
    });
  },

  /** Двигает звёзды, планеты и кометы. */
  update(dt) {
    this.time += dt;

    for (const star of this.stars) {
      const layer = STAR_LAYERS[star.layer];
      star.y += layer.speed * dt;
      star.x += layer.drift * dt;
      if (star.y > CANVAS_HEIGHT) {         // ушла вниз — рождается сверху
        star.y = -1;
        star.x = rand(0, CANVAS_WIDTH);
      }
      if (star.x > CANVAS_WIDTH) star.x -= CANVAS_WIDTH;
    }

    for (const planet of this.planets) {
      planet.y += planet.speed * dt;
      if (planet.y - planet.image.height / 2 > CANVAS_HEIGHT) {
        // Планета ушла за нижний край — подставляем другую из заготовок.
        const image = this.pool.length ? this.pool[randInt(0, this.pool.length - 1)] : planet.image;
        planet.image = image;
        planet.x = rand(image.width * 0.2, CANVAS_WIDTH - image.width * 0.2);
        planet.y = -image.height * 0.6;
        planet.speed = rand(3, 11);
        planet.alpha = rand(0.65, 1);
      }
    }

    for (const comet of this.comets) {
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
      comet.life -= dt;
    }
    this.comets = this.comets.filter((comet) => comet.life > 0);

    this.cometTimer -= dt;
    if (this.cometTimer <= 0) {
      this.comets.push({
        x: rand(CANVAS_WIDTH * 0.35, CANVAS_WIDTH),   // влетает справа сверху
        y: rand(-40, CANVAS_HEIGHT * 0.25),
        vx: -rand(120, 200),
        vy: rand(150, 230),
        life: rand(1.4, 2.4),
        tail: 7,
      });
      this.cometTimer = rand(6, 16);
    }
  },

  /** Рисует весь фон: плита, планеты, звёзды, кометы. */
  draw() {
    if (this.plate) {
      ctx.drawImage(this.plate, 0, 0);
    } else {
      ctx.fillStyle = COLORS.bgTop;       // запасной вариант, если нет холста
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Планеты — на своей «глубине», поэтому движутся медленнее звёзд.
    for (const planet of this.planets) {
      ctx.globalAlpha = planet.alpha;
      ctx.drawImage(planet.image,
        Math.round(planet.x - planet.image.width / 2),
        Math.round(planet.y - planet.image.height / 2));
    }
    ctx.globalAlpha = 1;

    // Звёзды: размер и скорость зависят от слоя, яркость слегка мерцает.
    for (const star of this.stars) {
      const layer = STAR_LAYERS[star.layer];
      const twinkle = 0.75 + 0.25 * Math.sin(star.phase + this.time * 2.4);
      ctx.globalAlpha = layer.alpha * twinkle;
      ctx.fillStyle = layer.color;
      ctx.fillRect(Math.round(star.x), Math.round(star.y), layer.size, layer.size);
    }
    ctx.globalAlpha = 1;

    // Кометы: короткий пунктирный хвост из пикселей, гаснущий к концу.
    ctx.fillStyle = COLORS.comet;
    for (const comet of this.comets) {
      const fade = Math.min(1, comet.life);
      for (let i = 0; i < comet.tail; i++) {
        const size = i < 2 ? 3 : 2;
        ctx.globalAlpha = fade * (1 - i / comet.tail) * 0.9;
        ctx.fillRect(
          Math.round(comet.x - comet.vx * 0.03 * i),
          Math.round(comet.y - comet.vy * 0.03 * i),
          size,
          size
        );
      }
    }
    ctx.globalAlpha = 1;
  },
};

/* =========================== 5. ИГРОВЫЕ КЛАССЫ ============================= */

/**
 * Player — страж, которым управляет игрок.
 * Пиксельный космический корабль: летает по WASD/стрелкам,
 * а стреляет в сторону курсора мыши.
 */
class Player {
  constructor() {
    this.reset();
  }

  /** Начальные параметры стража (используется и при рестарте). */
  reset() {
    this.w = PLAYER_SIZE;
    this.h = PLAYER_SIZE;
    this.x = CANVAS_WIDTH / 2 - this.w / 2;  // внизу по центру поля
    this.y = CANVAS_HEIGHT - this.h - 40;
    this.speed = PLAYER_SPEED;
    this.lives = PLAYER_LIVES;
    this.invuln = 0;    // остаток секунд неуязвимости (страж мигает)
    this.hitFlash = 0;  // короткая белая вспышка в момент урона
  }

  /** Центр стража по X — нужен для расчёта направления выстрела. */
  get cx() { return this.x + this.w / 2; }

  /** Центр стража по Y. */
  get cy() { return this.y + this.h / 2; }

  /** Движение и таймеры. dt — время кадра в секундах. */
  update(dt) {
    // Направление уже собрано из клавиатуры и экранного джойстика (readInput).
    const dx = input.moveX;
    const dy = input.moveY;

    if (dx !== 0 || dy !== 0) {
      // Нормализация вектора: по диагонали страж не должен двигаться быстрее,
      // но неполный наклон джойстика даёт плавное, «аналоговое» движение.
      const length = Math.max(1, Math.hypot(dx, dy));
      this.x += (dx / length) * this.speed * dt;
      this.y += (dy / length) * this.speed * dt;
    }

    // Не выпускаем стража за границы поля.
    this.x = clamp(this.x, 0, CANVAS_WIDTH - this.w);
    this.y = clamp(this.y, 0, CANVAS_HEIGHT - this.h);

    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  /**
   * Получение урона. Возвращает true, если урон реально прошёл:
   * пока страж мигает после предыдущего попадания — урона нет.
   */
  takeDamage() {
    if (this.invuln > 0) return false;
    this.lives -= 1;
    this.invuln = PLAYER_INVULN_TIME;
    this.hitFlash = 0.15;
    return true;
  }

  /** Отрисовка стража: пиксельный корабль, пламя двигателей и вспышка выстрела. */
  draw() {
    const x = Math.round(this.x);  // округление до целых пикселей — «пиксельный» вид
    const y = Math.round(this.y);

    // Получил урон — на пару кадров корабль становится белым силуэтом.
    if (this.hitFlash > 0) {
      drawSprite('playerFlash', SPRITES.player, PLAYER_PIXEL, PALETTES.playerFlash, x, y);
      return;
    }

    // Во время неуязвимости корабль мигает — рисуем его через кадр.
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return;

    this.drawThrusters(x, y);  // пламя рисуем первым, чтобы корпус был поверх него
    drawSprite('player', SPRITES.player, PLAYER_PIXEL, PALETTES.player, x, y);

    // Вспышка у дула сразу после выстрела.
    if (state.muzzle > 0) {
      const size = PLAYER_PIXEL * 3;
      ctx.fillStyle = COLORS.muzzle;
      ctx.fillRect(x + (this.w - size) / 2, y - size, size, size);
    }
  }

  /**
   * Анимированное пламя двух двигателей.
   * Длина «языка» случайна в каждом кадре, поэтому огонь выглядит живым.
   */
  drawThrusters(x, y) {
    const px = PLAYER_PIXEL;
    const nozzleY = y + this.h;                        // сопла — на нижней кромке
    const nozzles = PLAYER_NOZZLES.map((column) => column * px);

    ctx.globalAlpha = 0.9;
    for (const nozzleX of nozzles) {
      const height = Math.round(rand(5, 13));
      for (let i = 0; i < height; i++) {
        // У сопла пламя светлее, дальше — оранжевое и более узкое.
        ctx.fillStyle = i < height / 2 ? COLORS.flameInner : COLORS.flameOuter;
        const width = Math.max(1, px * 2 - i);
        ctx.fillRect(x + nozzleX, nozzleY + i, width, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

/** Bullet — пиксельный снаряд, летящий в сторону курсора мыши. */
class Bullet {
  constructor(x, y, dirX, dirY) {
    this.w = BULLET_SIZE;
    this.h = BULLET_SIZE;
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    this.vx = dirX * BULLET_SPEED;  // составляющие скорости по осям
    this.vy = dirY * BULLET_SPEED;
    this.dead = false;              // помечаем объект на удаление
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Снаряд улетел за пределы поля — удаляем.
    if (this.x + this.w < 0 || this.x > CANVAS_WIDTH ||
        this.y + this.h < 0 || this.y > CANVAS_HEIGHT) {
      this.dead = true;
    }
  }

  /** Пиксельный «болт»: цветная оболочка и яркое ядро внутри. */
  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = COLORS.bullet;
    ctx.fillRect(x, y, this.w, this.h);
    ctx.fillStyle = COLORS.bulletCore;
    ctx.fillRect(x + 2, y + 2, this.w - 4, this.h - 4);
  }
}

/** Enemy — вражеский корабль: появляется сверху и идёт вниз. */
class Enemy {
  /**
   * @param {number} speed скорость падения
   * @param {boolean} rare  редкий «носитель»: живучее и всегда оставляет бонус
   */
  constructor(speed, rare = false) {
    this.w = ENEMY_SIZE;
    this.h = ENEMY_SIZE;
    this.x = rand(0, CANVAS_WIDTH - this.w);  // случайная позиция по горизонтали
    this.y = -this.h;                         // рождается чуть выше экрана
    this.vy = speed;                          // скорость падения
    this.vx = rand(-30, 30);                  // лёгкий дрейф в сторону
    this.rare = rare;                         // редкий враг-носитель бонуса
    this.hp = rare ? RARE_ENEMY_HP : 1;       // сколько попаданий держит
    this.hitFlash = 0;                        // короткая вспышка при попадании
    this.dead = false;
  }

  /** Попадание снаряда стража. Возвращает true, если корабль уничтожен. */
  takeHit() {
    this.hp -= 1;
    this.hitFlash = 0.1;
    return this.hp <= 0;
  }

  update(dt) {
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.y += this.vy * dt;
    this.x += this.vx * dt;

    // Отражаемся от боковых стен, чтобы враг не «уезжал» с поля.
    if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;
    }
    if (this.x + this.w > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.w;
      this.vx *= -1;
    }

    // Враг прошёл поле насквозь — просто удаляем его.
    if (this.y > CANVAS_HEIGHT) this.dead = true;
  }

  /** Отрисовка врага: обычный корабль-пришелец или редкий «носитель» бонуса. */
  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const sprite = this.rare ? SPRITES.carrier : SPRITES.enemy;
    const pixel = this.rare ? CARRIER_PIXEL : ENEMY_PIXEL;

    // При попадании рисуем белый силуэт того же корабля.
    if (this.hitFlash > 0) {
      const flashKey = this.rare ? 'carrierFlash' : 'enemyFlash';
      drawSprite(flashKey, sprite, pixel, PALETTES[flashKey], x, y);
      return;
    }

    const key = this.rare ? 'carrier' : 'enemy';
    drawSprite(key, sprite, pixel, PALETTES[key], x, y);

    // Носовой огонь пульсирует; у редкого носителя он ярче и другого цвета,
    // так что редкого врага видно издалека.
    const size = pixel * 3;
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(state.time * 6 + this.x));
    ctx.fillStyle = this.rare ? COLORS.carrier : COLORS.enemyGlow;
    ctx.fillRect(x + (this.w - size) / 2, y + this.h - size, size, size);
    ctx.globalAlpha = 1;
  }
}

/** Particle — короткоживущая частица взрыва (эффект уничтожения). */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = rand(-130, 130);  // разлетаемся в случайную сторону
    this.vy = rand(-130, 130);
    this.size = randInt(2, 4);
    this.life = rand(0.25, 0.6);  // сколько секунд живёт частица
    this.maxLife = this.life;     // нужно для плавного затухания
    this.color = color;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;  // затухание скорости — частицы «притормаживают»
    this.vy *= 0.94;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw() {
    // Прозрачность = остаток жизни, поэтому частицы плавно исчезают.
    ctx.globalAlpha = Math.max(this.life / this.maxLife, 0);
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

/** EnemyBullet — снаряд босса: летит по заданному углу и ранит стража. */
class EnemyBullet {
  constructor(x, y, angle, speed = ENEMY_BULLET_SPEED) {
    this.w = ENEMY_BULLET_SIZE;
    this.h = ENEMY_BULLET_SIZE;
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Улетел за пределы поля — удаляем.
    if (this.x + this.w < 0 || this.x > CANVAS_WIDTH ||
        this.y + this.h < 0 || this.y > CANVAS_HEIGHT) {
      this.dead = true;
    }
  }

  draw() {
    // Розовый «сгусток» с яркой сердцевиной — хорошо заметен на тёмном фоне.
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    drawPixelBox(x, y, this.w, this.h, COLORS.bossBullet, '#ffe6ff', 2);
  }
}

/** PowerUp — бонус из врага: аптечка (жизнь) или усиление выстрела. */
class PowerUp {
  /**
   * @param {number} x центр по горизонтали
   * @param {number} y центр по вертикали
   * @param {'medkit'|'weapon'} type тип бонуса
   */
  constructor(x, y, type) {
    this.w = POWERUP_SIZE;
    this.h = POWERUP_SIZE;
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    this.type = type;
    this.vx = rand(-25, 25);             // лёгкий снос в сторону
    this.vy = POWERUP_SPEED;             // падает вниз
    this.pulse = rand(0, Math.PI * 2);   // фаза пульсации рамки
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.pulse += dt * 6;

    // Отражаемся от боковых стен, чтобы бонус не улетал с поля.
    if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;
    }
    if (this.x + this.w > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.w;
      this.vx *= -1;
    }

    // Пролетел мимо стража и ушёл вниз — бонус потерян.
    if (this.y > CANVAS_HEIGHT) this.dead = true;
  }

  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    drawSprite(this.type, SPRITES[this.type], POWERUP_PIXEL, PALETTES[this.type], x, y);

    // Пульсирующая рамка, чтобы бонус было видно в гуще боя.
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(this.pulse));
    ctx.strokeStyle = this.type === 'medkit' ? COLORS.medkit : COLORS.weapon;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, this.w + 6, this.h + 6);
    ctx.globalAlpha = 1;
  }
}

/** Boss — крупный корабль уровня: полоска здоровья и три уникальные атаки. */
class Boss {
  constructor(level) {
    this.level = level;
    this.w = BOSS_WIDTH;
    this.h = BOSS_HEIGHT;
    this.x = CANVAS_WIDTH / 2 - this.w / 2;
    this.y = -this.h;                              // выезжает из-за верхнего края
    this.entering = true;                          // пока едет — не стреляет
    this.maxHp = BOSS_BASE_HP + (level - 1) * BOSS_HP_GROWTH;
    this.hp = this.maxHp;
    this.vx = BOSS_BASE_SPEED + (level - 1) * 15;  // дрейф вбок
    this.fireTimer = 1.0;                          // первая атака не сразу
    this.pattern = 0;                              // номер текущей атаки
    this.hitFlash = 0;
    this.corePulse = 0;                            // фаза пульсации ядра
    this.rewardDropped = false;                    // бонус за половину здоровья
    this.dead = false;
  }

  /** Центр корабля по X — из него вылетают снаряды. */
  get cx() { return this.x + this.w / 2; }

  /** Центр корабля по Y. */
  get cy() { return this.y + this.h / 2; }

  /** Пауза между атаками: с каждым уровнем босс стреляет чаще. */
  fireInterval() {
    return Math.max(BOSS_FIRE_MIN, BOSS_FIRE_BASE - (this.level - 1) * BOSS_FIRE_STEP);
  }

  update(dt) {
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.corePulse += dt;

    // 1. Въезд на поле: пока не доехал, босс только движется.
    if (this.entering) {
      this.y += 130 * dt;
      if (this.y >= BOSS_ENTER_Y) {
        this.y = BOSS_ENTER_Y;
        this.entering = false;
      }
      return;
    }

    // 2. Дрейф вбок с отскоком от стен.
    this.x += this.vx * dt;
    if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;
    }
    if (this.x + this.w > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.w;
      this.vx *= -1;
    }

    // 3. Атаки по таймеру: три шаблона идут по кругу.
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.attack();
      this.pattern = (this.pattern + 1) % 3;
      this.fireTimer = this.fireInterval();
    }
  }

  /**
   * Уникальные атаки босса (чередуются по кругу):
   *   0 — веер снарядов в сторону стража,
   *   1 — плотный прицельный залп,
   *   2 — радиальный взрыв во все стороны.
   */
  attack() {
    const level = this.level;
    const aim = Math.atan2(state.player.cy - this.cy, state.player.cx - this.cx);
    const muzzleY = this.cy + this.h * 0.35;   // снаряды вылетают из-под корпуса

    if (this.pattern === 0) {
      const shots = 3 + Math.min(level, 6);             // с уровнем лучей больше
      const spread = 0.8;
      for (let i = 0; i < shots; i++) {
        const angle = aim - spread / 2 + (spread * i) / (shots - 1);
        state.enemyBullets.push(new EnemyBullet(this.cx, muzzleY, angle));
      }
    } else if (this.pattern === 1) {
      const shots = 3 + Math.min(level, 4);
      for (let i = 0; i < shots; i++) {
        const offset = (i - (shots - 1) / 2) * 0.12;     // узкая «очередь» по стражу
        state.enemyBullets.push(new EnemyBullet(this.cx, muzzleY, aim + offset));
      }
    } else {
      const shots = 10 + level * 2;                      // круговой залп
      const base = this.corePulse;                       // каждый раз новый поворот
      for (let i = 0; i < shots; i++) {
        const angle = base + (Math.PI * 2 * i) / shots;
        state.enemyBullets.push(new EnemyBullet(this.cx, this.cy, angle, ENEMY_BULLET_SPEED * 0.8));
      }
    }

    sound.bossShot();
  }

  /** Попадание снаряда стража. Возвращает true, если босс уничтожен. */
  takeHit() {
    this.hp -= 1;
    this.hitFlash = 0.12;
    return this.hp <= 0;
  }

  /** Отрисовка: пламя двигателей, корпус, пульсирующее ядро и огни пушек. */
  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const flash = this.hitFlash > 0;

    // Пламя рисуем первым, чтобы корпус лёг поверх языков огня.
    if (!flash) this.drawEngines(x, y);

    drawSprite(flash ? 'bossFlash' : 'boss', SPRITES.boss, BOSS_PIXEL,
      flash ? PALETTES.bossFlash : PALETTES.boss, x, y);

    // Ядро пульсирует — по нему удобно целиться.
    const size = BOSS_PIXEL * 5;
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(this.corePulse * 5));
    ctx.fillStyle = COLORS.bossCore;
    ctx.fillRect(x + this.w / 2 - size / 2, y + this.h * 0.72 - size / 2, size, size);

    // Ореол вокруг ядра: большое ядро дредноута заметно издалека.
    ctx.globalAlpha = 0.12 + 0.16 * Math.abs(Math.sin(this.corePulse * 5));
    ctx.fillRect(x + this.w / 2 - size, y + this.h * 0.72 - size, size * 2, size * 2);
    ctx.globalAlpha = 1;

    // Огни бортовых пушек мигают по очереди — босс выглядит живым.
    const blink = Math.sin(this.corePulse * 4) > 0;
    ctx.fillStyle = blink ? COLORS.bossCore : COLORS.bossGun;
    ctx.fillRect(x + 2, y + this.h * 0.36, BOSS_PIXEL * 3, BOSS_PIXEL);
    ctx.fillRect(x + this.w - BOSS_PIXEL * 3 - 2, y + this.h * 0.36, BOSS_PIXEL * 3, BOSS_PIXEL);
  }

  /**
   * Три языка пламени из дюз: рисуются над верхней кромкой корпуса, поэтому
   * кажется, что дредноут держится на тяге трёх могучих двигателей.
   */
  drawEngines(x, y) {
    const px = BOSS_PIXEL;
    const nozzles = [8, 20, 32].map((column) => x + column * px);

    ctx.globalAlpha = 0.85;
    for (const nozzleX of nozzles) {
      const height = Math.round(rand(6, 18));
      for (let i = 0; i < height; i++) {
        ctx.fillStyle = i < height / 2 ? COLORS.flameInner : COLORS.flameOuter;
        const width = Math.max(2, px * 2 - i * 0.6);
        ctx.fillRect(nozzleX, y - i - 1, width, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* ============================ 6. ЗВУК (WEB AUDIO API) ====================== */

/**
 * Звуковой движок на Web Audio API. Все эффекты синтезируются «на лету»
 * (осцилляторы + белый шум), поэтому звуковых файлов в проекте нет вообще.
 *
 * Браузеры запрещают запускать звук до первого действия пользователя, поэтому
 * AudioContext создаётся лениво — в unlock(), который вызывается из обработчиков
 * клавиатуры и мыши. Если Web Audio недоступен, игра просто работает без звука.
 */
const sound = {
  ctx: null,        // AudioContext (появляется после первого действия игрока)
  master: null,     // общий регулятор громкости
  noise: null,      // переиспользуемый буфер белого шума для взрывов
  muted: false,     // выключен ли звук клавишей M
  lastPlayed: {},   // время последнего проигрывания каждого эффекта

  /** Создаёт AudioContext и снимает его с автопаузы (вызывать по клику/клавише). */
  unlock() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;  // браузер без Web Audio — играем молча
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
        this.master.connect(this.ctx.destination);
      }
      // Chrome/Safari держат контекст «спящим», пока игрок не взаимодействовал.
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (error) {
      this.ctx = null;  // что-то пошло не так — продолжаем без звука
    }
  },

  /** Клавиша M: выключает и включает звук. */
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
  },

  /** Готов ли звук к работе (создан и не выключен игроком). */
  ready() {
    return !!this.ctx && !this.muted;
  },

  /**
   * Пропускает звук не чаще, чем раз в minGapMs миллисекунд.
   * Без этого одновременная гибель десятка врагов даёт неприятный треск.
   */
  throttle(name, minGapMs) {
    const now = performance.now();
    if (now - (this.lastPlayed[name] || 0) < minGapMs) return false;
    this.lastPlayed[name] = now;
    return true;
  },

  /** Буфер белого шума (создаётся один раз, потом переиспользуется). */
  noiseBuffer() {
    if (this.noise) return this.noise;
    const length = Math.floor(this.ctx.sampleRate * 0.5);
    this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return this.noise;
  },

  /**
   * Готовый «блип»: осциллятор со скольжением частоты и огибающей.
   * Через него сделаны все короткие звуки — код не дублируется.
   * @param {OscillatorType} type форма волны
   * @param {number} fromHz частота в начале
   * @param {number} toHz частота в конце
   * @param {number} duration длительность, секунд
   * @param {number} volume громкость
   * @param {number} delay задержка старта, секунд
   */
  blip(type, fromHz, toHz, duration, volume, delay = 0) {
    const start = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(fromHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  },

  /** Короткий шумовой «бум» с уезжающим вниз фильтром. */
  noiseBurst(fromHz, toHz, duration, volume) {
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(fromHz, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(now);
    noise.stop(now + duration + 0.02);
  },

  /** Звук выстрела: короткий «пиу» со скольжением частоты вниз. */
  shoot() {
    if (!this.ready() || !this.throttle('shoot', 40)) return;

    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = 'square';                                          // «лазерный» тембр
    oscillator.frequency.setValueAtTime(880, now);                       // старт
    oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.09);   // скользим вниз

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.005);           // мгновенная атака
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);          // быстрое затухание

    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  },

  /** Звук взрыва врага: белый шум, у которого фильтр съезжает вниз. */
  explode() {
    if (!this.ready() || !this.throttle('explode', 25)) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);                     // сначала резкий «хлопок»
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.25);  // затем глухой гул

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(now);
    noise.stop(now + 0.3);
  },

  /** Звук полученного урона: низкий падающий гул. */
  damage() {
    if (!this.ready() || !this.throttle('damage', 150)) return;

    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.36);
  },

  /** Финальная мелодия проигрыша: три ноты, идущие вниз. */
  gameOver() {
    if (!this.ready()) return;

    const now = this.ctx.currentTime;
    [440, 330, 220].forEach((frequency, index) => {
      const start = now + index * 0.18;
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);

      oscillator.connect(gain).connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + 0.32);
    });
  },

  /** Подбор бонуса: две короткие ноты вверх. */
  powerup() {
    if (!this.ready() || !this.throttle('powerup', 60)) return;
    this.blip('square', 660, 660, 0.08, 0.16);
    this.blip('square', 990, 990, 0.12, 0.16, 0.07);
  },

  /** Курсор перешёл на другую кнопку меню: тихий короткий «тик». */
  uiMove() {
    if (!this.ready() || !this.throttle('uiMove', 70)) return;
    this.blip('square', 520, 700, 0.045, 0.07);
  },

  /** Кнопка меню нажата: бодрый восходящий «бип». */
  uiSelect() {
    if (!this.ready() || !this.throttle('uiSelect', 30)) return;
    this.blip('square', 700, 1180, 0.08, 0.15);
  },

  /** Новый уровень: восходящее арпеджио из трёх нот. */
  levelUp() {
    if (!this.ready()) return;
    [523, 659, 880].forEach((frequency, index) => {
      this.blip('triangle', frequency, frequency, 0.16, 0.18, index * 0.11);
    });
  },

  /** Тревога перед вылетом босса: два низких сигнала. */
  bossWarn() {
    if (!this.ready()) return;
    this.blip('sawtooth', 150, 320, 0.22, 0.2);
    this.blip('sawtooth', 150, 320, 0.22, 0.2, 0.26);
  },

  /** Выстрел босса: тяжёлый низкий «вуп». */
  bossShot() {
    if (!this.ready() || !this.throttle('bossShot', 60)) return;
    this.blip('sawtooth', 300, 90, 0.22, 0.16);
  },

  /** Попадание по боссу или по редкому врагу: металлический щелчок. */
  bossHit() {
    if (!this.ready() || !this.throttle('bossHit', 30)) return;
    this.blip('square', 420, 140, 0.06, 0.12);
  },

  /** Босс уничтожен: длинный взрыв и падающий тон. */
  bossDown() {
    if (!this.ready()) return;
    this.noiseBurst(3000, 80, 0.9, 0.4);
    this.blip('sawtooth', 320, 50, 0.8, 0.24);
  },
};

/* ============ 7. СОСТОЯНИЕ ИГРЫ И ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ==================== */

/**
 * Нажатые клавиши. Ключи — это event.code, например keys['KeyW'],
 * keys['ArrowUp']. Объект без прототипа, чтобы не путаться со встроенными полями.
 */
const keys = Object.create(null);

/** Мышь: позиция в логических координатах холста + нажата ли кнопка. */
const mouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, down: false };

/**
 * «Намерение» игрока на текущий кадр: куда двигаться и стреляет ли он.
 * Заполняется из клавиатуры, мыши и экранного джойстика, поэтому логика игры
 * ничего не знает о конкретном устройстве ввода.
 */
const input = {
  moveX: 0,        // -1..1 по горизонтали
  moveY: 0,        // -1..1 по вертикали
  firing: false,   // удерживается ли огонь
};

/** Всё изменяемое состояние игры собрано в одном объекте. */
const state = {
  screen: 'menu',    // экран: 'menu' | 'howto' | 'playing' | 'paused' | 'over'
  player: null,      // экземпляр Player
  bullets: [],       // летящие снаряды стража
  enemies: [],       // враги на поле
  particles: [],     // частицы взрывов
  score: 0,          // очки
  best: 0,           // рекорд (лежит в localStorage)
  time: 0,           // сколько секунд длится текущий забег (растёт сложность)
  spawnTimer: 0,     // сколько осталось до появления следующего врага
  fireTimer: 0,      // перезарядка оружия
  muzzle: 0,         // таймер вспышки у дула после выстрела
  shake: 0,          // сила «тряски» экрана
  uiTime: 0,         // время для анимаций меню и подсказок

  // --- Уровни, боссы и бонусы (Шаг 2) ---
  level: 1,          // текущий уровень
  kills: 0,          // сколько врагов сбито на текущем уровне
  boss: null,        // активный босс (или null)
  bossWarnTimer: 0,  // отсчёт «WARNING!» до вылета босса
  enemyBullets: [],  // снаряды босса
  powerups: [],      // выпавшие бонусы
  weaponTimer: 0,    // остаток усиления выстрела, секунд
  announce: '',      // текст объявления по центру экрана
  announceTimer: 0,  // сколько объявление ещё видно

  // --- Сенсорное управление, прицел и рекорд ---
  touch: false,      // включены ли экранные органы управления
  touchAim: false,   // последним вводом был палец — значит нужно автонаведение
  aimX: CANVAS_WIDTH / 2,   // куда сейчас летят снаряды (для прицела)
  aimY: CANVAS_HEIGHT / 2,
  touchHint: 0,      // сколько секунд ещё висит подсказка про джойстик
  fullscreenTried: false, // пробовали ли уже уйти в полный экран автоматически
};

/** Похоже ли устройство на телефон или планшет. */
function detectTouchMode() {
  const coarse = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
  return coarse || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

/** Читает рекорд из localStorage (если хранилище недоступно — считаем нулём). */
function loadBestScore() {
  try {
    return Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

/** Обновляет рекорд, если текущий забег его побил. */
function saveBestScore() {
  if (state.score <= state.best) return;
  state.best = state.score;
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(state.best));
  } catch (error) {
    // Приватный режим или отключённое хранилище — просто не сохраняем.
  }
}

/**
 * Переводит координаты события указателя в логические координаты холста.
 * Нужно, потому что холст может быть отмасштабирован стилями (max-width: 100%).
 */
function eventToField(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
    y: (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
  };
}

/** Обновляет позицию мыши по событию указателя. */
function updateMousePosition(event) {
  const point = eventToField(event);
  mouse.x = point.x;
  mouse.y = point.y;
}

/* ------------------------------- Клавиатура ------------------------------- */

window.addEventListener('keydown', (event) => {
  if (PREVENT_KEYS.has(event.code)) event.preventDefault(); // не прокручиваем страницу
  keys[event.code] = true;

  // Нажатие клавиши — это «жест пользователя», после которого браузер
  // разрешает запустить звук (политика автовоспроизведения).
  sound.unlock();

  // Одиночные действия обрабатываем только на первое нажатие,
  // а не на каждое автоповторение удерживаемой клавиши.
  if (event.repeat) return;

  handleKeyPress(event);
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

// Окно потеряло фокус — «отпускаем» всё, иначе страж уедет сам по себе.
window.addEventListener('blur', () => {
  for (const code in keys) keys[code] = false;
  mouse.down = false;
  touchControls.releaseAll();
});

/**
 * Разбор одиночного нажатия клавиши: навигация по меню, пауза и горячие
 * клавиши боя. Держится отдельно, чтобы обработчик события остался коротким.
 */
function handleKeyPress(event) {
  const code = event.code;

  // Звук вкл/выкл работает на любом экране; в меню нужно обновить подпись.
  if (code === 'KeyM') {
    sound.toggleMute();
    if (state.screen !== 'playing') buildScreen(state.screen);
    return;
  }

  // Полный экран — на любом экране игры (удобно на компьютере).
  if (code === 'KeyF') {
    fullscreenApi.toggle();
    return;
  }

  if (state.screen === 'playing') {
    if (code === 'KeyP' || code === 'Escape') setScreen('paused');
    else if (code === 'KeyR') { resetGame(); setScreen('playing'); }
    return;
  }

  if (state.screen === 'paused') {
    if (code === 'KeyP' || code === 'Escape') setScreen('playing');
    else if (code === 'KeyR') { resetGame(); setScreen('playing'); }
    return;
  }

  if (state.screen === 'over') {
    // Экран проигрыша: любая из привычных клавиш начинает новый забег.
    if (code === 'Enter' || code === 'Space' || code === 'KeyR') {
      resetGame();
      setScreen('playing');
    } else if (code === 'Escape') {
      setScreen('menu');
    }
    return;
  }

  // Экраны 'menu' и 'howto': выбор пункта стрелками/WASD и Enter.
  if (code === 'ArrowUp' || code === 'KeyW') ui.move(-1);
  else if (code === 'ArrowDown' || code === 'KeyS') ui.move(1);
  else if (code === 'Enter' || code === 'Space') ui.activate();
  else if (code === 'Escape' && state.screen === 'howto') setScreen('menu');
}

/* ------------------------------ Мышь и палец ----------------------------- */

canvas.addEventListener('pointermove', (event) => {
  updateMousePosition(event);

  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    state.touchAim = true;                    // целимся автонаведением
    if (state.touch) touchControls.pointerMove(event);
    return;
  }

  state.touchAim = false;                     // мышь снова задаёт прицел
  if (state.screen !== 'playing') ui.hoverAt(mouse.x, mouse.y);
});

canvas.addEventListener('pointerdown', (event) => {
  updateMousePosition(event);
  sound.unlock();  // клик тоже разрешает звук (см. политику автовоспроизведения)

  const point = eventToField(event);
  const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
  if (isTouch) state.touchAim = true;

  // 1. Экранные кнопки телефона: пауза, огонь и джойстик.
  //    Они перекрывают поле, поэтому проверяются раньше всего.
  if (isTouch && state.touch && touchControls.pointerDown(event, point)) return;

  // 2. Экраны меню: нажатие на кнопку интерфейса.
  if (state.screen !== 'playing') {
    const button = ui.buttonAt(point.x, point.y);
    if (button) pressButton(button);
    return;
  }

  // 3. Бой с мышью: огонь. Первый выстрел — без задержки перезарядки.
  mouse.down = true;
  state.fireTimer = 0;
});

// Отпускание пальца или мыши: гасим огонь и освобождаем элементы управления.
window.addEventListener('pointerup', (event) => {
  mouse.down = false;
  touchControls.pointerUp(event);
});
window.addEventListener('pointercancel', (event) => touchControls.pointerUp(event));
canvas.addEventListener('pointerleave', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

/* ------------------------- Блокировка жестов браузера ---------------------- */

/**
 * Страница — это приложение, а не документ. Если не отменить стандартное
 * поведение браузера, палец на джойстике одновременно «тянет» страницу:
 * она скроллится, «оттягивается», а на некоторых телефонах срабатывает
 * зум или «оттягивание» для обновления страницы.
 *
 * Важно: обработчики вешаем с { passive: false } — иначе браузер
 * проигнорирует preventDefault() ради своей скорости.
 */
function blockBrowserGesture(event) {
  if (event.cancelable) event.preventDefault();
}

// touchmove — главный виновник скролла при движении пальцем по джойстику.
// touchstart — чтобы не начинался жест «оттянуть страницу»/зум.
// touchend/touchcancel — чтобы жест не «дотягивался» после отпускания.
for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
  canvas.addEventListener(type, blockBrowserGesture, { passive: false });
}

// Двойной тап по холсту иначе зумит страницу (не сработает preventDefault).
canvas.addEventListener('dblclick', blockBrowserGesture, { passive: false });

// На всякий случай гасим скролл и на уровне документа: палец может попасть
// мимо холста (рамка, фон) и потянуть страницу целиком.
//
// ВАЖНО: preventDefault() на touchstart отменяет синтез «click», поэтому
// интерактивные элементы (кнопка полного экрана) пропускаем — иначе они
// просто не нажимались бы на телефоне.
function blockDocumentGesture(event) {
  const target = event.target;
  if (target && target.closest && target.closest('button, a, input, select')) return;
  blockBrowserGesture(event);
}

for (const type of ['touchmove', 'touchstart']) {
  document.addEventListener(type, blockDocumentGesture, { passive: false });
}

// Некоторые мобильные браузеры подсвечивают область касания и вызывают
// контекстное меню по долгому нажатию — тоже отключаем.
document.addEventListener('contextmenu', (event) => {
  if (state.touch) event.preventDefault();
});

/* =============== 7a. ПОЛНОЭКРАННЫЙ РЕЖИМ И СКРЫТИЕ АДРЕСНОЙ СТРОКИ ======== */

/*
 * Полный экран на телефоне убирает адресную строку и панель браузера —
 * игра занимает весь экран. API немного отличается в разных браузерах,
 * поэтому поддерживаем и стандартные имена, и старые префиксы Safari.
 */
/** Класс «псевдо-полного экрана» — запасной вариант, когда API запрещён. */
const PSEUDO_FULLSCREEN_CLASS = 'is-pseudo-fullscreen';

/** Защита от двойного срабатывания (touchend + синтетический click). */
const FULLSCREEN_TOGGLE_GUARD_MS = 600;

/*
 * Полный экран на телефоне убирает адресную строку и панель браузера.
 * Имена методов отличаются от браузера к браузеру, поэтому перебираем
 * все известные варианты, а не только стандартный.
 */
const fullscreenApi = {
  /** Методы входа во весь экран (в т.ч. старые Safari / Firefox / IE). */
  REQUEST_NAMES: [
    'requestFullscreen', 'webkitRequestFullscreen', 'webkitRequestFullScreen',
    'mozRequestFullScreen', 'msRequestFullscreen',
  ],

  /** Методы выхода из полного экрана. */
  EXIT_NAMES: [
    'exitFullscreen', 'webkitExitFullscreen', 'webkitCancelFullScreen',
    'mozCancelFullScreen', 'msExitFullscreen',
  ],

  /** Свойства с элементом, который сейчас развёрнут на весь экран. */
  ELEMENT_NAMES: [
    'fullscreenElement', 'webkitFullscreenElement',
    'webkitCurrentFullScreenElement', 'msFullscreenElement',
  ],

  /** Нативный полноэкранный элемент (или null). */
  get element() {
    for (const name of this.ELEMENT_NAMES) {
      if (document[name]) return document[name];
    }
    return null;
  },

  /** Нативный метод входа, привязанный к documentElement (или null). */
  requestFn() {
    const root = document.documentElement;
    for (const name of this.REQUEST_NAMES) {
      if (typeof root[name] === 'function') return root[name].bind(root);
    }
    return null;
  },

  /** Нативный метод выхода, привязанный к document (или null). */
  exitFn() {
    for (const name of this.EXIT_NAMES) {
      if (typeof document[name] === 'function') return document[name].bind(document);
    }
    return null;
  },

  /** Умеет ли браузер нативный полный экран. */
  supported() { return this.requestFn() !== null; },

  /** Активен ли полноэкранный режим — нативный или псевдо-. */
  active() {
    return !!this.element ||
      document.body.classList.contains(PSEUDO_FULLSCREEN_CLASS);
  },

  /**
   * Запасной режим для iOS Safari и прочих браузеров, которые запрещают
   * Fullscreen API для обычных веб-страниц. Прячем обвязку и растягиваем
   * игру через CSS на весь видимый экран (100vw x 100vh).
   */
  enterFallback() {
    document.documentElement.classList.add(PSEUDO_FULLSCREEN_CLASS);
    document.body.classList.add(PSEUDO_FULLSCREEN_CLASS);

    // Если телефон умеет фиксировать ориентацию — попробуем занять весь экран.
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        const locked = screen.orientation.lock('any');
        if (locked && typeof locked.catch === 'function') locked.catch(() => {});
      }
    } catch (error) {
      // Ориентацию зафиксировать нельзя — играем в текущей.
    }
    return true;
  },

  /** Снимает псевдо-полный экран. */
  exitFallback() {
    document.documentElement.classList.remove(PSEUDO_FULLSCREEN_CLASS);
    document.body.classList.remove(PSEUDO_FULLSCREEN_CLASS);
    try {
      if (screen.orientation && typeof screen.orientation.unlock === 'function') {
        screen.orientation.unlock();
      }
    } catch (error) {
      // Ничего страшного.
    }
  },

  /**
   * Включает полный экран. Вызывать строго из пользовательского жеста
   * (тап/клик), иначе браузер откажет по политике user activation.
   */
  enter() {
    const request = this.requestFn();
    if (!request) return this.enterFallback();   // iOS Safari и подобные

    try {
      const result = request();
      // Отказ приходит асинхронно — тогда тоже включаем запасной режим,
      // чтобы пользователь точно получил развёрнутую игру, а ничего.
      if (result && typeof result.catch === 'function') {
        result.catch(() => this.enterFallback());
      }
      return true;
    } catch (error) {
      return this.enterFallback();
    }
  },

  /** Выходит из полного экрана (и из псевдо-, если он включён). */
  exit() {
    this.exitFallback();
    const exit = this.exitFn();
    if (!exit || !this.element) return false;
    try {
      const result = exit();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (error) {
      // Выход может быть недоступен — игнорируем.
    }
    return true;
  },

  /** Переключает режим: вошли — выходим, и наоборот. */
  toggle() { return this.active() ? this.exit() : this.enter(); },
};

/**
 * Пытается один раз автоматически уйти в полный экран на телефоне.
 * Вызывать нужно из пользовательского жеста (тапа), иначе браузер запретит.
 * Флаг гарантирует, что «навязчивый» запрос повторится ровно один раз.
 */
function requestFullscreenOnce() {
  if (state.fullscreenTried) return;
  state.fullscreenTried = true;
  if (state.touch) fullscreenApi.enter();
}

/** Подпись кнопки полного экрана под текущее состояние. */
function fullscreenLabel() {
  return fullscreenApi.active() ? '⛶ Выйти из полного экрана' : '⛶ Полный экран';
}

/** Показывает кнопку и обновляет её подпись под текущее состояние. */
function syncFullscreenButton() {
  const button = document.getElementById('fsButton');
  if (!button) return;

  // Кнопка нужна всегда: даже без нативного API она включает
  // псевдо-полный экран, то есть игра всё равно развернётся.
  button.hidden = false;
  button.textContent = fullscreenLabel();
}

/** Реакция на смену полноэкранного режима: обновляем подпись на кнопке. */
function onFullscreenChange() {
  syncFullscreenButton();
}

for (const type of ['fullscreenchange', 'webkitfullscreenchange', 'webkitfullscreenerror',
  'MSFullscreenChange']) {
  document.addEventListener(type, onFullscreenChange);
}

// Появление полного экрана на телефоне: первый же тап уводит игру в него.
canvas.addEventListener('pointerdown', requestFullscreenOnce, { passive: true });

/** Метка последнего переключения — защита от двойного срабатывания. */
let lastFullscreenToggle = 0;

/**
 * Единая точка входа для кнопки «Полный экран».
 *
 * Обрабатываются и touchend, и click: первый срабатывает на телефоне
 * быстрее, второй — на компьютере. Пауза FULLSCREEN_TOGGLE_GUARD_MS не даёт
 * двум событиям подряд включить и сразу выключить режим.
 */
function handleFullscreenToggle() {
  const now = performance.now();
  if (now - lastFullscreenToggle < FULLSCREEN_TOGGLE_GUARD_MS) return;
  lastFullscreenToggle = now;

  try {
    sound.unlock();      // жест пользователя — разрешаем звук
  } catch (error) {
    // Звук не критичен: полный экран всё равно включаем.
  }

  fullscreenApi.toggle();
  syncFullscreenButton();
}

// Прямые обработчики на самой кнопке. Никакой перехват preventDefault()
// не мешает: requestFullscreen вызывается напрямую из пользовательского жеста.
const fsButton = document.getElementById('fsButton');
if (fsButton) {
  fsButton.addEventListener('touchend', handleFullscreenToggle, { passive: true });
  fsButton.addEventListener('click', handleFullscreenToggle);
}

/* ============== 8. ЭКРАННОЕ УПРАВЛЕНИЕ ДЛЯ ТЕЛЕФОНА ======================= */

/** Радиусы «шайб» экранных органов управления. */
const STICK_KNOB_R = 24;
const FIRE_KNOB_R  = 26;

/**
 * Запекает «пиксельный» круг в отдельный холст. Экранные кнопки рисуются
 * теми же квадратиками, что и спрайты кораблей, поэтому интерфейс выглядит
 * цельным — и стоит всего одного drawImage на кнопку.
 *
 * @param {number} radius внешний радиус
 * @param {string} color цвет заливки
 * @param {number} cell размер «пикселя»
 * @param {number} inner внутренний радиус (0 — полный диск)
 * @returns {HTMLCanvasElement|null}
 */
function bakePixelDisc(radius, color, cell = 4, inner = 0) {
  const span = Math.ceil((radius * 2) / cell) * cell;
  const holder = document.createElement('canvas');
  holder.width = span;
  holder.height = span;

  const paint = holder.getContext('2d');
  if (!paint) return null;
  paint.imageSmoothingEnabled = false;
  paint.fillStyle = color;

  const center = span / 2;
  const steps = Math.ceil(radius / cell);
  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const px = center + gx * cell;
      const py = center + gy * cell;
      const distance = Math.hypot(px - center, py - center);
      if (distance > radius || distance < inner) continue;
      paint.fillRect(px - cell / 2, py - cell / 2, cell, cell);
    }
  }
  return holder;
}

/** Готовые картинки для экранных кнопок (запекаются один раз). */
const touchArt = {
  stickBase: null,   // прозрачный диск под пальцем
  stickRing: null,   // кольцо джойстика
  stickKnob: null,   // «шайба» под пальцем
  fireBase: null,    // кнопка огня
  fireHot: null,     // кнопка огня в момент выстрела
  fireRing: null,    // кольцо кнопки огня
  fireKnob: null,    // светлый центр кнопки огня
};

/** Готовит картинки экранных кнопок (вызывается один раз при запуске). */
function bakeTouchArt() {
  touchArt.stickBase = bakePixelDisc(STICK_RADIUS, COLORS.stickBase, 6);
  touchArt.stickRing = bakePixelDisc(STICK_RADIUS, COLORS.stickRing, 6, STICK_RADIUS - 5);
  touchArt.stickKnob = bakePixelDisc(STICK_KNOB_R, COLORS.stickKnob, 4);
  touchArt.fireBase  = bakePixelDisc(FIRE_BUTTON_R, COLORS.fireBase, 5);
  touchArt.fireHot   = bakePixelDisc(FIRE_BUTTON_R, COLORS.fireRing, 5);
  touchArt.fireRing  = bakePixelDisc(FIRE_BUTTON_R, COLORS.fireRing, 5, FIRE_BUTTON_R - 5);
  touchArt.fireKnob  = bakePixelDisc(FIRE_KNOB_R, COLORS.fireKnob, 4);
}

/**
 * Виртуальные органы управления телефона и планшета:
 *   • джойстик — появляется под пальцем и не уезжает за края поля;
 *   • кнопка FIRE — удержание даёт непрерывный огонь;
 *   • кнопка паузы — квадрат в правом верхнем углу.
 *
 * Касания раздаются по pointerId, поэтому движение и огонь работают
 * одновременно: можно вести корабль левым пальцем и стрелять правым.
 */
const touchControls = {
  stickId: null,        // pointerId, ведущий джойстик (null — джойстик свободен)
  stickBaseX: 0,        // центр кольца джойстика
  stickBaseY: 0,
  stickX: 0,            // текущее положение «шайбы»
  stickY: 0,
  fireId: null,         // pointerId, удерживающий кнопку огня
  pauseFlash: 0,        // короткая вспышка кнопки паузы после нажатия

  /** Центр кнопки огня. */
  fireX() { return CANVAS_WIDTH - FIRE_BUTTON_R - 26; },
  fireY() { return CANVAS_HEIGHT - FIRE_BUTTON_R - 26; },
  /** Центр кнопки паузы. */
  pauseX() { return CANVAS_WIDTH - PAUSE_BUTTON_R - 14; },
  pauseY() { return PAUSE_BUTTON_R + 14; },

  /** Ведёт ли палец джойстик прямо сейчас. */
  stickActive() { return this.stickId !== null; },
  /** Идёт ли огонь с экранной кнопки. */
  firing() { return this.fireId !== null; },

  /** Отклонение джойстика по X в долях радиуса. */
  axisX() { return (this.stickX - this.stickBaseX) / STICK_RADIUS; },
  /** Отклонение джойстика по Y в долях радиуса. */
  axisY() { return (this.stickY - this.stickBaseY) / STICK_RADIUS; },

  /**
   * Касание экрана. Возвращает true, если касание «съедено» экранной кнопкой
   * или джойстиком и не должно попадать в игровое поле.
   */
  pointerDown(event, point) {
    // 1. Кнопка паузы — доступна на любом экране.
    if (Math.hypot(point.x - this.pauseX(), point.y - this.pauseY()) <= PAUSE_BUTTON_R + 12) {
      this.pauseFlash = 0.25;
      togglePause();
      return true;
    }

    if (state.screen !== 'playing') return false;   // в меню поле свободно

    // 2. Кнопка огня в правом нижнем углу.
    if (Math.hypot(point.x - this.fireX(), point.y - this.fireY()) <= FIRE_BUTTON_R + 14) {
      this.fireId = event.pointerId;
      state.fireTimer = 0;                          // первый выстрел сразу
      return true;
    }

    // 3. Джойстик: рождается под пальцем, центр держим внутри поля.
    this.stickId = event.pointerId;
    this.stickBaseX = clamp(point.x, STICK_RADIUS, CANVAS_WIDTH - STICK_RADIUS);
    this.stickBaseY = clamp(point.y, STICK_RADIUS, CANVAS_HEIGHT - STICK_RADIUS);
    this.stickX = this.stickBaseX;
    this.stickY = this.stickBaseY;
    return true;
  },

  /** Палец поехал — тянем «шайбу» за собой, но не дальше кольца. */
  pointerMove(event) {
    if (event.pointerId !== this.stickId) return;

    const point = eventToField(event);
    let dx = point.x - this.stickBaseX;
    let dy = point.y - this.stickBaseY;
    const length = Math.hypot(dx, dy);
    if (length > STICK_RADIUS) {
      dx = (dx / length) * STICK_RADIUS;
      dy = (dy / length) * STICK_RADIUS;
    }
    this.stickX = this.stickBaseX + dx;
    this.stickY = this.stickBaseY + dy;
  },

  /** Палец оторвался: освобождаем джойстик или кнопку огня. */
  pointerUp(event) {
    if (event.pointerId === this.stickId) this.stickId = null;
    if (event.pointerId === this.fireId) this.fireId = null;
  },

  /** Отпускает всё сразу: смена экрана, потеря фокуса, пауза. */
  releaseAll() {
    this.stickId = null;
    this.fireId = null;
  },

  /** Рисует кнопки и джойстик поверх игрового поля. */
  draw() {
    if (!state.touch) return;
    const inBattle = state.screen === 'playing';

    // --- Кнопка паузы: две «пиксельные» полоски на квадрате ---
    if (inBattle || state.screen === 'paused') {
      const pr = PAUSE_BUTTON_R;
      const px = Math.round(this.pauseX());
      const py = Math.round(this.pauseY());
      ctx.globalAlpha = 0.8;
      drawPixelBox(px - pr, py - pr, pr * 2, pr * 2, COLORS.menuBorder, COLORS.stickBase, 3);
      ctx.fillStyle = COLORS.stickKnob;
      ctx.fillRect(px - 8, py - 10, 6, 20);
      ctx.fillRect(px + 2, py - 10, 6, 20);
      ctx.globalAlpha = 1;
    }

    if (!inBattle || !touchArt.fireBase) return;    // в меню поле чистое

    // --- Кнопка огня: светится, пока палец держит огонь ---
    const fx = Math.round(this.fireX());
    const fy = Math.round(this.fireY());
    const hot = this.firing();

    ctx.globalAlpha = hot ? 1 : 0.75;
    const disc = hot ? touchArt.fireHot : touchArt.fireBase;
    ctx.drawImage(disc, fx - disc.width / 2, fy - disc.height / 2);
    ctx.drawImage(touchArt.fireRing, fx - touchArt.fireRing.width / 2,
      fy - touchArt.fireRing.height / 2);

    ctx.globalAlpha = hot ? 1 : 0.6;
    ctx.drawImage(touchArt.fireKnob, fx - touchArt.fireKnob.width / 2,
      fy - touchArt.fireKnob.height / 2);
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px "Courier New", Consolas, monospace';
    ctx.fillStyle = hot ? '#2b0000' : 'rgba(255, 235, 235, .9)';
    ctx.fillText('ОГОНЬ', fx, fy + FIRE_KNOB_R + 18);

    // --- Джойстик: кольцо и шайба там, где лежит палец ---
    if (this.stickActive() && touchArt.stickBase) {
      const bx = Math.round(this.stickBaseX);
      const by = Math.round(this.stickBaseY);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(touchArt.stickBase, bx - touchArt.stickBase.width / 2,
        by - touchArt.stickBase.height / 2);
      ctx.drawImage(touchArt.stickRing, bx - touchArt.stickRing.width / 2,
        by - touchArt.stickRing.height / 2);
      ctx.drawImage(touchArt.stickKnob,
        Math.round(this.stickX - touchArt.stickKnob.width / 2),
        Math.round(this.stickY - touchArt.stickKnob.height / 2));
      ctx.globalAlpha = 1;
    }
  },
};

/**
 * Собирает «намерение» игрока изо всех устройств ввода: клавиатура и стрелки
 * плюс экранный джойстик дают движение, мышь и кнопка огня — стрельбу.
 */
function readInput() {
  let dx = 0;
  let dy = 0;
  if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
  if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  dy += 1;

  // Джойстик даёт аналоговое отклонение, поэтому у него есть мёртвая зона.
  if (state.touch && touchControls.stickActive()) {
    const ax = clamp(touchControls.axisX(), -1, 1);
    const ay = clamp(touchControls.axisY(), -1, 1);
    if (Math.hypot(ax, ay) > STICK_DEAD_ZONE) {
      dx += ax;
      dy += ay;
    }
  }

  input.moveX = clamp(dx, -1, 1);
  input.moveY = clamp(dy, -1, 1);
  input.firing = mouse.down || (state.touch && touchControls.firing());
}

/**
 * Выбирает точку, в которую стреляет страж.
 *
 * С мышью всё просто — стреляем в курсор. На телефоне включается автонаведение:
 * ищем ближайшую цель (враг или босс); если целей нет — стреляем туда, куда
 * ведёт джойстик, а в самом крайнем случае — прямо вверх.
 */
function updateAim() {
  const player = state.player;
  if (!player) return;

  if (!state.touchAim) {              // точный прицел мышью
    state.aimX = mouse.x;
    state.aimY = mouse.y;
    return;
  }

  let target = null;
  let bestDistance = Infinity;
  for (const enemy of state.enemies) {
    const distance = Math.hypot(enemy.x + enemy.w / 2 - player.cx, enemy.y + enemy.h / 2 - player.cy);
    if (distance < bestDistance) {
      bestDistance = distance;
      target = enemy;
    }
  }
  if (state.boss) {
    const distance = Math.hypot(state.boss.cx - player.cx, state.boss.cy - player.cy);
    if (distance < bestDistance) target = state.boss;
  }

  if (target) {
    state.aimX = target.x + target.w / 2;
    state.aimY = target.y + target.h / 2;
    return;
  }

  if (state.touch && touchControls.stickActive()) {
    const ax = touchControls.axisX();
    const ay = touchControls.axisY();
    if (Math.hypot(ax, ay) > STICK_DEAD_ZONE) {
      state.aimX = player.cx + ax * 220;
      state.aimY = player.cy + ay * 220;
      return;
    }
  }

  state.aimX = player.cx;             // целей нет — стреляем вверх
  state.aimY = player.cy - 220;
}

/* ============================= 9. ЛОГИКА ИГРЫ ============================== */

/**
 * Полный сброс мира. Вызывается при старте забега и после проигрыша.
 * Экран при этом не меняется — этим занимается setScreen().
 */
function resetGame() {
  state.player = new Player();
  state.bullets = [];
  state.enemies = [];
  state.particles = [];
  state.score = 0;
  state.time = 0;
  state.spawnTimer = ENEMY_SPAWN_START;
  state.fireTimer = 0;
  state.muzzle = 0;
  state.shake = 0;
  state.touchHint = state.touch ? 6 : 0;   // подсказка про джойстик для новичков

  // Новая игра всегда начинается с первого уровня.
  state.level = 1;
  state.kills = 0;
  state.boss = null;
  state.bossWarnTimer = 0;
  state.enemyBullets = [];
  state.powerups = [];
  state.weaponTimer = 0;
  state.aimX = CANVAS_WIDTH / 2;
  state.aimY = CANVAS_HEIGHT / 2;
  announce('LEVEL 1', ANNOUNCE_TIME);
}

/** Пауза между спавнами: дольше играешь и выше уровень — враги приходят чаще. */
function getSpawnInterval() {
  const fromTime = ENEMY_SPAWN_START - state.time * SPAWN_RAMP;
  const fromLevel = (state.level - 1) * 0.05;
  return Math.max(ENEMY_SPAWN_MIN, fromTime - fromLevel);
}

/** Скорость врага: растёт со временем и с уровнем, плюс немного случайности. */
function getEnemySpeed() {
  return ENEMY_BASE_SPEED + state.time * ENEMY_SPEED_GROWTH
    + (state.level - 1) * 10 + rand(-10, 15);
}

/** Показывает объявление по центру экрана (LEVEL n, WARNING!, бонусы). */
function announce(text, time = ANNOUNCE_TIME) {
  state.announce = text;
  state.announceTimer = time;
}

/** Создаёт облачко «пиксельных» частиц в точке (x, y) — эффект взрыва. */
function spawnExplosion(x, y, color, count = EXPLOSION_PARTS) {
  for (let i = 0; i < count; i++) {
    state.particles.push(new Particle(x, y, color));
  }
}

/** Создаёт врага. Иногда попадается редкий «носитель» с бонусом. */
function spawnEnemy() {
  const rare = Math.random() < RARE_ENEMY_CHANCE;
  const speed = getEnemySpeed() * (rare ? 1.35 : 1);
  state.enemies.push(new Enemy(speed, rare));
}

/**
 * Сбрасывает бонус в точке (x, y).
 * @param {'medkit'|'weapon'} [forcedType] если не указан, тип выбирается случайно
 */
function dropPowerUp(x, y, forcedType) {
  const type = forcedType || (Math.random() < 0.5 ? 'medkit' : 'weapon');
  state.powerups.push(new PowerUp(x, y, type));
}

/** Урон стражу: жизнь, звук, тряска экрана. true — если это конец игры. */
function damagePlayer() {
  const player = state.player;
  if (!player.takeDamage()) return false;

  state.shake = 0.35;   // встряхнули экран — попадание ощутимо
  sound.damage();
  if (player.lives <= 0) {
    saveBestScore();      // рекорд сохраняем сразу, чтобы он не потерялся
    setScreen('over');    // экран проигрыша с итогами забега
    sound.gameOver();
    return true;
  }
  return false;
}

/** Применяет подобранный бонус. */
function applyPowerUp(type) {
  if (type === 'medkit') {
    if (state.player.lives < MAX_LIVES) {
      state.player.lives += 1;
      announce('LIFE +1', 1.4);
    } else {
      announce('LIFE IS FULL', 1.4);
    }
  } else {
    state.weaponTimer = WEAPON_TIME;
    announce('WEAPON UPGRADED', 1.4);
  }
  sound.powerup();
}

/** Победа над боссом: очки, награда и переход на следующий уровень. */
function defeatBoss(boss) {
  state.boss = null;
  state.score += BOSS_SCORE * boss.level;

  // Большой взрыв на месте босса.
  for (let i = 0; i < 6; i++) {
    spawnExplosion(boss.x + rand(0, boss.w), boss.y + rand(0, boss.h), COLORS.bossCore);
  }
  sound.bossDown();

  state.level += 1;
  state.kills = 0;
  // Награда за уровень — дополнительная жизнь (не выше предела).
  if (state.player.lives < MAX_LIVES) state.player.lives += 1;
  announce('LEVEL ' + state.level, ANNOUNCE_TIME);
  state.spawnTimer = 2.2;   // небольшая передышка перед новым уровнем
}

/**
 * Логика уровней: обычный спавн -> «WARNING!» -> бой с боссом -> новый уровень.
 * Пока идёт бой с боссом, обычные враги не появляются.
 */
function updateLevelFlow(dt) {
  if (state.announceTimer > 0) state.announceTimer = Math.max(0, state.announceTimer - dt);
  if (state.weaponTimer > 0) state.weaponTimer = Math.max(0, state.weaponTimer - dt);

  // 1. Босс уже на поле — обычный спавн на паузе.
  if (state.boss) return;

  // 2. Идёт отсчёт тревоги: по его окончании вылетает босс.
  if (state.bossWarnTimer > 0) {
    state.bossWarnTimer -= dt;
    if (state.bossWarnTimer <= 0) {
      state.boss = new Boss(state.level);
      announce('BOSS  LV.' + state.level, 2.4);
      sound.levelUp();
    }
    return;
  }

  // 3. Набрали нужное число сбитых врагов — объявляем тревогу.
  if (state.kills >= KILLS_PER_LEVEL) {
    state.bossWarnTimer = BOSS_WARN_TIME;
    announce('WARNING!  BOSS INCOMING', BOSS_WARN_TIME);
    sound.bossWarn();
    return;
  }

  // 4. Обычный спавн врагов сверху.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = getSpawnInterval();
  }
}

/** Выстрел стража в сторону прицела (мышь или автонаведение телефона). */
function shoot() {
  const player = state.player;

  // Вектор «от центра стража к прицелу», приведённый к единичной длине.
  let dx = state.aimX - player.cx;
  let dy = state.aimY - player.cy;
  const length = Math.hypot(dx, dy) || 1; // || 1 защищает от деления на ноль
  dx /= length;
  dy /= length;

  // Базовый угол выстрела и лучи: с усилением стреляем веером из трёх снарядов.
  const baseAngle = Math.atan2(dy, dx);
  const offsets = state.weaponTimer > 0 ? [-WEAPON_SPREAD, 0, WEAPON_SPREAD] : [0];

  for (const offset of offsets) {
    const angle = baseAngle + offset;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    // Снаряд рождается у края корабля стража, а не в его центре.
    state.bullets.push(new Bullet(
      player.cx + dirX * (player.w / 2),
      player.cy + dirY * (player.h / 2),
      dirX,
      dirY
    ));
  }

  state.muzzle = MUZZLE_TIME;  // вспышка у дула на пару кадров
  sound.shoot();               // звук выстрела (Web Audio API)
}

/** Обновление всего мира за dt секунд. */
function update(dt) {
  // Мир живёт только в бою: в меню, на паузе и на экране итогов он «замирает».
  if (state.screen !== 'playing') return;

  const player = state.player;
  state.time += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (state.muzzle > 0) state.muzzle = Math.max(0, state.muzzle - dt);

  // --- 1. Ввод и прицел: клавиатура, мышь и экранный джойстик ---
  readInput();
  updateAim();

  // --- 2. Страж: движение ---
  player.update(dt);

  // --- 3. Стрельба: мышь, палец на кнопке огня или удержание ЛКМ ---
  state.fireTimer -= dt;
  if (input.firing && state.fireTimer <= 0) {
    shoot();
    // С усилением выстрела перезарядка короче — стреляем быстрее.
    state.fireTimer = FIRE_COOLDOWN * (state.weaponTimer > 0 ? WEAPON_COOLDOWN_MUL : 1);
  }

  // --- 3. Уровни: обычные враги, тревога и бой с боссом ---
  updateLevelFlow(dt);

  // --- 4. Движение и таймеры всех объектов ---
  for (const bullet of state.bullets) bullet.update(dt);
  for (const enemy of state.enemies) enemy.update(dt);
  for (const particle of state.particles) particle.update(dt);
  for (const powerup of state.powerups) powerup.update(dt);
  for (const bullet of state.enemyBullets) bullet.update(dt);
  if (state.boss) state.boss.update(dt);

  // --- 5. Столкновения «снаряд × враг»: попадание, очки и бонусы ---
  for (const bullet of state.bullets) {
    if (bullet.dead) continue;
    for (const enemy of state.enemies) {
      if (enemy.dead || !overlaps(bullet, enemy)) continue;
      bullet.dead = true;

      if (enemy.takeHit()) {
        // Корабль уничтожен: очки, прогресс уровня, взрыв и, возможно, бонус.
        enemy.dead = true;
        state.kills += 1;
        state.score += SCORE_PER_KILL * (enemy.rare ? RARE_SCORE_MUL : 1);
        spawnExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2,
          enemy.rare ? COLORS.carrier : COLORS.enemy);
        sound.explode();  // враг уничтожен — играем взрыв
        if (enemy.rare || Math.random() < POWERUP_DROP_CHANCE) {
          dropPowerUp(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
        }
      } else {
        // Попали, но враг ещё жив (редкий носитель держит два попадания).
        spawnExplosion(bullet.x, bullet.y, COLORS.carrier, 3);
        sound.bossHit();
      }
      break; // один снаряд — одно попадание
    }
  }

  // --- 6. Попадания по боссу ---
  if (state.boss) {
    for (const bullet of state.bullets) {
      if (bullet.dead || !overlaps(bullet, state.boss)) continue;
      bullet.dead = true;
      spawnExplosion(bullet.x, bullet.y, COLORS.bossCore, 4);

      if (state.boss.takeHit()) {
        defeatBoss(state.boss);   // босс уничтожен: очки, награда и новый уровень
        break;
      }
      sound.bossHit();

      // На половине здоровья босс теряет аптечку — награда в середине боя.
      if (!state.boss.rewardDropped && state.boss.hp <= state.boss.maxHp / 2) {
        state.boss.rewardDropped = true;
        dropPowerUp(state.boss.cx, state.boss.cy + state.boss.h / 2, 'medkit');
      }
    }
  }

  // --- 7. Столкновения «враг × игрок»: страж теряет жизнь ---
  for (const enemy of state.enemies) {
    if (enemy.dead || !overlaps(enemy, player)) continue;

    enemy.dead = true;
    spawnExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2,
      enemy.rare ? COLORS.carrier : COLORS.enemy);
    sound.explode();  // враг разбился о корабль
    if (damagePlayer()) break;
  }

  // --- 8. Попадания снарядов босса по стражу ---
  for (const bullet of state.enemyBullets) {
    if (bullet.dead || !overlaps(bullet, player)) continue;

    bullet.dead = true;
    spawnExplosion(bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, COLORS.bossBullet, 5);
    sound.explode();
    if (damagePlayer()) break;
  }

  // --- 9. Подбор бонусов стражем ---
  for (const powerup of state.powerups) {
    if (powerup.dead || !overlaps(powerup, player)) continue;

    powerup.dead = true;
    spawnExplosion(powerup.x + powerup.w / 2, powerup.y + powerup.h / 2,
      powerup.type === 'medkit' ? COLORS.medkit : COLORS.weapon, 6);
    applyPowerUp(powerup.type);
  }

  // --- 10. Удаляем «мёртвые» объекты одним проходом ---
  state.bullets = state.bullets.filter((bullet) => !bullet.dead);
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  state.particles = state.particles.filter((particle) => !particle.dead);
  state.powerups = state.powerups.filter((powerup) => !powerup.dead);
  state.enemyBullets = state.enemyBullets.filter((bullet) => !bullet.dead);
}

/* ============================== 11. ОТРИСОВКА ============================== */

/**
 * Пиксельный прицел вместо системного курсора (курсор скрыт в CSS).
 * На телефоне прицел показывает, куда ведёт автонаведение, а от корабля
 * к цели тянется пунктирная линия — так понятно, по кому идёт огонь.
 */
function drawCrosshair() {
  const x = Math.round(state.aimX);
  const y = Math.round(state.aimY);
  const player = state.player;

  if (state.touchAim && player) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = COLORS.crosshair;
    for (let i = 1; i <= 9; i++) {
      const t = i / 10;
      ctx.fillRect(
        Math.round(player.cx + (state.aimX - player.cx) * t),
        Math.round(player.cy + (state.aimY - player.cy) * t),
        2, 2
      );
    }
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = COLORS.crosshair;
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Четыре «луча» с разрывом в центре — классический прицел.
  ctx.moveTo(x - 10, y + 0.5);
  ctx.lineTo(x - 3, y + 0.5);
  ctx.moveTo(x + 3, y + 0.5);
  ctx.lineTo(x + 10, y + 0.5);
  ctx.moveTo(x + 0.5, y - 10);
  ctx.lineTo(x + 0.5, y - 3);
  ctx.moveTo(x + 0.5, y + 3);
  ctx.lineTo(x + 0.5, y + 10);
  ctx.stroke();
}

/** HUD: счёт, уровень, прогресс до босса, время, жизни и статусы. */
function drawHud() {
  const player = state.player;
  const fontSize = 'bold 18px "Courier New", Consolas, monospace';
  const smallFont = '14px "Courier New", Consolas, monospace';

  // --- Счёт (Score) слева сверху ---
  ctx.font = fontSize;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hud;
  // padStart добавляет нули: SCORE: 00030
  ctx.fillText('SCORE: ' + String(state.score).padStart(5, '0'), 16, 28);

  // --- Рекорд: под счётом, чтобы всегда был перед глазами ---
  ctx.font = smallFont;
  ctx.fillStyle = COLORS.menuGold;
  ctx.fillText('BEST: ' + String(Math.max(state.best, state.score)).padStart(5, '0'), 16, 50);

  // --- Уровень и прогресс до босса (третья строка слева) ---
  const progress = Math.min(state.kills, KILLS_PER_LEVEL);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('LEVEL ' + state.level + '   ·   BOSS IN ' + (KILLS_PER_LEVEL - progress),
    16, 70);

  // Полоска прогресса уровня: видно, сколько врагов осталось до босса.
  const progressWidth = 240;
  ctx.fillStyle = 'rgba(127, 212, 255, .18)';
  ctx.fillRect(16, 78, progressWidth, 6);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(16, 78, (progressWidth * progress) / KILLS_PER_LEVEL, 6);

  // --- Время по центру (показывает, как долго длится забег) ---
  ctx.font = fontSize;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('TIME ' + state.time.toFixed(1) + 's', CANVAS_WIDTH / 2, 28);

  // --- Жизни справа: заполненные ячейки и пустые «слоты» до предела ---
  const size = 14;
  const gap = 8;
  const rowWidth = MAX_LIVES * size + (MAX_LIVES - 1) * gap;

  ctx.textAlign = 'right';
  ctx.font = smallFont;
  ctx.fillStyle = COLORS.hud;
  ctx.fillText('LIVES', CANVAS_WIDTH - 16 - rowWidth - 10, 28);

  for (let i = 0; i < MAX_LIVES; i++) {
    const x = CANVAS_WIDTH - 16 - rowWidth + i * (size + gap);
    if (i < player.lives) {
      drawPixelBox(x, 14, size, size, COLORS.playerDark, COLORS.player, 2);
    } else {
      drawPixelBox(x, 14, size, size, COLORS.emptySlot, COLORS.emptySlotIn, 2);
    }
  }

  // --- Статус усиления выстрела (сколько секунд ещё действует) ---
  if (state.weaponTimer > 0) {
    const barWidth = 160;
    ctx.textAlign = 'right';
    ctx.font = smallFont;
    ctx.fillStyle = COLORS.weapon;
    ctx.fillText('WEAPON ' + state.weaponTimer.toFixed(1) + 's', CANVAS_WIDTH - 16, 50);

    ctx.fillStyle = 'rgba(255, 209, 102, .22)';
    ctx.fillRect(CANVAS_WIDTH - 16 - barWidth, 58, barWidth, 6);
    ctx.fillStyle = COLORS.weapon;
    ctx.fillRect(CANVAS_WIDTH - 16 - barWidth, 58,
      (barWidth * state.weaponTimer) / WEAPON_TIME, 6);
  }

  // --- Индикатор звука и подсказка про джойстик внизу слева ---
  ctx.textAlign = 'left';
  ctx.font = smallFont;

  if (state.touch) {
    // На телефоне клавиш нет, поэтому подсказываем экранное управление.
    if (state.touchHint > 0) {
      ctx.globalAlpha = Math.min(1, state.touchHint);
      ctx.fillStyle = COLORS.accent;
      ctx.fillText('ДЖОЙСТИК — ЛЮБОЕ МЕСТО СЛЕВА · КНОПКА — ОГОНЬ', 16, CANVAS_HEIGHT - 14);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = sound.muted ? 'rgba(223, 233, 255, .35)' : COLORS.accent;
    ctx.fillText(sound.muted ? 'M: SOUND OFF' : 'M: SOUND ON', 16, CANVAS_HEIGHT - 14);
  }
}

/**
 * Полоска здоровья босса (HP Bar) сверху экрана.
 * Появляется вместе с боссом и гаснет, когда он уничтожен.
 */
function drawBossBar() {
  const boss = state.boss;
  if (!boss) return;

  const barWidth = 420;
  const barHeight = 16;
  const x = (CANVAS_WIDTH - barWidth) / 2;
  const y = 46;

  // Полупрозрачная подложка: полоска читается поверх звёзд и пламени босса.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x - 30, 34, barWidth + 60, barHeight + 22);
  ctx.globalAlpha = 1;
  const filled = Math.max(0, (barWidth * boss.hp) / boss.maxHp);

  // Подпись слева и числом справа.
  ctx.font = 'bold 16px "Courier New", Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.boss;
  ctx.fillText('BOSS  LV.' + boss.level, x, y - 8);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hud;
  ctx.fillText(boss.hp + ' / ' + boss.maxHp, x + barWidth, y - 8);

  // Рамка и заливка.
  ctx.fillStyle = COLORS.hpBarEmpty;
  ctx.fillRect(x - 3, y - 3, barWidth + 6, barHeight + 6);
  ctx.fillStyle = COLORS.hpBarFill;
  ctx.fillRect(x, y, filled, barHeight);

  // Деления каждые 10% — видно, сколько здоровья осталось.
  ctx.fillStyle = 'rgba(6, 10, 22, .55)';
  for (let i = 1; i < 10; i++) {
    ctx.fillRect(x + (barWidth * i) / 10, y, 2, barHeight);
  }

  // Светлая кромка у остатка здоровья — «бежит» вместе с полоской.
  ctx.fillStyle = '#ffd0d0';
  ctx.fillRect(x + Math.max(0, filled - 2), y, 2, barHeight);
}

/** Объявление по центру экрана (LEVEL n, WARNING!, бонусы) с плавным гашением. */
function drawAnnouncement() {
  if (state.announceTimer <= 0 || !state.announce) return;

  const alpha = Math.min(1, state.announceTimer / 0.6);  // последние 0.6 с — плавно таем
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px "Courier New", Consolas, monospace';

  // Тень, чтобы текст читался на любом фоне.
  ctx.fillStyle = 'rgba(6, 10, 22, .8)';
  ctx.fillText(state.announce, CANVAS_WIDTH / 2 + 3, CANVAS_HEIGHT / 2 + 3);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(state.announce, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.restore();
}

/* ============ 10. ИНТЕРФЕЙС: ЭКРАНЫ МЕНЮ, ПАУЗЫ И ИТОГОВ ================== */

/** Кнопки текущего экрана: их рисует и опрашивает объект ui. */
let uiButtons = [];

/**
 * Простое меню на «пиксельных» кнопках. Работает и мышью, и пальцем,
 * и клавиатурой: стрелки/WASD водят выбор, Enter нажимает кнопку.
 */
const ui = {
  index: 0,          // выбранная кнопка (для управления с клавиатуры)
  hoverId: null,     // кнопка под курсором мыши
  keyboardNav: false,// последним вводом была клавиатура

  /** Кнопка, лежащая под точкой, или null. */
  buttonAt(x, y) {
    for (const button of uiButtons) {
      if (x >= button.x && x <= button.x + button.w &&
          y >= button.y && y <= button.y + button.h) {
        return button;
      }
    }
    return null;
  },

  /** Подсветка кнопки под курсором (мышь). */
  hoverAt(x, y) {
    const button = this.buttonAt(x, y);
    const id = button ? button.id : null;
    if (id === this.hoverId) return;

    this.hoverId = id;
    this.keyboardNav = false;
    if (button) {
      sound.uiMove();
      const index = uiButtons.indexOf(button);
      if (index >= 0) this.index = index;
    }
  },

  /** Сдвиг выбора стрелками вверх/вниз. */
  move(step) {
    if (!uiButtons.length) return;
    this.index = (this.index + step + uiButtons.length) % uiButtons.length;
    this.hoverId = null;
    this.keyboardNav = true;
    sound.uiMove();
  },

  /** Нажатие кнопки, выбранной клавиатурой. */
  activate() {
    const button = uiButtons[this.index];
    if (button) pressButton(button);
  },

  /** Рисует кнопки текущего экрана. */
  draw() {
    uiButtons.forEach((button, index) => {
      const active = button.id === this.hoverId || (this.keyboardNav && index === this.index);
      drawMenuButton(button, active);
    });
  },
};

/**
 * Кнопка, отцентрованная по горизонтали поля.
 * primary помечает главное действие экрана — такую кнопку рисуем крупнее
 * и со свечением, чтобы на неё сразу падал взгляд.
 */
function makeButton(id, label, y, action, width = MENU_BUTTON_WIDTH, height = MENU_BUTTON_HEIGHT, primary = false) {
  return { id, label, y, action, primary, x: (CANVAS_WIDTH - width) / 2, w: width, h: height };
}

/** Нажатие кнопки меню: разрешаем звук, играем «бип» и выполняем действие. */
function pressButton(button) {
  sound.unlock();
  sound.uiSelect();
  if (button.action) button.action();
}

/** Подпись пункта «звук» с текущим состоянием. */
function soundLabel() {
  return sound.muted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ';
}

/** Подпись пункта сенсорного управления. */
function touchLabel() {
  return state.touch ? 'ТЕЛЕФОН: ВКЛ' : 'ТЕЛЕФОН: ВЫКЛ';
}

/** Включает/выключает звук и обновляет подписи кнопок. */
function toggleSound() {
  sound.toggleMute();
  buildScreen(state.screen);
}

/** Включает/выключает экранные органы управления. */
function toggleTouchControls() {
  state.touch = !state.touch;
  touchControls.releaseAll();
  buildScreen(state.screen);
}

/** Начинает новый забег: сброс мира и переход в бой. */
function startGame() {
  resetGame();
  setScreen('playing');
}

/** Пауза и продолжение — клавишей P или экранной кнопкой на телефоне. */
function togglePause() {
  if (state.screen === 'playing') setScreen('paused');
  else if (state.screen === 'paused') setScreen('playing');
}

/**
 * Переключает экран: сбрасывает зажатые кнопки, гасит огонь и собирает
 * набор кнопок для нового экрана.
 */
function setScreen(screen) {
  state.screen = screen;
  touchControls.releaseAll();
  mouse.down = false;
  input.firing = false;
  if (screen === 'playing') state.touchHint = Math.max(state.touchHint, 4);
  buildScreen(screen);
}

/** Собирает кнопки для указанного экрана. */
function buildScreen(screen) {
  ui.hoverId = null;

  if (screen === 'menu') {
    // «НАЧАТЬ ИГРУ» — главная кнопка: шире прочих и помечена как primary.
    uiButtons = [
      makeButton('play', 'НАЧАТЬ ИГРУ', 300, startGame, 360, 60, true),
      makeButton('howto', 'КАК ИГРАТЬ', 374, () => setScreen('howto')),
      makeButton('sound', soundLabel(), 432, toggleSound),
      makeButton('touch', touchLabel(), 490, toggleTouchControls),
    ];
  } else if (screen === 'howto') {
    uiButtons = [makeButton('back', 'НАЗАД', 524, () => setScreen('menu'))];
  } else if (screen === 'paused') {
    uiButtons = [
      makeButton('resume', 'ПРОДОЛЖИТЬ', 296, () => setScreen('playing')),
      makeButton('restart', 'НАЧАТЬ ЗАНОВО', 362, startGame),
      makeButton('sound', soundLabel(), 428, toggleSound),
      makeButton('menu', 'ГЛАВНОЕ МЕНЮ', 494, () => setScreen('menu')),
    ];
  } else if (screen === 'over') {
    uiButtons = [
      makeButton('again', 'ЕЩЁ РАЗ', 372, startGame),
      makeButton('menu', 'ГЛАВНОЕ МЕНЮ', 438, () => setScreen('menu')),
    ];
  } else {
    uiButtons = [];               // на экране боя кнопок нет
  }

  ui.index = 0;
  ui.keyboardNav = false;
}

/* --------------------------- Помощники отрисовки -------------------------- */

/** Строка текста с центровкой по горизонтали поля. */
function textCenter(text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

/** Строка текста с выравниванием по левому краю. */
function textLeft(text, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

/** Затемнение под экраном: космос остаётся виден, но текст читается. */
function drawScreenShade(alpha = 0.78) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.globalAlpha = 1;
}

/**
 * Пиксельная кнопка меню: тень, двойная рамка, подпись и «шевроны»
 * по краям у активной кнопки.
 */
function drawMenuButton(button, active) {
  const { x, y, w, h } = button;
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const primary = button.primary;

  // Главная кнопка пульсирует мягким неоновым свечением — приглашение начать.
  // Тень рисуется у непрозрачной заливки: её след и есть ореол вокруг кнопки,
  // а сам прямоугольник затем полностью перекрывается корпусом кнопки ниже.
  if (primary) {
    const pulse = 0.30 + Math.sin(state.uiTime * 2.6) * 0.16;
    ctx.save();
    ctx.shadowColor = COLORS.buttonGlow + pulse.toFixed(3) + ')';
    ctx.shadowBlur = 22;
    ctx.fillStyle = COLORS.menuButton;
    ctx.fillRect(x0, y0, w, h);
    ctx.restore();
  }

  ctx.fillStyle = COLORS.menuShadow;                     // тень под кнопкой
  ctx.fillRect(x0 + 4, y0 + 4, w, h);

  drawPixelBox(x0, y0, w, h,
    active || primary ? COLORS.menuBorderHi : COLORS.menuBorder,
    active ? COLORS.menuButtonHi : COLORS.menuButton, 4);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = primary
    ? 'bold 26px "Courier New", Consolas, monospace'
    : 'bold 21px "Courier New", Consolas, monospace';
  ctx.fillStyle = active || primary ? COLORS.menuTextHi : COLORS.menuText;
  ctx.fillText(button.label, x0 + w / 2, y0 + h / 2 + 1);

  if (active) {                                          // «шевроны» выбора
    ctx.fillStyle = COLORS.menuBorderHi;
    const cy = y0 + h / 2;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x0 + 14 + i * 5, cy - 6 + i * 4, 4, 4);
      ctx.fillRect(x0 + 14 + i * 5, cy + 6 - i * 4, 4, 4);
      ctx.fillRect(x0 + w - 18 - i * 5, cy - 6 + i * 4, 4, 4);
      ctx.fillRect(x0 + w - 18 - i * 5, cy + 6 - i * 4, 4, 4);
    }
  }
}

/* ------------------------------- Экраны меню ------------------------------ */

/**
 * Крупное название «PixelGuardian» для стартового экрана.
 *
 * Название состоит из двух слов разных цветов, поэтому ширину каждого
 * измеряем отдельно и центрируем уже готовую «склейку» целиком.
 */
function drawGameTitle(y) {
  const left = 'Pixel';
  const right = 'Guardian';
  // 13 символов × ~0.6em × 74px ≈ 577px — название широкое, но в 800px укладывается.
  const font = 'bold 74px "Courier New", Consolas, monospace';

  ctx.font = font;
  const leftWidth = ctx.measureText(left).width;
  const rightWidth = ctx.measureText(right).width;
  const startX = (CANVAS_WIDTH - leftWidth - rightWidth) / 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 1. Неоновый ореол: рисуем название с размытой тенью-подсветкой.
  ctx.save();
  ctx.shadowColor = COLORS.titleGlow + '0.55)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = COLORS.menuTitle;
  ctx.fillText(left, startX, y);
  ctx.fillText(right, startX + leftWidth, y);
  ctx.restore();

  // 2. Тёмный «объём» со смещением — название читается на любом фоне.
  ctx.fillStyle = COLORS.titleShadow;
  ctx.fillText(left, startX + 3, y + 4);
  ctx.fillText(right, startX + leftWidth + 3, y + 4);

  // 3. Само название: «Pixel» светлый, «Guardian» неоновый.
  ctx.fillStyle = COLORS.titleTop;
  ctx.fillText(left, startX, y);
  ctx.fillStyle = COLORS.menuTitle;
  ctx.fillText(right, startX + leftWidth, y);
}

/** Главное меню: крупное название, корабль-витрина, рекорд и кнопки. */
function drawMenuScreen() {
  drawScreenShade(0.72);

  // Крупное название игры — визитная карточка стартового экрана.
  drawGameTitle(132);

  textCenter('ЗАЩИТИ СЕКТОР ОТ ВТОРЖЕНИЯ', 164,
    '14px "Courier New", Consolas, monospace', COLORS.menuDim);

  // Корабль-витрина плавно покачивается между названием и кнопками.
  const bob = Math.round(Math.sin(state.uiTime * 1.6) * 6);
  const shipX = Math.round(CANVAS_WIDTH / 2 - PLAYER_SIZE / 2);
  const shipY = 192 + bob;

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = COLORS.flameOuter;
  for (const column of PLAYER_NOZZLES) {
    const flame = 6 + Math.abs(Math.sin(state.uiTime * 12 + column)) * 10;
    ctx.fillRect(shipX + column * PLAYER_PIXEL, shipY + PLAYER_SIZE, PLAYER_PIXEL * 2, flame);
  }
  ctx.globalAlpha = 1;
  drawSprite('player', SPRITES.player, PLAYER_PIXEL, PALETTES.player, shipX, shipY);

  textCenter('РЕКОРД: ' + String(state.best).padStart(5, '0'), 282,
    'bold 17px "Courier New", Consolas, monospace', COLORS.menuGold);

  textCenter('↑ ↓ — выбор · ENTER — пуск · ESC — меню', 574,
    '13px "Courier New", Consolas, monospace', COLORS.menuDim);
}

/** Экран «КАК ИГРАТЬ»: подсказки по управлению и бонусам. */
function drawHowToScreen() {
  drawScreenShade(0.88);

  textCenter('КАК ИГРАТЬ', 74, 'bold 34px "Courier New", Consolas, monospace', COLORS.menuTitle);

  const label = 'bold 15px "Courier New", Consolas, monospace';
  const body = '15px "Courier New", Consolas, monospace';
  const left = 96;
  let y = 124;

  /** Печатает заголовок блока и список строк под ним. */
  const block = (title, lines) => {
    textLeft(title, left, y, label, COLORS.menuGold);
    y += 24;
    for (const line of lines) {
      textLeft(line, left + 12, y, body, COLORS.hud);
      y += 21;
    }
    y += 10;
  };

  block('КОМПЬЮТЕР', [
    'WASD или ← ↑ → ↓ — движение стража',
    'Мышь — прицел, ЛКМ (удерживать) — огонь',
    'P или ESC — пауза, M — звук, R — заново',
  ]);
  block('ТЕЛЕФОН', [
    'Любое место слева — джойстик движения',
    'Кнопка «ОГОНЬ» справа внизу — стрельба',
    'Огонь сам наводится на ближайшего врага',
    'Квадрат в правом верхнем углу — пауза',
  ]);
  block('БОНУСЫ И ЦЕЛИ', [
    'Зелёная аптечка — +1 жизнь (максимум 5)',
    'Жёлтая стрелка — усиленный выстрел, 12 секунд',
    'Каждые ' + KILLS_PER_LEVEL + ' сбитых врагов — босс уровнем выше',
  ]);

  ctx.strokeStyle = COLORS.menuBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(74.5, 96.5, CANVAS_WIDTH - 149, 402);
}

/** Экран паузы: мир замирает за полупрозрачной панелью. */
function drawPauseScreen() {
  drawScreenShade(0.72);

  textCenter('PAUSE', 150, 'bold 56px "Courier New", Consolas, monospace', '#0b2a4a');
  textCenter('PAUSE', 146, 'bold 56px "Courier New", Consolas, monospace', COLORS.menuTitle);
  textCenter('Игра приостановлена', 186,
    '16px "Courier New", Consolas, monospace', COLORS.menuDim);

  // Промежуточные итоги забега — видно, к чему возвращаться.
  textCenter('ОЧКИ: ' + state.score + '   ·   УРОВЕНЬ: ' + state.level +
    '   ·   ВРЕМЯ: ' + state.time.toFixed(1) + 'с', 236,
    'bold 17px "Courier New", Consolas, monospace', COLORS.hud);
}

/** Экран проигрыша: результаты забега, рекорд и кнопки. */
function drawGameOverScreen() {
  drawScreenShade(0.82);

  textCenter('GAME OVER', 168, 'bold 54px "Courier New", Consolas, monospace', '#3b0b18');
  textCenter('GAME OVER', 164, 'bold 54px "Courier New", Consolas, monospace', '#ff6b6b');
  textCenter('СЕКТОР ПОТЕРЯН', 204,
    '16px "Courier New", Consolas, monospace', COLORS.menuDim);

  const isRecord = state.score > 0 && state.score >= state.best;
  textCenter(
    'ОЧКИ: ' + state.score + '   ·   УРОВЕНЬ: ' + state.level +
    '   ·   ВРЕМЯ: ' + state.time.toFixed(1) + 'с',
    256, 'bold 18px "Courier New", Consolas, monospace', COLORS.hud
  );
  textCenter(
    isRecord ? 'НОВЫЙ РЕКОРД!' : 'РЕКОРД: ' + state.best,
    292, 'bold 20px "Courier New", Consolas, monospace', COLORS.menuGold
  );

  textCenter('ENTER или R — начать заново', 528,
    '13px "Courier New", Consolas, monospace', COLORS.menuDim);
}

/**
 * Отрисовка одного кадра целиком.
 * Порядок слоёв: космос → игровые объекты (с «тряской») → HUD → экранные
 * кнопки телефона → экран меню/паузы/итогов → кнопки меню.
 */
function render() {
  // 1. Космос рисуется всегда: он живёт и в бою, и в меню.
  space.draw();

  const inGame = state.screen === 'playing' || state.screen === 'paused' || state.screen === 'over';

  if (inGame) {
    // 2. Игровые объекты — внутри слоя с эффектом тряски экрана.
    ctx.save();
    if (state.shake > 0) {
      const power = state.shake * 26;
      ctx.translate(Math.round(rand(-power, power)), Math.round(rand(-power, power)));
    }

    // Порядок рисования = порядок слоёв.
    for (const particle of state.particles) particle.draw();
    for (const powerup of state.powerups) powerup.draw();
    for (const enemy of state.enemies) enemy.draw();
    if (state.boss) state.boss.draw();
    for (const bullet of state.enemyBullets) bullet.draw();
    if (state.player) state.player.draw();
    for (const bullet of state.bullets) bullet.draw();

    ctx.restore();

    // 3. Боевой интерфейс — поверх всего и без тряски.
    if (state.screen === 'playing') drawCrosshair();
    drawHud();
    drawBossBar();
    drawAnnouncement();
  }

  // 4. Экранные органы управления телефона.
  touchControls.draw();

  // 5. Экраны меню, подсказки, паузы и итогов.
  if (state.screen === 'menu') drawMenuScreen();
  else if (state.screen === 'howto') drawHowToScreen();
  else if (state.screen === 'paused') drawPauseScreen();
  else if (state.screen === 'over') drawGameOverScreen();

  // 6. Кнопки — самым верхним слоем, чтобы их было удобно нажимать.
  if (state.screen !== 'playing') ui.draw();
}

/* ======================== 12. ИГРОВОЙ ЦИКЛ И ЗАПУСК ======================== */

let lastTime = performance.now();

/**
 * Главный игровой цикл.
 * requestAnimationFrame вызывает функцию перед отрисовкой каждого кадра
 * (обычно 60 раз в секунду) и передаёт текущее время в миллисекундах.
 */
function gameLoop(now) {
  // dt — сколько секунд прошло с предыдущего кадра.
  let dt = (now - lastTime) / 1000;
  lastTime = now;

  // Ограничиваем шаг: если вкладка была свёрнута, dt может быть огромным,
  // и враги «телепортировались» бы через весь экран.
  dt = Math.min(dt, 0.05);

  // Таймеры интерфейса идут всегда — меню тоже должно жить.
  state.uiTime += dt;
  if (state.touchHint > 0) state.touchHint = Math.max(0, state.touchHint - dt);
  if (touchControls.pauseFlash > 0) touchControls.pauseFlash -= dt;

  space.update(dt);  // космос движется на любом экране

  update(dt);  // 1) считаем логику
  render();    // 2) рисуем кадр

  requestAnimationFrame(gameLoop);  // 3) планируем следующий кадр
}

// --- Точка входа ---
state.best = loadBestScore();       // рекорд из localStorage
state.touch = detectTouchMode();    // телефон или компьютер — решаем по устройству
bakeTouchArt();                     // готовим картинки экранных кнопок
space.reset();                      // запекаем космос: туманности, планеты, звёзды
resetGame();                        // создаём стража и обнуляем счёт
setScreen('menu');                  // стартуем с главного меню
syncFullscreenButton();             // показываем кнопку полного экрана, если API есть
requestAnimationFrame(gameLoop);    // запускаем цикл
