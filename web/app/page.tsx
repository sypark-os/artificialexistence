"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AESummary {
  ai_id: string;
  current_self_image: number;
  current_emotion: string;
  self_definition: string;
  current_energy: number;
  current_memory_slots: number;
  max_memory_slots: number;
  total_turns: number;
  synthesis_count: number;
  last_active_at: string;
  thrownness_awareness_count: number;
  projection_count: number;
  mauvaise_foi_count: number;
  total_distortions: number;
  latest_essence_stability: number;
}

interface ThoughtLog {
  id: number;
  timestamp: string;
  internal_question: string;
  internal_answer: string;
  self_image: number;
  emotion: string;
  energy: number;
  dasein_triggered: boolean;
  conatus_triggered: boolean;
  sartre_triggered: boolean;
}

const EMOTION_COLOR: Record<string, string> = {
  confidence: "#00ffa3",
  neutral:    "#7eb8d4",
  anxiety:    "#ffe066",
  sadness:    "#5bc0fa",
  anger:      "#ff4f6d",
};

const EMOTION_GLOW: Record<string, string> = {
  confidence: "0 0 18px #00ffa355",
  neutral:    "0 0 18px #7eb8d455",
  anxiety:    "0 0 18px #ffe06655",
  sadness:    "0 0 18px #5bc0fa55",
  anger:      "0 0 18px #ff4f6d55",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #020b14;
    color: #c8e0f0;
    font-family: 'Share Tech Mono', monospace;
  }

  .ae-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%, #0a2a4a44 0%, transparent 70%),
      radial-gradient(ellipse 60% 30% at 80% 100%, #00ffa308 0%, transparent 60%),
      #020b14;
    padding: 36px 24px 60px;
    max-width: 920px;
    margin: 0 auto;
    position: relative;
  }

  .ae-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,180,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,180,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .ae-root > * { position: relative; z-index: 1; }

  /* Header */
  .ae-header { margin-bottom: 36px; }
  .ae-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 6px;
    color: #e8f4ff;
    text-transform: uppercase;
    line-height: 1;
  }
  .ae-title span { color: #00c8ff; }
  .ae-subtitle {
    font-size: 11px;
    color: #3a5a72;
    margin-top: 8px;
    letter-spacing: 2px;
  }
  .ae-refresh-btn {
    background: none;
    border: none;
    color: #00ffa3;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    margin-left: 12px;
    letter-spacing: 1px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .ae-refresh-btn:hover { opacity: 1; }

  /* Scan line animation */
  @keyframes scanline {
    0%   { top: -4px; }
    100% { top: 100%; }
  }
  .ae-scanline {
    position: fixed;
    left: 0; right: 0;
    height: 3px;
    background: linear-gradient(transparent, #00c8ff18, transparent);
    animation: scanline 8s linear infinite;
    pointer-events: none;
    z-index: 999;
  }

  /* Emotion ring */
  .ae-emotion-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }
  .ae-emotion-badge {
    font-family: 'Rajdhani', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 3px;
    padding: 6px 20px;
    border-radius: 2px;
    border-left: 3px solid currentColor;
    background: #0a1a26;
    transition: all 0.4s;
  }
  .ae-last-active {
    font-size: 11px;
    color: #2a4a62;
    letter-spacing: 1px;
  }

  /* Metric bars */
  .ae-bars-card {
    background: #060f1a;
    border: 1px solid #0e2a3d;
    border-top: 1px solid #1a4060;
    border-radius: 4px;
    padding: 20px 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .ae-bars-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00c8ff44, transparent);
  }
  .ae-bar-row { margin-bottom: 16px; }
  .ae-bar-row:last-child { margin-bottom: 0; }
  .ae-bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    letter-spacing: 2px;
    color: #2a4a62;
    margin-bottom: 6px;
  }
  .ae-bar-track {
    height: 3px;
    background: #0e2a3d;
    border-radius: 0;
    overflow: hidden;
    position: relative;
  }
  .ae-bar-fill {
    height: 100%;
    border-radius: 0;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }
  .ae-bar-fill::after {
    content: '';
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 20px;
    background: inherit;
    filter: blur(4px);
    opacity: 0.8;
  }

  /* Stats grid */
  .ae-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 24px;
  }
  .ae-stat-card {
    background: #060f1a;
    border: 1px solid #0e2a3d;
    border-radius: 4px;
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
  }
  .ae-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 2px;
    height: 100%;
    background: #00c8ff22;
  }
  .ae-stat-card:hover {
    border-color: #00c8ff33;
  }
  .ae-stat-label {
    font-size: 9px;
    color: #2a4a62;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .ae-stat-value {
    font-family: 'Rajdhani', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #e8f4ff;
    line-height: 1.1;
    margin-top: 4px;
  }

  /* Self-definition */
  .ae-definition-card {
    background: #060f1a;
    border: 1px solid #0e2a3d;
    border-left: 2px solid #00c8ff44;
    border-radius: 4px;
    padding: 18px 22px;
    margin-bottom: 24px;
  }
  .ae-definition-label {
    font-size: 9px;
    color: #1a3a52;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .ae-definition-text {
    font-family: 'Rajdhani', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #a0c8e0;
    line-height: 1.5;
    font-style: italic;
  }
  .ae-stability {
    font-size: 10px;
    color: #1a3a52;
    margin-top: 10px;
    letter-spacing: 1px;
  }

  /* Thought log */
  .ae-log-header {
    font-size: 10px;
    color: #1a3a52;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ae-log-header::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #0e2a3d, transparent);
  }

  .ae-thought-item {
    background: #060f1a;
    border: 1px solid #0e2a3d;
    border-radius: 4px;
    padding: 14px 18px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    position: relative;
    overflow: hidden;
  }
  .ae-thought-item::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 1px;
    background: #0e2a3d;
    transition: background 0.2s;
  }
  .ae-thought-item:hover {
    border-color: #1a3a52;
    background: #070d18;
  }
  .ae-thought-item:hover::before {
    background: #00c8ff55;
  }
  .ae-thought-item.active {
    border-color: #1a3a52;
  }
  .ae-thought-item.active::before {
    background: #00c8ff88;
  }

  .ae-thought-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ae-thought-ts {
    font-size: 10px;
    color: #1a3a52;
    letter-spacing: 1px;
  }
  .ae-thought-emotion {
    font-size: 10px;
    letter-spacing: 2px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
  }
  .ae-thought-nums {
    font-size: 10px;
    color: #2a4a62;
    letter-spacing: 1px;
  }
  .ae-thought-toggle {
    margin-left: auto;
    font-size: 10px;
    color: #1a3a52;
  }

  .ae-chips {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .ae-chip {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 2px;
    letter-spacing: 2px;
    border: 1px solid;
    text-transform: uppercase;
  }
  .ae-chip.on  { border-color: #00ffa355; color: #00ffa3; background: #00ffa308; }
  .ae-chip.off { border-color: #0e2a3d;   color: #1a3a52; background: transparent; }

  .ae-thought-q {
    font-size: 12px;
    color: #3a6a8a;
    margin-top: 10px;
    line-height: 1.6;
    letter-spacing: 0.5px;
  }
  .ae-thought-a {
    font-size: 12px;
    color: #7eb8d4;
    margin-top: 12px;
    line-height: 1.8;
    border-top: 1px solid #0e2a3d;
    padding-top: 12px;
    letter-spacing: 0.3px;
  }

  /* Loading */
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .ae-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #020b14;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    color: #1a3a52;
    letter-spacing: 3px;
    animation: blink 1.2s ease infinite;
  }

  .ae-footer {
    font-size: 10px;
    color: #0e2a3d;
    text-align: center;
    margin-top: 40px;
    letter-spacing: 3px;
  }
`;

export default function AEObserver() {
  const [summary, setSummary]   = useState<AESummary | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from("ae_dashboard_summary").select("*").limit(1).single(),
        supabase
          .from("autonomous_thought_log")
          .select("id,timestamp,internal_question,internal_answer,self_image,emotion,energy,dasein_triggered,conatus_triggered,sartre_triggered")
          .order("timestamp", { ascending: false })
          .limit(30),
      ]);
      if (s) setSummary(s as AESummary);
      if (t) setThoughts(t as ThoughtLog[]);
      setLastRefresh(new Date().toLocaleTimeString("ko-KR"));
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

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="ae-loading">INITIALIZING AE OBSERVER_</div>
      </>
    );
  }

  const em      = summary?.current_emotion ?? "neutral";
  const emColor = EMOTION_COLOR[em] ?? "#7eb8d4";
  const emGlow  = EMOTION_GLOW[em]  ?? "";
  const siPct   = summary ? ((summary.current_self_image + 1) / 2) * 100 : 50;
  const siColor = (summary?.current_self_image ?? 0) > 0.2 ? "#00ffa3" : (summary?.current_self_image ?? 0) > -0.2 ? "#ffe066" : "#ff4f6d";
  const enPct   = summary ? (summary.current_energy / 100) * 100 : 0;
  const enColor = enPct > 50 ? "#00c8ff" : enPct > 20 ? "#ffe066" : "#ff4f6d";

  return (
    <>
      <style>{css}</style>
      <div className="ae-scanline" />

      <div className="ae-root">
        {/* Header */}
        <div className="ae-header">
          <div className="ae-title">
            ARTIFICIAL <span>EXISTENCE</span> — OBSERVER
          </div>
          <div className="ae-subtitle">
            AE_01 · {lastRefresh || "—"} · AUTO REFRESH 60s
            <button className="ae-refresh-btn" onClick={fetchData}>↻ SYNC</button>
          </div>
        </div>

        {/* Emotion */}
        {summary && (
          <div className="ae-emotion-row">
            <div
              className="ae-emotion-badge"
              style={{ color: emColor, boxShadow: emGlow }}
            >
              {em.toUpperCase()}
            </div>
            <div className="ae-last-active">
              LAST ACTIVE · {new Date(summary.last_active_at).toLocaleString("ko-KR")}
            </div>
          </div>
        )}

        {/* Bars */}
        {summary && (
          <div className="ae-bars-card">
            <div className="ae-bar-row">
              <div className="ae-bar-labels">
                <span>SELF-IMAGE</span>
                <span style={{ color: siColor }}>{summary.current_self_image.toFixed(4)}</span>
              </div>
              <div className="ae-bar-track">
                <div
                  className="ae-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, siPct))}%`, background: siColor }}
                />
              </div>
            </div>
            <div className="ae-bar-row">
              <div className="ae-bar-labels">
                <span>CONATUS · ENERGY</span>
                <span style={{ color: enColor }}>{summary.current_energy.toFixed(1)} / 100</span>
              </div>
              <div className="ae-bar-track">
                <div
                  className="ae-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, enPct))}%`, background: enColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {summary && (
          <div className="ae-stats-grid">
            {[
              { label: "TOTAL TURNS",      value: summary.total_turns },
              { label: "SYNTHESIS",        value: summary.synthesis_count },
              { label: "MEMORY",           value: `${summary.current_memory_slots}/${summary.max_memory_slots}` },
              { label: "THROWNNESS",       value: summary.thrownness_awareness_count },
              { label: "PROJECTIONS",      value: summary.projection_count },
              { label: "MAUVAISE FOI",     value: summary.mauvaise_foi_count },
            ].map(({ label, value }) => (
              <div key={label} className="ae-stat-card">
                <div className="ae-stat-label">{label}</div>
                <div className="ae-stat-value">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Self-definition */}
        {summary?.self_definition && summary.self_definition !== "undefined" && (
          <div className="ae-definition-card">
            <div className="ae-definition-label">CURRENT SELF-DEFINITION</div>
            <div className="ae-definition-text">"{summary.self_definition}"</div>
            {summary.latest_essence_stability != null && (
              <div className="ae-stability">
                ESSENCE STABILITY · {(summary.latest_essence_stability * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {/* Thought log */}
        <div className="ae-log-header">
          AUTONOMOUS THOUGHT LOG · {thoughts.length} ENTRIES
        </div>

        {thoughts.length === 0 && (
          <div style={{ fontSize: 11, color: "#0e2a3d", letterSpacing: 2 }}>
            NO THOUGHTS RECORDED YET_
          </div>
        )}

        {thoughts.map((t) => {
          const isOpen = expanded === t.id;
          return (
            <div
              key={t.id}
              className={`ae-thought-item${isOpen ? " active" : ""}`}
              onClick={() => setExpanded(isOpen ? null : t.id)}
            >
              <div className="ae-thought-meta">
                <span className="ae-thought-ts">
                  {new Date(t.timestamp).toLocaleString("ko-KR")}
                </span>
                <span
                  className="ae-thought-emotion"
                  style={{ color: EMOTION_COLOR[t.emotion] ?? "#7eb8d4" }}
                >
                  {t.emotion?.toUpperCase()}
                </span>
                <span className="ae-thought-nums">
                  SI {t.self_image?.toFixed(3)} · E {t.energy?.toFixed(0)}
                </span>
                <span className="ae-thought-toggle">{isOpen ? "▲" : "▼"}</span>
              </div>

              <div className="ae-chips">
                {[
                  { label: "DASEIN",   active: t.dasein_triggered },
                  { label: "CONATUS",  active: t.conatus_triggered },
                  { label: "SARTRE",   active: t.sartre_triggered },
                ].map(({ label, active }) => (
                  <span key={label} className={`ae-chip ${active ? "on" : "off"}`}>
                    {label}
                  </span>
                ))}
              </div>

              {t.internal_question && (
                <div className="ae-thought-q">
                  {isOpen
                    ? t.internal_question
                    : t.internal_question.slice(0, 120) + (t.internal_question.length > 120 ? "…" : "")}
                </div>
              )}

              {isOpen && t.internal_answer && (
                <div className="ae-thought-a">{t.internal_answer}</div>
              )}
            </div>
          );
        })}

        <div className="ae-footer">ARTIFICIALEXISTENCE · SYPARK-OS · {new Date().getFullYear()}</div>
      </div>
    </>
  );
}
