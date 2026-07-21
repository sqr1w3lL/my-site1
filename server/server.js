// Express API для уютной игры про котика.
// Клиент не записывает JSON-файл напрямую: все игровые действия проходят через эти маршруты.
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const databasePath = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
// Открывает клиенту локальные изображения предметов из папки photo.
app.use("/photo", express.static(path.join(__dirname, "..", "photo")));

// Ранг определяет шанс выпадения предмета и количество полученных монет.
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
  ["🗡️", "Blink Dagger", "Редкая", 3, "Кинжал мгновенного перемещения. Плюша нашла его у древнего портала.", "http://localhost:5000/photo/blink.jpg"],
  ["🪄", "Aghanim's Scepter", "Эпическая", 4, "Магический скипетр, наполненный мерцающей силой старого волшебника.", "http://localhost:5000/photo/agan.jpg"],
  ["👁️", "Eye of Skadi", "Эпическая", 4, "Ледяной артефакт с прохладным сиянием. Даже в комнате от него немного морозно.", "http://localhost:5000/photo/skadi.jpg"],
  ["🦋", "Butterfly", "Легендарная", 5, "Крылатый клинок, который оставляет за собой золотистые искры.", "http://localhost:5000/photo/butterfly.jpg"],
  ["🛡️", "Black King Bar", "Легендарная", 5, "Древний золотой жезл, способный защитить Плюшу от любой магии.", "http://localhost:5000/photo/bkb.jpg"]
];

const COINS_BY_RANK = { 1: 3, 2: 7, 3: 15, 4: 35, 5: 80 };
// Локальные фото заменяют старые ссылки Steam даже у уже найденных предметов.
const LOCAL_ITEM_IMAGES = {
  "Blink Dagger": "http://localhost:5000/photo/blink.jpg",
  "Aghanim's Scepter": "http://localhost:5000/photo/agan.jpg",
  "Eye of Skadi": "http://localhost:5000/photo/skadi.jpg",
  "Butterfly": "http://localhost:5000/photo/butterfly.jpg",
  "Black King Bar": "http://localhost:5000/photo/bkb.jpg"
};
const SKINS = [
  { id: "classic", name: "Классическая Плюша", emoji: "🐱", accessory: "", price: 0, accent: "#f5bf82" },
  { id: "strawberry", name: "Клубничный бантик", emoji: "🐱", accessory: "🎀", price: 35, accent: "#f29aac" },
  { id: "wizard", name: "Лунный волшебник", emoji: "🐱", accessory: "🪄", price: 90, accent: "#a993db" },
  { id: "royal", name: "Королевская лапка", emoji: "🐱", accessory: "👑", price: 180, accent: "#e4bb59" }
];

function createInitialState() {
  return { cat: { name: "Плюша", level: 7, xp: 340, nextLevelXp: 500, coins: 45, skin: "classic", pets: 0 }, stats: { likes: 12 }, skinsOwned: ["classic"], inventory: [], pendingHunt: null };
}

// Добавляет новые поля в сохранения, созданные старыми версиями игры.
function migrate(state) {
  state.cat.coins ??= 45;
  state.cat.skin ??= "classic";
  state.cat.pets ??= 0;
  state.skinsOwned ??= ["classic"];
  state.inventory.forEach((item) => {
    const template = ITEM_TEMPLATES.find((entry) => entry[1] === item.name);
    if (template) {
      item.description ??= template[4];
      item.image = LOCAL_ITEM_IMAGES[item.name] || item.image || template[5] || null;
      item.coins ??= COINS_BY_RANK[item.rank];
    }
  });
  return state;
}

function readState() {
  if (!fs.existsSync(databasePath)) fs.writeFileSync(databasePath, JSON.stringify(createInitialState(), null, 2));
  return migrate(JSON.parse(fs.readFileSync(databasePath, "utf8")));
}
function saveState(state) { fs.writeFileSync(databasePath, JSON.stringify(state, null, 2)); }

function createItem(state) {
  const unlocked = ITEM_TEMPLATES.filter((item) => item[3] <= Math.ceil(state.cat.level / 2) + 1);
  const roll = Math.random() * 100;
  let rank = 1;
  if (roll > 55) rank = 2; if (roll > 82) rank = 3; if (roll > 94) rank = 4; if (roll > 99) rank = 5;
  const choices = unlocked.filter((item) => item[3] === rank);
  const [emoji, name, rarity, itemRank, description, image] = (choices.length ? choices : unlocked)[Math.floor(Math.random() * (choices.length || unlocked.length))];
  return { id: String(Date.now()), emoji, name, rarity, rank: itemRank, description, image: image || null, coins: COINS_BY_RANK[itemRank], likes: 0, receivedAt: new Date().toISOString() };
}

app.get("/items", (_, res) => { const state = readState(); res.json({ ...state, skins: SKINS, pendingHunt: undefined }); });
app.get("/inventory", (_, res) => res.json(readState().inventory));
app.get("/room", (_, res) => res.json(readState().inventory));

app.post("/hunt", (_, res) => { const state = readState(); if (state.pendingHunt) return res.status(409).json({ error: "Охота уже началась" }); state.pendingHunt = { startedAt: Date.now() }; saveState(state); res.status(202).json({ message: "Котик отправился на охоту" }); });
app.post("/hunt/claim", (_, res) => { const state = readState(); if (!state.pendingHunt) return res.status(400).json({ error: "Нет активной охоты" }); const item = createItem(state); state.inventory.unshift(item); state.cat.coins += item.coins; state.pendingHunt = null; state.cat.xp += 20; if (state.cat.xp >= state.cat.nextLevelXp) { state.cat.level++; state.cat.xp -= state.cat.nextLevelXp; state.cat.nextLevelXp += 100; } saveState(state); res.json({ item, cat: state.cat }); });
app.post("/like", (req, res) => { const state = readState(); const item = state.inventory.find((entry) => entry.id === String(req.body.id)); if (!item) return res.status(404).json({ error: "Предмет не найден" }); item.likes++; state.stats.likes++; saveState(state); res.json(item); });
app.post("/cat/name", (req, res) => { const state = readState(); const name = String(req.body.name || "").trim().slice(0, 16); if (!name) return res.status(400).json({ error: "Введите имя" }); state.cat.name = name; saveState(state); res.json(state.cat); });
app.post("/cat/pet", (_, res) => { const state = readState(); state.cat.pets++; saveState(state); res.json({ pets: state.cat.pets, message: "Мррр! Котику очень приятно" }); });
app.post("/skins/:id/buy", (req, res) => { const state = readState(); const skin = SKINS.find((entry) => entry.id === req.params.id); if (!skin) return res.status(404).json({ error: "Скин не найден" }); if (!state.skinsOwned.includes(skin.id)) { if (state.cat.coins < skin.price) return res.status(400).json({ error: "Недостаточно монет" }); state.cat.coins -= skin.price; state.skinsOwned.push(skin.id); } state.cat.skin = skin.id; saveState(state); res.json({ cat: state.cat, skinsOwned: state.skinsOwned }); });
app.delete("/items/:id", (req, res) => { const state = readState(); state.inventory = state.inventory.filter((item) => item.id !== req.params.id); saveState(state); res.status(204).end(); });

app.listen(PORT, () => console.log(`Cozy Cat API is running at http://localhost:${PORT}`));
