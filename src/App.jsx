import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";

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
  if (!USE_SUPABASE) return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  try {
    const r = await sbFetch("user_prefs?select=value&key=eq.ui_prefs");
    const rows = await r.json();
    return rows?.[0]?.value ? JSON.parse(rows[0].value) : {};
  } catch { return {}; }
}
async function savePrefs(prefs) {
  const str = JSON.stringify(prefs);
  if (!USE_SUPABASE) { localStorage.setItem(PREF_KEY, str); return; }
  try {
    await sbFetch("user_prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ key: "ui_prefs", value: str }),
    });
  } catch {}
}

// ─── LocalStorage ────────────────────────────────────────────────────────────
const STORAGE_KEY_A = "nirusu_anime";
const STORAGE_KEY_M = "nirusu_manga";

const INIT_ANIME = [{"id":1,"title":"I'm Giving Up on Being a Demon Queen","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":0,"notes":""},{"id":2,"title":"2.5 Dimensional Seduction","format":"TV","eps":24,"watched":7,"status":"Abgebrochen","score":6,"notes":""},{"id":3,"title":"Real Girl","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":4,"title":"The Quintessential Quintuplets","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":5,"title":"The Quintessential Quintuplets ∬","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":6,"title":"86","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":7,"title":"91 Days","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":8,"title":"Adachi and Shimamura","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":9,"title":"Aho Girl","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":10,"title":"Ajin: Demi-Human","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":11,"title":"Snow White with the Red Hair","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":12,"title":"Akiba Maid War","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":13,"title":"My Sweet Tyrant","format":"TV","eps":25,"watched":5,"status":"Abgebrochen","score":6,"notes":""},{"id":14,"title":"Akudama Drive","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":15,"title":"I'm the Villainess, So I'm Taming the Final Boss","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":16,"title":"Uncle from Another World","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":0,"notes":""},{"id":17,"title":"Dr. Akutsu's Medical File","format":"TV","eps":12,"watched":0,"status":"Abgebrochen","score":0,"notes":""},{"id":18,"title":"Angel Beats!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":19,"title":"Waiting in the Summer","format":"TV","eps":12,"watched":5,"status":"Pausiert","score":0,"notes":""},{"id":20,"title":"Another","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":21,"title":"Assassination Classroom","format":"TV","eps":22,"watched":22,"status":"Abgeschlossen","score":8,"notes":""},{"id":22,"title":"Assassination Classroom Season 2","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":""},{"id":23,"title":"Blue Spring Ride","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":24,"title":"Blue Exorcist: Kyoto Saga","format":"TV","eps":12,"watched":2,"status":"Geplant","score":0,"notes":""},{"id":25,"title":"Appleseed","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":7,"notes":""},{"id":26,"title":"Arifureta: From Commonplace to World's Strongest","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":27,"title":"Arknights: Prelude to Dawn","format":"TV","eps":8,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":28,"title":"Cat Planet Cuties","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":29,"title":"Aura: Koga Maryuin's Last War","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":30,"title":"Yamada's First Time","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":31,"title":"B: The Beginning","format":"ONA","eps":12,"watched":12,"status":"Abgeschlossen","score":5,"notes":""},{"id":32,"title":"Banana Fish","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":33,"title":"As Miss Beelzebub Likes","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":34,"title":"Black Bullet","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":35,"title":"Black Clover","format":"TV","eps":170,"watched":7,"status":"Abgebrochen","score":0,"notes":""},{"id":36,"title":"Black Lagoon","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":37,"title":"Blade Runner: Black Out 2022","format":"ONA","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":""},{"id":38,"title":"Blend S","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":39,"title":"Blue Period","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":40,"title":"My Hero Academia","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":41,"title":"My Hero Academia Season 2","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":""},{"id":42,"title":"My Hero Academia Season 3","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":8,"notes":""},{"id":43,"title":"My Hero Academia Season 4","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":0,"notes":""},{"id":44,"title":"My Hero Academia Season 5","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":8,"notes":""},{"id":45,"title":"My Hero Academia Season 6","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":0,"notes":""},{"id":46,"title":"My Hero Academia: Two Heroes","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":47,"title":"My Hero Academia: Two Heroes Specials","format":"Special","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":48,"title":"My Hero Academia: World Heroes' Mission","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":49,"title":"My Hero Academia: Training of the Dead","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":50,"title":"The Dangers in My Heart","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":51,"title":"We Never Learn","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":52,"title":"We Never Learn!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":53,"title":"Bouquet for an Ugly Girl","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":54,"title":"Chainsaw Man","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":55,"title":"Charlotte","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":56,"title":"Chi. About Earth's Movement","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":57,"title":"The Wrong Way to Use Healing Magic","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":58,"title":"Chou Kaguya-hime!","format":"ONA","eps":1,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":59,"title":"High School Prodigies Have It Easy Even in Another World!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":60,"title":"Love, Chunibyo & Other Delusions!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":61,"title":"Cinderella Girls Gekijou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":62,"title":"Cinderella Girls Gekijou 2nd Season","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":63,"title":"Citrus","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":""},{"id":64,"title":"Clannad","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":65,"title":"Clannad: After Story","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":66,"title":"Claymore","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":67,"title":"Code Geass: Lelouch of the Rebellion","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":""},{"id":68,"title":"Code Geass: Lelouch of the Rebellion R2","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":69,"title":"Comic Girls","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":70,"title":"Cowboy Bebop","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":71,"title":"Cyberpunk: Edgerunners","format":"ONA","eps":10,"watched":10,"status":"Abgeschlossen","score":0,"notes":""},{"id":72,"title":"Cyberpunk: Edgerunners 2","format":"ONA","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":73,"title":"DAN DA DAN","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":74,"title":"DAN DA DAN Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":75,"title":"I Can't Understand What My Husband Is Saying","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":76,"title":"I Can't Understand What My Husband Is Saying 2nd Thread","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":77,"title":"Darling in the FranXX","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":9,"notes":""},{"id":78,"title":"Darwin's Game","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":79,"title":"Date A Live","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":80,"title":"Date A Live II","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":81,"title":"Date A Live III","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":82,"title":"Date A Live IV","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":83,"title":"Death Note","format":"TV","eps":37,"watched":11,"status":"Abgebrochen","score":0,"notes":""},{"id":84,"title":"Death Parade","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":85,"title":"Interviews with Monster Girls","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":86,"title":"Denki-Gai","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":87,"title":"Devils' Line","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":4,"notes":""},{"id":88,"title":"Devils' Line: Anytime Anywhere","format":"OVA","eps":1,"watched":1,"status":"Abgeschlossen","score":4,"notes":""},{"id":89,"title":"HxEros","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":90,"title":"Dorohedoro","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":91,"title":"Hokkaido Gals Are Super Adorable!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":92,"title":"Dr. Stone: Stone Wars","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":93,"title":"How Heavy Are the Dumbbells You Lift?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":94,"title":"Delicious in Dungeon","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":95,"title":"Is It Wrong to Try to Pick Up Girls in a Dungeon?","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":96,"title":"Is It Wrong to Try to Pick Up Girls in a Dungeon? II","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":97,"title":"Is It Wrong to Try to Pick Up Girls in a Dungeon? III","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":98,"title":"Is It Wrong to Try to Pick Up Girls in a Dungeon? III OVA","format":"OVA","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":99,"title":"Is It Wrong to Try to Pick Up Girls in a Dungeon? IV","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":100,"title":"Durarara!!","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":101,"title":"Edens Zero","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":102,"title":"Edomae Elf","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":103,"title":"Egao no Taenai Shokuba desu.","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":104,"title":"Pompo the Cinéphile","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":105,"title":"Plus-Sized Elf","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":106,"title":"Plus-Sized Elf: Calorie Lovers","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":107,"title":"Elfen Lied","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":108,"title":"Fire Force","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":0,"notes":""},{"id":109,"title":"Fire Force Season 2","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":0,"notes":""},{"id":110,"title":"Fire Force Season 3","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":111,"title":"Fire Force Season 3 Part 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":112,"title":"Ergo Proxy","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":113,"title":"Eromanga Sensei","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":""},{"id":114,"title":"Escha Chron","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":115,"title":"Evangelion Movie 2: Ha","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":116,"title":"Ex-Arm","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":117,"title":"Fairy Tail","format":"TV","eps":175,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":118,"title":"Frame Arms Girl","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":119,"title":"Fruits Basket (2019)","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":120,"title":"Fruits Basket 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":121,"title":"Fruits Basket: The Final","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":122,"title":"The Millionaire Detective Balance: Unlimited","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":123,"title":"Fullmetal Alchemist","format":"TV","eps":51,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":124,"title":"Fullmetal Alchemist: Brotherhood","format":"TV","eps":64,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":125,"title":"To Your Eternity","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":126,"title":"More Than a Married Couple, But Not Lovers","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":127,"title":"Ga-Rei: Zero","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":128,"title":"Gabriel DropOut","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":129,"title":"Gal & Dino","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":130,"title":"Gamers!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":131,"title":"Gangsta.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":132,"title":"GATE","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":133,"title":"GATE Part 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":134,"title":"Getsuyoubi no Tawawa","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":135,"title":"Legend of the Galactic Heroes","format":"OVA","eps":110,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":136,"title":"Legend of the Galactic Heroes: Die Neue These","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":137,"title":"Galaxy Express 999","format":"TV","eps":113,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":138,"title":"Giniro no Kami no Agito","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":139,"title":"Goblin Slayer","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":140,"title":"Goblin Slayer II","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":141,"title":"Goblin Slayer: Goblin's Crown","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":142,"title":"Godzilla Singular Point","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":143,"title":"Golden Kamuy","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":144,"title":"Golden Kamuy 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":145,"title":"Golden Kamuy 3rd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":146,"title":"Golden Kamuy 4th Season","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":147,"title":"Golden Time","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":148,"title":"Golden Time (Movie)","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":149,"title":"Grand Blue Dreaming","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":150,"title":"Grimgar of Fantasy and Ash","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":151,"title":"Haikyuu!!","format":"TV","eps":25,"watched":5,"status":"Abgebrochen","score":0,"notes":""},{"id":152,"title":"Haikyuu!!: Karasuno vs Shiratorizawa","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":153,"title":"Haikyuu!! Riku vs. Kuu","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":154,"title":"Haikyuu!! Second Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":155,"title":"Haikyuu!! To the Top","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":156,"title":"Haikyuu!! To the Top Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":157,"title":"Please Put Them On, Takamine-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":158,"title":"Hakata Tonkotsu Ramens","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":159,"title":"The Devil Is a Part-Timer!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":160,"title":"The Devil Is a Part-Timer!! 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":161,"title":"Cells at Work!","format":"TV","eps":13,"watched":3,"status":"Pausiert","score":0,"notes":""},{"id":162,"title":"Cells at Work! CODE BLACK","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":163,"title":"The Idaten Deities Know Only Peace","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":164,"title":"Hibike! Euphonium Movie 2: Todoketai Melody","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":165,"title":"I Shaved. Then I Brought a High School Girl Home.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":166,"title":"High School DxD","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":167,"title":"Himouto! Umaru-chan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":168,"title":"Himouto! Umaru-chan R","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":169,"title":"Hinamatsuri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":170,"title":"Honobono Log","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":171,"title":"Horimiya","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":172,"title":"Horimiya: Piece","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":173,"title":"Hoshiai no Sora","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":174,"title":"Hunter x Hunter (2011)","format":"TV","eps":148,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":175,"title":"Hyouka","format":"TV","eps":22,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":176,"title":"Don't Toy With Me, Miss Nagatoro","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":177,"title":"Ikebukuro West Gate Park","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":178,"title":"Ikoku Nikki","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":179,"title":"Imouto sae Ireba Ii.","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":180,"title":"Inuyashiki Last Hero","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":7,"notes":""},{"id":181,"title":"Isekai Harem Monogatari","format":"OVA","eps":4,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":182,"title":"How Not to Summon a Demon Lord","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":183,"title":"How Not to Summon a Demon Lord Ω","format":"TV","eps":10,"watched":3,"status":"Abgebrochen","score":0,"notes":""},{"id":184,"title":"Isekai Nonbiri Nouka","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":185,"title":"Interspecies Reviewers","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":186,"title":"BOFURI: I Don't Want to Get Hurt, so I'll Max Out My Defense.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":187,"title":"Iya na Kao sare nagara Opantsu Misete Moraitai","format":"ONA","eps":6,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":188,"title":"Bottom-Tier Character Tomozaki","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":189,"title":"Toilet-Bound Hanako-kun","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":190,"title":"Hell's Paradise","format":"TV","eps":13,"watched":7,"status":"Abgebrochen","score":0,"notes":""},{"id":191,"title":"JoJo's Bizarre Adventure","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":192,"title":"JoJo's Bizarre Adventure: Stardust Crusaders","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":193,"title":"JoJo's Bizarre Adventure: Stardust Crusaders Egypt Arc","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":194,"title":"JoJo's Bizarre Adventure: Diamond is Unbreakable","format":"TV","eps":39,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":195,"title":"JoJo's Bizarre Adventure: Golden Wind","format":"TV","eps":39,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":196,"title":"Jormungand","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":197,"title":"Jormungand: Perfect Order","format":"TV","eps":12,"watched":4,"status":"Pausiert","score":0,"notes":""},{"id":198,"title":"Josee, the Tiger and the Fish","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":199,"title":"Joshiochi! 2-kai kara Onnanoko ga... Futtekita!?","format":"ONA","eps":9,"watched":1,"status":"Abgebrochen","score":0,"notes":""},{"id":200,"title":"Joshiraku","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":201,"title":"Jouran: The Princess of Snow and Blood","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":202,"title":"Jujutsu Kaisen","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":""},{"id":203,"title":"Jujutsu Kaisen Season 2","format":"TV","eps":23,"watched":23,"status":"Abgeschlossen","score":9,"notes":""},{"id":204,"title":"Just Because!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":205,"title":"Juuni Taisen","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":""},{"id":206,"title":"The Eminence in Shadow","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":207,"title":"Kaguya-sama: Love Is War","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":208,"title":"Kaguya-sama: Love Is War?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":209,"title":"Maid Sama!","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":210,"title":"Redo of Healer","format":"TV","eps":12,"watched":6,"status":"Abgebrochen","score":0,"notes":""},{"id":211,"title":"The Day I Became a God","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":212,"title":"Rent-a-Girlfriend","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":213,"title":"A Couple of Cuckoos","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":214,"title":"Teasing Master Takagi-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":215,"title":"Teasing Master Takagi-san 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":216,"title":"Karasu wa Aruji wo Erabanai","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":217,"title":"Hensuki: Are You Willing to Fall in Love with a Pervert?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":218,"title":"A Couple Who Has Dated and a Couple Who Has Never Dated","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":219,"title":"Kekkon Yubiwa Monogatari","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":220,"title":"Wise Man's Grandchild","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":221,"title":"Keppeki Danshi! Aoyama-kun","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":4,"notes":""},{"id":222,"title":"Mobile Suit Gundam","format":"TV","eps":43,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":223,"title":"Mobile Suit Gundam Thunderbolt","format":"ONA","eps":4,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":224,"title":"Mobile Suit Gundam: The Witch from Mercury","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":225,"title":"Kill la Kill","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":226,"title":"Demon Slayer: Mugen Train","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":227,"title":"Kimi ni Todoke: From Me to You","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":228,"title":"Kimi ni Todoke: From Me to You Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":229,"title":"The 100 Girlfriends Who Really, Really, Really, Really, Really Love You","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":230,"title":"The 100 Girlfriends Season 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":231,"title":"The 100 Girlfriends Season 3","format":"TV","eps":0,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":232,"title":"Your Name.","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":233,"title":"I Want to Eat Your Pancreas","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":234,"title":"Kimi to, Nami ni Noretara","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":235,"title":"Kin no Kuni Mizu no Kuni","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":236,"title":"Kingdom 3rd Season","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":237,"title":"Kino no Tabi: The Beautiful World","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":238,"title":"Parasyte: The Maxim","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":239,"title":"Kishuku Gakkou no Juliet","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":240,"title":"Miss Kobayashi's Dragon Maid","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":241,"title":"Miss Kobayashi's Dragon Maid S","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":242,"title":"Miss Kobayashi's Dragon Maid: Valentine, Hot Springs, and Outdoor Activities!","format":"Special","eps":1,"watched":1,"status":"Abgeschlossen","score":8,"notes":""},{"id":243,"title":"Miss Kobayashi's Dragon Maid: OO","format":"Special","eps":7,"watched":7,"status":"Abgeschlossen","score":6,"notes":""},{"id":244,"title":"A Silent Voice","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":245,"title":"Koi to Uso","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":246,"title":"Koikimo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":247,"title":"Love After World Domination","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":248,"title":"This Art Club Has a Problem!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":249,"title":"There's Someone I Love at This Company","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":250,"title":"KonoSuba: God's Blessing on This Wonderful World!","format":"TV","eps":10,"watched":1,"status":"Pausiert","score":0,"notes":""},{"id":251,"title":"KonoSuba Season 2","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":252,"title":"Konohana Kitan","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":253,"title":"The Garden of Words","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":254,"title":"Ghost in the Shell","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":255,"title":"Ghost in the Shell: Stand Alone Complex - Solid State Society 3D","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":256,"title":"Ghost in the Shell: Stand Alone Complex 2nd GIG","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":257,"title":"Kabaneri of the Iron Fortress","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":258,"title":"Children of the Whales","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":259,"title":"Kuroko's Basketball","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":6,"notes":""},{"id":260,"title":"Kuroko's Basketball 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":261,"title":"Kuroko's Basketball 3rd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":262,"title":"Kuroko's Basketball: Last Game","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":263,"title":"The Apothecary Diaries Season 2","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":264,"title":"Scum's Wish","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":265,"title":"In/Spectre","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":266,"title":"Beyond the Boundary","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":267,"title":"Beyond the Boundary: I'll Be Here – Past","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":268,"title":"Beyond the Boundary: I'll Be Here – Future","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":269,"title":"Kyoukai no Kanata: Shinonome","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":270,"title":"In the Land of Leadale","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":271,"title":"Little Busters!","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":272,"title":"Little Witch Academia","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":273,"title":"Log Horizon","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":274,"title":"Log Horizon 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":275,"title":"Log Horizon: Entaku Houkai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":276,"title":"Lupin the IIIrd: Chikemuri no Ishikawa Goemon","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":277,"title":"Lupin the IIIrd: Jigen Daisuke no Bohyou","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":278,"title":"Lycoris Recoil: Ordinary Days","format":"ONA","eps":6,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":279,"title":"Macross","format":"TV","eps":36,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":280,"title":"Macross F","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":281,"title":"Made in Abyss","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":282,"title":"Made in Abyss Movie 1: Tabidachi no Yoake","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":283,"title":"Made in Abyss Movie 2: Hourou Suru Tasogare","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":284,"title":"Made in Abyss Movie 3: Fukaki Tamashii no Reimei","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":285,"title":"Made in Abyss: The Golden City of the Scorching Sun","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":286,"title":"Magia Record: Puella Magi Madoka Magica Side Story","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":287,"title":"Puella Magi Madoka Magica","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":288,"title":"Gushing Over Magical Girls","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":289,"title":"Magical Girl Site","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":290,"title":"The Irregular at Magic High School","format":"TV","eps":26,"watched":26,"status":"Abgeschlossen","score":4,"notes":""},{"id":291,"title":"The Ancient Magus' Bride","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":292,"title":"The Ancient Magus' Bride Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":293,"title":"Welcome to Demon School! Iruma-kun","format":"TV","eps":23,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":294,"title":"The Journey of Elaina","format":"TV","eps":12,"watched":2,"status":"Pausiert","score":0,"notes":""},{"id":295,"title":"Manaria Friends","format":"TV","eps":10,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":296,"title":"The Misfit of Demon King Academy","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":297,"title":"If the Demon Lord Has a Slave Elf Wife, How Do I Care for Her?","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":298,"title":"Sleepy Princess in the Demon Castle","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":299,"title":"Mars Red","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":300,"title":"Marulk-chan no Nichijou","format":"Movie","eps":4,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":301,"title":"Masou Gakuen HxH","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":302,"title":"Chained Soldier","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":303,"title":"Chained Soldier 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":304,"title":"MEGALOBOX","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":305,"title":"Metropolis","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":306,"title":"Future Diary","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":307,"title":"Mo Dao Zu Shi","format":"ONA","eps":15,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":308,"title":"Mob Psycho 100","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":309,"title":"Mob Psycho 100 II","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":10,"notes":""},{"id":310,"title":"Mob Psycho 100 III","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":""},{"id":311,"title":"Momokuri","format":"ONA","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":312,"title":"Princess Mononoke","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":313,"title":"Talentless Nana","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":314,"title":"Musekinin Kanchou Tylor","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":315,"title":"Mushoku Tensei: Jobless Reincarnation Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":316,"title":"Mushoku Tensei: Jobless Reincarnation","format":"TV","eps":11,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":317,"title":"A Lull in the Sea","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":318,"title":"Nana","format":"TV","eps":47,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":319,"title":"The Seven Deadly Sins","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":""},{"id":320,"title":"The Seven Deadly Sins: Revival of the Commandments","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":7,"notes":""},{"id":321,"title":"The Seven Deadly Sins: Wrath of the Gods","format":"TV","eps":24,"watched":6,"status":"Abgebrochen","score":4,"notes":""},{"id":322,"title":"NEET Kunoichi to Nazeka Dousei Hajimemashita","format":"TV","eps":24,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":323,"title":"NEKOPARA","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":324,"title":"Recovery of an MMO Junkie","format":"TV","eps":10,"watched":10,"status":"Abgeschlossen","score":8,"notes":""},{"id":325,"title":"Recovery of an MMO Junkie Special","format":"Special","eps":1,"watched":1,"status":"Abgeschlossen","score":7,"notes":""},{"id":326,"title":"And You Thought There Is Never a Girl Online?","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":327,"title":"New Game!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":328,"title":"New Game!!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":329,"title":"Welcome to the N.H.K.","format":"TV","eps":24,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":330,"title":"Nichijou – My Ordinary Life","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":331,"title":"Japan Sinks: 2020","format":"ONA","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":332,"title":"Welcome to Japan, Ms. Elf!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":333,"title":"Ninja to Koroshiya no Futarigurashi","format":"TV","eps":12,"watched":5,"status":"Am Schauen","score":0,"notes":""},{"id":334,"title":"No Game No Life","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":335,"title":"No Game No Life: Zero","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":336,"title":"No Guns Life","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":337,"title":"No Guns Life 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":338,"title":"NOMAD: MEGALOBOX 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":339,"title":"Noragami","format":"TV","eps":12,"watched":4,"status":"Abgebrochen","score":0,"notes":""},{"id":340,"title":"Ochikobore Fruit Tart","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":341,"title":"Odd Taxi","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":342,"title":"Okinawa de Suki ni Natta Ko ga Hougen Sugite Tsurasugiru","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":343,"title":"Omiai Aite wa Oshiego, Tsuyoki na, Mondaiji.","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":344,"title":"One-Punch Man","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":345,"title":"One-Punch Man 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":346,"title":"One-Punch Man Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":347,"title":"Orange","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":348,"title":"Orange: Mirai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":349,"title":"Solo Leveling","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":350,"title":"Solo Leveling Season 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":351,"title":"My Love Story!!","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":""},{"id":352,"title":"Ore wo Suki nano wa Omae dake ka yo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":353,"title":"Osake wa Fuufu ni Natte kara","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":5,"notes":""},{"id":354,"title":"Oshiete! Galko-chan","format":"TV","eps":12,"watched":1,"status":"Pausiert","score":0,"notes":""},{"id":355,"title":"Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":356,"title":"Ranking of Kings","format":"TV","eps":23,"watched":11,"status":"Abgebrochen","score":0,"notes":""},{"id":357,"title":"Overlord","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":358,"title":"Overlord II","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":359,"title":"Overlord III","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":360,"title":"Overlord IV","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":361,"title":"Ping Pong the Animation","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":362,"title":"Planetes","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":363,"title":"Plastic Memories","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":364,"title":"Plunderer","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":365,"title":"Pluto","format":"ONA","eps":8,"watched":3,"status":"Am Schauen","score":0,"notes":""},{"id":366,"title":"Poputepipikku","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":367,"title":"Princess Connect! Re:Dive","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":368,"title":"Princess Principal","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":369,"title":"Psycho-Pass","format":"TV","eps":22,"watched":1,"status":"Geplant","score":0,"notes":""},{"id":370,"title":"Psycho-Pass 3","format":"TV","eps":8,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":371,"title":"Psycho-Pass 3: First Inspector","format":"ONA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":372,"title":"Yakuza Fiancé: Raise wa Tanin ga Ii","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":373,"title":"Chivalry of a Failed Knight","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":374,"title":"Re:ZERO -Starting Life in Another World-","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":375,"title":"Re:ZERO Season 2 Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":376,"title":"ReLIFE","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":377,"title":"Science Fell in Love, So I Tried to Prove It","format":"TV","eps":12,"watched":3,"status":"Pausiert","score":0,"notes":""},{"id":378,"title":"Rock wa Lady no Tashinami deshite","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":379,"title":"S-Rank Monster no \"Behemoth\" dakedo, Neko to Machigawarete Elf Musume no Pet toshite Kurashitemasu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":380,"title":"Saekano: How to Raise a Boring Girlfriend","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":381,"title":"Saekano: How to Raise a Boring Girlfriend ♭","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":382,"title":"Saenai Heroine no Sodatekata ♭: Koi to Junjou no Service-kai","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":383,"title":"Saenai Heroine no Sodatekata: Ai to Seishun no Service-kai","format":"TV Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":384,"title":"Undefeated Bahamut Chronicle","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":385,"title":"Sakamoto Days","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":386,"title":"Haven't You Heard? I'm Sakamoto","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":387,"title":"Sakura Trick","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":388,"title":"The Pet Girl of Sakurasou","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":389,"title":"Salary Man Goes to Another World","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":390,"title":"Sayonara no Asa ni Yakusoku no Hana wo Kazarou","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":391,"title":"Seihantai na Kimi to Boku","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":9,"notes":""},{"id":392,"title":"Seirei no Moribito","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":393,"title":"Rascal Does Not Dream of Bunny Girl Senpai","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":394,"title":"Rascal Does Not Dream of a Dreaming Girl","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":395,"title":"Spirited Away","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":396,"title":"My Senpai Is Annoying","format":"TV","eps":12,"watched":3,"status":"Abgebrochen","score":0,"notes":""},{"id":397,"title":"Senryuu Shoujo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":398,"title":"Combatants Will Be Dispatched!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":399,"title":"Seraphim Call","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":400,"title":"The Helpful Fox Senko-san","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":6,"notes":""},{"id":401,"title":"Shaman King (2021)","format":"TV","eps":52,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":402,"title":"Shelter (Music)","format":"Music","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":""},{"id":403,"title":"Your Lie in April","format":"TV","eps":22,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":404,"title":"SHIMONETA: A Boring World Where the Concept of Dirty Jokes Doesn't Exist","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":405,"title":"Evangelion: 3.0+1.0 Thrice Upon a Time","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":406,"title":"Shin Kidou Senki Gundam Wing: Endless Waltz","format":"OVA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":407,"title":"Rage of Bahamut: Genesis","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":408,"title":"Rage of Bahamut: Virgin Soul","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":409,"title":"Attack on Titan","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":410,"title":"Attack on Titan Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":411,"title":"Attack on Titan Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":412,"title":"Attack on Titan: No Regrets","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":413,"title":"Attack on Titan: The Final Season","format":"TV","eps":16,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":414,"title":"The Duke of Death and His Maid","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":415,"title":"The Testament of Sister New Devil","format":"TV","eps":12,"watched":4,"status":"Abgebrochen","score":0,"notes":""},{"id":416,"title":"Neon Genesis Evangelion","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":417,"title":"From the New World","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":418,"title":"Girls' Last Tour","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":""},{"id":419,"title":"Altair: A Record of Battles","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":420,"title":"SK∞","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":421,"title":"I've Been Killing Slimes for 300 Years and Maxed Out My Level","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":422,"title":"Slow Start","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":423,"title":"Somali and the Forest Spirit","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":424,"title":"My Dress-Up Darling","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":425,"title":"Sora no Aosa wo Shiru Hito yo","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":426,"title":"Even Though We're Adults","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":427,"title":"Twin Star Exorcists","format":"TV","eps":50,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":428,"title":"Spy Classroom","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":429,"title":"Steins;Gate","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":430,"title":"Steins;Gate Movie: Fuka Ryouiki no Déjà vu","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":431,"title":"Gargantia on the Verdurous Planet","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":432,"title":"Suki tte Ii na yo.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":433,"title":"Suki tte Ii na yo.: Mei and Marshmallow","format":"Special","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":434,"title":"Miss Caretaker of Sunohara-sou","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":435,"title":"Super Cub","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":436,"title":"Sword Art Online","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":4,"notes":""},{"id":437,"title":"Sword Art Online Alternative: Gun Gale Online","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":438,"title":"Sword Art Online II","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":5,"notes":""},{"id":439,"title":"Sword Art Online: Alicization - War of Underworld 2nd Season","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":440,"title":"Sword Art Online: Alicization - War of Underworld Recap","format":"TV Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":441,"title":"Takopii no Genzai","format":"ONA","eps":6,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":442,"title":"Tamako Love Story","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":443,"title":"Tamako Market","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":444,"title":"The Rising of the Shield Hero","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":445,"title":"Heavenly Delusion","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":446,"title":"Castle in the Sky","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":447,"title":"Magical Revolution of the Reincarnated Princess and the Genius Young Lady","format":"TV","eps":12,"watched":11,"status":"Am Schauen","score":7,"notes":""},{"id":448,"title":"Reincarnated as a Sword","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":449,"title":"That Time I Got Reincarnated as a Slime","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":7,"notes":""},{"id":450,"title":"That Time I Got Reincarnated as a Slime Season 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":451,"title":"That Time I Got Reincarnated as a Slime Season 2 Part 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":452,"title":"The Slime Diaries","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":453,"title":"The God of High School","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":454,"title":"Tokyo Ghoul","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":455,"title":"Tokyo Ghoul √A","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":2,"notes":""},{"id":456,"title":"Tokyo Ghoul:re","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":457,"title":"Tokyo Ghoul:re 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":458,"title":"Tokyo Godfathers","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":459,"title":"My Little Monster","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":460,"title":"Tongari Boushi no Atelier","format":"TV","eps":0,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":461,"title":"TONIKAWA: Over the Moon For You","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":462,"title":"TONIKAWA Season 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":463,"title":"Tonikaku Kawaii: Joshikou-hen","format":"ONA","eps":4,"watched":4,"status":"Abgeschlossen","score":0,"notes":""},{"id":464,"title":"Tonikaku Kawaii: Kaisou","format":"TV Special","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":""},{"id":465,"title":"Toradora!","format":"TV","eps":25,"watched":1,"status":"Pausiert","score":0,"notes":""},{"id":466,"title":"Touhai Densetsu Akagi: Yami ni Maiorita Tensai","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":467,"title":"Toumei Otoko to Ningen Onna: Sonouchi Fuufu ni Naru Futari","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":8,"notes":""},{"id":468,"title":"Tsuredure Children","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":469,"title":"Do You Love Your Mom and Her Two-Hit Multi-Target Attacks?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":470,"title":"Tu Bian Yingxiong Leaf","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":471,"title":"UQ Holder! Mahou Sensei Negima! 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":472,"title":"Otherside Picnic","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":473,"title":"Urusei Yatsura (2022) 2nd Season","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":474,"title":"Uzaki-chan Wants to Hang Out!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":475,"title":"Uzaki-chan Wants to Hang Out! Double","format":"TV","eps":13,"watched":3,"status":"Abgebrochen","score":4,"notes":""},{"id":476,"title":"The Case Study of Vanitas","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":477,"title":"Vatican Kiseki Chousakan","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":478,"title":"Vinland Saga","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":10,"notes":""},{"id":479,"title":"Vinland Saga Season 2","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":10,"notes":""},{"id":480,"title":"Violet Evergarden","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":481,"title":"Violet Evergarden: Eternity and the Auto Memory Doll","format":"Movie","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":482,"title":"Violet Evergarden: The Movie","format":"Movie","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":483,"title":"Violet Evergarden: Kitto \"Ai\" wo Shiru Hi ga Kuru no Darou","format":"Special","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":484,"title":"Violet Evergarden: Recollections","format":"Special","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":485,"title":"VTuber Nandaga Haishin Kiri Wasuretara Densetsu ni Natteta","format":"TV","eps":12,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":486,"title":"Watashi ga Koibito ni Nareru Wake Nai jan, Muri Muri! (※Muri ja Nakatta!?)","format":"TV","eps":12,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":487,"title":"WataMote: No Matter How I Look at It, It's You Guys' Fault I'm Not Popular!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":1,"notes":""},{"id":488,"title":"Watashi ga Motete Dousunda","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":489,"title":"Watashi ni Tenshi ga Maiorita! Special","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":490,"title":"I'm in Love with the Villainess","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":491,"title":"Watashi wo Tabetai, Hitodenashi","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":492,"title":"Witch Watch","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":493,"title":"Wonder Egg Priority","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":494,"title":"Working!!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":495,"title":"World Trigger 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":496,"title":"Wotakoi: Love Is Hard for Otaku","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":8,"notes":""},{"id":497,"title":"Wotaku ni Koi wa Muzukashii OVA","format":"OVA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":498,"title":"Xian Wang de Richang Shenghuo","format":"ONA","eps":15,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":499,"title":"Bloom Into You","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":500,"title":"My Youth Romantic Comedy Is Wrong, As I Expected.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":501,"title":"Yaku nara Mug Cup mo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":502,"title":"The Promised Neverland","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":503,"title":"The Promised Neverland 2nd Season","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":504,"title":"Yokohama Kaidashi Kikou: Quiet Country Cafe","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":505,"title":"The Saga of Tanya the Evil","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":506,"title":"A Sign of Affection","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":507,"title":"Yuragi-sou no Yuuna-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":508,"title":"Yuri!!! on Ice","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":509,"title":"Yuru Camp△","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":510,"title":"Yuru Camp△ Season 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":511,"title":"Yuru Camp△ Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":512,"title":"Moriarty the Patriot","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":8,"notes":""},{"id":513,"title":"Moriarty the Patriot Part 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":514,"title":"Terror in Resonance","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":515,"title":"Zenonzard The Animation","format":"ONA","eps":9,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":516,"title":"Zom 100: Bucket List of the Dead","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":""}];
const INIT_MANGA = [{"id":1,"title":"#Gal to Gal no Yuri","type":"Manga","chapters":0,"read":1,"readVols":0,"volumes":0,"status":"Abgeschlossen","score":8,"notes":""},{"id":2,"title":"20th Century Boys","type":"Manga","chapters":249,"read":0,"readVols":0,"volumes":22,"status":"Geplant","score":0,"notes":""},{"id":3,"title":"2DK, G Pen, Morning Star.","type":"Manga","chapters":45,"read":45,"readVols":0,"volumes":8,"status":"Abgeschlossen","score":7,"notes":""},{"id":4,"title":"3-gatsu no Lion","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":5,"title":"A Pervert's Daily Life","type":"Manga","chapters":145,"read":2,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":""},{"id":6,"title":"Accel World/Dural: Magisa Garden","type":"Manga","chapters":62,"read":14,"readVols":0,"volumes":8,"status":"Abgebrochen","score":0,"notes":""},{"id":7,"title":"Yona of the Dawn","type":"Manga","chapters":292,"read":0,"readVols":0,"volumes":48,"status":"Geplant","score":0,"notes":""},{"id":8,"title":"Akira","type":"Manga","chapters":120,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":""},{"id":9,"title":"Evil's Shore","type":"Manga","chapters":37,"read":37,"readVols":0,"volumes":4,"status":"Abgeschlossen","score":7,"notes":""},{"id":10,"title":"Aldnoah.Zero","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":4,"status":"Abgebrochen","score":0,"notes":""},{"id":11,"title":"Aldnoah.Zero 2nd Season","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":5,"status":"Abgebrochen","score":0,"notes":""},{"id":12,"title":"Aldnoah.Zero Gaiden: Twin Gemini","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":4,"status":"Abgebrochen","score":8,"notes":""},{"id":13,"title":"All You Need Is Kill","type":"Manga","chapters":4,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":14,"title":"All You Need Is Kill","type":"Manga","chapters":17,"read":17,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":8,"notes":""},{"id":15,"title":"Amayo no Tsuki","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":16,"title":"Animeta!","type":"Manga","chapters":28,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":17,"title":"Aria","type":"Manga","chapters":67,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":18,"title":"Ase to Sekken","type":"Manga","chapters":104,"read":0,"readVols":0,"volumes":11,"status":"Pausiert","score":0,"notes":""},{"id":19,"title":"Ashita, Kimi ni Aetara","type":"Manga","chapters":10,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":20,"title":"Ashita, Naisho no Kiss Shiyou","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":21,"title":"Musubu-san Works Over There","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":22,"title":"Asumi-chan wa Lesbian Fuuzoku ni Kyoumi ga Arimasu!","type":"Manga","chapters":0,"read":17,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":23,"title":"Bakuman.","type":"Manga","chapters":176,"read":0,"readVols":0,"volumes":20,"status":"Geplant","score":0,"notes":""},{"id":24,"title":"Banana Fish","type":"Manga","chapters":110,"read":0,"readVols":0,"volumes":19,"status":"Geplant","score":0,"notes":""},{"id":25,"title":"As Miss Beelzebub Likes","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":26,"title":"Berserk","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":27,"title":"Bijin Onna Joushi Takizawa-san","type":"Manga","chapters":0,"read":170,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":28,"title":"Black Torch","type":"Manga","chapters":19,"read":19,"readVols":0,"volumes":5,"status":"Abgeschlossen","score":0,"notes":""},{"id":29,"title":"Blame!","type":"Manga","chapters":66,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":30,"title":"Blue Period","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":31,"title":"My Hero Academia","type":"Manga","chapters":432,"read":200,"readVols":0,"volumes":42,"status":"Abgebrochen","score":8,"notes":""},{"id":32,"title":"My Hero Academia: School Briefs","type":"Manga","chapters":41,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":""},{"id":33,"title":"The Dangers in My Heart","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":34,"title":"Bokutachi no Remake","type":"Manga","chapters":35,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":35,"title":"We Never Learn","type":"Manga","chapters":187,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":""},{"id":36,"title":"Candy & Cigarettes","type":"Manga","chapters":54,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":37,"title":"Cat's Eye","type":"Manga","chapters":135,"read":0,"readVols":0,"volumes":18,"status":"Am Lesen","score":0,"notes":""},{"id":38,"title":"Chainsaw Man","type":"Manga","chapters":0,"read":160,"readVols":0,"volumes":0,"status":"Am Lesen","score":10,"notes":""},{"id":39,"title":"Cigarette & Cherry","type":"Manga","chapters":129,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":40,"title":"Damedol to Sekai ni Hitori dake no Fan","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":41,"title":"67% Masculinity","type":"Manga","chapters":99,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":42,"title":"Dead Dead Demon's Dededede Destruction","type":"Manga","chapters":101,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":43,"title":"Death Note","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":44,"title":"Death Note Another Note: Los Angeles BB Renzoku Satsujin Jiken","type":"Manga","chapters":7,"read":7,"readVols":0,"volumes":1,"status":"Abgeschlossen","score":4,"notes":""},{"id":45,"title":"Defense Devil","type":"Manga","chapters":100,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":46,"title":"Dimension W","type":"Manga","chapters":116,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":""},{"id":47,"title":"Dive in the Vampire Bund","type":"Manga","chapters":18,"read":10,"readVols":0,"volumes":2,"status":"Abgebrochen","score":0,"notes":""},{"id":48,"title":"Dorohedoro","type":"Manga","chapters":190,"read":0,"readVols":0,"volumes":23,"status":"Geplant","score":0,"notes":""},{"id":49,"title":"Hokkaido Gals Are Super Adorable!","type":"Manga","chapters":124,"read":36,"readVols":0,"volumes":14,"status":"Am Lesen","score":7,"notes":""},{"id":50,"title":"Dream☆Jumbo☆Girl","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Abgeschlossen","score":6,"notes":""},{"id":51,"title":"Delicious in Dungeon","type":"Manga","chapters":102,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":""},{"id":52,"title":"Eden: It's an Endless World!","type":"Manga","chapters":127,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":53,"title":"Plus-Sized Elf","type":"Manga","chapters":56,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":54,"title":"Fire Force","type":"Manga","chapters":305,"read":34,"readVols":0,"volumes":34,"status":"Abgebrochen","score":0,"notes":""},{"id":55,"title":"Fire Punch","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":56,"title":"Fullmetal Alchemist","type":"Manga","chapters":116,"read":0,"readVols":0,"volumes":27,"status":"Geplant","score":0,"notes":""},{"id":57,"title":"To Your Eternity","type":"Manga","chapters":204,"read":4,"readVols":0,"volumes":25,"status":"Abgebrochen","score":0,"notes":""},{"id":58,"title":"Futari Escape","type":"Manga","chapters":35,"read":8,"readVols":0,"volumes":4,"status":"Am Lesen","score":0,"notes":""},{"id":59,"title":"Futari no Renai Shoka","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":60,"title":"Gangsta.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":61,"title":"Gangsta: Cursed","type":"Manga","chapters":19,"read":0,"readVols":0,"volumes":5,"status":"Abgebrochen","score":0,"notes":""},{"id":62,"title":"Gantz","type":"Manga","chapters":383,"read":0,"readVols":0,"volumes":37,"status":"Geplant","score":0,"notes":""},{"id":63,"title":"Gigant","type":"Manga","chapters":89,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":64,"title":"Gokushufudou","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":65,"title":"Goshujinsama ni wa Suwasemasen!","type":"Manga","chapters":0,"read":6,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":66,"title":"Grand Blue","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":67,"title":"Great Trailers","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":68,"title":"GTO","type":"Manga","chapters":208,"read":0,"readVols":0,"volumes":25,"status":"Geplant","score":0,"notes":""},{"id":69,"title":"Grimgar of Fantasy and Ash","type":"Manga","chapters":16,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":70,"title":"Haikyuu!!","type":"Manga","chapters":407,"read":0,"readVols":0,"volumes":45,"status":"Geplant","score":0,"notes":""},{"id":71,"title":"Hapi Mari: Happy Marriage!?","type":"Manga","chapters":40,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":72,"title":"The Devil Is a Part-Timer!","type":"Manga","chapters":134,"read":0,"readVols":0,"volumes":24,"status":"Geplant","score":0,"notes":""},{"id":73,"title":"Cells at Work!","type":"Manga","chapters":30,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":""},{"id":74,"title":"Cells at Work! CODE BLACK","type":"Manga","chapters":50,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":75,"title":"Hayama-sensei to Terano-sensei wa Tsukiatteiru","type":"Manga","chapters":28,"read":12,"readVols":0,"volumes":4,"status":"Am Lesen","score":0,"notes":""},{"id":76,"title":"Himesama Tanuki no Koizanyou","type":"Manga","chapters":75,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":77,"title":"Hochiya-san wa Amari Aru","type":"Manga","chapters":0,"read":10,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":78,"title":"Horimiya","type":"Manga","chapters":139,"read":139,"readVols":0,"volumes":17,"status":"Abgeschlossen","score":0,"notes":""},{"id":79,"title":"Hoshokukei Heroine ni Ato 1-nen Inai ni Taberaremasu","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":80,"title":"Hotaru no Hikari","type":"Manga","chapters":90,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":81,"title":"Land of the Lustrous","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":""},{"id":82,"title":"Ikemen Girl to Hakoiri Musume","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":0,"notes":""},{"id":83,"title":"Ikigami","type":"Manga","chapters":60,"read":48,"readVols":0,"volumes":10,"status":"Am Lesen","score":9,"notes":""},{"id":84,"title":"Innocence: After the Long Goodbye","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":85,"title":"Inu x Boku SS","type":"Manga","chapters":58,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":86,"title":"Inuyashiki","type":"Manga","chapters":85,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":87,"title":"Jagaaaaaan","type":"Manga","chapters":163,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":""},{"id":88,"title":"Jibaku Shounen Hanako-kun","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":89,"title":"Jimoto ni Kaettekitara Osananajimi ga Kowareteta","type":"Manga","chapters":0,"read":36,"readVols":0,"volumes":1,"status":"Am Lesen","score":0,"notes":""},{"id":90,"title":"Jitsu wa Watashi Sexless de Nayandemashita","type":"Manga","chapters":5,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":91,"title":"JoJo's Bizarre Adventure Part 7: Steel Ball Run","type":"Manga","chapters":96,"read":0,"readVols":0,"volumes":24,"status":"Geplant","score":0,"notes":""},{"id":92,"title":"Jumyou wo Kaitotte Moratta. Ichinen ni Tsuki, Ichimanen de.","type":"Manga","chapters":18,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":93,"title":"Kaette Kudasai! Akutsu-san","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":94,"title":"Kaguya-sama: Love Is War","type":"Manga","chapters":281,"read":0,"readVols":0,"volumes":28,"status":"Geplant","score":0,"notes":""},{"id":95,"title":"Maid Sama!","type":"Manga","chapters":98,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":96,"title":"Maid Sama!: Marriage","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":97,"title":"Kaijin Reijou","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":98,"title":"Kakei no Alice","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":99,"title":"Kakkou no Iinazuke","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":100,"title":"Kakukaku Shikajika","type":"Manga","chapters":34,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":101,"title":"Kami no Shizuku","type":"Manga","chapters":439,"read":0,"readVols":0,"volumes":44,"status":"Geplant","score":0,"notes":""},{"id":102,"title":"Kanojo mo Kanojo","type":"Manga","chapters":144,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":""},{"id":103,"title":"Kanojo ni Naritai Kimi to Boku","type":"Manga","chapters":51,"read":7,"readVols":0,"volumes":4,"status":"Am Lesen","score":0,"notes":""},{"id":104,"title":"Kanojo no Kuchizuke","type":"Manga","chapters":0,"read":1,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":105,"title":"Kanojo, Hitomishirimasu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":106,"title":"Kaoru Hana wa Rin to Saku","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":107,"title":"Teasing Master Takagi-san","type":"Manga","chapters":182,"read":63,"readVols":0,"volumes":20,"status":"Pausiert","score":8,"notes":""},{"id":108,"title":"Kase-san Series","type":"Manga","chapters":25,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":109,"title":"Nausicaä of the Valley of the Wind","type":"Manga","chapters":59,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":110,"title":"Your Name.","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":111,"title":"Your Name. Another Side: Earthbound","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":7,"notes":""},{"id":112,"title":"Kimi no Okaasan wo Boku ni Kudasai!","type":"Manga","chapters":33,"read":0,"readVols":0,"volumes":4,"status":"Abgebrochen","score":0,"notes":""},{"id":113,"title":"I Want to Eat Your Pancreas","type":"Manga","chapters":10,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":114,"title":"Kingdom","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":115,"title":"Miss Kobayashi's Dragon Maid","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":116,"title":"A Silent Voice","type":"Manga","chapters":64,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":117,"title":"Komi Can't Communicate","type":"Manga","chapters":500,"read":47,"readVols":0,"volumes":37,"status":"Pausiert","score":8,"notes":""},{"id":118,"title":"There's Someone I Love at This Company","type":"Manga","chapters":148,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":119,"title":"Kono Oto Tomare!","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":120,"title":"Ghost in the Shell 1.5","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":121,"title":"Ghost in the Shell 2: Man/Machine Interface","type":"Manga","chapters":6,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":122,"title":"Ghost in the Shell: Stand Alone Complex","type":"Manga","chapters":42,"read":42,"readVols":0,"volumes":5,"status":"Abgeschlossen","score":8,"notes":""},{"id":123,"title":"Ghost in the Shell","type":"Manga","chapters":11,"read":11,"readVols":0,"volumes":1,"status":"Abgeschlossen","score":10,"notes":""},{"id":124,"title":"Ghost in the Shell: The Human Algorithm","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":125,"title":"Kowloon Generic Romance","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":126,"title":"Kozure Ookami","type":"Manga","chapters":142,"read":0,"readVols":0,"volumes":28,"status":"Geplant","score":0,"notes":""},{"id":127,"title":"Kuchi ga Saketemo Kimi ni wa","type":"Manga","chapters":3,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":128,"title":"Kurohyou to 16-sai","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":129,"title":"Kuutei Dragons","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":130,"title":"Kuzumi-kun, Kuuki Yometemasu ka?","type":"Manga","chapters":63,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":131,"title":"Kyou no Cerberus","type":"Manga","chapters":58,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":132,"title":"Kyou wa Kanojo ga Inai kara","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":133,"title":"Kyoukai no Kanata","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":134,"title":"Love Comedy Manga ni Haitteshimatta node, Oshi no Make Heroine wo Zenryoku de Shiawase ni Suru","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":135,"title":"MabuSasa","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":136,"title":"Machigatteita no wa Ore Datta n da.","type":"Manga","chapters":1,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":137,"title":"Made in Abyss","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":138,"title":"The Ancient Magus' Bride","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":139,"title":"Maid Skater","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":140,"title":"The Demon Lord's Elf Bride","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":141,"title":"Mashou no Otome no Yakumawari","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":142,"title":"Miageru to Kimi wa","type":"Manga","chapters":33,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":143,"title":"Midara na Ao-chan wa Benkyou ga Dekinai","type":"Manga","chapters":39,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":144,"title":"Mijuku na Futari de Gozaimasu ga","type":"Manga","chapters":152,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":145,"title":"Mob Psycho 100","type":"Manga","chapters":109,"read":0,"readVols":0,"volumes":16,"status":"Pausiert","score":9,"notes":""},{"id":146,"title":"Monster","type":"Manga","chapters":162,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":147,"title":"Mousou Telepathy","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":148,"title":"Murciélago","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":149,"title":"Mushishi","type":"Manga","chapters":50,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":150,"title":"Nana","type":"Manga","chapters":84,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":""},{"id":151,"title":"Recovery of an MMO Junkie","type":"Manga","chapters":87,"read":0,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":""},{"id":152,"title":"Welcome to the N.H.K.","type":"Manga","chapters":40,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":153,"title":"Obaachan Shoujo Hinata-chan","type":"Manga","chapters":94,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":154,"title":"Ojou to Banken-kun","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":155,"title":"One Piece","type":"Manga","chapters":0,"read":168,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":156,"title":"One-Punch Man","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":157,"title":"Oogami-san, Dadamore desu.","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":158,"title":"Ookii Mukimuki Chiisai Muchimuchi","type":"Manga","chapters":0,"read":4,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":159,"title":"Ooyukiumi no Kaina","type":"Manga","chapters":26,"read":15,"readVols":0,"volumes":4,"status":"Am Lesen","score":7,"notes":""},{"id":160,"title":"Orange","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":161,"title":"Otaku ni Yasashii Gal wa Inai!?","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":162,"title":"Ousama Game","type":"Manga","chapters":25,"read":25,"readVols":0,"volumes":5,"status":"Abgeschlossen","score":2,"notes":""},{"id":163,"title":"Goodnight Punpun","type":"Manga","chapters":147,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":""},{"id":164,"title":"P to JK","type":"Manga","chapters":65,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":""},{"id":165,"title":"Planetes","type":"Manga","chapters":27,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":166,"title":"Pocha Musume wa Koakuma Move ga Yamerarenai","type":"Manga","chapters":24,"read":24,"readVols":0,"volumes":3,"status":"Abgeschlossen","score":8,"notes":""},{"id":167,"title":"Ponkotsu Fuuki Iin to Skirt-take ga Futekisetsu na JK no Hanashi","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":168,"title":"Ponkotsu Ponko","type":"Manga","chapters":79,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":169,"title":"Yakuza Fiancé","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":170,"title":"ReLIFE","type":"Manga","chapters":238,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":171,"title":"Rental Oniichan","type":"Manga","chapters":20,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":172,"title":"Ryoushin no Shakkin wo Katagawari shite Morau Jouken wa Nihonichi Kawaii Joshikousei to Issho ni Kurasu Koto deshita.","type":"Manga","chapters":77,"read":0,"readVols":0,"volumes":5,"status":"Pausiert","score":0,"notes":""},{"id":173,"title":"Sabishisugite Lesbian Fuuzoku ni Ikimashita Report","type":"Manga","chapters":6,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":174,"title":"Sachi-iro no One Room","type":"Manga","chapters":69,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":175,"title":"Sakamoto Days","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":176,"title":"Sankagetsu Mae ni Wakareta Senpai Kouhai no Hanashi","type":"Manga","chapters":35,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":177,"title":"Seihantai na Kimi to Boku","type":"Manga","chapters":71,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":178,"title":"Rascal Does Not Dream of a Logical Witch","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":179,"title":"Sekai de Ichiban Oppai ga Suki!","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":180,"title":"Senpai! Imakara Kokurimasu!","type":"Manga","chapters":30,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":181,"title":"Sensei wa Koi wo Oshierarenai","type":"Manga","chapters":47,"read":26,"readVols":0,"volumes":7,"status":"Pausiert","score":7,"notes":""},{"id":182,"title":"Shachou to Sake to Hoshi","type":"Manga","chapters":0,"read":33,"readVols":0,"volumes":0,"status":"Am Lesen","score":7,"notes":""},{"id":183,"title":"Shiawase Kanako no Koroshiya Seikatsu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":184,"title":"Your Lie in April","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":185,"title":"Shin Elf-san wa Yaserarenai.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":186,"title":"Attack on Titan","type":"Manga","chapters":141,"read":114,"readVols":0,"volumes":34,"status":"Pausiert","score":0,"notes":""},{"id":187,"title":"Attack on Titan: Before the Fall","type":"Manga","chapters":73,"read":24,"readVols":0,"volumes":17,"status":"Pausiert","score":0,"notes":""},{"id":188,"title":"Attack on Titan: Lost Girls","type":"Manga","chapters":7,"read":7,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":8,"notes":""},{"id":189,"title":"Attack on Titan: No Regrets","type":"Manga","chapters":8,"read":8,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":8,"notes":""},{"id":190,"title":"Attack on Titan: Lost Girls","type":"Manga","chapters":3,"read":3,"readVols":0,"volumes":1,"status":"Abgeschlossen","score":7,"notes":""},{"id":191,"title":"Attack on Titan: Lost Girls","type":"Manga","chapters":10,"read":10,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":7,"notes":""},{"id":192,"title":"Girls' Last Tour","type":"Manga","chapters":47,"read":21,"readVols":0,"volumes":6,"status":"Am Lesen","score":10,"notes":""},{"id":193,"title":"Shuumatsu Touring","type":"Manga","chapters":0,"read":5,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":194,"title":"Slam Dunk","type":"Manga","chapters":276,"read":0,"readVols":0,"volumes":31,"status":"Geplant","score":0,"notes":""},{"id":195,"title":"Somali and the Forest Spirit","type":"Manga","chapters":39,"read":39,"readVols":0,"volumes":6,"status":"Abgeschlossen","score":8,"notes":""},{"id":196,"title":"My Dress-Up Darling","type":"Manga","chapters":119,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":197,"title":"Soul Eater","type":"Manga","chapters":117,"read":4,"readVols":0,"volumes":25,"status":"Pausiert","score":0,"notes":""},{"id":198,"title":"Frieren: Beyond Journey's End","type":"Manga","chapters":0,"read":47,"readVols":0,"volumes":0,"status":"Am Lesen","score":9,"notes":""},{"id":199,"title":"Spy x Family","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":200,"title":"Succubus & Hitman","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":201,"title":"Suki x Suki","type":"Manga","chapters":23,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":202,"title":"Super no Ura de Yani Suu Futari","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":203,"title":"Suzumiya Haruhi-chan no Yuuutsu","type":"Manga","chapters":164,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":204,"title":"Taiyou no Ie","type":"Manga","chapters":53,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":""},{"id":205,"title":"Tejina-senpai","type":"Manga","chapters":132,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":206,"title":"High-Rise Invasion","type":"Manga","chapters":258,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":""},{"id":207,"title":"Terra Formars","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":208,"title":"To LOVE-Ru","type":"Manga","chapters":162,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":209,"title":"Tokyo Ghoul","type":"Manga","chapters":17,"read":0,"readVols":0,"volumes":3,"status":"Pausiert","score":0,"notes":""},{"id":210,"title":"Tokyo Ghoul","type":"Manga","chapters":144,"read":144,"readVols":0,"volumes":14,"status":"Abgeschlossen","score":9,"notes":""},{"id":211,"title":"Tokyo Ghoul:re","type":"Manga","chapters":181,"read":110,"readVols":0,"volumes":16,"status":"Pausiert","score":0,"notes":""},{"id":212,"title":"Witch Hat Atelier","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":213,"title":"TONIKAWA: Over the Moon For You","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":214,"title":"The Girl From the Other Side","type":"Manga","chapters":53,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":215,"title":"Toumei Otoko to Ningen Onna: Sonouchi Fuufu ni Naru Futari","type":"Manga","chapters":0,"read":36,"readVols":0,"volumes":0,"status":"Pausiert","score":9,"notes":""},{"id":216,"title":"Tower Dungeon","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":217,"title":"Tsukiatte Agetemo Ii kana","type":"Manga","chapters":133,"read":113,"readVols":0,"volumes":14,"status":"Am Lesen","score":8,"notes":""},{"id":218,"title":"Tsukuritai Onna to Tabetai Onna","type":"Manga","chapters":0,"read":49,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":219,"title":"Tsuredure Children","type":"Manga","chapters":212,"read":0,"readVols":0,"volumes":12,"status":"Pausiert","score":0,"notes":""},{"id":220,"title":"Uchi no Kaisha no Chiisai Senpai no Hanashi","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":221,"title":"Space Brothers","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":222,"title":"Ultraman","type":"Manga","chapters":0,"read":20,"readVols":0,"volumes":0,"status":"Abgebrochen","score":5,"notes":""},{"id":223,"title":"Umarekawattemo Mata, Watashi to Kekkon shitekuremasu ka","type":"Manga","chapters":26,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":224,"title":"Umineko no Naku Koro ni Chiru - Episode 8: Twilight of the Golden Witch","type":"Manga","chapters":42,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":225,"title":"Unemployed Gye Baek-soon","type":"Manga","chapters":0,"read":14,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":""},{"id":226,"title":"Vagabond","type":"Manga","chapters":327,"read":0,"readVols":0,"volumes":37,"status":"Geplant","score":0,"notes":""},{"id":227,"title":"Vampeerz","type":"Manga","chapters":46,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":228,"title":"Veil","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":229,"title":"My Hero Academia: Vigilantes","type":"Manga","chapters":132,"read":5,"readVols":0,"volumes":15,"status":"Abgebrochen","score":6,"notes":""},{"id":230,"title":"Vinland Saga","type":"Manga","chapters":224,"read":0,"readVols":0,"volumes":29,"status":"Geplant","score":0,"notes":""},{"id":231,"title":"Watashi no Shumi tte Hen desu ka?","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":1,"status":"Pausiert","score":0,"notes":""},{"id":232,"title":"Our Happy Hours","type":"Manga","chapters":8,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":233,"title":"Wotakoi: Love Is Hard for Otaku","type":"Manga","chapters":105,"read":105,"readVols":0,"volumes":11,"status":"Abgeschlossen","score":9,"notes":""},{"id":234,"title":"Bloom Into You","type":"Manga","chapters":50,"read":50,"readVols":0,"volumes":8,"status":"Abgeschlossen","score":9,"notes":""},{"id":235,"title":"Yagate Kimi ni Naru: Koushiki Comic Anthology","type":"Manga","chapters":26,"read":26,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":7,"notes":""},{"id":236,"title":"Bloom Into You: Regarding Saeki Sayaka","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":237,"title":"Yaiteru Futari","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":238,"title":"Yamada to Kase-san.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":239,"title":"Yamaguchi-kun wa Warukunai","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":240,"title":"Yankee-kun to Hakujou Girl","type":"Manga","chapters":127,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":241,"title":"Yokohama Kaidashi Kikou","type":"Manga","chapters":142,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":""},{"id":242,"title":"The Voynich Hotel","type":"Manga","chapters":22,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":243,"title":"Yoshinozuikara","type":"Manga","chapters":20,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":244,"title":"Yotsuba to!","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":245,"title":"A Sign of Affection","type":"Manga","chapters":0,"read":44,"readVols":0,"volumes":0,"status":"Pausiert","score":7,"notes":""},{"id":246,"title":"Yuru Camp△","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":247,"title":"Yuugai Toshi","type":"Manga","chapters":17,"read":17,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":10,"notes":""},{"id":248,"title":"Zenbu Kowashite Jigoku de Aishite","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":249,"title":"Éclair: Anata ni Hibiku Yuri Anthology","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":5,"status":"Pausiert","score":0,"notes":""}];

const STATUS_A = ["Am Schauen","Abgeschlossen","Geplant","Pausiert","Abgebrochen"];
const STATUS_M = ["Am Lesen","Abgeschlossen","Geplant","Pausiert","Abgebrochen"];
const FORMATS  = ["TV","Movie","OVA","ONA","Special","Musik"];
const TYPES    = ["Manga","Manhwa","Manhua","One-Shot","Novel","Light Novel"];

const SC = {
  "Am Schauen":    "#2ECC71",
  "Am Lesen":      "#2ECC71",
  "Abgeschlossen": "#3498DB",
  "Geplant":       "#9B59B6",
  "Pausiert":      "#F39C12",
  "Abgebrochen":   "#E74C3C",
};

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
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
  // Upsert all initial rows in one batch
  return sbFetch(table, {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

function Badge({ s }) {
  const c = SC[s] || "#666";
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 10,
      background: c + "22", color: c, fontWeight: 700,
    }}>{s}</span>
  );
}

function StarRating({ value, onChange, color = "#F5A623" }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <span key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ fontSize: 16, cursor: "pointer", lineHeight: 1, userSelect: "none",
            color: n <= (hover || value) ? color : "#333", transition: "color .1s" }}
        >★</span>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 11, fontWeight: 800, marginLeft: 4,
          color: value >= 9 ? "#F5A623" : value >= 7 ? "#2ECC71" : "#3498DB" }}>
          {value}/10
        </span>
      )}
    </div>
  );
}

function Stepper({ label, value, max, onInc, onDec }) {
  const theme = useTheme();
  const acc = theme.accentAnime;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 14px", borderTop: "1px solid #ffffff08" }}>
      <span style={{ fontSize: 12, color: "#888" }}>
        {label}{max != null ? <span style={{ color: "#444", fontSize: 11 }}> / {max}</span> : ""}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onDec} style={{ width: 28, height: 28, borderRadius: "50%", border: "none",
          background: "#ffffff10", color: "#aaa", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>−</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#e8e8e8", minWidth: 28, textAlign: "center" }}>{value}</span>
        <button onClick={onInc} style={{ width: 28, height: 28, borderRadius: "50%", border: "none",
          background: acc, color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>+</button>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 14px", borderTop: "1px solid #ffffff08" }}>
      <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
      {editing ? (
        <input autoFocus value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { onChange(parseInt(draft) || 0); setEditing(false); }}
          onKeyDown={e => { if (e.key === "Enter") { onChange(parseInt(draft) || 0); setEditing(false); } }}
          style={{ width: 64, background: "#ffffff10", border: "1px solid #ffffff20", borderRadius: 6,
            color: "#fff", fontSize: 14, fontWeight: 700, textAlign: "center", padding: "3px 6px",
            fontFamily: "inherit", outline: "none" }}
        />
      ) : (
        <div onClick={() => { setDraft(String(value)); setEditing(true); }}
          style={{ minWidth: 64, background: "#ffffff08", borderRadius: 6, padding: "3px 10px",
            cursor: "pointer", color: "#e8e8e8", fontSize: 14, fontWeight: 700, textAlign: "center" }}>
          {value}
        </div>
      )}
    </div>
  );
}

// ─── RelatedSection ──────────────────────────────────────────────────────────
function RelatedSection({ item, allAnime, allManga, onChange, accent }) {
  const [relType, setRelType] = useState("Sequel");
  const [searchRel, setSearchRel] = useState("");
  const results = useMemo(() => {
    if (!searchRel.trim()) return [];
    const q = searchRel.toLowerCase();
    return [
      ...allAnime.filter(a => a.id !== item.id && a.title.toLowerCase().includes(q)).slice(0, 4).map(a => ({ ...a, _kind: "anime" })),
      ...allManga.filter(m => m.id !== item.id && m.title.toLowerCase().includes(q)).slice(0, 4).map(m => ({ ...m, _kind: "manga" })),
    ].slice(0, 6);
  }, [searchRel, allAnime, allManga, item.id]);

  const addRel = r => {
    const existing = item.related || [];
    if (existing.some(e => e.id === r.id && e.kind === r._kind)) return;
    onChange({ ...item, related: [...existing, { id: r.id, title: r.title, kind: r._kind, relType }] });
    setSearchRel("");
  };
  const removeRel = (id, kind) => {
    onChange({ ...item, related: (item.related || []).filter(r => !(r.id === id && r.kind === kind)) });
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
        Verwandte Werke
      </div>
      {(item.related || []).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {(item.related || []).map((r, i) => (
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
            borderRadius: 16, border: "1px solid " + (relType === t ? accent : "#ffffff12"),
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

// ─── AnimeCard ────────────────────────────────────────────────────────────────
function AnimeCard({ item, onChange, allAnimeRef, allMangaRef, isOpen, onToggle }) {
  const theme = useTheme();
  const c = SC[item.status] || "#666";
  const pct = item.eps ? Math.min(100, Math.round(((item.watched||0)/item.eps)*100)) : 0;
  const upd = (f, v) => onChange({ ...item, [f]: v });
  const sc = item.score >= 9 ? "#F5A623" : item.score >= 7 ? "#2ECC71" : item.score >= 5 ? "#3498DB" : "#E74C3C";

  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, marginBottom: 10, overflow: "hidden",
      border: `1px solid ${isOpen ? theme.accentAnime+"44" : "#ffffff08"}`, transition: "border-color .2s" }}>
      <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <div onClick={onToggle} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#ffffff12", color: "#888", fontWeight: 600 }}>{item.format||"TV"}</span>
            <Badge s={item.status} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
          {item.subtitle && <div style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{item.subtitle}</div>}
          {item.score > 0 && (
            <div style={{ marginTop: 5 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc+"22", borderRadius: 20, padding: "2px 8px" }}>
                <span style={{ color: sc, fontSize: 14 }}>&#9733;</span>
                <span style={{ color: sc, fontSize: 13, fontWeight: 800 }}>{item.score}</span>
              </span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 5, background: "#ffffff10", borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 3, transition: "width .3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>{item.watched||0}/{item.eps||"?"} Ep</span>
          </div>
        </div>
        {!isOpen && (
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); onChange({ ...item, watched: Math.max(0,(item.watched||0)-1) }); }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#ffffff12", color: "#aaa", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>&#8722;</button>
            <button onClick={e => { e.stopPropagation(); onChange({ ...item, watched: Math.min((item.watched||0)+1, item.eps||9999) }); }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: theme.accentAnime, color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>+</button>
          </div>
        )}
        <span onClick={onToggle} style={{ color: isOpen ? theme.accentAnime : "#555", fontSize: 13, flexShrink: 0, cursor: "pointer", padding: "4px 0 4px 4px", userSelect: "none" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>
      {isOpen && (
        <div onClick={e => e.stopPropagation()} style={{ padding: "4px 14px 14px", borderTop: "1px solid #ffffff08" }}>
          <div style={{ padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Titel</div>
              <input value={item.title||""} onChange={e => upd("title", e.target.value)} onClick={e => e.stopPropagation()}
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Untertitel / Romaji</div>
              <input value={item.subtitle||""} onChange={e => upd("subtitle", e.target.value)} onClick={e => e.stopPropagation()}
                placeholder="z.B. Shingeki no Kyojin"
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <Stepper label="Gesehen" value={item.watched||0} max={item.eps||null}
            onInc={() => upd("watched", Math.min((item.watched||0)+1, item.eps||9999))}
            onDec={() => upd("watched", Math.max(0,(item.watched||0)-1))} />
          <NumberInput label="Gesamt Episoden" value={item.eps||0} onChange={v => upd("eps", v)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid #ffffff08" }}>
            <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: ".06em" }}>Bewertung</span>
            <StarRating value={item.score||0} onChange={v => upd("score", v)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STATUS_A.map(s => (
                <button key={s} onClick={() => upd("status", s)} style={{ padding: "5px 11px", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 20,
                  border: `1px solid ${item.status===s ? (SC[s]||theme.accentAnime) : "#ffffff15"}`,
                  background: item.status===s ? (SC[s]||theme.accentAnime)+"22" : "transparent",
                  color: item.status===s ? (SC[s]||theme.accentAnime) : "#666" }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Format</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {FORMATS.map(f => (
                <button key={f} onClick={() => upd("format", f)} style={{ padding: "5px 11px", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 20,
                  border: `1px solid ${item.format===f ? theme.accentAnime : "#ffffff15"}`,
                  background: item.format===f ? theme.accentAnime+"22" : "transparent",
                  color: item.format===f ? theme.accentAnime : "#666" }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <textarea value={item.notes||""} onChange={e => upd("notes", e.target.value)} rows={2} placeholder="Notizen..."
              style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff10", borderRadius: 8, padding: "8px 10px", color: "#ccc", fontSize: 13, fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
          </div>
          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent={theme.accentAnime} />
        </div>
      )}
    </div>
  );
}

// ─── MangaCard ────────────────────────────────────────────────────────────────
function MangaCard({ item, onChange, allAnimeRef, allMangaRef, isOpen, onToggle }) {
  const theme = useTheme();
  const c = SC[item.status] || "#666";
  const pctChap = item.chapters ? Math.min(100, Math.round(((item.read||0)/item.chapters)*100)) : 0;
  const pctVol  = item.volumes  ? Math.min(100, Math.round(((item.readVols||0)/item.volumes)*100)) : 0;
  const upd = (f, v) => onChange({ ...item, [f]: v });
  const sc = item.score >= 9 ? "#F5A623" : item.score >= 7 ? "#2ECC71" : item.score >= 5 ? "#3498DB" : "#E74C3C";

  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, marginBottom: 10, overflow: "hidden",
      border: `1px solid ${isOpen ? theme.accentManga+"44" : "#ffffff08"}`, transition: "border-color .2s" }}>
      <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <div onClick={onToggle} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#ffffff12", color: "#888", fontWeight: 600 }}>{item.type||"Manga"}</span>
            <Badge s={item.status} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
          {item.subtitle && <div style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{item.subtitle}</div>}
          {item.score > 0 && (
            <div style={{ marginTop: 5 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc+"22", borderRadius: 20, padding: "2px 8px" }}>
                <span style={{ color: sc, fontSize: 14 }}>&#9733;</span>
                <span style={{ color: sc, fontSize: 13, fontWeight: 800 }}>{item.score}</span>
              </span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 5, background: "#ffffff10", borderRadius: 3 }}>
              <div style={{ width: `${pctChap}%`, height: "100%", background: c, borderRadius: 3, transition: "width .3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>{item.read||0}/{item.chapters||"?"} Kap</span>
          </div>
          {item.volumes > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1, height: 3, background: "#ffffff08", borderRadius: 3 }}>
                <div style={{ width: `${pctVol}%`, height: "100%", background: c+"99", borderRadius: 3, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap" }}>{item.readVols||0}/{item.volumes} Bd</span>
            </div>
          )}
        </div>
        {!isOpen && (
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={e => { e.stopPropagation(); onChange({ ...item, read: Math.max(0,(item.read||0)-1) }); }}
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#ffffff12", color: "#aaa", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>&#8722;</button>
              <button onClick={e => { e.stopPropagation(); onChange({ ...item, read: Math.min((item.read||0)+1, item.chapters||9999) }); }}
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: theme.accentManga, color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>+</button>
            </div>
            {item.volumes > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <button onClick={e => { e.stopPropagation(); onChange({ ...item, readVols: Math.max(0,(item.readVols||0)-1) }); }}
                  style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ffffff08", color: "#666", fontSize: 12, cursor: "pointer", lineHeight: 1, padding: 0 }}>&#8722;</button>
                <span style={{ fontSize: 9, color: "#555" }}>Bd</span>
                <button onClick={e => { e.stopPropagation(); onChange({ ...item, readVols: Math.min((item.readVols||0)+1, item.volumes||9999) }); }}
                  style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: theme.accentManga+"66", color: "#ccc", fontSize: 12, cursor: "pointer", lineHeight: 1, padding: 0 }}>+</button>
              </div>
            )}
          </div>
        )}
        <span onClick={onToggle} style={{ color: isOpen ? theme.accentManga : "#555", fontSize: 13, flexShrink: 0, cursor: "pointer", padding: "4px 0 4px 4px", userSelect: "none" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>
      {isOpen && (
        <div onClick={e => e.stopPropagation()} style={{ padding: "4px 14px 14px", borderTop: "1px solid #ffffff08" }}>
          <div style={{ padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Titel</div>
              <input value={item.title||""} onChange={e => upd("title", e.target.value)} onClick={e => e.stopPropagation()}
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Untertitel / Romaji</div>
              <input value={item.subtitle||""} onChange={e => upd("subtitle", e.target.value)} onClick={e => e.stopPropagation()}
                placeholder="z.B. Boku no Hero Academia"
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <Stepper label="Kapitel gelesen" value={item.read||0} max={item.chapters||null}
            onInc={() => upd("read", Math.min((item.read||0)+1, item.chapters||9999))}
            onDec={() => upd("read", Math.max(0,(item.read||0)-1))} />
          <Stepper label="Bände gelesen" value={item.readVols||0} max={item.volumes||null}
            onInc={() => upd("readVols", Math.min((item.readVols||0)+1, item.volumes||9999))}
            onDec={() => upd("readVols", Math.max(0,(item.readVols||0)-1))} />
          <NumberInput label="Gesamt Kapitel" value={item.chapters||0} onChange={v => upd("chapters", v)} />
          <NumberInput label="Gesamt Bände" value={item.volumes||0} onChange={v => upd("volumes", v)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid #ffffff08" }}>
            <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: ".06em" }}>Bewertung</span>
            <StarRating value={item.score||0} onChange={v => upd("score", v)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STATUS_M.map(s => (
                <button key={s} onClick={() => upd("status", s)} style={{ padding: "5px 11px", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 20,
                  border: `1px solid ${item.status===s ? (SC[s]||theme.accentManga) : "#ffffff15"}`,
                  background: item.status===s ? (SC[s]||theme.accentManga)+"22" : "transparent",
                  color: item.status===s ? (SC[s]||theme.accentManga) : "#666" }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Typ</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => upd("type", t)} style={{ padding: "5px 11px", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 20,
                  border: `1px solid ${item.type===t ? theme.accentManga : "#ffffff15"}`,
                  background: item.type===t ? theme.accentManga+"22" : "transparent",
                  color: item.type===t ? theme.accentManga : "#666" }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <textarea value={item.notes||""} onChange={e => upd("notes", e.target.value)} rows={2} placeholder="Notizen..."
              style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff10", borderRadius: 8, padding: "8px 10px", color: "#ccc", fontSize: 13, fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
          </div>
          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent={theme.accentManga} />
        </div>
      )}
    </div>
  );
}

// ─── CardGrid ─────────────────────────────────────────────────────────────────
function CardGrid({ rows, tab, updateAnime, updateManga, anime, manga, openId, toggleCard }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 8 }}>
      {rows.map(item =>
        tab === "anime"
          ? <AnimeCard key={item.id} item={item} onChange={updateAnime} allAnimeRef={anime} allMangaRef={manga}
              isOpen={String(openId)===String(item.id)} onToggle={() => toggleCard(item.id)} />
          : <MangaCard key={item.id} item={item} onChange={updateManga} allAnimeRef={anime} allMangaRef={manga}
              isOpen={String(openId)===String(item.id)} onToggle={() => toggleCard(item.id)} />
      )}
    </div>
  );
}

// ─── AddModal ─────────────────────────────────────────────────────────────────
function AddModal({ type, onClose, onAdd, allAnime, allManga }) {
  const theme = useTheme();
  const isAnime = type === "anime";
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetched, setFetched] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Geplant");
  const [format, setFormat] = useState("TV");
  const [mtype, setMtype] = useState("Manga");
  const [eps, setEps] = useState(0);
  const [watched, setWatched] = useState(0);
  const [chapters, setChapters] = useState(0);
  const [volumes, setVolumes] = useState(0);
  const [read, setRead] = useState(0);
  const [score, setScore] = useState(0);
  const [malImage, setMalImage] = useState("");
  const [relatedWorks, setRelatedWorks] = useState([]);

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
      if (isAnime) { setFormat(MAL_FORMAT_MAP[data.type] || "TV"); setEps(data.episodes || 0); }
      else { setMtype(MAL_FORMAT_MAP[data.type] || "Manga"); setChapters(data.chapters || 0); setVolumes(data.volumes || 0); }
      setRelatedWorks(parseRelatedFromMAL(data));
      setFetched(true);
    } catch { setFetchError("Fehler beim Laden – bitte nochmal versuchen"); }
    finally { setFetching(false); }
  };

  const matchedRelated = relatedWorks.filter(r => {
    const pool = r.kind === "anime" ? allAnime : allManga;
    return pool.some(e => e.id === r.id);
  });

  const submit = () => {
    if (!title.trim()) return;
    if (isAnime) onAdd({ id: Date.now(), title: title.trim(), format, eps, watched, status, score, notes: "", related: matchedRelated });
    else onAdd({ id: Date.now(), title: title.trim(), type: mtype, chapters, volumes, read, readVols: 0, status, score, notes: "", related: matchedRelated });
    onClose();
  };

  const acc = isAnime ? theme.accentAnime : theme.accentManga;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000,
      display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", background: "#0d1525", borderRadius: "20px 20px 0 0",
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
          {isAnime ? (
            <>
              <NumberInput label="Episoden gesamt" value={eps} onChange={v => setEps(v)} />
              <Stepper label="Gesehen" value={watched} max={eps || null}
                onInc={() => setWatched(e => Math.min(e + 1, eps || 9999))}
                onDec={() => setWatched(e => Math.max(0, e - 1))} />
            </>
          ) : (
            <>
              <NumberInput label="Kapitel gesamt" value={chapters} onChange={v => setChapters(v)} />
              <NumberInput label="Bände gesamt" value={volumes} onChange={v => setVolumes(v)} />
              <Stepper label="Kapitel gelesen" value={read} max={chapters || null}
                onInc={() => setRead(e => Math.min(e + 1, chapters || 9999))}
                onDec={() => setRead(e => Math.max(0, e - 1))} />
            </>
          )}
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
    document.head.appendChild(s);
  }, []);
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
    "Bewertung": a.score || 0, "Notizen": a.notes || "",
  }));
  const mangaRows = manga.map(m => ({
    "ID": m.id, "Titel": m.title, "Untertitel": m.subtitle || "",
    "Typ": m.type || "Manga", "Status": m.status || "",
    "Kapitel gelesen": m.read || 0, "Kapitel gesamt": m.chapters || 0,
    "Bände gelesen": m.readVols || 0, "Bände gesamt": m.volumes || 0,
    "Fortschritt %": m.chapters ? Math.round(((m.read || 0) / m.chapters) * 100) : 0,
    "Bewertung": m.score || 0, "Notizen": m.notes || "",
  }));
  const statsRows = ["Abgeschlossen","Am Schauen","Am Lesen","Geplant","Pausiert","Abgebrochen"].map(s => ({
    "Status": s, "Anime": anime.filter(a => a.status === s).length, "Manga": manga.filter(m => m.status === s).length,
  }));
  statsRows.push({ "Status": "GESAMT", "Anime": anime.length, "Manga": manga.length });
  const wb = XLSX.utils.book_new();
  const wsA = XLSX.utils.json_to_sheet(animeRows);
  const wsM = XLSX.utils.json_to_sheet(mangaRows);
  const wsS = XLSX.utils.json_to_sheet(statsRows);
  wsA["!cols"] = [{wch:6},{wch:40},{wch:30},{wch:8},{wch:14},{wch:10},{wch:10},{wch:13},{wch:10},{wch:30}];
  wsM["!cols"] = [{wch:6},{wch:40},{wch:30},{wch:10},{wch:14},{wch:14},{wch:14},{wch:13},{wch:13},{wch:13},{wch:10},{wch:30}];
  XLSX.utils.book_append_sheet(wb, wsA, "Anime");
  XLSX.utils.book_append_sheet(wb, wsM, "Manga");
  XLSX.utils.book_append_sheet(wb, wsS, "Statistik");
  XLSX.writeFile(wb, `Matter_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ─── Theme Panel ──────────────────────────────────────────────────────────────
function ThemePanel({ theme, onChange, onClose }) {
  const fields = [
    ["accentAnime",   "Anime Akzent"],
    ["accentManga",   "Manga Akzent"],
    ["accentStats",   "Stats Akzent"],
    ["accentUpdates", "Updates Akzent"],
    ["bgApp",         "Hintergrund App"],
    ["bgCard",        "Hintergrund Karten"],
    ["bgHeader",      "Hintergrund Header"],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d1525", borderRadius: 18,
        padding: 24, width: 340, border: "1px solid #ffffff15", boxShadow: "0 20px 60px #000a",
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
            cursor: "pointer", fontFamily: "inherit" }}>
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}

// ─── Bulk Update + Notifications ─────────────────────────────────────────────
async function fetchRelatedFull(kind, malId) {
  await new Promise(r => setTimeout(r, 340));
  const res = await fetch(`https://api.jikan.moe/v4/${kind}/${malId}/full`);
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()).data;
}

function NotificationsView({ anime, manga, onUpdateAnime, onUpdateManga }) {
  const theme = useTheme();
  const [bulkState, setBulkState] = useState("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const abortRef = useRef(false);

  const notifications = useMemo(() => {
    const now = new Date();
    const sixAgo = new Date(now); sixAgo.setMonth(now.getMonth() - 6);
    const items = [];
    const check = (entry, kind) => {
      for (const r of (entry.related || [])) {
        if (!["Sequel","Prequel","Adaption","Side Story","Spin-off","Summary"].includes(r.relType)) continue;
        if (!r.airing && !r.status) continue;
        const isUpcoming = ["Not yet aired","Not yet published","Upcoming"].includes(r.status);
        const isRecent = r.aired_from ? new Date(r.aired_from) >= sixAgo && new Date(r.aired_from) <= now : false;
        const isAdaptation = r.relType === "Adaption";
        if (isUpcoming || isRecent || isAdaptation) {
          items.push({ sourceTitle: entry.title, sourceKind: kind, relTitle: r.title,
            relKind: r.kind, relType: r.relType, status: r.status || "",
            airedFrom: r.aired_from || null, isUpcoming, isRecent, isAdaptation });
        }
      }
    };
    anime.forEach(a => check(a, "anime"));
    manga.forEach(m => check(m, "manga"));
    return items.sort((a, b) => {
      if (a.isUpcoming && !b.isUpcoming) return -1;
      if (!a.isUpcoming && b.isUpcoming) return 1;
      if (a.airedFrom && b.airedFrom) return new Date(b.airedFrom) - new Date(a.airedFrom);
      return 0;
    });
  }, [anime, manga]);

  const startBulkUpdate = async () => {
    abortRef.current = false;
    const all = [
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
        const data = await fetchRelatedFull(entry._kind, entry.id);
        const MAP = {"Sequel":"Sequel","Prequel":"Prequel","Side story":"Side Story","Parent story":"Prequel",
          "Full story":"Sequel","Spin-off":"Spin-off","Alternative setting":"Alternative",
          "Alternative version":"Alternative","Adaptation":"Adaption","Summary":"Summary","Other":"Related","Character":"Related"};
        const related = (data.relations || []).flatMap(rel =>
          (rel.entry || []).map(e => ({
            id: e.mal_id, title: e.name, kind: e.type === "anime" ? "anime" : "manga",
            relType: MAP[rel.relation] || "Related",
            status: data.status || "", aired_from: data.aired?.from || data.published?.from || null,
            airing: data.airing || false,
          }))
        );
        const updated = { ...entry, related };
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
          Holt für alle {anime.length + manga.length} Einträge die aktuellen Sequel/Prequel-Daten von MyAnimeList.
          Dauert ca. <span style={{ color: "#F5A623" }}>4–5 Minuten</span>.
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
        <div style={{ display: "flex", gap: 8 }}>
          {bulkState !== "running" ? (
            <button onClick={startBulkUpdate} style={{ padding: "8px 18px", border: "none", borderRadius: 20,
              cursor: "pointer", background: `linear-gradient(135deg,${theme.accentAnime},${theme.accentAnime}cc)`,
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
              {bulkState === "done" ? "Erneut aktualisieren" : "Jetzt aktualisieren"}
            </button>
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
          border: `1px solid ${n.isUpcoming ? theme.accentAnime + "22" : "#ffffff08"}`,
          borderLeft: `3px solid ${typeColor[n.relType] || "#555"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: ".05em",
              background: (typeColor[n.relType] || "#555") + "22", color: typeColor[n.relType] || "#555" }}>
              {n.relType}
            </span>
            {n.isUpcoming && <span style={{ fontSize: 10, color: "#F5A623", fontWeight: 700 }}>Kommend</span>}
            {n.isRecent && !n.isUpcoming && <span style={{ fontSize: 10, color: "#2ECC71", fontWeight: 700 }}>Neu</span>}
            {n.isAdaptation && <span style={{ fontSize: 10, color: "#9B59B6", fontWeight: 700 }}>Adaption</span>}
            <span style={{ fontSize: 10, color: "#444", marginLeft: "auto" }}>{n.relKind === "anime" ? "Anime" : "Manga"}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e8", marginBottom: 2 }}>{n.relTitle}</div>
          <div style={{ fontSize: 11, color: "#555" }}>
            zu: <span style={{ color: "#888" }}>{n.sourceTitle}</span>
            {n.airedFrom && (
              <span style={{ marginLeft: 8, color: "#666" }}>
                {new Date(n.airedFrom).toLocaleDateString("de-DE", { year: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── StatsView ────────────────────────────────────────────────────────────────
function StatsView({ anime, manga }) {
  const theme = useTheme();
  const ac = {}, mc = {};
  anime.forEach(a => { ac[a.status] = (ac[a.status] || 0) + 1; });
  manga.forEach(m => { mc[m.status] = (mc[m.status] || 0) + 1; });
  const sa = anime.filter(a => a.score > 0), sm = manga.filter(m => m.score > 0);
  const avgA = sa.length ? (sa.reduce((s, a) => s + a.score, 0) / sa.length).toFixed(1) : "—";
  const avgM = sm.length ? (sm.reduce((s, m) => s + m.score, 0) / sm.length).toFixed(1) : "—";
  const eps = anime.reduce((s, a) => s + (a.watched || 0), 0);
  const chaps = manga.reduce((s, m) => s + (m.read || 0), 0);
  const favA = anime.filter(a => a.score === 10);
  const favM = manga.filter(m => m.score === 10);

  const StatCard = ({ label, val, color }) => (
    <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: "14px 16px", flex: 1 }}>
      <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{val}</div>
    </div>
  );
  const SBar = ({ label, count, color, total }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: "#bbb" }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontSize: 14, minWidth: 28, textAlign: "right" }}>{count}</span>
      <div style={{ width: 70, height: 3, background: "#ffffff10", borderRadius: 2 }}>
        <div style={{ width: `${Math.round(count / total * 100)}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <StatCard label="Anime" val={anime.length} color={theme.accentAnime} />
        <StatCard label="Manga" val={manga.length} color={theme.accentManga} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <StatCard label="Episoden" val={eps.toLocaleString("de")} color="#3498DB" />
        <StatCard label="Kapitel" val={chaps.toLocaleString("de")} color="#2ECC71" />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <StatCard label="Ø Anime" val={avgA} color={theme.accentStats} />
        <StatCard label="Ø Manga" val={avgM} color={theme.accentStats} />
      </div>
      <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentAnime, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
          Anime Status
        </div>
        {STATUS_A.map(s => ac[s] ? <SBar key={s} label={s} count={ac[s]} color={SC[s]} total={anime.length} /> : null)}
      </div>
      <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentManga, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
          Manga Status
        </div>
        {STATUS_M.map(s => mc[s] ? <SBar key={s} label={s} count={mc[s]} color={SC[s]} total={manga.length} /> : null)}
      </div>
      {(favA.length > 0 || favM.length > 0) && (
        <div style={{ background: "#1a1306", border: "1px solid #F5A62325", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
            10/10 Favoriten
          </div>
          {favA.map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <span style={{ color: "#F5A623", fontWeight: 800, fontSize: 12, minWidth: 22 }}>#{i + 1}</span>
              <span style={{ fontSize: 13, color: "#ddd", lineHeight: 1.4 }}>Anime: {a.title}</span>
            </div>
          ))}
          {favM.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <span style={{ color: "#F5A623", fontWeight: 800, fontSize: 12, minWidth: 22 }}>#{i + 1}</span>
              <span style={{ fontSize: 13, color: "#ddd", lineHeight: 1.4 }}>Manga: {m.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [anime, setAnime] = useState(() => load(STORAGE_KEY_A, INIT_ANIME));
  const [manga, setManga] = useState(() => load(STORAGE_KEY_M, INIT_MANGA));
  const [tab, setTab] = useState("anime");
  const [statusF, setStatusF] = useState("Alle");
  const prefsLoaded = useRef(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [showTheme, setShowTheme] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(null);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncMsg, setSyncMsg] = useState("");
  const xlsxReady = useSheetJS();
  const [openId, setOpenId] = useState(null);
  const toggleCard = id => setOpenId(prev => String(prev) === String(id) ? null : String(id));
  const syncTimer = useRef(null);

  useEffect(() => {
    if (!USE_SUPABASE) {
      setSyncStatus("offline");
      setSyncMsg("Lokaler Speicher aktiv");
      loadPrefs().then(prefs => {
        if (prefs.tab) setTab(prefs.tab);
        if (prefs.statusF) setStatusF(prefs.statusF);
        if (prefs.theme) setTheme(t => ({ ...DEFAULT_THEME, ...prefs.theme }));
        prefsLoaded.current = true;
      });
      return;
    }
    setSyncStatus("syncing"); setSyncMsg("Lade Daten\u2026");
    Promise.all([loadFromSupabase("anime"), loadFromSupabase("manga")])
      .then(([a, m]) => {
        if (a && a.length > 0) { setAnime(a); save(STORAGE_KEY_A, a); }
        else { const local = load(STORAGE_KEY_A, INIT_ANIME); initSupabase("anime", local).then(() => setAnime(local)); }
        if (m && m.length > 0) { setManga(m); save(STORAGE_KEY_M, m); }
        else { const local = load(STORAGE_KEY_M, INIT_MANGA); initSupabase("manga", local).then(() => setManga(local)); }
        setSyncStatus("ok"); setSyncMsg("Synchronisiert");
        setTimeout(() => setSyncStatus("idle"), 3000);
        loadPrefs().then(prefs => {
          if (prefs.tab) setTab(prefs.tab);
          if (prefs.statusF) setStatusF(prefs.statusF);
          if (prefs.theme) setTheme(t => ({ ...DEFAULT_THEME, ...prefs.theme }));
          prefsLoaded.current = true;
        });
      })
      .catch(() => { setSyncStatus("error"); setSyncMsg("Sync fehlgeschlagen"); });
  }, []);

  useEffect(() => { save(STORAGE_KEY_A, anime); }, [anime]);
  useEffect(() => { save(STORAGE_KEY_M, manga); }, [manga]);
  useEffect(() => {
    if (!prefsLoaded.current) return;
    savePrefs({ tab, statusF, theme });
  }, [tab, statusF, theme]);

  const syncItem = useCallback((table, item) => {
    if (!USE_SUPABASE) return;
    clearTimeout(syncTimer.current);
    setSyncStatus("syncing");
    syncTimer.current = setTimeout(() => {
      upsertToSupabase(table, item)
        .then(() => { setSyncStatus("ok"); setSyncMsg("Gespeichert"); setTimeout(() => setSyncStatus("idle"), 2000); })
        .catch(() => { setSyncStatus("error"); setSyncMsg("Sync fehlgeschlagen"); });
    }, 600);
  }, []);

  const updateAnime = item => { setAnime(prev => prev.map(a => a.id === item.id ? item : a)); syncItem("anime", item); };
  const updateManga = item => { setManga(prev => prev.map(m => m.id === item.id ? item : m)); syncItem("manga", item); };
  const addAnime = item => { setAnime(prev => [...prev, item]); if (USE_SUPABASE) upsertToSupabase("anime", item).catch(console.error); };
  const addManga = item => { setManga(prev => [...prev, item]); if (USE_SUPABASE) upsertToSupabase("manga", item).catch(console.error); };

  const statuses = tab === "manga" ? STATUS_M : STATUS_A;
  const acc = tab === "anime" ? theme.accentAnime : tab === "manga" ? theme.accentManga : tab === "updates" ? theme.accentUpdates : theme.accentStats;

  const rows = useMemo(() => {
    let data = tab === "anime" ? anime : tab === "manga" ? manga : [];
    if (statusF !== "Alle") data = data.filter(x => x.status === statusF);
    if (search.trim()) { const q = search.toLowerCase(); data = data.filter(x => x.title.toLowerCase().includes(q)); }
    return [...data].sort((a, b) => {
      if (sortBy === "status") {
        const va2 = tab === "manga" ? (a.read ?? 0) : (a.watched ?? 0);
        const vb2 = tab === "manga" ? (b.read ?? 0) : (b.watched ?? 0);
        return sortDir === "asc" ? vb2 - va2 : va2 - vb2;
      }
      let va = a[sortBy] || 0, vb = b[sortBy] || 0;
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [tab, anime, manga, statusF, search, sortBy, sortDir]);

  const TABS = [
    ["anime",   "Anime"],
    ["manga",   "Manga"],
    ["stats",   "Stats"],
    ["updates", "Updates"],
  ];

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ minHeight: "100vh", background: theme.bgApp, color: "#e0e0e0", maxWidth: 900, margin: "0 auto",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {showTheme && <ThemePanel theme={theme} onChange={setTheme} onClose={() => setShowTheme(false)} />}

        {/* Header */}
        <div style={{ background: theme.bgHeader, borderBottom: "1px solid #ffffff0a",
          padding: "16px 18px 0", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: ".06em",
                background: `linear-gradient(90deg,${theme.accentAnime},${theme.accentManga})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                MATTER
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".08em",
                color: syncStatus === "ok" ? "#2ECC71" : syncStatus === "syncing" ? "#F5A623" : syncStatus === "error" ? "#E74C3C" : "#555" }}>
                {syncStatus === "syncing" ? syncMsg : syncStatus === "ok" ? syncMsg : syncStatus === "error" ? syncMsg : syncStatus === "offline" ? "Offline" : "Anime & Manga Tracker"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setShowTheme(true)}
                style={{ padding: "9px 12px", border: "none", borderRadius: 22, background: "#ffffff12",
                  color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Farben
              </button>
              <button onClick={() => exportToExcel(anime, manga)} disabled={!xlsxReady}
                style={{ padding: "9px 12px", border: "none", borderRadius: 22, background: "#ffffff12",
                  color: xlsxReady ? "#aaa" : "#444", fontSize: 13, cursor: xlsxReady ? "pointer" : "default",
                  fontFamily: "inherit", transition: "background .2s" }}>
                Excel
              </button>
              <button onClick={() => setAdding(tab === "stats" || tab === "updates" ? "anime" : tab)}
                style={{ padding: "9px 16px", border: "none", borderRadius: 22, color: "#fff", fontSize: 13,
                  fontWeight: 800, cursor: "pointer", fontFamily: "inherit", letterSpacing: ".04em",
                  background: `linear-gradient(135deg,${acc},${acc}cc)` }}>
                + Neu
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {TABS.map(([id, label]) => {
              const tabAcc = id === "anime" ? theme.accentAnime : id === "manga" ? theme.accentManga : id === "updates" ? theme.accentUpdates : theme.accentStats;
              const active = tab === id;
              return (
                <button key={id} onClick={() => { setTab(id); setStatusF("Alle"); setSearch(""); }} style={{
                  flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", fontFamily: "inherit",
                  borderBottom: `2px solid ${active ? tabAcc : "transparent"}`,
                  background: "transparent", color: active ? tabAcc : "#555",
                  fontSize: 12, fontWeight: 700, letterSpacing: ".03em", transition: "all .2s",
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "14px 14px 100px" }}>
          {tab === "stats" ? (
            <StatsView anime={anime} manga={manga} />
          ) : tab === "updates" ? (
            <NotificationsView anime={anime} manga={manga} onUpdateAnime={updateAnime} onUpdateManga={updateManga} />
          ) : (
            <>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                  color: "#555", fontSize: 13, pointerEvents: "none" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Suche..."
                  style={{ width: "100%", padding: "10px 12px 10px 34px", background: theme.bgCard,
                    border: "1px solid #ffffff0a", borderRadius: 10, color: "#ddd", fontSize: 14,
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
                {[["title","A–Z"],["score","Score"],["status", tab==="manga" ? "Kapitel" : "Episoden"]].map(([k, l]) => (
                  <button key={k} onClick={() => { if (sortBy === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(k); setSortDir("asc"); } }}
                    style={{ padding: "5px 12px", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0,
                      border: `1px solid ${sortBy === k ? acc : "#ffffff12"}`,
                      background: sortBy === k ? acc + "22" : "transparent",
                      color: sortBy === k ? acc : "#666" }}>
                    {l} {sortBy === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
                {["Alle", ...statuses].map(s => {
                  const c = SC[s] || acc;
                  const on = statusF === s;
                  return (
                    <button key={s} onClick={() => setStatusF(s)}
                      style={{ padding: "5px 12px", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0,
                        border: `1px solid ${on ? c : "#ffffff0d"}`,
                        background: on ? c + "22" : "transparent",
                        color: on ? c : "#555" }}>{s}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 10 }}>{rows.length} Einträge</div>
              <CardGrid rows={rows} tab={tab} updateAnime={updateAnime} updateManga={updateManga}
                anime={anime} manga={manga} openId={openId} toggleCard={toggleCard} />
              {rows.length === 0 && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 14, fontStyle: "italic", padding: "48px 0" }}>
                  Keine Einträge gefunden
                </div>
              )}
            </>
          )}
        </div>

        {adding && (
          <AddModal type={adding} onClose={() => setAdding(null)}
            onAdd={adding === "anime" ? addAnime : addManga}
            allAnime={anime} allManga={manga} />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}
