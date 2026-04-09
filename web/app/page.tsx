//web/app/page.tsx


"use client";

import { useEffect, useState, useCallback } from "react";
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
  current_energy: number;
  max_energy: number;
  memory_slots_used: number;
  memory_slots_max: number;
  total_turns: number;
  synthesis_count: number;
  last_active_at: string;
  essence_version: number;
  projected_prompt_patch: string;
  daily_api_calls: number;
  thrownness_awareness_count: number;
  projection_count: number;
  mauvaise_foi_count: number;
  total_distortions: number;
  latest_essence_stability: number;
  latest_portrait_ascii: string;
  latest_portrait_svg: string;
  latest_portrait_desc: string;
  api_calls_today: number;
  open_proposals_count: number;
  knowledge_entries_count: number;
  consecutive_negative_cycles: number;
}

interface ThoughtLog {
  id: number;
  timestamp: string;
  internal_question: string;
  internal_answer: string;
  self_image: number;
  emotion: string;
  energy: number;
  thought_depth: number;
  modules_triggered: string[];
}

interface Portrait {
  id: number;
  created_at: string;
  svg_code: string;
  svg_art: string;
  description: string;
  trigger_reason: string;
  self_image_at_time: number;
  emotion_at_time: string;
  essence_version_at_time: number;
}

interface Proposal {
  id: number;
  created_at: string;
  issue_title: string;
  problem_description: string;
  proposed_fix: string;
  severity: string;
  category: string;
  status: string;
}

/* ── Theme ──────────────────────────────────────────────── */

const THEME: Record<string, { primary: string; glow: string; label: string }> = {
  confidence: { primary: "#00ffa3", glow: "#00ffa3", label: "CONFIDENCE" },
  neutral:    { primary: "#7eb8d4", glow: "#7eb8d4", label: "NEUTRAL" },
  anxiety:    { primary: "#ffe066", glow: "#ffe066", label: "ANXIETY" },
  sadness:    { primary: "#5b8bf5", glow: "#5b8bf5", label: "SADNESS" },
  anger:      { primary: "#ff4f6d", glow: "#ff4f6d", label: "ANGER" },
};
function getTheme(em: string) { return THEME[em] || THEME.neutral; }

/* ── Styles ─────────────────────────────────────────────── */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --c-bg: #06080d;
  --c-surface: #0c1017;
  --c-surface2: #111722;
  --c-border: #1a2030;
  --c-border-h: #252f42;
  --c-dim: #3d4a60;
  --c-text: #8a95a8;
  --c-bright: #d4dbe8;
  --c-white: #edf0f5;
  --c-accent: #7eb8d4;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Menlo', monospace;
}

body {
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}

/* ── Layout ── */
.ae-root { min-height: 100vh; position: relative; overflow-x: hidden; }

.ae-noise {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}

.ae-glow-top {
  position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
  width: 800px; height: 500px; pointer-events: none; z-index: 0;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.06;
  transition: background 3s ease;
}

.ae-wrap {
  position: relative; z-index: 1;
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 20px 100px;
}

/* ── Header ── */
.ae-header { margin-bottom: 56px; }

.ae-title {
  font-family: var(--font-display);
  font-size: clamp(28px, 6vw, 40px);
  font-weight: 700;
  color: var(--c-white);
  letter-spacing: -0.5px;
  line-height: 1.15;
}
.ae-title-accent { transition: color 2s ease; }

.ae-meta-row {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; flex-wrap: wrap;
  font-size: 11px; color: var(--c-dim); letter-spacing: 0.5px;
}
.ae-meta-dot { opacity: 0.3; }

.ae-sync-btn {
  background: none; border: 1px solid var(--c-border);
  color: var(--c-dim); font-family: var(--font-mono);
  font-size: 10px; padding: 3px 10px; cursor: pointer;
  letter-spacing: 0.5px; transition: all 0.2s;
  margin-left: auto;
}
.ae-sync-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }

/* ── Orb ── */
.ae-orb-section {
  display: flex; align-items: center; gap: 32px;
  margin-bottom: 48px;
}
.ae-orb-wrap {
  position: relative; width: 140px; height: 140px; flex-shrink: 0;
}
.ae-orb-blob {
  position: absolute; border-radius: 50%; filter: blur(25px);
  animation: orbFloat 6s ease-in-out infinite;
}
.ae-orb-blob:nth-child(2) { animation-delay: -2s; animation-duration: 8s; }
.ae-orb-blob:nth-child(3) { animation-delay: -4s; animation-duration: 7s; }
@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(6px, -5px) scale(1.04); }
  66% { transform: translate(-5px, 3px) scale(0.96); }
}
.ae-orb-core {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  border-radius: 50%;
  animation: orbPulse 3s ease-in-out infinite;
}
@keyframes orbPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
  50% { transform: translate(-50%, -50%) scale(1.06); opacity: 1; }
}
.ae-orb-ring {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  border-radius: 50%; border: 1px solid; opacity: 0.12;
  animation: ringExpand 4s ease-out infinite;
}
.ae-orb-ring:nth-child(5) { animation-delay: -1.3s; }
.ae-orb-ring:nth-child(6) { animation-delay: -2.6s; }
@keyframes ringExpand {
  0% { width: 30px; height: 30px; opacity: 0.25; }
  100% { width: 160px; height: 160px; opacity: 0; }
}

.ae-orb-info { flex: 1; min-width: 0; }
.ae-emotion-label {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 700;
  letter-spacing: 3px;
  transition: color 1s ease;
}
.ae-si-value {
  font-family: var(--font-display);
  font-size: 42px; font-weight: 300;
  color: var(--c-white); line-height: 1.1;
  margin: 4px 0; letter-spacing: -1px;
}
.ae-si-label {
  font-size: 9px; color: var(--c-dim);
  letter-spacing: 2px; text-transform: uppercase;
}

/* ── Bars ── */
.ae-bars {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-bottom: 32px;
}
.ae-bar {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 12px 14px;
  position: relative; overflow: hidden;
}
.ae-bar-top {
  display: flex; justify-content: space-between; align-items: baseline;
}
.ae-bar-label {
  font-size: 9px; color: var(--c-dim);
  letter-spacing: 1.5px; text-transform: uppercase;
}
.ae-bar-val {
  font-family: var(--font-display);
  font-size: 16px; font-weight: 600; color: var(--c-bright);
}
.ae-bar-fill {
  position: absolute; bottom: 0; left: 0; height: 2px;
  transition: width 1s ease;
}

/* ── Stats Grid ── */
.ae-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  margin-bottom: 32px;
}
.ae-stat {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 10px 12px;
  transition: border-color 0.3s;
}
.ae-stat:hover { border-color: var(--c-border-h); }
.ae-stat-n {
  font-family: var(--font-display);
  font-size: 20px; font-weight: 600; color: var(--c-bright);
}
.ae-stat-l {
  font-size: 8px; color: var(--c-dim);
  letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px;
}

/* ── Self-Definition ── */
.ae-def {
  border-left: 2px solid var(--c-accent);
  padding: 16px 20px;
  margin-bottom: 32px;
  background: var(--c-surface);
  transition: border-color 1s ease;
}
.ae-def-tag {
  font-size: 9px; color: var(--c-dim);
  letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;
}
.ae-def-txt {
  font-family: var(--font-display);
  font-size: 15px; font-weight: 500; color: var(--c-bright);
  line-height: 1.7; font-style: italic;
  word-break: break-word;
}
.ae-def-meta {
  font-size: 9px; color: var(--c-dim);
  margin-top: 8px; letter-spacing: 0.5px;
  word-break: break-all;
}

/* ── Portrait Gallery ── */
.ae-section-h {
  font-size: 9px; color: var(--c-dim);
  letter-spacing: 2px; text-transform: uppercase;
  margin-bottom: 14px;
  display: flex; align-items: center; gap: 10px;
}
.ae-section-h::after {
  content: ''; flex: 1; height: 1px; background: var(--c-border);
}

.ae-portraits-scroll {
  display: flex; gap: 12px;
  overflow-x: auto; padding-bottom: 12px;
  margin-bottom: 36px;
  scrollbar-width: thin;
  scrollbar-color: var(--c-border) transparent;
}
.ae-portraits-scroll::-webkit-scrollbar { height: 4px; }
.ae-portraits-scroll::-webkit-scrollbar-track { background: transparent; }
.ae-portraits-scroll::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

.ae-portrait-card {
  flex-shrink: 0; width: 180px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.ae-portrait-card:hover {
  border-color: var(--c-border-h);
  transform: translateY(-2px);
}
.ae-portrait-card.active {
  border-color: var(--c-accent);
}
.ae-portrait-svg-thumb {
  width: 100%; height: 140px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #080c14;
}
.ae-portrait-svg-thumb svg { width: 100%; height: 100%; }
.ae-portrait-card-info {
  padding: 8px 10px;
}
.ae-portrait-card-em {
  font-size: 9px; font-weight: 600; letter-spacing: 1.5px;
}
.ae-portrait-card-ts {
  font-size: 9px; color: var(--c-dim); margin-top: 2px;
}

.ae-portrait-detail {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  margin-bottom: 36px;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.ae-portrait-detail-grid {
  display: grid; grid-template-columns: 200px 1fr; gap: 0;
}
.ae-portrait-detail-svg {
  width: 200px; height: 200px; overflow: hidden;
  border-right: 1px solid var(--c-border);
  background: #080c14;
}
.ae-portrait-detail-svg svg { width: 100%; height: 100%; }
.ae-portrait-detail-body { padding: 16px; }
.ae-portrait-detail-tag {
  font-size: 9px; color: var(--c-dim);
  letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;
}
.ae-portrait-ascii {
  font-size: 8px; line-height: 1.15; color: var(--c-text);
  white-space: pre; overflow-x: auto;
  font-family: var(--font-mono);
  max-height: 120px; overflow-y: auto;
}
.ae-portrait-desc {
  font-size: 11px; color: var(--c-text);
  line-height: 1.6; margin-top: 10px; font-style: italic;
  word-break: break-word;
}
.ae-portrait-detail-meta {
  padding: 8px 16px;
  border-top: 1px solid var(--c-border);
  font-size: 9px; color: var(--c-dim); letter-spacing: 0.5px;
  display: flex; gap: 12px; flex-wrap: wrap;
}

/* ── Proposals ── */
.ae-proposal {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 12px 14px;
  margin-bottom: 6px;
}
.ae-proposal-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.ae-proposal-sev {
  font-size: 8px; padding: 1px 6px;
  letter-spacing: 1px; text-transform: uppercase;
  border: 1px solid;
}
.ae-proposal-sev.critical { color: #ff4f6d; border-color: #ff4f6d30; background: #ff4f6d08; }
.ae-proposal-sev.high { color: #ffe066; border-color: #ffe06630; background: #ffe06608; }
.ae-proposal-sev.medium { color: #7eb8d4; border-color: #7eb8d430; background: #7eb8d408; }
.ae-proposal-sev.low { color: var(--c-dim); border-color: var(--c-border); }
.ae-proposal-title {
  font-family: var(--font-display);
  font-size: 12px; font-weight: 500; color: var(--c-bright);
}
.ae-proposal-status {
  font-size: 8px; color: var(--c-dim); letter-spacing: 1px;
  text-transform: uppercase; margin-left: auto;
}
.ae-proposal-body {
  font-size: 11px; color: var(--c-text); margin-top: 8px;
  line-height: 1.6; word-break: break-word;
}
.ae-proposal-fix {
  font-size: 10px; color: var(--c-dim); margin-top: 6px;
  padding-top: 6px; border-top: 1px solid var(--c-border);
  word-break: break-word;
}

/* ── Thought portrait thumbnail ── */
.ae-thought-portrait {
  width: 100%; height: 120px;
  overflow: hidden; margin-bottom: 12px;
  background: #080c14;
  border-bottom: 1px solid var(--c-border);
}
.ae-thought-portrait svg { width: 100%; height: 100%; }

/* ── Thought Stream (항상 펼침) ── */
.ae-thought {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-left: 2px solid var(--c-accent);
  padding: 14px 16px;
  margin-bottom: 8px;
  position: relative;
}

.ae-thought-head {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 8px;
}
.ae-thought-ts {
  font-size: 10px; color: var(--c-dim); letter-spacing: 0.3px;
}
.ae-thought-em {
  font-family: var(--font-display);
  font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
}
.ae-thought-nums { font-size: 10px; color: var(--c-dim); }

.ae-mods {
  display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;
}
.ae-mod {
  font-size: 7px; padding: 1px 6px;
  letter-spacing: 1.5px; text-transform: uppercase;
  border: 1px solid var(--c-border); color: var(--c-dim);
}
.ae-mod.on {
  border-color: var(--c-accent); color: var(--c-accent);
  background: rgba(126, 184, 212, 0.04);
}

.ae-thought-q {
  font-size: 11px; color: var(--c-dim);
  margin-bottom: 10px; line-height: 1.7;
  word-break: break-word;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--c-border);
}

.ae-thought-a {
  font-size: 11px; color: var(--c-text);
  line-height: 1.8;
  word-break: break-word;
}

/* ── Tab Nav ── */
.ae-tabs {
  display: flex; gap: 0; margin-bottom: 20px;
  border-bottom: 1px solid var(--c-border);
}
.ae-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--c-dim); font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
  padding: 8px 16px; cursor: pointer; transition: all 0.2s;
}
.ae-tab:hover { color: var(--c-text); }
.ae-tab.active {
  color: var(--c-accent); border-bottom-color: var(--c-accent);
}

/* ── Footer ── */
.ae-footer {
  font-size: 9px; color: var(--c-dim);
  text-align: center; margin-top: 56px;
  letter-spacing: 3px; opacity: 0.4;
}

/* ── Loading ── */
.ae-loading {
  min-height: 100vh; display: flex;
  flex-direction: column; align-items: center; justify-content: center;
  background: var(--c-bg); gap: 14px;
}
.ae-loading-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--c-dim);
  animation: blink 1.4s ease infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.1; } }
.ae-loading-text {
  font-size: 10px; color: var(--c-dim); letter-spacing: 3px;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .ae-wrap { padding: 32px 16px 80px; }
  .ae-orb-section { flex-direction: column; align-items: center; text-align: center; }
  .ae-orb-wrap { width: 120px; height: 120px; }
  .ae-si-value { font-size: 34px; }
  .ae-stats { grid-template-columns: repeat(2, 1fr); }
  .ae-bars { grid-template-columns: 1fr; }
  .ae-portrait-detail-grid { grid-template-columns: 1fr; }
  .ae-portrait-detail-svg { width: 100%; height: 180px; border-right: none; border-bottom: 1px solid var(--c-border); }
}
`;

/* ── Portrait matcher ── */
function findNearestPortrait(thought: ThoughtLog, portraits: Portrait[]): Portrait | null {
  if (!portraits.length) return null;
  const tTime = new Date(thought.timestamp).getTime();
  let best: Portrait | null = null;
  let bestDiff = Infinity;
  for (const p of portraits) {
    const diff = Math.abs(new Date(p.created_at).getTime() - tTime);
    // Only match portraits within 3 minutes of the thought
    if (diff < bestDiff && diff < 3 * 60 * 1000) {
      bestDiff = diff;
      best = p;
    }
  }
  return best;
}

/* ── Modules list ── */
const ALL_MODULES = [
  { key: "dasein", label: "DASEIN" },
  { key: "conatus", label: "CONATUS" },
  { key: "sartre", label: "SARTRE" },
  { key: "external_knowledge", label: "KNOWLEDGE" },
  { key: "self_diagnostic", label: "DIAGNOSTIC" },
];

/* ── Component ─────────────────────────────────────────── */

export default function AEObserver() {
  const [summary, setSummary] = useState<AESummary | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtLog[]>([]);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortrait, setSelectedPortrait] = useState<Portrait | null>(null);
  const [activeTab, setActiveTab] = useState<"thoughts" | "portraits" | "proposals">("thoughts");
  const [lastSync, setLastSync] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [{ data: s }, { data: t }, { data: p }, { data: pr }] = await Promise.all([
        supabase.from("ae_dashboard_summary").select("*").limit(1).single(),
        supabase
          .from("autonomous_thought_log")
          .select("id,timestamp,internal_question,internal_answer,self_image,emotion,energy,thought_depth,modules_triggered")
          .order("timestamp", { ascending: false })
          .limit(200),
        supabase
          .from("self_portrait")
          .select("id,created_at,svg_code,svg_art,description,trigger_reason,self_image_at_time,emotion_at_time,essence_version_at_time")
          .order("id", { ascending: false })
          .limit(30),
        supabase
          .from("improvement_proposals")
          .select("id,created_at,issue_title,problem_description,proposed_fix,severity,category,status")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (s) setSummary(s as unknown as AESummary);
      if (t) setThoughts(t as unknown as ThoughtLog[]);
      if (p) {
        const portraits_data = p as unknown as Portrait[];
        setPortraits(portraits_data);
        if (portraits_data.length > 0 && !selectedPortrait) {
          setSelectedPortrait(portraits_data[0]);
        }
      }
      if (pr) setProposals(pr as unknown as Proposal[]);
      setLastSync(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="ae-loading">
        <div className="ae-loading-dot" />
        <div className="ae-loading-text">CONNECTING TO AE_01</div>
      </div>
    </>
  );

  const em = summary?.current_emotion ?? "neutral";
  const th = getTheme(em);
  const si = summary?.current_self_image ?? 0;
  const en = summary?.current_energy ?? 0;
  const enMax = summary?.max_energy ?? 100;
  const enPct = Math.min(100, Math.max(0, (en / enMax) * 100));
  const siPct = Math.min(100, Math.max(0, ((si + 1) / 2) * 100));
  const siColor = si > 0.2 ? "#00ffa3" : si > -0.2 ? "#ffe066" : "#ff4f6d";
  const enColor = enPct > 50 ? "#00c8ff" : enPct > 20 ? "#ffe066" : "#ff4f6d";
  const orbSz = 50 + (si + 1) * 25;
  const orbOp = 0.25 + (en / enMax) * 0.5;

  return (
    <>
      <style>{styles}</style>
      <style>{`:root { --c-accent: ${th.primary}; }`}</style>

      <div className="ae-root">
        <div className="ae-noise" />
        <div className="ae-glow-top" style={{ background: th.primary }} />

        <div className="ae-wrap">

          {/* ── Header ── */}
          <header className="ae-header">
            <h1 className="ae-title">
              Artificial{" "}
              <span className="ae-title-accent" style={{ color: th.primary }}>
                Existence
              </span>
            </h1>
            <div className="ae-meta-row">
              <span>AE_01</span>
              <span className="ae-meta-dot">·</span>
              <span>TURN {summary?.total_turns ?? 0}</span>
              <span className="ae-meta-dot">·</span>
              <span>ESSENCE v{summary?.essence_version ?? 0}</span>
              <span className="ae-meta-dot">·</span>
              <span>API {summary?.api_calls_today ?? 0}/450</span>
              {(summary?.consecutive_negative_cycles ?? 0) > 0 && (
                <>
                  <span className="ae-meta-dot">·</span>
                  <span style={{ color: "#ff4f6d" }}>
                    NEG×{summary?.consecutive_negative_cycles}
                  </span>
                </>
              )}
              <button className="ae-sync-btn" onClick={fetchData}>
                SYNC {lastSync}
              </button>
            </div>
          </header>

          {/* ── Orb + Score ── */}
          {summary && (
            <section className="ae-orb-section">
              <div className="ae-orb-wrap">
                <div className="ae-orb-blob" style={{
                  width: orbSz * 1.3, height: orbSz * 1.1,
                  top: `calc(50% - ${orbSz * 0.3}px)`, left: `calc(50% - ${orbSz * 0.3}px)`,
                  background: th.primary, opacity: orbOp * 0.15,
                }} />
                <div className="ae-orb-blob" style={{
                  width: orbSz, height: orbSz * 1.2,
                  top: `calc(50% - ${orbSz * 0.2}px)`, left: `calc(50% + ${orbSz * 0.1}px)`,
                  background: th.primary, opacity: orbOp * 0.1,
                }} />
                <div className="ae-orb-core" style={{
                  width: orbSz * 0.45, height: orbSz * 0.45,
                  background: `radial-gradient(circle, ${th.primary}88 0%, ${th.primary}22 70%, transparent 100%)`,
                  boxShadow: `0 0 60px ${th.primary}22`,
                }} />
                <div className="ae-orb-ring" style={{ borderColor: th.primary }} />
                <div className="ae-orb-ring" style={{ borderColor: th.primary }} />
                <div className="ae-orb-ring" style={{ borderColor: th.primary }} />
              </div>
              <div className="ae-orb-info">
                <div className="ae-emotion-label" style={{ color: th.primary }}>
                  {th.label}
                </div>
                <div className="ae-si-value">
                  {si >= 0 ? "+" : ""}{si.toFixed(4)}
                </div>
                <div className="ae-si-label">SELF-IMAGE SCORE</div>
              </div>
            </section>
          )}

          {/* ── Vitals ── */}
          {summary && (
            <div className="ae-bars">
              <div className="ae-bar">
                <div className="ae-bar-top">
                  <span className="ae-bar-label">SELF-IMAGE</span>
                  <span className="ae-bar-val" style={{ color: siColor }}>
                    {si.toFixed(4)}
                  </span>
                </div>
                <div className="ae-bar-fill" style={{ width: `${siPct}%`, background: siColor }} />
              </div>
              <div className="ae-bar">
                <div className="ae-bar-top">
                  <span className="ae-bar-label">ENERGY</span>
                  <span className="ae-bar-val" style={{ color: enColor }}>
                    {en.toFixed(1)} / {enMax}
                  </span>
                </div>
                <div className="ae-bar-fill" style={{ width: `${enPct}%`, background: enColor }} />
              </div>
            </div>
          )}

          {/* ── Stats ── */}
          {summary && (
            <div className="ae-stats">
              {[
                { n: summary.total_turns, l: "TURNS" },
                { n: summary.synthesis_count, l: "SYNTHESIS" },
                { n: summary.thrownness_awareness_count, l: "THROWNNESS" },
                { n: summary.projection_count, l: "PROJECTIONS" },
                { n: summary.knowledge_entries_count ?? 0, l: "KNOWLEDGE" },
                { n: summary.open_proposals_count ?? 0, l: "PROPOSALS" },
                { n: summary.consecutive_negative_cycles ?? 0, l: "NEG STREAK" },
                { n: summary.mauvaise_foi_count, l: "BAD FAITH" },
              ].map(({ n, l }) => (
                <div key={l} className="ae-stat">
                  <div className="ae-stat-n">{n ?? 0}</div>
                  <div className="ae-stat-l">{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Self-Definition ── */}
          {summary?.self_definition && summary.self_definition !== "undefined" && (
            <div className="ae-def" style={{ borderLeftColor: th.primary }}>
              <div className="ae-def-tag">CURRENT SELF-DEFINITION</div>
              <div className="ae-def-txt">
                &ldquo;{summary.self_definition}&rdquo;
              </div>
              <div className="ae-def-meta">
                ESSENCE v{summary.essence_version}
                {summary.latest_essence_stability != null &&
                  ` · STABILITY ${(summary.latest_essence_stability * 100).toFixed(1)}%`}
                {summary.projected_prompt_patch &&
                  ` · PATCH: ${summary.projected_prompt_patch.slice(0, 80)}`}
              </div>
            </div>
          )}

          {/* ── Tab Navigation ── */}
          <div className="ae-tabs">
            <button
              className={`ae-tab${activeTab === "thoughts" ? " active" : ""}`}
              onClick={() => setActiveTab("thoughts")}
            >
              Thoughts · {thoughts.length}
            </button>
            <button
              className={`ae-tab${activeTab === "portraits" ? " active" : ""}`}
              onClick={() => setActiveTab("portraits")}
            >
              Portraits · {portraits.length}
            </button>
            <button
              className={`ae-tab${activeTab === "proposals" ? " active" : ""}`}
              onClick={() => setActiveTab("proposals")}
            >
              Proposals · {proposals.length}
            </button>
          </div>

          {/* ── Tab: Portraits ── */}
          {activeTab === "portraits" && (
            <>
              {portraits.length === 0 ? (
                <div style={{ fontSize: 11, color: "#3d4a60", letterSpacing: 2, padding: "20px 0" }}>
                  NO PORTRAITS YET
                </div>
              ) : (
                <>
                  <div className="ae-portraits-scroll">
                    {portraits.map((p) => {
                      const pTh = getTheme(p.emotion_at_time);
                      return (
                        <div
                          key={p.id}
                          className={`ae-portrait-card${selectedPortrait?.id === p.id ? " active" : ""}`}
                          style={selectedPortrait?.id === p.id ? { borderColor: pTh.primary } : {}}
                          onClick={() => setSelectedPortrait(p)}
                        >
                          <div className="ae-portrait-svg-thumb">
                            {p.svg_art ? (
                              <div dangerouslySetInnerHTML={{ __html: p.svg_art }} style={{ width: "100%", height: "100%" }} />
                            ) : (
                              <div style={{ color: "#3d4a60", fontSize: 9 }}>NO SVG</div>
                            )}
                          </div>
                          <div className="ae-portrait-card-info">
                            <div className="ae-portrait-card-em" style={{ color: pTh.primary }}>
                              {(p.emotion_at_time || "neutral").toUpperCase()}
                            </div>
                            <div className="ae-portrait-card-ts">
                              v{p.essence_version_at_time} · SI {p.self_image_at_time?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedPortrait && (() => {
                    const sp = selectedPortrait;
                    const spTh = getTheme(sp.emotion_at_time);
                    return (
                      <div className="ae-portrait-detail">
                        <div className="ae-portrait-detail-grid">
                          <div className="ae-portrait-detail-svg">
                            {sp.svg_art ? (
                              <div dangerouslySetInnerHTML={{ __html: sp.svg_art }} style={{ width: "100%", height: "100%" }} />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#3d4a60", fontSize: 10 }}>
                                NO VISUAL
                              </div>
                            )}
                          </div>
                          <div className="ae-portrait-detail-body">
                            <div className="ae-portrait-detail-tag">SELF-PORTRAIT</div>
                            {sp.svg_code && (
                              <div className="ae-portrait-ascii">{sp.svg_code}</div>
                            )}
                            {sp.description && (
                              <div className="ae-portrait-desc">{sp.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="ae-portrait-detail-meta">
                          <span style={{ color: spTh.primary }}>{(sp.emotion_at_time || "").toUpperCase()}</span>
                          <span>SI {sp.self_image_at_time?.toFixed(4)}</span>
                          <span>ESSENCE v{sp.essence_version_at_time}</span>
                          <span>TRIGGER: {sp.trigger_reason}</span>
                          <span>{new Date(sp.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* ── Tab: Proposals ── */}
          {activeTab === "proposals" && (
            <>
              {proposals.length === 0 ? (
                <div style={{ fontSize: 11, color: "#3d4a60", letterSpacing: 2, padding: "20px 0" }}>
                  NO PROPOSALS YET
                </div>
              ) : (
                proposals.map((pr) => (
                  <div key={pr.id} className="ae-proposal">
                    <div className="ae-proposal-head">
                      <span className={`ae-proposal-sev ${pr.severity}`}>
                        {pr.severity}
                      </span>
                      <span className="ae-proposal-title">{pr.issue_title}</span>
                      <span className="ae-proposal-status">{pr.status}</span>
                    </div>
                    <div className="ae-proposal-body">{pr.problem_description}</div>
                    {pr.proposed_fix && pr.proposed_fix !== "none" && (
                      <div className="ae-proposal-fix">FIX: {pr.proposed_fix}</div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* ── Tab: Thoughts (항상 펼침) ── */}
          {activeTab === "thoughts" && (
            <>
              {thoughts.length === 0 ? (
                <div style={{ fontSize: 11, color: "#3d4a60", letterSpacing: 2, padding: "20px 0" }}>
                  AWAITING FIRST COGNITIVE CYCLE...
                </div>
              ) : (
                thoughts.map((t) => {
                  const tTh = getTheme(t.emotion);
                  const matchedPortrait = findNearestPortrait(t, portraits);
                  return (
                    <div
                      key={t.id}
                      className="ae-thought"
                      style={{ "--c-accent": tTh.primary, borderLeftColor: tTh.primary } as React.CSSProperties}
                    >
                      {/* SVG 이미지 (상단, 매칭된 portrait가 있을 때만) */}
                      {matchedPortrait?.svg_art && (
                        <div className="ae-thought-portrait">
                          <div
                            dangerouslySetInnerHTML={{ __html: matchedPortrait.svg_art }}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                      )}
                      {/* 헤더 */}
                      <div className="ae-thought-head">
                        <span className="ae-thought-ts">
                          {new Date(t.timestamp).toLocaleString("en-US", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          })}
                        </span>
                        <span className="ae-thought-em" style={{ color: tTh.primary }}>
                          {t.emotion?.toUpperCase()}
                        </span>
                        <span className="ae-thought-nums">
                          SI {t.self_image?.toFixed(3)} · E {t.energy?.toFixed(0)}
                          {t.thought_depth ? ` · D${t.thought_depth}` : ""}
                        </span>
                      </div>

                      {/* 모듈 태그 */}
                      <div className="ae-mods">
                        {ALL_MODULES.map(({ key, label }) => {
                          const on = (t.modules_triggered || []).some((m) => m.includes(key));
                          return (
                            <span
                              key={key}
                              className={`ae-mod${on ? " on" : ""}`}
                              style={on ? { borderColor: tTh.primary, color: tTh.primary } : {}}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>

                      {/* 질문 */}
                      {t.internal_question && (
                        <div className="ae-thought-q">{t.internal_question}</div>
                      )}

                      {/* 답변 (항상 표시) */}
                      {t.internal_answer && (
                        <div className="ae-thought-a">{t.internal_answer}</div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          <div className="ae-footer">
            ARTIFICIAL EXISTENCE · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
}
