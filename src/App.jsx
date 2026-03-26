```javascript
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24, color: "#E74C3C", background: "#1a0a0a", minHeight: "100vh", fontFamily: "monospace" }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>⚠ Render-Fehler</div>
        <pre style={{ fontSize: 12, color: "#ff8888", whiteSpace: "pre-wrap" }}>{this.state.error.message}{"\n\n"}{this.state.error.stack}</pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: "8px 16px", background: "#E74C3C", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Neu laden</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Supabase Config ─────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);

// ─── Theme ───────────────────────────────────────────────────────────────────
const DEFAULT_THEME = {
  accentAnime: "#E94560",
  accentManga: "#9B59B6",
  accentStats: "#F5A623",
  accentUpdates: "#E94560",
  bgApp: "#080d18",
  bgCard: "#111927",
  bgHeader: "#0d1525",
};
const ThemeCtx = React.createContext(DEFAULT_THEME);
function useTheme() { return React.useContext(ThemeCtx); }

// ─── Prefs (geraeteuebergreifend) ────────────────────────────────────────────
const PREF_KEY = "matter_prefs";
async function loadPrefs() {
  if (!USE_SUPABASE) { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; } }
  try {
    const rows = await sbFetch("user_prefs?select=value&key=eq.ui_prefs");
    return rows?.[0]?.value ? JSON.parse(rows[0].value) : {};
  } catch { return {}; }
}
async function savePrefs(prefs) {
  const str = JSON.stringify(prefs);
  if (!USE_SUPABASE) { try { localStorage.setItem(PREF_KEY, str); } catch {} return; }
  try {
    await sbFetch("user_prefs", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key: "ui_prefs", value: str }),
    });
  } catch (e) { console.error("savePrefs failed:", e); }
}

// ─── LocalStorage ────────────────────────────────────────────────────────────
const STORAGE_KEY_A = "nirusu_anime";
const STORAGE_KEY_M = "nirusu_manga";

const INIT_ANIME =[{"id":1,"title":"\"Omae Gotoki ga Maou ni Kateru to Omouna\" to Yuusha Party wo Tsuihou sareta node, Outo de Kimama ni Kurashitai","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":0,"notes":"","mal_id":61587},{"id":2,"title":"2.5-jigen no Ririsa","format":"TV","eps":24,"watched":7,"status":"Abgebrochen","score":6,"notes":"","mal_id":53802},{"id":3,"title":"3D Kanojo: Real Girl","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":36793},{"id":4,"title":"5-toubun no Hanayome","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38101},{"id":5,"title":"5-toubun no Hanayome ∬","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39783},{"id":6,"title":"86","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41457},{"id":7,"title":"91 Days","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32998},{"id":8,"title":"Adachi to Shimamura","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39790},{"id":9,"title":"Aho Girl","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34881},{"id":10,"title":"Ajin","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31580},{"id":11,"title":"Akagami no Shirayuki-hime","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30123},{"id":12,"title":"Akiba Meido Sensou","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":52193},{"id":13,"title":"Akkun to Kanojo","format":"TV","eps":25,"watched":5,"status":"Abgebrochen","score":6,"notes":"","mal_id":36864},{"id":14,"title":"Akudama Drive","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41433},{"id":15,"title":"Akuyaku Reijou nanode Last Boss wo Kattemimashita","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":49979},{"id":16,"title":"Akuyaku Reijou Tensei Ojisan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":0,"notes":"","mal_id":57719},{"id":17,"title":"Ameku Takao no Suiri Karte","format":"TV","eps":12,"watched":0,"status":"Abgebrochen","score":0,"notes":"","mal_id":58600},{"id":18,"title":"Angel Beats!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":6547},{"id":19,"title":"Ano Natsu de Matteru","format":"TV","eps":12,"watched":5,"status":"Pausiert","score":0,"notes":"","mal_id":11433},{"id":20,"title":"Another","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":11111},{"id":21,"title":"Ansatsu Kyoushitsu","format":"TV","eps":22,"watched":22,"status":"Abgeschlossen","score":8,"notes":"","mal_id":24833},{"id":22,"title":"Ansatsu Kyoushitsu 2nd Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":"","mal_id":30654},{"id":23,"title":"Ao Haru Ride","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":21995},{"id":24,"title":"Ao no Exorcist: Kyoto Fujouou-hen","format":"TV","eps":12,"watched":2,"status":"Geplant","score":0,"notes":"","mal_id":33506},{"id":25,"title":"Appleseed (Movie)","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":7,"notes":"","mal_id":54},{"id":26,"title":"Arifureta Shokugyou de Sekai Saikyou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36882},{"id":27,"title":"Arknights: Prelude to Dawn","format":"TV","eps":8,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":50205},{"id":28,"title":"Asobi ni Iku yo!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":6166},{"id":29,"title":"Aura: Maryuuin Kouga Saigo no Tatakai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14669},{"id":30,"title":"B-gata H-kei","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":7817},{"id":31,"title":"B: The Beginning","format":"ONA","eps":12,"watched":12,"status":"Abgeschlossen","score":5,"notes":"","mal_id":32827},{"id":32,"title":"Banana Fish","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36649},{"id":33,"title":"Beelzebub-jou no Okinimesu mama.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37716},{"id":34,"title":"Black Bullet","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":20787},{"id":35,"title":"Black Clover","format":"TV","eps":170,"watched":7,"status":"Abgebrochen","score":0,"notes":"","mal_id":34572},{"id":36,"title":"Black Lagoon","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":889},{"id":37,"title":"Blade Runner: Black Out 2022","format":"ONA","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":"","mal_id":36308},{"id":38,"title":"Blend S","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":34618},{"id":39,"title":"Blue Period","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":46352},{"id":40,"title":"Boku no Hero Academia","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":"","mal_id":31964},{"id":41,"title":"Boku no Hero Academia 2nd Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":"","mal_id":33486},{"id":42,"title":"Boku no Hero Academia 3rd Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":8,"notes":"","mal_id":36456},{"id":43,"title":"Boku no Hero Academia 4th Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":0,"notes":"","mal_id":38408},{"id":44,"title":"Boku no Hero Academia 5th Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":8,"notes":"","mal_id":41587},{"id":45,"title":"Boku no Hero Academia 6th Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":0,"notes":"","mal_id":49918},{"id":46,"title":"Boku no Hero Academia the Movie 1: Futari no Hero","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36896},{"id":47,"title":"Boku no Hero Academia the Movie 1: Futari no Hero Specials","format":"Special","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38699},{"id":48,"title":"Boku no Hero Academia the Movie 3: World Heroes' Mission","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":44200},{"id":49,"title":"Boku no Hero Academia: Ikinokore! Kesshi no Survival Kunren","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42603},{"id":50,"title":"Boku no Kokoro no Yabai Yatsu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":52578},{"id":51,"title":"Bokutachi wa Benkyou ga Dekinai","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38186},{"id":52,"title":"Bokutachi wa Benkyou ga Dekinai!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40004},{"id":53,"title":"Busu ni Hanataba wo.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":53512},{"id":54,"title":"Chainsaw Man","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":44511},{"id":55,"title":"Charlotte","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":28999},{"id":56,"title":"Chi. Chikyuu no Undou ni Tsuite","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":52215},{"id":57,"title":"Chiyu Mahou no Machigatta Tsukaikata","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":49613},{"id":58,"title":"Chou Kaguya-hime!","format":"ONA","eps":1,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":62896},{"id":59,"title":"Choujin Koukousei-tachi wa Isekai demo Yoyuu de Ikinuku you desu!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39523},{"id":60,"title":"Chuunibyou demo Koi ga Shitai!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14741},{"id":61,"title":"Cinderella Girls Gekijou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34257},{"id":62,"title":"Cinderella Girls Gekijou 2nd Season","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35883},{"id":63,"title":"Citrus","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":"","mal_id":34382},{"id":64,"title":"Clannad","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":2167},{"id":65,"title":"Clannad: After Story","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":4181},{"id":66,"title":"Claymore","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":1818},{"id":67,"title":"Code Geass: Hangyaku no Lelouch","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":"","mal_id":1575},{"id":68,"title":"Code Geass: Hangyaku no Lelouch R2","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":2904},{"id":69,"title":"Comic Girls","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35756},{"id":70,"title":"Cowboy Bebop","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":1},{"id":71,"title":"Cyberpunk: Edgerunners","format":"ONA","eps":10,"watched":10,"status":"Abgeschlossen","score":0,"notes":"","mal_id":42310},{"id":72,"title":"Cyberpunk: Edgerunners 2","format":"ONA","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":61990},{"id":73,"title":"Dandadan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":57334},{"id":74,"title":"Dandadan 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":60543},{"id":75,"title":"Danna ga Nani wo Itteiru ka Wakaranai Ken","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":26349},{"id":76,"title":"Danna ga Nani wo Itteiru ka Wakaranai Ken 2 Sure-me","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":29067},{"id":77,"title":"Darling in the FranXX","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":9,"notes":"","mal_id":35849},{"id":78,"title":"Darwin's Game","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38656},{"id":79,"title":"Date A Live","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":15583},{"id":80,"title":"Date A Live II","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":19163},{"id":81,"title":"Date A Live III","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36633},{"id":82,"title":"Date A Live IV","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41461},{"id":83,"title":"Death Note","format":"TV","eps":37,"watched":11,"status":"Abgebrochen","score":0,"notes":"","mal_id":1535},{"id":84,"title":"Death Parade","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":28223},{"id":85,"title":"Demi-chan wa Kataritai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":33988},{"id":86,"title":"Denki-gai no Honya-san","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":24031},{"id":87,"title":"Devils Line","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":4,"notes":"","mal_id":35928},{"id":88,"title":"Devils Line: Anytime Anywhere","format":"OVA","eps":1,"watched":1,"status":"Abgeschlossen","score":4,"notes":"","mal_id":37997},{"id":89,"title":"Dokyuu Hentai HxEros","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40623},{"id":90,"title":"Dorohedoro","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38668},{"id":91,"title":"Dosanko Gal wa Namara Menkoi","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":53421},{"id":92,"title":"Dr. Stone: Stone Wars","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40852},{"id":93,"title":"Dumbbell Nan Kilo Moteru?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39026},{"id":94,"title":"Dungeon Meshi","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":52701},{"id":95,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":"","mal_id":28121},{"id":96,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka II","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":37347},{"id":97,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka III","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":40454},{"id":98,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka III OVA","format":"OVA","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":44983},{"id":99,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka IV: Shin Shou - Meikyuu-hen","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":47164},{"id":100,"title":"Durarara!!","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":6746},{"id":101,"title":"Edens Zero","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42192},{"id":102,"title":"Edomae Elf","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":52081},{"id":103,"title":"Egao no Taenai Shokuba desu.","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":57859},{"id":104,"title":"Eiga Daisuki Pompo-san","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41361},{"id":105,"title":"Elf-san wa Yaserarenai.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":57845},{"id":106,"title":"Elf-san wa Yaserarenai.: Hami Niku no Shima/Calorie Lovers","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":59820},{"id":107,"title":"Elfen Lied","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":226},{"id":108,"title":"Enen no Shouboutai","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":0,"notes":"","mal_id":38671},{"id":109,"title":"Enen no Shouboutai: Ni no Shou","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":0,"notes":"","mal_id":40956},{"id":110,"title":"Enen no Shouboutai: San no Shou","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":51818},{"id":111,"title":"Enen no Shouboutai: San no Shou Part 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":59229},{"id":112,"title":"Ergo Proxy","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":790},{"id":113,"title":"Eromanga-sensei","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":"","mal_id":32901},{"id":114,"title":"Escha Chron","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34208},{"id":115,"title":"Evangelion Movie 2: Ha","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":3784},{"id":116,"title":"Ex-Arm","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38853},{"id":117,"title":"Fairy Tail","format":"TV","eps":175,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":6702},{"id":118,"title":"Frame Arms Girl","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34427},{"id":119,"title":"Fruits Basket 1st Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38680},{"id":120,"title":"Fruits Basket 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40417},{"id":121,"title":"Fruits Basket: The Final","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42938},{"id":122,"title":"Fugou Keiji: Balance:Unlimited","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41120},{"id":123,"title":"Fullmetal Alchemist","format":"TV","eps":51,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":121},{"id":124,"title":"Fullmetal Alchemist: Brotherhood","format":"TV","eps":64,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":5114},{"id":125,"title":"Fumetsu no Anata e","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41025},{"id":126,"title":"Fuufu Ijou, Koibito Miman.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":50425},{"id":127,"title":"Ga-Rei: Zero","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":4725},{"id":128,"title":"Gabriel DropOut","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":33731},{"id":129,"title":"Gal to Kyouryuu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40358},{"id":130,"title":"Gamers!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":34280},{"id":131,"title":"Gangsta.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":25183},{"id":132,"title":"Gate: Jieitai Kanochi nite, Kaku Tatakaeri","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":28907},{"id":133,"title":"Gate: Jieitai Kanochi nite, Kaku Tatakaeri Part 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":31637},{"id":134,"title":"Getsuyoubi no Tawawa","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34213},{"id":135,"title":"Ginga Eiyuu Densetsu","format":"OVA","eps":110,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":820},{"id":136,"title":"Ginga Eiyuu Densetsu: Die Neue These - Kaikou","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":31433},{"id":137,"title":"Ginga Tetsudou 999","format":"TV","eps":113,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":1491},{"id":138,"title":"Giniro no Kami no Agito","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":1140},{"id":139,"title":"Goblin Slayer","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":37349},{"id":140,"title":"Goblin Slayer II","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":47160},{"id":141,"title":"Goblin Slayer: Goblin's Crown","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39576},{"id":142,"title":"Godzilla: S.P","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":43229},{"id":143,"title":"Golden Kamuy","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36028},{"id":144,"title":"Golden Kamuy 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37989},{"id":145,"title":"Golden Kamuy 3rd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40059},{"id":146,"title":"Golden Kamuy 4th Season","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":50528},{"id":147,"title":"Golden Time","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":17895},{"id":148,"title":"Golden Time (Movie)","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36789},{"id":149,"title":"Grand Blue","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37105},{"id":150,"title":"Hai to Gensou no Grimgar","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31859},{"id":151,"title":"Haikyuu!!","format":"TV","eps":25,"watched":5,"status":"Abgebrochen","score":0,"notes":"","mal_id":20583},{"id":152,"title":"Haikyuu!! Karasuno Koukou vs. Shiratorizawa Gakuen Koukou","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32935},{"id":153,"title":"Haikyuu!! Riku vs. Kuu","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40262},{"id":154,"title":"Haikyuu!! Second Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":28891},{"id":155,"title":"Haikyuu!! To the Top","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38883},{"id":156,"title":"Haikyuu!! To the Top Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40776},{"id":157,"title":"Haite Kudasai, Takamine-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":59457},{"id":158,"title":"Hakata Tonkotsu Ramens","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35889},{"id":159,"title":"Hataraku Maou-sama!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":15809},{"id":160,"title":"Hataraku Maou-sama!! 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":53200},{"id":161,"title":"Hataraku Saibou","format":"TV","eps":13,"watched":3,"status":"Pausiert","score":0,"notes":"","mal_id":37141},{"id":162,"title":"Hataraku Saibou Black","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41694},{"id":163,"title":"Heion Sedai no Idaten-tachi","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42625},{"id":164,"title":"Hibike! Euphonium Movie 2: Todoketai Melody","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35082},{"id":165,"title":"Hige wo Soru. Soshite Joshikousei wo Hirou.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40938},{"id":166,"title":"High School DxD","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":11617},{"id":167,"title":"Himouto! Umaru-chan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":28825},{"id":168,"title":"Himouto! Umaru-chan R","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":35376},{"id":169,"title":"Hinamatsuri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36296},{"id":170,"title":"Honobono Log","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":33241},{"id":171,"title":"Horimiya","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":42897},{"id":172,"title":"Horimiya: Piece","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":54856},{"id":173,"title":"Hoshiai no Sora","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37972},{"id":174,"title":"Hunter x Hunter (2011)","format":"TV","eps":148,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":11061},{"id":175,"title":"Hyouka","format":"TV","eps":22,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":12189},{"id":176,"title":"Ijiranaide, Nagatoro-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42361},{"id":177,"title":"Ikebukuro West Gate Park","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40359},{"id":178,"title":"Ikoku Nikki","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":58788},{"id":179,"title":"Imouto sae Ireba Ii.","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":35413},{"id":180,"title":"Inuyashiki","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":7,"notes":"","mal_id":34542},{"id":181,"title":"Isekai Harem Monogatari","format":"OVA","eps":4,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41848},{"id":182,"title":"Isekai Maou to Shoukan Shoujo no Dorei Majutsu","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":"","mal_id":37210},{"id":183,"title":"Isekai Maou to Shoukan Shoujo no Dorei Majutsu Ω","format":"TV","eps":10,"watched":3,"status":"Abgebrochen","score":0,"notes":"","mal_id":41623},{"id":184,"title":"Isekai Nonbiri Nouka","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":51462},{"id":185,"title":"Ishuzoku Reviewers","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":40010},{"id":186,"title":"Itai no wa Iya nanode Bougyoryoku ni Kyokufuri Shitai to Omoimasu.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38790},{"id":187,"title":"Iya na Kao sare nagara Opantsu Misete Moraitai","format":"ONA","eps":6,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":37021},{"id":188,"title":"Jaku-Chara Tomozaki-kun","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40530},{"id":189,"title":"Jibaku Shounen Hanako-kun","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39534},{"id":190,"title":"Jigokuraku","format":"TV","eps":13,"watched":7,"status":"Abgebrochen","score":0,"notes":"","mal_id":46569},{"id":191,"title":"JoJo no Kimyou na Bouken (TV)","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14719},{"id":192,"title":"JoJo no Kimyou na Bouken Part 3: Stardust Crusaders","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":20899},{"id":193,"title":"JoJo no Kimyou na Bouken Part 3: Stardust Crusaders - Egypt-hen","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":26055},{"id":194,"title":"JoJo no Kimyou na Bouken Part 4: Diamond wa Kudakenai","format":"TV","eps":39,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31933},{"id":195,"title":"JoJo no Kimyou na Bouken Part 5: Ougon no Kaze","format":"TV","eps":39,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37991},{"id":196,"title":"Jormungand","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":12413},{"id":197,"title":"Jormungand: Perfect Order","format":"TV","eps":12,"watched":4,"status":"Pausiert","score":0,"notes":"","mal_id":13331},{"id":198,"title":"Josee to Tora to Sakana-tachi","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40787},{"id":199,"title":"Joshiochi! 2-kai kara Onnanoko ga... Futtekita!?","format":"ONA","eps":9,"watched":1,"status":"Abgebrochen","score":0,"notes":"","mal_id":37281},{"id":200,"title":"Joshiraku","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":12679},{"id":201,"title":"Jouran: The Princess of Snow and Blood","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":47250},{"id":202,"title":"Jujutsu Kaisen","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":"","mal_id":40748},{"id":203,"title":"Jujutsu Kaisen 2nd Season","format":"TV","eps":23,"watched":23,"status":"Abgeschlossen","score":9,"notes":"","mal_id":51009},{"id":204,"title":"Just Because!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35639},{"id":205,"title":"Juuni Taisen","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":"","mal_id":35076},{"id":206,"title":"Kage no Jitsuryokusha ni Naritakute!","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":48316},{"id":207,"title":"Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37999},{"id":208,"title":"Kaguya-sama wa Kokurasetai? Tensai-tachi no Renai Zunousen","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40591},{"id":209,"title":"Kaichou wa Maid-sama!","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":7054},{"id":210,"title":"Kaifuku Jutsushi no Yarinaoshi","format":"TV","eps":12,"watched":6,"status":"Abgebrochen","score":0,"notes":"","mal_id":40750},{"id":211,"title":"Kamisama ni Natta Hi","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41930},{"id":212,"title":"Kanojo, Okarishimasu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40839},{"id":213,"title":"Kaoru Hana wa Rin to Saku","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":"","mal_id":59845},{"id":214,"title":"Karakai Jouzu no Takagi-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35860},{"id":215,"title":"Karakai Jouzu no Takagi-san 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38993},{"id":216,"title":"Karasu wa Aruji wo Erabanai","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":56980},{"id":217,"title":"Kawaikereba Hentai demo Suki ni Natte Kuremasu ka?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39326},{"id":218,"title":"Keikenzumi na Kimi to, Keiken Zero na Ore ga, Otsukiai suru Hanashi.","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":52990},{"id":219,"title":"Kekkon Yubiwa Monogatari","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":54265},{"id":220,"title":"Kenja no Mago","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36407},{"id":221,"title":"Keppeki Danshi! Aoyama-kun","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":4,"notes":"","mal_id":34825},{"id":222,"title":"Kidou Senshi Gundam","format":"TV","eps":43,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":80},{"id":223,"title":"Kidou Senshi Gundam Thunderbolt","format":"ONA","eps":4,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31973},{"id":224,"title":"Kidou Senshi Gundam: Suisei no Majo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":49828},{"id":225,"title":"Kill la Kill","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":18679},{"id":226,"title":"Kimetsu no Yaiba Movie: Mugen Ressha-hen","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40456},{"id":227,"title":"Kimi ni Todoke","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":6045},{"id":228,"title":"Kimi ni Todoke 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":9656},{"id":229,"title":"Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":54714},{"id":230,"title":"Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo 2nd Season","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":57616},{"id":231,"title":"Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo 3rd Season","format":"TV","eps":0,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":62811},{"id":232,"title":"Kimi no Na wa.","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":"","mal_id":32281},{"id":233,"title":"Kimi no Suizou wo Tabetai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36098},{"id":234,"title":"Kimi to, Nami ni Noretara","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38594},{"id":235,"title":"Kin no Kuni Mizu no Kuni","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":52186},{"id":236,"title":"Kingdom 3rd Season","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40682},{"id":237,"title":"Kino no Tabi: The Beautiful World","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":486},{"id":238,"title":"Kiseijuu: Sei no Kakuritsu","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":22535},{"id":239,"title":"Kishuku Gakkou no Juliet","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37475},{"id":240,"title":"Kobayashi-san Chi no Maid Dragon","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":"","mal_id":33206},{"id":241,"title":"Kobayashi-san Chi no Maid Dragon S","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39247},{"id":242,"title":"Kobayashi-san Chi no Maid Dragon: Valentine, Soshite Onsen! - Amari Kitai Shinaide Kudasai","format":"Special","eps":1,"watched":1,"status":"Abgeschlossen","score":8,"notes":"","mal_id":35363},{"id":243,"title":"Kobayashi-san Chi no OO Dragon","format":"Special","eps":7,"watched":7,"status":"Abgeschlossen","score":6,"notes":"","mal_id":35145},{"id":244,"title":"Koe no Katachi","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":28851},{"id":245,"title":"Koi to Uso","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34934},{"id":246,"title":"Koi to Yobu ni wa Kimochi Warui","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41103},{"id":247,"title":"Koi wa Sekai Seifuku no Ato de","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":48643},{"id":248,"title":"Kono Bijutsu-bu ni wa Mondai ga Aru!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31952},{"id":249,"title":"Kono Kaisha ni Suki na Hito ga Imasu","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":59361},{"id":250,"title":"Kono Subarashii Sekai ni Shukufuku wo!","format":"TV","eps":10,"watched":1,"status":"Pausiert","score":0,"notes":"","mal_id":30831},{"id":251,"title":"Kono Subarashii Sekai ni Shukufuku wo! 2","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32937},{"id":252,"title":"Konohana Kitan","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35241},{"id":253,"title":"Kotonoha no Niwa","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":"","mal_id":16782},{"id":254,"title":"Koukaku Kidoutai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":43},{"id":255,"title":"Koukaku Kidoutai: Stand Alone Complex - Solid State Society 3D","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":10090},{"id":256,"title":"Koukaku Kidoutai: Stand Alone Complex 2nd GIG","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":801},{"id":257,"title":"Koutetsujou no Kabaneri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":28623},{"id":258,"title":"Kujira no Kora wa Sajou ni Utau","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":34712},{"id":259,"title":"Kuroko no Basket","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":6,"notes":"","mal_id":11771},{"id":260,"title":"Kuroko no Basket 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":16894},{"id":261,"title":"Kuroko no Basket 3rd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":24415},{"id":262,"title":"Kuroko no Basket Movie 4: Last Game","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31658},{"id":263,"title":"Kusuriya no Hitorigoto 2nd Season","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":58514},{"id":264,"title":"Kuzu no Honkai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32949},{"id":265,"title":"Kyokou Suiri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39017},{"id":266,"title":"Kyoukai no Kanata","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":18153},{"id":267,"title":"Kyoukai no Kanata Movie 1: I'll Be Here - Kako-hen","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":25015},{"id":268,"title":"Kyoukai no Kanata Movie 2: I'll Be Here - Mirai-hen","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":28675},{"id":269,"title":"Kyoukai no Kanata: Shinonome","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":23385},{"id":270,"title":"Leadale no Daichi nite","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":48239},{"id":271,"title":"Little Busters!","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":13655},{"id":272,"title":"Little Witch Academia","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14349},{"id":273,"title":"Log Horizon","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":17265},{"id":274,"title":"Log Horizon 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":23321},{"id":275,"title":"Log Horizon: Entaku Houkai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41109},{"id":276,"title":"Lupin the IIIrd: Chikemuri no Ishikawa Goemon","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34021},{"id":277,"title":"Lupin the IIIrd: Jigen Daisuke no Bohyou","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":23293},{"id":278,"title":"Lycoris Recoil: Friends Are Thieves of Time.","format":"ONA","eps":6,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":59369},{"id":279,"title":"Macross","format":"TV","eps":36,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":1088},{"id":280,"title":"Macross F","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":3572},{"id":281,"title":"Made in Abyss","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":"","mal_id":34599},{"id":282,"title":"Made in Abyss Movie 1: Tabidachi no Yoake","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37514},{"id":283,"title":"Made in Abyss Movie 2: Hourou Suru Tasogare","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37515},{"id":284,"title":"Made in Abyss Movie 3: Fukaki Tamashii no Reimei","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36862},{"id":285,"title":"Made in Abyss: Retsujitsu no Ougonkyou","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41084},{"id":286,"title":"Magia Record: Mahou Shoujo Madoka☆Magica Gaiden","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38256},{"id":287,"title":"Mahou Shoujo Madoka★Magica","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":9756},{"id":288,"title":"Mahou Shoujo ni Akogarete","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":54722},{"id":289,"title":"Mahou Shoujo Site","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36266},{"id":290,"title":"Mahouka Koukou no Rettousei","format":"TV","eps":26,"watched":26,"status":"Abgeschlossen","score":4,"notes":"","mal_id":20785},{"id":291,"title":"Mahoutsukai no Yome","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35062},{"id":292,"title":"Mahoutsukai no Yome Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":52955},{"id":293,"title":"Mairimashita! Iruma-kun","format":"TV","eps":23,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":39196},{"id":294,"title":"Majo no Tabitabi","format":"TV","eps":12,"watched":2,"status":"Pausiert","score":0,"notes":"","mal_id":40571},{"id":295,"title":"Manaria Friends","format":"TV","eps":10,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":31537},{"id":296,"title":"Maou Gakuin no Futekigousha: Shijou Saikyou no Maou no Shiso, Tensei shite Shison-tachi no Gakkou e Kayou","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":"","mal_id":40496},{"id":297,"title":"Maou no Ore ga Dorei Elf wo Yome ni Shitanda ga, Dou Medereba Ii?","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":53434},{"id":298,"title":"Maoujou de Oyasumi","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40397},{"id":299,"title":"Mars Red","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41265},{"id":300,"title":"Marulk-chan no Nichijou","format":"Movie","eps":4,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40897},{"id":301,"title":"Masou Gakuen HxH","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31845},{"id":302,"title":"Mato Seihei no Slave","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":50392},{"id":303,"title":"Mato Seihei no Slave 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":58505},{"id":304,"title":"Megalo Box","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":"","mal_id":36563},{"id":305,"title":"Metropolis","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":522},{"id":306,"title":"Mirai Nikki (TV)","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":10620},{"id":307,"title":"Mo Dao Zu Shi","format":"ONA","eps":15,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37208},{"id":308,"title":"Mob Psycho 100","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":32182},{"id":309,"title":"Mob Psycho 100 II","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":10,"notes":"","mal_id":37510},{"id":310,"title":"Mob Psycho 100 III","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":"","mal_id":50172},{"id":311,"title":"Momokuri","format":"ONA","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30014},{"id":312,"title":"Mononoke Hime","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":"","mal_id":164},{"id":313,"title":"Munou na Nana","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41619},{"id":314,"title":"Musekinin Kanchou Tylor","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":569},{"id":315,"title":"Mushoku Tensei II: Isekai Ittara Honki Dasu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":51179},{"id":316,"title":"Mushoku Tensei: Isekai Ittara Honki Dasu","format":"TV","eps":11,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":39535},{"id":317,"title":"Nagi no Asu kara","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":16067},{"id":318,"title":"Nana","format":"TV","eps":47,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":877},{"id":319,"title":"Nanatsu no Taizai","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":"","mal_id":23755},{"id":320,"title":"Nanatsu no Taizai: Imashime no Fukkatsu","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":7,"notes":"","mal_id":34577},{"id":321,"title":"Nanatsu no Taizai: Kamigami no Gekirin","format":"TV","eps":24,"watched":6,"status":"Abgebrochen","score":4,"notes":"","mal_id":39701},{"id":322,"title":"NEET Kunoichi to Nazeka Dousei Hajimemashita","format":"TV","eps":24,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":58082},{"id":323,"title":"Nekopara","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38924},{"id":324,"title":"Net-juu no Susume","format":"TV","eps":10,"watched":10,"status":"Abgeschlossen","score":8,"notes":"","mal_id":36038},{"id":325,"title":"Net-juu no Susume Special","format":"Special","eps":1,"watched":1,"status":"Abgeschlossen","score":7,"notes":"","mal_id":36043},{"id":326,"title":"Netoge no Yome wa Onnanoko ja Nai to Omotta?","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":"","mal_id":31404},{"id":327,"title":"New Game!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31953},{"id":328,"title":"New Game!!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34914},{"id":329,"title":"NHK ni Youkoso!","format":"TV","eps":24,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":1210},{"id":330,"title":"Nichijou","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":10165},{"id":331,"title":"Nihon Chinbotsu 2020","format":"ONA","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40515},{"id":332,"title":"Nihon e Youkoso Elf-san.","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":57648},{"id":333,"title":"Ninja to Koroshiya no Futarigurashi","format":"TV","eps":12,"watched":5,"status":"Am Schauen","score":0,"notes":"","mal_id":58725},{"id":334,"title":"No Game No Life","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":19815},{"id":335,"title":"No Game No Life: Zero","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":33674},{"id":336,"title":"No Guns Life","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39539},{"id":337,"title":"No Guns Life 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40529},{"id":338,"title":"Nomad: Megalo Box 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40729},{"id":339,"title":"Noragami","format":"TV","eps":12,"watched":4,"status":"Abgebrochen","score":0,"notes":"","mal_id":20507},{"id":340,"title":"Ochikobore Fruit Tart","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39609},{"id":341,"title":"Odd Taxi","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":46102},{"id":342,"title":"Okinawa de Suki ni Natta Ko ga Hougen Sugite Tsurasugiru","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":55842},{"id":343,"title":"Omiai Aite wa Oshiego, Tsuyoki na, Mondaiji.","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36198},{"id":344,"title":"One Punch Man","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":30276},{"id":345,"title":"One Punch Man 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34134},{"id":346,"title":"One Punch Man 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":52807},{"id":347,"title":"Orange","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32729},{"id":348,"title":"Orange: Mirai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34136},{"id":349,"title":"Ore dake Level Up na Ken","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":52299},{"id":350,"title":"Ore dake Level Up na Ken Season 2: Arise from the Shadow","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":58567},{"id":351,"title":"Ore Monogatari!!","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":"","mal_id":28297},{"id":352,"title":"Ore wo Suki nano wa Omae dake ka yo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38483},{"id":353,"title":"Osake wa Fuufu ni Natte kara","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":5,"notes":"","mal_id":35484},{"id":354,"title":"Oshiete! Galko-chan","format":"TV","eps":12,"watched":1,"status":"Pausiert","score":0,"notes":"","mal_id":32013},{"id":355,"title":"Otome Game Sekai wa Mob ni Kibishii Sekai desu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":50461},{"id":356,"title":"Ousama Ranking","format":"TV","eps":23,"watched":11,"status":"Abgebrochen","score":0,"notes":"","mal_id":40834},{"id":357,"title":"Overlord","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":"","mal_id":29803},{"id":358,"title":"Overlord II","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":35073},{"id":359,"title":"Overlord III","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":"","mal_id":37675},{"id":360,"title":"Overlord IV","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":48895},{"id":361,"title":"Ping Pong the Animation","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":22135},{"id":362,"title":"Planetes","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":329},{"id":363,"title":"Plastic Memories","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":27775},{"id":364,"title":"Plunderer","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37345},{"id":365,"title":"Pluto","format":"ONA","eps":8,"watched":3,"status":"Am Schauen","score":0,"notes":"","mal_id":35737},{"id":366,"title":"Poputepipikku","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":"","mal_id":35330},{"id":367,"title":"Princess Connect! Re:Dive","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39292},{"id":368,"title":"Princess Principal","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35240},{"id":369,"title":"Psycho-Pass","format":"TV","eps":22,"watched":1,"status":"Geplant","score":0,"notes":"","mal_id":13601},{"id":370,"title":"Psycho-Pass 3","format":"TV","eps":8,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39491},{"id":371,"title":"Psycho-Pass 3: First Inspector","format":"ONA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40858},{"id":372,"title":"Raise wa Tanin ga Ii","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":56964},{"id":373,"title":"Rakudai Kishi no Cavalry","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30296},{"id":374,"title":"Re:Zero kara Hajimeru Isekai Seikatsu","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":31240},{"id":375,"title":"Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42203},{"id":376,"title":"ReLIFE","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30015},{"id":377,"title":"Rikei ga Koi ni Ochita no de Shoumei shitemita.","format":"TV","eps":12,"watched":3,"status":"Pausiert","score":0,"notes":"","mal_id":38992},{"id":378,"title":"Rock wa Lady no Tashinami deshite","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":59360},{"id":379,"title":"S-Rank Monster no \"Behemoth\" dakedo, Neko to Machigawarete Elf Musume no Pet toshite Kurashitemasu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":58473},{"id":380,"title":"Saenai Heroine no Sodatekata","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":23277},{"id":381,"title":"Saenai Heroine no Sodatekata ♭","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30727},{"id":382,"title":"Saenai Heroine no Sodatekata ♭: Koi to Junjou no Service-kai","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35338},{"id":383,"title":"Saenai Heroine no Sodatekata: Ai to Seishun no Service-kai","format":"TV","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":29317},{"id":384,"title":"Saijaku Muhai no Bahamut","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30749},{"id":385,"title":"Sakamoto Days","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":58939},{"id":386,"title":"Sakamoto desu ga?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32542},{"id":387,"title":"Sakura Trick","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":20047},{"id":388,"title":"Sakura-sou no Pet na Kanojo","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":13759},{"id":389,"title":"Salaryman ga Isekai ni Ittara Shitennou ni Natta Hanashi","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":59349},{"id":390,"title":"Sayonara no Asa ni Yakusoku no Hana wo Kazarou","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35851},{"id":391,"title":"Seihantai na Kimi to Boku","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":9,"notes":"","mal_id":60371},{"id":392,"title":"Seirei no Moribito","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":1827},{"id":393,"title":"Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37450},{"id":394,"title":"Seishun Buta Yarou wa Yumemiru Shoujo no Yume wo Minai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38329},{"id":395,"title":"Sen to Chihiro no Kamikakushi","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":"","mal_id":199},{"id":396,"title":"Senpai ga Uzai Kouhai no Hanashi","format":"TV","eps":12,"watched":3,"status":"Abgebrochen","score":0,"notes":"","mal_id":42351},{"id":397,"title":"Senryuu Shoujo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38787},{"id":398,"title":"Sentouin, Haken shimasu!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41456},{"id":399,"title":"Seraphim Call","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":2245},{"id":400,"title":"Sewayaki Kitsune no Senko-san","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":6,"notes":"","mal_id":38759},{"id":401,"title":"Shaman King (2021)","format":"TV","eps":52,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42205},{"id":402,"title":"Shelter (Music)","format":"Musik","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":"","mal_id":34240},{"id":403,"title":"Shigatsu wa Kimi no Uso","format":"TV","eps":22,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":23273},{"id":404,"title":"Shimoneta to Iu Gainen ga Sonzai Shinai Taikutsu na Sekai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":29786},{"id":405,"title":"Shin Evangelion Movie:||","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":3786},{"id":406,"title":"Shin Kidou Senki Gundam Wing: Endless Waltz","format":"OVA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":91},{"id":407,"title":"Shingeki no Bahamut: Genesis","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":21843},{"id":408,"title":"Shingeki no Bahamut: Virgin Soul","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30736},{"id":409,"title":"Shingeki no Kyojin","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":16498},{"id":410,"title":"Shingeki no Kyojin Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":25777},{"id":411,"title":"Shingeki no Kyojin Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35760},{"id":412,"title":"Shingeki no Kyojin: Kuinaki Sentaku","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":25781},{"id":413,"title":"Shingeki no Kyojin: The Final Season","format":"TV","eps":16,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40028},{"id":414,"title":"Shinigami Bocchan to Kuro Maid","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":47257},{"id":415,"title":"Shinmai Maou no Testament","format":"TV","eps":12,"watched":4,"status":"Abgebrochen","score":0,"notes":"","mal_id":23233},{"id":416,"title":"Shinseiki Evangelion","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":30},{"id":417,"title":"Shinsekai yori","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":13125},{"id":418,"title":"Shoujo Shuumatsu Ryokou","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":"","mal_id":35838},{"id":419,"title":"Shoukoku no Altair","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34547},{"id":420,"title":"SK∞","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42923},{"id":421,"title":"Slime Taoshite 300-nen, Shiranai Uchi ni Level Max ni Nattemashita","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40586},{"id":422,"title":"Slow Start","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35540},{"id":423,"title":"Somali to Mori no Kamisama","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39575},{"id":424,"title":"Sono Bisque Doll wa Koi wo Suru","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":48736},{"id":425,"title":"Sora no Aosa wo Shiru Hito yo","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39569},{"id":426,"title":"Soredemo Ayumu wa Yosetekuru","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":45653},{"id":427,"title":"Sousei no Onmyouji","format":"TV","eps":50,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32105},{"id":428,"title":"Spy Kyoushitsu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":51252},{"id":429,"title":"Steins;Gate","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":9253},{"id":430,"title":"Steins;Gate Movie: Fuka Ryouiki no Déjà vu","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":11577},{"id":431,"title":"Suisei no Gargantia","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":16524},{"id":432,"title":"Suki tte Ii na yo.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14289},{"id":433,"title":"Suki tte Ii na yo.: Mei and Marshmallow","format":"Special","eps":10,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":17409},{"id":434,"title":"Sunohara-sou no Kanrinin-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36817},{"id":435,"title":"Super Cub","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40685},{"id":436,"title":"Sword Art Online","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":4,"notes":"","mal_id":11757},{"id":437,"title":"Sword Art Online Alternative: Gun Gale Online","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":36475},{"id":438,"title":"Sword Art Online II","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":5,"notes":"","mal_id":21881},{"id":439,"title":"Sword Art Online: Alicization - War of Underworld 2nd Season","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40540},{"id":440,"title":"Sword Art Online: Alicization - War of Underworld Recap","format":"TV","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41341},{"id":441,"title":"Takopii no Genzai","format":"ONA","eps":6,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":60489},{"id":442,"title":"Tamako Love Story","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":21647},{"id":443,"title":"Tamako Market","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":16417},{"id":444,"title":"Tate no Yuusha no Nariagari","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35790},{"id":445,"title":"Tengoku Daimakyou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":53393},{"id":446,"title":"Tenkuu no Shiro Laputa","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":"","mal_id":513},{"id":447,"title":"Tensei Oujo to Tensai Reijou no Mahou Kakumei","format":"TV","eps":12,"watched":11,"status":"Am Schauen","score":7,"notes":"","mal_id":52736},{"id":448,"title":"Tensei shitara Ken deshita","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":"","mal_id":49891},{"id":449,"title":"Tensei shitara Slime Datta Ken","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":7,"notes":"","mal_id":37430},{"id":450,"title":"Tensei shitara Slime Datta Ken 2nd Season","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":39551},{"id":451,"title":"Tensei shitara Slime Datta Ken 2nd Season Part 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":41487},{"id":452,"title":"Tensura Nikki: Tensei shitara Slime Datta Ken","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41488},{"id":453,"title":"The God of High School","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41353},{"id":454,"title":"Tokyo Ghoul","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":22319},{"id":455,"title":"Tokyo Ghoul √A","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":2,"notes":"","mal_id":27899},{"id":456,"title":"Tokyo Ghoul:re","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":36511},{"id":457,"title":"Tokyo Ghoul:re 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37799},{"id":458,"title":"Tokyo Godfathers","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":759},{"id":459,"title":"Tonari no Kaibutsu-kun","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14227},{"id":460,"title":"Tongari Boushi no Atelier","format":"TV","eps":0,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":51553},{"id":461,"title":"Tonikaku Kawaii","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":41389},{"id":462,"title":"Tonikaku Kawaii 2nd Season","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":50307},{"id":463,"title":"Tonikaku Kawaii: Joshikou-hen","format":"ONA","eps":4,"watched":4,"status":"Abgeschlossen","score":0,"notes":"","mal_id":55651},{"id":464,"title":"Tonikaku Kawaii: Kaisou","format":"TV","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":"","mal_id":45598},{"id":465,"title":"Toradora!","format":"TV","eps":25,"watched":1,"status":"Pausiert","score":0,"notes":"","mal_id":4224},{"id":466,"title":"Touhai Densetsu Akagi: Yami ni Maiorita Tensai","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":658},{"id":467,"title":"Toumei Otoko to Ningen Onna: Sonouchi Fuufu ni Naru Futari","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":8,"notes":"","mal_id":60395},{"id":468,"title":"Tsurezure Children","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":"","mal_id":34902},{"id":469,"title":"Tsuujou Kougeki ga Zentai Kougeki de Ni-kai Kougeki no Okaasan wa Suki desu ka?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38573},{"id":470,"title":"Tu Bian Yingxiong Leaf","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":35044},{"id":471,"title":"UQ Holder! Mahou Sensei Negima! 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":33478},{"id":472,"title":"Urasekai Picnic","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41392},{"id":473,"title":"Urusei Yatsura (2022) 2nd Season","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":54829},{"id":474,"title":"Uzaki-chan wa Asobitai!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":41226},{"id":475,"title":"Uzaki-chan wa Asobitai! Double","format":"TV","eps":13,"watched":3,"status":"Abgebrochen","score":4,"notes":"","mal_id":42962},{"id":476,"title":"Vanitas no Karte","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":48580},{"id":477,"title":"Vatican Kiseki Chousakan","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34368},{"id":478,"title":"Vinland Saga","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":10,"notes":"","mal_id":37521},{"id":479,"title":"Vinland Saga Season 2","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":10,"notes":"","mal_id":49387},{"id":480,"title":"Violet Evergarden","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":"","mal_id":33352},{"id":481,"title":"Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou","format":"Movie","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":39741},{"id":482,"title":"Violet Evergarden Movie","format":"Movie","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":37987},{"id":483,"title":"Violet Evergarden: Kitto \"Ai\" wo Shiru Hi ga Kuru no Darou","format":"Special","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":37095},{"id":484,"title":"Violet Evergarden: Recollections","format":"Special","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":53672},{"id":485,"title":"VTuber Nandaga Haishin Kiri Wasuretara Densetsu ni Natteta","format":"TV","eps":12,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":54284},{"id":486,"title":"Watashi ga Koibito ni Nareru Wake Nai jan, Muri Muri! (※Muri ja Nakatta!?)","format":"TV","eps":12,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":60326},{"id":487,"title":"Watashi ga Motenai no wa Dou Kangaetemo Omaera ga Warui!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":1,"notes":"","mal_id":16742},{"id":488,"title":"Watashi ga Motete Dousunda","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32899},{"id":489,"title":"Watashi ni Tenshi ga Maiorita! Special","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38999},{"id":490,"title":"Watashi no Oshi wa Akuyaku Reijou.","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":"","mal_id":53833},{"id":491,"title":"Watashi wo Tabetai, Hitodenashi","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":"","mal_id":60168},{"id":492,"title":"Witch Watch","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":59597},{"id":493,"title":"Wonder Egg Priority","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":43299},{"id":494,"title":"Working!!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":6956},{"id":495,"title":"World Trigger 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40907},{"id":496,"title":"Wotaku ni Koi wa Muzukashii","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":8,"notes":"","mal_id":35968},{"id":497,"title":"Wotaku ni Koi wa Muzukashii OVA","format":"OVA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38349},{"id":498,"title":"Xian Wang de Richang Shenghuo","format":"ONA","eps":15,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":41094},{"id":499,"title":"Yagate Kimi ni Naru","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":"","mal_id":37786},{"id":500,"title":"Yahari Ore no Seishun Love Comedy wa Machigatteiru.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":14813},{"id":501,"title":"Yaku nara Mug Cup mo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":42568},{"id":502,"title":"Yakusoku no Neverland","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":37779},{"id":503,"title":"Yakusoku no Neverland 2nd Season","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":39617},{"id":504,"title":"Yokohama Kaidashi Kikou: Quiet Country Cafe","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":976},{"id":505,"title":"Youjo Senki","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":32615},{"id":506,"title":"Yubisaki to Renren","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":"","mal_id":55866},{"id":507,"title":"Yuragi-sou no Yuuna-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":36726},{"id":508,"title":"Yuri!!! on Ice","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":"","mal_id":32995},{"id":509,"title":"Yuru Camp△","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":34798},{"id":510,"title":"Yuru Camp△ Season 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":38474},{"id":511,"title":"Yuru Camp△ Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":53410},{"id":512,"title":"Yuukoku no Moriarty","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":8,"notes":"","mal_id":40911},{"id":513,"title":"Yuukoku no Moriarty Part 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":43325},{"id":514,"title":"Zankyou no Terror","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":23283},{"id":515,"title":"Zenonzard The Animation","format":"ONA","eps":9,"watched":0,"status":"Geplant","score":0,"notes":"","mal_id":40940},{"id":516,"title":"Zom 100: Zombie ni Naru made ni Shitai 100 no Koto","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":"","mal_id":54112}];
const INIT_MANGA =[{"id":1,"title":"#Gal to Gal no Yuri","type":"Manga","chapters":0,"read":1,"readVols":1,"volumes":0,"status":"Abgeschlossen","score":8,"notes":"","mal_id":182734},{"id":2,"title":"20th Century Boys","type":"Manga","chapters":249,"read":0,"readVols":0,"volumes":22,"status":"Geplant","score":0,"notes":"","mal_id":3},{"id":3,"title":"2DK, G Pen, Mezamashidokei.","type":"Manga","chapters":45,"read":45,"readVols":8,"volumes":8,"status":"Abgeschlossen","score":7,"notes":"","mal_id":87175},{"id":4,"title":"3-gatsu no Lion","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":1224},{"id":5,"title":"A Pervert's Daily Life","type":"Manga","chapters":145,"read":2,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":"","mal_id":119735},{"id":6,"title":"Accel World/Dural: Magisa Garden","type":"Manga","chapters":62,"read":14,"readVols":2,"volumes":8,"status":"Abgebrochen","score":0,"notes":"","mal_id":35315},{"id":7,"title":"Akatsuki no Yona","type":"Manga","chapters":292,"read":0,"readVols":0,"volumes":48,"status":"Geplant","score":0,"notes":"","mal_id":21525},{"id":8,"title":"Akira","type":"Manga","chapters":120,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":"","mal_id":664},{"id":9,"title":"Aku no Higan","type":"Manga","chapters":37,"read":37,"readVols":4,"volumes":4,"status":"Abgeschlossen","score":7,"notes":"","mal_id":70523},{"id":10,"title":"Aldnoah.Zero","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":4,"status":"Abgebrochen","score":0,"notes":"","mal_id":77213},{"id":11,"title":"Aldnoah.Zero 2nd Season","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":5,"status":"Abgebrochen","score":0,"notes":"","mal_id":91562},{"id":12,"title":"Aldnoah.Zero Gaiden: Twin Gemini","type":"Manga","chapters":14,"read":14,"readVols":4,"volumes":4,"status":"Abgebrochen","score":8,"notes":"","mal_id":83729},{"id":13,"title":"All You Need Is Kill","type":"Manga","chapters":17,"read":17,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":8,"notes":"","mal_id":62887},{"id":14,"title":"All You Need Is Kill","type":"Manga","chapters":4,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":18511},{"id":15,"title":"Amayo no Tsuki","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":142310},{"id":16,"title":"Animeta!","type":"Manga","chapters":28,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":"","mal_id":99347},{"id":17,"title":"Aria","type":"Manga","chapters":67,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":"","mal_id":81},{"id":18,"title":"Ase to Sekken","type":"Manga","chapters":104,"read":0,"readVols":0,"volumes":11,"status":"Pausiert","score":0,"notes":"","mal_id":117840},{"id":19,"title":"Ashita, Kimi ni Aetara","type":"Manga","chapters":10,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":105948},{"id":20,"title":"Ashita, Naisho no Kiss Shiyou","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":114263},{"id":21,"title":"Asoko de Hataraku Musubu-san","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":111477},{"id":22,"title":"Asumi-chan wa Lesbian Fuuzoku ni Kyoumi ga Arimasu!","type":"Manga","chapters":0,"read":17,"readVols":4,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":130126},{"id":23,"title":"Éclair: Anata ni Hibiku Yuri Anthology","type":"Manga","chapters":0,"read":0,"readVols":2,"volumes":5,"status":"Pausiert","score":0,"notes":"","mal_id":103012},{"id":24,"title":"Bakuman.","type":"Manga","chapters":176,"read":0,"readVols":0,"volumes":20,"status":"Geplant","score":0,"notes":"","mal_id":9711},{"id":25,"title":"Banana Fish","type":"Manga","chapters":110,"read":0,"readVols":0,"volumes":19,"status":"Geplant","score":0,"notes":"","mal_id":756},{"id":26,"title":"Beelzebub-jou no Okinimesu mama.","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":"","mal_id":91136},{"id":27,"title":"Berserk","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":2},{"id":28,"title":"Bijin Onna Joushi Takizawa-san","type":"Manga","chapters":0,"read":170,"readVols":1,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":108520},{"id":29,"title":"Black Torch","type":"Manga","chapters":19,"read":19,"readVols":5,"volumes":5,"status":"Abgeschlossen","score":0,"notes":"","mal_id":103786},{"id":30,"title":"Blame!","type":"Manga","chapters":66,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":149},{"id":31,"title":"Blue Period","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":107931},{"id":32,"title":"Boku no Hero Academia","type":"Manga","chapters":432,"read":200,"readVols":21,"volumes":42,"status":"Abgebrochen","score":8,"notes":"","mal_id":75989},{"id":33,"title":"Boku no Hero Academia: Yuuei Hakusho","type":"Manga","chapters":41,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":"","mal_id":98176},{"id":34,"title":"Boku no Kokoro no Yabai Yatsu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":112807},{"id":35,"title":"Bokutachi no Remake","type":"Manga","chapters":35,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":117032},{"id":36,"title":"Bokutachi wa Benkyou ga Dekinai","type":"Manga","chapters":187,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":"","mal_id":103890},{"id":37,"title":"Candy & Cigarettes","type":"Manga","chapters":54,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":103444},{"id":38,"title":"Cat's Eye","type":"Manga","chapters":135,"read":0,"readVols":0,"volumes":18,"status":"Am Lesen","score":0,"notes":"","mal_id":1932},{"id":39,"title":"Chainsaw Man","type":"Manga","chapters":0,"read":160,"readVols":19,"volumes":0,"status":"Am Lesen","score":10,"notes":"","mal_id":116778},{"id":40,"title":"Cigarette & Cherry","type":"Manga","chapters":129,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":112347},{"id":41,"title":"Damedol to Sekai ni Hitori dake no Fan","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":158565},{"id":42,"title":"Dasei 67 Percent","type":"Manga","chapters":99,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":"","mal_id":90498},{"id":43,"title":"Dead Dead Demons Dededede Destruction","type":"Manga","chapters":101,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":"","mal_id":70801},{"id":44,"title":"Death Note","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":"","mal_id":21},{"id":45,"title":"Death Note Another Note: Los Angeles BB Renzoku Satsujin Jiken","type":"Manga","chapters":7,"read":7,"readVols":1,"volumes":1,"status":"Abgeschlossen","score":4,"notes":"","mal_id":7458},{"id":46,"title":"Defense Devil","type":"Manga","chapters":100,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":13748},{"id":47,"title":"Dimension W","type":"Manga","chapters":116,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":"","mal_id":42279},{"id":48,"title":"Dive in the Vampire Bund","type":"Manga","chapters":18,"read":10,"readVols":1,"volumes":2,"status":"Abgebrochen","score":0,"notes":"","mal_id":19095},{"id":49,"title":"Dorohedoro","type":"Manga","chapters":190,"read":0,"readVols":0,"volumes":23,"status":"Geplant","score":0,"notes":"","mal_id":1133},{"id":50,"title":"Dosanko Gal wa Namara Menkoi","type":"Manga","chapters":124,"read":36,"readVols":7,"volumes":14,"status":"Am Lesen","score":7,"notes":"","mal_id":121597},{"id":51,"title":"Dream☆Jumbo☆Girl","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Abgeschlossen","score":6,"notes":"","mal_id":182230},{"id":52,"title":"Dungeon Meshi","type":"Manga","chapters":102,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":"","mal_id":85781},{"id":53,"title":"Eden: It's an Endless World!","type":"Manga","chapters":127,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":"","mal_id":731},{"id":54,"title":"Elf-san wa Yaserarenai.","type":"Manga","chapters":56,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":103314},{"id":55,"title":"Enen no Shouboutai","type":"Manga","chapters":305,"read":34,"readVols":4,"volumes":34,"status":"Abgebrochen","score":0,"notes":"","mal_id":91037},{"id":56,"title":"Fire Punch","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":98270},{"id":57,"title":"Fullmetal Alchemist","type":"Manga","chapters":116,"read":0,"readVols":0,"volumes":27,"status":"Geplant","score":0,"notes":"","mal_id":25},{"id":58,"title":"Fumetsu no Anata e","type":"Manga","chapters":204,"read":4,"readVols":1,"volumes":25,"status":"Abgebrochen","score":0,"notes":"","mal_id":102343},{"id":59,"title":"Futari Escape","type":"Manga","chapters":35,"read":8,"readVols":1,"volumes":4,"status":"Am Lesen","score":0,"notes":"","mal_id":130414},{"id":60,"title":"Futari no Renai Shoka","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":57359},{"id":61,"title":"Gangsta.","type":"Manga","chapters":0,"read":0,"readVols":1,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":24903},{"id":62,"title":"Gangsta:Cursed.: EP_Marco Adriano","type":"Manga","chapters":19,"read":0,"readVols":0,"volumes":5,"status":"Abgebrochen","score":0,"notes":"","mal_id":69015},{"id":63,"title":"Gantz","type":"Manga","chapters":383,"read":0,"readVols":0,"volumes":37,"status":"Geplant","score":0,"notes":"","mal_id":564},{"id":64,"title":"Gigant","type":"Manga","chapters":89,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":110727},{"id":65,"title":"Gokushufudou","type":"Manga","chapters":0,"read":0,"readVols":4,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":112922},{"id":66,"title":"Goshujinsama ni wa Suwasemasen!","type":"Manga","chapters":0,"read":6,"readVols":1,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":159803},{"id":67,"title":"Grand Blue","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":70345},{"id":68,"title":"Great Trailers","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":138880},{"id":69,"title":"GTO","type":"Manga","chapters":208,"read":0,"readVols":0,"volumes":25,"status":"Geplant","score":0,"notes":"","mal_id":336},{"id":70,"title":"Hai to Gensou no Grimgar","type":"Manga","chapters":16,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":87637},{"id":71,"title":"Haikyuu!!","type":"Manga","chapters":407,"read":0,"readVols":0,"volumes":45,"status":"Geplant","score":0,"notes":"","mal_id":35243},{"id":72,"title":"Hapi Mari: Happy Marriage!?","type":"Manga","chapters":40,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":12888},{"id":73,"title":"Hataraku Maou-sama!","type":"Manga","chapters":134,"read":0,"readVols":0,"volumes":24,"status":"Geplant","score":0,"notes":"","mal_id":36723},{"id":74,"title":"Hataraku Saibou","type":"Manga","chapters":30,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":"","mal_id":91641},{"id":75,"title":"Hataraku Saibou Black","type":"Manga","chapters":50,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":114638},{"id":76,"title":"Hayama-sensei to Terano-sensei wa Tsukiatteiru","type":"Manga","chapters":28,"read":12,"readVols":3,"volumes":4,"status":"Am Lesen","score":0,"notes":"","mal_id":114702},{"id":77,"title":"Himesama Tanuki no Koizanyou","type":"Manga","chapters":75,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":"","mal_id":65311},{"id":78,"title":"Hochiya-san wa Amari Aru","type":"Manga","chapters":0,"read":10,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":189395},{"id":79,"title":"Horimiya","type":"Manga","chapters":139,"read":139,"readVols":17,"volumes":17,"status":"Abgeschlossen","score":0,"notes":"","mal_id":42451},{"id":80,"title":"Hoshokukei Heroine ni Ato 1-nen Inai ni Taberaremasu","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":116667},{"id":81,"title":"Hotaru no Hikari","type":"Manga","chapters":90,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":"","mal_id":4270},{"id":82,"title":"Houseki no Kuni","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":"","mal_id":44489},{"id":83,"title":"Ikemen Girl to Hakoiri Musume","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":0,"notes":"","mal_id":122672},{"id":84,"title":"Ikigami","type":"Manga","chapters":60,"read":48,"readVols":7,"volumes":10,"status":"Am Lesen","score":9,"notes":"","mal_id":8446},{"id":85,"title":"Innocence: After the Long Goodbye","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":10820},{"id":86,"title":"Inu x Boku SS","type":"Manga","chapters":58,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":17207},{"id":87,"title":"Inuyashiki","type":"Manga","chapters":85,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":64465},{"id":88,"title":"Jagaaaaaan","type":"Manga","chapters":163,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":"","mal_id":104314},{"id":89,"title":"Jibaku Shounen Hanako-kun","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":105084},{"id":90,"title":"Jimoto ni Kaettekitara Osananajimi ga Kowareteta","type":"Manga","chapters":0,"read":36,"readVols":0,"volumes":1,"status":"Am Lesen","score":0,"notes":"","mal_id":162990},{"id":91,"title":"Jitsu wa Watashi Sexless de Nayandemashita","type":"Manga","chapters":5,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":120879},{"id":92,"title":"JoJo no Kimyou na Bouken Part 7: Steel Ball Run","type":"Manga","chapters":96,"read":0,"readVols":0,"volumes":24,"status":"Geplant","score":0,"notes":"","mal_id":1706},{"id":93,"title":"Jumyou wo Kaitotte Moratta. Ichinen ni Tsuki, Ichimanen de.","type":"Manga","chapters":18,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":100448},{"id":94,"title":"Kaette Kudasai! Akutsu-san","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":122353},{"id":95,"title":"Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen","type":"Manga","chapters":281,"read":0,"readVols":0,"volumes":28,"status":"Geplant","score":0,"notes":"","mal_id":90125},{"id":96,"title":"Kaichou wa Maid-sama!","type":"Manga","chapters":98,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":"","mal_id":2921},{"id":97,"title":"Kaichou wa Maid-sama!: Marriage","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":103989},{"id":98,"title":"Kaijin Reijou","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":127968},{"id":99,"title":"Kakei no Alice","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":64671},{"id":100,"title":"Kakkou no Iinazuke","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":123602},{"id":101,"title":"Kakukaku Shikajika","type":"Manga","chapters":34,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":"","mal_id":44307},{"id":102,"title":"Kami no Shizuku","type":"Manga","chapters":439,"read":0,"readVols":0,"volumes":44,"status":"Geplant","score":0,"notes":"","mal_id":3964},{"id":103,"title":"Kanojo mo Kanojo","type":"Manga","chapters":144,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":"","mal_id":124940},{"id":104,"title":"Kanojo ni Naritai Kimi to Boku","type":"Manga","chapters":51,"read":7,"readVols":1,"volumes":4,"status":"Am Lesen","score":0,"notes":"","mal_id":118862},{"id":105,"title":"Kanojo no Kuchizuke","type":"Manga","chapters":0,"read":1,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":92724},{"id":106,"title":"Kanojo, Hitomishirimasu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":128534},{"id":107,"title":"Kaoru Hana wa Rin to Saku","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":144267},{"id":108,"title":"Karakai Jouzu no Takagi-san","type":"Manga","chapters":182,"read":63,"readVols":7,"volumes":20,"status":"Pausiert","score":8,"notes":"","mal_id":78537},{"id":109,"title":"Kase-san Series","type":"Manga","chapters":25,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":"","mal_id":38105},{"id":110,"title":"Kaze no Tani no Nausicaä","type":"Manga","chapters":59,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":651},{"id":111,"title":"Kimi no Na wa.","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":99314},{"id":112,"title":"Kimi no Na wa. Another Side: Earthbound","type":"Manga","chapters":14,"read":14,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":7,"notes":"","mal_id":108023},{"id":113,"title":"Kimi no Okaasan wo Boku ni Kudasai!","type":"Manga","chapters":33,"read":0,"readVols":0,"volumes":4,"status":"Abgebrochen","score":0,"notes":"","mal_id":121740},{"id":114,"title":"Kimi no Suizou wo Tabetai","type":"Manga","chapters":10,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":104538},{"id":115,"title":"Kingdom","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":16765},{"id":116,"title":"Kobayashi-san Chi no Maid Dragon","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":80119},{"id":117,"title":"Koe no Katachi","type":"Manga","chapters":64,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":56805},{"id":118,"title":"Komi-san wa, Comyushou desu.","type":"Manga","chapters":500,"read":47,"readVols":3,"volumes":37,"status":"Pausiert","score":8,"notes":"","mal_id":99007},{"id":119,"title":"Kono Kaisha ni Suki na Hito ga Imasu","type":"Manga","chapters":148,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":"","mal_id":118819},{"id":120,"title":"Kono Oto Tomare!","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":45143},{"id":121,"title":"Koukaku Kidoutai 1.5: Human-Error Processer","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":1028},{"id":122,"title":"Koukaku Kidoutai 2: Manmachine Interface","type":"Manga","chapters":6,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":1026},{"id":123,"title":"Koukaku Kidoutai: Stand Alone Complex","type":"Manga","chapters":42,"read":42,"readVols":5,"volumes":5,"status":"Abgeschlossen","score":8,"notes":"","mal_id":31935},{"id":124,"title":"Koukaku Kidoutai: The Ghost in the Shell","type":"Manga","chapters":11,"read":11,"readVols":1,"volumes":1,"status":"Abgeschlossen","score":10,"notes":"","mal_id":1023},{"id":125,"title":"Koukaku Kidoutai: The Human Algorithm","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":121505},{"id":126,"title":"Kowloon Generic Romance","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":122863},{"id":127,"title":"Kozure Ookami","type":"Manga","chapters":142,"read":0,"readVols":0,"volumes":28,"status":"Geplant","score":0,"notes":"","mal_id":904},{"id":128,"title":"Kuchi ga Saketemo Kimi ni wa","type":"Manga","chapters":3,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":126801},{"id":129,"title":"Kurohyou to 16-sai","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":98615},{"id":130,"title":"Kuutei Dragons","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":101479},{"id":131,"title":"Kuzumi-kun, Kuuki Yometemasu ka?","type":"Manga","chapters":63,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":96050},{"id":132,"title":"Kyou no Cerberus","type":"Manga","chapters":58,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":"","mal_id":57185},{"id":133,"title":"Kyou wa Kanojo ga Inai kara","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":137840},{"id":134,"title":"Kyoukai no Kanata","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":50117},{"id":135,"title":"Love Comedy Manga ni Haitteshimatta node, Oshi no Make Heroine wo Zenryoku de Shiawase ni Suru","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":152087},{"id":136,"title":"MabuSasa","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":"","mal_id":123765},{"id":137,"title":"Machigatteita no wa Ore Datta n da.","type":"Manga","chapters":1,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":121891},{"id":138,"title":"Made in Abyss","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":91941},{"id":139,"title":"Mahoutsukai no Yome","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":61189},{"id":140,"title":"Maid Skater","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":158834},{"id":141,"title":"Maou no Ore ga Dorei Elf wo Yome ni Shitanda ga, Dou Medereba Ii?","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":103707},{"id":142,"title":"Mashou no Otome no Yakumawari","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":171471},{"id":143,"title":"Miageru to Kimi wa","type":"Manga","chapters":33,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":"","mal_id":116775},{"id":144,"title":"Midara na Ao-chan wa Benkyou ga Dekinai","type":"Manga","chapters":39,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":94876},{"id":145,"title":"Mijuku na Futari de Gozaimasu ga","type":"Manga","chapters":152,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":"","mal_id":113938},{"id":146,"title":"Mob Psycho 100","type":"Manga","chapters":109,"read":0,"readVols":0,"volumes":16,"status":"Pausiert","score":9,"notes":"","mal_id":60783},{"id":147,"title":"Monster","type":"Manga","chapters":162,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":"","mal_id":1},{"id":148,"title":"Mousou Telepathy","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":101711},{"id":149,"title":"Murciélago","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":65705},{"id":150,"title":"Mushishi","type":"Manga","chapters":50,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":418},{"id":151,"title":"Nana","type":"Manga","chapters":84,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":"","mal_id":28},{"id":152,"title":"Net-juu no Susume","type":"Manga","chapters":87,"read":0,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":"","mal_id":86648},{"id":153,"title":"NHK ni Youkoso!","type":"Manga","chapters":40,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":463},{"id":154,"title":"Obaachan Shoujo Hinata-chan","type":"Manga","chapters":94,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":92473},{"id":155,"title":"Ojou to Banken-kun","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":119440},{"id":156,"title":"One Piece","type":"Manga","chapters":0,"read":168,"readVols":20,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":13},{"id":157,"title":"One Punch-Man","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":44347},{"id":158,"title":"Oogami-san, Dadamore desu.","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":105707},{"id":159,"title":"Ookii Mukimuki Chiisai Muchimuchi","type":"Manga","chapters":0,"read":4,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":182880},{"id":160,"title":"Ooyukiumi no Kaina","type":"Manga","chapters":26,"read":15,"readVols":3,"volumes":4,"status":"Am Lesen","score":7,"notes":"","mal_id":144449},{"id":161,"title":"Orange","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":"","mal_id":35573},{"id":162,"title":"Otaku ni Yasashii Gal wa Inai!?","type":"Manga","chapters":0,"read":0,"readVols":8,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":144152},{"id":163,"title":"Ousama Game","type":"Manga","chapters":25,"read":25,"readVols":5,"volumes":5,"status":"Abgeschlossen","score":2,"notes":"","mal_id":24836},{"id":164,"title":"Oyasumi Punpun","type":"Manga","chapters":147,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":"","mal_id":4632},{"id":165,"title":"P to JK","type":"Manga","chapters":65,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":"","mal_id":58659},{"id":166,"title":"Planetes","type":"Manga","chapters":27,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":"","mal_id":481},{"id":167,"title":"Pocha Musume wa Koakuma Move ga Yamerarenai","type":"Manga","chapters":24,"read":24,"readVols":3,"volumes":3,"status":"Abgeschlossen","score":8,"notes":"","mal_id":126167},{"id":168,"title":"Ponkotsu Fuuki Iin to Skirt-take ga Futekisetsu na JK no Hanashi","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":119260},{"id":169,"title":"Ponkotsu Ponko","type":"Manga","chapters":79,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":"","mal_id":120250},{"id":170,"title":"Raise wa Tanin ga Ii","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":109229},{"id":171,"title":"ReLIFE","type":"Manga","chapters":238,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":"","mal_id":78523},{"id":172,"title":"Rental Oniichan","type":"Manga","chapters":20,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":"","mal_id":112466},{"id":173,"title":"Ryoushin no Shakkin wo Katagawari shite Morau Jouken wa Nihonichi Kawaii Joshikousei to Issho ni Kurasu Koto deshita.","type":"Manga","chapters":77,"read":0,"readVols":0,"volumes":5,"status":"Pausiert","score":0,"notes":"","mal_id":136791},{"id":174,"title":"Sabishisugite Lesbian Fuuzoku ni Ikimashita Report","type":"Manga","chapters":6,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":99969},{"id":175,"title":"Sachi-iro no One Room","type":"Manga","chapters":69,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":104829},{"id":176,"title":"Sakamoto Days","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":131334},{"id":177,"title":"Sankagetsu Mae ni Wakareta Senpai Kouhai no Hanashi","type":"Manga","chapters":35,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":131099},{"id":178,"title":"Seihantai na Kimi to Boku","type":"Manga","chapters":71,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":147091},{"id":179,"title":"Seishun Buta Yarou wa Logical Witch no Yume wo Minai","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":133988},{"id":180,"title":"Sekai de Ichiban Oppai ga Suki!","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":109265},{"id":181,"title":"Senpai! Imakara Kokurimasu!","type":"Manga","chapters":30,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":"","mal_id":106986},{"id":182,"title":"Sensei wa Koi wo Oshierarenai","type":"Manga","chapters":47,"read":26,"readVols":2,"volumes":7,"status":"Pausiert","score":7,"notes":"","mal_id":117080},{"id":183,"title":"Shachou to Sake to Hoshi","type":"Manga","chapters":0,"read":33,"readVols":0,"volumes":0,"status":"Am Lesen","score":7,"notes":"","mal_id":181801},{"id":184,"title":"Shiawase Kanako no Koroshiya Seikatsu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":116681},{"id":185,"title":"Shigatsu wa Kimi no Uso","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":37707},{"id":186,"title":"Shin Elf-san wa Yaserarenai.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":142426},{"id":187,"title":"Shingeki no Kyojin","type":"Manga","chapters":141,"read":114,"readVols":28,"volumes":34,"status":"Pausiert","score":0,"notes":"","mal_id":23390},{"id":188,"title":"Shingeki no Kyojin: Before the Fall","type":"Manga","chapters":73,"read":24,"readVols":7,"volumes":17,"status":"Pausiert","score":0,"notes":"","mal_id":57795},{"id":189,"title":"Shingeki no Kyojin: Kakuzetsu Toshi no Joou","type":"Manga","chapters":7,"read":7,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":8,"notes":"","mal_id":75859},{"id":190,"title":"Shingeki no Kyojin: Kuinaki Sentaku","type":"Manga","chapters":8,"read":8,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":8,"notes":"","mal_id":58007},{"id":191,"title":"Shingeki no Kyojin: Lost Girls","type":"Manga","chapters":3,"read":3,"readVols":1,"volumes":1,"status":"Abgeschlossen","score":7,"notes":"","mal_id":82799},{"id":192,"title":"Shingeki no Kyojin: Lost Girls","type":"Manga","chapters":10,"read":10,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":7,"notes":"","mal_id":91047},{"id":193,"title":"Shoujo Shuumatsu Ryokou","type":"Manga","chapters":47,"read":21,"readVols":3,"volumes":6,"status":"Am Lesen","score":10,"notes":"","mal_id":72467},{"id":194,"title":"Shuumatsu Touring","type":"Manga","chapters":0,"read":5,"readVols":1,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":130154},{"id":195,"title":"Slam Dunk","type":"Manga","chapters":276,"read":0,"readVols":0,"volumes":31,"status":"Geplant","score":0,"notes":"","mal_id":51},{"id":196,"title":"Somali to Mori no Kamisama","type":"Manga","chapters":39,"read":39,"readVols":6,"volumes":6,"status":"Abgeschlossen","score":8,"notes":"","mal_id":95452},{"id":197,"title":"Sono Bisque Doll wa Koi wo Suru","type":"Manga","chapters":119,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":"","mal_id":112268},{"id":198,"title":"Soul Eater","type":"Manga","chapters":117,"read":4,"readVols":1,"volumes":25,"status":"Pausiert","score":0,"notes":"","mal_id":908},{"id":199,"title":"Sousou no Frieren","type":"Manga","chapters":0,"read":47,"readVols":6,"volumes":0,"status":"Am Lesen","score":9,"notes":"","mal_id":126287},{"id":200,"title":"Spy x Family","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":119161},{"id":201,"title":"Succubus & Hitman","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":126653},{"id":202,"title":"Suki x Suki","type":"Manga","chapters":23,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":"","mal_id":98971},{"id":203,"title":"Super no Ura de Yani Suu Futari","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":148467},{"id":204,"title":"Suzumiya Haruhi-chan no Yuuutsu","type":"Manga","chapters":164,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":"","mal_id":10809},{"id":205,"title":"Taiyou no Ie","type":"Manga","chapters":53,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":"","mal_id":26736},{"id":206,"title":"Tejina-senpai","type":"Manga","chapters":132,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":97292},{"id":207,"title":"Tenkuu Shinpan","type":"Manga","chapters":258,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":"","mal_id":63845},{"id":208,"title":"Terra Formars","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":37563},{"id":209,"title":"To LOVE-Ru","type":"Manga","chapters":162,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":"","mal_id":671},{"id":210,"title":"Tokyo Ghoul","type":"Manga","chapters":144,"read":144,"readVols":14,"volumes":14,"status":"Abgeschlossen","score":9,"notes":"","mal_id":33327},{"id":211,"title":"Tokyo Ghoul","type":"Manga","chapters":17,"read":0,"readVols":1,"volumes":3,"status":"Pausiert","score":0,"notes":"","mal_id":74847},{"id":212,"title":"Tokyo Ghoul:re","type":"Manga","chapters":181,"read":110,"readVols":10,"volumes":16,"status":"Pausiert","score":0,"notes":"","mal_id":81117},{"id":213,"title":"Tongari Boushi no Atelier","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":100035},{"id":214,"title":"Tonikaku Kawaii","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":112589},{"id":215,"title":"Totsukuni no Shoujo","type":"Manga","chapters":53,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":"","mal_id":93972},{"id":216,"title":"Toumei Otoko to Ningen Onna: Sonouchi Fuufu ni Naru Futari","type":"Manga","chapters":0,"read":36,"readVols":4,"volumes":0,"status":"Pausiert","score":9,"notes":"","mal_id":143023},{"id":217,"title":"Tower Dungeon","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":163232},{"id":218,"title":"Tsukiatte Agetemo Ii kana","type":"Manga","chapters":133,"read":113,"readVols":12,"volumes":14,"status":"Am Lesen","score":8,"notes":"","mal_id":117020},{"id":219,"title":"Tsukuritai Onna to Tabetai Onna","type":"Manga","chapters":0,"read":49,"readVols":5,"volumes":0,"status":"Am Lesen","score":0,"notes":"","mal_id":140295},{"id":220,"title":"Tsurezure Children","type":"Manga","chapters":212,"read":0,"readVols":0,"volumes":12,"status":"Pausiert","score":0,"notes":"","mal_id":58027},{"id":221,"title":"Uchi no Kaisha no Chiisai Senpai no Hanashi","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":123437},{"id":222,"title":"Uchuu Kyoudai","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":14483},{"id":223,"title":"Ultraman","type":"Manga","chapters":0,"read":20,"readVols":4,"volumes":0,"status":"Abgebrochen","score":5,"notes":"","mal_id":32913},{"id":224,"title":"Umarekawattemo Mata, Watashi to Kekkon shitekuremasu ka","type":"Manga","chapters":26,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":"","mal_id":114043},{"id":225,"title":"Umineko no Naku Koro ni Chiru - Episode 8: Twilight of the Golden Witch","type":"Manga","chapters":42,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":"","mal_id":34053},{"id":226,"title":"Unemployed Gye Baek-soon","type":"Manga","chapters":0,"read":14,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":"","mal_id":167846},{"id":227,"title":"Vagabond","type":"Manga","chapters":327,"read":0,"readVols":0,"volumes":37,"status":"Geplant","score":0,"notes":"","mal_id":656},{"id":228,"title":"Vampeerz","type":"Manga","chapters":46,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":"","mal_id":121226},{"id":229,"title":"Veil","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":132678},{"id":230,"title":"Vigilante: Boku no Hero Academia Illegals","type":"Manga","chapters":132,"read":5,"readVols":1,"volumes":15,"status":"Abgebrochen","score":6,"notes":"","mal_id":99949},{"id":231,"title":"Vinland Saga","type":"Manga","chapters":224,"read":0,"readVols":0,"volumes":29,"status":"Geplant","score":0,"notes":"","mal_id":642},{"id":232,"title":"Watashi no Shumi tte Hen desu ka?","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":1,"status":"Pausiert","score":0,"notes":"","mal_id":98421},{"id":233,"title":"Watashitachi no Shiawase na Jikan","type":"Manga","chapters":8,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":"","mal_id":11734},{"id":234,"title":"Wotaku ni Koi wa Muzukashii","type":"Manga","chapters":105,"read":105,"readVols":11,"volumes":11,"status":"Abgeschlossen","score":9,"notes":"","mal_id":89087},{"id":235,"title":"Yagate Kimi ni Naru","type":"Manga","chapters":50,"read":50,"readVols":8,"volumes":8,"status":"Abgeschlossen","score":9,"notes":"","mal_id":88660},{"id":236,"title":"Yagate Kimi ni Naru: Koushiki Comic Anthology","type":"Manga","chapters":26,"read":26,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":7,"notes":"","mal_id":117697},{"id":237,"title":"Yagate Kimi ni Naru: Saeki Sayaka ni Tsuite","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":115506},{"id":238,"title":"Yaiteru Futari","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":130633},{"id":239,"title":"Yamada to Kase-san.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":143990},{"id":240,"title":"Yamaguchi-kun wa Warukunai","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":128088},{"id":241,"title":"Yankee-kun to Hakujou Girl","type":"Manga","chapters":127,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":"","mal_id":118712},{"id":242,"title":"Yokohama Kaidashi Kikou","type":"Manga","chapters":142,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":"","mal_id":4},{"id":243,"title":"Yokokuhan","type":"Manga","chapters":22,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":37109},{"id":244,"title":"Yoshinozuikara","type":"Manga","chapters":20,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":"","mal_id":118229},{"id":245,"title":"Yotsuba to!","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":104},{"id":246,"title":"Yubisaki to Renren","type":"Manga","chapters":0,"read":44,"readVols":11,"volumes":0,"status":"Pausiert","score":7,"notes":"","mal_id":121504},{"id":247,"title":"Yuru Camp△","type":"Manga","chapters":0,"read":0,"readVols":5,"volumes":0,"status":"Pausiert","score":0,"notes":"","mal_id":94376},{"id":248,"title":"Yuugai Toshi","type":"Manga","chapters":17,"read":17,"readVols":2,"volumes":2,"status":"Abgeschlossen","score":10,"notes":"","mal_id":81429},{"id":249,"title":"Zenbu Kowashite Jigoku de Aishite","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":"","mal_id":157273}];

const STATUS_A     =["Am Schauen","Abgeschlossen","Geplant","Pausiert","Abgebrochen"];
const STATUS_M     =["Am Lesen","Abgeschlossen","Geplant","Pausiert","Abgebrochen"];
const FORMATS      =["TV","Movie","OVA","ONA","Special","TV Special","Music","Musik"];
const TYPES        =["Manga","Manhwa","Manhua","One-Shot","Novel","Light Novel"];
const REL_TYPES    =["Sequel","Prequel","Adaption","Side Story","Spin-off"];
const MAL_FORMAT_MAP = {
  TV:"TV", Movie:"Movie", OVA:"OVA", ONA:"ONA", Special:"Special", Music:"Musik",
  Manga:"Manga", Manhwa:"Manhwa", Manhua:"Manhua", "One-shot":"One-Shot",
  Novel:"Novel", "Light Novel":"Light Novel", Doujinshi:"Manga",
};
const REL_TYPE_MAP = {
  "Sequel":"Sequel","Prequel":"Prequel","Alternative setting":"Alternative",
  "Alternative version":"Alternative","Side story":"Side Story","Parent story":"Prequel",
  "Summary":"Summary","Full story":"Sequel","Spin-off":"Spin-off","Other":"Related",
  "Adaptation":"Adaption","Character":"Related",
};

const SC = {
  "Am Schauen":    "#2ECC71",
  "Am Lesen":      "#2ECC71",
  "Abgeschlossen": "#3498DB",
  "Geplant":       "#9B59B6",
  "Pausiert":      "#F39C12",
  "Abgebrochen":   "#E74C3C",
};

// ─── Utils ────────────────────────────────────────────────────────────────────
function parseMalUrl(url) {
  const m = url.match(/myanimelist\.net\/(anime|manga)\/(\d+)/i);
  return m ? { kind: m[1], id: m[2] } : null;
}
async function fetchMalData(kind, malId, _retries = 0) {
  const res = await fetch(`https://api.jikan.moe/v4/${kind}/${malId}/full`);
  if (res.status === 429 && _retries < 3) { await new Promise(r => setTimeout(r, 2000)); return fetchMalData(kind, malId, _retries + 1); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).data;
}
function parseRelatedFromMAL(data) {
  return (data.relations || []).flatMap(rel => {
    const relType = REL_TYPE_MAP[rel.relation] || "Related";
    return (rel.entry ||[]).map(e => ({
      id: e.mal_id, title: e.name,
      kind: e.type === "anime" ? "anime" : "manga",
      relType,
    }));
  });
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { console.error("localStorage save failed:", key, e); }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadFromSupabase(table) {
  return sbFetch(`${table}?select=*&order=id.asc`);
}

async function upsertToSupabase(table, row) {
  return sbFetch(table, {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
}

async function initSupabase(table, rows) {
  return sbFetch(table, {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

async function deleteFromSupabase(table, id) {
  return sbFetch(`${table}?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal", headers: { Prefer: "return=minimal" } });
}

function scoreColor(s) { return s >= 9 ? "#F5A623" : s >= 7 ? "#2ECC71" : s >= 5 ? "#3498DB" : "#E74C3C"; }
function sIcon(s) { return s === "Am Schauen" || s === "Am Lesen" ? "📖" : s === "Abgeschlossen" ? "✓" : s === "Geplant" ? "◇" : s === "Pausiert" ? "⏸" : "✕"; }

function StarRating({ value, onChange, color = "#F5A623" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => onChange(value === n ? 0 : n)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 22, color: n <= value ? color : "#222", flex: 1, display: "flex", justifyContent: "center" }}>★</button>
      ))}
    </div>
  );
}

// Fixed width for number inputs inside flex layouts
const numStyle = { flex: 1, minWidth: 0, padding: "9px 5px", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 10, color: "#e8e8e8", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "center" };

// ─── RelatedSection ──────────────────────────────────────────────────────────
function RelatedSection({ item, allAnime, allManga, onChange, accent }) {
  const[relType, setRelType] = useState("Sequel");
  const [searchRel, setSearchRel] = useState("");
  const results = useMemo(() => {
    if (!searchRel.trim()) return[];
    const q = searchRel.toLowerCase();
    return[
      ...allAnime.filter(a => a.id !== item.id && a.title.toLowerCase().includes(q)).slice(0, 4).map(a => ({ ...a, _kind: "anime" })),
      ...allManga.filter(m => m.id !== item.id && m.title.toLowerCase().includes(q)).slice(0, 4).map(m => ({ ...m, _kind: "manga" })),
    ].slice(0, 6);
  }, [searchRel, allAnime, allManga, item.id]);

  const addRel = r => {
    const existing = item.related ||[];
    if (existing.some(e => e.id === r.id && e.kind === r._kind)) return;
    onChange({ ...item, related:[...existing, { id: r.id, title: r.title, kind: r._kind, relType }] });
    setSearchRel("");
  };
  const removeRel = (id, kind) => {
    onChange({ ...item, related: (item.related ||[]).filter(r => !(r.id === id && r.kind === kind)) });
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>
        Verwandte Werke
      </div>
      {(item.related ||[]).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {(item.related ||[]).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
              padding: "7px 10px", background: "#ffffff08", borderRadius: 8 }}>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap",
                background: r.kind === "anime" ? "#E9456022" : "#9B59B622",
                color: r.kind === "anime" ? "#E94560" : "#9B59B6" }}>{r.relType}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.kind === "anime" ? "🎬" : "📚"} {r.title}
              </span>
              <button onClick={() => removeRel(r.id, r.kind)}
                style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer",
                  padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {REL_TYPES.map(t => (
          <button key={t} onClick={() => setRelType(t)} style={{
            padding: "4px 10px", fontFamily: "inherit", fontSize: 10, fontWeight: 700, cursor: "pointer",
            borderRadius: 16, border: `1px solid ${relType === t ? accent : "#ffffff12"}`,
            background: relType === t ? accent + "22" : "transparent",
            color: relType === t ? accent : "#666",
          }}>{t}</button>
        ))}
      </div>
      <input value={searchRel} onChange={e => setSearchRel(e.target.value)}
        placeholder="Titel suchen und verknüpfen..."
        style={{ width: "100%", padding: "9px 12px", background: "#ffffff08", border: "1px solid #ffffff10",
          borderRadius: 8, color: "#ccc", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
      />
      {results.length > 0 && (
        <div style={{ marginTop: 4, background: "#1a2438", borderRadius: 8, overflow: "hidden", border: "1px solid #ffffff10" }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => addRel(r)} style={{ padding: "9px 12px", cursor: "pointer", fontSize: 13,
              color: "#ccc", borderBottom: i < results.length - 1 ? "1px solid #ffffff08" : "none",
              display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0,
                color: r._kind === "anime" ? "#E94560" : "#9B59B6" }}>
                {r._kind === "anime" ? "Anime" : "Manga"}
              </span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GridCard (New UI for collapsed entries) ─────────────────────────────────
function GridCard({ item, isAnime, theme, mode, setMode, upd, onTap }) {
  const c = SC[item.status] || "#666";
  const acc = isAnime ? theme.accentAnime : theme.accentManga;
  const hasVols = !isAnime && item.volumes > 0;
  
  const m = isAnime ? "ep" : (mode || "ch");
  const val = isAnime ? item.watched : (m === "ch" ? item.read : item.readVols);
  const max = isAnime ? item.eps : (m === "ch" ? (item.chapters || 0) : (item.volumes || 0));
  const pct = max ? Math.round(((val||0) / max) * 100) : 0;
  const field = isAnime ? "watched" : (m === "ch" ? "read" : "readVols");
  
  const bottomTitle = hasVols ? 85 : 60;
  const fallbackBg = `linear-gradient(135deg, ${acc}44 0%, #111927 100%)`;

  return (
    <div style={{ position: "relative", height: 240, overflow: "hidden", cursor: "pointer", borderRadius: 14, background: "#111927", border: "1px solid #ffffff08" }} onClick={onTap}>
      {/* Background Image or Gradient */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: item.image_url ? `url(${item.image_url})` : fallbackBg, backgroundSize: "cover", backgroundPosition: "center" }} />
      {!item.image_url && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 28, opacity: 0.12, fontWeight: 900, color: "#fff", textAlign: "center", padding: 10 }}>{item.title.substring(0, 4).toUpperCase()}</span>
        </div>
      )}
      
      {/* Top Overlays */}
      {item.score > 0 && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: scoreColor(item.score) }}>{item.score}</span>
        </div>
      )}
      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
        <span style={{ padding: "2px 6px", borderRadius: 6, background: "#000000aa", fontSize: 9, color: acc, fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
        <span style={{ padding: "2px 7px", borderRadius: 6, background: c + "cc", fontSize: 9, color: "#fff", fontWeight: 700 }}>{sIcon(item.status)}</span>
      </div>
      
      {/* Bottom Overlays */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: bottomTitle, left: 10, right: 10, fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
      
      {hasVols && (
        <div style={{ position: "absolute", bottom: 60, left: 10, right: 10, display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={e => { e.stopPropagation(); setMode("ch"); }} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: m === "ch" ? c + "44" : "#ffffff11", color: m === "ch" ? c : "#666" }}>Kapitel</button>
          <button onClick={e => { e.stopPropagation(); setMode("vol"); }} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: m === "vol" ? c + "44" : "#ffffff11", color: m === "vol" ? c : "#666" }}>Bände</button>
        </div>
      )}
      
      <div style={{ position: "absolute", bottom: 52, left: 10, right: 10, height: 3, background: "#ffffff20", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 2, transition: "width .3s" }} />
      </div>
      
      <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={e => e.stopPropagation()}>
        <button onClick={() => upd(field, Math.max(0, (val||0) - 1))} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #ffffff33", background: "#00000088", color: "#ddd", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <div><span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{val||0}</span><span style={{ fontSize: 11, color: "#999" }}>/{max || "?"} {isAnime ? "Ep" : (m === "ch" ? "Kap" : "Bd")}</span></div>
        <button onClick={() => upd(field, Math.min((val||0) + 1, max || 9999))} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: c, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 12px ${c}88` }}>+</button>
      </div>
    </div>
  );
}

// ─── BottomSheet (New UI for expanded item details) ──────────────────────────
function BottomSheet({ item, isAnime, theme, onChange, onClose, onDelete, allAnimeRef, allMangaRef }) {
  const c = SC[item.status] || "#666";
  const acc = isAnime ? theme.accentAnime : theme.accentManga;
  const sep = { height: 1, background: "#ffffff08", margin: "14px 0" };
  const upd = (f, v) => onChange({ ...item, [f]: v });
  
  const statuses = isAnime ? STATUS_A : STATUS_M;
  const malUrl = item.mal_id ? `https://myanimelist.net/${isAnime ? "anime" : "manga"}/${item.mal_id}` : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "#000000aa" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: theme.bgCard, borderRadius: "20px 20px 0 0", boxShadow: "0 -16px 60px #000c", maxHeight: "85vh", overflowY: "auto", animation: "sheetUp .25s ease" }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, background: "#ffffff20", borderRadius: 2 }} />
        </div>
        
        <div style={{ padding: "4px 16px 28px" }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#e8e8e8", flex: 1, marginRight: 10 }}>{item.title}</div>
            <button onClick={onClose} style={{ background: "#ffffff08", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#555", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: acc+"22", color: acc, fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
            {item.genres?.map(g => <span key={g} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: c + "15", color: c, fontWeight: 600 }}>{g}</span>)}
          </div>

          {/* LINKS */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {malUrl && <a href={malUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#2E51A222", color: "#5B7FD4", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>MAL ↗</a>}
            {item.watch_url && /^https?:\/\//i.test(item.watch_url) ? (
              <a href={item.watch_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: acc + "22", color: acc, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>{isAnime ? "▶ Schauen ↗" : "📖 Lesen ↗"}</a>
            ) : (
              <div style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#ffffff06", color: "#333", fontSize: 12, fontWeight: 600, textAlign: "center" }}>Kein Link</div>
            )}
          </div>

          <div style={sep} />

          {/* EDIT TITLES */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 0 4px" }}>
            <input value={item.title||""} onChange={e => upd("title", e.target.value)} placeholder="Titel..."
              style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            <input value={item.subtitle||""} onChange={e => upd("subtitle", e.target.value)} placeholder="Untertitel / Romaji..."
              style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={sep} />

          {/* RATING */}
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Bewertung</div>
          <div style={{ padding: "4px 0 4px" }}>
            <StarRating value={item.score || 0} onChange={v => upd("score", v)} />
          </div>

          <div style={sep} />

          {/* STATUS */}
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {statuses.map(s => <button key={s} onClick={() => upd("status", s)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 16, border: `1px solid ${item.status === s ? SC[s] : "#ffffff12"}`, background: item.status === s ? SC[s] + "22" : "transparent", color: item.status === s ? SC[s] : "#444" }}>{s}</button>)}
          </div>

          <div style={sep} />

          {/* PROGRESS */}
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, fontWeight: 700 }}>Fortschritt</div>
          {isAnime ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Episoden</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" value={item.watched||0} onChange={e => upd("watched", Math.max(0, +e.target.value))} style={numStyle} />
                  <span style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>/</span>
                  <input type="number" value={item.eps||0} onChange={e => upd("eps", Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
                  <span style={{ fontSize: 8, color: "#444" }}>Gesehen</span>
                  <span style={{ fontSize: 8, color: "#444" }}>Gesamt</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Kapitel</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" value={item.read||0} onChange={e => upd("read", Math.max(0, +e.target.value))} style={numStyle} />
                  <span style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>/</span>
                  <input type="number" value={item.chapters||0} onChange={e => upd("chapters", Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
                  <span style={{ fontSize: 8, color: "#444" }}>Gelesen</span>
                  <span style={{ fontSize: 8, color: "#444" }}>Gesamt</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Bände</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" value={item.readVols||0} onChange={e => upd("readVols", Math.max(0, +e.target.value))} style={numStyle} />
                  <span style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>/</span>
                  <input type="number" value={item.volumes||0} onChange={e => upd("volumes", Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
                  <span style={{ fontSize: 8, color: "#444" }}>Gelesen</span>
                  <span style={{ fontSize: 8, color: "#444" }}>Gesamt</span>
                </div>
              </div>
            </div>
          )}

          <div style={sep} />

          {/* INFO */}
          {(item.mal_score || (isAnime ? item.studios : item.authors)?.length || item.duration || item.rating) && (
            <>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#ffffff06", borderRadius: 10, overflow: "hidden", marginBottom: 4 }}>
                {[["MAL Score", item.mal_score ? `${item.mal_score}` : null],[isAnime ? "Studio" : "Autor", isAnime ? (item.studios||[]).join(", ") : (item.authors||[]).join(", ")],[isAnime ? "Dauer" : "Demografie", isAnime ? item.duration : (item.demographics||[]).join(", ")],
                  ["Rating", item.rating]
                ].filter(([,v]) => v && v.length > 0).map(([k, v]) => (
                  <div key={k} style={{ padding: "8px 10px", background: theme.bgCard }}>
                    <div style={{ fontSize: 8, color: "#444", textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={sep} />
            </>
          )}

          {/* NOTIZEN & LINK */}
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Notizen & Watch-URL</div>
          <textarea value={item.notes || ""} onChange={e => upd("notes", e.target.value)} rows={2} placeholder="Notizen..."
            style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, padding: "8px 10px", color: "#bbb", fontSize: 12, fontFamily: "inherit", resize: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <input value={item.watch_url || ""} onChange={e => upd("watch_url", e.target.value)} placeholder={isAnime ? "https://crunchyroll.com/..." : "https://mangadex.org/..."}
            style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, color: "#888", fontSize: 11, padding: "7px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />

          <div style={sep} />

          {/* VERWANDTE WERKE */}
          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent={acc} />

          {/* DELETE */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #ffffff08", display: "flex", justifyContent: "center" }}>
            <button onClick={() => { if (window.confirm(`"${item.title}" wirklich löschen?`)) { onDelete(item.id); onClose(); } }}
              style={{ padding: "8px 24px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 20, border: "1px solid #E74C3C44", background: "#E74C3C11", color: "#E74C3C" }}>
              Eintrag löschen
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── AddModal ─────────────────────────────────────────────────────────────────
function AddModal({ type, onClose, onAdd, allAnime, allManga }) {
  const theme = useTheme();
  const isAnime = type === "anime";
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const[fetchError, setFetchError] = useState("");
  const [fetched, setFetched] = useState(false);
  const[title, setTitle] = useState("");
  const [status, setStatus] = useState("Geplant");
  const [format, setFormat] = useState("TV");
  const [mtype, setMtype] = useState("Manga");
  const [eps, setEps] = useState(0);
  const[watched, setWatched] = useState(0);
  const [chapters, setChapters] = useState(0);
  const [volumes, setVolumes] = useState(0);
  const [read, setRead] = useState(0);
  const [score, setScore] = useState(0);
  const[malImage, setMalImage] = useState("");
  const [relatedWorks, setRelatedWorks] = useState([]);

  const [malId, setMalId] = useState(null);
  const [malMeta, setMalMeta] = useState({});

  const handleUrlFetch = async () => {
    const parsed = parseMalUrl(url.trim());
    if (!parsed) { setFetchError("Kein gültiger MyAnimeList-Link erkannt"); return; }
    if (parsed.kind !== type) {
      setFetchError(`Das ist ein ${parsed.kind === "anime" ? "Anime" : "Manga"}-Link, du bist im ${isAnime ? "Anime" : "Manga"}-Tab`);
      return;
    }
    setFetching(true); setFetchError("");
    try {
      const data = await fetchMalData(parsed.kind, parsed.id);
      setTitle(data.title_english || data.title || "");
      setMalImage(data.images?.jpg?.image_url || "");
      setMalId(data.mal_id || parseInt(parsed.id) || null);
      if (isAnime) { setFormat(MAL_FORMAT_MAP[data.type] || "TV"); setEps(data.episodes || 0); }
      else { setMtype(MAL_FORMAT_MAP[data.type] || "Manga"); setChapters(data.chapters || 0); setVolumes(data.volumes || 0); }
      setRelatedWorks(parseRelatedFromMAL(data));
      // Store extra metadata
      const meta = {
        image_url: data.images?.jpg?.image_url || "",
        genres: (data.genres ||[]).map(g => g.name),
        mal_score: data.score || null,
        rating: data.rating || null,
      };
      if (isAnime) {
        meta.studios = (data.studios ||[]).map(s => s.name);
        meta.season = data.season ? data.season.charAt(0).toUpperCase() + data.season.slice(1) : null;
        meta.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null);
        meta.source = data.source || null;
        meta.duration = data.duration || null;
      } else {
        meta.authors = (data.authors ||[]).map(a => a.name);
        meta.demographics = (data.demographics ||[]).map(d => d.name);
      }
      setMalMeta(meta);
      setFetched(true);
    } catch { setFetchError("Fehler beim Laden – bitte nochmal versuchen"); }
    finally { setFetching(false); }
  };

  const matchedRelated = relatedWorks.filter(r => {
    const pool = r.kind === "anime" ? allAnime : allManga;
    return pool.some(e => 
      (e.mal_id && e.mal_id === r.id) || 
      e.title.toLowerCase() === r.title.toLowerCase()
    );
  });

  const submit = () => {
    if (!title.trim()) return;
    const base = { id: Date.now() * 1000 + Math.floor(Math.random() * 1000), title: title.trim(), status, score, notes: "", related: matchedRelated,
      ...(malId ? { mal_id: malId } : {}), ...malMeta };
    if (isAnime) onAdd({ ...base, format, eps, watched });
    else onAdd({ ...base, type: mtype, chapters, volumes, read, readVols: 0 });
    onClose();
  };

  const acc = isAnime ? theme.accentAnime : theme.accentManga;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000,
      display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", background: "#0d1525", borderRadius: "20px 20px 0 0",
        padding: "20px 18px 32px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: acc }}>
            {isAnime ? "Anime hinzufügen" : "Manga hinzufügen"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ marginBottom: 16, padding: "12px 14px", background: "#0a1020", borderRadius: 12, border: "1px solid #ffffff0a" }}>
          <div style={{ fontSize: 11, color: "#F5A623", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>
            MyAnimeList-Link importieren
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={url}
              onChange={e => { setUrl(e.target.value); setFetchError(""); setFetched(false); }}
              onKeyDown={e => e.key === "Enter" && handleUrlFetch()}
              placeholder="https://myanimelist.net/anime/..."
              style={{ flex: 1, padding: "9px 11px", background: "#ffffff08",
                border: `1px solid ${fetchError ? "#E74C3C" : fetched ? "#2ECC71" : "#ffffff10"}`,
                borderRadius: 8, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", minWidth: 0 }} />
            <button onClick={handleUrlFetch} disabled={!url.trim() || fetching}
              style={{ padding: "9px 14px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
                fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, cursor: url.trim() && !fetching ? "pointer" : "not-allowed",
                background: fetching ? "#333" : "#F5A62333", color: fetching ? "#555" : "#F5A623" }}>
              {fetching ? "..." : "Laden"}
            </button>
          </div>
          {fetchError && <div style={{ fontSize: 11, color: "#E74C3C", marginTop: 6 }}>{fetchError}</div>}
          {fetched && !fetchError && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                {malImage && <img src={malImage} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
                <div style={{ fontSize: 12, color: "#2ECC71", fontWeight: 700 }}>✓ Daten geladen</div>
              </div>
              {matchedRelated.length > 0 && (
                <div style={{ fontSize: 11, color: "#2ECC71" }}>
                  {matchedRelated.length} Verknüpfung{matchedRelated.length > 1 ? "en" : ""} in deinem Tracker gefunden
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Titel *</div>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder={isAnime ? "Anime-Titel..." : "Manga-Titel..."}
            style={{ width: "100%", padding: "11px 13px", background: "#ffffff0d", border: "1px solid #ffffff15",
              borderRadius: 10, color: "#e8e8e8", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(isAnime ? STATUS_A : STATUS_M).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: "6px 13px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer",
                borderRadius: 20, border: `1px solid ${status === s ? (SC[s] || "#888") : "#ffffff15"}`,
                background: status === s ? (SC[s] || "#888") + "22" : "transparent",
                color: status === s ? (SC[s] || "#888") : "#666",
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
            {isAnime ? "Format" : "Typ"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(isAnime ? FORMATS : TYPES).map(f => (
              <button key={f} onClick={() => isAnime ? setFormat(f) : setMtype(f)} style={{
                padding: "6px 13px", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderRadius: 20, border: `1px solid ${(isAnime ? format : mtype) === f ? acc : "#ffffff15"}`,
                background: (isAnime ? format : mtype) === f ? acc + "22" : "transparent",
                color: (isAnime ? format : mtype) === f ? acc : "#666",
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ffffff0a" }}>
          <div style={{ display: "flex", gap: 8, padding: 12, borderBottom: "1px solid #ffffff0a" }}>
            {isAnime ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#888", width: 80 }}>Episoden:</span>
                <input type="number" value={watched} onChange={e => setWatched(Math.max(0, +e.target.value))} style={numStyle} />
                <span style={{ fontSize: 14, color: "#444" }}>/</span>
                <input type="number" value={eps} onChange={e => setEps(Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#888", width: 80 }}>Kapitel:</span>
                  <input type="number" value={read} onChange={e => setRead(Math.max(0, +e.target.value))} style={numStyle} />
                  <span style={{ fontSize: 14, color: "#444" }}>/</span>
                  <input type="number" value={chapters} onChange={e => setChapters(Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#888", width: 80 }}>Bände:</span>
                  <input type="number" value={readVols} onChange={e => setRead(Math.max(0, +e.target.value))} style={numStyle} />
                  <span style={{ fontSize: 14, color: "#444" }}>/</span>
                  <input type="number" value={volumes} onChange={e => setVolumes(Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", background: "#ffffff08", borderRadius: 10, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: ".06em" }}>Bewertung</span>
            <StarRating value={score} onChange={setScore} />
          </div>
        </div>

        <button onClick={submit} disabled={!title.trim()} style={{
          width: "100%", padding: "15px", marginTop: 18, border: "none", borderRadius: 12,
          cursor: title.trim() ? "pointer" : "not-allowed", fontFamily: "inherit",
          background: title.trim() ? `linear-gradient(135deg,${acc},${acc}cc)` : "#333",
          color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: ".04em",
        }}>Hinzufügen</button>
      </div>
    </div>
  );
}

// ─── SheetJS / Excel Export ───────────────────────────────────────────────────
function useSheetJS() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    s.onload = () => setReady(true);
    s.onerror = () => console.warn("SheetJS konnte nicht geladen werden");
    document.head.appendChild(s);
  },[]);
  return ready;
}

function exportToExcel(anime, manga) {
  const XLSX = window.XLSX;
  if (!XLSX) return;
  const animeRows = anime.map(a => ({
    "ID": a.id, "Titel": a.title, "Untertitel": a.subtitle || "",
    "Format": a.format || "", "Status": a.status || "",
    "Gesehen": a.watched || 0, "Episoden": a.eps || 0,
    "Fortschritt %": a.eps ? Math.round(((a.watched || 0) / a.eps) * 100) : 0,
    "Bewertung": a.score || 0, "MAL Score": a.mal_score || "",
    "Genres": Array.isArray(a.genres) ? a.genres.join(", ") : "",
    "Source": a.source || "", "Studio": Array.isArray(a.studios) ? a.studios.join(", ") : "",
    "Season": a.season && a.year ? `${a.season} ${a.year}` : "",
    "Link": a.watch_url || "", "Notizen": a.notes || "",
  }));
  const mangaRows = manga.map(m => ({
    "ID": m.id, "Titel": m.title, "Untertitel": m.subtitle || "",
    "Typ": m.type || "Manga", "Status": m.status || "",
    "Kapitel gelesen": m.read || 0, "Kapitel gesamt": m.chapters || 0,
    "Bände gelesen": m.readVols || 0, "Bände gesamt": m.volumes || 0,
    "Fortschritt %": m.chapters ? Math.round(((m.read || 0) / m.chapters) * 100) : 0,
    "Bewertung": m.score || 0, "MAL Score": m.mal_score || "",
    "Genres": Array.isArray(m.genres) ? m.genres.join(", ") : "",
    "Autor": Array.isArray(m.authors) ? m.authors.join(", ") : "",
    "Link": m.watch_url || "", "Notizen": m.notes || "",
  }));
  const statsRows =["Abgeschlossen","Am Schauen","Am Lesen","Geplant","Pausiert","Abgebrochen"].map(s => ({
    "Status": s, "Anime": anime.filter(a => a.status === s).length, "Manga": manga.filter(m => m.status === s).length,
  }));
  statsRows.push({ "Status": "GESAMT", "Anime": anime.length, "Manga": manga.length });
  const wb = XLSX.utils.book_new();
  const wsA = XLSX.utils.json_to_sheet(animeRows);
  const wsM = XLSX.utils.json_to_sheet(mangaRows);
  const wsS = XLSX.utils.json_to_sheet(statsRows);
  wsA["!cols"] =[{wch:14},{wch:40},{wch:30},{wch:8},{wch:14},{wch:10},{wch:10},{wch:13},{wch:10},{wch:8},{wch:30},{wch:14},{wch:20},{wch:14},{wch:30},{wch:30}];
  wsM["!cols"] =[{wch:14},{wch:40},{wch:30},{wch:10},{wch:14},{wch:14},{wch:14},{wch:13},{wch:13},{wch:13},{wch:10},{wch:8},{wch:30},{wch:20},{wch:30},{wch:30}];
  XLSX.utils.book_append_sheet(wb, wsA, "Anime");
  XLSX.utils.book_append_sheet(wb, wsM, "Manga");
  XLSX.utils.book_append_sheet(wb, wsS, "Statistik");
  XLSX.writeFile(wb, `Matter_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ─── Theme Panel ──────────────────────────────────────────────────────────────
function ThemePanel({ theme, onChange, onClose }) {
  const fields = [
    ["accentAnime",   "Anime Akzent"],["accentManga",   "Manga Akzent"],
    ["accentStats",   "Stats Akzent"],
    ["accentUpdates", "Updates Akzent"],
    ["bgApp",         "Hintergrund App"],
    ["bgCard",        "Hintergrund Karten"],["bgHeader",      "Hintergrund Header"],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d1525", borderRadius: 18,
        padding: 24, width: "90%", maxWidth: 340, border: "1px solid #ffffff15", boxShadow: "0 20px 60px #000a",
        maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#e8e8e8" }}>Farben anpassen</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {fields.map(([key, label]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#aaa" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="color" value={theme[key]}
                onChange={e => onChange({ ...theme, [key]: e.target.value })}
                style={{ width: 38, height: 30, border: "none", borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
              <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{theme[key]}</span>
            </div>
          </div>
        ))}
        <button onClick={() => onChange(DEFAULT_THEME)}
          style={{ width: "100%", marginTop: 8, padding: "8px", border: "1px solid #ffffff15",
            borderRadius: 10, background: "#ffffff08", color: "#888", fontSize: 12,
            cursor: "pointer", fontFamily: "inherit", boxSizing: "border-box" }}>
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}

// ─── Bulk Update + Notifications ─────────────────────────────────────────────
async function searchMalId(kind, title, _retries = 0) {
  await new Promise(r => setTimeout(r, 400));
  const q = encodeURIComponent(title.replace(/[^\w\s]/g, " ").trim());
  const res = await fetch(`https://api.jikan.moe/v4/${kind}?q=${q}&limit=5`);
  if (!res.ok) {
    if (res.status === 429 && _retries < 3) { await new Promise(r => setTimeout(r, 2000)); return searchMalId(kind, title, _retries + 1); }
    throw new Error(`${res.status}`);
  }
  const results = (await res.json()).data ||[];
  if (results.length === 0) return null;
  const lower = title.toLowerCase().trim();
  // Only accept exact title matches to prevent mixing up entries
  const exact = results.find(r =>
    (r.title || "").toLowerCase() === lower ||
    (r.title_english || "").toLowerCase() === lower ||
    (r.title_japanese || "").toLowerCase() === lower ||
    (r.titles ||[]).some(t => (t.title || "").toLowerCase() === lower)
  );
  return exact || null;
}

async function fetchRelatedFull(kind, malId, _retries = 0) {
  await new Promise(r => setTimeout(r, 400));
  const res = await fetch(`https://api.jikan.moe/v4/${kind}/${malId}/full`);
  if (!res.ok) {
    if (res.status === 429 && _retries < 3) { await new Promise(r => setTimeout(r, 2000)); return fetchRelatedFull(kind, malId, _retries + 1); }
    throw new Error(`${res.status}`);
  }
  return (await res.json()).data;
}

function NotificationsView({ anime, manga, onUpdateAnime, onUpdateManga }) {
  const theme = useTheme();
  const [bulkState, setBulkState] = useState("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const abortRef = useRef(false);

  const notifications = useMemo(() => {
    const items =[];
    const check = (entry, kind) => {
      for (const r of (entry.related ||[])) {
        if (!["Sequel","Prequel","Adaption","Side Story","Spin-off"].includes(r.relType)) continue;
        items.push({ sourceTitle: entry.title, sourceKind: kind, relTitle: r.title,
          relKind: r.kind, relType: r.relType });
      }
    };
    anime.forEach(a => check(a, "anime"));
    manga.forEach(m => check(m, "manga"));
    // Deduplicate by relTitle+relType
    const seen = new Set();
    return items.filter(n => {
      const key = `${n.relTitle}::${n.relType}::${n.relKind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [anime, manga]);

  const resetAllRelated = () => {
    if (!window.confirm("Alle verwandten Werke zurücksetzen? Dieser Vorgang löscht alle Related-Verknüpfungen und gespeicherte MAL-IDs.")) return;
    anime.forEach(a => {
      const cleaned = { ...a, related:[] };
      delete cleaned.mal_id;
      onUpdateAnime(cleaned);
    });
    manga.forEach(m => {
      const cleaned = { ...m, related:[] };
      delete cleaned.mal_id;
      onUpdateManga(cleaned);
    });
  };

  const startBulkUpdate = async () => {
    abortRef.current = false;
    const all =[
      ...anime.map(a => ({ ...a, _kind: "anime" })),
      ...manga.map(m => ({ ...m, _kind: "manga" })),
    ];
    setBulkState("running");
    setProgress({ done: 0, total: all.length, current: "" });
    for (let i = 0; i < all.length; i++) {
      if (abortRef.current) { setBulkState("idle"); return; }
      const entry = all[i];
      setProgress({ done: i, total: all.length, current: entry.title });
      try {
        let malId = entry.mal_id;
        // Step 1: If no stored MAL ID, search by title
        if (!malId) {
          const searchResult = await searchMalId(entry._kind, entry.title);
          if (!searchResult) { continue; }
          malId = searchResult.mal_id;
        }
        // Step 2: Fetch full data using the real MAL ID
        const data = await fetchRelatedFull(entry._kind, malId);
        const MAP = {"Sequel":"Sequel","Prequel":"Prequel","Side story":"Side Story","Parent story":"Prequel",
          "Full story":"Sequel","Spin-off":"Spin-off","Alternative setting":"Alternative",
          "Alternative version":"Alternative","Adaptation":"Adaption","Summary":"Summary","Other":"Related","Character":"Related"};
        const related = (data.relations ||[]).flatMap(rel =>
          (rel.entry ||[]).map(e => ({
            id: e.mal_id, title: e.name, kind: e.type === "anime" ? "anime" : "manga",
            relType: MAP[rel.relation] || "Related",
          }))
        );
        // Build metadata from Jikan response
        const meta = {
          image_url: data.images?.jpg?.image_url || "",
          genres: (data.genres ||[]).map(g => g.name),
          mal_score: data.score || null,
          rating: data.rating || null,
        };
        if (entry._kind === "anime") {
          meta.studios = (data.studios ||[]).map(s => s.name);
          meta.season = data.season ? data.season.charAt(0).toUpperCase() + data.season.slice(1) : null;
          meta.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null);
          meta.source = data.source || null;
          meta.duration = data.duration || null;
        } else {
          meta.authors = (data.authors ||[]).map(a => a.name);
          meta.demographics = (data.demographics ||[]).map(d => d.name);
        }
        // Step 3: Store mal_id + metadata + related
        const updated = { ...entry, ...meta, related, mal_id: malId };
        delete updated._kind;
        if (entry._kind === "anime") onUpdateAnime(updated);
        else onUpdateManga(updated);
      } catch {}
    }
    setBulkState("done");
    setProgress(p => ({ ...p, done: all.length, current: "Fertig!" }));
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const typeColor = { Sequel:"#E94560", Prequel:"#3498DB", Adaption:"#F5A623",
    "Side Story":"#2ECC71", "Spin-off":"#9B59B6", Summary:"#888", Alternative:"#888", Related:"#666" };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 20, border: "1px solid #ffffff08" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8", marginBottom: 6 }}>Related Works aktualisieren</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.6 }}>
          Sucht für alle {anime.length + manga.length} Einträge die MAL-ID per Titel und holt die aktuellen Sequel/Prequel-Daten.
          Dauert ca. <span style={{ color: "#F5A623" }}>8–12 Minuten</span> beim ersten Mal (danach schneller, da MAL-IDs gespeichert werden).
        </div>
        {bulkState === "running" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 5 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%", color: "#aaa" }}>{progress.current}</span>
              <span style={{ color: "#F5A623", fontWeight: 700, flexShrink: 0 }}>{progress.done}/{progress.total} ({pct}%)</span>
            </div>
            <div style={{ height: 6, background: "#ffffff10", borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, transition: "width .3s",
                background: `linear-gradient(90deg,${theme.accentAnime},${theme.accentStats})` }} />
            </div>
          </div>
        )}
        {bulkState === "done" && (
          <div style={{ fontSize: 12, color: "#2ECC71", marginBottom: 10 }}>✓ Alle Einträge aktualisiert!</div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {bulkState !== "running" ? (
            <>
            <button onClick={startBulkUpdate} style={{ padding: "8px 18px", border: "none", borderRadius: 20,
              cursor: "pointer", background: `linear-gradient(135deg,${theme.accentAnime},${theme.accentAnime}cc)`,
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
              {bulkState === "done" ? "Erneut aktualisieren" : "Jetzt aktualisieren"}
            </button>
            <button onClick={resetAllRelated} style={{ padding: "8px 18px", border: "1px solid #E74C3C44",
              borderRadius: 20, cursor: "pointer", background: "#E74C3C11",
              color: "#E74C3C", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
              Alle zurücksetzen
            </button>
            </>
          ) : (
            <button onClick={() => { abortRef.current = true; }} style={{ padding: "8px 18px", border: "none",
              borderRadius: 20, cursor: "pointer", background: "#333", color: "#aaa",
              fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Abbrechen</button>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
        {notifications.length} Benachrichtigungen
      </div>
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#444", fontSize: 13 }}>
          Noch keine Daten — starte das Update oben.
        </div>
      ) : notifications.map((n, i) => (
        <div key={i} style={{ background: theme.bgCard, borderRadius: 12, padding: "12px 14px", marginBottom: 8,
          border: "1px solid #ffffff08",
          borderLeft: `3px solid ${typeColor[n.relType] || "#555"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: ".05em",
              background: (typeColor[n.relType] || "#555") + "22", color: typeColor[n.relType] || "#555" }}>
              {n.relType}
            </span>
            <span style={{ fontSize: 10, color: "#444", marginLeft: "auto" }}>{n.relKind === "anime" ? "Anime" : "Manga"}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e8", marginBottom: 2 }}>{n.relTitle}</div>
          <div style={{ fontSize: 11, color: "#555" }}>
            zu: <span style={{ color: "#888" }}>{n.sourceTitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RecommendationsView ─────────────────────────────────────────────────────
function RecommendationsView({ anime, manga }) {
  const theme = useTheme();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const[filterGenre, setFilterGenre] = useState("Alle");
  const [filterKind, setFilterKind] = useState("all"); 
  const abortRef = useRef(false);

  const topRated = useMemo(() =>[
    ...anime.filter(a => a.score >= 9 && a.mal_id).map(a => ({ ...a, _kind: "anime" })),
    ...manga.filter(m => m.score >= 9 && m.mal_id).map(m => ({ ...m, _kind: "manga" })),
  ], [anime, manga]);

  const libraryTitles = useMemo(() => {
    const s = new Set();
    anime.forEach(a => { s.add(a.title.toLowerCase()); if (a.mal_id) s.add(String(a.mal_id)); });
    manga.forEach(m => { s.add(m.title.toLowerCase()); if (m.mal_id) s.add(String(m.mal_id)); });
    return s;
  },[anime, manga]);

  const fetchRecs = async () => {
    abortRef.current = false;
    setLoading(true);
    setProgress({ done: 0, total: topRated.length, current: "" });
    const allRecs =[];
    const seen = new Set();
    let retryBudget = 10;
    for (let i = 0; i < topRated.length; i++) {
      if (abortRef.current) break;
      const entry = topRated[i];
      setProgress({ done: i, total: topRated.length, current: entry.title });
      try {
        await new Promise(r => setTimeout(r, 400));
        const res = await fetch(`https://api.jikan.moe/v4/${entry._kind}/${entry.mal_id}/recommendations`);
        if (res.status === 429 && retryBudget > 0) { retryBudget--; await new Promise(r => setTimeout(r, 2000)); i--; continue; }
        if (!res.ok) continue;
        const data = (await res.json()).data ||[];
        for (const r of data.slice(0, 5)) {
          const e = r.entry;
          const key = `${entry._kind}:${e.mal_id}`;
          if (seen.has(key)) continue;
          if (libraryTitles.has(String(e.mal_id)) || libraryTitles.has((e.title || "").toLowerCase())) continue;
          seen.add(key);
          allRecs.push({
            mal_id: e.mal_id, title: e.title, image: e.images?.jpg?.image_url || "",
            kind: entry._kind, votes: r.votes || 0,
            sourceTitle: entry.title, sourceScore: entry.score,
            url: `https://myanimelist.net/${entry._kind}/${e.mal_id}`,
          });
        }
      } catch {}
    }
    const topN = allRecs.sort((a, b) => b.votes - a.votes).slice(0, 30);
    let genreRetryBudget = 6;
    for (let i = 0; i < topN.length; i++) {
      if (abortRef.current) break;
      try {
        await new Promise(r => setTimeout(r, 350));
        const res = await fetch(`https://api.jikan.moe/v4/${topN[i].kind}/${topN[i].mal_id}`);
        if (res.status === 429 && genreRetryBudget > 0) { genreRetryBudget--; await new Promise(r => setTimeout(r, 2000)); i--; continue; }
        if (!res.ok) continue;
        const d = (await res.json()).data;
        topN[i].genres = (d.genres || []).map(g => g.name);
        topN[i].score = d.score;
        topN[i].eps = d.episodes || d.chapters || null;
      } catch {}
    }
    setRecs(topN);
    setLoading(false);
    setLoaded(true);
    setProgress(p => ({ ...p, done: topRated.length, current: "Fertig!" }));
  };

  const recGenres = useMemo(() => {
    const s = new Set();
    recs.forEach(r => (r.genres ||[]).forEach(g => s.add(g)));
    return [...s].sort();
