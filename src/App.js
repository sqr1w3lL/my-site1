// импорт React хуков
import { useEffect, useMemo, useState } from "react";
// импорт стилей приложения
import "./App.css";
// импорт функций и констант из модуля игры
import { getData, startHunt as startHuntAction, claimHunt, likeItem, renameCat, petCat, buySkin as buySkinAction, removeItem, rarityClass } from "./game";
// импорт Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

// данные навигации: ключ страницы, иконка и подпись
const nav = [{ key: "home", icon: "⌂", label: "Домик" }, { key: "room", icon: "▱", label: "Комната" }, { key: "collection", icon: "▦", label: "Коллекция" }];

function App() {
  // текущая страница ('home' | 'room' | 'collection')
  const [page, setPage] = useState("home");
  // данные игры (кот, инвентарь, скины и т.д.)
  const [data, setData] = useState(null);
  // индикатор начальной загрузки данных
  const [loading, setLoading] = useState(true);
  // флаг: кот в походе (охоте)
  const [isHunting, setIsHunting] = useState(false);
  // оставшееся время охоты в секундах
  const [seconds, setSeconds] = useState(0);
  // информация о только что найденном предмете
  const [found, setFound] = useState(null);
  // текущая открытая модалка с предметом
  const [modal, setModal] = useState(null);
  // флаг: открыт магазин скинов
  const [shop, setShop] = useState(false);
  // текст всплывающего уведомления
  const [toast, setToast] = useState("");

  // обновить данные из game.getData и сбросить индикатор загрузки
  const refresh = () => {
    setData(getData());
    setLoading(false);
  };

  // при монтировании компонента — загрузить начальные данные
  useEffect(() => {
    refresh();
  }, []);

  // эффект отслеживает таймер охоты: каждую секунду уменьшаем seconds
  useEffect(() => {
    if (!isHunting) return; // если не в охоте — ничего не делаем
    if (seconds <= 0) {
      // время вышло — завершить охоту
      finishHunt();
      return;
    }
    // установить timeout на одну секунду
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t); }, [isHunting, seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // начать охоту: выставить флаги, установить таймер и вызвать action
  const startHunt = () => { setIsHunting(true); setSeconds(12); setFound(null); startHuntAction(); };

  // завершить охоту: получить результат, показать найденный предмет и обновить данные
  const finishHunt = () => { try { const result = claimHunt(); setFound(result.item); refresh(); } finally { setIsHunting(false); } };

  // поставить лайк предмету и обновить данные
  const like = id => { likeItem(id); refresh(); };

  // удалить предмет (убрать в кладовую), закрыть модалку и показать тост
  const remove = id => { removeItem(id); setModal(null); refresh(); setToast("Предмет аккуратно убран в кладовую"); setTimeout(() => setToast(""), 2500); };

  // погладить кота: вызвать действие и показать сообщение
  const pet = () => { const x = petCat(); setToast(x.message); refresh(); setTimeout(() => setToast(""), 1800); };

  // переименовать кота через API-метод renameCat и обновить интерфейс
  const rename = name => { const result = renameCat(name); if (!result.error) { refresh(); setToast("Новое имя сохранено!"); setTimeout(() => setToast(""), 1800); } };

  // купить или надеть скин: если ошибка — показать, иначе обновить
  const buySkin = id => { const x = buySkinAction(id); if (x.error) { setToast(x.error); setTimeout(() => setToast(""), 2000); return; } refresh(); setToast("Новый образ уже на Плюше!"); setTimeout(() => setToast(""), 2000); };

  // пока данные не загружены — показываем экран загрузки
  if (loading || !data) return <div className="loading">Готовим уютный домик…</div>;

  // выбираем контент по текущей странице
  const content = page === "home" ? <Home data={data} isHunting={isHunting} seconds={seconds} found={found} onHunt={startHunt} onLike={like} onPet={pet} onRename={rename} /> : page === "room" ? <Room items={data.inventory} onOpen={setModal} /> : <Collection items={data.inventory} onOpen={setModal} />;

  // рендер основного интерфейса приложения
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-cat">◖^◗</span>
          <span>МурМир</span>
        </div>
        <nav>
          {nav.map(n => <button key={n.key} className={page === n.key ? "nav active" : "nav"} onClick={() => setPage(n.key)}><span>{n.icon}</span>{n.label}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav"><span>⚙</span>Настройки</button>
        </div>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">ДОБРОЕ УТРО, КОТЁНОК</p>
            <h1>{page === "home" ? "Твой уютный уголок" : page === "room" ? `Комната ${data.cat.name}` : "Твоя коллекция"}</h1>
          </div>
          <div className="header-actions">
            <button className="coin-wallet" onClick={() => setShop(true)}>🪙 <b>{data.cat.coins}</b></button>
            <button className="day">☀️ <span>Солнечно<br /><b>+23°C</b></span></button>
            <button className="bell">♧<i /></button>
            <div className="avatar">◕ᴥ◕</div>
          </div>
        </header>
        {content}
      </section>

      {/* модалка предмета, если выбрана */}
      {modal && <ItemModal item={modal} onClose={() => setModal(null)} onLike={like} onRemove={remove} />}
      {/* модалка магазина */}
      {shop && <ShopModal data={data} onClose={() => setShop(false)} onBuy={buySkin} />}
      {/* тост уведомления */}
      {toast && <div className="toast">✓ {toast}</div>}
      <Analytics />
    </main>
  );
}

function Home({ data, isHunting, seconds, found, onHunt, onLike, onPet, onRename }) {
  // процент заполнения полосы опыта
  const p = Math.min(100, Math.round((data.cat.xp / data.cat.nextLevelXp) * 100));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.cat.name);
  const skin = data.skins?.find(s => s.id === data.cat.skin);

  const handleSubmitRename = (e) => {
    e.preventDefault();
    onRename(name);
    setEditing(false);
  };

  return (
    <>
      <section className="hero-grid">
        <div className={`cat-card ${isHunting ? "adventure" : ""}`}>
          <div className="travel-path">✦　·　✦　·　✦</div>
          <div className="spark s1">✦</div>
          <div className="spark s2">✧</div>
          <div className={isHunting ? "cat hunting" : "cat"}>
            <span className="cat-base">🐱</span>
            {skin?.accessory && <span className="cat-accessory">{skin.accessory}</span>}
          </div>
          <div className="cat-shadow" />
          <button className="pet-button" disabled={isHunting} onClick={onPet}>🤍 Погладить</button>
          <p className="cat-speech">{isHunting ? "Ищу сокровища!" : "Мрр... погладь меня!"}</p>
        </div>

        <div className="welcome">
          <p className="eyebrow">ТВОЙ ПУШИСТЫЙ ДРУГ</p>
          {editing ? (
            <form className="rename" onSubmit={handleSubmitRename}>
              <input value={name} onChange={e => setName(e.target.value)} autoFocus maxLength="16" />
              <button>✓</button>
            </form>
          ) : (
            <h2>
              {data.cat.name} <button className="edit-name" onClick={() => setEditing(true)}>✎</button> <span>♀</span>
            </h2>
          )}

          <p className="mood"><i>♥</i> {isHunting ? "Исследует мир" : `Довольна · ${data.cat.pets || 0} ласк`}</p>

          <div className="xp">
            <div>
              <span>Уровень {data.cat.level}</span>
              <b>{data.cat.xp} / {data.cat.nextLevelXp} XP</b>
            </div>
            <div className="progress"><i style={{ width: `${p}%` }} /></div>
          </div>

          <div className="stat-row">
            <span><b>{data.inventory.length}</b> предметов</span>
            <span><b>🪙 {data.cat.coins}</b> монет</span>
          </div>
        </div>

        <div className="hunt-card">
          <span className="hunt-icon">{isHunting ? "🧭" : "🗺️"}</span>
          <p>{isHunting ? "ОХОТА В ПУТИ" : "ВРЕМЯ ПРИКЛЮЧЕНИЙ"}</p>
          <h3>{isHunting ? `Вернётся через ${seconds} с` : "Отправься на охоту"}</h3>
          <button className="primary" disabled={isHunting} onClick={onHunt}>{isHunting ? "Котик путешествует…" : "Отправить на охоту  →"}</button>
        </div>
      </section>

      {found && (
        <section className="find-banner">
          <span>🎉</span>
          <div>
            <small>КОТИК ВЕРНУЛСЯ С НАХОДКОЙ · +{found.coins} 🪙</small>
            <b>{found.emoji} {found.name} <em className={rarityClass[found.rarity]}>{found.rarity}</em></b>
          </div>
          <button onClick={() => onLike(found.id)}>♡ Лайк</button>
        </section>
      )}

      <section className="section-title">
        <div>
          <p className="eyebrow">СВЕЖИЕ НАХОДКИ</p>
          <h2>Последние приключения</h2>
        </div>
        <button className="text-btn">Смотреть всё →</button>
      </section>

      <div className="item-grid">
        {data.inventory.slice(0, 4).map(i => (
          <ItemCard key={i.id} item={i} compact onLike={onLike} />
        ))}
        {data.inventory.length === 0 && <div className="empty">Первая охота уже ждёт вас!</div>}
      </div>
    </>
  );
}

function Room({ items, onOpen }) {
  return (
    <>
      <div className="room-note">
        <span>✦</span>
        <div>
          <b>Комната растёт вместе с тобой</b>
          <p>Каждая находка Плюши найдёт здесь своё уютное место.</p>
        </div>
      </div>

      <section className="room">
        <div className="window">
          <div className="cloud c1" />
          <div className="cloud c2" />
          <span>☀</span>
        </div>
        <div className="wall-art">✧</div>
        <div className="shelf">◌<span>◒</span><span>♧</span></div>
        <div className="bed"><i>♡</i></div>
        <div className="rug">✧</div>

        {items.map((item, n) => (
          <button
            className={`room-item pos${n % 7}`}
            key={item.id}
            onClick={() => onOpen(item)}
            title={item.name}
          >
            <span>{item.emoji}</span>
            <small>{item.name}</small>
          </button>
        ))}

        <div className="floor" />
      </section>

      <p className="room-tip">Нажми на предмет в комнате, чтобы рассмотреть его поближе</p>
    </>
  );
}

function Collection({ items, onOpen }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("Все");
  const [sort, setSort] = useState("new");

  const list = useMemo(() => {
    const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) && (rarity === "Все" || i.rarity === rarity));
    const sorted = filtered.sort((a, b) => {
      if (sort === "likes") return b.likes - a.likes;
      if (sort === "rare") return b.rank - a.rank;
      return new Date(b.receivedAt) - new Date(a.receivedAt);
    });
    return sorted;
  }, [items, query, rarity, sort]);

  return (
    <>
      <div className="filters">
        <div className="search">⌕<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск предметов..." /></div>
        <select value={rarity} onChange={e => setRarity(e.target.value)}>
          <option>Все</option>
          {Object.keys(rarityClass).map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="new">Сначала новые</option>
          <option value="likes">По лайкам</option>
          <option value="rare">По редкости</option>
        </select>
      </div>

      <p className="collection-count">Найдено предметов: <b>{list.length}</b></p>

      <div className="collection-grid">
        {list.map(i => (
          <ItemCard item={i} key={i.id} onOpen={() => onOpen(i)} />
        ))}
      </div>

      {!list.length && <div className="empty">Пока здесь тихо. Отправь Плюшу на охоту!</div>}
    </>
  );
}

function ItemCard({ item, onLike, onOpen, compact }) {
  const handleOpen = () => {
    onOpen && onOpen(item);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    onLike && onLike(item.id);
  };

  return (
    <article className={`item-card ${compact ? "compact" : ""}`} onClick={handleOpen}>
      <div className="item-emoji">
        {item.image ? <img src={item.image} alt={item.name} /> : item.emoji}
      </div>
      <div className="item-info">
        <em className={rarityClass[item.rarity]}>{item.rarity}</em>
        <h3>{item.name}</h3>
        <p>{compact ? "Найдено недавно" : `Найдено ${new Date(item.receivedAt).toLocaleDateString("ru-RU")}`}</p>
      </div>
      <button className={item.likes ? "liked like" : "like"} onClick={handleLike}>♡ <span>{item.likes}</span></button>
    </article>
  );
}

function ItemModal({ item, onClose, onLike, onRemove }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <div className="modal-emoji">{item.image ? <img src={item.image} alt={item.name} /> : item.emoji}</div>
        <em className={rarityClass[item.rarity]}>{item.rarity}</em>
        <h2>{item.name}</h2>
        <p>{item.description || "Плюша нашла этот предмет во время своей прогулки."}</p>
        <div className="earn">Принесла в домик: <b>+{item.coins || 0} 🪙</b></div>
        <div className="modal-actions">
          <button className="primary" onClick={() => onLike(item.id)}>♡ Нравится · {item.likes}</button>
          <button className="remove" onClick={() => onRemove(item.id)}>Убрать</button>
        </div>
      </div>
    </div>
  );
}

function ShopModal({ data, onClose, onBuy }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal shop-modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <p className="eyebrow">ГАРДЕРОБ ПЛЮШИ</p>
        <h2>Образы для котика</h2>
        <div className="shop-coins">Твои монетки: <b>🪙 {data.cat.coins}</b></div>

        <div className="skin-list">
          {(data.skins || []).map(s => {
            const owned = data.skinsOwned?.includes(s.id);
            const active = data.cat.skin === s.id;
            return (
              <div className={`skin ${active ? "active" : ""}`} key={s.id}>
                <span style={{ background: s.accent }}>{s.emoji}</span>
                <div>
                  <b>{s.name}</b>
                  <small>{owned ? (active ? "Надето сейчас" : "Уже твоё") : `🪙 ${s.price}`}</small>
                </div>
                <button disabled={active} className={owned ? "wear" : "buy"} onClick={() => onBuy(s.id)}>{active ? "Надето" : owned ? "Надеть" : "Купить"}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default App;
