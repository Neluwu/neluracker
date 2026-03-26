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

// ─── LocalStorage ────────────────────────────────────────────────────────────
const STORAGE_KEY_A = "nirusu_anime";
const STORAGE_KEY_M = "nirusu_manga";
const PREF_KEY = "matter_prefs";

// ============================================================================
// ⚠️ FÜGE HIER DEINE LANGEN ARRAYS WIEDER EIN!
// ============================================================================
const INIT_ANIME =[];
const INIT_MANGA = [];
// ============================================================================

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

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 720 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  },[]);
  return isMobile;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
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
    await sbFetch("user_prefs", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "ui_prefs", value: str }) });
  } catch (e) { console.error("savePrefs failed:", e); }
}

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
  return (data.relations ||[]).flatMap(rel => {
    const relType = REL_TYPE_MAP[rel.relation] || "Related";
    return (rel.entry ||[]).map(e => ({ id: e.mal_id, title: e.name, kind: e.type === "anime" ? "anime" : "manga", relType }));
  });
}

function load(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function save(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation", ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text(); return text ? JSON.parse(text) : null;
}
async function loadFromSupabase(table) { return sbFetch(`${table}?select=*&order=id.asc`); }
async function upsertToSupabase(table, row) { return sbFetch(table, { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) }); }
async function initSupabase(table, rows) { return sbFetch(table, { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) }); }
async function deleteFromSupabase(table, id) { return sbFetch(`${table}?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal", headers: { Prefer: "return=minimal" } }); }

function scoreColor(s) { return s >= 9 ? "#F5A623" : s >= 7 ? "#2ECC71" : s >= 5 ? "#3498DB" : "#E74C3C"; }
function sIcon(s) { return s === "Am Schauen" || s === "Am Lesen" ? "📖" : s === "Abgeschlossen" ? "✓" : s === "Geplant" ? "◇" : s === "Pausiert" ? "⏸" : "✕"; }

function StarRating({ value, onChange, color = "#F5A623" }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <span key={n} onClick={() => onChange(n === value ? 0 : n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          style={{ fontSize: 20, cursor: "pointer", lineHeight: 1, userSelect: "none", color: n <= (hover || value) ? color : "#333", transition: "color .1s" }}>★</span>
      ))}
      {value > 0 && <span style={{ fontSize: 11, fontWeight: 800, marginLeft: 4, color: value >= 9 ? "#F5A623" : value >= 7 ? "#2ECC71" : "#3498DB" }}>{value}/10</span>}
    </div>
  );
}

function Stepper({ label, value, max, onInc, onDec, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderTop: "1px solid #ffffff08" }}>
      <span style={{ fontSize: 12, color: "#888" }}>{label}{max != null ? <span style={{ color: "#444", fontSize: 11 }}> / {max}</span> : ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onDec} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#ffffff10", color: "#aaa", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>−</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#e8e8e8", minWidth: 28, textAlign: "center" }}>{value}</span>
        <button onClick={onInc} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: accent, color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>+</button>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderTop: "1px solid #ffffff08" }}>
      <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
      {editing ? (
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => { onChange(parseInt(draft) || 0); setEditing(false); }} onKeyDown={e => { if (e.key === "Enter") { onChange(parseInt(draft) || 0); setEditing(false); } }} style={{ width: 64, background: "#ffffff10", border: "1px solid #ffffff20", borderRadius: 6, color: "#fff", fontSize: 14, fontWeight: 700, textAlign: "center", padding: "3px 6px", fontFamily: "inherit", outline: "none" }} />
      ) : (
        <div onClick={() => { setDraft(String(value)); setEditing(true); }} style={{ minWidth: 64, background: "#ffffff08", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "#e8e8e8", fontSize: 14, fontWeight: 700, textAlign: "center" }}>{value}</div>
      )}
    </div>
  );
}

const numStyle = { flex: 1, minWidth: 0, padding: "9px 5px", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 10, color: "#e8e8e8", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "center" };
const _btnS = (bg) => ({ width: 22, height: 22, borderRadius: "50%", border: "none", background: bg, color: "#fff", fontSize: 13, cursor: "pointer", lineHeight: 1, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 });

// ─── RelatedSection ──────────────────────────────────────────────────────────
function RelatedSection({ item, allAnime, allManga, onChange, accent }) {
  const [relType, setRelType] = useState("Sequel");
  const[searchRel, setSearchRel] = useState("");
  const results = useMemo(() => {
    if (!searchRel.trim()) return[];
    const q = searchRel.toLowerCase();
    return[
      ...allAnime.filter(a => a.id !== item.id && a.title.toLowerCase().includes(q)).slice(0, 4).map(a => ({ ...a, _kind: "anime" })),
      ...allManga.filter(m => m.id !== item.id && m.title.toLowerCase().includes(q)).slice(0, 4).map(m => ({ ...m, _kind: "manga" })),
    ].slice(0, 6);
  },[searchRel, allAnime, allManga, item.id]);

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
      <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Verwandte Werke</div>
      {(item.related ||[]).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {(item.related ||[]).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "7px 10px", background: "#ffffff08", borderRadius: 8 }}>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap", background: r.kind === "anime" ? "#E9456022" : "#9B59B622", color: r.kind === "anime" ? "#E94560" : "#9B59B6" }}>{r.relType}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.kind === "anime" ? "🎬" : "📚"} {r.title}</span>
              <button onClick={() => removeRel(r.id, r.kind)} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {REL_TYPES.map(t => (
          <button key={t} onClick={() => setRelType(t)} style={{ padding: "4px 10px", fontFamily: "inherit", fontSize: 10, fontWeight: 700, cursor: "pointer", borderRadius: 16, border: `1px solid ${relType === t ? accent : "#ffffff12"}`, background: relType === t ? accent + "22" : "transparent", color: relType === t ? accent : "#666" }}>{t}</button>
        ))}
      </div>
      <input value={searchRel} onChange={e => setSearchRel(e.target.value)} placeholder="Titel suchen und verknüpfen..." style={{ width: "100%", padding: "9px 12px", background: "#ffffff08", border: "1px solid #ffffff10", borderRadius: 8, color: "#ccc", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
      {results.length > 0 && (
        <div style={{ marginTop: 4, background: "#1a2438", borderRadius: 8, overflow: "hidden", border: "1px solid #ffffff10" }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => addRel(r)} style={{ padding: "9px 12px", cursor: "pointer", fontSize: 13, color: "#ccc", borderBottom: i < results.length - 1 ? "1px solid #ffffff08" : "none", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, color: r._kind === "anime" ? "#E94560" : "#9B59B6" }}>{r._kind === "anime" ? "Anime" : "Manga"}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EntryCard (OLD UI FOR DESKTOP) ──────────────────────────────────────────
function EntryCard({ item, onChange, onDelete, allAnimeRef, allMangaRef, isOpen, onToggle, isAnime }) {
  const theme = useTheme();
  const c = SC[item.status] || "#666";
  const sc = item.score > 0 ? scoreColor(item.score) : "#444";
  const acc = isAnime ? theme.accentAnime : theme.accentManga;
  const upd = (f, v) => onChange({ ...item, [f]: v });

  const pct = isAnime ? (item.eps ? Math.min(100, Math.round(((item.watched||0)/item.eps)*100)) : 0) : (item.chapters ? Math.min(100, Math.round(((item.read||0)/item.chapters)*100)) : 0);
  const pctVol = item.volumes ? Math.min(100, Math.round(((item.readVols||0)/item.volumes)*100)) : 0;
  const hasVols = !isAnime && item.volumes > 0;
  const mainVal = isAnime ? (item.watched||0) : (item.read||0);
  const mainMax = isAnime ? item.eps : item.chapters;
  const malUrl = item.mal_id ? `https://myanimelist.net/${isAnime ? "anime" : "manga"}/${item.mal_id}` : null;
  const btnS = _btnS;
  const statuses = isAnime ? STATUS_A : STATUS_M;
  const formatList = isAnime ? FORMATS : TYPES;
  const formatKey = isAnime ? "format" : "type";
  const formatLabel = isAnime ? "Format" : "Typ";

  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, overflow: "hidden", border: `1px solid ${isOpen ? acc+"44" : "#ffffff08"}`, transition: "border-color .2s" }}>
      {/* ── Collapsed row ── */}
      <div style={{ display: "flex" }}>
        {item.image_url ? (
          <a href={malUrl || undefined} target={malUrl ? "_blank" : undefined} rel={malUrl ? "noopener noreferrer" : undefined} onClick={e => { if (!malUrl) { e.preventDefault(); onToggle(); } }} style={{ width: 64, flexShrink: 0, cursor: "pointer", position: "relative", display: "block", textDecoration: "none" }}>
            <img src={item.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)", pointerEvents: "none" }} />
            {item.score > 0 && <div style={{ position: "absolute", bottom: 3, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}><span style={{ fontSize: 24, fontWeight: 900, color: sc, lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,1)) drop-shadow(0 0px 12px rgba(0,0,0,0.8))" }}>{item.score}</span></div>}
          </a>
        ) : (
          <div onClick={onToggle} style={{ width: 48, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#ffffff04" }}>
            {item.score > 0 ? <span style={{ fontSize: 22, fontWeight: 900, color: sc }}>{item.score}</span> : <span style={{ fontSize: 11, color: "#333" }}>▼</span>}
          </div>
        )}
        <div style={{ flex: 1, padding: "9px 12px 9px 11px", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#ffffff12", color: "#777", fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: c+"22", color: c, fontWeight: 700 }}>{item.status}</span>
            {item.source && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#ffffff08", color: "#555", fontWeight: 500 }}>{item.source}</span>}
            {isAnime && item.season && item.year && <span style={{ fontSize: 9, color: "#444", marginLeft: "auto" }}>{item.season} {item.year}</span>}
          </div>
          <div onClick={onToggle} style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", marginBottom: 2 }}>{item.title}</div>
          {Array.isArray(item.genres) && item.genres.length > 0 && <div style={{ fontSize: 10, color: "#444", marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.genres.join(" · ")}</div>}
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hasVols ? 5 : 0 }}>
            <div style={{ flex: 1, height: 5, background: "#ffffff10", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 3, transition: "width .3s" }} /></div>
            <span style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap", minWidth: 50, textAlign: "right" }}>{mainVal}/{mainMax||"?"} {isAnime ? "Ep" : "Kap"}</span>
            <button onClick={e => { e.stopPropagation(); if (isAnime) upd("watched", Math.max(0,(item.watched||0)-1)); else upd("read", Math.max(0,(item.read||0)-1)); }} style={btnS("#ffffff10")}><span style={{ color: "#aaa" }}>−</span></button>
            <button onClick={e => { e.stopPropagation(); if (isAnime) upd("watched", Math.min((item.watched||0)+1, item.eps||9999)); else upd("read", Math.min((item.read||0)+1, item.chapters||9999)); }} style={btnS(acc)}><span>+</span></button>
          </div>
          {hasVols && (
            <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 4, background: "#ffffff10", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pctVol}%`, height: "100%", background: c+"77", borderRadius: 3, transition: "width .3s" }} /></div>
              <span style={{ fontSize: 10, color: "#444", whiteSpace: "nowrap", minWidth: 50, textAlign: "right" }}>{item.readVols||0}/{item.volumes} Bd</span>
              <button onClick={e => { e.stopPropagation(); upd("readVols", Math.max(0,(item.readVols||0)-1)); }} style={btnS("#ffffff10")}><span style={{ color: "#aaa" }}>−</span></button>
              <button onClick={e => { e.stopPropagation(); upd("readVols", Math.min((item.readVols||0)+1, item.volumes||9999)); }} style={btnS(acc+"88")}><span>+</span></button>
            </div>
          )}
          {item.watch_url && /^https?:\/\//i.test(item.watch_url) && (
            <a href={item.watch_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "4px 10px", background: acc + "18", border: `1px solid ${acc}33`, borderRadius: 14, textDecoration: "none", fontSize: 10, fontWeight: 700, color: acc, cursor: "pointer", alignSelf: "flex-start" }}>{isAnime ? "▶ Schauen" : "📖 Lesen"}</a>
          )}
        </div>
      </div>

      {/* ── Expanded ── */}
      {isOpen && (
        <div onClick={e => e.stopPropagation()} style={{ padding: "4px 14px 14px", borderTop: "1px solid #ffffff08" }}>
          {Array.isArray(item.genres) && item.genres.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8, marginBottom: 10 }}>
              {item.genres.map(g => <span key={g} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 8, background: acc+"15", color: acc, fontWeight: 600 }}>{g}</span>)}
            </div>
          )}
          {(item.mal_score || (isAnime ? item.studios : item.authors) || item.duration || item.rating) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#ffffff06", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              {[["MAL Score", item.mal_score != null && item.mal_score > 0 ? `${item.mal_score} / 10` : null],[isAnime ? "Studio" : "Autor", isAnime ? (Array.isArray(item.studios) ? item.studios : []).join(", ") : (Array.isArray(item.authors) ? item.authors :[]).join(", ")],[isAnime ? "Dauer" : "Demografie", isAnime ? item.duration : (Array.isArray(item.demographics) ? item.demographics : []).join(", ")],["Altersfreigabe", item.rating],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} style={{ padding: "8px 11px", background: theme.bgCard }}>
                  <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 1 }}>{k}</div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "6px 0 4px" }}>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Titel</div>
              <input value={item.title||""} onChange={e => upd("title", e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Untertitel / Romaji</div>
              <input value={item.subtitle||""} onChange={e => upd("subtitle", e.target.value)} onClick={e => e.stopPropagation()} placeholder={isAnime ? "z.B. Shingeki no Kyojin" : "z.B. Boku no Hero Academia"} style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          {isAnime ? (
            <>
              <Stepper label="Gesehen" value={item.watched||0} max={item.eps||null} accent={acc} onInc={() => upd("watched", Math.min((item.watched||0)+1, item.eps||9999))} onDec={() => upd("watched", Math.max(0,(item.watched||0)-1))} />
              <NumberInput label="Gesamt Episoden" value={item.eps||0} onChange={v => upd("eps", v)} />
            </>
          ) : (
            <>
              <Stepper label="Kapitel gelesen" value={item.read||0} max={item.chapters||null} accent={acc} onInc={() => upd("read", Math.min((item.read||0)+1, item.chapters||9999))} onDec={() => upd("read", Math.max(0,(item.read||0)-1))} />
              <Stepper label="Bänd
