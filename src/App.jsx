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
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth < 720);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 720);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

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

// INIT data loaded from external JSON files (reduces bundle by ~110KB)
let INIT_ANIME = [];
let INIT_MANGA = [];
const _loadInit = async () => {
  try {
    const [a, m] = await Promise.all([
      fetch(new URL('./init_anime.json', import.meta.url)).then(r => r.json()),
      fetch(new URL('./init_manga.json', import.meta.url)).then(r => r.json()),
    ]);
    INIT_ANIME = a;
    INIT_MANGA = m;
  } catch (e) {
    console.error('Failed to load INIT data:', e);
  }
};
const _initReady = _loadInit();



const STATUS_A     = ["Am Schauen","Abgeschlossen","Geplant","Pausiert","Abgebrochen"];
const STATUS_M     = ["Am Lesen","Abgeschlossen","Geplant","Pausiert","Abgebrochen"];
const FORMATS      = ["TV","Movie","OVA","ONA","Special","TV Special","Music","Musik"];
const TYPES        = ["Manga","Manhwa","Manhua","One-Shot","Novel","Light Novel"];
const REL_TYPES    = ["Sequel","Prequel","Adaption","Side Story","Spin-off"];
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
    return (rel.entry || []).map(e => ({
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
  // Upsert all initial rows in one batch
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

function scoreColor(s) {
  return s >= 9 ? "#F5A623" : s >= 7 ? "#2ECC71" : s >= 5 ? "#3498DB" : "#E74C3C";
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

function Stepper({ label, value, max, onInc, onDec, accent }) {
  const theme = useTheme();
  const acc = accent || theme.accentAnime;
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

const _btnS = (bg) => ({
  width: 22, height: 22, borderRadius: "50%", border: "none", background: bg,
  color: "#fff", fontSize: 13, cursor: "pointer", lineHeight: 1, padding: 0,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
});

// ─── EntryCard (unified Anime + Manga) ───────────────────────────────────────
function EntryCard({ item, onChange, onDelete, allAnimeRef, allMangaRef, isOpen, onToggle, isAnime }) {
  const theme = useTheme();
  const c = SC[item.status] || "#666";
  const sc = item.score > 0 ? scoreColor(item.score) : "#444";
  const acc = isAnime ? theme.accentAnime : theme.accentManga;
  const upd = (f, v) => onChange({ ...item, [f]: v });

  const pct = isAnime
    ? (item.eps ? Math.min(100, Math.round(((item.watched||0)/item.eps)*100)) : 0)
    : (item.chapters ? Math.min(100, Math.round(((item.read||0)/item.chapters)*100)) : 0);
  const pctVol = item.volumes ? Math.min(100, Math.round(((item.readVols||0)/item.volumes)*100)) : 0;
  const hasVols = !isAnime && item.volumes > 0;

  const mainVal = isAnime ? (item.watched||0) : (item.read||0);
  const mainMax = isAnime ? item.eps : item.chapters;

  const malUrl = item.mal_id
    ? `https://myanimelist.net/${isAnime ? "anime" : "manga"}/${item.mal_id}`
    : null;

  const btnS = _btnS;

  const statuses = isAnime ? STATUS_A : STATUS_M;
  const formatList = isAnime ? FORMATS : TYPES;
  const formatKey = isAnime ? "format" : "type";
  const formatLabel = isAnime ? "Format" : "Typ";

  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${isOpen ? acc+"44" : "#ffffff08"}`, transition: "border-color .2s" }}>

      {/* ── Collapsed row ── */}
      <div style={{ display: "flex" }}>
        {/* Cover — links to MAL if mal_id exists, otherwise just visual */}
        {item.image_url ? (
          <a href={malUrl || undefined} target={malUrl ? "_blank" : undefined} rel={malUrl ? "noopener noreferrer" : undefined}
            onClick={e => { if (!malUrl) { e.preventDefault(); onToggle(); } }}
            style={{ width: 64, flexShrink: 0, cursor: "pointer", position: "relative", display: "block", textDecoration: "none" }}>
            <img src={item.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
              pointerEvents: "none" }} />
            {item.score > 0 && (
              <div style={{ position: "absolute", bottom: 3, left: 0, right: 0,
                display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: sc, lineHeight: 1,
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,1)) drop-shadow(0 0px 12px rgba(0,0,0,0.8))" }}>{item.score}</span>
              </div>
            )}
            {malUrl && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity .2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>MAL ↗</span>
              </div>
            )}
          </a>
        ) : (
          /* No image — show score in text instead */
          <div onClick={onToggle} style={{ width: 48, flexShrink: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#ffffff04" }}>
            {item.score > 0 ? (
              <span style={{ fontSize: 22, fontWeight: 900, color: sc }}>{item.score}</span>
            ) : (
              <span style={{ fontSize: 11, color: "#333" }}>▼</span>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: "9px 12px 9px 11px", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Badges + Season */}
          <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#ffffff12", color: "#777", fontWeight: 600 }}>
              {isAnime ? (item.format||"TV") : (item.type||"Manga")}
            </span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: c+"22", color: c, fontWeight: 700 }}>{item.status}</span>
            {item.source && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#ffffff08", color: "#555", fontWeight: 500 }}>{item.source}</span>
            )}
            {isAnime && item.season && item.year && (
              <span style={{ fontSize: 9, color: "#444", marginLeft: "auto" }}>{item.season} {item.year}</span>
            )}
          </div>

          {/* Title */}
          <div onClick={onToggle} style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e8",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", marginBottom: 2 }}>{item.title}</div>

          {/* Genres inline */}
          {Array.isArray(item.genres) && item.genres.length > 0 && (
            <div style={{ fontSize: 10, color: "#444", marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.genres.join(" · ")}
            </div>
          )}

          {/* Main progress + stepper */}
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hasVols ? 5 : 0 }}>
            <div style={{ flex: 1, height: 5, background: "#ffffff10", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 3, transition: "width .3s" }} />
            </div>
            <span style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap", minWidth: 50, textAlign: "right" }}>
              {mainVal}/{mainMax||"?"} {isAnime ? "Ep" : "Kap"}
            </span>
            <button onClick={e => { e.stopPropagation(); if (isAnime) upd("watched", Math.max(0,(item.watched||0)-1)); else upd("read", Math.max(0,(item.read||0)-1)); }} style={btnS("#ffffff10")}>
              <span style={{ color: "#aaa" }}>−</span>
            </button>
            <button onClick={e => { e.stopPropagation(); if (isAnime) upd("watched", Math.min((item.watched||0)+1, item.eps||9999)); else upd("read", Math.min((item.read||0)+1, item.chapters||9999)); }} style={btnS(acc)}>
              <span>+</span>
            </button>
          </div>

          {/* Volumes row (manga only) */}
          {hasVols && (
            <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 4, background: "#ffffff10", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pctVol}%`, height: "100%", background: c+"77", borderRadius: 3, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 10, color: "#444", whiteSpace: "nowrap", minWidth: 50, textAlign: "right" }}>
                {item.readVols||0}/{item.volumes} Bd
              </span>
              <button onClick={e => { e.stopPropagation(); upd("readVols", Math.max(0,(item.readVols||0)-1)); }} style={btnS("#ffffff10")}>
                <span style={{ color: "#aaa" }}>−</span>
              </button>
              <button onClick={e => { e.stopPropagation(); upd("readVols", Math.min((item.readVols||0)+1, item.volumes||9999)); }} style={btnS(acc+"88")}>
                <span>+</span>
              </button>
            </div>
          )}

          {/* Watch/Read link button */}
          {item.watch_url && /^https?:\/\//i.test(item.watch_url) && (
            <a href={item.watch_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "4px 10px",
                background: acc + "18", border: `1px solid ${acc}33`, borderRadius: 14, textDecoration: "none",
                fontSize: 10, fontWeight: 700, color: acc, cursor: "pointer", alignSelf: "flex-start" }}>
              {isAnime ? "▶ Schauen" : "📖 Lesen"}
            </a>
          )}
        </div>
      </div>

      {/* ── Expanded ── */}
      {isOpen && (
        <div onClick={e => e.stopPropagation()} style={{ padding: "4px 14px 14px", borderTop: "1px solid #ffffff08" }}>

          {/* Genre chips */}
          {Array.isArray(item.genres) && item.genres.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8, marginBottom: 10 }}>
              {item.genres.map(g => (
                <span key={g} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 8,
                  background: acc+"15", color: acc, fontWeight: 600 }}>{g}</span>
              ))}
            </div>
          )}

          {/* Metadata grid (only if MAL data exists) */}
          {(item.mal_score || (isAnime ? item.studios : item.authors) || item.duration || item.rating) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#ffffff06", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              {[
                ["MAL Score", item.mal_score != null && item.mal_score > 0 ? `${item.mal_score} / 10` : null],
                [isAnime ? "Studio" : "Autor", isAnime ? (Array.isArray(item.studios) ? item.studios : []).join(", ") : (Array.isArray(item.authors) ? item.authors : []).join(", ")],
                [isAnime ? "Dauer" : "Demografie", isAnime ? item.duration : (Array.isArray(item.demographics) ? item.demographics : []).join(", ")],
                ["Altersfreigabe", item.rating],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} style={{ padding: "8px 11px", background: theme.bgCard }}>
                  <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 1 }}>{k}</div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Title + Subtitle inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "6px 0 4px" }}>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Titel</div>
              <input value={item.title||""} onChange={e => upd("title", e.target.value)} onClick={e => e.stopPropagation()}
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Untertitel / Romaji</div>
              <input value={item.subtitle||""} onChange={e => upd("subtitle", e.target.value)} onClick={e => e.stopPropagation()}
                placeholder={isAnime ? "z.B. Shingeki no Kyojin" : "z.B. Boku no Hero Academia"}
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Steppers + Number inputs */}
          {isAnime ? (
            <>
              <Stepper label="Gesehen" value={item.watched||0} max={item.eps||null} accent={acc}
                onInc={() => upd("watched", Math.min((item.watched||0)+1, item.eps||9999))}
                onDec={() => upd("watched", Math.max(0,(item.watched||0)-1))} />
              <NumberInput label="Gesamt Episoden" value={item.eps||0} onChange={v => upd("eps", v)} />
            </>
          ) : (
            <>
              <Stepper label="Kapitel gelesen" value={item.read||0} max={item.chapters||null} accent={acc}
                onInc={() => upd("read", Math.min((item.read||0)+1, item.chapters||9999))}
                onDec={() => upd("read", Math.max(0,(item.read||0)-1))} />
              <Stepper label="Bände gelesen" value={item.readVols||0} max={item.volumes||null} accent={acc}
                onInc={() => upd("readVols", Math.min((item.readVols||0)+1, item.volumes||9999))}
                onDec={() => upd("readVols", Math.max(0,(item.readVols||0)-1))} />
              <NumberInput label="Gesamt Kapitel" value={item.chapters||0} onChange={v => upd("chapters", v)} />
              <NumberInput label="Gesamt Bände" value={item.volumes||0} onChange={v => upd("volumes", v)} />
            </>
          )}

          {/* Star Rating */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid #ffffff08" }}>
            <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: ".06em" }}>Bewertung</span>
            <StarRating value={item.score||0} onChange={v => upd("score", v)} />
          </div>

          {/* Status buttons */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {statuses.map(s => (
                <button key={s} onClick={() => upd("status", s)} style={{ padding: "5px 11px", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 20,
                  border: `1px solid ${item.status===s ? (SC[s]||acc) : "#ffffff15"}`,
                  background: item.status===s ? (SC[s]||acc)+"22" : "transparent",
                  color: item.status===s ? (SC[s]||acc) : "#666" }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Format / Type buttons */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{formatLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {formatList.map(f => (
                <button key={f} onClick={() => upd(formatKey, f)} style={{ padding: "5px 11px", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 20,
                  border: `1px solid ${item[formatKey]===f ? acc : "#ffffff15"}`,
                  background: item[formatKey]===f ? acc+"22" : "transparent",
                  color: item[formatKey]===f ? acc : "#666" }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 10 }}>
            <textarea value={item.notes||""} onChange={e => upd("notes", e.target.value)} rows={2} placeholder="Notizen..."
              style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff10", borderRadius: 8, padding: "8px 10px", color: "#ccc", fontSize: 13, fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
          </div>

          {/* Watch/Read URL */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
              {isAnime ? "Schauen auf" : "Lesen auf"} <span style={{ fontSize: 9, color: "#444", textTransform: "none", fontWeight: 400 }}>(Link zur Quelle)</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input value={item.watch_url||""} onChange={e => upd("watch_url", e.target.value)} onClick={e => e.stopPropagation()}
                placeholder={isAnime ? "z.B. https://crunchyroll.com/..." : "z.B. https://mangadex.org/..."}
                style={{ flex: 1, background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              {item.watch_url && /^https?:\/\//i.test(item.watch_url) && (
                <a href={item.watch_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ padding: "6px 12px", background: acc + "22", border: `1px solid ${acc}44`, borderRadius: 8,
                    color: acc, fontSize: 11, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Öffnen ↗
                </a>
              )}
            </div>
            {item.watch_url && (
              <div style={{ fontSize: 10, color: "#444", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(() => { try { return new URL(item.watch_url).hostname; } catch { return ""; } })()}
              </div>
            )}
          </div>

          {/* Related Works */}
          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent={acc} />

          {/* Shop Link (Manga only) */}
          {!isAnime && (
            <a href={`https://www.mangapassion.de/suche?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: "inline-block", marginTop: 8, padding: "6px 14px", borderRadius: 10, background: "#F5A62322", border: "1px solid #F5A62344",
                color: "#F5A623", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
              🛒 MangaPassion ↗
            </a>
          )}

          {/* Delete */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #ffffff08" }}>
            <button onClick={() => { if (window.confirm(`"${item.title}" wirklich löschen?`)) onDelete(item.id); }}
              style={{ padding: "7px 16px", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer",
                borderRadius: 20, border: "1px solid #E74C3C44", background: "#E74C3C11", color: "#E74C3C" }}>
              Eintrag löschen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Mobile Cover Card ────────────────────────────────────────────────────────
function MobileCoverCard({ item, isAnime, accent, onTap, onStep }) {
  const c = SC[item.status] || "#666";
  const hasVols = !isAnime && item.volumes > 0;
  const [mode, setMode] = useState("ch");
  const val = isAnime ? (item.watched||0) : (mode === "ch" ? (item.read||0) : (item.readVols||0));
  const max = isAnime ? (item.eps||0) : (mode === "ch" ? (item.chapters||0) : (item.volumes||0));
  const pct = max ? Math.round((val / max) * 100) : 0;
  const field = isAnime ? "watched" : (mode === "ch" ? "read" : "readVols");
  const bottomTitle = (!isAnime && !hasVols) ? 60 : (isAnime ? 60 : 85);
  const sc = item.score > 0 ? scoreColor(item.score) : "#444";
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", background: "#111927", border: "1px solid #ffffff08" }}>
      <div style={{ position: "relative", height: 240, overflow: "hidden", cursor: "pointer" }} onClick={onTap}>
        {item.image_url ? (
          <img src={item.image_url} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${accent}44 0%, #111927 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 28, opacity: 0.15, fontWeight: 900, color: "#fff" }}>{(item.title||"").substring(0, 3).toUpperCase()}</span>
          </div>
        )}
        {item.score > 0 && (
          <div style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: sc }}>{item.score}</span>
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
          <span style={{ padding: "2px 6px", borderRadius: 6, background: "#000000aa", fontSize: 9, color: accent, fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
          <span style={{ padding: "2px 7px", borderRadius: 6, background: c + "cc", fontSize: 9, color: "#fff", fontWeight: 700 }}>
            {item.status === "Am Schauen" || item.status === "Am Lesen" ? "▶" : item.status === "Abgeschlossen" ? "✓" : item.status === "Geplant" ? "◇" : item.status === "Pausiert" ? "⏸" : "✕"}
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #000000ee 0%, #000000bb 40%, transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: bottomTitle, left: 10, right: 10, fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
        {!isAnime && hasVols && (
          <div style={{ position: "absolute", bottom: 60, left: 10, right: 10, display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); setMode("ch"); }} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: mode === "ch" ? c + "44" : "#ffffff11", color: mode === "ch" ? c : "#666" }}>Kapitel</button>
            <button onClick={e => { e.stopPropagation(); setMode("vol"); }} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: mode === "vol" ? c + "44" : "#ffffff11", color: mode === "vol" ? c : "#666" }}>Bände</button>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 52, left: 10, right: 10, height: 3, background: "#ffffff20", borderRadius: 2 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 2, transition: "width .3s" }} />
        </div>
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onStep(field, Math.max(0, val - 1))} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #ffffff33", background: "#00000088", color: "#ddd", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <div><span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{val}</span><span style={{ fontSize: 11, color: "#999" }}>/{max || "?"} {isAnime ? "Ep" : (mode === "ch" ? "Kap" : "Bd")}</span></div>
          <button onClick={() => onStep(field, Math.min(val + 1, max || 9999))} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: c, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 12px ${c}88` }}>+</button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Bottom Sheet (V2 Sektionen) ──────────────────────────────────────
function MobileBottomSheet({ item, isAnime, accent, onClose, onUpdate }) {
  if (!item) return null;
  const c = SC[item.status] || "#666";
  const statuses = isAnime ? STATUS_A : STATUS_M;
  const formatList = isAnime ? FORMATS : TYPES;
  const formatKey = isAnime ? "format" : "type";
  const malUrl = item.mal_id ? `https://myanimelist.net/${isAnime ? "anime" : "manga"}/${item.mal_id}` : null;
  const upd = (f, v) => onUpdate({ ...item, [f]: v });
  const sep = { height: 1, background: "#ffffff08", margin: "14px 0" };
  const numS = { flex: 1, padding: "9px 6px", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 10, color: "#e8e8e8", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "center", minWidth: 0 };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "#000000aa" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#111927", borderRadius: "20px 20px 0 0", boxShadow: "0 -16px 60px #000c", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}><div style={{ width: 36, height: 4, background: "#ffffff20", borderRadius: 2 }} /></div>
        <div style={{ padding: "4px 16px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#e8e8e8", flex: 1, marginRight: 10 }}>{item.title}</div>
            <button onClick={onClose} style={{ background: "#ffffff08", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#555", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: accent + "22", color: accent, fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
            {Array.isArray(item.genres) && item.genres.map(g => <span key={g} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: c + "15", color: c, fontWeight: 600 }}>{g}</span>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {malUrl && <a href={malUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#2E51A222", color: "#5B7FD4", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>MAL ↗</a>}
            {item.watch_url && /^https?:\/\//i.test(item.watch_url) ? (
              <a href={item.watch_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: c + "22", color: c, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>{isAnime ? "▶ Schauen ↗" : "📖 Lesen ↗"}</a>
            ) : (
              <div style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#ffffff06", color: "#333", fontSize: 12, fontWeight: 600, textAlign: "center" }}>Kein Link</div>
            )}
            {!isAnime && <a href={`https://www.mangapassion.de/suche?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#F5A62322", color: "#F5A623", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>🛒 Shop ↗</a>}
          </div>
          <div style={sep} />
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Bewertung</div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "4px 0" }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => upd("score", item.score === n ? 0 : n)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 22, color: n <= (item.score||0) ? "#F5A623" : "#222", flex: 1, display: "flex", justifyContent: "center" }}>★</button>
            ))}
          </div>
          <div style={sep} />
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {statuses.map(s => <button key={s} onClick={() => upd("status", s)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 16, border: `1px solid ${item.status === s ? SC[s] : "#ffffff12"}`, background: item.status === s ? SC[s] + "22" : "transparent", color: item.status === s ? SC[s] : "#444" }}>{s}</button>)}
          </div>
          <div style={sep} />
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, fontWeight: 700 }}>Fortschritt</div>
          {isAnime ? (
            <div>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Episoden</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" value={item.watched||0} onChange={e => upd("watched", Math.max(0, +e.target.value))} style={numS} />
                <span style={{ fontSize: 14, color: "#333", fontWeight: 600, flexShrink: 0 }}>/</span>
                <input type="number" value={item.eps||0} onChange={e => upd("eps", Math.max(0, +e.target.value))} style={numS} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
                <span style={{ fontSize: 8, color: "#444" }}>Gesehen</span><span style={{ fontSize: 8, color: "#444" }}>Gesamt</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Kapitel</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" value={item.read||0} onChange={e => upd("read", Math.max(0, +e.target.value))} style={numS} />
                  <span style={{ fontSize: 12, color: "#333", flexShrink: 0 }}>/</span>
                  <input type="number" value={item.chapters||0} onChange={e => upd("chapters", Math.max(0, +e.target.value))} style={numS} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, padding: "0 2px" }}>
                  <span style={{ fontSize: 8, color: "#444" }}>Gelesen</span><span style={{ fontSize: 8, color: "#444" }}>Gesamt</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Bände</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" value={item.readVols||0} onChange={e => upd("readVols", Math.max(0, +e.target.value))} style={numS} />
                  <span style={{ fontSize: 12, color: "#333", flexShrink: 0 }}>/</span>
                  <input type="number" value={item.volumes||0} onChange={e => upd("volumes", Math.max(0, +e.target.value))} style={numS} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, padding: "0 2px" }}>
                  <span style={{ fontSize: 8, color: "#444" }}>Gelesen</span><span style={{ fontSize: 8, color: "#444" }}>Gesamt</span>
                </div>
              </div>
            </div>
          )}
          <div style={sep} />
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>{isAnime ? "Format" : "Typ"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {formatList.map(f => <button key={f} onClick={() => upd(formatKey, f)} style={{ padding: "5px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 16, border: `1px solid ${item[formatKey] === f ? accent : "#ffffff12"}`, background: item[formatKey] === f ? accent + "22" : "transparent", color: item[formatKey] === f ? accent : "#444" }}>{f}</button>)}
          </div>
          <div style={sep} />
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Notizen & Links</div>
          <textarea value={item.notes || ""} onChange={e => upd("notes", e.target.value)} rows={2} placeholder="Notizen..."
            style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, padding: "8px 10px", color: "#bbb", fontSize: 12, fontFamily: "inherit", resize: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <input value={item.watch_url || ""} onChange={e => upd("watch_url", e.target.value)} placeholder={isAnime ? "https://crunchyroll.com/..." : "https://mangadex.org/..."}
            style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, color: "#888", fontSize: 11, padding: "7px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <input value={item.image_url || ""} onChange={e => upd("image_url", e.target.value)} placeholder="Cover-Bild URL (optional)"
            style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, color: "#888", fontSize: 11, padding: "7px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid #ffffff08" }}>
            <button onClick={() => { if (window.confirm(`"${item.title}" wirklich löschen?`)) { onUpdate(null); onClose(); } }}
              style={{ padding: "7px 16px", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 20, border: "1px solid #E74C3C44", background: "#E74C3C11", color: "#E74C3C" }}>
              Eintrag löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CardGrid ─────────────────────────────────────────────────────────────────
function CardGrid({ rows, tab, updateAnime, updateManga, deleteAnime, deleteManga, anime, manga, openId, toggleCard }) {
  const isMobile = useIsMobile();
  const theme = useTheme();
  const [mobileSheet, setMobileSheet] = useState(null);

  const renderCard = (item) => {
    const isOpen = openId !== null && openId.tab === tab && String(openId.id) === String(item.id);
    const isAnime = tab === "anime";
    return <EntryCard key={item.id} item={item} onChange={isAnime ? updateAnime : updateManga}
      onDelete={isAnime ? deleteAnime : deleteManga}
      allAnimeRef={anime} allMangaRef={manga} isOpen={isOpen} onToggle={() => toggleCard(item.id)} isAnime={isAnime} />;
  };

  const isAnimeTab = tab === "anime";
  const acc = isAnimeTab ? theme.accentAnime : theme.accentManga;
  const onChangeForItem = isAnimeTab ? updateAnime : updateManga;
  const onDeleteForItem = isAnimeTab ? deleteAnime : deleteManga;
  // Keep mobileSheet item in sync with latest data
  const sheetItem = mobileSheet ? rows.find(x => x.id === mobileSheet.id) || mobileSheet : null;

  return (
    <>
      {isMobile ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {rows.map(item => (
              <MobileCoverCard key={item.id} item={item} isAnime={isAnimeTab} accent={acc}
                onTap={() => setMobileSheet(item)}
                onStep={(field, val) => onChangeForItem({ ...item, [field]: val })} />
            ))}
          </div>
          {sheetItem && (
            <MobileBottomSheet item={sheetItem} isAnime={isAnimeTab} accent={acc}
              onClose={() => setMobileSheet(null)}
              onUpdate={updated => {
                if (updated === null) { onDeleteForItem(sheetItem.id); setMobileSheet(null); return; }
                onChangeForItem(updated);
              }} />
          )}
        </>
      ) : (
        <div className="card-grid-matter" style={{ gap: 8 }}>
          {rows.map(renderCard)}
        </div>
      )}
      <style>{`
        .card-grid-matter { display: flex; flex-direction: column; }
        @media (min-width: 720px) {
          .card-grid-matter { columns: 2; display: block; }
          .card-grid-matter > * { break-inside: avoid; margin-bottom: 8px; }
        }
        .hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </>
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
  const [status, setStatus] = useState(isAnime ? "Am Schauen" : "Am Lesen");
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
        genres: (data.genres || []).map(g => g.name),
        mal_score: data.score || null,
        rating: data.rating || null,
      };
      if (isAnime) {
        meta.studios = (data.studios || []).map(s => s.name);
        meta.season = data.season ? data.season.charAt(0).toUpperCase() + data.season.slice(1) : null;
        meta.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null);
        meta.source = data.source || null;
        meta.duration = data.duration || null;
      } else {
        meta.authors = (data.authors || []).map(a => a.name);
        meta.demographics = (data.demographics || []).map(d => d.name);
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

        {/* Custom cover URL */}
        <div style={{ marginBottom: 14, padding: "12px 14px", background: "#0a1020", borderRadius: 12, border: "1px solid #ffffff0a" }}>
          <div style={{ fontSize: 11, color: "#3498DB", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>
            Cover-Bild (optional)
          </div>
          <input value={malImage} onChange={e => { setMalImage(e.target.value); setMalMeta(m => ({ ...m, image_url: e.target.value })); }}
            placeholder="https://mangadex.org/covers/... oder beliebige Bild-URL"
            style={{ width: "100%", padding: "9px 11px", background: "#ffffff08", border: "1px solid #ffffff10",
              borderRadius: 8, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          {malImage && <img src={malImage} alt="" style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 4, marginTop: 6 }} onError={e => e.target.style.display = "none"} />}
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
              <Stepper label="Kapitel gelesen" value={read} max={chapters || null} accent={isAnime ? undefined : acc}
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
    s.onerror = () => console.warn("SheetJS konnte nicht geladen werden");
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
  const statsRows = ["Abgeschlossen","Am Schauen","Am Lesen","Geplant","Pausiert","Abgebrochen"].map(s => ({
    "Status": s, "Anime": anime.filter(a => a.status === s).length, "Manga": manga.filter(m => m.status === s).length,
  }));
  statsRows.push({ "Status": "GESAMT", "Anime": anime.length, "Manga": manga.length });
  const wb = XLSX.utils.book_new();
  const wsA = XLSX.utils.json_to_sheet(animeRows);
  const wsM = XLSX.utils.json_to_sheet(mangaRows);
  const wsS = XLSX.utils.json_to_sheet(statsRows);
  wsA["!cols"] = [{wch:14},{wch:40},{wch:30},{wch:8},{wch:14},{wch:10},{wch:10},{wch:13},{wch:10},{wch:8},{wch:30},{wch:14},{wch:20},{wch:14},{wch:30},{wch:30}];
  wsM["!cols"] = [{wch:14},{wch:40},{wch:30},{wch:10},{wch:14},{wch:14},{wch:14},{wch:13},{wch:13},{wch:13},{wch:10},{wch:8},{wch:30},{wch:20},{wch:30},{wch:30}];
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
  const results = (await res.json()).data || [];
  if (results.length === 0) return null;
  const lower = title.toLowerCase().trim();
  // Only accept exact title matches to prevent mixing up entries
  const exact = results.find(r =>
    (r.title || "").toLowerCase() === lower ||
    (r.title_english || "").toLowerCase() === lower ||
    (r.title_japanese || "").toLowerCase() === lower ||
    (r.titles || []).some(t => (t.title || "").toLowerCase() === lower)
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
    const items = [];
    const check = (entry, kind) => {
      for (const r of (entry.related || [])) {
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
    }).slice(0, 50);
  }, [anime, manga]);

  const resetAllRelated = () => {
    if (!window.confirm("Alle verwandten Werke zurücksetzen? Dieser Vorgang löscht alle Related-Verknüpfungen und gespeicherte MAL-IDs.")) return;
    anime.forEach(a => {
      const cleaned = { ...a, related: [] };
      delete cleaned.mal_id;
      onUpdateAnime(cleaned);
    });
    manga.forEach(m => {
      const cleaned = { ...m, related: [] };
      delete cleaned.mal_id;
      onUpdateManga(cleaned);
    });
  };

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
        let malId = entry.mal_id;
        // Step 1: If no stored MAL ID, search by title
        if (!malId) {
          const searchResult = await searchMalId(entry._kind, entry.title);
          if (!searchResult) {
            // No MAL match found, skip
            continue;
          }
          malId = searchResult.mal_id;
        }
        // Step 2: Fetch full data using the real MAL ID
        const data = await fetchRelatedFull(entry._kind, malId);
        const MAP = {"Sequel":"Sequel","Prequel":"Prequel","Side story":"Side Story","Parent story":"Prequel",
          "Full story":"Sequel","Spin-off":"Spin-off","Alternative setting":"Alternative",
          "Alternative version":"Alternative","Adaptation":"Adaption","Summary":"Summary","Other":"Related","Character":"Related"};
        const related = (data.relations || []).flatMap(rel =>
          (rel.entry || []).map(e => ({
            id: e.mal_id, title: e.name, kind: e.type === "anime" ? "anime" : "manga",
            relType: MAP[rel.relation] || "Related",
          }))
        );
        // Build metadata from Jikan response
        const meta = {
          image_url: data.images?.jpg?.image_url || "",
          genres: (data.genres || []).map(g => g.name),
          mal_score: data.score || null,
          rating: data.rating || null,
        };
        if (entry._kind === "anime") {
          meta.studios = (data.studios || []).map(s => s.name);
          meta.season = data.season ? data.season.charAt(0).toUpperCase() + data.season.slice(1) : null;
          meta.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null);
          meta.source = data.source || null;
          meta.duration = data.duration || null;
        } else {
          meta.authors = (data.authors || []).map(a => a.name);
          meta.demographics = (data.demographics || []).map(d => d.name);
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
            {false && <button onClick={startBulkUpdate} style={{ padding: "8px 18px", border: "none", borderRadius: 20,
              cursor: "pointer", background: `linear-gradient(135deg,${theme.accentAnime},${theme.accentAnime}cc)`,
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
              {bulkState === "done" ? "Erneut aktualisieren" : "Jetzt aktualisieren"}
            </button>}
            {false && <button onClick={resetAllRelated} style={{ padding: "8px 18px", border: "1px solid #E74C3C44",
              borderRadius: 20, cursor: "pointer", background: "#E74C3C11",
              color: "#E74C3C", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
              Alle zurücksetzen
            </button>}
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
function RecommendationsView({ anime, manga, cache = null, onCache = null }) {
  const theme = useTheme();
  const [recs, setRecs] = useState(cache?.recs || []);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!!cache);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [filterGenre, setFilterGenre] = useState("Alle");
  const [filterKind, setFilterKind] = useState("all"); // all, anime, manga
  const abortRef = useRef(false);

  const topRated = useMemo(() => [
    ...anime.filter(a => a.score >= 9 && a.mal_id).map(a => ({ ...a, _kind: "anime" })),
    ...manga.filter(m => m.score >= 9 && m.mal_id).map(m => ({ ...m, _kind: "manga" })),
  ], [anime, manga]);

  // Titles already in library for dedup
  const libraryTitles = useMemo(() => {
    const s = new Set();
    anime.forEach(a => { s.add(a.title.toLowerCase()); if (a.mal_id) s.add(String(a.mal_id)); });
    manga.forEach(m => { s.add(m.title.toLowerCase()); if (m.mal_id) s.add(String(m.mal_id)); });
    return s;
  }, [anime, manga]);

  const fetchRecs = async () => {
    abortRef.current = false;
    setLoading(true);
    setProgress({ done: 0, total: topRated.length, current: "" });
    const allRecs = [];
    const seen = new Set();
    let retryBudget = 10; // max total retries across all entries
    for (let i = 0; i < topRated.length; i++) {
      if (abortRef.current) break;
      const entry = topRated[i];
      setProgress({ done: i, total: topRated.length, current: entry.title });
      try {
        await new Promise(r => setTimeout(r, 400));
        const res = await fetch(`https://api.jikan.moe/v4/${entry._kind}/${entry.mal_id}/recommendations`);
        if (res.status === 429 && retryBudget > 0) { retryBudget--; await new Promise(r => setTimeout(r, 2000)); i--; continue; }
        if (!res.ok) continue;
        const data = (await res.json()).data || [];
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
    // Fetch genres for top recs (up to 20)
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
    if (onCache) onCache({ recs: topN });
  };

  const recGenres = useMemo(() => {
    const s = new Set();
    recs.forEach(r => (r.genres || []).forEach(g => s.add(g)));
    return [...s].sort();
  }, [recs]);

  const filtered = useMemo(() => {
    let d = recs;
    if (filterKind !== "all") d = d.filter(r => r.kind === filterKind);
    if (filterGenre !== "Alle") d = d.filter(r => (r.genres || []).includes(filterGenre));
    return d;
  }, [recs, filterKind, filterGenre]);

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #ffffff08" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8", marginBottom: 6 }}>Empfehlungen generieren</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.6 }}>
          Basierend auf deinen <span style={{ color: "#F5A623", fontWeight: 700 }}>{topRated.length}</span> Einträgen mit 9/10 oder 10/10.
          Sucht MAL-Empfehlungen und filtert bereits vorhandene Titel heraus.
        </div>
        {loading && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 5 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%", color: "#aaa" }}>{progress.current}</span>
              <span style={{ color: "#F5A623", fontWeight: 700, flexShrink: 0 }}>{progress.done}/{progress.total} ({pct}%)</span>
            </div>
            <div style={{ height: 6, background: "#ffffff10", borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, transition: "width .3s",
                background: `linear-gradient(90deg,#F5A623,#E94560)` }} />
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {!loading ? (
            <button onClick={fetchRecs} disabled={topRated.length === 0} style={{ padding: "8px 18px", border: "none", borderRadius: 20,
              cursor: topRated.length ? "pointer" : "default", background: topRated.length ? "linear-gradient(135deg,#F5A623,#E94560)" : "#333",
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit", opacity: topRated.length ? 1 : 0.5 }}>
              {loaded ? "Erneut laden" : "Empfehlungen laden"}
            </button>
          ) : (
            <button onClick={() => { abortRef.current = true; }} style={{ padding: "8px 18px", border: "none",
              borderRadius: 20, cursor: "pointer", background: "#333", color: "#aaa",
              fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Abbrechen</button>
          )}
        </div>
        {topRated.length === 0 && (
          <div style={{ fontSize: 11, color: "#E74C3C", marginTop: 8 }}>
            Keine Einträge mit 9/10 oder 10/10 und MAL-ID gefunden. Starte zuerst ein Bulk-Update im Updates-Tab.
          </div>
        )}
      </div>

      {loaded && recs.length > 0 && (
        <>
          {/* Filters */}
          <div className="hide-scroll" style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
            {[["all","Alle"],["anime","Anime"],["manga","Manga"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilterKind(k)} style={{ padding: "5px 12px", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                cursor: "pointer", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0,
                border: `1px solid ${filterKind === k ? "#F5A623" : "#ffffff12"}`,
                background: filterKind === k ? "#F5A62322" : "transparent",
                color: filterKind === k ? "#F5A623" : "#666" }}>{l}</button>
            ))}
          </div>
          {recGenres.length > 0 && (
            <div className="hide-scroll" style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
              <button onClick={() => setFilterGenre("Alle")} style={{ padding: "4px 10px", fontFamily: "inherit", fontSize: 10, fontWeight: 700,
                cursor: "pointer", borderRadius: 16, whiteSpace: "nowrap", flexShrink: 0,
                border: `1px solid ${filterGenre === "Alle" ? "#F5A623" : "#ffffff0d"}`,
                background: filterGenre === "Alle" ? "#F5A62322" : "transparent",
                color: filterGenre === "Alle" ? "#F5A623" : "#555" }}>Alle</button>
              {recGenres.map(g => (
                <button key={g} onClick={() => setFilterGenre(g)} style={{ padding: "4px 10px", fontFamily: "inherit", fontSize: 10, fontWeight: 600,
                  cursor: "pointer", borderRadius: 16, whiteSpace: "nowrap", flexShrink: 0,
                  border: `1px solid ${filterGenre === g ? "#F5A623" : "#ffffff0d"}`,
                  background: filterGenre === g ? "#F5A62322" : "transparent",
                  color: filterGenre === g ? "#F5A623" : "#555" }}>{g}</button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#444", marginBottom: 10 }}>{filtered.length} Empfehlungen</div>
          {filtered.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", gap: 10, background: theme.bgCard, borderRadius: 12, marginBottom: 8,
                border: "1px solid #ffffff08", overflow: "hidden", transition: "border-color .2s" }}>
                {r.image && <img src={r.image} alt="" loading="lazy" style={{ width: 48, height: 68, objectFit: "cover", flexShrink: 0 }} />}
                <div style={{ flex: 1, padding: "8px 10px 8px 0", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700,
                      background: r.kind === "anime" ? "#E9456018" : "#9B59B618",
                      color: r.kind === "anime" ? "#E94560" : "#9B59B6" }}>{r.kind === "anime" ? "Anime" : "Manga"}</span>
                    {r.score && <span style={{ fontSize: 9, color: "#F5A623", fontWeight: 700 }}>★ {r.score}</span>}
                    {r.votes > 0 && <span style={{ fontSize: 9, color: "#444" }}>{r.votes} Stimmen</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{r.title}</div>
                  {r.genres && r.genres.length > 0 && (
                    <div style={{ fontSize: 9, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                      {r.genres.join(" · ")}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "#555" }}>
                    Weil du <span style={{ color: "#888" }}>{r.sourceTitle}</span> <span style={{ color: "#F5A623" }}>{r.sourceScore}/10</span> gabst
                  </div>
                </div>
              </div>
            </a>
          ))}
        </>
      )}
      {loaded && recs.length === 0 && !loading && (
        <div style={{ textAlign: "center", color: "#444", padding: "30px 0", fontSize: 13 }}>
          Keine neuen Empfehlungen gefunden — alle Vorschläge sind bereits in deiner Bibliothek.
        </div>
      )}
    </div>
  );
}

// ─── ScheduleView ────────────────────────────────────────────────────────────
function ScheduleView({ anime, autoFetch = false, cache = null, onCache = null }) {
  const theme = useTheme();
  const [schedule, setSchedule] = useState(cache?.schedule || []);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!!cache);

  const watching = useMemo(() => anime.filter(a => a.status === "Am Schauen" && a.mal_id), [anime]);

  const fetchSchedule = async () => {
    setLoading(true);
    const items = [];
    let retryBudget = 6;
    for (let i = 0; i < watching.length; i++) {
      try {
        await new Promise(r => setTimeout(r, 400));
        const res = await fetch(`https://api.jikan.moe/v4/anime/${watching[i].mal_id}`);
        if (res.status === 429 && retryBudget > 0) { retryBudget--; await new Promise(r => setTimeout(r, 2000)); i--; continue; }
        if (!res.ok) continue;
        const d = (await res.json()).data;
        items.push({
          title: watching[i].title,
          mal_id: watching[i].mal_id,
          image: watching[i].image_url || d.images?.jpg?.image_url || "",
          airing: d.airing || false,
          status: d.status || "",
          broadcast: d.broadcast || {},
          eps: d.episodes || watching[i].eps || 0,
          watched: watching[i].watched || 0,
          nextEp: (watching[i].watched || 0) + 1,
          airedFrom: d.aired?.from || null,
          airedTo: d.aired?.to || null,
        });
      } catch {}
    }
    setSchedule(items.sort((a, b) => {
      const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
      return (dayOrder[a.broadcast?.day] || 99) - (dayOrder[b.broadcast?.day] || 99);
    }));
    setLoading(false);
    setLoaded(true);
    if (onCache) onCache({ schedule: items });
  };

  // Auto-fetch on first render if autoFetch is true and there are watching anime
  const didAutoFetch = useRef(false);
  useEffect(() => {
    if (autoFetch && !didAutoFetch.current && watching.length > 0 && !cache) {
      didAutoFetch.current = true;
      fetchSchedule();
    }
  }, [autoFetch, watching.length]);

  const dayDE = { Monday: "Montag", Tuesday: "Dienstag", Wednesday: "Mittwoch", Thursday: "Donnerstag",
    Friday: "Freitag", Saturday: "Samstag", Sunday: "Sonntag", Mondays: "Montag", Tuesdays: "Dienstag",
    Wednesdays: "Mittwoch", Thursdays: "Donnerstag", Fridays: "Freitag", Saturdays: "Samstag", Sundays: "Sonntag" };

  const airing = schedule.filter(s => s.airing);
  const finished = schedule.filter(s => !s.airing);

  // Weekly calendar helper
  const weekDays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const dayEN = { Montag: "Monday", Dienstag: "Tuesday", Mittwoch: "Wednesday", Donnerstag: "Thursday", Freitag: "Friday", Samstag: "Saturday", Sonntag: "Sunday",
    Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday",
    Mondays: "Monday", Tuesdays: "Tuesday", Wednesdays: "Wednesday", Thursdays: "Thursday", Fridays: "Friday", Saturdays: "Saturday", Sundays: "Sunday" };
  const today = new Date();
  const todayDay = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][today.getDay()];
  const calendarData = weekDays.map(day => ({
    day,
    isToday: day === todayDay,
    shows: airing.filter(s => dayEN[s.broadcast?.day] === dayEN[day]),
  }));

  const ScheduleCard = ({ s }) => (
    <div style={{ display: "flex", gap: 10, background: theme.bgCard, borderRadius: 12, marginBottom: 8,
      border: `1px solid ${s.airing ? "#2ECC7122" : "#ffffff08"}`, overflow: "hidden",
      borderLeft: `3px solid ${s.airing ? "#2ECC71" : "#555"}` }}>
      {s.image && <img src={s.image} alt="" loading="lazy" style={{ width: 48, objectFit: "cover", flexShrink: 0 }} />}
      <div style={{ flex: 1, padding: "8px 10px 8px 0", minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
          {s.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {s.airing && s.broadcast?.day && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#2ECC7122", color: "#2ECC71", fontWeight: 700 }}>
              {dayDE[s.broadcast.day] || s.broadcast.day} {s.broadcast.time ? `${s.broadcast.time} (JST)` : ""}
            </span>
          )}
          {s.airing && <span style={{ fontSize: 10, color: "#2ECC71", fontWeight: 600 }}>Läuft</span>}
          {!s.airing && <span style={{ fontSize: 10, color: "#555" }}>Abgeschlossen/Noch nicht gestartet</span>}
          <span style={{ fontSize: 10, color: "#555" }}>Ep {s.watched}/{s.eps || "?"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #ffffff08" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8", marginBottom: 6 }}>Sendeplan laden</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.6 }}>
          Prüft für deine <span style={{ color: "#2ECC71", fontWeight: 700 }}>{watching.length}</span> "Am Schauen"-Anime
          den aktuellen Sendestatus und Broadcast-Tag.
        </div>
        <button onClick={fetchSchedule} disabled={loading || watching.length === 0}
          style={{ padding: "8px 18px", border: "none", borderRadius: 20,
            cursor: watching.length && !loading ? "pointer" : "default",
            background: watching.length && !loading ? "linear-gradient(135deg,#2ECC71,#3498DB)" : "#333",
            color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            opacity: watching.length && !loading ? 1 : 0.5 }}>
          {loading ? "Lade..." : loaded ? "Erneut laden" : "Sendeplan laden"}
        </button>
        {watching.length === 0 && (
          <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Keine Anime auf "Am Schauen" mit MAL-ID.</div>
        )}
      </div>

      {loaded && (
        <>
          {airing.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "#2ECC71", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10, fontWeight: 700 }}>
                Aktuell laufend ({airing.length})
              </div>
              {airing.map(s => <ScheduleCard key={s.mal_id} s={s} />)}
            </>
          )}
          {finished.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10, marginTop: 20, fontWeight: 700 }}>
                Nicht laufend ({finished.length})
              </div>
              {finished.map(s => <ScheduleCard key={s.mal_id} s={s} />)}
            </>
          )}
          {schedule.length === 0 && (
            <div style={{ textAlign: "center", color: "#444", padding: "30px 0", fontSize: 13 }}>
              Keine Schedule-Daten gefunden.
            </div>
          )}

          {/* Weekly Calendar */}
          {airing.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: "#F5A623", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10, fontWeight: 700 }}>
                Wochenkalender
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {calendarData.map(({ day, isToday, shows }) => (
                  <div key={day} style={{ background: isToday ? "#F5A62315" : theme.bgCard, borderRadius: 10, padding: "6px 4px",
                    border: isToday ? "1px solid #F5A62344" : "1px solid #ffffff06", textAlign: "center", minHeight: 60 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isToday ? "#F5A623" : "#555", marginBottom: 4 }}>
                      {day.substring(0, 2)}
                    </div>
                    {shows.map(s => (
                      <div key={s.mal_id} title={s.title} style={{ width: "100%", height: 4, borderRadius: 2,
                        background: "#2ECC71", marginBottom: 2 }} />
                    ))}
                    {shows.length > 0 && <div style={{ fontSize: 8, color: "#2ECC71", marginTop: 2 }}>{shows.length}</div>}
                  </div>
                ))}
              </div>
              {/* Legend below calendar */}
              <div style={{ marginTop: 8 }}>
                {calendarData.filter(d => d.shows.length > 0).map(({ day, shows }) => (
                  <div key={day} style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>
                    <span style={{ color: "#2ECC71", fontWeight: 700 }}>{day}:</span> {shows.map(s => s.title).join(", ")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── StatsView (expanded) ─────────────────────────────────────────────────────
function StatsView({ anime, manga }) {
  const theme = useTheme();
  const [statsTab, setStatsTab] = useState("overview");
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

  // Watchtime: parse duration like "24 min per ep" → extract minutes
  const parseDur = (d) => { if (!d) return 24; const m = d.match(/(\d+)\s*min/); return m ? parseInt(m[1]) : 24; };
  const watchtimeMin = anime.reduce((s, a) => s + (a.watched || 0) * parseDur(a.duration), 0);
  const watchtimeH = Math.round(watchtimeMin / 60);
  const watchtimeD = (watchtimeMin / 1440).toFixed(1);

  // Score histogram (1-10)
  const scoreHistA = Array(10).fill(0), scoreHistM = Array(10).fill(0);
  anime.forEach(a => { if (a.score > 0) scoreHistA[a.score - 1]++; });
  manga.forEach(m => { if (m.score > 0) scoreHistM[m.score - 1]++; });
  const maxScore = Math.max(...scoreHistA, ...scoreHistM, 1);

  // Genre stats (top 15)
  const genreCount = {};
  [...anime, ...manga].forEach(x => (x.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const maxGenre = topGenres.length ? topGenres[0][1] : 1;

  // Format distribution
  const formatCount = {};
  anime.forEach(a => { const f = a.format || "TV"; formatCount[f] = (formatCount[f] || 0) + 1; });
  const topFormats = Object.entries(formatCount).sort((a, b) => b[1] - a[1]);

  // Source distribution
  const sourceCount = {};
  anime.forEach(a => { if (a.source) sourceCount[a.source] = (sourceCount[a.source] || 0) + 1; });
  const topSources = Object.entries(sourceCount).sort((a, b) => b[1] - a[1]);

  // Manga↔Anime Adaption tracker
  const adaptions = useMemo(() => {
    const items = [];
    const check = (entry, kind) => {
      for (const r of (entry.related || [])) {
        if (r.relType === "Adaption") {
          const otherPool = r.kind === "anime" ? anime : manga;
          const inLibrary = otherPool.some(e => (e.mal_id && e.mal_id === r.id) || e.title.toLowerCase() === r.title.toLowerCase());
          items.push({ title: entry.title, kind, adaptTitle: r.title, adaptKind: r.kind, inLibrary });
        }
      }
    };
    anime.forEach(a => check(a, "anime"));
    manga.forEach(m => check(m, "manga"));
    const seen = new Set();
    return items.filter(n => { const k = `${n.title}::${n.adaptTitle}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }, [anime, manga]);

  const StatCard = ({ label, val, sub, color }) => (
    <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: "14px 16px", flex: 1 }}>
      <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{sub}</div>}
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
  const HBar = ({ label, count, maxVal, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#888", minWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "#ffffff08", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(count / maxVal * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", minWidth: 28, textAlign: "right" }}>{count}</span>
    </div>
  );

  // Yearly recap: group anime by season/year
  const yearlyData = useMemo(() => {
    const years = {};
    anime.filter(a => a.status === "Abgeschlossen").forEach(a => {
      const y = a.year || "Unbekannt";
      if (!years[y]) years[y] = { anime: 0, eps: 0, watchMin: 0 };
      years[y].anime++;
      years[y].eps += (a.watched || 0);
      years[y].watchMin += (a.watched || 0) * parseDur(a.duration);
    });
    const mangaByYear = {};
    manga.filter(m => m.status === "Abgeschlossen" || m.status === "Am Lesen").forEach(m => {
      // No year data for manga typically, group by "unknown"
      const y = "Gesamt";
      if (!mangaByYear[y]) mangaByYear[y] = { manga: 0, chaps: 0 };
      mangaByYear[y].manga++;
      mangaByYear[y].chaps += (m.read || 0);
    });
    return { anime: Object.entries(years).filter(([y]) => y !== "Unbekannt").sort((a, b) => b[0] - a[0]), mangaTotal: mangaByYear["Gesamt"] || { manga: 0, chaps: 0 },
      unknownAnime: years["Unbekannt"] || { anime: 0, eps: 0, watchMin: 0 } };
  }, [anime, manga]);

  const STABS = [["overview","Überblick"],["charts","Graphen"],["adaptions","Adaptionen"],["yearly","Rückblick"]];

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Stats sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {STABS.map(([id, label]) => (
          <button key={id} onClick={() => setStatsTab(id)} style={{ padding: "6px 14px", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
            cursor: "pointer", borderRadius: 20, border: `1px solid ${statsTab === id ? theme.accentStats : "#ffffff12"}`,
            background: statsTab === id ? theme.accentStats + "22" : "transparent",
            color: statsTab === id ? theme.accentStats : "#666" }}>{label}</button>
        ))}
      </div>

      {statsTab === "overview" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <StatCard label="Anime" val={anime.length} color={theme.accentAnime} />
            <StatCard label="Manga" val={manga.length} color={theme.accentManga} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <StatCard label="Episoden" val={eps.toLocaleString("de")} color="#3498DB" />
            <StatCard label="Kapitel" val={chaps.toLocaleString("de")} color="#2ECC71" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <StatCard label="Ø Anime" val={avgA} color={theme.accentStats} />
            <StatCard label="Ø Manga" val={avgM} color={theme.accentStats} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <StatCard label="Watchtime" val={`${watchtimeH}h`} sub={`${watchtimeD} Tage`} color="#E94560" />
            <StatCard label="Bewertungen" val={sa.length + sm.length} sub={`${sa.length} A · ${sm.length} M`} color="#9B59B6" />
          </div>

          {/* Status bars */}
          <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentAnime, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Anime Status</div>
            {STATUS_A.map(s => ac[s] ? <SBar key={s} label={s} count={ac[s]} color={SC[s]} total={anime.length} /> : null)}
          </div>
          <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentManga, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Manga Status</div>
            {STATUS_M.map(s => mc[s] ? <SBar key={s} label={s} count={mc[s]} color={SC[s]} total={manga.length} /> : null)}
          </div>

          {/* 10/10 Favorites */}
          {(favA.length > 0 || favM.length > 0) && (
            <div style={{ background: "#1a1306", border: "1px solid #F5A62325", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>10/10 Favoriten</div>
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
        </>
      )}

      {statsTab === "charts" && (
        <>
          {/* Score Histogram */}
          <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentStats, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>
              Bewertungs-Verteilung
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const aH = maxScore > 0 ? (scoreHistA[n-1] / maxScore) * 100 : 0;
                const mH = maxScore > 0 ? (scoreHistM[n-1] / maxScore) * 100 : 0;
                return (
                  <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 8, color: "#555" }}>{(scoreHistA[n-1] + scoreHistM[n-1]) || ""}</div>
                    <div style={{ display: "flex", gap: 1, alignItems: "flex-end", flex: 1, width: "100%" }}>
                      <div style={{ flex: 1, background: theme.accentAnime, borderRadius: "3px 3px 0 0", height: `${aH}%`, minHeight: scoreHistA[n-1] ? 3 : 0, transition: "height .3s" }} />
                      <div style={{ flex: 1, background: theme.accentManga, borderRadius: "3px 3px 0 0", height: `${mH}%`, minHeight: scoreHistM[n-1] ? 3 : 0, transition: "height .3s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: n >= 9 ? "#F5A623" : n >= 7 ? "#2ECC71" : "#666", fontWeight: 700 }}>{n}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: theme.accentAnime }} />
                <span style={{ fontSize: 10, color: "#888" }}>Anime</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: theme.accentManga }} />
                <span style={{ fontSize: 10, color: "#888" }}>Manga</span>
              </div>
            </div>
          </div>

          {/* Genre Top 15 */}
          {topGenres.length > 0 && (
            <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2ECC71", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Top Genres
              </div>
              {topGenres.map(([g, c]) => <HBar key={g} label={g} count={c} maxVal={maxGenre} color="#2ECC71" />)}
            </div>
          )}

          {/* Format distribution */}
          {topFormats.length > 0 && (
            <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentAnime, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Anime nach Format
              </div>
              {topFormats.map(([f, c]) => <HBar key={f} label={f} count={c} maxVal={topFormats[0][1]} color={theme.accentAnime} />)}
            </div>
          )}

          {/* Source distribution */}
          {topSources.length > 0 && (
            <div style={{ background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Anime nach Vorlage
              </div>
              {topSources.map(([f, c]) => <HBar key={f} label={f} count={c} maxVal={topSources[0][1]} color="#F5A623" />)}
            </div>
          )}
        </>
      )}

      {statsTab === "adaptions" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
            Manga → Anime Adaptionen
          </div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>
            Automatisch erkannt aus Related Works. {adaptions.filter(a => a.inLibrary).length} von {adaptions.length} in deiner Bibliothek.
          </div>
          {adaptions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#444", padding: "30px 0", fontSize: 13 }}>
              Noch keine Adaptions-Daten. Starte ein Bulk-Update im Updates-Tab.
            </div>
          ) : adaptions.map((a, i) => (
            <div key={i} style={{ background: theme.bgCard, borderRadius: 10, padding: "10px 14px", marginBottom: 6,
              border: `1px solid ${a.inLibrary ? "#2ECC7122" : "#ffffff08"}`,
              borderLeft: `3px solid ${a.inLibrary ? "#2ECC71" : "#F5A623"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700,
                  background: a.kind === "anime" ? "#E9456018" : "#9B59B618",
                  color: a.kind === "anime" ? "#E94560" : "#9B59B6" }}>{a.kind === "anime" ? "Anime" : "Manga"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ddd" }}>{a.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#555" }}>→</span>
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700,
                  background: a.adaptKind === "anime" ? "#E9456018" : "#9B59B618",
                  color: a.adaptKind === "anime" ? "#E94560" : "#9B59B6" }}>{a.adaptKind === "anime" ? "Anime" : "Manga"}</span>
                <span style={{ fontSize: 11, color: "#aaa" }}>{a.adaptTitle}</span>
                {a.inLibrary && <span style={{ fontSize: 9, color: "#2ECC71", fontWeight: 700, marginLeft: "auto" }}>IN BIBLIOTHEK</span>}
                {!a.inLibrary && <span style={{ fontSize: 9, color: "#F5A623", fontWeight: 700, marginLeft: "auto" }}>NICHT VORHANDEN</span>}
              </div>
            </div>
          ))}
        </>
      )}

      {statsTab === "yearly" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#3498DB", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>
            Jahresrückblick nach Anime-Season
          </div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>
            Basierend auf der Season/Year-Info deiner abgeschlossenen Anime. {yearlyData.unknownAnime.anime > 0 &&
              `${yearlyData.unknownAnime.anime} Anime ohne Jahresinfo.`}
          </div>

          {yearlyData.anime.length > 0 ? yearlyData.anime.map(([year, data]) => (
            <div key={year} style={{ background: theme.bgCard, borderRadius: 12, padding: "12px 16px", marginBottom: 8,
              border: "1px solid #ffffff08", borderLeft: "3px solid #3498DB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#3498DB" }}>{year}</span>
                <span style={{ fontSize: 10, color: "#555" }}>{Math.round(data.watchMin / 60)}h Watchtime</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: theme.accentAnime }}>{data.anime}</span>
                  <span style={{ fontSize: 10, color: "#666", marginLeft: 4 }}>Anime</span>
                </div>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#3498DB" }}>{data.eps}</span>
                  <span style={{ fontSize: 10, color: "#666", marginLeft: 4 }}>Episoden</span>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: "center", color: "#444", padding: "30px 0", fontSize: 13 }}>
              Keine Season-Daten vorhanden. Starte ein Bulk-Update um Season/Year zu laden.
            </div>
          )}

          {/* Manga total */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentManga, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
              Manga Gesamt
            </div>
            <div style={{ background: theme.bgCard, borderRadius: 12, padding: "12px 16px", border: "1px solid #ffffff08",
              borderLeft: `3px solid ${theme.accentManga}` }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: theme.accentManga }}>{yearlyData.mangaTotal.manga}</span>
                  <span style={{ fontSize: 10, color: "#666", marginLeft: 4 }}>Manga gelesen</span>
                </div>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#2ECC71" }}>{yearlyData.mangaTotal.chaps.toLocaleString("de")}</span>
                  <span style={{ fontSize: 10, color: "#666", marginLeft: 4 }}>Kapitel</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [initLoaded, setInitLoaded] = useState(false);
  const [anime, setAnime] = useState([]);
  const [manga, setManga] = useState([]);

  // Wait for INIT JSON files, then load from localStorage (with INIT as fallback)
  useEffect(() => {
    _initReady.then(() => {
      setAnime(load(STORAGE_KEY_A, INIT_ANIME));
      setManga(load(STORAGE_KEY_M, INIT_MANGA));
      setInitLoaded(true);
    });
  }, []);

  const [tab, setTab] = useState("anime");
  const [statusF, setStatusF] = useState(() => "Alle");
  const prefsLoaded = useRef(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [showTheme, setShowTheme] = useState(false);
  const [cachedSchedule, setCachedSchedule] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("matter_schedule_cache"));
      if (saved && saved.ts && Date.now() - saved.ts < 7 * 24 * 60 * 60 * 1000) return saved.data;
    } catch {}
    return null;
  });
  const [cachedRecs, setCachedRecs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("matter_recs_cache"));
      if (saved && saved.ts) return saved.data;
    } catch {}
    return null;
  });
  // Persist caches to localStorage
  const setAndPersistSchedule = useCallback(data => {
    setCachedSchedule(data);
    try { localStorage.setItem("matter_schedule_cache", JSON.stringify({ data, ts: Date.now() })); } catch {}
  }, []);
  const setAndPersistRecs = useCallback(data => {
    setCachedRecs(data);
    try { localStorage.setItem("matter_recs_cache", JSON.stringify({ data, ts: Date.now() })); } catch {}
  }, []);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(null);
  const [sortBy, setSortBy] = useState("title");
  const [showFilters, setShowFilters] = useState(false);
  const [sortDir, setSortDir] = useState("asc");
  const [genreF, setGenreF] = useState("Alle");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncMsg, setSyncMsg] = useState("");
  const xlsxReady = useSheetJS();
  const [openId, setOpenId] = useState(null); // { tab, id } | null
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const toggleCard = useCallback((id) => setOpenId(prev =>
    prev && String(prev.id) === String(id) && prev.tab === tabRef.current ? null : { tab: tabRef.current, id: String(id) }
  ), []);
  const syncTimer = useRef(null);

  useEffect(() => {
    if (!initLoaded) return; // Wait for INIT JSON to load first
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
        const localA = load(STORAGE_KEY_A, INIT_ANIME);
        const localM = load(STORAGE_KEY_M, INIT_MANGA);
        // Smart merge: prefer local if it has more entries OR richer data (image_url = metadata present)
        const localAHasMeta = localA.some(x => x.image_url || x.genres);
        const remoteAHasMeta = a && a.some(x => x.image_url || x.genres);
        if (a && a.length > 0) {
          const preferLocal = localA.length > a.length || (localAHasMeta && !remoteAHasMeta);
          if (preferLocal) { setAnime(localA); Promise.resolve().then(() => localA.forEach(r => upsertToSupabase("anime", r).catch(() => {}))); }
          else { setAnime(a); save(STORAGE_KEY_A, a); }
        } else { initSupabase("anime", localA).then(() => setAnime(localA)); }
        const localMHasMeta = localM.some(x => x.image_url || x.genres);
        const remoteMHasMeta = m && m.some(x => x.image_url || x.genres);
        if (m && m.length > 0) {
          const preferLocal = localM.length > m.length || (localMHasMeta && !remoteMHasMeta);
          if (preferLocal) { setManga(localM); Promise.resolve().then(() => localM.forEach(r => upsertToSupabase("manga", r).catch(() => {}))); }
          else { setManga(m); save(STORAGE_KEY_M, m); }
        } else { initSupabase("manga", localM).then(() => setManga(localM)); }
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
  }, [initLoaded]);

  // Cleanup sync timer on unmount
  useEffect(() => () => clearTimeout(syncTimer.current), []);

  useEffect(() => { save(STORAGE_KEY_A, anime); try { localStorage.setItem(STORAGE_KEY_A + "_ts", String(Date.now())); } catch {} }, [anime]);
  useEffect(() => { save(STORAGE_KEY_M, manga); try { localStorage.setItem(STORAGE_KEY_M + "_ts", String(Date.now())); } catch {} }, [manga]);
  useEffect(() => {
    if (!prefsLoaded.current) return;
    savePrefs({ tab, statusF, theme });
  }, [tab, statusF, theme]);

  const pendingSync = useRef(new Map());

  const syncItem = useCallback((table, item) => {
    if (!USE_SUPABASE) return;
    pendingSync.current.set(`${table}:${item.id}`, { table, item });
    clearTimeout(syncTimer.current);
    setSyncStatus("syncing");
    syncTimer.current = setTimeout(() => {
      const pending = Array.from(pendingSync.current.values());
      pendingSync.current.clear();
      Promise.all(pending.map(({ table: t, item: i }) => upsertToSupabase(t, i)))
        .then(() => { setSyncStatus("ok"); setSyncMsg("Gespeichert"); setTimeout(() => setSyncStatus("idle"), 2000); })
        .catch(() => { setSyncStatus("error"); setSyncMsg("Sync fehlgeschlagen"); });
    }, 600);
  }, []);

  const updateAnime = useCallback(item => {
    // Auto-complete: wenn alle Episoden gesehen → Status auf Abgeschlossen
    if (item.eps > 0 && item.watched >= item.eps && item.status === "Am Schauen") {
      item = { ...item, status: "Abgeschlossen" };
    }
    setAnime(prev => prev.map(a => a.id === item.id ? { ...a, ...item } : a));
    syncItem("anime", item);
  }, [syncItem]);
  const updateManga = useCallback(item => {
    // Auto-complete: wenn alle Kapitel gelesen → Status auf Abgeschlossen
    if (item.chapters > 0 && item.read >= item.chapters && item.status === "Am Lesen") {
      item = { ...item, status: "Abgeschlossen" };
    }
    setManga(prev => prev.map(m => m.id === item.id ? { ...m, ...item } : m));
    syncItem("manga", item);
  }, [syncItem]);
  const addAnime = useCallback(item => { setAnime(prev => [...prev, item]); if (USE_SUPABASE) upsertToSupabase("anime", item).catch(console.error); }, []);
  const addManga = useCallback(item => { setManga(prev => [...prev, item]); if (USE_SUPABASE) upsertToSupabase("manga", item).catch(console.error); }, []);
  const deleteAnime = useCallback(id => { setAnime(prev => prev.filter(a => a.id !== id)); setOpenId(null); if (USE_SUPABASE) deleteFromSupabase("anime", id).catch(console.error); }, []);
  const deleteManga = useCallback(id => { setManga(prev => prev.filter(m => m.id !== id)); setOpenId(null); if (USE_SUPABASE) deleteFromSupabase("manga", id).catch(console.error); }, []);

  const statuses = tab === "manga" ? STATUS_M : STATUS_A;
  const acc = tab === "anime" ? theme.accentAnime : tab === "manga" ? theme.accentManga : tab === "settings" ? theme.accentUpdates : tab === "discover" ? "#F5A623" : theme.accentStats;

  // Collect all genres for current tab
  const allGenres = useMemo(() => {
    const data = tab === "anime" ? anime : tab === "manga" ? manga : [];
    const set = new Set();
    data.forEach(x => (x.genres || []).forEach(g => set.add(g)));
    return [...set].sort();
  }, [tab, anime, manga]);

  const rows = useMemo(() => {
    let data = tab === "anime" ? anime : tab === "manga" ? manga : [];
    if (statusF !== "Alle") data = data.filter(x => x.status === statusF);
    if (genreF !== "Alle") data = data.filter(x => (x.genres || []).includes(genreF));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(x =>
        x.title.toLowerCase().includes(q) ||
        (x.subtitle || "").toLowerCase().includes(q) ||
        (x.notes || "").toLowerCase().includes(q) ||
        (Array.isArray(x.genres) && x.genres.some(g => g.toLowerCase().includes(q)))
      );
    }
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
    // Default sort: Am Schauen/Am Lesen first
    if (sortBy === "title" && sortDir === "asc" && statusF === "Alle" && !search) {
      const activeStatuses = ["Am Schauen", "Am Lesen"];
      sorted.sort((a, b) => {
        const aActive = activeStatuses.includes(a.status) ? 0 : 1;
        const bActive = activeStatuses.includes(b.status) ? 0 : 1;
        return aActive - bActive;
      });
    }
  }, [tab, anime, manga, statusF, genreF, search, sortBy, sortDir]);

  const TABS = [
    ["anime",   "Anime"],
    ["manga",   "Manga"],
    ["stats",   "Stats"],
    ["discover","Entdecken"],
    ["settings","Einstellungen"],
  ];

  if (!initLoaded) return (
    <div style={{ minHeight: "100vh", background: "#080d18", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 900, background: "linear-gradient(90deg,#E94560,#9B59B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>MATTER</div>
        <div style={{ fontSize: 12, color: "#333" }}>Lade Daten...</div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
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
              <button onClick={() => setAdding(tab === "anime" || tab === "manga" ? tab : "anime")}
                style={{ padding: "9px 16px", border: "none", borderRadius: 22, color: "#fff", fontSize: 13,
                  fontWeight: 800, cursor: "pointer", fontFamily: "inherit", letterSpacing: ".04em",
                  background: `linear-gradient(135deg,${acc},${acc}cc)` }}>
                + Neu
              </button>
            </div>
          </div>

          {/* Search */}
          {(tab === "anime" || tab === "manga") && (
            <div style={{ display: "flex", gap: 8, padding: "8px 14px 4px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: 12, pointerEvents: "none" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suche..."
                  style={{ width: "100%", padding: "8px 10px 8px 30px", background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 10, color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <button onClick={() => setShowFilters(f => !f)}
                style={{ padding: "8px 12px", border: showFilters ? `1px solid ${acc}` : "1px solid #ffffff12", borderRadius: 10, background: showFilters ? acc + "22" : "transparent", color: showFilters ? acc : "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, flexShrink: 0 }}>
                ☰
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {TABS.map(([id, label]) => {
              const tabAcc = id === "anime" ? theme.accentAnime : id === "manga" ? theme.accentManga : id === "settings" ? theme.accentUpdates : id === "discover" ? "#F5A623" : theme.accentStats;
              const active = tab === id;
              return (
                <button key={id} onClick={() => {
                    setTab(id);
                    setStatusF(id === "anime" ? "Am Schauen" : id === "manga" ? "Am Lesen" : "Alle");
                    setGenreF("Alle"); setSearch(""); setOpenId(null);
                  }} style={{
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
          ) : tab === "discover" ? (
            <>
              <ScheduleView anime={anime} autoFetch cache={cachedSchedule} onCache={setAndPersistSchedule} />
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #ffffff0a" }}>
                <RecommendationsView anime={anime} manga={manga} cache={cachedRecs} onCache={setAndPersistRecs} />
              </div>
            </>
          ) : tab === "settings" ? (
            <>
              {/* Sync / Export / Theme buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {USE_SUPABASE && (
                  <button onClick={async () => {
                    setSyncStatus("syncing"); setSyncMsg("Hochladen\u2026");
                    try {
                      const chunk = (arr, size) => { const r = []; for (let i = 0; i < arr.length; i += size) r.push(arr.slice(i, i + size)); return r; };
                      for (const batch of chunk(anime, 50)) { await initSupabase("anime", batch); }
                      for (const batch of chunk(manga, 50)) { await initSupabase("manga", batch); }
                      setSyncStatus("ok"); setSyncMsg("Alles hochgeladen");
                      setTimeout(() => setSyncStatus("idle"), 3000);
                    } catch (e) { setSyncStatus("error"); setSyncMsg("Upload fehlgeschlagen"); console.error(e); }
                  }}
                    style={{ padding: "10px 20px", border: "none", borderRadius: 12, fontFamily: "inherit",
                      background: syncStatus === "syncing" ? "#F5A62322" : "#ffffff0d",
                      color: syncStatus === "syncing" ? "#F5A623" : syncStatus === "ok" ? "#2ECC71" : syncStatus === "error" ? "#E74C3C" : "#aaa",
                      fontSize: 13, fontWeight: 700, cursor: syncStatus === "syncing" ? "default" : "pointer" }}
                    disabled={syncStatus === "syncing"}>
                    {syncStatus === "syncing" ? "Hochladen\u2026" : syncStatus === "ok" ? "\u2713 Hochgeladen" : syncStatus === "error" ? "Fehlgeschlagen" : "Zu Supabase hochladen"}
                  </button>
                )}
                <button onClick={() => exportToExcel(anime, manga)} disabled={!xlsxReady}
                  style={{ padding: "10px 20px", border: "none", borderRadius: 12, fontFamily: "inherit",
                    background: "#ffffff0d", color: xlsxReady ? "#aaa" : "#444",
                    fontSize: 13, fontWeight: 700, cursor: xlsxReady ? "pointer" : "default" }}>
                  Excel Export
                </button>
                <button onClick={() => setShowTheme(true)}
                  style={{ padding: "10px 20px", border: "none", borderRadius: 12, fontFamily: "inherit",
                    background: "#ffffff0d", color: "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Farben anpassen
                </button>
                <button onClick={async () => {
                  if (!window.confirm("Alle Daten auf MAL-Export zurücksetzen?")) return;
                  setSyncStatus("syncing"); setSyncMsg("Zurücksetzen\u2026");
                  try {
                    setAnime(INIT_ANIME); setManga(INIT_MANGA);
                    save(STORAGE_KEY_A, INIT_ANIME); save(STORAGE_KEY_M, INIT_MANGA);
                    if (USE_SUPABASE) {
                      const chunk = (arr, size) => { const r = []; for (let i = 0; i < arr.length; i += size) r.push(arr.slice(i, i + size)); return r; };
                      for (const batch of chunk(INIT_ANIME, 50)) { await initSupabase("anime", batch); }
                      for (const batch of chunk(INIT_MANGA, 50)) { await initSupabase("manga", batch); }
                    }
                    setSyncStatus("ok"); setSyncMsg("Zurückgesetzt");
                    setTimeout(() => setSyncStatus("idle"), 3000);
                  } catch (e) { setSyncStatus("error"); setSyncMsg("Reset fehlgeschlagen"); console.error(e); }
                }}
                  style={{ padding: "10px 20px", border: "none", borderRadius: 12, fontFamily: "inherit",
                    background: "#E74C3C18", color: "#E74C3C", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  MAL-Reset
                </button>
              </div>
              <NotificationsView anime={anime} manga={manga} onUpdateAnime={updateAnime} onUpdateManga={updateManga} />
            </>
          ) : (
            <>

              {showFilters && (<>
              <div className="hide-scroll" style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
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
              <div className="hide-scroll" style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
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
              </>)}
              {/* Genre filter */}
              {allGenres.length > 0 && showFilters && (
                <div className="hide-scroll" style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
                  <button onClick={() => setGenreF("Alle")} style={{ padding: "4px 10px", fontFamily: "inherit", fontSize: 10, fontWeight: 700,
                    cursor: "pointer", borderRadius: 16, whiteSpace: "nowrap", flexShrink: 0,
                    border: `1px solid ${genreF === "Alle" ? acc : "#ffffff0d"}`,
                    background: genreF === "Alle" ? acc + "22" : "transparent",
                    color: genreF === "Alle" ? acc : "#555" }}>Alle Genres</button>
                  {allGenres.map(g => (
                    <button key={g} onClick={() => setGenreF(g)} style={{ padding: "4px 10px", fontFamily: "inherit", fontSize: 10, fontWeight: 600,
                      cursor: "pointer", borderRadius: 16, whiteSpace: "nowrap", flexShrink: 0,
                      border: `1px solid ${genreF === g ? acc : "#ffffff0d"}`,
                      background: genreF === g ? acc + "22" : "transparent",
                      color: genreF === g ? acc : "#555" }}>{g}</button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: "#444", marginBottom: 10 }}>{rows.length} Einträge</div>
              <CardGrid rows={rows} tab={tab} updateAnime={updateAnime} updateManga={updateManga}
                deleteAnime={deleteAnime} deleteManga={deleteManga}
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
    </ErrorBoundary>
  );
}
