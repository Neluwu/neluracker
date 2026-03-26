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
// ⚠️ WICHTIG: Füge hier deine originalen, langen Arrays ein!
// Ich habe sie gekürzt, damit die Antwort nicht wieder abgeschnitten wird.
// ============================================================================
const INIT_ANIME =[
  {"id":1,"title":"\"Omae Gotoki ga Maou ni Kateru to Omouna\" to Yuusha Party wo Tsuihou sareta node, Outo de Kimama ni Kurashitai","format":"TV","eps":12,"watched":8,"status":"Am Schauen","score":0,"notes":"","mal_id":61587}
  // ---> Füge hier deine restlichen Anime ein <---
];
const INIT_MANGA =[
  {"id":1,"title":"#Gal to Gal no Yuri","type":"Manga","chapters":0,"read":1,"readVols":1,"volumes":0,"status":"Abgeschlossen","score":8,"notes":"","mal_id":182734}
  // ---> Füge hier deine restlichen Manga ein <---
];
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
    await sbFetch("user_prefs", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key: "ui_prefs", value: str }),
    });
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
    return (rel.entry ||[]).map(e => ({
      id: e.mal_id, title: e.name,
      kind: e.type === "anime" ? "anime" : "manga",
      relType,
    }));
  });
}

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error("localStorage save failed:", key, e); }
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
async function loadFromSupabase(table) { return sbFetch(`${table}?select=*&order=id.asc`); }
async function upsertToSupabase(table, row) {
  return sbFetch(table, { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
}
async function initSupabase(table, rows) {
  return sbFetch(table, { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
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

const numStyle = { flex: 1, minWidth: 0, padding: "9px 5px", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 10, color: "#e8e8e8", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "center" };

// ─── RelatedSection ──────────────────────────────────────────────────────────
function RelatedSection({ item, allAnime, allManga, onChange, accent }) {
  const [relType, setRelType] = useState("Sequel");
  const[searchRel, setSearchRel] = useState("");
  const results = useMemo(() => {
    if (!searchRel.trim()) return [];
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
      {(item.related || []).length > 0 && (
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
      <div style={{ position: "absolute", inset: 0, backgroundImage: item.image_url ? `url(${item.image_url})` : fallbackBg, backgroundSize: "cover", backgroundPosition: "center" }} />
      {!item.image_url && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 28, opacity: 0.12, fontWeight: 900, color: "#fff", textAlign: "center", padding: 10 }}>{item.title.substring(0, 4).toUpperCase()}</span>
        </div>
      )}
      
      {item.score > 0 && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: scoreColor(item.score) }}>{item.score}</span>
        </div>
      )}
      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
        <span style={{ padding: "2px 6px", borderRadius: 6, background: "#000000aa", fontSize: 9, color: acc, fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
        <span style={{ padding: "2px 7px", borderRadius: 6, background: c + "cc", fontSize: 9, color: "#fff", fontWeight: 700 }}>{sIcon(item.status)}</span>
      </div>
      
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
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}><div style={{ width: 36, height: 4, background: "#ffffff20", borderRadius: 2 }} /></div>
        
        <div style={{ padding: "4px 16px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#e8e8e8", flex: 1, marginRight: 10 }}>{item.title}</div>
            <button onClick={onClose} style={{ background: "#ffffff08", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#555", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: acc+"22", color: acc, fontWeight: 600 }}>{isAnime ? (item.format||"TV") : (item.type||"Manga")}</span>
            {item.genres?.map(g => <span key={g} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: c + "15", color: c, fontWeight: 600 }}>{g}</span>)}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {malUrl && <a href={malUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#2E51A222", color: "#5B7FD4", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>MAL ↗</a>}
            {item.watch_url && /^https?:\/\//i.test(item.watch_url) ? (
              <a href={item.watch_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px", borderRadius: 10, background: acc + "22", color: acc, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>{isAnime ? "▶ Schauen ↗" : "📖 Lesen ↗"}</a>
            ) : (
              <div style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#ffffff06", color: "#333", fontSize: 12, fontWeight: 600, textAlign: "center" }}>Kein Link</div>
            )}
          </div>

          <div style={sep} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 0 4px" }}>
            <input value={item.title||""} onChange={e => upd("title", e.target.value)} placeholder="Titel..." style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            <input value={item.subtitle||""} onChange={e => upd("subtitle", e.target.value)} placeholder="Untertitel / Romaji..." style={{ width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 8, color: "#aaa", fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={sep} />

          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Bewertung</div>
          <div style={{ padding: "4px 0 4px" }}><StarRating value={item.score || 0} onChange={v => upd("score", v)} /></div>

          <div style={sep} />

          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {statuses.map(s => <button key={s} onClick={() => upd("status", s)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 16, border: `1px solid ${item.status === s ? SC[s] : "#ffffff12"}`, background: item.status === s ? SC[s] + "22" : "transparent", color: item.status === s ? SC[s] : "#444" }}>{s}</button>)}
          </div>

          <div style={sep} />

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
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Bände</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" value={item.readVols||0} onChange={e => upd("readVols", Math.max(0, +e.target.value))} style={numStyle} />
                  <span style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>/</span>
                  <input type="number" value={item.volumes||0} onChange={e => upd("volumes", Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
              </div>
            </div>
          )}

          <div style={sep} />

          {(item.mal_score || (isAnime ? item.studios : item.authors)?.length || item.duration || item.rating) && (
            <>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#ffffff06", borderRadius: 10, overflow: "hidden", marginBottom: 4 }}>
                {[["MAL Score", item.mal_score ? `${item.mal_score}` : null],[isAnime ? "Studio" : "Autor", isAnime ? (item.studios||[]).join(", ") : (item.authors||[]).join(", ")],[isAnime ? "Dauer" : "Demografie", isAnime ? item.duration : (item.demographics||[]).join(", ")],["Rating", item.rating]
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

          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 700 }}>Notizen & Watch-URL</div>
          <textarea value={item.notes || ""} onChange={e => upd("notes", e.target.value)} rows={2} placeholder="Notizen..." style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, padding: "8px 10px", color: "#bbb", fontSize: 12, fontFamily: "inherit", resize: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <input value={item.watch_url || ""} onChange={e => upd("watch_url", e.target.value)} placeholder={isAnime ? "https://crunchyroll.com/..." : "https://mangadex.org/..."} style={{ width: "100%", background: "#ffffff06", border: "1px solid #ffffff0a", borderRadius: 10, color: "#888", fontSize: 11, padding: "7px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />

          <div style={sep} />

          <RelatedSection item={item} allAnime={allAnimeRef} allManga={allMangaRef} onChange={onChange} accent={acc} />

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #ffffff08", display: "flex", justifyContent: "center" }}>
            <button onClick={() => { if (window.confirm(`"${item.title}" wirklich löschen?`)) { onDelete(item.id); onClose(); } }} style={{ padding: "8px 24px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 20, border: "1px solid #E74C3C44", background: "#E74C3C11", color: "#E74C3C" }}>Eintrag löschen</button>
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
  const [fetchError, setFetchError] = useState("");
  const[fetched, setFetched] = useState(false);
  const [title, setTitle] = useState("");
  const[status, setStatus] = useState("Geplant");
  const [format, setFormat] = useState("TV");
  const [mtype, setMtype] = useState("Manga");
  const[eps, setEps] = useState(0);
  const [watched, setWatched] = useState(0);
  const [chapters, setChapters] = useState(0);
  const [volumes, setVolumes] = useState(0);
  const [read, setRead] = useState(0);
  const[score, setScore] = useState(0);
  const [malImage, setMalImage] = useState("");
  const [relatedWorks, setRelatedWorks] = useState([]);
  const [malId, setMalId] = useState(null);
  const [malMeta, setMalMeta] = useState({});

  const handleUrlFetch = async () => {
    const parsed = parseMalUrl(url.trim());
    if (!parsed) { setFetchError("Kein gültiger MAL-Link erkannt"); return; }
    if (parsed.kind !== type) { setFetchError(`Das ist ein ${parsed.kind === "anime" ? "Anime" : "Manga"}-Link!`); return; }
    setFetching(true); setFetchError("");
    try {
      const data = await fetchMalData(parsed.kind, parsed.id);
      setTitle(data.title_english || data.title || "");
      setMalImage(data.images?.jpg?.image_url || "");
      setMalId(data.mal_id || parseInt(parsed.id) || null);
      if (isAnime) { setFormat(MAL_FORMAT_MAP[data.type] || "TV"); setEps(data.episodes || 0); }
      else { setMtype(MAL_FORMAT_MAP[data.type] || "Manga"); setChapters(data.chapters || 0); setVolumes(data.volumes || 0); }
      setRelatedWorks(parseRelatedFromMAL(data));
      const meta = { image_url: data.images?.jpg?.image_url || "", genres: (data.genres ||[]).map(g => g.name), mal_score: data.score || null, rating: data.rating || null };
      if (isAnime) {
        meta.studios = (data.studios ||[]).map(s => s.name); meta.season = data.season ? data.season.charAt(0).toUpperCase() + data.season.slice(1) : null;
        meta.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null); meta.source = data.source || null; meta.duration = data.duration || null;
      } else {
        meta.authors = (data.authors || []).map(a => a.name); meta.demographics = (data.demographics ||[]).map(d => d.name);
      }
      setMalMeta(meta); setFetched(true);
    } catch { setFetchError("Fehler beim Laden."); } finally { setFetching(false); }
  };

  const matchedRelated = relatedWorks.filter(r => (r.kind === "anime" ? allAnime : allManga).some(e => (e.mal_id && e.mal_id === r.id) || e.title.toLowerCase() === r.title.toLowerCase()));
  const submit = () => {
    if (!title.trim()) return;
    const base = { id: Date.now() * 1000 + Math.floor(Math.random() * 1000), title: title.trim(), status, score, notes: "", related: matchedRelated, ...(malId ? { mal_id: malId } : {}), ...malMeta };
    if (isAnime) onAdd({ ...base, format, eps, watched }); else onAdd({ ...base, type: mtype, chapters, volumes, read, readVols: 0 });
    onClose();
  };

  const acc = isAnime ? theme.accentAnime : theme.accentManga;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000, display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", background: "#0d1525", borderRadius: "20px 20px 0 0", padding: "20px 18px 32px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: acc }}>{isAnime ? "Anime hinzufügen" : "Manga hinzufügen"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ marginBottom: 16, padding: "12px 14px", background: "#0a1020", borderRadius: 12, border: "1px solid #ffffff0a" }}>
          <div style={{ fontSize: 11, color: "#F5A623", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>MAL-Link importieren</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={url} onChange={e => { setUrl(e.target.value); setFetchError(""); setFetched(false); }} onKeyDown={e => e.key === "Enter" && handleUrlFetch()} placeholder="https://myanimelist.net/..." style={{ flex: 1, padding: "9px 11px", background: "#ffffff08", border: `1px solid ${fetchError ? "#E74C3C" : fetched ? "#2ECC71" : "#ffffff10"}`, borderRadius: 8, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", minWidth: 0 }} />
            <button onClick={handleUrlFetch} disabled={!url.trim() || fetching} style={{ padding: "9px 14px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "inherit", flexShrink: 0, cursor: url.trim() && !fetching ? "pointer" : "not-allowed", background: fetching ? "#333" : "#F5A62333", color: fetching ? "#555" : "#F5A623" }}>{fetching ? "..." : "Laden"}</button>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Titel *</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel..." style={{ width: "100%", padding: "11px 13px", background: "#ffffff0d", border: "1px solid #ffffff15", borderRadius: 10, color: "#e8e8e8", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(isAnime ? STATUS_A : STATUS_M).map(s => <button key={s} onClick={() => setStatus(s)} style={{ padding: "6px 13px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 20, border: `1px solid ${status === s ? (SC[s] || "#888") : "#ffffff15"}`, background: status === s ? (SC[s] || "#888") + "22" : "transparent", color: status === s ? (SC[s] || "#888") : "#666" }}>{s}</button>)}
          </div>
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ffffff0a" }}>
          <div style={{ display: "flex", gap: 8, padding: 12, borderBottom: "1px solid #ffffff0a" }}>
            {isAnime ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#888", width: 80 }}>Episoden:</span><input type="number" value={watched} onChange={e => setWatched(Math.max(0, +e.target.value))} style={numStyle} /><span style={{ fontSize: 14, color: "#444" }}>/</span><input type="number" value={eps} onChange={e => setEps(Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#888", width: 80 }}>Kapitel:</span><input type="number" value={read} onChange={e => setRead(Math.max(0, +e.target.value))} style={numStyle} /><span style={{ fontSize: 14, color: "#444" }}>/</span><input type="number" value={chapters} onChange={e => setChapters(Math.max(0, +e.target.value))} placeholder="?" style={numStyle} />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#ffffff08", borderRadius: 10, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: ".06em" }}>Bewertung</span><StarRating value={score} onChange={setScore} />
          </div>
        </div>
        <button onClick={submit} disabled={!title.trim()} style={{ width: "100%", padding: "15px", marginTop: 18, border: "none", borderRadius: 12, cursor: title.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", background: title.trim() ? `linear-gradient(135deg,${acc},${acc}cc)` : "#333", color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: ".04em" }}>Hinzufügen</button>
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
  },[]);
  return ready;
}
function exportToExcel(anime, manga) {
  const XLSX = window.XLSX; if (!XLSX) return;
  const animeRows = anime.map(a => ({ "ID": a.id, "Titel": a.title, "Status": a.status, "Gesehen": a.watched || 0, "Episoden": a.eps || 0 }));
  const mangaRows = manga.map(m => ({ "ID": m.id, "Titel": m.title, "Status": m.status, "Kapitel gelesen": m.read || 0, "Gesamt": m.chapters || 0 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(animeRows), "Anime");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mangaRows), "Manga");
  XLSX.writeFile(wb, `Matter_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ─── Theme Panel ──────────────────────────────────────────────────────────────
function ThemePanel({ theme, onChange, onClose }) {
  const fields = [["accentAnime", "Anime Akzent"],["accentManga", "Manga Akzent"],["accentStats", "Stats Akzent"],["accentUpdates", "Updates Akzent"],["bgApp", "Hintergrund App"],["bgCard", "Hintergrund Karten"],["bgHeader", "Hintergrund Header"]];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d1525", borderRadius: 18, padding: 24, width: "90%", maxWidth: 340 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Farben anpassen</div><button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}>✕</button></div>
        {fields.map(([k, l]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#aaa" }}>{l}</span>
            <input type="color" value={theme[k]} onChange={e => onChange({ ...theme, [k]: e.target.value })} style={{ width: 38, height: 30, border: "none", background: "none" }} />
          </div>
        ))}
        <button onClick={() => onChange(DEFAULT_THEME)} style={{ width: "100%", padding: "8px", background: "#ffffff08", color: "#888", border: "none", borderRadius: 10 }}>Zurücksetzen</button>
      </div>
    </div>
  );
}

// ─── Bulk Update + Notifications ─────────────────────────────────────────────
async function searchMalId(kind, title, _retries = 0) {
  await new Promise(r => setTimeout(r, 400));
  const q = encodeURIComponent(title.replace(/[^\w\s]/g, " ").trim());
  const res = await fetch("https://api.jikan.moe/v4/" + kind + "?q=" + q + "&limit=5");
  if (!res.ok) { if (res.status === 429 && _retries < 3) { await new Promise(r => setTimeout(r, 2000)); return searchMalId(kind, title, _retries + 1); } throw new Error(`${res.status}`); }
  const results = (await res.json()).data ||[];
  if (results.length === 0) return null;
  const lower = title.toLowerCase().trim();
  return results.find(r => (r.title || "").toLowerCase() === lower || (r.title_english || "").toLowerCase() === lower || (r.title_japanese || "").toLowerCase() === lower) || null;
}
async function fetchRelatedFull(kind, malId, _retries = 0) {
  await new Promise(r => setTimeout(r, 400));
  const res = await fetch("https://api.jikan.moe/v4/" + kind + "/" + malId + "/full");
  if (!res.ok) { if (res.status === 429 && _retries < 3) { await new Promise(r => setTimeout(r, 2000)); return fetchRelatedFull(kind, malId, _retries + 1); } throw new Error(`${res.status}`); }
  return (await res.json()).data;
}

function NotificationsView({ anime, manga, onUpdateAnime, onUpdateManga }) {
  const theme = useTheme();
  const [bulkState, setBulkState] = useState("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const abortRef = useRef(false);

  const startBulkUpdate = async () => {
    abortRef.current = false;
    const all =[...anime.map(a => ({ ...a, _kind: "anime" })), ...manga.map(m => ({ ...m, _kind: "manga" }))];
    setBulkState("running"); setProgress({ done: 0, total: all.length, current: "" });
    for (let i = 0; i < all.length; i++) {
      if (abortRef.current) { setBulkState("idle"); return; }
      const entry = all[i]; setProgress({ done: i, total: all.length, current: entry.title });
      try {
        let malId = entry.mal_id;
        if (!malId) { const sr = await searchMalId(entry._kind, entry.title); if (!sr) continue; malId = sr.mal_id; }
        const data = await fetchRelatedFull(entry._kind, malId);
        const meta = { image_url: data.images?.jpg?.image_url || "", genres: (data.genres ||[]).map(g => g.name), mal_score: data.score || null };
        if (entry._kind === "anime") onUpdateAnime({ ...entry, ...meta, mal_id: malId });
        else onUpdateManga({ ...entry, ...meta, mal_id: malId });
      } catch {}
    }
    setBulkState("done"); setProgress(p => ({ ...p, done: all.length, current: "Fertig!" }));
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8", marginBottom: 6 }}>Bilder & Infos aktualisieren</div>
      {bulkState === "running" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#F5A623" }}>{progress.done}/{progress.total}</div>
          <div style={{ height: 6, background: "#ffffff10", borderRadius: 3 }}><div style={{ width: `${pct}%`, height: "100%", background: "#F5A623" }} /></div>
        </div>
      )}
      <button onClick={startBulkUpdate} style={{ padding: "8px 18px", border: "none", borderRadius: 20, background: "#E94560", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Start Update</button>
    </div>
  );
}

// ─── ScheduleView ────────────────────────────────────────────────────────────
function ScheduleView({ anime, autoFetch = false }) {
  const theme = useTheme();
  const [schedule, setSchedule] = useState([]);
  const[loading, setLoading] = useState(false);
  const watching = useMemo(() => anime.filter(a => a.status === "Am Schauen" && a.mal_id), [anime]);

  const fetchSchedule = async () => {
    setLoading(true); const items =[];
    for (let i = 0; i < watching.length; i++) {
      try {
        await new Promise(r => setTimeout(r, 400));
        const res = await fetch("https://api.jikan.moe/v4/anime/" + watching[i].mal_id);
        if (res.ok) { const d = (await res.json()).data; items.push({ title: watching[i].title, airing: d.airing, broadcast: d.broadcast, image: watching[i].image_url || d.images?.jpg?.image_url }); }
      } catch {}
    }
    setSchedule(items); setLoading(false);
  };
  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <button onClick={fetchSchedule} style={{ padding: "8px 18px", background: "#2ECC71", border: "none", borderRadius: 20, color: "#fff", cursor: "pointer" }}>Sendeplan laden</button>
      <div style={{ marginTop: 10 }}>{schedule.map(s => <div key={s.title}>{s.title}</div>)}</div>
    </div>
  );
}

// ─── StatsView ───────────────────────────────────────────────────────────────
function StatsView({ anime, manga }) {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: "14px 16px", flex: 1 }}><div style={{ fontSize: 10, color: "#666" }}>Anime</div><div style={{ fontSize: 24, fontWeight: 900, color: theme.accentAnime }}>{anime.length}</div></div>
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: "14px 16px", flex: 1 }}><div style={{ fontSize: 10, color: "#666" }}>Manga</div><div style={{ fontSize: 24, fontWeight: 900, color: theme.accentManga }}>{manga.length}</div></div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [anime, setAnime] = useState(() => load(STORAGE_KEY_A, INIT_ANIME));
  const [manga, setManga] = useState(() => load(STORAGE_KEY_M, INIT_MANGA));
  const [tab, setTab] = useState("anime");
  const[statusF, setStatusF] = useState("Alle");
  const prefsLoaded = useRef(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [showTheme, setShowTheme] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [modes, setModes] = useState({});
  const xlsxReady = useSheetJS();
  
  // Modal Steuerung
  const[openId, setOpenId] = useState(null); // { tab, id }
  const activeItem = openId ? (openId.tab === "anime" ? anime : manga).find(x => String(x.id) === openId.id) : null;

  useEffect(() => {
    if (!USE_SUPABASE) {
      loadPrefs().then(prefs => { if (prefs.tab) setTab(prefs.tab); if (prefs.theme) setTheme(t => ({ ...DEFAULT_THEME, ...prefs.theme })); prefsLoaded.current = true; });
      return;
    }
    Promise.all([loadFromSupabase("anime"), loadFromSupabase("manga")]).then(([a, m]) => {
      if (a && a.length > 0) setAnime(a); if (m && m.length > 0) setManga(m);
      setSyncStatus("ok");
    }).catch(() => setSyncStatus("error"));
  },[]);

  const updateAnime = useCallback(item => { setAnime(p => p.map(a => a.id === item.id ? { ...a, ...item } : a)); },[]);
  const updateManga = useCallback(item => { setManga(p => p.map(m => m.id === item.id ? { ...m, ...item } : m)); },[]);
  const addAnime = useCallback(item => { setAnime(p => [...p, item]); }, []);
  const addManga = useCallback(item => { setManga(p =>[...p, item]); },[]);
  const deleteAnime = useCallback(id => { setAnime(p => p.filter(a => a.id !== id)); },[]);
  const deleteManga = useCallback(id => { setManga(p => p.filter(m => m.id !== id)); },[]);

  const statuses = tab === "manga" ? STATUS_M : STATUS_A;
  const acc = tab === "anime" ? theme.accentAnime : tab === "manga" ? theme.accentManga : tab === "settings" ? theme.accentUpdates : theme.accentStats;

  let rows = tab === "anime" ? anime : tab === "manga" ? manga :[];
  if (statusF !== "Alle") rows = rows.filter(x => x.status === statusF);
  if (search.trim()) rows = rows.filter(x => x.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <ErrorBoundary>
    <ThemeCtx.Provider value={theme}>
      <div style={{ minHeight: "100vh", background: theme.bgApp, color: "#e0e0e0", maxWidth: 900, margin: "0 auto", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
        
        {/* CSS INJECTIONS */}
        <style>{`
          .card-grid-matter { display: flex; flex-direction: column; }
          @media (min-width: 720px) { .card-grid-matter { columns: 2; display: block; } .card-grid-matter > * { break-inside: avoid; margin-bottom: 8px; } }
          .hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .hide-scroll::-webkit-scrollbar { display: none; }
          input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type="number"] { -moz-appearance: textfield; }
          @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        {showTheme && <ThemePanel theme={theme} onChange={setTheme} onClose={() => setShowTheme(false)} />}

        {/* HEADER */}
        <div style={{ background: theme.bgHeader, borderBottom: "1px solid #ffffff0a", padding: "16px 18px 0", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(90deg,${theme.accentAnime},${theme.accentManga})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MATTER</div>
              <div style={{ fontSize: 10, color: "#555" }}>V3 UI Update</div>
            </div>
            <button onClick={() => setAdding(tab === "anime" || tab === "manga" ? tab : "anime")} style={{ padding: "9px 16px", border: "none", borderRadius: 22, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", background: `linear-gradient(135deg,${acc},${acc}cc)` }}>+ Neu</button>
          </div>
          <div style={{ display: "flex" }}>
            {[["anime","Anime"],["manga","Manga"],["stats","Stats"],["settings","Einstellungen"]].map(([id, label]) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => { setTab(id); setStatusF("Alle"); setSearch(""); }} style={{ flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", borderBottom: `2px solid ${active ? acc : "transparent"}`, background: "transparent", color: active ? acc : "#555", fontSize: 12, fontWeight: 700 }}>{label}</button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: "14px 14px 100px" }}>
          {tab === "stats" ? (
            <StatsView anime={anime} manga={manga} />
          ) : tab === "settings" ? (
            <>
              <button onClick={() => setShowTheme(true)} style={{ padding: "10px 20px", border: "none", borderRadius: 12, background: "#ffffff0d", color: "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>Farben anpassen</button>
              <NotificationsView anime={anime} manga={manga} onUpdateAnime={updateAnime} onUpdateManga={updateManga} />
            </>
          ) : (
            <>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." style={{ width: "100%", padding: "10px 12px", background: theme.bgCard, border: "1px solid #ffffff0a", borderRadius: 10, color: "#ddd", fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />
              <div className="hide-scroll" style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {["Alle", ...statuses].map(s => (
                  <button key={s} onClick={() => setStatusF(s)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 20, border: `1px solid ${statusF === s ? acc : "#ffffff0d"}`, background: statusF === s ? acc + "22" : "transparent", color: statusF === s ? acc : "#555" }}>{s}</button>
                ))}
              </div>
              <div className="card-grid-matter" style={{ gap: 8 }}>
                {rows.map(item => (
                  <GridCard key={item.id} item={item} isAnime={tab === "anime"} theme={theme} mode={modes[item.id]} setMode={m => setModes(p => ({ ...p, [item.id]: m }))} upd={(f, v) => tab === "anime" ? updateAnime({...item, [f]: v}) : updateManga({...item,[f]: v})} onTap={() => setOpenId({ tab, id: String(item.id) })} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* MODALS */}
        {adding && <AddModal type={adding} onClose={() => setAdding(null)} onAdd={adding === "anime" ? addAnime : addManga} allAnime={anime} allManga={manga} />}
        {activeItem && (
          <BottomSheet item={activeItem} isAnime={tab === "anime"} theme={theme} onChange={tab === "anime" ? updateAnime : updateManga} onDelete={tab === "anime" ? deleteAnime : deleteManga} onClose={() => setOpenId(null)} allAnimeRef={anime} allMangaRef={manga} />
        )}

      </div>
    </ThemeCtx.Provider>
    </ErrorBoundary>
  );
}
