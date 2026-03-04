import { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ─── Supabase Config ────────────────────────────────────────────────────────
// Replace these two values after creating your Supabase project:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";

const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);

// LocalStorage fallback keys
const STORAGE_KEY_A = "nirusu_anime";
const STORAGE_KEY_M = "nirusu_manga";

const INIT_ANIME = [{"id":1,"title":"\"Omae Gotoki ga Maou ni Kateru to Omouna\" to Yuusha Party wo Tsuihou sareta node, Outo de Kimama ni Kurashitai","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":0,"notes":""},{"id":2,"title":"2.5-jigen no Ririsa","format":"TV","eps":24,"watched":7,"status":"Abgebrochen","score":6,"notes":""},{"id":3,"title":"3D Kanojo: Real Girl","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":4,"title":"5-toubun no Hanayome","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":5,"title":"5-toubun no Hanayome \u222c","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":6,"title":"86","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":7,"title":"91 Days","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":8,"title":"Adachi to Shimamura","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":9,"title":"Aho Girl","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":10,"title":"Ajin","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":11,"title":"Akagami no Shirayuki-hime","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":12,"title":"Akiba Meido Sensou","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":13,"title":"Akkun to Kanojo","format":"TV","eps":25,"watched":5,"status":"Abgebrochen","score":6,"notes":""},{"id":14,"title":"Akudama Drive","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":15,"title":"Akuyaku Reijou nanode Last Boss wo Kattemimashita","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":16,"title":"Akuyaku Reijou Tensei Ojisan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":0,"notes":""},{"id":17,"title":"Ameku Takao no Suiri Karte","format":"TV","eps":12,"watched":0,"status":"Abgebrochen","score":0,"notes":""},{"id":18,"title":"Angel Beats!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":19,"title":"Ano Natsu de Matteru","format":"TV","eps":12,"watched":5,"status":"Pausiert","score":0,"notes":""},{"id":20,"title":"Another","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":21,"title":"Ansatsu Kyoushitsu","format":"TV","eps":22,"watched":22,"status":"Abgeschlossen","score":8,"notes":""},{"id":22,"title":"Ansatsu Kyoushitsu 2nd Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":""},{"id":23,"title":"Ao Haru Ride","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":24,"title":"Ao no Exorcist: Kyoto Fujouou-hen","format":"TV","eps":12,"watched":2,"status":"Geplant","score":0,"notes":""},{"id":25,"title":"Appleseed (Movie)","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":7,"notes":""},{"id":26,"title":"Arifureta Shokugyou de Sekai Saikyou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":27,"title":"Arknights: Prelude to Dawn","format":"TV","eps":8,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":28,"title":"Asobi ni Iku yo!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":29,"title":"Aura: Maryuuin Kouga Saigo no Tatakai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":30,"title":"B-gata H-kei","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":31,"title":"B: The Beginning","format":"ONA","eps":12,"watched":12,"status":"Abgeschlossen","score":5,"notes":""},{"id":32,"title":"Banana Fish","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":33,"title":"Beelzebub-jou no Okinimesu mama.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":34,"title":"Black Bullet","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":35,"title":"Black Clover","format":"TV","eps":170,"watched":7,"status":"Abgebrochen","score":0,"notes":""},{"id":36,"title":"Black Lagoon","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":37,"title":"Blade Runner: Black Out 2022","format":"ONA","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":""},{"id":38,"title":"Blend S","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":39,"title":"Blue Period","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":40,"title":"Boku no Hero Academia","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":41,"title":"Boku no Hero Academia 2nd Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":""},{"id":42,"title":"Boku no Hero Academia 3rd Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":8,"notes":""},{"id":43,"title":"Boku no Hero Academia 4th Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":0,"notes":""},{"id":44,"title":"Boku no Hero Academia 5th Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":8,"notes":""},{"id":45,"title":"Boku no Hero Academia 6th Season","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":0,"notes":""},{"id":46,"title":"Boku no Hero Academia the Movie 1: Futari no Hero","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":47,"title":"Boku no Hero Academia the Movie 1: Futari no Hero Specials","format":"Special","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":48,"title":"Boku no Hero Academia the Movie 3: World Heroes' Mission","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":49,"title":"Boku no Hero Academia: Ikinokore! Kesshi no Survival Kunren","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":50,"title":"Boku no Kokoro no Yabai Yatsu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":51,"title":"Bokutachi wa Benkyou ga Dekinai","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":52,"title":"Bokutachi wa Benkyou ga Dekinai!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":53,"title":"Busu ni Hanataba wo.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":54,"title":"Chainsaw Man","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":55,"title":"Charlotte","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":56,"title":"Chi. Chikyuu no Undou ni Tsuite","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":57,"title":"Chiyu Mahou no Machigatta Tsukaikata","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":58,"title":"Chou Kaguya-hime!","format":"ONA","eps":1,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":59,"title":"Choujin Koukousei-tachi wa Isekai demo Yoyuu de Ikinuku you desu!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":60,"title":"Chuunibyou demo Koi ga Shitai!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":61,"title":"Cinderella Girls Gekijou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":62,"title":"Cinderella Girls Gekijou 2nd Season","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":63,"title":"Citrus","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":""},{"id":64,"title":"Clannad","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":65,"title":"Clannad: After Story","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":66,"title":"Claymore","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":67,"title":"Code Geass: Hangyaku no Lelouch","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":9,"notes":""},{"id":68,"title":"Code Geass: Hangyaku no Lelouch R2","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":69,"title":"Comic Girls","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":70,"title":"Cowboy Bebop","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":71,"title":"Cyberpunk: Edgerunners","format":"ONA","eps":10,"watched":10,"status":"Abgeschlossen","score":0,"notes":""},{"id":72,"title":"Cyberpunk: Edgerunners 2","format":"ONA","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":73,"title":"Dandadan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":74,"title":"Dandadan 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":75,"title":"Danna ga Nani wo Itteiru ka Wakaranai Ken","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":76,"title":"Danna ga Nani wo Itteiru ka Wakaranai Ken 2 Sure-me","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":77,"title":"Darling in the FranXX","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":9,"notes":""},{"id":78,"title":"Darwin's Game","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":79,"title":"Date A Live","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":80,"title":"Date A Live II","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":81,"title":"Date A Live III","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":82,"title":"Date A Live IV","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":83,"title":"Death Note","format":"TV","eps":37,"watched":11,"status":"Abgebrochen","score":0,"notes":""},{"id":84,"title":"Death Parade","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":85,"title":"Demi-chan wa Kataritai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":86,"title":"Denki-gai no Honya-san","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":87,"title":"Devils Line","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":4,"notes":""},{"id":88,"title":"Devils Line: Anytime Anywhere","format":"OVA","eps":1,"watched":1,"status":"Abgeschlossen","score":4,"notes":""},{"id":89,"title":"Dokyuu Hentai HxEros","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":90,"title":"Dorohedoro","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":91,"title":"Dosanko Gal wa Namara Menkoi","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":92,"title":"Dr. Stone: Stone Wars","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":93,"title":"Dumbbell Nan Kilo Moteru?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":94,"title":"Dungeon Meshi","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":95,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":96,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka II","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":97,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka III","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":98,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka III OVA","format":"OVA","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":99,"title":"Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka IV: Shin Shou - Meikyuu-hen","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":100,"title":"Durarara!!","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":101,"title":"Edens Zero","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":102,"title":"Edomae Elf","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":103,"title":"Egao no Taenai Shokuba desu.","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":104,"title":"Eiga Daisuki Pompo-san","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":105,"title":"Elf-san wa Yaserarenai.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":106,"title":"Elf-san wa Yaserarenai.: Hami Niku no Shima/Calorie Lovers","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":107,"title":"Elfen Lied","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":108,"title":"Enen no Shouboutai","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":0,"notes":""},{"id":109,"title":"Enen no Shouboutai: Ni no Shou","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":0,"notes":""},{"id":110,"title":"Enen no Shouboutai: San no Shou","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":111,"title":"Enen no Shouboutai: San no Shou Part 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":112,"title":"Ergo Proxy","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":113,"title":"Eromanga-sensei","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":""},{"id":114,"title":"Escha Chron","format":"ONA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":115,"title":"Evangelion Movie 2: Ha","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":116,"title":"Ex-Arm","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":117,"title":"Fairy Tail","format":"TV","eps":175,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":118,"title":"Frame Arms Girl","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":119,"title":"Fruits Basket 1st Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":120,"title":"Fruits Basket 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":121,"title":"Fruits Basket: The Final","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":122,"title":"Fugou Keiji: Balance:Unlimited","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":123,"title":"Fullmetal Alchemist","format":"TV","eps":51,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":124,"title":"Fullmetal Alchemist: Brotherhood","format":"TV","eps":64,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":125,"title":"Fumetsu no Anata e","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":126,"title":"Fuufu Ijou, Koibito Miman.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":127,"title":"Ga-Rei: Zero","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":128,"title":"Gabriel DropOut","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":129,"title":"Gal to Kyouryuu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":130,"title":"Gamers!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":131,"title":"Gangsta.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":132,"title":"Gate: Jieitai Kanochi nite, Kaku Tatakaeri","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":133,"title":"Gate: Jieitai Kanochi nite, Kaku Tatakaeri Part 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":134,"title":"Getsuyoubi no Tawawa","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":135,"title":"Ginga Eiyuu Densetsu","format":"OVA","eps":110,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":136,"title":"Ginga Eiyuu Densetsu: Die Neue These - Kaikou","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":137,"title":"Ginga Tetsudou 999","format":"TV","eps":113,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":138,"title":"Giniro no Kami no Agito","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":139,"title":"Goblin Slayer","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":140,"title":"Goblin Slayer II","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":141,"title":"Goblin Slayer: Goblin's Crown","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":142,"title":"Godzilla: S.P","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":143,"title":"Golden Kamuy","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":144,"title":"Golden Kamuy 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":145,"title":"Golden Kamuy 3rd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":146,"title":"Golden Kamuy 4th Season","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":147,"title":"Golden Time","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":148,"title":"Golden Time (Movie)","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":149,"title":"Grand Blue","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":150,"title":"Hai to Gensou no Grimgar","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":151,"title":"Haikyuu!!","format":"TV","eps":25,"watched":5,"status":"Abgebrochen","score":0,"notes":""},{"id":152,"title":"Haikyuu!! Karasuno Koukou vs. Shiratorizawa Gakuen Koukou","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":153,"title":"Haikyuu!! Riku vs. Kuu","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":154,"title":"Haikyuu!! Second Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":155,"title":"Haikyuu!! To the Top","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":156,"title":"Haikyuu!! To the Top Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":157,"title":"Haite Kudasai, Takamine-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":158,"title":"Hakata Tonkotsu Ramens","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":159,"title":"Hataraku Maou-sama!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":160,"title":"Hataraku Maou-sama!! 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":161,"title":"Hataraku Saibou","format":"TV","eps":13,"watched":3,"status":"Pausiert","score":0,"notes":""},{"id":162,"title":"Hataraku Saibou Black","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":163,"title":"Heion Sedai no Idaten-tachi","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":164,"title":"Hibike! Euphonium Movie 2: Todoketai Melody","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":165,"title":"Hige wo Soru. Soshite Joshikousei wo Hirou.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":166,"title":"High School DxD","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":167,"title":"Himouto! Umaru-chan","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":168,"title":"Himouto! Umaru-chan R","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":169,"title":"Hinamatsuri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":170,"title":"Honobono Log","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":171,"title":"Horimiya","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":172,"title":"Horimiya: Piece","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":173,"title":"Hoshiai no Sora","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":174,"title":"Hunter x Hunter (2011)","format":"TV","eps":148,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":175,"title":"Hyouka","format":"TV","eps":22,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":176,"title":"Ijiranaide, Nagatoro-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":177,"title":"Ikebukuro West Gate Park","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":178,"title":"Ikoku Nikki","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":179,"title":"Imouto sae Ireba Ii.","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":180,"title":"Inuyashiki","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":7,"notes":""},{"id":181,"title":"Isekai Harem Monogatari","format":"OVA","eps":4,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":182,"title":"Isekai Maou to Shoukan Shoujo no Dorei Majutsu","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":183,"title":"Isekai Maou to Shoukan Shoujo no Dorei Majutsu \u03a9","format":"TV","eps":10,"watched":3,"status":"Abgebrochen","score":0,"notes":""},{"id":184,"title":"Isekai Nonbiri Nouka","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":185,"title":"Ishuzoku Reviewers","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":186,"title":"Itai no wa Iya nanode Bougyoryoku ni Kyokufuri Shitai to Omoimasu.","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":187,"title":"Iya na Kao sare nagara Opantsu Misete Moraitai","format":"ONA","eps":6,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":188,"title":"Jaku-Chara Tomozaki-kun","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":189,"title":"Jibaku Shounen Hanako-kun","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":190,"title":"Jigokuraku","format":"TV","eps":13,"watched":7,"status":"Abgebrochen","score":0,"notes":""},{"id":191,"title":"JoJo no Kimyou na Bouken (TV)","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":192,"title":"JoJo no Kimyou na Bouken Part 3: Stardust Crusaders","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":193,"title":"JoJo no Kimyou na Bouken Part 3: Stardust Crusaders - Egypt-hen","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":194,"title":"JoJo no Kimyou na Bouken Part 4: Diamond wa Kudakenai","format":"TV","eps":39,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":195,"title":"JoJo no Kimyou na Bouken Part 5: Ougon no Kaze","format":"TV","eps":39,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":196,"title":"Jormungand","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":197,"title":"Jormungand: Perfect Order","format":"TV","eps":12,"watched":4,"status":"Pausiert","score":0,"notes":""},{"id":198,"title":"Josee to Tora to Sakana-tachi","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":199,"title":"Joshiochi! 2-kai kara Onnanoko ga... Futtekita!?","format":"ONA","eps":9,"watched":1,"status":"Abgebrochen","score":0,"notes":""},{"id":200,"title":"Joshiraku","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":201,"title":"Jouran: The Princess of Snow and Blood","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":202,"title":"Jujutsu Kaisen","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":""},{"id":203,"title":"Jujutsu Kaisen 2nd Season","format":"TV","eps":23,"watched":23,"status":"Abgeschlossen","score":9,"notes":""},{"id":204,"title":"Just Because!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":205,"title":"Juuni Taisen","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":""},{"id":206,"title":"Kage no Jitsuryokusha ni Naritakute!","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":207,"title":"Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":208,"title":"Kaguya-sama wa Kokurasetai? Tensai-tachi no Renai Zunousen","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":209,"title":"Kaichou wa Maid-sama!","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":210,"title":"Kaifuku Jutsushi no Yarinaoshi","format":"TV","eps":12,"watched":6,"status":"Abgebrochen","score":0,"notes":""},{"id":211,"title":"Kamisama ni Natta Hi","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":212,"title":"Kanojo, Okarishimasu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":213,"title":"Kaoru Hana wa Rin to Saku","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":214,"title":"Karakai Jouzu no Takagi-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":215,"title":"Karakai Jouzu no Takagi-san 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":216,"title":"Karasu wa Aruji wo Erabanai","format":"TV","eps":20,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":217,"title":"Kawaikereba Hentai demo Suki ni Natte Kuremasu ka?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":218,"title":"Keikenzumi na Kimi to, Keiken Zero na Ore ga, Otsukiai suru Hanashi.","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":219,"title":"Kekkon Yubiwa Monogatari","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":220,"title":"Kenja no Mago","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":221,"title":"Keppeki Danshi! Aoyama-kun","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":4,"notes":""},{"id":222,"title":"Kidou Senshi Gundam","format":"TV","eps":43,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":223,"title":"Kidou Senshi Gundam Thunderbolt","format":"ONA","eps":4,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":224,"title":"Kidou Senshi Gundam: Suisei no Majo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":225,"title":"Kill la Kill","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":226,"title":"Kimetsu no Yaiba Movie: Mugen Ressha-hen","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":227,"title":"Kimi ni Todoke","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":228,"title":"Kimi ni Todoke 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":229,"title":"Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":230,"title":"Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo 2nd Season","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":231,"title":"Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo 3rd Season","format":"TV","eps":0,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":232,"title":"Kimi no Na wa.","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":233,"title":"Kimi no Suizou wo Tabetai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":234,"title":"Kimi to, Nami ni Noretara","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":235,"title":"Kin no Kuni Mizu no Kuni","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":236,"title":"Kingdom 3rd Season","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":237,"title":"Kino no Tabi: The Beautiful World","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":238,"title":"Kiseijuu: Sei no Kakuritsu","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":239,"title":"Kishuku Gakkou no Juliet","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":240,"title":"Kobayashi-san Chi no Maid Dragon","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":241,"title":"Kobayashi-san Chi no Maid Dragon S","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":242,"title":"Kobayashi-san Chi no Maid Dragon: Valentine, Soshite Onsen! - Amari Kitai Shinaide Kudasai","format":"Special","eps":1,"watched":1,"status":"Abgeschlossen","score":8,"notes":""},{"id":243,"title":"Kobayashi-san Chi no OO Dragon","format":"Special","eps":7,"watched":7,"status":"Abgeschlossen","score":6,"notes":""},{"id":244,"title":"Koe no Katachi","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":245,"title":"Koi to Uso","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":246,"title":"Koi to Yobu ni wa Kimochi Warui","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":247,"title":"Koi wa Sekai Seifuku no Ato de","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":248,"title":"Kono Bijutsu-bu ni wa Mondai ga Aru!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":249,"title":"Kono Kaisha ni Suki na Hito ga Imasu","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":250,"title":"Kono Subarashii Sekai ni Shukufuku wo!","format":"TV","eps":10,"watched":1,"status":"Pausiert","score":0,"notes":""},{"id":251,"title":"Kono Subarashii Sekai ni Shukufuku wo! 2","format":"TV","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":252,"title":"Konohana Kitan","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":253,"title":"Kotonoha no Niwa","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":254,"title":"Koukaku Kidoutai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":255,"title":"Koukaku Kidoutai: Stand Alone Complex - Solid State Society 3D","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":256,"title":"Koukaku Kidoutai: Stand Alone Complex 2nd GIG","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":257,"title":"Koutetsujou no Kabaneri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":258,"title":"Kujira no Kora wa Sajou ni Utau","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":259,"title":"Kuroko no Basket","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":6,"notes":""},{"id":260,"title":"Kuroko no Basket 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":261,"title":"Kuroko no Basket 3rd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":262,"title":"Kuroko no Basket Movie 4: Last Game","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":263,"title":"Kusuriya no Hitorigoto 2nd Season","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":264,"title":"Kuzu no Honkai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":265,"title":"Kyokou Suiri","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":266,"title":"Kyoukai no Kanata","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":267,"title":"Kyoukai no Kanata Movie 1: I'll Be Here - Kako-hen","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":268,"title":"Kyoukai no Kanata Movie 2: I'll Be Here - Mirai-hen","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":269,"title":"Kyoukai no Kanata: Shinonome","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":270,"title":"Leadale no Daichi nite","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":271,"title":"Little Busters!","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":272,"title":"Little Witch Academia","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":273,"title":"Log Horizon","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":274,"title":"Log Horizon 2nd Season","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":275,"title":"Log Horizon: Entaku Houkai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":276,"title":"Lupin the IIIrd: Chikemuri no Ishikawa Goemon","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":277,"title":"Lupin the IIIrd: Jigen Daisuke no Bohyou","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":278,"title":"Lycoris Recoil: Friends Are Thieves of Time.","format":"ONA","eps":6,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":279,"title":"Macross","format":"TV","eps":36,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":280,"title":"Macross F","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":281,"title":"Made in Abyss","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":282,"title":"Made in Abyss Movie 1: Tabidachi no Yoake","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":283,"title":"Made in Abyss Movie 2: Hourou Suru Tasogare","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":284,"title":"Made in Abyss Movie 3: Fukaki Tamashii no Reimei","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":285,"title":"Made in Abyss: Retsujitsu no Ougonkyou","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":286,"title":"Magia Record: Mahou Shoujo Madoka\u2606Magica Gaiden","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":287,"title":"Mahou Shoujo Madoka\u2605Magica","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":288,"title":"Mahou Shoujo ni Akogarete","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":289,"title":"Mahou Shoujo Site","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":290,"title":"Mahouka Koukou no Rettousei","format":"TV","eps":26,"watched":26,"status":"Abgeschlossen","score":4,"notes":""},{"id":291,"title":"Mahoutsukai no Yome","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":292,"title":"Mahoutsukai no Yome Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":293,"title":"Mairimashita! Iruma-kun","format":"TV","eps":23,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":294,"title":"Majo no Tabitabi","format":"TV","eps":12,"watched":2,"status":"Pausiert","score":0,"notes":""},{"id":295,"title":"Manaria Friends","format":"TV","eps":10,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":296,"title":"Maou Gakuin no Futekigousha: Shijou Saikyou no Maou no Shiso, Tensei shite Shison-tachi no Gakkou e Kayou","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":297,"title":"Maou no Ore ga Dorei Elf wo Yome ni Shitanda ga, Dou Medereba Ii?","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":298,"title":"Maoujou de Oyasumi","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":299,"title":"Mars Red","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":300,"title":"Marulk-chan no Nichijou","format":"Movie","eps":4,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":301,"title":"Masou Gakuen HxH","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":302,"title":"Mato Seihei no Slave","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":303,"title":"Mato Seihei no Slave 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":304,"title":"Megalo Box","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":305,"title":"Metropolis","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":306,"title":"Mirai Nikki (TV)","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":307,"title":"Mo Dao Zu Shi","format":"ONA","eps":15,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":308,"title":"Mob Psycho 100","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":309,"title":"Mob Psycho 100 II","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":10,"notes":""},{"id":310,"title":"Mob Psycho 100 III","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":""},{"id":311,"title":"Momokuri","format":"ONA","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":312,"title":"Mononoke Hime","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":313,"title":"Munou na Nana","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":314,"title":"Musekinin Kanchou Tylor","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":315,"title":"Mushoku Tensei II: Isekai Ittara Honki Dasu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":316,"title":"Mushoku Tensei: Isekai Ittara Honki Dasu","format":"TV","eps":11,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":317,"title":"Nagi no Asu kara","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":318,"title":"Nana","format":"TV","eps":47,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":319,"title":"Nanatsu no Taizai","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":""},{"id":320,"title":"Nanatsu no Taizai: Imashime no Fukkatsu","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":7,"notes":""},{"id":321,"title":"Nanatsu no Taizai: Kamigami no Gekirin","format":"TV","eps":24,"watched":6,"status":"Abgebrochen","score":4,"notes":""},{"id":322,"title":"NEET Kunoichi to Nazeka Dousei Hajimemashita","format":"TV","eps":24,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":323,"title":"Nekopara","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":324,"title":"Net-juu no Susume","format":"TV","eps":10,"watched":10,"status":"Abgeschlossen","score":8,"notes":""},{"id":325,"title":"Net-juu no Susume Special","format":"Special","eps":1,"watched":1,"status":"Abgeschlossen","score":7,"notes":""},{"id":326,"title":"Netoge no Yome wa Onnanoko ja Nai to Omotta?","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":327,"title":"New Game!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":328,"title":"New Game!!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":329,"title":"NHK ni Youkoso!","format":"TV","eps":24,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":330,"title":"Nichijou","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":331,"title":"Nihon Chinbotsu 2020","format":"ONA","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":332,"title":"Nihon e Youkoso Elf-san.","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":333,"title":"Ninja to Koroshiya no Futarigurashi","format":"TV","eps":12,"watched":5,"status":"Am Schauen","score":0,"notes":""},{"id":334,"title":"No Game No Life","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":335,"title":"No Game No Life: Zero","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":336,"title":"No Guns Life","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":337,"title":"No Guns Life 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":338,"title":"Nomad: Megalo Box 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":339,"title":"Noragami","format":"TV","eps":12,"watched":4,"status":"Abgebrochen","score":0,"notes":""},{"id":340,"title":"Ochikobore Fruit Tart","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":341,"title":"Odd Taxi","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":342,"title":"Okinawa de Suki ni Natta Ko ga Hougen Sugite Tsurasugiru","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":343,"title":"Omiai Aite wa Oshiego, Tsuyoki na, Mondaiji.","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":344,"title":"One Punch Man","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":345,"title":"One Punch Man 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":346,"title":"One Punch Man 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":347,"title":"Orange","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":348,"title":"Orange: Mirai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":349,"title":"Ore dake Level Up na Ken","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":350,"title":"Ore dake Level Up na Ken Season 2: Arise from the Shadow","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":351,"title":"Ore Monogatari!!","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":8,"notes":""},{"id":352,"title":"Ore wo Suki nano wa Omae dake ka yo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":353,"title":"Osake wa Fuufu ni Natte kara","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":5,"notes":""},{"id":354,"title":"Oshiete! Galko-chan","format":"TV","eps":12,"watched":1,"status":"Pausiert","score":0,"notes":""},{"id":355,"title":"Otome Game Sekai wa Mob ni Kibishii Sekai desu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":356,"title":"Ousama Ranking","format":"TV","eps":23,"watched":11,"status":"Abgebrochen","score":0,"notes":""},{"id":357,"title":"Overlord","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":8,"notes":""},{"id":358,"title":"Overlord II","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":359,"title":"Overlord III","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":7,"notes":""},{"id":360,"title":"Overlord IV","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":361,"title":"Ping Pong the Animation","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":362,"title":"Planetes","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":363,"title":"Plastic Memories","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":364,"title":"Plunderer","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":365,"title":"Pluto","format":"ONA","eps":8,"watched":3,"status":"Am Schauen","score":0,"notes":""},{"id":366,"title":"Poputepipikku","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":367,"title":"Princess Connect! Re:Dive","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":368,"title":"Princess Principal","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":369,"title":"Psycho-Pass","format":"TV","eps":22,"watched":1,"status":"Geplant","score":0,"notes":""},{"id":370,"title":"Psycho-Pass 3","format":"TV","eps":8,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":371,"title":"Psycho-Pass 3: First Inspector","format":"ONA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":372,"title":"Raise wa Tanin ga Ii","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":373,"title":"Rakudai Kishi no Cavalry","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":374,"title":"Re:Zero kara Hajimeru Isekai Seikatsu","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":375,"title":"Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season Part 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":376,"title":"ReLIFE","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":377,"title":"Rikei ga Koi ni Ochita no de Shoumei shitemita.","format":"TV","eps":12,"watched":3,"status":"Pausiert","score":0,"notes":""},{"id":378,"title":"Rock wa Lady no Tashinami deshite","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":379,"title":"S-Rank Monster no \"Behemoth\" dakedo, Neko to Machigawarete Elf Musume no Pet toshite Kurashitemasu","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":380,"title":"Saenai Heroine no Sodatekata","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":381,"title":"Saenai Heroine no Sodatekata \u266d","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":382,"title":"Saenai Heroine no Sodatekata \u266d: Koi to Junjou no Service-kai","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":383,"title":"Saenai Heroine no Sodatekata: Ai to Seishun no Service-kai","format":"TV Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":384,"title":"Saijaku Muhai no Bahamut","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":385,"title":"Sakamoto Days","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":386,"title":"Sakamoto desu ga?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":387,"title":"Sakura Trick","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":388,"title":"Sakura-sou no Pet na Kanojo","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":389,"title":"Salaryman ga Isekai ni Ittara Shitennou ni Natta Hanashi","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":390,"title":"Sayonara no Asa ni Yakusoku no Hana wo Kazarou","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":391,"title":"Seihantai na Kimi to Boku","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":9,"notes":""},{"id":392,"title":"Seirei no Moribito","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":393,"title":"Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":394,"title":"Seishun Buta Yarou wa Yumemiru Shoujo no Yume wo Minai","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":395,"title":"Sen to Chihiro no Kamikakushi","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":396,"title":"Senpai ga Uzai Kouhai no Hanashi","format":"TV","eps":12,"watched":3,"status":"Abgebrochen","score":0,"notes":""},{"id":397,"title":"Senryuu Shoujo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":398,"title":"Sentouin, Haken shimasu!","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":399,"title":"Seraphim Call","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":400,"title":"Sewayaki Kitsune no Senko-san","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":6,"notes":""},{"id":401,"title":"Shaman King (2021)","format":"TV","eps":52,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":402,"title":"Shelter (Music)","format":"Music","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":""},{"id":403,"title":"Shigatsu wa Kimi no Uso","format":"TV","eps":22,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":404,"title":"Shimoneta to Iu Gainen ga Sonzai Shinai Taikutsu na Sekai","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":405,"title":"Shin Evangelion Movie:||","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":406,"title":"Shin Kidou Senki Gundam Wing: Endless Waltz","format":"OVA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":407,"title":"Shingeki no Bahamut: Genesis","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":408,"title":"Shingeki no Bahamut: Virgin Soul","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":409,"title":"Shingeki no Kyojin","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":410,"title":"Shingeki no Kyojin Season 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":411,"title":"Shingeki no Kyojin Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":412,"title":"Shingeki no Kyojin: Kuinaki Sentaku","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":413,"title":"Shingeki no Kyojin: The Final Season","format":"TV","eps":16,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":414,"title":"Shinigami Bocchan to Kuro Maid","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":415,"title":"Shinmai Maou no Testament","format":"TV","eps":12,"watched":4,"status":"Abgebrochen","score":0,"notes":""},{"id":416,"title":"Shinseiki Evangelion","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":417,"title":"Shinsekai yori","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":418,"title":"Shoujo Shuumatsu Ryokou","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":10,"notes":""},{"id":419,"title":"Shoukoku no Altair","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":420,"title":"SK\u221e","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":421,"title":"Slime Taoshite 300-nen, Shiranai Uchi ni Level Max ni Nattemashita","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":422,"title":"Slow Start","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":423,"title":"Somali to Mori no Kamisama","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":424,"title":"Sono Bisque Doll wa Koi wo Suru","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":425,"title":"Sora no Aosa wo Shiru Hito yo","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":426,"title":"Soredemo Ayumu wa Yosetekuru","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":427,"title":"Sousei no Onmyouji","format":"TV","eps":50,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":428,"title":"Spy Kyoushitsu","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":429,"title":"Steins;Gate","format":"TV","eps":24,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":430,"title":"Steins;Gate Movie: Fuka Ryouiki no D\u00e9j\u00e0 vu","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":431,"title":"Suisei no Gargantia","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":432,"title":"Suki tte Ii na yo.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":433,"title":"Suki tte Ii na yo.: Mei and Marshmallow","format":"Special","eps":10,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":434,"title":"Sunohara-sou no Kanrinin-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":435,"title":"Super Cub","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":436,"title":"Sword Art Online","format":"TV","eps":25,"watched":25,"status":"Abgeschlossen","score":4,"notes":""},{"id":437,"title":"Sword Art Online Alternative: Gun Gale Online","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":438,"title":"Sword Art Online II","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":5,"notes":""},{"id":439,"title":"Sword Art Online: Alicization - War of Underworld 2nd Season","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":440,"title":"Sword Art Online: Alicization - War of Underworld Recap","format":"TV Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":441,"title":"Takopii no Genzai","format":"ONA","eps":6,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":442,"title":"Tamako Love Story","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":443,"title":"Tamako Market","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":444,"title":"Tate no Yuusha no Nariagari","format":"TV","eps":25,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":445,"title":"Tengoku Daimakyou","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":446,"title":"Tenkuu no Shiro Laputa","format":"Movie","eps":1,"watched":1,"status":"Abgeschlossen","score":9,"notes":""},{"id":447,"title":"Tensei Oujo to Tensai Reijou no Mahou Kakumei","format":"TV","eps":12,"watched":11,"status":"Am Schauen","score":7,"notes":""},{"id":448,"title":"Tensei shitara Ken deshita","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":449,"title":"Tensei shitara Slime Datta Ken","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":7,"notes":""},{"id":450,"title":"Tensei shitara Slime Datta Ken 2nd Season","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":451,"title":"Tensei shitara Slime Datta Ken 2nd Season Part 2","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":452,"title":"Tensura Nikki: Tensei shitara Slime Datta Ken","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":453,"title":"The God of High School","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":454,"title":"Tokyo Ghoul","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":455,"title":"Tokyo Ghoul \u221aA","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":2,"notes":""},{"id":456,"title":"Tokyo Ghoul:re","format":"TV","eps":12,"watched":2,"status":"Abgebrochen","score":0,"notes":""},{"id":457,"title":"Tokyo Ghoul:re 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":458,"title":"Tokyo Godfathers","format":"Movie","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":459,"title":"Tonari no Kaibutsu-kun","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":460,"title":"Tongari Boushi no Atelier","format":"TV","eps":0,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":461,"title":"Tonikaku Kawaii","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":462,"title":"Tonikaku Kawaii 2nd Season","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":463,"title":"Tonikaku Kawaii: Joshikou-hen","format":"ONA","eps":4,"watched":4,"status":"Abgeschlossen","score":0,"notes":""},{"id":464,"title":"Tonikaku Kawaii: Kaisou","format":"TV Special","eps":1,"watched":1,"status":"Abgeschlossen","score":0,"notes":""},{"id":465,"title":"Toradora!","format":"TV","eps":25,"watched":1,"status":"Pausiert","score":0,"notes":""},{"id":466,"title":"Touhai Densetsu Akagi: Yami ni Maiorita Tensai","format":"TV","eps":26,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":467,"title":"Toumei Otoko to Ningen Onna: Sonouchi Fuufu ni Naru Futari","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":8,"notes":""},{"id":468,"title":"Tsurezure Children","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":7,"notes":""},{"id":469,"title":"Tsuujou Kougeki ga Zentai Kougeki de Ni-kai Kougeki no Okaasan wa Suki desu ka?","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":470,"title":"Tu Bian Yingxiong Leaf","format":"ONA","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":471,"title":"UQ Holder! Mahou Sensei Negima! 2","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":472,"title":"Urasekai Picnic","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":473,"title":"Urusei Yatsura (2022) 2nd Season","format":"TV","eps":23,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":474,"title":"Uzaki-chan wa Asobitai!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":475,"title":"Uzaki-chan wa Asobitai! Double","format":"TV","eps":13,"watched":3,"status":"Abgebrochen","score":4,"notes":""},{"id":476,"title":"Vanitas no Karte","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":477,"title":"Vatican Kiseki Chousakan","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":478,"title":"Vinland Saga","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":10,"notes":""},{"id":479,"title":"Vinland Saga Season 2","format":"TV","eps":24,"watched":24,"status":"Abgeschlossen","score":10,"notes":""},{"id":480,"title":"Violet Evergarden","format":"TV","eps":13,"watched":13,"status":"Abgeschlossen","score":9,"notes":""},{"id":481,"title":"Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou","format":"Movie","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":482,"title":"Violet Evergarden Movie","format":"Movie","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":483,"title":"Violet Evergarden: Kitto \"Ai\" wo Shiru Hi ga Kuru no Darou","format":"Special","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":484,"title":"Violet Evergarden: Recollections","format":"Special","eps":1,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":485,"title":"VTuber Nandaga Haishin Kiri Wasuretara Densetsu ni Natteta","format":"TV","eps":12,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":486,"title":"Watashi ga Koibito ni Nareru Wake Nai jan, Muri Muri! (\u203bMuri ja Nakatta!?)","format":"TV","eps":12,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":487,"title":"Watashi ga Motenai no wa Dou Kangaetemo Omaera ga Warui!","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":1,"notes":""},{"id":488,"title":"Watashi ga Motete Dousunda","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":489,"title":"Watashi ni Tenshi ga Maiorita! Special","format":"Special","eps":1,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":490,"title":"Watashi no Oshi wa Akuyaku Reijou.","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":8,"notes":""},{"id":491,"title":"Watashi wo Tabetai, Hitodenashi","format":"TV","eps":13,"watched":0,"status":"Am Schauen","score":0,"notes":""},{"id":492,"title":"Witch Watch","format":"TV","eps":25,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":493,"title":"Wonder Egg Priority","format":"TV","eps":12,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":494,"title":"Working!!","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":495,"title":"World Trigger 2nd Season","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":496,"title":"Wotaku ni Koi wa Muzukashii","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":8,"notes":""},{"id":497,"title":"Wotaku ni Koi wa Muzukashii OVA","format":"OVA","eps":3,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":498,"title":"Xian Wang de Richang Shenghuo","format":"ONA","eps":15,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":499,"title":"Yagate Kimi ni Naru","format":"TV","eps":13,"watched":0,"status":"Pausiert","score":0,"notes":""},{"id":500,"title":"Yahari Ore no Seishun Love Comedy wa Machigatteiru.","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":501,"title":"Yaku nara Mug Cup mo","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":502,"title":"Yakusoku no Neverland","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":503,"title":"Yakusoku no Neverland 2nd Season","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":504,"title":"Yokohama Kaidashi Kikou: Quiet Country Cafe","format":"OVA","eps":2,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":505,"title":"Youjo Senki","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":506,"title":"Yubisaki to Renren","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":9,"notes":""},{"id":507,"title":"Yuragi-sou no Yuuna-san","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":508,"title":"Yuri!!! on Ice","format":"TV","eps":12,"watched":12,"status":"Abgeschlossen","score":6,"notes":""},{"id":509,"title":"Yuru Camp\u25b3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":510,"title":"Yuru Camp\u25b3 Season 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":511,"title":"Yuru Camp\u25b3 Season 3","format":"TV","eps":12,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":512,"title":"Yuukoku no Moriarty","format":"TV","eps":11,"watched":11,"status":"Abgeschlossen","score":8,"notes":""},{"id":513,"title":"Yuukoku no Moriarty Part 2","format":"TV","eps":13,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":514,"title":"Zankyou no Terror","format":"TV","eps":11,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":515,"title":"Zenonzard The Animation","format":"ONA","eps":9,"watched":0,"status":"Geplant","score":0,"notes":""},{"id":516,"title":"Zom 100: Zombie ni Naru made ni Shitai 100 no Koto","format":"TV","eps":12,"watched":1,"status":"Abgebrochen","score":0,"notes":""}];
const INIT_MANGA = [{"id":1,"title":"#Gal to Gal no Yuri","type":"Manga","chapters":0,"read":1,"readVols":0,"volumes":0,"status":"Abgeschlossen","score":8,"notes":""},{"id":2,"title":"20th Century Boys","type":"Manga","chapters":249,"read":0,"readVols":0,"volumes":22,"status":"Geplant","score":0,"notes":""},{"id":3,"title":"2DK, G Pen, Mezamashidokei.","type":"Manga","chapters":45,"read":45,"readVols":0,"volumes":8,"status":"Abgeschlossen","score":7,"notes":""},{"id":4,"title":"3-gatsu no Lion","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":5,"title":"A Pervert's Daily Life","type":"Manga","chapters":145,"read":2,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":""},{"id":6,"title":"Accel World/Dural: Magisa Garden","type":"Manga","chapters":62,"read":14,"readVols":0,"volumes":8,"status":"Abgebrochen","score":0,"notes":""},{"id":7,"title":"Akatsuki no Yona","type":"Manga","chapters":292,"read":0,"readVols":0,"volumes":48,"status":"Geplant","score":0,"notes":""},{"id":8,"title":"Akira","type":"Manga","chapters":120,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":""},{"id":9,"title":"Aku no Higan","type":"Manga","chapters":37,"read":37,"readVols":0,"volumes":4,"status":"Abgeschlossen","score":7,"notes":""},{"id":10,"title":"Aldnoah.Zero","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":4,"status":"Abgebrochen","score":0,"notes":""},{"id":11,"title":"Aldnoah.Zero 2nd Season","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":5,"status":"Abgebrochen","score":0,"notes":""},{"id":12,"title":"Aldnoah.Zero Gaiden: Twin Gemini","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":4,"status":"Abgebrochen","score":8,"notes":""},{"id":13,"title":"All You Need Is Kill","type":"Manga","chapters":4,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":14,"title":"All You Need Is Kill","type":"Manga","chapters":17,"read":17,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":8,"notes":""},{"id":15,"title":"Amayo no Tsuki","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":16,"title":"Animeta!","type":"Manga","chapters":28,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":17,"title":"Aria","type":"Manga","chapters":67,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":18,"title":"Ase to Sekken","type":"Manga","chapters":104,"read":0,"readVols":0,"volumes":11,"status":"Pausiert","score":0,"notes":""},{"id":19,"title":"Ashita, Kimi ni Aetara","type":"Manga","chapters":10,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":20,"title":"Ashita, Naisho no Kiss Shiyou","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":21,"title":"Asoko de Hataraku Musubu-san","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":22,"title":"Asumi-chan wa Lesbian Fuuzoku ni Kyoumi ga Arimasu!","type":"Manga","chapters":0,"read":17,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":23,"title":"Bakuman.","type":"Manga","chapters":176,"read":0,"readVols":0,"volumes":20,"status":"Geplant","score":0,"notes":""},{"id":24,"title":"Banana Fish","type":"Manga","chapters":110,"read":0,"readVols":0,"volumes":19,"status":"Geplant","score":0,"notes":""},{"id":25,"title":"Beelzebub-jou no Okinimesu mama.","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":26,"title":"Berserk","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":27,"title":"Bijin Onna Joushi Takizawa-san","type":"Manga","chapters":0,"read":170,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":28,"title":"Black Torch","type":"Manga","chapters":19,"read":19,"readVols":0,"volumes":5,"status":"Abgeschlossen","score":0,"notes":""},{"id":29,"title":"Blame!","type":"Manga","chapters":66,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":30,"title":"Blue Period","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":31,"title":"Boku no Hero Academia","type":"Manga","chapters":432,"read":200,"readVols":0,"volumes":42,"status":"Abgebrochen","score":8,"notes":""},{"id":32,"title":"Boku no Hero Academia: Yuuei Hakusho","type":"Manga","chapters":41,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":""},{"id":33,"title":"Boku no Kokoro no Yabai Yatsu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":34,"title":"Bokutachi no Remake","type":"Manga","chapters":35,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":35,"title":"Bokutachi wa Benkyou ga Dekinai","type":"Manga","chapters":187,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":""},{"id":36,"title":"Candy & Cigarettes","type":"Manga","chapters":54,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":37,"title":"Cat's Eye","type":"Manga","chapters":135,"read":0,"readVols":0,"volumes":18,"status":"Am Lesen","score":0,"notes":""},{"id":38,"title":"Chainsaw Man","type":"Manga","chapters":0,"read":160,"readVols":0,"volumes":0,"status":"Am Lesen","score":10,"notes":""},{"id":39,"title":"Cigarette & Cherry","type":"Manga","chapters":129,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":40,"title":"Damedol to Sekai ni Hitori dake no Fan","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":41,"title":"Dasei 67 Percent","type":"Manga","chapters":99,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":42,"title":"Dead Dead Demons Dededede Destruction","type":"Manga","chapters":101,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":43,"title":"Death Note","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":44,"title":"Death Note Another Note: Los Angeles BB Renzoku Satsujin Jiken","type":"Manga","chapters":7,"read":7,"readVols":0,"volumes":1,"status":"Abgeschlossen","score":4,"notes":""},{"id":45,"title":"Defense Devil","type":"Manga","chapters":100,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":46,"title":"Dimension W","type":"Manga","chapters":116,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":""},{"id":47,"title":"Dive in the Vampire Bund","type":"Manga","chapters":18,"read":10,"readVols":0,"volumes":2,"status":"Abgebrochen","score":0,"notes":""},{"id":48,"title":"Dorohedoro","type":"Manga","chapters":190,"read":0,"readVols":0,"volumes":23,"status":"Geplant","score":0,"notes":""},{"id":49,"title":"Dosanko Gal wa Namara Menkoi","type":"Manga","chapters":124,"read":36,"readVols":0,"volumes":14,"status":"Am Lesen","score":7,"notes":""},{"id":50,"title":"Dream\u2606Jumbo\u2606Girl","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Abgeschlossen","score":6,"notes":""},{"id":51,"title":"Dungeon Meshi","type":"Manga","chapters":102,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":""},{"id":52,"title":"Eden: It's an Endless World!","type":"Manga","chapters":127,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":53,"title":"Elf-san wa Yaserarenai.","type":"Manga","chapters":56,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":54,"title":"Enen no Shouboutai","type":"Manga","chapters":305,"read":34,"readVols":0,"volumes":34,"status":"Abgebrochen","score":0,"notes":""},{"id":55,"title":"Fire Punch","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":56,"title":"Fullmetal Alchemist","type":"Manga","chapters":116,"read":0,"readVols":0,"volumes":27,"status":"Geplant","score":0,"notes":""},{"id":57,"title":"Fumetsu no Anata e","type":"Manga","chapters":204,"read":4,"readVols":0,"volumes":25,"status":"Abgebrochen","score":0,"notes":""},{"id":58,"title":"Futari Escape","type":"Manga","chapters":35,"read":8,"readVols":0,"volumes":4,"status":"Am Lesen","score":0,"notes":""},{"id":59,"title":"Futari no Renai Shoka","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":60,"title":"Gangsta.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":61,"title":"Gangsta:Cursed.: EP_Marco Adriano","type":"Manga","chapters":19,"read":0,"readVols":0,"volumes":5,"status":"Abgebrochen","score":0,"notes":""},{"id":62,"title":"Gantz","type":"Manga","chapters":383,"read":0,"readVols":0,"volumes":37,"status":"Geplant","score":0,"notes":""},{"id":63,"title":"Gigant","type":"Manga","chapters":89,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":64,"title":"Gokushufudou","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":65,"title":"Goshujinsama ni wa Suwasemasen!","type":"Manga","chapters":0,"read":6,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":66,"title":"Grand Blue","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":67,"title":"Great Trailers","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":68,"title":"GTO","type":"Manga","chapters":208,"read":0,"readVols":0,"volumes":25,"status":"Geplant","score":0,"notes":""},{"id":69,"title":"Hai to Gensou no Grimgar","type":"Manga","chapters":16,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":70,"title":"Haikyuu!!","type":"Manga","chapters":407,"read":0,"readVols":0,"volumes":45,"status":"Geplant","score":0,"notes":""},{"id":71,"title":"Hapi Mari: Happy Marriage!?","type":"Manga","chapters":40,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":72,"title":"Hataraku Maou-sama!","type":"Manga","chapters":134,"read":0,"readVols":0,"volumes":24,"status":"Geplant","score":0,"notes":""},{"id":73,"title":"Hataraku Saibou","type":"Manga","chapters":30,"read":0,"readVols":0,"volumes":6,"status":"Geplant","score":0,"notes":""},{"id":74,"title":"Hataraku Saibou Black","type":"Manga","chapters":50,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":75,"title":"Hayama-sensei to Terano-sensei wa Tsukiatteiru","type":"Manga","chapters":28,"read":12,"readVols":0,"volumes":4,"status":"Am Lesen","score":0,"notes":""},{"id":76,"title":"Himesama Tanuki no Koizanyou","type":"Manga","chapters":75,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":77,"title":"Hochiya-san wa Amari Aru","type":"Manga","chapters":0,"read":10,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":78,"title":"Horimiya","type":"Manga","chapters":139,"read":139,"readVols":0,"volumes":17,"status":"Abgeschlossen","score":0,"notes":""},{"id":79,"title":"Hoshokukei Heroine ni Ato 1-nen Inai ni Taberaremasu","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":80,"title":"Hotaru no Hikari","type":"Manga","chapters":90,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":81,"title":"Houseki no Kuni","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":""},{"id":82,"title":"Ikemen Girl to Hakoiri Musume","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":0,"notes":""},{"id":83,"title":"Ikigami","type":"Manga","chapters":60,"read":48,"readVols":0,"volumes":10,"status":"Am Lesen","score":9,"notes":""},{"id":84,"title":"Innocence: After the Long Goodbye","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":85,"title":"Inu x Boku SS","type":"Manga","chapters":58,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":86,"title":"Inuyashiki","type":"Manga","chapters":85,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":87,"title":"Jagaaaaaan","type":"Manga","chapters":163,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":""},{"id":88,"title":"Jibaku Shounen Hanako-kun","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":89,"title":"Jimoto ni Kaettekitara Osananajimi ga Kowareteta","type":"Manga","chapters":0,"read":36,"readVols":0,"volumes":1,"status":"Am Lesen","score":0,"notes":""},{"id":90,"title":"Jitsu wa Watashi Sexless de Nayandemashita","type":"Manga","chapters":5,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":91,"title":"JoJo no Kimyou na Bouken Part 7: Steel Ball Run","type":"Manga","chapters":96,"read":0,"readVols":0,"volumes":24,"status":"Geplant","score":0,"notes":""},{"id":92,"title":"Jumyou wo Kaitotte Moratta. Ichinen ni Tsuki, Ichimanen de.","type":"Manga","chapters":18,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":93,"title":"Kaette Kudasai! Akutsu-san","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":94,"title":"Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen","type":"Manga","chapters":281,"read":0,"readVols":0,"volumes":28,"status":"Geplant","score":0,"notes":""},{"id":95,"title":"Kaichou wa Maid-sama!","type":"Manga","chapters":98,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":96,"title":"Kaichou wa Maid-sama!: Marriage","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":97,"title":"Kaijin Reijou","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":98,"title":"Kakei no Alice","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":99,"title":"Kakkou no Iinazuke","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":100,"title":"Kakukaku Shikajika","type":"Manga","chapters":34,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":101,"title":"Kami no Shizuku","type":"Manga","chapters":439,"read":0,"readVols":0,"volumes":44,"status":"Geplant","score":0,"notes":""},{"id":102,"title":"Kanojo mo Kanojo","type":"Manga","chapters":144,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":""},{"id":103,"title":"Kanojo ni Naritai Kimi to Boku","type":"Manga","chapters":51,"read":7,"readVols":0,"volumes":4,"status":"Am Lesen","score":0,"notes":""},{"id":104,"title":"Kanojo no Kuchizuke","type":"Manga","chapters":0,"read":1,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":105,"title":"Kanojo, Hitomishirimasu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":106,"title":"Kaoru Hana wa Rin to Saku","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":107,"title":"Karakai Jouzu no Takagi-san","type":"Manga","chapters":182,"read":63,"readVols":0,"volumes":20,"status":"Pausiert","score":8,"notes":""},{"id":108,"title":"Kase-san Series","type":"Manga","chapters":25,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":109,"title":"Kaze no Tani no Nausica\u00e4","type":"Manga","chapters":59,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":110,"title":"Kimi no Na wa.","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":111,"title":"Kimi no Na wa. Another Side: Earthbound","type":"Manga","chapters":14,"read":14,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":7,"notes":""},{"id":112,"title":"Kimi no Okaasan wo Boku ni Kudasai!","type":"Manga","chapters":33,"read":0,"readVols":0,"volumes":4,"status":"Abgebrochen","score":0,"notes":""},{"id":113,"title":"Kimi no Suizou wo Tabetai","type":"Manga","chapters":10,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":114,"title":"Kingdom","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":115,"title":"Kobayashi-san Chi no Maid Dragon","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":116,"title":"Koe no Katachi","type":"Manga","chapters":64,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":117,"title":"Komi-san wa, Comyushou desu.","type":"Manga","chapters":500,"read":47,"readVols":0,"volumes":37,"status":"Pausiert","score":8,"notes":""},{"id":118,"title":"Kono Kaisha ni Suki na Hito ga Imasu","type":"Manga","chapters":148,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":119,"title":"Kono Oto Tomare!","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":120,"title":"Koukaku Kidoutai 1.5: Human-Error Processer","type":"Manga","chapters":7,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":121,"title":"Koukaku Kidoutai 2: Manmachine Interface","type":"Manga","chapters":6,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":122,"title":"Koukaku Kidoutai: Stand Alone Complex","type":"Manga","chapters":42,"read":42,"readVols":0,"volumes":5,"status":"Abgeschlossen","score":8,"notes":""},{"id":123,"title":"Koukaku Kidoutai: The Ghost in the Shell","type":"Manga","chapters":11,"read":11,"readVols":0,"volumes":1,"status":"Abgeschlossen","score":10,"notes":""},{"id":124,"title":"Koukaku Kidoutai: The Human Algorithm","type":"Manga","chapters":108,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":125,"title":"Kowloon Generic Romance","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":126,"title":"Kozure Ookami","type":"Manga","chapters":142,"read":0,"readVols":0,"volumes":28,"status":"Geplant","score":0,"notes":""},{"id":127,"title":"Kuchi ga Saketemo Kimi ni wa","type":"Manga","chapters":3,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":128,"title":"Kurohyou to 16-sai","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":129,"title":"Kuutei Dragons","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":130,"title":"Kuzumi-kun, Kuuki Yometemasu ka?","type":"Manga","chapters":63,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":131,"title":"Kyou no Cerberus","type":"Manga","chapters":58,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":132,"title":"Kyou wa Kanojo ga Inai kara","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":133,"title":"Kyoukai no Kanata","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":134,"title":"Love Comedy Manga ni Haitteshimatta node, Oshi no Make Heroine wo Zenryoku de Shiawase ni Suru","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":135,"title":"MabuSasa","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":136,"title":"Machigatteita no wa Ore Datta n da.","type":"Manga","chapters":1,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":137,"title":"Made in Abyss","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":138,"title":"Mahoutsukai no Yome","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":139,"title":"Maid Skater","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":140,"title":"Maou no Ore ga Dorei Elf wo Yome ni Shitanda ga, Dou Medereba Ii?","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":141,"title":"Mashou no Otome no Yakumawari","type":"Manga","chapters":14,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":142,"title":"Miageru to Kimi wa","type":"Manga","chapters":33,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":143,"title":"Midara na Ao-chan wa Benkyou ga Dekinai","type":"Manga","chapters":39,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":144,"title":"Mijuku na Futari de Gozaimasu ga","type":"Manga","chapters":152,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":145,"title":"Mob Psycho 100","type":"Manga","chapters":109,"read":0,"readVols":0,"volumes":16,"status":"Pausiert","score":9,"notes":""},{"id":146,"title":"Monster","type":"Manga","chapters":162,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":147,"title":"Mousou Telepathy","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":148,"title":"Murci\u00e9lago","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":149,"title":"Mushishi","type":"Manga","chapters":50,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":150,"title":"Nana","type":"Manga","chapters":84,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":""},{"id":151,"title":"Net-juu no Susume","type":"Manga","chapters":87,"read":0,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":""},{"id":152,"title":"NHK ni Youkoso!","type":"Manga","chapters":40,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":153,"title":"Obaachan Shoujo Hinata-chan","type":"Manga","chapters":94,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":154,"title":"Ojou to Banken-kun","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":155,"title":"One Piece","type":"Manga","chapters":0,"read":168,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":156,"title":"One Punch-Man","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":157,"title":"Oogami-san, Dadamore desu.","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":158,"title":"Ookii Mukimuki Chiisai Muchimuchi","type":"Manga","chapters":0,"read":4,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":159,"title":"Ooyukiumi no Kaina","type":"Manga","chapters":26,"read":15,"readVols":0,"volumes":4,"status":"Am Lesen","score":7,"notes":""},{"id":160,"title":"Orange","type":"Manga","chapters":38,"read":0,"readVols":0,"volumes":7,"status":"Geplant","score":0,"notes":""},{"id":161,"title":"Otaku ni Yasashii Gal wa Inai!?","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":162,"title":"Ousama Game","type":"Manga","chapters":25,"read":25,"readVols":0,"volumes":5,"status":"Abgeschlossen","score":2,"notes":""},{"id":163,"title":"Oyasumi Punpun","type":"Manga","chapters":147,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":""},{"id":164,"title":"P to JK","type":"Manga","chapters":65,"read":0,"readVols":0,"volumes":16,"status":"Geplant","score":0,"notes":""},{"id":165,"title":"Planetes","type":"Manga","chapters":27,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":166,"title":"Pocha Musume wa Koakuma Move ga Yamerarenai","type":"Manga","chapters":24,"read":24,"readVols":0,"volumes":3,"status":"Abgeschlossen","score":8,"notes":""},{"id":167,"title":"Ponkotsu Fuuki Iin to Skirt-take ga Futekisetsu na JK no Hanashi","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":168,"title":"Ponkotsu Ponko","type":"Manga","chapters":79,"read":0,"readVols":0,"volumes":10,"status":"Geplant","score":0,"notes":""},{"id":169,"title":"Raise wa Tanin ga Ii","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":170,"title":"ReLIFE","type":"Manga","chapters":238,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":171,"title":"Rental Oniichan","type":"Manga","chapters":20,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":172,"title":"Ryoushin no Shakkin wo Katagawari shite Morau Jouken wa Nihonichi Kawaii Joshikousei to Issho ni Kurasu Koto deshita.","type":"Manga","chapters":77,"read":0,"readVols":0,"volumes":5,"status":"Pausiert","score":0,"notes":""},{"id":173,"title":"Sabishisugite Lesbian Fuuzoku ni Ikimashita Report","type":"Manga","chapters":6,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":174,"title":"Sachi-iro no One Room","type":"Manga","chapters":69,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":175,"title":"Sakamoto Days","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":176,"title":"Sankagetsu Mae ni Wakareta Senpai Kouhai no Hanashi","type":"Manga","chapters":35,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":177,"title":"Seihantai na Kimi to Boku","type":"Manga","chapters":71,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":178,"title":"Seishun Buta Yarou wa Logical Witch no Yume wo Minai","type":"Manga","chapters":12,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":179,"title":"Sekai de Ichiban Oppai ga Suki!","type":"Manga","chapters":83,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":180,"title":"Senpai! Imakara Kokurimasu!","type":"Manga","chapters":30,"read":0,"readVols":0,"volumes":5,"status":"Geplant","score":0,"notes":""},{"id":181,"title":"Sensei wa Koi wo Oshierarenai","type":"Manga","chapters":47,"read":26,"readVols":0,"volumes":7,"status":"Pausiert","score":7,"notes":""},{"id":182,"title":"Shachou to Sake to Hoshi","type":"Manga","chapters":0,"read":33,"readVols":0,"volumes":0,"status":"Am Lesen","score":7,"notes":""},{"id":183,"title":"Shiawase Kanako no Koroshiya Seikatsu","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":184,"title":"Shigatsu wa Kimi no Uso","type":"Manga","chapters":44,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":185,"title":"Shin Elf-san wa Yaserarenai.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":186,"title":"Shingeki no Kyojin","type":"Manga","chapters":141,"read":114,"readVols":0,"volumes":34,"status":"Pausiert","score":0,"notes":""},{"id":187,"title":"Shingeki no Kyojin: Before the Fall","type":"Manga","chapters":73,"read":24,"readVols":0,"volumes":17,"status":"Pausiert","score":0,"notes":""},{"id":188,"title":"Shingeki no Kyojin: Kakuzetsu Toshi no Joou","type":"Manga","chapters":7,"read":7,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":8,"notes":""},{"id":189,"title":"Shingeki no Kyojin: Kuinaki Sentaku","type":"Manga","chapters":8,"read":8,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":8,"notes":""},{"id":190,"title":"Shingeki no Kyojin: Lost Girls","type":"Manga","chapters":3,"read":3,"readVols":0,"volumes":1,"status":"Abgeschlossen","score":7,"notes":""},{"id":191,"title":"Shingeki no Kyojin: Lost Girls","type":"Manga","chapters":10,"read":10,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":7,"notes":""},{"id":192,"title":"Shoujo Shuumatsu Ryokou","type":"Manga","chapters":47,"read":21,"readVols":0,"volumes":6,"status":"Am Lesen","score":10,"notes":""},{"id":193,"title":"Shuumatsu Touring","type":"Manga","chapters":0,"read":5,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":194,"title":"Slam Dunk","type":"Manga","chapters":276,"read":0,"readVols":0,"volumes":31,"status":"Geplant","score":0,"notes":""},{"id":195,"title":"Somali to Mori no Kamisama","type":"Manga","chapters":39,"read":39,"readVols":0,"volumes":6,"status":"Abgeschlossen","score":8,"notes":""},{"id":196,"title":"Sono Bisque Doll wa Koi wo Suru","type":"Manga","chapters":119,"read":0,"readVols":0,"volumes":15,"status":"Geplant","score":0,"notes":""},{"id":197,"title":"Soul Eater","type":"Manga","chapters":117,"read":4,"readVols":0,"volumes":25,"status":"Pausiert","score":0,"notes":""},{"id":198,"title":"Sousou no Frieren","type":"Manga","chapters":0,"read":47,"readVols":0,"volumes":0,"status":"Am Lesen","score":9,"notes":""},{"id":199,"title":"Spy x Family","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":200,"title":"Succubus & Hitman","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":201,"title":"Suki x Suki","type":"Manga","chapters":23,"read":0,"readVols":0,"volumes":2,"status":"Geplant","score":0,"notes":""},{"id":202,"title":"Super no Ura de Yani Suu Futari","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":203,"title":"Suzumiya Haruhi-chan no Yuuutsu","type":"Manga","chapters":164,"read":0,"readVols":0,"volumes":12,"status":"Geplant","score":0,"notes":""},{"id":204,"title":"Taiyou no Ie","type":"Manga","chapters":53,"read":0,"readVols":0,"volumes":13,"status":"Geplant","score":0,"notes":""},{"id":205,"title":"Tejina-senpai","type":"Manga","chapters":132,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":206,"title":"Tenkuu Shinpan","type":"Manga","chapters":258,"read":0,"readVols":0,"volumes":21,"status":"Geplant","score":0,"notes":""},{"id":207,"title":"Terra Formars","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":208,"title":"To LOVE-Ru","type":"Manga","chapters":162,"read":0,"readVols":0,"volumes":18,"status":"Geplant","score":0,"notes":""},{"id":209,"title":"Tokyo Ghoul","type":"Manga","chapters":17,"read":0,"readVols":0,"volumes":3,"status":"Pausiert","score":0,"notes":""},{"id":210,"title":"Tokyo Ghoul","type":"Manga","chapters":144,"read":144,"readVols":0,"volumes":14,"status":"Abgeschlossen","score":9,"notes":""},{"id":211,"title":"Tokyo Ghoul:re","type":"Manga","chapters":181,"read":110,"readVols":0,"volumes":16,"status":"Pausiert","score":0,"notes":""},{"id":212,"title":"Tongari Boushi no Atelier","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":213,"title":"Tonikaku Kawaii","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":214,"title":"Totsukuni no Shoujo","type":"Manga","chapters":53,"read":0,"readVols":0,"volumes":11,"status":"Geplant","score":0,"notes":""},{"id":215,"title":"Toumei Otoko to Ningen Onna: Sonouchi Fuufu ni Naru Futari","type":"Manga","chapters":0,"read":36,"readVols":0,"volumes":0,"status":"Pausiert","score":9,"notes":""},{"id":216,"title":"Tower Dungeon","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":217,"title":"Tsukiatte Agetemo Ii kana","type":"Manga","chapters":133,"read":113,"readVols":0,"volumes":14,"status":"Am Lesen","score":8,"notes":""},{"id":218,"title":"Tsukuritai Onna to Tabetai Onna","type":"Manga","chapters":0,"read":49,"readVols":0,"volumes":0,"status":"Am Lesen","score":0,"notes":""},{"id":219,"title":"Tsurezure Children","type":"Manga","chapters":212,"read":0,"readVols":0,"volumes":12,"status":"Pausiert","score":0,"notes":""},{"id":220,"title":"Uchi no Kaisha no Chiisai Senpai no Hanashi","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":221,"title":"Uchuu Kyoudai","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":222,"title":"Ultraman","type":"Manga","chapters":0,"read":20,"readVols":0,"volumes":0,"status":"Abgebrochen","score":5,"notes":""},{"id":223,"title":"Umarekawattemo Mata, Watashi to Kekkon shitekuremasu ka","type":"Manga","chapters":26,"read":0,"readVols":0,"volumes":4,"status":"Geplant","score":0,"notes":""},{"id":224,"title":"Umineko no Naku Koro ni Chiru - Episode 8: Twilight of the Golden Witch","type":"Manga","chapters":42,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":225,"title":"Unemployed Gye Baek-soon","type":"Manga","chapters":0,"read":14,"readVols":0,"volumes":0,"status":"Abgebrochen","score":0,"notes":""},{"id":226,"title":"Vagabond","type":"Manga","chapters":327,"read":0,"readVols":0,"volumes":37,"status":"Geplant","score":0,"notes":""},{"id":227,"title":"Vampeerz","type":"Manga","chapters":46,"read":0,"readVols":0,"volumes":9,"status":"Geplant","score":0,"notes":""},{"id":228,"title":"Veil","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":229,"title":"Vigilante: Boku no Hero Academia Illegals","type":"Manga","chapters":132,"read":5,"readVols":0,"volumes":15,"status":"Abgebrochen","score":6,"notes":""},{"id":230,"title":"Vinland Saga","type":"Manga","chapters":224,"read":0,"readVols":0,"volumes":29,"status":"Geplant","score":0,"notes":""},{"id":231,"title":"Watashi no Shumi tte Hen desu ka?","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":1,"status":"Pausiert","score":0,"notes":""},{"id":232,"title":"Watashitachi no Shiawase na Jikan","type":"Manga","chapters":8,"read":0,"readVols":0,"volumes":1,"status":"Geplant","score":0,"notes":""},{"id":233,"title":"Wotaku ni Koi wa Muzukashii","type":"Manga","chapters":105,"read":105,"readVols":0,"volumes":11,"status":"Abgeschlossen","score":9,"notes":""},{"id":234,"title":"Yagate Kimi ni Naru","type":"Manga","chapters":50,"read":50,"readVols":0,"volumes":8,"status":"Abgeschlossen","score":9,"notes":""},{"id":235,"title":"Yagate Kimi ni Naru: Koushiki Comic Anthology","type":"Manga","chapters":26,"read":26,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":7,"notes":""},{"id":236,"title":"Yagate Kimi ni Naru: Saeki Sayaka ni Tsuite","type":"Manga","chapters":9,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":237,"title":"Yaiteru Futari","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":238,"title":"Yamada to Kase-san.","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":239,"title":"Yamaguchi-kun wa Warukunai","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":240,"title":"Yankee-kun to Hakujou Girl","type":"Manga","chapters":127,"read":0,"readVols":0,"volumes":8,"status":"Geplant","score":0,"notes":""},{"id":241,"title":"Yokohama Kaidashi Kikou","type":"Manga","chapters":142,"read":0,"readVols":0,"volumes":14,"status":"Geplant","score":0,"notes":""},{"id":242,"title":"Yokokuhan","type":"Manga","chapters":22,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":243,"title":"Yoshinozuikara","type":"Manga","chapters":20,"read":0,"readVols":0,"volumes":3,"status":"Geplant","score":0,"notes":""},{"id":244,"title":"Yotsuba to!","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":245,"title":"Yubisaki to Renren","type":"Manga","chapters":0,"read":44,"readVols":0,"volumes":0,"status":"Pausiert","score":7,"notes":""},{"id":246,"title":"Yuru Camp\u25b3","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Pausiert","score":0,"notes":""},{"id":247,"title":"Yuugai Toshi","type":"Manga","chapters":17,"read":17,"readVols":0,"volumes":2,"status":"Abgeschlossen","score":10,"notes":""},{"id":248,"title":"Zenbu Kowashite Jigoku de Aishite","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":0,"status":"Geplant","score":0,"notes":""},{"id":249,"title":"\u00c9clair: Anata ni Hibiku Yuri Anthology","type":"Manga","chapters":0,"read":0,"readVols":0,"volumes":5,"status":"Pausiert","score":0,"notes":""}];

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
      display:"inline-flex", alignItems:"center", gap:3,
      padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700,
      background:c+"22", color:c, border:`1px solid ${c}44`,
      whiteSpace:"nowrap", flexShrink:0,
    }}>● {s}</span>
  );
}

function Stepper({ label, value, onInc, onDec, max }) {
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #ffffff08"}}>
      <span style={{fontSize:13, color:"#aaa"}}>{label}{max ? <span style={{color:"#555", fontSize:11}}> / {max}</span> : ""}</span>
      <div style={{display:"flex", alignItems:"center", gap:0}}>
        <button onClick={onDec} style={{
          width:38, height:38, border:"none", borderRadius:"8px 0 0 8px",
          background:"#ffffff10", color:"#ddd", fontSize:20, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:300, lineHeight:1,
        }}>−</button>
        <span style={{
          minWidth:46, height:38, display:"flex", alignItems:"center", justifyContent:"center",
          background:"#ffffff08", fontSize:15, fontWeight:700, color:"#fff",
        }}>{value}</span>
        <button onClick={onInc} style={{
          width:38, height:38, border:"none", borderRadius:"0 8px 8px 0",
          background:"#E94560", color:"#fff", fontSize:20, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:300, lineHeight:1,
        }}>+</button>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #ffffff08"}}>
      <span style={{fontSize:13, color:"#aaa"}}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={e => {
          const v = parseInt(e.target.value, 10);
          onChange(isNaN(v) ? 0 : Math.max(0, v));
        }}
        style={{
          width:90, height:38, padding:"0 10px",
          background:"#ffffff08", border:"1px solid #ffffff15",
          borderRadius:8, color:"#fff", fontSize:15, fontWeight:700,
          fontFamily:"inherit", textAlign:"center", outline:"none",
          WebkitAppearance:"none", MozAppearance:"textfield",
        }}
      />
    </div>
  );
}

function RelatedSection({ item, allAnime, allManga, onChange, accent }) {
  const [searchRel, setSearchRel] = useState("");
  const [relType, setRelType] = useState("Sequel");
  const related = item.related || [];
  const REL_TYPES = ["Sequel","Prequel","Adaption","Side Story","Spin-off"];

  const results = useMemo(() => {
    if (searchRel.trim().length < 2) return [];
    const q = searchRel.toLowerCase();
    const combined = [
      ...allAnime.filter(a => a.id !== item.id).map(a => ({...a, _kind:"anime"})),
      ...allManga.filter(m => m.id !== item.id).map(m => ({...m, _kind:"manga"})),
    ];
    return combined.filter(x => x.title.toLowerCase().includes(q)).slice(0, 8);
  }, [searchRel, allAnime, allManga, item.id]);

  const addRel = (target) => {
    if (related.find(r => r.id === target.id && r.kind === target._kind)) return;
    onChange({ ...item, related: [...related, { id: target.id, kind: target._kind, title: target.title, relType }] });
    setSearchRel("");
  };
  const removeRel = (rid, rkind) => onChange({ ...item, related: related.filter(r => !(r.id===rid && r.kind===rkind)) });

  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:11, color:"#666", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em"}}>Verwandte Werke</div>
      {related.length > 0 && (
        <div style={{marginBottom:10}}>
          {related.map((r,i) => (
            <div key={i} style={{display:"flex", alignItems:"center", gap:8, marginBottom:6, padding:"7px 10px", background:"#ffffff08", borderRadius:8}}>
              <span style={{fontSize:10, padding:"2px 6px", borderRadius:4, background: r.kind==="anime"?"#E9456022":"#9B59B622", color: r.kind==="anime"?"#E94560":"#9B59B6", fontWeight:700, whiteSpace:"nowrap"}}>{r.relType}</span>
              <span style={{flex:1, fontSize:12, color:"#ccc", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{r.kind==="anime"?"🎬":"📚"} {r.title}</span>
              <button onClick={() => removeRel(r.id, r.kind)} style={{background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer", padding:"0 2px", flexShrink:0, lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex", flexWrap:"wrap", gap:5, marginBottom:8}}>
        {REL_TYPES.map(t => (
          <button key={t} onClick={() => setRelType(t)} style={{
            padding:"4px 10px", border:"1px solid " + (relType===t ? accent : "#ffffff12"),
            borderRadius:16, cursor:"pointer", fontSize:10, fontWeight:700,
            background: relType===t ? accent+"22" : "transparent",
            color: relType===t ? accent : "#666",
            fontFamily:"inherit",
          }}>{t}</button>
        ))}
      </div>
      <input
        value={searchRel}
        onChange={e => setSearchRel(e.target.value)}
        placeholder="Titel suchen und verknüpfen..."
        style={{
          width:"100%", padding:"9px 12px", background:"#ffffff08",
          border:"1px solid #ffffff10", borderRadius:8, color:"#ccc",
          fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none",
        }}
      />
      {results.length > 0 && (
        <div style={{marginTop:4, background:"#1a2438", borderRadius:8, overflow:"hidden", border:"1px solid #ffffff10"}}>
          {results.map((r,i) => (
            <div key={i} onClick={() => addRel(r)} style={{
              padding:"9px 12px", cursor:"pointer", fontSize:13, color:"#ccc",
              borderBottom: i<results.length-1 ? "1px solid #ffffff08" : "none",
              display:"flex", alignItems:"center", gap:8,
            }}>
              <span style={{fontSize:10, color: r._kind==="anime"?"#E94560":"#9B59B6", fontWeight:700, flexShrink:0}}>{r._kind==="anime"?"🎬 Anime":"📚 Manga"}</span>
              <span style={{flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{r.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnimeCard({ item, onChange, allAnimeRef, allMangaRef }) {
  const [open, setOpen] = useState(false);
  const c = SC[item.status] || "#666";
  const pct = item.eps ? Math.min(100, Math.round((item.watched||0) / item.eps * 100)) : 0;

  const upd = (field, val) => onChange({ ...item, [field]: val });

  return (
    <div style={{
      background:"#111927", borderRadius:14, marginBottom:10,
      border:`1px solid ${open ? "#E9456033" : "#ffffff08"}`,
      overflow:"hidden", transition:"border-color .2s",
    }}>
      {/* Row */}
      <div onClick={() => setOpen(!open)} style={{
        padding:"13px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer",
      }}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:5}}>
            <span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#ffffff12", color:"#888", fontWeight:600}}>{item.format||"TV"}</span>
            <Badge s={item.status}/>
          </div>
          <div style={{fontSize:14, fontWeight:600, color:"#e8e8e8", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.title}</div>
          <div style={{display:"flex", alignItems:"center", gap:8, marginTop:6}}>
            <div style={{flex:1, height:3, background:"#ffffff10", borderRadius:2}}>
              <div style={{width:`${pct}%`, height:"100%", background:c, borderRadius:2, transition:"width .3s"}}/>
            </div>
            <span style={{fontSize:11, color:"#666", whiteSpace:"nowrap"}}>{item.watched||0}/{item.eps||"?"} Ep</span>
            {item.score > 0 && <span style={{fontSize:12, fontWeight:800, color: item.score>=9?"#F5A623":item.score>=7?"#2ECC71":"#3498DB"}}>{item.score}{item.score===10?" ⭐":""}</span>}
          </div>
        </div>
        <span style={{color: open?"#E94560":"#555", fontSize:12, flexShrink:0}}>{open?"▲":"▼"}</span>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{padding:"4px 14px 14px", borderTop:"1px solid #ffffff08"}}>
          <Stepper
            label="Gesehen"
            value={item.watched||0}
            max={item.eps||null}
            onInc={() => upd("watched", Math.min((item.watched||0)+1, item.eps||9999))}
            onDec={() => upd("watched", Math.max(0, (item.watched||0)-1))}
          />
          <NumberInput
            label="Gesamt Episoden"
            value={item.eps||0}
            onChange={v => upd("eps", v)}
          />
          <Stepper
            label="Bewertung"
            value={item.score||0}
            max={10}
            onInc={() => upd("score", Math.min(10, (item.score||0)+1))}
            onDec={() => upd("score", Math.max(0, (item.score||0)-1))}
          />
          <div style={{marginTop:10}}>
            <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Status</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {STATUS_A.map(s => (
                <button key={s} onClick={() => upd("status", s)} style={{
                  padding:"5px 11px", border:`1px solid ${item.status===s?(SC[s]||"#E94560"):"#ffffff15"}`,
                  borderRadius:20, cursor:"pointer", fontSize:11, fontWeight:700,
                  background: item.status===s ? (SC[s]||"#E94560")+"22" : "transparent",
                  color: item.status===s ? (SC[s]||"#E94560") : "#666",
                  fontFamily:"inherit",
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Format</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {FORMATS.map(f => (
                <button key={f} onClick={() => upd("format", f)} style={{
                  padding:"5px 11px", border:`1px solid ${item.format===f?"#E94560":"#ffffff15"}`,
                  borderRadius:20, cursor:"pointer", fontSize:11, fontWeight:600,
                  background: item.format===f ? "#E9456022" : "transparent",
                  color: item.format===f ? "#E94560" : "#666",
                  fontFamily:"inherit",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <div style={{fontSize:11, color:"#666", marginBottom:4, textTransform:"uppercase", letterSpacing:".06em"}}>Notizen</div>
            <textarea
              value={item.notes||""}
              onChange={e => upd("notes", e.target.value)}
              rows={2}
              placeholder="Notizen..."
              style={{width:"100%", background:"#ffffff08", border:"1px solid #ffffff10", borderRadius:8, padding:"8px 10px", color:"#ccc", fontSize:13, fontFamily:"inherit", resize:"none", boxSizing:"border-box"}}
            />
          </div>
          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent="#E94560"/>
        </div>
      )}
    </div>
  );
}

function MangaCard({ item, onChange, allAnimeRef, allMangaRef }) {
  const [open, setOpen] = useState(false);
  const c = SC[item.status] || "#666";
  const pct = item.chapters ? Math.min(100, Math.round((item.read||0) / item.chapters * 100)) : 0;

  const upd = (field, val) => onChange({ ...item, [field]: val });

  return (
    <div style={{
      background:"#130d24", borderRadius:14, marginBottom:10,
      border:`1px solid ${open ? "#9B59B633" : "#ffffff08"}`,
      overflow:"hidden", transition:"border-color .2s",
    }}>
      <div onClick={() => setOpen(!open)} style={{
        padding:"13px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer",
      }}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:5}}>
            <span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#ffffff12", color:"#888", fontWeight:600}}>{item.type||"Manga"}</span>
            <Badge s={item.status}/>
          </div>
          <div style={{fontSize:14, fontWeight:600, color:"#e8e8e8", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.title}</div>
          <div style={{display:"flex", alignItems:"center", gap:8, marginTop:6}}>
            <div style={{flex:1, height:3, background:"#ffffff10", borderRadius:2}}>
              <div style={{width:`${pct}%`, height:"100%", background:c, borderRadius:2}}/>
            </div>
            <span style={{fontSize:11, color:"#666", whiteSpace:"nowrap"}}>{item.read||0}/{item.chapters||"?"} Kap</span>
            {item.score > 0 && <span style={{fontSize:12, fontWeight:800, color: item.score>=9?"#F5A623":item.score>=7?"#2ECC71":"#3498DB"}}>{item.score}{item.score===10?" ⭐":""}</span>}
          </div>
        </div>
        <span style={{color: open?"#9B59B6":"#555", fontSize:12, flexShrink:0}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{padding:"4px 14px 14px", borderTop:"1px solid #ffffff08"}}>
          <Stepper
            label="Kapitel gelesen"
            value={item.read||0}
            max={item.chapters||null}
            onInc={() => upd("read", Math.min((item.read||0)+1, item.chapters||9999))}
            onDec={() => upd("read", Math.max(0, (item.read||0)-1))}
          />
          <Stepper
            label="Bände gelesen"
            value={item.readVols||0}
            max={item.volumes||null}
            onInc={() => upd("readVols", Math.min((item.readVols||0)+1, item.volumes||9999))}
            onDec={() => upd("readVols", Math.max(0, (item.readVols||0)-1))}
          />
          <NumberInput
            label="Gesamt Kapitel"
            value={item.chapters||0}
            onChange={v => upd("chapters", v)}
          />
          <NumberInput
            label="Gesamt Bände"
            value={item.volumes||0}
            onChange={v => upd("volumes", v)}
          />
          <Stepper
            label="Bewertung"
            value={item.score||0}
            max={10}
            onInc={() => upd("score", Math.min(10, (item.score||0)+1))}
            onDec={() => upd("score", Math.max(0, (item.score||0)-1))}
          />
          <div style={{marginTop:10}}>
            <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Status</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {STATUS_M.map(s => (
                <button key={s} onClick={() => upd("status", s)} style={{
                  padding:"5px 11px", border:`1px solid ${item.status===s?(SC[s]||"#9B59B6"):"#ffffff15"}`,
                  borderRadius:20, cursor:"pointer", fontSize:11, fontWeight:700,
                  background: item.status===s ? (SC[s]||"#9B59B6")+"22" : "transparent",
                  color: item.status===s ? (SC[s]||"#9B59B6") : "#666",
                  fontFamily:"inherit",
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Typ</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {TYPES.map(t => (
                <button key={t} onClick={() => upd("type", t)} style={{
                  padding:"5px 11px", border:`1px solid ${item.type===t?"#9B59B6":"#ffffff15"}`,
                  borderRadius:20, cursor:"pointer", fontSize:11, fontWeight:600,
                  background: item.type===t ? "#9B59B622" : "transparent",
                  color: item.type===t ? "#9B59B6" : "#666",
                  fontFamily:"inherit",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:10}}>
            <textarea
              value={item.notes||""}
              onChange={e => upd("notes", e.target.value)}
              rows={2}
              placeholder="Notizen..."
              style={{width:"100%", background:"#ffffff08", border:"1px solid #ffffff10", borderRadius:8, padding:"8px 10px", color:"#ccc", fontSize:13, fontFamily:"inherit", resize:"none", boxSizing:"border-box"}}
            />
          </div>
          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent="#9B59B6"/>
        </div>
      )}
    </div>
  );
}

// MAL format/type mapping
const MAL_FORMAT_MAP = {
  TV:"TV", Movie:"Movie", OVA:"OVA", ONA:"ONA", Special:"Special", Music:"Musik",
  Manga:"Manga", Manhwa:"Manhwa", Manhua:"Manhua", "One-shot":"One-Shot",
  Novel:"Novel", "Light Novel":"Light Novel", Doujinshi:"Manga",
};

function parseMalUrl(url) {
  // https://myanimelist.net/anime/1/Cowboy_Bebop
  // https://myanimelist.net/manga/2/Berserk
  const m = url.match(/myanimelist\.net\/(anime|manga)\/(\d+)/i);
  if (m) return { kind: m[1], id: m[2] };
  return null;
}

async function fetchMalData(kind, malId) {
  // Jikan v4 - unofficial MAL API, no key needed
  const res = await fetch(`https://api.jikan.moe/v4/${kind}/${malId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

function AddModal({ type, onClose, onAdd }) {
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

  const handleUrlFetch = async () => {
    const parsed = parseMalUrl(url.trim());
    if (!parsed) {
      setFetchError("Kein gültiger MyAnimeList-Link erkannt");
      return;
    }
    // Warn if wrong tab
    if (parsed.kind !== type) {
      setFetchError(`Das ist ein ${parsed.kind === "anime" ? "Anime" : "Manga"}-Link, du bist im ${isAnime ? "Anime" : "Manga"}-Tab`);
      return;
    }
    setFetching(true);
    setFetchError("");
    try {
      const data = await fetchMalData(parsed.kind, parsed.id);
      setTitle(data.title || "");
      setMalImage(data.images?.jpg?.image_url || "");
      if (isAnime) {
        const fmt = MAL_FORMAT_MAP[data.type] || "TV";
        setFormat(fmt);
        setEps(data.episodes || 0);
      } else {
        const t = MAL_FORMAT_MAP[data.type] || "Manga";
        setMtype(t);
        setChapters(data.chapters || 0);
        setVolumes(data.volumes || 0);
      }
      setFetched(true);
    } catch(e) {
      setFetchError("Fehler beim Laden – bitte nochmal versuchen");
    } finally {
      setFetching(false);
    }
  };

  const submit = () => {
    if (!title.trim()) return;
    if (isAnime) {
      onAdd({ id: Date.now(), title: title.trim(), format, eps, watched, status, score, notes:"" });
    } else {
      onAdd({ id: Date.now(), title: title.trim(), type: mtype, chapters, volumes, read, readVols:0, status, score, notes:"" });
    }
    onClose();
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000000cc", zIndex:1000,
      display:"flex", alignItems:"flex-end",
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        width:"100%", background:"#111927", borderRadius:"20px 20px 0 0",
        padding:"20px 18px 32px", maxHeight:"90vh", overflowY:"auto",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
          <h2 style={{margin:0, fontSize:17, fontWeight:800, color: isAnime?"#E94560":"#9B59B6"}}>
            {isAnime ? "🎬 Anime hinzufügen" : "📚 Manga hinzufügen"}
          </h2>
          <button onClick={onClose} style={{background:"none", border:"none", color:"#666", fontSize:22, cursor:"pointer", padding:"0 4px"}}>✕</button>
        </div>

        {/* MAL URL import */}
        <div style={{marginBottom:16, padding:"12px 14px", background:"#0a1020", borderRadius:12, border:"1px solid #ffffff0a"}}>
          <div style={{fontSize:11, color:"#F5A623", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em", fontWeight:700}}>
            🔗 MyAnimeList-Link importieren
          </div>
          <div style={{display:"flex", gap:8}}>
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); setFetchError(""); setFetched(false); }}
              onKeyDown={e => e.key==="Enter" && handleUrlFetch()}
              placeholder="https://myanimelist.net/anime/..."
              style={{
                flex:1, padding:"9px 11px", background:"#ffffff08",
                border:`1px solid ${fetchError?"#E74C3C":fetched?"#2ECC71":"#ffffff10"}`,
                borderRadius:8, color:"#ccc", fontSize:12,
                fontFamily:"inherit", outline:"none", minWidth:0,
              }}
            />
            <button
              onClick={handleUrlFetch}
              disabled={!url.trim() || fetching}
              style={{
                padding:"9px 14px", border:"none", borderRadius:8,
                background: fetching ? "#333" : "#F5A62333",
                color: fetching ? "#555" : "#F5A623",
                fontSize:12, fontWeight:700, cursor: url.trim() && !fetching ? "pointer" : "not-allowed",
                fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0,
              }}
            >{fetching ? "⟳" : "Laden"}</button>
          </div>
          {fetchError && <div style={{fontSize:11, color:"#E74C3C", marginTop:6}}>{fetchError}</div>}
          {fetched && !fetchError && (
            <div style={{display:"flex", alignItems:"center", gap:10, marginTop:10}}>
              {malImage && <img src={malImage} alt="" style={{width:36, height:52, objectFit:"cover", borderRadius:4, flexShrink:0}}/>}
              <div style={{fontSize:12, color:"#2ECC71", fontWeight:700}}>✓ Daten geladen – prüfe und passe unten an</div>
            </div>
          )}
          {!fetched && !fetchError && (
            <div style={{fontSize:10, color:"#444", marginTop:6}}>
              Öffne auf myanimelist.net die Seite und kopiere den Link hierher
            </div>
          )}
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11, color:"#666", marginBottom:5, textTransform:"uppercase", letterSpacing:".06em"}}>Titel *</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isAnime ? "Anime-Titel..." : "Manga-Titel..."}
            style={{
              width:"100%", padding:"11px 13px", background:"#ffffff0d",
              border:"1px solid #ffffff15", borderRadius:10, color:"#e8e8e8",
              fontSize:15, fontFamily:"inherit", boxSizing:"border-box", outline:"none",
            }}
          />
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Status</div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {(isAnime ? STATUS_A : STATUS_M).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding:"6px 13px", border:`1px solid ${status===s?(SC[s]||"#888"):"#ffffff15"}`,
                borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
                background: status===s ? (SC[s]||"#888")+"22" : "transparent",
                color: status===s ? (SC[s]||"#888") : "#666",
                fontFamily:"inherit",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {isAnime ? (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Format</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {FORMATS.map(f => (
                <button key={f} onClick={() => setFormat(f)} style={{
                  padding:"6px 13px", border:`1px solid ${format===f?"#E94560":"#ffffff15"}`,
                  borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                  background: format===f ? "#E9456022" : "transparent",
                  color: format===f ? "#E94560" : "#666",
                  fontFamily:"inherit",
                }}>{f}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11, color:"#666", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Typ</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setMtype(t)} style={{
                  padding:"6px 13px", border:`1px solid ${mtype===t?"#9B59B6":"#ffffff15"}`,
                  borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                  background: mtype===t ? "#9B59B622" : "transparent",
                  color: mtype===t ? "#9B59B6" : "#666",
                  fontFamily:"inherit",
                }}>{t}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{borderRadius:12, overflow:"hidden", border:"1px solid #ffffff0a"}}>
          {isAnime ? <>
            <NumberInput label="Episoden gesamt" value={eps} onChange={v=>setEps(v)}/>
            <Stepper label="Gesehen" value={watched} max={eps||null} onInc={()=>setWatched(e=>Math.min(e+1,eps||9999))} onDec={()=>setWatched(e=>Math.max(0,e-1))}/>
          </> : <>
            <NumberInput label="Kapitel gesamt" value={chapters} onChange={v=>setChapters(v)}/>
            <NumberInput label="Bände gesamt" value={volumes} onChange={v=>setVolumes(v)}/>
            <Stepper label="Kapitel gelesen" value={read} max={chapters||null} onInc={()=>setRead(e=>Math.min(e+1,chapters||9999))} onDec={()=>setRead(e=>Math.max(0,e-1))}/>
          </>}
          <Stepper label="Bewertung" value={score} max={10} onInc={()=>setScore(e=>Math.min(10,e+1))} onDec={()=>setScore(e=>Math.max(0,e-1))}/>
        </div>

        <button
          onClick={submit}
          disabled={!title.trim()}
          style={{
            width:"100%", padding:"15px", marginTop:18, border:"none",
            borderRadius:12, cursor: title.trim() ? "pointer" : "not-allowed",
            background: title.trim() ? (isAnime ? "linear-gradient(135deg,#E94560,#c0304d)" : "linear-gradient(135deg,#9B59B6,#7d4592)") : "#333",
            color:"#fff", fontSize:16, fontWeight:800, fontFamily:"inherit",
            letterSpacing:".04em",
          }}
        >Hinzufügen</button>
      </div>
    </div>
  );
}

function StatsView({ anime, manga }) {
  const ac={}, mc={};
  anime.forEach(a=>{ac[a.status]=(ac[a.status]||0)+1});
  manga.forEach(m=>{mc[m.status]=(mc[m.status]||0)+1});
  const sa=anime.filter(a=>a.score>0), sm=manga.filter(m=>m.score>0);
  const avgA=sa.length?(sa.reduce((s,a)=>s+a.score,0)/sa.length).toFixed(1):"—";
  const avgM=sm.length?(sm.reduce((s,m)=>s+m.score,0)/sm.length).toFixed(1):"—";
  const eps=anime.reduce((s,a)=>s+(a.watched||0),0);
  const chaps=manga.reduce((s,m)=>s+(m.read||0),0);
  const favA=anime.filter(a=>a.score===10);
  const favM=manga.filter(m=>m.score===10);

  const Card=({label,val,color})=>(
    <div style={{background:"#111927",border:"1px solid #ffffff0a",borderRadius:12,padding:"14px 16px",flex:1}}>
      <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:24,fontWeight:900,color}}>{val}</div>
    </div>
  );
  const SBar=({label,count,color,total})=>(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
      <span style={{flex:1,fontSize:13,color:"#bbb"}}>{label}</span>
      <span style={{fontWeight:700,color,fontSize:14,minWidth:28,textAlign:"right"}}>{count}</span>
      <div style={{width:70,height:3,background:"#ffffff10",borderRadius:2}}>
        <div style={{width:`${Math.round(count/total*100)}%`,height:"100%",background:color,borderRadius:2}}/>
      </div>
    </div>
  );

  return (
    <div style={{padding:"16px 0"}}>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <Card label="Anime" val={anime.length} color="#E94560"/>
        <Card label="Manga" val={manga.length} color="#9B59B6"/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Card label="Episoden" val={eps.toLocaleString("de")} color="#3498DB"/>
        <Card label="Kapitel" val={chaps.toLocaleString("de")} color="#2ECC71"/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <Card label="⌀ Anime" val={avgA} color="#F5A623"/>
        <Card label="⌀ Manga" val={avgM} color="#F5A623"/>
      </div>

      <div style={{background:"#111927",border:"1px solid #ffffff0a",borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"#E94560",textTransform:"uppercase",letterSpacing:".07em",marginBottom:14}}>🎬 Anime Status</div>
        {STATUS_A.map(s=>(ac[s]?<SBar key={s} label={s} count={ac[s]} color={SC[s]} total={anime.length}/>:null))}
      </div>
      <div style={{background:"#111927",border:"1px solid #ffffff0a",borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9B59B6",textTransform:"uppercase",letterSpacing:".07em",marginBottom:14}}>📚 Manga Status</div>
        {STATUS_M.map(s=>(mc[s]?<SBar key={s} label={s} count={mc[s]} color={SC[s]} total={manga.length}/>:null))}
      </div>

      {(favA.length>0||favM.length>0)&&(
        <div style={{background:"#1a1306",border:"1px solid #F5A62325",borderRadius:12,padding:"16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#F5A623",textTransform:"uppercase",letterSpacing:".07em",marginBottom:14}}>⭐ 10/10 Favoriten</div>
          {favA.map((a,i)=>(
            <div key={a.id} style={{display:"flex",gap:8,marginBottom:7}}>
              <span style={{color:"#F5A623",fontWeight:800,fontSize:12,minWidth:22}}>#{i+1}</span>
              <span style={{fontSize:13,color:"#ddd",lineHeight:1.4}}>🎬 {a.title}</span>
            </div>
          ))}
          {favM.map((m,i)=>(
            <div key={m.id} style={{display:"flex",gap:8,marginBottom:7}}>
              <span style={{color:"#F5A623",fontWeight:800,fontSize:12,minWidth:22}}>#{i+1}</span>
              <span style={{fontSize:13,color:"#ddd",lineHeight:1.4}}>📚 {m.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [anime, setAnime] = useState(()=>load(STORAGE_KEY_A, INIT_ANIME));
  const [manga, setManga] = useState(()=>load(STORAGE_KEY_M, INIT_MANGA));
  const [tab, setTab] = useState("anime");
  const [statusF, setStatusF] = useState("Alle");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(null);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle"|"syncing"|"ok"|"error"|"offline"
  const [syncMsg, setSyncMsg] = useState("");
  const syncTimer = useRef(null);

  // ── On mount: load from Supabase if configured ──────────────────────────
  useEffect(() => {
    if (!USE_SUPABASE) {
      setSyncStatus("offline");
      setSyncMsg("Kein Supabase – lokaler Speicher aktiv");
      return;
    }
    setSyncStatus("syncing");
    setSyncMsg("Lade Daten…");
    Promise.all([loadFromSupabase("anime"), loadFromSupabase("manga")])
      .then(([a, m]) => {
        if (a && a.length > 0) {
          setAnime(a);
          save(STORAGE_KEY_A, a);
        } else {
          // First time: seed Supabase with local data
          const local = load(STORAGE_KEY_A, INIT_ANIME);
          setSyncMsg("Erste Sync – lade hoch…");
          initSupabase("anime", local).then(() => setAnime(local));
        }
        if (m && m.length > 0) {
          setManga(m);
          save(STORAGE_KEY_M, m);
        } else {
          const local = load(STORAGE_KEY_M, INIT_MANGA);
          initSupabase("manga", local).then(() => setManga(local));
        }
        setSyncStatus("ok");
        setSyncMsg("Synchronisiert");
        setTimeout(() => setSyncStatus("idle"), 3000);
      })
      .catch(err => {
        console.error("Supabase load error:", err);
        setSyncStatus("error");
        setSyncMsg("Sync fehlgeschlagen – offline");
      });
  }, []);

  // ── Save to localStorage always ──────────────────────────────────────────
  useEffect(()=>{ save(STORAGE_KEY_A, anime); }, [anime]);
  useEffect(()=>{ save(STORAGE_KEY_M, manga); }, [manga]);

  // ── Debounced sync single item to Supabase ───────────────────────────────
  const syncItem = useCallback((table, item) => {
    if (!USE_SUPABASE) return;
    clearTimeout(syncTimer.current);
    setSyncStatus("syncing");
    syncTimer.current = setTimeout(() => {
      upsertToSupabase(table, item)
        .then(() => {
          setSyncStatus("ok");
          setSyncMsg("Gespeichert ✓");
          setTimeout(() => setSyncStatus("idle"), 2000);
        })
        .catch(err => {
          console.error("Sync error:", err);
          setSyncStatus("error");
          setSyncMsg("Sync fehlgeschlagen");
        });
    }, 600);
  }, []);

  const updateAnime = (item) => {
    setAnime(prev => prev.map(a => a.id===item.id ? item : a));
    syncItem("anime", item);
  };
  const updateManga = (item) => {
    setManga(prev => prev.map(m => m.id===item.id ? item : m));
    syncItem("manga", item);
  };
  const addAnime = (item) => {
    setAnime(prev => [...prev, item]);
    if (USE_SUPABASE) upsertToSupabase("anime", item).catch(console.error);
  };
  const addManga = (item) => {
    setManga(prev => [...prev, item]);
    if (USE_SUPABASE) upsertToSupabase("manga", item).catch(console.error);
  };

  const statuses = tab==="manga" ? STATUS_M : STATUS_A;

  const rows = useMemo(()=>{
    let data = tab==="anime" ? anime : tab==="manga" ? manga : [];
    if (statusF!=="Alle") data = data.filter(x=>x.status===statusF);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(x=>x.title.toLowerCase().includes(q));
    }
    return [...data].sort((a,b)=>{
      let va=a[sortBy]||0, vb=b[sortBy]||0;
      if(typeof va==="string"){va=va.toLowerCase();vb=(vb||"").toLowerCase();}
      if(va<vb) return sortDir==="asc"?-1:1;
      if(va>vb) return sortDir==="asc"?1:-1;
      return 0;
    });
  },[tab,anime,manga,statusF,search,sortBy,sortDir]);

  const acc = tab==="anime" ? "#E94560" : "#9B59B6";

  return (
    <div style={{
      minHeight:"100vh", background:"#080d18",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      color:"#e0e0e0", maxWidth:480, margin:"0 auto",
    }}>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#0c1220 0%,#150a28 100%)",
        borderBottom:"1px solid #ffffff0a",
        padding:"16px 18px 0",
        position:"sticky", top:0, zIndex:100,
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{
              fontSize:20, fontWeight:900, letterSpacing:".06em",
              background:"linear-gradient(90deg,#E94560,#9B59B6)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>⛩ NELURACKER</div>
            <div style={{fontSize:10,letterSpacing:".08em",color:
              syncStatus==="ok"?"#2ECC71":
              syncStatus==="syncing"?"#F5A623":
              syncStatus==="error"?"#E74C3C":
              syncStatus==="offline"?"#555":"#555"
            }}>
              {syncStatus==="syncing"?"⟳ "+syncMsg:
               syncStatus==="ok"?"✓ "+syncMsg:
               syncStatus==="error"?"✕ "+syncMsg:
               syncStatus==="offline"?"⚡ Offline":
               "Anime & Manga Tracker"}
            </div>
          </div>
          <button
            onClick={() => setAdding(tab==="stats" ? "anime" : tab)}
            style={{
              padding:"9px 16px", border:"none", borderRadius:22,
              background:`linear-gradient(135deg,${acc},${acc}cc)`,
              color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit", letterSpacing:".04em",
            }}
          >+ Neu</button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex", gap:0}}>
          {[["anime","🎬","Anime",anime.length],["manga","📚","Manga",manga.length],["stats","📊","Stats",null]].map(([id,icon,label,count])=>(
            <button key={id} onClick={()=>{setTab(id);setStatusF("Alle");setSearch("");}} style={{
              flex:1, padding:"10px 4px", border:"none", borderBottom:`2px solid ${tab===id?(id==="anime"?"#E94560":id==="manga"?"#9B59B6":"#F5A623"):"transparent"}`,
              background:"transparent", color:tab===id?(id==="anime"?"#E94560":id==="manga"?"#9B59B6":"#F5A623"):"#555",
              fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              letterSpacing:".03em", transition:"all .2s",
            }}>{icon} {label}{count!=null?` (${count})`:""}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 14px 100px"}}>
        {tab==="stats" ? <StatsView anime={anime} manga={manga}/> : (
          <>
            {/* Search */}
            <div style={{position:"relative",marginBottom:10}}>
              <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#555",fontSize:13,pointerEvents:"none"}}>🔍</span>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder={`Suche...`}
                style={{
                  width:"100%",padding:"10px 12px 10px 34px",
                  background:"#111927",border:"1px solid #ffffff0a",
                  borderRadius:10,color:"#ddd",fontSize:14,outline:"none",
                  fontFamily:"inherit",boxSizing:"border-box",
                }}
              />
            </div>

            {/* Sort bar */}
            <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
              {[["title","A–Z"],["score","Score"],["status","Status"],["watched","Gesehen"],["read","Gelesen"]].filter(([k])=> tab==="anime" ? k!=="read" : k!=="watched").map(([k,l])=>(
                <button key={k} onClick={()=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("asc");}}} style={{
                  padding:"5px 12px",border:`1px solid ${sortBy===k?acc:"#ffffff12"}`,
                  borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:700,
                  background:sortBy===k?acc+"22":"transparent",
                  color:sortBy===k?acc:"#666",
                  fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,
                }}>{l} {sortBy===k?(sortDir==="asc"?"↑":"↓"):""}</button>
              ))}
            </div>

            {/* Status filter chips */}
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
              {["Alle",...statuses].map(s=>{
                const c=SC[s]||acc;
                const on=statusF===s;
                return (
                  <button key={s} onClick={()=>setStatusF(s)} style={{
                    padding:"5px 12px",border:`1px solid ${on?c:"#ffffff0d"}`,
                    borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:700,
                    background:on?c+"22":"transparent",
                    color:on?c:"#555",
                    fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,
                  }}>{s}</button>
                );
              })}
            </div>

            <div style={{fontSize:11,color:"#444",marginBottom:10}}>{rows.length} Einträge</div>

            {rows.map(item =>
              tab==="anime"
                ? <AnimeCard key={item.id} item={item} onChange={updateAnime} allAnimeRef={anime} allMangaRef={manga}/>
                : <MangaCard key={item.id} item={item} onChange={updateManga} allAnimeRef={anime} allMangaRef={manga}/>
            )}
            {rows.length===0 && (
              <div style={{textAlign:"center",color:"#444",fontSize:14,fontStyle:"italic",padding:"48px 0"}}>Keine Einträge gefunden</div>
            )}
          </>
        )}
      </div>

      {adding && (
        <AddModal
          type={adding}
          onClose={() => setAdding(null)}
          onAdd={adding==="anime" ? addAnime : addManga}
        />
      )}
    </div>
  );
}
