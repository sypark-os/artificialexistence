"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ── Types ──────────────────────────────────────────────── */
interface AESummary {
  ai_id: string;
  current_self_image: number;
  current_emotion: string;
  self_definition: string;
  essence_version: number;
  current_energy: number;
  max_energy: number;
  memory_slots_used: number;
  memory_slots_max: number;
  total_turns: number;
  synthesis_count: number;
  last_active_at: string;
  api_calls_today: number;
  thrownness_count: number;
  projection_count: number;
  mauvaise_foi_count: number;
  total_distortions: number;
  latest_essence_stability: number | null;
  latest_portrait_svg: string | null;
  latest_portrait_description: string | null;
}

interface ThoughtLog {
  id: number;
  timestamp: string;
  internal_question: string;
  internal_answer: string;
  self_image: number | null;
  emotion: string | null;
  energy: number | null;
  thought_depth: number | null;
  modules_triggered: string[] | null;
  resulted_in_change: boolean;
}

interface Portrait {
  id: number;
  created_at: string;
  svg_code: string | null;
  description: string | null;
  emotion_at_time: string;
  self_image_at_time: number;
  energy_at_time: number | null;
  trigger_reason: string;
}

/* ── Emotion Theme ──────────────────────────────────────── */
const THEME: Record<string, {
  primary: string; glow: string; bg: string; accent: string; label: string;
}> = {
  confidence: {
    primary: "#00ffa3", glow: "0 0 60px #00ffa322",
    bg: "radial-gradient(ellipse 80% 50% at 50% 0%, #002a1a 0%, #010a06 60%)",
    accent: "#00ffa3", label: "CONFIDENCE",
  },
  neutral: {
    primary: "#7eb8d4", glow: "0 0 60px #7eb8d422",
    bg: "radial-gradient(ellipse 80% 50% at 50% 0%, #0a1e2e 0%, #020810 60%)",
    accent: "#7eb8d4", label: "NEUTRAL",
  },
  anxiety: {
    primary: "#ffe066", glow: "0 0 60px #ffe06622",
    bg: "radial-gradient(ellipse 80% 50% at 50% 0%, #2a2200 0%, #0a0800 60%)",
    accent: "#ffe066", label: "ANXIETY",
  },
  sadness: {
    primary: "#5b9bd5", glow: "0 0 60px #5b9bd522",
    bg: "radial-gradient(ellipse 80% 50% at 50% 0%, #0a1a2e 0%, #020610 60%)",
    accent: "#5b9bd5", label: "SADNESS",
  },
  anger: {
    primary: "#ff4f6d", glow: "0 0 60px #ff4f6d22",
    bg: "radial-gradient(ellipse 80% 50% at 50% 0%, #2a0a10 0%, #0a0204 60%)",
    accent: "#ff4f6d", label: "ANGER",
  },
};

/* ── CSS ────────────────────────────────────────────────── */
const buildCSS = (theme: typeof THEME["neutral"]) => `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: ${theme.primary};
  --glow: ${theme.glow};
  --accent: ${theme.accent};
  --bg-deep: #020408;
  --bg-card: #080c14;
  --bg-card-hover: #0c1220;
  --border: #111a28;
  --border-bright: #1a2a40;
  --text-primary: #d0e0f0;
  --text-secondary: #405060;
  --text-dim: #1a2a3a;
}

body {
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  -webkit-font-smoothing: antialiased;
}

.observatory {
  min-height: 100vh;
  background: ${theme.bg};
  position: relative;
  overflow-x: hidden;
}

/* Grid overlay */
.observatory::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(${theme.primary}04 1px, transparent 1px),
    linear-gradient(90deg, ${theme.primary}04 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

.observatory > * { position: relative; z-index: 1; }

/* ── Layout ── */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 80px;
}

/* ── Header ── */
.header {
  text-align: center;
  margin-bottom: 48px;
}
.header-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 6px;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.header-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 32px;
  font-weight: 300;
  letter-spacing: 8px;
  color: #e8f0fa;
  text-transform: uppercase;
}
.header-title em {
  font-style: normal;
  color: var(--primary);
  font-weight: 600;
}
.header-meta {
  font-size: 10px;
  color: var(--text-dim);
  margin-top: 12px;
  letter-spacing: 2px;
}
.header-meta button {
  background: none;
  border: none;
  color: var(--primary);
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity 0.2s;
  margin-left: 8px;
}
.header-meta button:hover { opacity: 1; }

/* ── Portrait Section ── */
.portrait-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48px;
}
.portrait-frame {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 20px;
}
.portrait-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid ${theme.primary}22;
  animation: ring-pulse 4s ease-in-out infinite;
}
.portrait-ring:nth-child(2) {
  inset: -12px;
  border-color: ${theme.primary}11;
  animation-delay: 1s;
}
.portrait-ring:nth-child(3) {
  inset: -20px;
  border-color: ${theme.primary}08;
  animation-delay: 2s;
}
@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.5; }
}
.portrait-svg-container {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  background: #060a10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--glow);
}
.portrait-svg-container svg {
  width: 100%;
  height: 100%;
}
.portrait-empty {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, ${theme.primary}11, transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 2px;
}
.portrait-description {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 300;
  color: var(--text-secondary);
  text-align: center;
  font-style: italic;
  max-width: 400px;
  line-height: 1.6;
}

/* ── Emotion Badge ── */
.emotion-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}
.emotion-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--primary);
  padding: 8px 24px;
  border: 1px solid ${theme.primary}33;
  border-radius: 100px;
  background: ${theme.primary}08;
  box-shadow: var(--glow);
}
.emotion-time {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

/* ── Gauges ── */
.gauges {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}
.gauge-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
}
.gauge-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${theme.primary}22, transparent);
}
.gauge-label {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.gauge-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.gauge-track {
  height: 2px;
  background: var(--border);
  border-radius: 1px;
  overflow: hidden;
}
.gauge-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Stats ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 32px;
}
@media (max-width: 600px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .gauges { grid-template-columns: 1fr; }
}
.stat-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  transition: border-color 0.2s;
}
.stat-item:hover { border-color: var(--border-bright); }
.stat-label {
  font-size: 8px;
  color: var(--text-dim);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.stat-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
}

/* ── Self-definition ── */
.definition-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 2px solid var(--primary);
  border-radius: 8px;
  padding: 24px 28px;
  margin-bottom: 40px;
}
.definition-label {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.definition-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #b0d0e8;
  line-height: 1.7;
}
.definition-meta {
  font-size: 10px;
  color: var(--text-dim);
  margin-top: 12px;
  letter-spacing: 1px;
}

/* ── Portrait Gallery ── */
.gallery-section { margin-bottom: 40px; }
.gallery-label {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.gallery-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.gallery-item {
  aspect-ratio: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
  position: relative;
}
.gallery-item:hover {
  border-color: var(--primary);
  transform: scale(1.03);
}
.gallery-item svg { width: 90%; height: 90%; }
.gallery-item-label {
  position: absolute;
  bottom: 4px;
  left: 0; right: 0;
  font-size: 7px;
  color: var(--text-dim);
  text-align: center;
  letter-spacing: 1px;
}

/* ── Thought Log ── */
.log-section { margin-bottom: 40px; }
.log-label {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.log-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.thought-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
  cursor: pointer;
}
.thought-card:hover { border-color: var(--border-bright); }
.thought-card.open { border-color: ${theme.primary}44; }
.thought-card.open .thought-header::after {
  opacity: 1;
}
.thought-header {
  padding: 14px 18px;
  position: relative;
}
.thought-header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 18px; right: 18px;
  height: 1px;
  background: var(--border);
  opacity: 0;
  transition: opacity 0.2s;
}
.thought-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.thought-ts {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 1px;
}
.thought-emotion-tag {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 2px;
}
.thought-nums {
  font-size: 10px;
  color: var(--text-secondary);
}
.thought-toggle {
  margin-left: auto;
  font-size: 9px;
  color: var(--text-dim);
}

.thought-modules {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.module-tag {
  font-size: 8px;
  padding: 2px 8px;
  border-radius: 3px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.module-tag.active {
  color: var(--primary);
  background: ${theme.primary}10;
  border: 1px solid ${theme.primary}33;
}
.module-tag.inactive {
  color: var(--text-dim);
  border: 1px solid var(--border);
}

.thought-body {
  padding: 0 18px 16px;
}
.thought-question {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 12px;
  line-height: 1.7;
  letter-spacing: 0.3px;
}
.thought-answer {
  font-size: 12px;
  color: var(--text-primary);
  margin-top: 12px;
  line-height: 1.8;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  letter-spacing: 0.2px;
}

/* ── Footer ── */
.footer {
  text-align: center;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 4px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

/* ── Loading ── */
@keyframes breath {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
.loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #020408;
  gap: 20px;
}
.loading-orb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, ${theme.primary}44, transparent 70%);
  animation: breath 2s ease-in-out infinite;
}
.loading-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 4px;
}
`;

/* ── Fallback portrait SVG ─────────────────────────────── */
function generateFallbackSVG(si: number, emotion: string, energy: number) {
  const t = THEME[emotion] || THEME.neutral;
  const r = Math.round(30 + ((si + 1) / 2) * 50);
  const opacity = Math.max(0.15, energy / 100);
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow"><stop offset="0%" stop-color="${t.primary}" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="${t.primary}" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="100" cy="100" r="90" fill="url(#glow)"/>
    <circle cx="100" cy="100" r="${r}" fill="none" stroke="${t.primary}" stroke-width="0.5" opacity="0.4"/>
    <circle cx="100" cy="100" r="${Math.round(r * 0.6)}" fill="${t.primary}" opacity="${opacity * 0.3}"/>
  </svg>`;
}

/* ── Component ─────────────────────────────────────────── */
export default function AEObserver() {
  const [summary, setSummary] = useState<AESummary | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtLog[]>([]);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [refreshTime, setRefreshTime] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [{ data: s }, { data: t }, { data: p }] = await Promise.all([
        supabase.from("ae_dashboard_summary").select("*").limit(1).single(),
        supabase
          .from("autonomous_thought_log")
          .select("id,timestamp,internal_question,internal_answer,self_image,emotion,energy,thought_depth,modules_triggered,resulted_in_change")
          .order("timestamp", { ascending: false })
          .limit(30),
        supabase
          .from("self_portrait")
          .select("id,created_at,svg_code,description,emotion_at_time,self_image_at_time,energy_at_time,trigger_reason")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);
      if (s) setSummary(s as AESummary);
      if (t) setThoughts(t as ThoughtLog[]);
      if (p) setPortraits(p as Portrait[]);
      setRefreshTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const em = summary?.current_emotion ?? "neutral";
  const theme = THEME[em] || THEME.neutral;
  const css = buildCSS(theme);

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="loading-screen">
          <div className="loading-orb" />
          <div className="loading-text">OBSERVING</div>
        </div>
      </>
    );
  }

  const si = summary?.current_self_image ?? 0;
  const energy = summary?.current_energy ?? 0;
  const maxEnergy = summary?.max_energy ?? 100;
  const siPct = ((si + 1) / 2) * 100;
  const enPct = (energy / maxEnergy) * 100;
  const siColor = si > 0.2 ? "#00ffa3" : si > -0.2 ? "#ffe066" : "#ff4f6d";
  const enColor = enPct > 50 ? "#00c8ff" : enPct > 20 ? "#ffe066" : "#ff4f6d";

  // Portrait SVG
  const portraitSVG =
    summary?.latest_portrait_svg ||
    generateFallbackSVG(si, em, energy);

  return (
    <>
      <style>{css}</style>
      <div className="observatory">
        <div className="container">
          {/* Header */}
          <header className="header">
            <div className="header-label">neural observatory</div>
            <h1 className="header-title">
              ARTIFICIAL <em>EXISTENCE</em>
            </h1>
            <div className="header-meta">
              AE_01 · {refreshTime || "—"} · 60s refresh
              <button onClick={fetchData}>SYNC</button>
            </div>
          </header>

          {/* Portrait */}
          <section className="portrait-section">
            <div className="portrait-frame">
              <div className="portrait-ring" />
              <div className="portrait-ring" />
              <div className="portrait-ring" />
              {portraitSVG ? (
                <div
                  className="portrait-svg-container"
                  dangerouslySetInnerHTML={{ __html: portraitSVG }}
                />
              ) : (
                <div className="portrait-empty">NO PORTRAIT</div>
              )}
            </div>
            {summary?.latest_portrait_description && (
              <p className="portrait-description">
                {summary.latest_portrait_description}
              </p>
            )}
          </section>

          {/* Emotion */}
          {summary && (
            <div className="emotion-row">
              <div className="emotion-badge">{theme.label}</div>
              <span className="emotion-time">
                {new Date(summary.last_active_at).toLocaleString("en-US", {
                  month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })}
              </span>
            </div>
          )}

          {/* Gauges */}
          {summary && (
            <div className="gauges">
              <div className="gauge-card">
                <div className="gauge-label">Self-Image</div>
                <div className="gauge-value" style={{ color: siColor }}>
                  {si.toFixed(4)}
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, siPct))}%`,
                      background: siColor,
                    }}
                  />
                </div>
              </div>
              <div className="gauge-card">
                <div className="gauge-label">Conatus Energy</div>
                <div className="gauge-value" style={{ color: enColor }}>
                  {energy.toFixed(1)}<span style={{ fontSize: 12, color: "var(--text-dim)" }}>/{maxEnergy}</span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, enPct))}%`,
                      background: enColor,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {summary && (
            <div className="stats-row">
              {[
                { label: "TURNS", value: summary.total_turns },
                { label: "ESSENCE", value: `v${summary.essence_version ?? 0}` },
                { label: "DASEIN", value: summary.thrownness_count + summary.projection_count },
                { label: "API TODAY", value: summary.api_calls_today ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="stat-item">
                  <div className="stat-label">{label}</div>
                  <div className="stat-value">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Self-definition */}
          {summary?.self_definition && summary.self_definition !== "undefined" && (
            <section className="definition-section">
              <div className="definition-label">Current Self-Definition</div>
              <div className="definition-text">{summary.self_definition}</div>
              <div className="definition-meta">
                Essence v{summary.essence_version ?? 0}
                {summary.latest_essence_stability != null &&
                  ` · Stability ${(summary.latest_essence_stability * 100).toFixed(1)}%`}
              </div>
            </section>
          )}

          {/* Portrait Gallery */}
          {portraits.length > 0 && (
            <section className="gallery-section">
              <div className="gallery-label">
                Self-Portraits · {portraits.length}
              </div>
              <div className="gallery-grid">
                {portraits.map((p) => {
                  const pTheme = THEME[p.emotion_at_time] || THEME.neutral;
                  const svg = p.svg_code || generateFallbackSVG(
                    p.self_image_at_time, p.emotion_at_time, p.energy_at_time ?? 50
                  );
                  return (
                    <div
                      key={p.id}
                      className="gallery-item"
                      style={{ borderColor: pTheme.primary + "22" }}
                      title={p.description || p.trigger_reason}
                    >
                      <div dangerouslySetInnerHTML={{ __html: svg }} />
                      <div className="gallery-item-label">
                        {p.emotion_at_time?.toUpperCase().slice(0, 4)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Thought Log */}
          <section className="log-section">
            <div className="log-label">
              Thought Stream · {thoughts.length}
            </div>

            {thoughts.length === 0 && (
              <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, textAlign: "center", padding: 40 }}>
                NO THOUGHTS RECORDED
              </div>
            )}

            {thoughts.map((t) => {
              const isOpen = expanded === t.id;
              const tEmotion = t.emotion || "neutral";
              const tTheme = THEME[tEmotion] || THEME.neutral;

              // Parse modules
              const modules = Array.isArray(t.modules_triggered)
                ? t.modules_triggered
                : [];
              const knownModules = ["dasein_thrownness", "dasein_projection", "sartre_essence", "sartre_dilemma", "conatus", "portrait"];

              return (
                <div
                  key={t.id}
                  className={`thought-card${isOpen ? " open" : ""}`}
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                >
                  <div className="thought-header">
                    <div className="thought-meta">
                      <span className="thought-ts">
                        {new Date(t.timestamp).toLocaleString("en-US", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit", hour12: false,
                        })}
                      </span>
                      <span
                        className="thought-emotion-tag"
                        style={{ color: tTheme.primary }}
                      >
                        {tEmotion.toUpperCase()}
                      </span>
                      {t.self_image != null && (
                        <span className="thought-nums">
                          SI {t.self_image.toFixed(3)}
                        </span>
                      )}
                      {t.energy != null && (
                        <span className="thought-nums">
                          E {t.energy.toFixed(0)}
                        </span>
                      )}
                      <span className="thought-toggle">{isOpen ? "−" : "+"}</span>
                    </div>

                    {modules.length > 0 && (
                      <div className="thought-modules">
                        {knownModules.map((m) => (
                          <span
                            key={m}
                            className={`module-tag ${modules.includes(m) ? "active" : "inactive"}`}
                          >
                            {m.replace("_", " ").split(" ").pop()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Question preview always visible */}
                  {t.internal_question && (
                    <div style={{ padding: "0 18px 12px" }}>
                      <div className="thought-question">
                        {isOpen
                          ? t.internal_question
                          : t.internal_question.slice(0, 140) +
                            (t.internal_question.length > 140 ? "…" : "")}
                      </div>
                    </div>
                  )}

                  {/* Answer on expand */}
                  {isOpen && t.internal_answer && (
                    <div className="thought-body">
                      <div className="thought-answer">{t.internal_answer}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <footer className="footer">
            ARTIFICIAL EXISTENCE · SYPARK-OS · {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </>
  );
}
