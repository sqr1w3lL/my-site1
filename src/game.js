
// адрес API (в данном проекте используется только для картинок)
const API_URL = "https://klepto-cats.onrender.com";
// ключ для localStorage, где храним прогресс игрока
const STORAGE_KEY = "cozycat_save_v1";

// соответствие русских названий редкости к css-классам
const rarityClass = { "Обычная": "common", "Необычная": "uncommon", "Редкая": "rare", "Эпическая": "epic", "Легендарная": "legendary" };

// ITEM_TEMPLATES — шаблоны предметов: [emoji, name, rarity, rank, description, image?]
// ранг влияет на шанс выпадения и награду в монетах
const ITEM_TEMPLATES = [
  ["🐟", "Рыбка", "Обычная", 1, "Серебристая рыбка из тихого пруда. Плюша очень гордится уловом!"],
  ["🪶", "Пёрышко", "Обычная", 1, "Лёгкое пёрышко, которое танцует от каждого дуновения ветра."],
  ["🍎", "Яблочко", "Обычная", 1, "Румяное яблочко с ароматом солнечного сада."],
  ["🍄", "Лесной гриб", "Необычная", 2, "Грибочек из мшистого леса — кажется, он знает много секретов."],
  ["🌸", "Нежный цветок", "Необычная", 2, "Нежный цветок, найденный на тропинке в самый счастливый день."],
  ["🐭", "Игрушечная мышка", "Необычная", 2, "Потёртая игрушечная мышка — идеальный спутник для вечерних игр."],
  ["🪙", "Старинная монета", "Редкая", 3, "Монета с загадочным узором. Наверняка принадлежала старому путешественнику."],
  ["⭐", "Упавшая звезда", "Редкая", 3, "Звёздочка успела загадать желание, прежде чем Плюша нашла её в траве."],
  ["❤️", "Алое сердечко", "Эпическая", 4, "Тёплое сердечко, которое светится рядом с теми, кого любят."],
  ["💎", "Лунный алмаз", "Легендарная", 5, "Редчайший алмаз с холодным лунным сиянием. Настоящее сокровище!"],
  ["🗡️", "Blink Dagger", "Редкая", 3, "Кинжал мгновенного перемещения. Плюша нашла его у древнего портала."],
  ["🪄", "Aghanim's Scepter", "Эпическая", 4, "Магический скипетр, наполненный мерцающей силой старого волшебника."],
  ["👁️", "Eye of Skadi", "Эпическая", 4, "Ледяной артефакт с прохладным сиянием. Даже в комнате от него немного морозно."],
  ["🦋", "Butterfly", "Легендарная", 5, "Крылатый клинок, который оставляет за собой золотистые искры."],
  ["🛡️", "Black King Bar", "Легендарная", 5, "Древний золотой жезл, способный защитить Плюшу от любой магии."]
];

// сколько монет даёт предмет в зависимости от rank
const COINS_BY_RANK = { 1: 3, 2: 7, 3: 15, 4: 35, 5: 80 };

// доступные образы (скины) для кота
const SKINS = [
  { id: "classic", name: "Классическая Плюша", emoji: "🐱", accessory: "", price: 0, accent: "#f5bf82" },
  { id: "strawberry", name: "Клубничный бантик", emoji: "🐱", accessory: "🎀", price: 35, accent: "#f29aac" },
  { id: "wizard", name: "Лунный волшебник", emoji: "🐱", accessory: "🪄", price: 90, accent: "#a993db" },
  { id: "royal", name: "Королевская лапка", emoji: "🐱", accessory: "👑", price: 180, accent: "#e4bb59" }
];

// создаём начальное состояние игрока
function createInitialState() {
  return { cat: { name: "Плюша", level: 7, xp: 340, nextLevelXp: 500, coins: 45, skin: "classic", pets: 0 }, stats: { likes: 12 }, skinsOwned: ["classic"], inventory: [], pendingHunt: null };
}

// Добавляет новые поля в сохранения, созданные старыми версиями игры.
function migrate(state) {
  // если нет поля — подставляем значение по-умолчанию
  state.cat.coins ??= 45;
  state.cat.skin ??= "classic";
  state.cat.pets ??= 0;
  state.skinsOwned ??= ["classic"];
  // пропускаем по инвентарю и пытаемся дополнить данные из шаблонов
  state.inventory.forEach((item) => {
    const template = ITEM_TEMPLATES.find((entry) => entry[1] === item.name);
    if (template) {
      item.description ??= template[4];
      item.image = item.image || template[5] || null;
      item.coins ??= COINS_BY_RANK[item.rank];
    }
  });
  return state;
}

// читаем состояние из localStorage, если нет — создаём новое
export function readState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const state = raw ? JSON.parse(raw) : createInitialState();
  return migrate(state);
}

// сохраняем состояние в localStorage
export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// генерирует случайный предмет в зависимости от уровня кота
function createItem(state) {
  // разбираем шаблоны, доступные по уровню
  const unlocked = ITEM_TEMPLATES.filter((item) => item[3] <= Math.ceil(state.cat.level / 2) + 1);
  const roll = Math.random() * 100;
  let rank = 1;
  if (roll > 55) rank = 2; if (roll > 82) rank = 3; if (roll > 94) rank = 4; if (roll > 99) rank = 5;
  const choices = unlocked.filter((item) => item[3] === rank);
  const [emoji, name, rarity, itemRank, description, image] = (choices.length ? choices : unlocked)[Math.floor(Math.random() * (choices.length || unlocked.length))];
  return { id: String(Date.now()), emoji, name, rarity, rank: itemRank, description, image: image || null, coins: COINS_BY_RANK[itemRank], likes: 0, receivedAt: new Date().toISOString() };
}

// Все действия ниже — синхронные обёртки: читают state, меняют, сохраняют, возвращают результат.
// Это замена fetch-запросам к серверу — теперь всё происходит мгновенно в браузере.

// возвращает текущее состояние (для UI)
export function getData() {
  const state = readState();
  return { ...state, skins: SKINS, pendingHunt: undefined };
}

// начинает охоту: помечаем pendingHunt в состоянии
export function startHunt() {
  const state = readState();
  if (state.pendingHunt) return { error: "Охота уже началась" };
  state.pendingHunt = { startedAt: Date.now() };
  saveState(state);
  return { message: "Котик отправился на охоту" };
}

// забираем результат охоты: создаём предмет, начисляем монеты и опыт
export function claimHunt() {
  const state = readState();
  if (!state.pendingHunt) return { error: "Нет активной охоты" };
  const item = createItem(state);
  state.inventory.unshift(item);
  state.cat.coins += item.coins;
  state.pendingHunt = null;
  state.cat.xp += 20;
  if (state.cat.xp >= state.cat.nextLevelXp) { state.cat.level++; state.cat.xp -= state.cat.nextLevelXp; state.cat.nextLevelXp += 100; }
  saveState(state);
  return { item, cat: state.cat };
}

// поставить лайк предмету в инвентаре
export function likeItem(id) {
  const state = readState();
  const item = state.inventory.find((entry) => entry.id === String(id));
  if (!item) return { error: "Предмет не найден" };
  item.likes++; state.stats.likes++;
  saveState(state);
  return item;
}

// переименовать кота (валидация длины и пустой строки)
export function renameCat(name) {
  const state = readState();
  const clean = String(name || "").trim().slice(0, 16);
  if (!clean) return { error: "Введите имя" };
  state.cat.name = clean;
  saveState(state);
  return state.cat;
}

// погладить кота — просто увеличиваем счётчик
export function petCat() {
  const state = readState();
  state.cat.pets++;
  saveState(state);
  return { pets: state.cat.pets, message: "Мррр! Котику очень приятно" };
}

// купить скин: если не хватает монет — вернуть ошибку, иначе списать и добавить в owned
export function buySkin(id) {
  const state = readState();
  const skin = SKINS.find((entry) => entry.id === id);
  if (!skin) return { error: "Скин не найден" };
  if (!state.skinsOwned.includes(skin.id)) {
    if (state.cat.coins < skin.price) return { error: "Недостаточно монет" };
    state.cat.coins -= skin.price;
    state.skinsOwned.push(skin.id);
  }
  state.cat.skin = skin.id;
  saveState(state);
  return { cat: state.cat, skinsOwned: state.skinsOwned };
}

// удалить предмет из инвентаря
export function removeItem(id) {
  const state = readState();
  state.inventory = state.inventory.filter((item) => item.id !== id);
  saveState(state);
}

// экспортируем маппинг классов редкости
export { rarityClass };
