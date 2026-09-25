/* =============================================================================
 *  PixelGuardian — маленькая 2D-игра на HTML5 Canvas
 *  -----------------------------------------------------------------------------
 *  Структура файла:
 *    1. Константы и палитра
 *    2. Доступ к DOM и контексту холста
 *    3. Утилиты и пиксельные спрайты космических кораблей
 *    4. Игровые классы: Player, Bullet, Enemy, EnemyBullet, PowerUp, Boss, Particle
 *    5. Звук (Web Audio API)
 *    6. Состояние игры и пользовательский ввод (клавиатура + мышь)
 *    7. Логика: уровни, боссы, бонусы, столкновения, стрельба, спавн врагов
 *    8. Отрисовка: фон, объекты, HP Bar босса, HUD, объявления, экраны паузы
 *    9. Главный игровой цикл и запуск
 * ============================================================================= */

'use strict';

/* =============================== 1. КОНСТАНТЫ ============================== */

// Логический размер игрового поля. CSS может масштабировать холст, но вся
// математика игры считается именно в этих координатах.
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Палитра: все цвета собраны в одном месте, поэтому игру легко перекрасить.
const COLORS = {
  bgTop:      '#0b1224',                  // верх фона
  bgBottom:   '#141d38',                  // низ фона
  grid:       'rgba(120, 160, 255, .06)', // «пиксельная» сетка поля
  player:     '#3aa0ff',                  // корпус корабля стража
  playerDark: '#1b5fbf',                  // тёмная обводка корабля стража
  visor:      '#eaf4ff',                  // светлый «кокпит» стража
  bullet:     '#ffe66d',                  // снаряды
  enemy:      '#ff4d4d',                  // корпус корабля врага
  enemyDark:  '#8f1f1f',                  // тёмная обводка корабля врага
  hud:        '#dfe9ff',                  // текст интерфейса
  crosshair:  'rgba(255, 230, 109, .9)',  // прицел
  panel:      'rgba(6, 10, 22, .82)',     // затемнение на экранах паузы/проигрыша
  accent:     '#7fd4ff',                  // акцентный цвет интерфейса
  flameInner: '#fff3b0',                  // ядро пламени двигателей
  flameOuter: '#ff8c42',                  // внешняя часть пламени
  muzzle:     '#fff6c2',                  // вспышка у дула после выстрела
  enemyGlow:  '#ffe08a',                  // пульсирующий огонь врага

  // --- Боссы и бонусы (Шаг 2) ---
  boss:         '#c94bff',                // корпус босса
  bossDark:     '#4b1a7a',                // обводка босса
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
  carrierDark:  '#8a4a00',                // его обводка
  emptySlot:    'rgba(27, 95, 191, .30)', // пустая ячейка жизни в HUD
  emptySlotIn:  'rgba(58, 160, 255, .16)',
};

// Баланс игры. Меняйте эти числа, чтобы сделать игру проще или сложнее.
const PLAYER_SIZE        = 28;    // размер стража в пикселях
const PLAYER_SPEED       = 240;   // скорость движения, пикселей в секунду
const PLAYER_LIVES       = 3;     // сколько попаданий держит страж
const PLAYER_INVULN_TIME = 1.2;   // секунд неуязвимости после попадания
const BULLET_SIZE        = 6;     // размер снаряда
const BULLET_SPEED       = 480;   // скорость снаряда, пикселей в секунду
const FIRE_COOLDOWN      = 0.16;  // пауза между выстрелами при удержании ЛКМ
const ENEMY_SIZE         = 26;    // размер врага
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
const BOSS_WIDTH          = 72;    // ширина корабля босса на экране
const BOSS_BASE_HP        = 24;    // здоровье босса на первом уровне
const BOSS_HP_GROWTH      = 10;    // прибавка здоровья на каждом новом уровне
const BOSS_ENTER_Y        = 86;    // высота, на которую босс «въезжает» сверху
const BOSS_BASE_SPEED     = 80;    // скорость дрейфа босса вбок
const BOSS_FIRE_BASE      = 1.7;   // пауза между атаками на первом уровне, секунд
const BOSS_FIRE_STEP      = 0.16;  // насколько пауза короче на каждом уровне
const BOSS_FIRE_MIN       = 0.7;   // чаще этого босс не стреляет
const BOSS_SCORE          = 250;   // очки за босса (умножаются на номер уровня)
const BOSS_WARN_TIME      = 1.8;   // сколько длится «WARNING!» до вылета босса
const ENEMY_BULLET_SIZE   = 8;     // размер снаряда босса
const ENEMY_BULLET_SPEED  = 200;   // скорость снаряда босса
const POWERUP_SIZE        = 22;    // размер иконки бонуса
const POWERUP_SPEED       = 70;    // скорость падения бонуса
const POWERUP_DROP_CHANCE = 0.08;  // шанс бонуса с обычного врага
const RARE_ENEMY_CHANCE   = 0.12;  // доля редких врагов-носителей бонусов
const RARE_ENEMY_HP       = 2;     // редкий враг держит два попадания
const RARE_SCORE_MUL      = 3;     // очки за редкого врага
const WEAPON_TIME         = 12;    // сколько секунд действует усиление выстрела
const WEAPON_COOLDOWN_MUL = 0.6;   // во столько раз быстрее перезарядка при усилении
const WEAPON_SPREAD       = 0.14;  // угол боковых снарядов, радиан
const ANNOUNCE_TIME       = 2.2;   // сколько секунд висит объявление по центру

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

/** Корабль стража: 14x14 «пикселей», нос смотрит вверх. */
const SPRITES = {
  player: [
    '......dd......',
    '......bb......',
    '.....dccd.....',
    '.....dccd.....',
    '....dbccbd....',
    '...dbbccbbd...',
    '..dbbbccbbbd..',
    '..dbbbbbbbbd..',
    '.dbbbbbbbbbbd.',
    '.dbbdbbbbdbbd.',
    '.dbddbbbbddbd.',
    '.dd.dbbbbd.dd.',
    '....dbbbbd....',
    '....dd..dd....',
  ],

  /** Корабль врага: 13x13 «пикселей», нос смотрит вниз — прямо на стража. */
  enemy: [
    '....ddddd....',
    '...dbbbbbd...',
    '..dbbcccbbd..',
    '.dbbbcccbbbd.',
    '.dbbbbbbbbbd.',
    'dbbbbbbbbbbbd',
    'dbdbbbbbbbdbd',
    'dbbbbbbbbbbbd',
    '..dbbbbbbbd..',
    '...dbbbbbd...',
    '....dbbbd....',
    '.....dbd.....',
    '.....ded.....',
  ],

  /** Корабль босса: 24x19 «пикселей» — тяжёлый корабль с ядром и бортовыми пушками. */
  boss: [
    '.......dbbbbbbbbd.......',
    '......dbbbbbbbbbbd......',
    '.....dbbccccccccbbd.....',
    '....dbbbccccccccbbbd....',
    '...dbbbbccccccccbbbbd...',
    '..ddbbbbbccccccbbbbbdd..',
    '.ddbbbbbbccccccbbbbbbdd.',
    'ggdbbbbbbbccccbbbbbbbdgg',
    'ggdbbbbbbccccccbbbbbbdgg',
    '..dbbbbbbbccccbbbbbbbd..',
    '...dbbbbbeeeeeebbbbbd...',
    '...dbbbbeeeeeeeebbbbd...',
    '....dbbbeeeeeeeebbbd....',
    '....dbbbeeeeeeeebbbd....',
    '.....dbbeeeeeeeebbd.....',
    '......dbeeeeeeeebd......',
    '......ddbeeeeeebdd......',
    '.......ddbeeeebdd.......',
    '........ddeeeedd........',
  ],

  /** Редкий враг-носитель бонусов: 13x13 «пикселей», Х-образные крылья. */
  carrier: [
    'dd.........dd',
    'dbd.......dbd',
    'dbbd.....dbbd',
    '.dbbd...dbbd.',
    '..dbbd.dbbd..',
    '..dbbbdbbbd..',
    '.dbcccdcccbd.',
    'dbbcccdcccbbd',
    'dbccccdccccbd',
    '.dbbbdddbbbd.',
    '..dbbdddbbd..',
    '...dbdddbd...',
    '....dbdbd....',
  ],

  /** Аптечка: 11x11 «пикселей» — зелёная коробка с белым крестом. */
  medkit: [
    '..ddddddd..',
    '.dgggggggd.',
    'dgggggggggd',
    'dgggmmmgggd',
    'dgggmmmgggd',
    'dggmmmmmggd',
    'dgggmmmgggd',
    'dgggmmmgggd',
    'dgggggggggd',
    '.dgggggggd.',
    '..ddddddd..',
  ],

  /** Усиление выстрела: 11x11 «пикселей» — жёлтая коробка с двойной стрелкой. */
  weapon: [
    '..ddddddd..',
    '.dwwwwwwwd.',
    'dwwwooowwwd',
    'dwwooooowwd',
    'dwooooooowd',
    'dwwwwwwwwwd',
    'dwwwooowwwd',
    'dwwooooowwd',
    'dwooooooowd',
    '.dwwwwwwwd.',
    '..ddddddd..',
  ],
};

/** Палитры спрайтов: буква -> цвет (цвета берём из общей палитры игры). */
const PALETTES = {
  player:       { d: COLORS.playerDark, b: COLORS.player, c: COLORS.visor },
  playerFlash:  { d: '#ffffff', b: '#ffffff', c: '#ffffff' },
  enemy:        { d: COLORS.enemyDark, b: COLORS.enemy, c: '#ffd9d9', e: COLORS.enemyGlow },
  enemyFlash:   { d: '#ffffff', b: '#ffffff', c: '#ffffff', e: '#ffffff' },
  carrier:      { d: COLORS.carrierDark, b: COLORS.carrier, c: '#ffe6c2' },
  carrierFlash: { d: '#ffffff', b: '#ffffff', c: '#ffffff' },
  boss:         { d: COLORS.bossDark, b: COLORS.boss, c: '#e6b3ff', e: COLORS.bossCore, g: COLORS.bossGun },
  bossFlash:    { d: '#ffffff', b: '#ffffff', c: '#ffffff', e: '#ffffff', g: '#ffffff' },
  medkit:       { d: COLORS.powerupDark, g: COLORS.medkit, m: '#ffffff' },
  weapon:       { d: COLORS.powerupDark, w: COLORS.weapon, o: COLORS.weaponAccent },
};

// Размер одного «пикселя» спрайта на экране. Считаем его от размера хитбокса,
// поэтому нарисованный корабль точно совпадает со зоной столкновения.
const PLAYER_PIXEL  = PLAYER_SIZE / SPRITES.player.length;   // 28 / 14 = 2
const ENEMY_PIXEL   = ENEMY_SIZE / SPRITES.enemy.length;     // 26 / 13 = 2
const CARRIER_PIXEL = ENEMY_SIZE / SPRITES.carrier.length;   // 26 / 13 = 2
const POWERUP_PIXEL = POWERUP_SIZE / SPRITES.medkit.length;  // 22 / 11 = 2
const BOSS_PIXEL    = BOSS_WIDTH / SPRITES.boss[0].length;   // 72 / 24 = 3
const BOSS_HEIGHT   = SPRITES.boss.length * BOSS_PIXEL;      // 19 * 3 = 57

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

/* =========================== 4. ИГРОВЫЕ КЛАССЫ ============================= */

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
    // Считываем направление сразу и с WASD, и со стрелок.
    let dx = 0;
    let dy = 0;
    if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
    if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  dy += 1;

    if (dx !== 0 || dy !== 0) {
      // Нормализация вектора: по диагонали страж не должен двигаться быстрее.
      const length = Math.hypot(dx, dy);
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
      const size = PLAYER_PIXEL * 2;
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
    const nozzleY = y + this.h;          // сопла — на нижней кромке корабля
    const nozzles = [4 * px, 8 * px];    // позиции двигателей в спрайте (колонки 4 и 8)

    ctx.globalAlpha = 0.9;
    for (const nozzleX of nozzles) {
      const height = Math.round(rand(2, 6));
      for (let i = 0; i < height; i++) {
        // У сопла пламя светлее, дальше — оранжевое и более узкое.
        ctx.fillStyle = i < height / 2 ? COLORS.flameInner : COLORS.flameOuter;
        const width = Math.max(1, px * 2 - 1 - i);
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

  draw() {
    ctx.fillStyle = COLORS.bullet;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
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
    const size = pixel * 2;
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

  /** Отрисовка: корпус (или белый силуэт при попадании) и пульсирующее ядро. */
  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const flash = this.hitFlash > 0;

    drawSprite(flash ? 'bossFlash' : 'boss', SPRITES.boss, BOSS_PIXEL,
      flash ? PALETTES.bossFlash : PALETTES.boss, x, y);

    // Ядро пульсирует — по нему удобно целиться.
    const size = BOSS_PIXEL * 5;
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(this.corePulse * 5));
    ctx.fillStyle = COLORS.bossCore;
    ctx.fillRect(x + this.w / 2 - size / 2, y + this.h * 0.72 - size / 2, size, size);
    ctx.globalAlpha = 1;
  }
}

/* ============================ 5. ЗВУК (WEB AUDIO API) ====================== */

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

/* =================== 6. СОСТОЯНИЕ ИГРЫ И ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ============= */

/**
 * Нажатые клавиши. Ключи — это event.code, например keys['KeyW'],
 * keys['ArrowUp']. Объект без прототипа, чтобы не путаться со встроенными полями.
 */
const keys = Object.create(null);

/** Мышь: позиция в логических координатах холста + нажата ли кнопка. */
const mouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, down: false };

/** Всё изменяемое состояние игры собрано в одном объекте. */
const state = {
  player: null,      // экземпляр Player
  bullets: [],       // летящие снаряды стража
  enemies: [],       // враги на поле
  particles: [],     // частицы взрывов
  score: 0,          // очки
  time: 0,           // сколько секунд длится текущий забег (растёт сложность)
  spawnTimer: 0,     // сколько осталось до появления следующего врага
  fireTimer: 0,      // перезарядка оружия
  muzzle: 0,         // таймер вспышки у дула после выстрела
  shake: 0,          // сила «тряски» экрана
  over: false,       // проигрыш
  paused: false,     // пауза

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
};

/**
 * Переводит координаты события мыши в логические координаты холста.
 * Нужно, потому что холст может быть отмасштабирован стилями (max-width: 100%).
 */
function updateMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
  mouse.y = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
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

  if (event.code === 'KeyP' && !state.over) state.paused = !state.paused;
  if (event.code === 'KeyM') sound.toggleMute();  // звук вкл/выкл
  if ((event.code === 'KeyR' || event.code === 'Enter') && state.over) resetGame();
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

// Окно потеряло фокус — «отпускаем» всё, иначе страж уедет сам по себе.
window.addEventListener('blur', () => {
  for (const code in keys) keys[code] = false;
  mouse.down = false;
});

/* --------------------------------- Мышь ---------------------------------- */

canvas.addEventListener('pointermove', updateMousePosition);

canvas.addEventListener('pointerdown', (event) => {
  updateMousePosition(event);
  sound.unlock();  // клик мышью тоже разрешает звук (см. политику автовоспроизведения)

  // Клик по экрану проигрыша сразу начинает новую игру.
  if (state.over) {
    resetGame();
    return;
  }

  mouse.down = true;
  state.fireTimer = 0;  // первый выстрел — мгновенно, без задержки перезарядки
});

window.addEventListener('pointerup', () => { mouse.down = false; });
canvas.addEventListener('pointerleave', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

/* ============================= 7. ЛОГИКА ИГРЫ ============================== */

/** Полный сброс мира. Вызывается при старте игры и после проигрыша. */
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
  state.over = false;
  state.paused = false;

  // Новая игра всегда начинается с первого уровня.
  state.level = 1;
  state.kills = 0;
  state.boss = null;
  state.bossWarnTimer = 0;
  state.enemyBullets = [];
  state.powerups = [];
  state.weaponTimer = 0;
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
    state.over = true;
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

/** Выстрел стража в сторону курсора мыши. */
function shoot() {
  const player = state.player;

  // Вектор «от центра стража к курсору», приведённый к единичной длине.
  let dx = mouse.x - player.cx;
  let dy = mouse.y - player.cy;
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
  // На паузе и после проигрыша мир «замирает».
  if (state.over || state.paused) return;

  const player = state.player;
  state.time += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (state.muzzle > 0) state.muzzle = Math.max(0, state.muzzle - dt);

  // --- 1. Страж: движение по WASD/стрелкам ---
  player.update(dt);

  // --- 2. Стрельба: клик или удержание ЛКМ с ограничением частоты ---
  state.fireTimer -= dt;
  if (mouse.down && state.fireTimer <= 0) {
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

/* ============================== 8. ОТРИСОВКА =============================== */

/** Фон: вертикальный градиент + «пиксельная» сетка. */
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, COLORS.bgTop);
  gradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Сетка с шагом 40 px. Полупиксельное смещение (+0.5) даёт ровные
  // однопиксельные линии без «размытия» на дробных координатах.
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, CANVAS_HEIGHT);
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS_WIDTH, y + 0.5);
  }
  ctx.stroke();
}

/** Пиксельный прицел вместо системного курсора (курсор скрыт в CSS). */
function drawCrosshair() {
  const x = Math.round(mouse.x);
  const y = Math.round(mouse.y);

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

  // --- Уровень и прогресс до босса (вторая строка слева) ---
  const progress = Math.min(state.kills, KILLS_PER_LEVEL);
  ctx.font = smallFont;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('LEVEL ' + state.level + '   ·   BOSS IN ' + (KILLS_PER_LEVEL - progress),
    16, 50);

  // Полоска прогресса уровня: видно, сколько врагов осталось до босса.
  const progressWidth = 240;
  ctx.fillStyle = 'rgba(127, 212, 255, .18)';
  ctx.fillRect(16, 58, progressWidth, 6);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(16, 58, (progressWidth * progress) / KILLS_PER_LEVEL, 6);

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

  // --- Индикатор звука внизу слева (переключается клавишей M) ---
  ctx.textAlign = 'left';
  ctx.font = smallFont;
  ctx.fillStyle = sound.muted ? 'rgba(223, 233, 255, .35)' : COLORS.accent;
  ctx.fillText(sound.muted ? 'M: SOUND OFF' : 'M: SOUND ON', 16, CANVAS_HEIGHT - 14);
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
  const y = 82;
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

/** Полупрозрачная панель с текстом — для паузы и экрана проигрыша. */
function drawOverlay(title, subtitle, hint) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 44px "Courier New", Consolas, monospace';
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 20px "Courier New", Consolas, monospace';
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 14);

  ctx.fillStyle = 'rgba(223, 233, 255, .65)';
  ctx.font = '16px "Courier New", Consolas, monospace';
  ctx.fillText(hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 52);
}

/** Отрисовка одного кадра целиком. */
function render() {
  // 1. Фон рисуем без «тряски», чтобы не оголялись края холста.
  drawBackground();

  // 2. Все игровые объекты — внутри слоя с эффектом тряски экрана.
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

  // 3. Интерфейс — поверх всего и без тряски.
  if (!state.over && !state.paused) drawCrosshair();
  drawHud();
  drawBossBar();
  drawAnnouncement();

  if (state.paused) {
    drawOverlay('PAUSE', 'Игра приостановлена', 'Нажмите P, чтобы продолжить');
  }

  if (state.over) {
    drawOverlay(
      'GAME OVER',
      'SCORE: ' + state.score + '  ·  TIME: ' + state.time.toFixed(1) + 's',
      'Клик мышью, R или Enter — начать заново'
    );
  }
}

/* ========================= 9. ИГРОВОЙ ЦИКЛ И ЗАПУСК ======================== */

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

  update(dt);  // 1) считаем логику
  render();    // 2) рисуем кадр

  requestAnimationFrame(gameLoop);  // 3) планируем следующий кадр
}

// --- Точка входа ---
resetGame();                          // создаём стража и обнуляем счёт
requestAnimationFrame(gameLoop);      // запускаем цикл
