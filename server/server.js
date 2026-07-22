const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;
const API_URL = "https://klepto-cats.onrender.com";
const databasePath = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
app.use("/photo", express.static(path.join(__dirname, "..", "photo")));

const LOCAL_ITEM_IMAGES = {
  "Blink Dagger": `${API_URL}/photo/blink.jpg`,
  "Aghanim's Scepter": `${API_URL}/photo/agan.jpg`,
  "Eye of Skadi": `${API_URL}/photo/skadi.jpg`,
  "Butterfly": `${API_URL}/photo/butterfly.jpg`,
  "Black King Bar": `${API_URL}/photo/bkb.jpg`
};

app.get("/items", (_, res) => { 
	const state = readState(); 
	res.json({ ...state, skins: SKINS, pendingHunt: undefined });
});

app.get("/inventory", (_, res) => res.json(readState().inventory));
app.get("/room", (_, res) => res.json(readState().inventory));

app.post("/hunt", (_, res) => {
	const state = readState(); 
	if (state.pendingHunt) 
		return res.status(409).json({ error: "Охота уже началась" }); 
	state.pendingHunt = { startedAt: Date.now() }; 
	saveState(state); 
	res.status(202).json({ message: "Котик отправился на охоту" }); 
});

app.post("/hunt/claim", (_, res) => { 
	const state = readState(); 
	if (!state.pendingHunt) 
		return res.status(400).json({ error: "Нет активной охоты" }); 
	const item = createItem(state); 
	state.inventory.unshift(item); 
	state.cat.coins += item.coins; 
	state.pendingHunt = null; 
	state.cat.xp += 20; 
	if (state.cat.xp >= state.cat.nextLevelXp) {
		state.cat.level++; 
		state.cat.xp -= state.cat.nextLevelXp; 
		state.cat.nextLevelXp += 100; 
	} saveState(state); 
	res.json({ item, cat: state.cat }); 
});

app.post("/like", (req, res) => { 
	const state = readState(); 
	const item = state.inventory.find((entry) => entry.id === String(req.body.id)); 
	if (!item) 
		return res.status(404).json({ error: "Предмет не найден" }); 
	item.likes++; 
	state.stats.likes++; 
	saveState(state); 
	res.json(item);
});

app.post("/cat/name", (req, res) => { 
	const state = readState(); 
	const name = String(req.body.name || "").trim().slice(0, 16); 
	if (!name) 
		return res.status(400).json({ error: "Введите имя" }); 
	state.cat.name = name; 
	saveState(state); 
	res.json(state.cat); 
});

app.post("/cat/pet", (_, res) => { 
	const state = readState(); 
	state.cat.pets++; 
	saveState(state); 
	res.json({ pets: state.cat.pets, message: "Мррр! Котику очень приятно" }); 
});

app.post("/skins/:id/buy", (req, res) => { 
	const state = readState(); 
	const skin = SKINS.find((entry) => entry.id === req.params.id); 
	if (!skin) 
		return res.status(404).json({ error: "Скин не найден" }); 
	if (!state.skinsOwned.includes(skin.id)) {
		if (state.cat.coins < skin.price)
			return res.status(400).json({ error: "Недостаточно монет" }); 
			state.cat.coins -= skin.price; 
			state.skinsOwned.push(skin.id); 
	} 
	state.cat.skin = skin.id; 
	saveState(state); 
	res.json({ cat: state.cat, skinsOwned: state.skinsOwned }); 
});

app.delete("/items/:id", (req, res) => { const state = readState(); state.inventory = state.inventory.filter((item) => item.id !== req.params.id); saveState(state); res.status(204).end(); });

app.listen(PORT, () => console.log(`Cozy Cat API is running at http://localhost:${PORT}`));
