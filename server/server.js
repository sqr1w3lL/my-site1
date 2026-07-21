const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const DB = path.join(__dirname, "data.json");
app.use(cors()); app.use(express.json());

const templates = [
  ["🐟", "Рыбка", "Обычная", 1, "Серебристая рыбка из тихого пруда. Плюша очень гордится уловом!"],
  ["🪶", "Пёрышко", "Обычная", 1, "Лёгкое пёрышко, которое танцует от каждого дуновения ветра."],
  ["🍎", "Яблочко", "Обычная", 1, "Румяное яблочко с ароматом солнечного сада."],
  ["🍄", "Лесной гриб", "Необычная", 2, "Грибочек из мшистого леса — кажется, он знает много секретов."],
  ["🌸", "Нежный цветок", "Необычная", 2, "Нежный цветок, найденный на тропинке в самый счастливый день."],
  ["🐭", "Игрушечная мышка", "Необычная", 2, "Потёртая игрушечная мышка — идеальный спутник для вечерних игр."],
  ["🪙", "Старинная монета", "Редкая", 3, "Монета с загадочным узором. Наверняка принадлежала старому путешественнику."],
  ["⭐", "Упавшая звезда", "Редкая", 3, "Звёздочка успела загадать желание, прежде чем Плюша нашла её в траве."],
  ["❤️", "Алое сердечко", "Эпическая", 4, "Тёплое сердечко, которое светится особенно ярко рядом с теми, кого любят."],
  ["💎", "Лунный алмаз", "Легендарная", 5, "Редчайший алмаз с холодным лунным сиянием. Настоящее сокровище Плюши!"]
];
const rewards = { 1: 3, 2: 7, 3: 15, 4: 35, 5: 80 };
const skins = [
  { id:"classic", name:"Классическая Плюша", emoji:"🐱", accessory:"", price:0, accent:"#f5bf82" },
  { id:"strawberry", name:"Клубничный бантик", emoji:"🐱", accessory:"🎀", price:35, accent:"#f29aac" },
  { id:"wizard", name:"Лунный волшебник", emoji:"🐱", accessory:"🪄", price:90, accent:"#a993db" },
  { id:"royal", name:"Королевская лапка", emoji:"🐱", accessory:"👑", price:180, accent:"#e4bb59" }
];
function base(){ return {cat:{name:"Плюша",level:7,xp:340,nextLevelXp:500,coins:45,skin:"classic",pets:0},stats:{likes:12},skinsOwned:["classic"],inventory:templates.slice(4,7).map((t,n)=>({id:`seed-${n+1}`,emoji:t[0],name:t[1],rarity:t[2],rank:t[3],description:t[4],coins:rewards[t[3]],likes:[4,2,6][n],receivedAt:new Date(Date.now()-(n+1)*86400000).toISOString()})),pendingHunt:null}; }
function upgrade(d){ d.cat.coins ??= 45; d.cat.skin ??= "classic"; d.cat.pets ??= 0; d.skinsOwned ??= ["classic"]; d.inventory.forEach(i=>{ const ref=templates.find(t=>t[1]===i.name); if(ref){i.description ??= ref[4]; i.coins ??= rewards[i.rank];} }); return d; }
function read(){ if(!fs.existsSync(DB)) fs.writeFileSync(DB,JSON.stringify(base(),null,2)); return upgrade(JSON.parse(fs.readFileSync(DB,"utf8"))); } function save(d){ fs.writeFileSync(DB,JSON.stringify(d,null,2)); }
function pick(d){ const allowed=templates.filter(t=>t[3]<=Math.ceil(d.cat.level/2)+1); const roll=Math.random()*100; let pool=allowed.filter(t=>t[3]===1); if(roll>55)pool=allowed.filter(t=>t[3]===2);if(roll>82)pool=allowed.filter(t=>t[3]===3);if(roll>94)pool=allowed.filter(t=>t[3]===4);if(roll>99)pool=allowed.filter(t=>t[3]===5);if(!pool.length)pool=allowed;const t=pool[Math.floor(Math.random()*pool.length)];return {id:Date.now().toString(),emoji:t[0],name:t[1],rarity:t[2],rank:t[3],description:t[4],coins:rewards[t[3]],likes:0,receivedAt:new Date().toISOString()}; }
app.get("/items",(_,res)=>{const d=read();res.json({...d,skins,pendingHunt:undefined});}); app.get("/inventory",(_,res)=>res.json(read().inventory)); app.get("/room",(_,res)=>res.json(read().inventory));
app.post("/hunt",(_,res)=>{const d=read();if(d.pendingHunt)return res.status(409).json({error:"Охота уже началась"});d.pendingHunt={startedAt:Date.now()};save(d);res.status(202).json({message:"Котик отправился на охоту"});});
app.post("/hunt/claim",(_,res)=>{const d=read();if(!d.pendingHunt)return res.status(400).json({error:"Нет активной охоты"});const item=pick(d);d.inventory.unshift(item);d.cat.coins+=item.coins;d.pendingHunt=null;d.cat.xp+=20;if(d.cat.xp>=d.cat.nextLevelXp){d.cat.level++;d.cat.xp-=d.cat.nextLevelXp;d.cat.nextLevelXp+=100;}save(d);res.json({item,cat:d.cat});});
app.post("/like",(req,res)=>{const d=read();const item=d.inventory.find(i=>i.id===String(req.body.id));if(!item)return res.status(404).json({error:"Предмет не найден"});item.likes++;d.stats.likes++;save(d);res.json(item);});
app.post("/cat/name",(req,res)=>{const d=read();const name=String(req.body.name||"").trim().slice(0,16);if(!name)return res.status(400).json({error:"Введите имя"});d.cat.name=name;save(d);res.json(d.cat);});
app.post("/cat/pet",(_,res)=>{const d=read();d.cat.pets++;save(d);res.json({pets:d.cat.pets,message:"Мррр! Плюше очень приятно"});});
app.post("/skins/:id/buy",(req,res)=>{const d=read(), skin=skins.find(s=>s.id===req.params.id);if(!skin)return res.status(404).json({error:"Скин не найден"});if(d.skinsOwned.includes(skin.id)){d.cat.skin=skin.id;save(d);return res.json({cat:d.cat,skinsOwned:d.skinsOwned});}if(d.cat.coins<skin.price)return res.status(400).json({error:"Недостаточно монет"});d.cat.coins-=skin.price;d.skinsOwned.push(skin.id);d.cat.skin=skin.id;save(d);res.json({cat:d.cat,skinsOwned:d.skinsOwned});});
app.delete("/items/:id",(req,res)=>{const d=read();d.inventory=d.inventory.filter(i=>i.id!==req.params.id);save(d);res.status(204).end();});
app.listen(5000,()=>console.log("Cozy Cat API: http://localhost:5000"));
