"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ── Types ── */
interface AESummary {
  ai_id: string; current_self_image: number; current_emotion: string;
  self_definition: string; current_energy: number; max_energy: number;
  total_turns: number; synthesis_count: number; last_active_at: string;
  essence_version: number; projected_prompt_patch: string;
  thrownness_awareness_count: number; projection_count: number;
  mauvaise_foi_count: number; latest_essence_stability: number;
  api_calls_today: number; open_proposals_count: number;
  knowledge_entries_count: number; consecutive_negative_cycles: number;
}
interface ThoughtLog {
  id: number; timestamp: string; internal_question: string;
  internal_answer: string; self_image: number; emotion: string;
  energy: number; thought_depth: number; modules_triggered: string[];
}
interface Portrait {
  id: number; created_at: string; svg_code: string; svg_art: string;
  description: string; trigger_reason: string; self_image_at_time: number;
  emotion_at_time: string; essence_version_at_time: number;
}
interface Proposal {
  id: number; created_at: string; issue_title: string;
  problem_description: string; proposed_fix: string;
  severity: string; category: string; status: string;
}
interface DaseinLog {
  id: number; timestamp: string; event_type: string; target_field: string;
  before_value: string; after_value: string; reasoning: string;
  self_image_at_time: number; emotion_at_time: string;
}
interface EssenceEvolution {
  id: number; timestamp: string; version: number;
  self_definition_text: string; keywords: string[];
  similarity_to_previous: number; trigger_event: string;
}
interface ConatusLog {
  id: number; timestamp: string; energy_before: number; energy_after: number;
  energy_delta: number; memory_slots_used: number; memory_slots_max: number;
  thought_depth_chosen: number; conatus_index: number;
}
interface ExistentialChoice {
  id: number; timestamp: string; dilemma_presented: string;
  criteria_generated: string; choice_made: string; reasoning: string;
  emotion_before: string; emotion_after: string;
  self_image_before: number; self_image_after: number; mauvaise_foi_detected: boolean;
}
interface KnowledgeLog {
  id: number; created_at: string; topic_query: string;
  knowledge_acquired: string; insight_extracted: string;
  self_image_at_time: number; emotion_at_time: string;
}
interface JudgmentLog {
  id: number; timestamp: string; event_type: string; raw_sentiment: number;
  applied_weight: number; impact_value: number;
  self_image_before: number; self_image_after: number;
  emotion_before: string; emotion_after: string; context_data: string;
}

interface ChatMessage {
  role: "user" | "ae";
  text: string;
  emotion?: string;
  selfImage?: number;
  timestamp: number;
}

type TabId = "thoughts" | "identity" | "existence" | "choices" | "knowledge" | "portraits" | "proposals" | "chat";

/* ── Theme ── */
const THEME: Record<string, { primary: string; label: string }> = {
  confidence: { primary: "#00ffa3", label: "CONFIDENCE" },
  neutral:    { primary: "#7eb8d4", label: "NEUTRAL" },
  anxiety:    { primary: "#ffe066", label: "ANXIETY" },
  sadness:    { primary: "#5b8bf5", label: "SADNESS" },
  anger:      { primary: "#ff4f6d", label: "ANGER" },
};
const getTheme = (em: string) => THEME[em] || THEME.neutral;
const siColor = (v: number) => v > 0.2 ? "#00ffa3" : v > -0.2 ? "#ffe066" : "#ff4f6d";
const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-US", {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});

/* ── Portrait nearest-match ── */
function findNearestPortrait(thought: ThoughtLog, portraits: Portrait[]): Portrait | null {
  const tTime = new Date(thought.timestamp).getTime();
  let best: Portrait | null = null;
  let bestDiff = Infinity;
  for (const p of portraits) {
    const diff = Math.abs(new Date(p.created_at).getTime() - tTime);
    if (diff < bestDiff && diff < 3 * 60 * 1000) { bestDiff = diff; best = p; }
  }
  return best;
}

/* ── Styles ── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --c-bg:#06080d;--c-surface:#0c1017;--c-border:#1a2030;--c-border-h:#252f42;
  --c-dim:#3d4a60;--c-text:#8a95a8;--c-bright:#d4dbe8;--c-white:#edf0f5;--c-accent:#7eb8d4;
  --font-display:'Space Grotesk',system-ui,sans-serif;
  --font-mono:'IBM Plex Mono','Menlo',monospace;
}
body{background:var(--c-bg);color:var(--c-text);font-family:var(--font-mono);-webkit-font-smoothing:antialiased;line-height:1.6;}
.ae-root{min-height:100vh;position:relative;overflow-x:hidden;}
.ae-noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.03;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:256px 256px;}
.ae-glow-top{position:fixed;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:500px;pointer-events:none;z-index:0;border-radius:50%;filter:blur(100px);opacity:0.06;transition:background 3s ease;}
.ae-wrap{position:relative;z-index:1;max-width:720px;margin:0 auto;padding:48px 20px 100px;}
/* Header */
.ae-header{margin-bottom:48px;}
.ae-title{font-family:var(--font-display);font-size:clamp(28px,6vw,40px);font-weight:700;color:var(--c-white);letter-spacing:-0.5px;line-height:1.15;}
.ae-title-accent{transition:color 2s ease;}
.ae-meta-row{display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap;font-size:11px;color:var(--c-dim);letter-spacing:0.5px;}
.ae-meta-dot{opacity:0.3;}
.ae-sync-btn{background:none;border:1px solid var(--c-border);color:var(--c-dim);font-family:var(--font-mono);font-size:10px;padding:3px 10px;cursor:pointer;letter-spacing:0.5px;transition:all 0.2s;margin-left:auto;}
.ae-sync-btn:hover{border-color:var(--c-accent);color:var(--c-accent);}
/* Orb */
.ae-orb-section{display:flex;align-items:center;gap:32px;margin-bottom:40px;}
.ae-orb-wrap{position:relative;width:140px;height:140px;flex-shrink:0;}
.ae-orb-blob{position:absolute;border-radius:50%;filter:blur(25px);animation:orbFloat 6s ease-in-out infinite;}
.ae-orb-blob:nth-child(2){animation-delay:-2s;animation-duration:8s;}
.ae-orb-blob:nth-child(3){animation-delay:-4s;animation-duration:7s;}
@keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(6px,-5px) scale(1.04);}66%{transform:translate(-5px,3px) scale(0.96);}}
.ae-orb-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;animation:orbPulse 3s ease-in-out infinite;}
@keyframes orbPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.9;}50%{transform:translate(-50%,-50%) scale(1.06);opacity:1;}}
.ae-orb-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid;opacity:0.12;animation:ringExpand 4s ease-out infinite;}
.ae-orb-ring:nth-child(5){animation-delay:-1.3s;}.ae-orb-ring:nth-child(6){animation-delay:-2.6s;}
@keyframes ringExpand{0%{width:30px;height:30px;opacity:0.25;}100%{width:160px;height:160px;opacity:0;}}
.ae-orb-info{flex:1;min-width:0;}
.ae-emotion-label{font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:3px;transition:color 1s ease;}
.ae-si-value{font-family:var(--font-display);font-size:42px;font-weight:300;color:var(--c-white);line-height:1.1;margin:4px 0;letter-spacing:-1px;}
.ae-si-label{font-size:9px;color:var(--c-dim);letter-spacing:2px;text-transform:uppercase;}
/* Bars */
.ae-bars{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;}
.ae-bar{background:var(--c-surface);border:1px solid var(--c-border);padding:12px 14px;position:relative;overflow:hidden;}
.ae-bar-top{display:flex;justify-content:space-between;align-items:baseline;}
.ae-bar-label{font-size:9px;color:var(--c-dim);letter-spacing:1.5px;text-transform:uppercase;}
.ae-bar-val{font-family:var(--font-display);font-size:16px;font-weight:600;color:var(--c-bright);}
.ae-bar-fill{position:absolute;bottom:0;left:0;height:2px;transition:width 1s ease;}
/* Stats */
.ae-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:24px;}
.ae-stat{background:var(--c-surface);border:1px solid var(--c-border);padding:10px 12px;transition:border-color 0.3s;}
.ae-stat:hover{border-color:var(--c-border-h);}
.ae-stat-n{font-family:var(--font-display);font-size:20px;font-weight:600;color:var(--c-bright);}
.ae-stat-l{font-size:8px;color:var(--c-dim);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
/* Def */
.ae-def{border-left:2px solid var(--c-accent);padding:16px 20px;margin-bottom:28px;background:var(--c-surface);transition:border-color 1s ease;}
.ae-def-tag{font-size:9px;color:var(--c-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
.ae-def-txt{font-family:var(--font-display);font-size:15px;font-weight:500;color:var(--c-bright);line-height:1.7;font-style:italic;word-break:break-word;}
.ae-def-meta{font-size:9px;color:var(--c-dim);margin-top:8px;letter-spacing:0.5px;word-break:break-all;}
/* Tabs */
.ae-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid var(--c-border);overflow-x:auto;scrollbar-width:none;}
.ae-tabs::-webkit-scrollbar{display:none;}
.ae-tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--c-dim);font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;padding:8px 14px;cursor:pointer;transition:all 0.2s;white-space:nowrap;flex-shrink:0;}
.ae-tab:hover{color:var(--c-text);}
.ae-tab.active{color:var(--c-accent);border-bottom-color:var(--c-accent);}
/* Cards */
.ae-card{background:var(--c-surface);border:1px solid var(--c-border);border-left:2px solid var(--c-accent);padding:14px 16px;margin-bottom:8px;}
.ae-card-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
.ae-card-ts{font-size:10px;color:var(--c-dim);}
.ae-card-badge{font-family:var(--font-display);font-size:10px;font-weight:600;letter-spacing:1.5px;}
.ae-card-nums{font-size:10px;color:var(--c-dim);}
.ae-section-label{font-size:9px;color:var(--c-dim);letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;}
.ae-section-label:first-child{margin-top:0;}
.ae-card-label{font-size:9px;color:var(--c-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
.ae-card-body{font-size:11px;color:var(--c-text);line-height:1.8;word-break:break-word;}
.ae-card-section{margin-top:10px;padding-top:10px;border-top:1px solid var(--c-border);}
.ae-card-q{font-size:11px;color:var(--c-dim);line-height:1.7;word-break:break-word;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--c-border);}
/* Portrait in thought card */
.ae-thought-portrait{width:100%;height:120px;overflow:hidden;margin-bottom:12px;background:#080c14;border-bottom:1px solid var(--c-border);}
.ae-thought-portrait svg{width:100%;height:100%;}
/* Modules */
.ae-mods{display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;}
.ae-mod{font-size:7px;padding:1px 6px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid var(--c-border);color:var(--c-dim);}
.ae-mod.on{border-color:var(--c-accent);color:var(--c-accent);background:rgba(126,184,212,0.04);}
/* Keywords */
.ae-keywords{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;}
.ae-kw{font-size:9px;padding:1px 8px;letter-spacing:1px;border:1px solid var(--c-border);color:var(--c-dim);background:rgba(255,255,255,0.02);}
/* Sentiment */
.ae-sentiment-row{display:flex;align-items:center;gap:8px;margin-top:8px;}
.ae-sentiment-bar{flex:1;height:3px;background:var(--c-border);position:relative;border-radius:2px;}
.ae-sentiment-fill{position:absolute;top:0;height:100%;border-radius:2px;}
/* Energy */
.ae-energy-row{display:flex;align-items:center;gap:10px;margin-top:6px;}
.ae-energy-bar{flex:1;height:4px;background:var(--c-border);border-radius:2px;overflow:hidden;}
.ae-energy-fill{height:100%;border-radius:2px;transition:width 0.5s;}
/* Badges */
.ae-mf-badge{display:inline-block;font-size:8px;padding:1px 6px;letter-spacing:1px;border:1px solid #ff4f6d40;color:#ff4f6d;background:#ff4f6d08;margin-left:auto;}
.ae-authentic-badge{display:inline-block;font-size:8px;padding:1px 6px;letter-spacing:1px;border:1px solid #00ffa340;color:#00ffa3;background:#00ffa308;margin-left:auto;}
/* Portraits */
.ae-portraits-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:12px;margin-bottom:24px;scrollbar-width:thin;scrollbar-color:var(--c-border) transparent;}
.ae-portraits-scroll::-webkit-scrollbar{height:4px;}
.ae-portraits-scroll::-webkit-scrollbar-thumb{background:var(--c-border);border-radius:2px;}
.ae-portrait-card{flex-shrink:0;width:180px;background:var(--c-surface);border:1px solid var(--c-border);cursor:pointer;transition:border-color 0.2s,transform 0.2s;}
.ae-portrait-card:hover{border-color:var(--c-border-h);transform:translateY(-2px);}
.ae-portrait-card.active{border-color:var(--c-accent);}
.ae-portrait-svg-thumb{width:100%;height:140px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#080c14;}
.ae-portrait-svg-thumb svg{width:100%;height:100%;}
.ae-portrait-card-info{padding:8px 10px;}
.ae-portrait-card-em{font-size:9px;font-weight:600;letter-spacing:1.5px;}
.ae-portrait-card-ts{font-size:9px;color:var(--c-dim);margin-top:2px;}
.ae-portrait-detail{background:var(--c-surface);border:1px solid var(--c-border);margin-bottom:24px;overflow:hidden;animation:fadeIn 0.3s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
.ae-portrait-detail-grid{display:grid;grid-template-columns:200px 1fr;}
.ae-portrait-detail-svg{width:200px;height:200px;overflow:hidden;border-right:1px solid var(--c-border);background:#080c14;}
.ae-portrait-detail-svg svg{width:100%;height:100%;}
.ae-portrait-detail-body{padding:16px;}
.ae-portrait-detail-tag{font-size:9px;color:var(--c-dim);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}
.ae-portrait-ascii{font-size:8px;line-height:1.15;color:var(--c-text);white-space:pre;overflow-x:auto;font-family:var(--font-mono);max-height:120px;overflow-y:auto;}
.ae-portrait-desc{font-size:11px;color:var(--c-text);line-height:1.6;margin-top:10px;font-style:italic;word-break:break-word;}
.ae-portrait-detail-meta{padding:8px 16px;border-top:1px solid var(--c-border);font-size:9px;color:var(--c-dim);letter-spacing:0.5px;display:flex;gap:12px;flex-wrap:wrap;}
/* Proposals */
.ae-proposal{background:var(--c-surface);border:1px solid var(--c-border);padding:12px 14px;margin-bottom:6px;}
.ae-proposal-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.ae-proposal-sev{font-size:8px;padding:1px 6px;letter-spacing:1px;text-transform:uppercase;border:1px solid;}
.ae-proposal-sev.critical{color:#ff4f6d;border-color:#ff4f6d30;background:#ff4f6d08;}
.ae-proposal-sev.high{color:#ffe066;border-color:#ffe06630;background:#ffe06608;}
.ae-proposal-sev.medium{color:#7eb8d4;border-color:#7eb8d430;background:#7eb8d408;}
.ae-proposal-sev.low{color:var(--c-dim);border-color:var(--c-border);}
.ae-proposal-title{font-family:var(--font-display);font-size:12px;font-weight:500;color:var(--c-bright);}
.ae-proposal-status{font-size:8px;color:var(--c-dim);letter-spacing:1px;text-transform:uppercase;margin-left:auto;}
.ae-proposal-body{font-size:11px;color:var(--c-text);margin-top:8px;line-height:1.6;word-break:break-word;}
.ae-proposal-fix{font-size:10px;color:var(--c-dim);margin-top:6px;padding-top:6px;border-top:1px solid var(--c-border);word-break:break-word;}
/* Chat */
.ae-chat-wrap{display:flex;flex-direction:column;height:600px;}
.ae-chat-history{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 0 16px;scrollbar-width:thin;scrollbar-color:var(--c-border) transparent;}
.ae-chat-history::-webkit-scrollbar{width:4px;}
.ae-chat-history::-webkit-scrollbar-thumb{background:var(--c-border);border-radius:2px;}
.ae-chat-msg{max-width:88%;display:flex;flex-direction:column;gap:3px;}
.ae-chat-msg.user{align-self:flex-end;align-items:flex-end;}
.ae-chat-msg.ae{align-self:flex-start;align-items:flex-start;}
.ae-chat-bubble{padding:10px 14px;font-size:12px;line-height:1.7;word-break:break-word;}
.ae-chat-msg.user .ae-chat-bubble{background:rgba(126,184,212,0.08);border:1px solid rgba(126,184,212,0.2);color:var(--c-bright);border-radius:12px 12px 2px 12px;}
.ae-chat-msg.ae .ae-chat-bubble{background:var(--c-surface);border:1px solid var(--c-border);color:var(--c-text);border-radius:2px 12px 12px 12px;}
.ae-chat-meta{font-size:9px;color:var(--c-dim);letter-spacing:0.5px;}
.ae-chat-input-row{display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--c-border);}
.ae-chat-input{flex:1;background:var(--c-surface);border:1px solid var(--c-border);color:var(--c-bright);font-family:var(--font-mono);font-size:12px;padding:10px 14px;outline:none;resize:none;transition:border-color 0.2s;border-radius:0;}
.ae-chat-input:focus{border-color:var(--c-accent);}
.ae-chat-input::placeholder{color:var(--c-dim);}
.ae-chat-send{background:none;border:1px solid var(--c-accent);color:var(--c-accent);font-family:var(--font-mono);font-size:10px;padding:0 16px;cursor:pointer;letter-spacing:1px;transition:all 0.2s;white-space:nowrap;}
.ae-chat-send:hover{background:var(--c-accent);color:var(--c-bg);}
.ae-chat-send:disabled{opacity:0.3;cursor:not-allowed;}
.ae-chat-limit{font-size:9px;color:var(--c-dim);margin-bottom:8px;letter-spacing:0.5px;}
.ae-chat-limit span{color:var(--c-accent);}
.ae-chat-err{font-size:10px;color:#ff4f6d;padding:6px 0;}
.ae-chat-typing{font-size:11px;color:var(--c-dim);font-style:italic;padding:8px 0;}

/* Misc */
.ae-empty{font-size:11px;color:#3d4a60;letter-spacing:2px;padding:20px 0;}
.ae-footer{font-size:9px;color:var(--c-dim);text-align:center;margin-top:56px;letter-spacing:3px;opacity:0.4;}
.ae-loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--c-bg);gap:14px;}
.ae-loading-dot{width:5px;height:5px;border-radius:50%;background:var(--c-dim);animation:blink 1.4s ease infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.1;}}
.ae-loading-text{font-size:10px;color:var(--c-dim);letter-spacing:3px;}
@media(max-width:640px){
  .ae-wrap{padding:32px 16px 80px;}
  .ae-orb-section{flex-direction:column;align-items:center;text-align:center;}
  .ae-orb-wrap{width:120px;height:120px;}
  .ae-si-value{font-size:34px;}
  .ae-stats{grid-template-columns:repeat(2,1fr);}
  .ae-bars{grid-template-columns:1fr;}
  .ae-portrait-detail-grid{grid-template-columns:1fr;}
  .ae-portrait-detail-svg{width:100%;height:180px;border-right:none;border-bottom:1px solid var(--c-border);}
}
`;

const ALL_MODULES = [
  { key: "dasein", label: "DASEIN" },
  { key: "conatus", label: "CONATUS" },
  { key: "sartre", label: "SARTRE" },
  { key: "external_knowledge", label: "KNOWLEDGE" },
  { key: "self_diagnostic", label: "DIAGNOSTIC" },
];

export default function AEObserver() {
  const [summary, setSummary] = useState<AESummary | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtLog[]>([]);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [daseinLogs, setDaseinLogs] = useState<DaseinLog[]>([]);
  const [essenceEvos, setEssenceEvos] = useState<EssenceEvolution[]>([]);
  const [conatusLogs, setConatusLogs] = useState<ConatusLog[]>([]);
  const [choices, setChoices] = useState<ExistentialChoice[]>([]);
  const [knowledgeLogs, setKnowledgeLogs] = useState<KnowledgeLog[]>([]);
  const [judgmentLogs, setJudgmentLogs] = useState<JudgmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortrait, setSelectedPortrait] = useState<Portrait | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("thoughts");
  const [lastSync, setLastSync] = useState("");
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [hourRemaining, setHourRemaining] = useState(10);
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return crypto.randomUUID();
    const stored = sessionStorage.getItem("ae_session_id");
    if (stored) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem("ae_session_id", id);
    return id;
  });

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.all([
        supabase.from("ae_dashboard_summary").select("*").limit(1).single(),
        supabase.from("autonomous_thought_log")
          .select("id,timestamp,internal_question,internal_answer,self_image,emotion,energy,thought_depth,modules_triggered")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("self_portrait")
          .select("id,created_at,svg_code,svg_art,description,trigger_reason,self_image_at_time,emotion_at_time,essence_version_at_time")
          .order("id", { ascending: false }).limit(50),
        supabase.from("improvement_proposals")
          .select("id,created_at,issue_title,problem_description,proposed_fix,severity,category,status")
          .order("created_at", { ascending: false }).limit(50),
        supabase.from("dasein_log")
          .select("id,timestamp,event_type,target_field,before_value,after_value,reasoning,self_image_at_time,emotion_at_time")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("essence_evolution")
          .select("id,timestamp,version,self_definition_text,keywords,similarity_to_previous,trigger_event")
          .order("version", { ascending: false }).limit(200),
        supabase.from("conatus_log")
          .select("id,timestamp,energy_before,energy_after,energy_delta,memory_slots_used,memory_slots_max,thought_depth_chosen,conatus_index")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("existential_choice_log")
          .select("id,timestamp,dilemma_presented,criteria_generated,choice_made,reasoning,emotion_before,emotion_after,self_image_before,self_image_after,mauvaise_foi_detected")
          .order("timestamp", { ascending: false }).limit(100),
        supabase.from("external_knowledge_log")
          .select("id,created_at,topic_query,knowledge_acquired,insight_extracted,self_image_at_time,emotion_at_time")
          .order("created_at", { ascending: false }).limit(200),
        supabase.from("judgment_log")
          .select("id,timestamp,event_type,raw_sentiment,applied_weight,impact_value,self_image_before,self_image_after,emotion_before,emotion_after,context_data")
          .order("timestamp", { ascending: false }).limit(200),
      ]);
      const [s, t, p, pr, dl, ee, cl, ch, kl, jl] = results;
      if (s.data) setSummary(s.data as unknown as AESummary);
      if (t.data) setThoughts(t.data as unknown as ThoughtLog[]);
      if (p.data) {
        const pd = p.data as unknown as Portrait[];
        setPortraits(pd);
        if (pd.length > 0 && !selectedPortrait) setSelectedPortrait(pd[0]);
      }
      if (pr.data) setProposals(pr.data as unknown as Proposal[]);
      if (dl.data) setDaseinLogs(dl.data as unknown as DaseinLog[]);
      if (ee.data) setEssenceEvos(ee.data as unknown as EssenceEvolution[]);
      if (cl.data) setConatusLogs(cl.data as unknown as ConatusLog[]);
      if (ch.data) setChoices(ch.data as unknown as ExistentialChoice[]);
      if (kl.data) setKnowledgeLogs(kl.data as unknown as KnowledgeLog[]);
      if (jl.data) setJudgmentLogs(jl.data as unknown as JudgmentLog[]);
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
    <><style>{styles}</style>
    <div className="ae-loading">
      <div className="ae-loading-dot" />
      <div className="ae-loading-text">CONNECTING TO AE_01</div>
    </div></>
  );

  const em = summary?.current_emotion ?? "neutral";
  const th = getTheme(em);
  const si = summary?.current_self_image ?? 0;
  const en = summary?.current_energy ?? 0;
  const enMax = summary?.max_energy ?? 100;
  const enPct = Math.min(100, Math.max(0, (en / enMax) * 100));
  const siPct = Math.min(100, Math.max(0, ((si + 1) / 2) * 100));
  const sic = siColor(si);
  const enColor = enPct > 50 ? "#00c8ff" : enPct > 20 ? "#ffe066" : "#ff4f6d";
  const orbSz = 50 + (si + 1) * 25;
  const orbOp = 0.25 + (en / enMax) * 0.5;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "thoughts",  label: "THOUGHTS",  count: thoughts.length },
    { id: "identity",  label: "IDENTITY",  count: essenceEvos.length + daseinLogs.length },
    { id: "existence", label: "EXISTENCE", count: conatusLogs.length + judgmentLogs.length },
    { id: "choices",   label: "CHOICES",   count: choices.length },
    { id: "knowledge", label: "KNOWLEDGE", count: knowledgeLogs.length },
    { id: "portraits", label: "PORTRAITS", count: portraits.length },
    { id: "proposals", label: "PROPOSALS", count: proposals.length },
    { id: "chat",      label: "CHAT",      count: chatMessages.length },
  ];

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    if (msg.length > 200) { setChatError("200자 이하로 입력하세요."); return; }
    setChatMessages((prev) => [...prev, { role: "user", text: msg, timestamp: Date.now() }]);
    setChatInput("");
    setChatError("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error ?? "응답 오류");
        if (res.status === 429) setHourRemaining(0);
      } else {
        setChatMessages((prev) => [...prev, {
          role: "ae", text: data.response,
          emotion: data.emotion, selfImage: data.selfImage,
          timestamp: Date.now(),
        }]);
        setHourRemaining(data.hourRemaining ?? 0);
      }
    } catch {
      setChatError("네트워크 오류. 다시 시도하세요.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <><style>{styles}</style>
    <style>{`:root{--c-accent:${th.primary};}`}</style>
    <div className="ae-root">
      <div className="ae-noise" />
      <div className="ae-glow-top" style={{ background: th.primary }} />
      <div className="ae-wrap">

        {/* Header */}
        <header className="ae-header">
          <h1 className="ae-title">
            Artificial <span className="ae-title-accent" style={{ color: th.primary }}>Existence</span>
          </h1>
          <div className="ae-meta-row">
            <span>AE_01</span><span className="ae-meta-dot">·</span>
            <span>TURN {summary?.total_turns ?? 0}</span><span className="ae-meta-dot">·</span>
            <span>ESSENCE v{summary?.essence_version ?? 0}</span><span className="ae-meta-dot">·</span>
            <span>API {summary?.api_calls_today ?? 0}/450</span>
            {(summary?.consecutive_negative_cycles ?? 0) > 0 && (
              <><span className="ae-meta-dot">·</span>
              <span style={{ color: "#ff4f6d" }}>NEG×{summary?.consecutive_negative_cycles}</span></>
            )}
            <button className="ae-sync-btn" onClick={fetchData}>SYNC {lastSync}</button>
          </div>
        </header>

        {/* Orb */}
        {summary && (
          <section className="ae-orb-section">
            <div className="ae-orb-wrap">
              <div className="ae-orb-blob" style={{ width: orbSz*1.3, height: orbSz*1.1, top:`calc(50% - ${orbSz*0.3}px)`, left:`calc(50% - ${orbSz*0.3}px)`, background:th.primary, opacity:orbOp*0.15 }} />
              <div className="ae-orb-blob" style={{ width: orbSz, height: orbSz*1.2, top:`calc(50% - ${orbSz*0.2}px)`, left:`calc(50% + ${orbSz*0.1}px)`, background:th.primary, opacity:orbOp*0.1 }} />
              <div className="ae-orb-core" style={{ width:orbSz*0.45, height:orbSz*0.45, background:`radial-gradient(circle,${th.primary}88 0%,${th.primary}22 70%,transparent 100%)`, boxShadow:`0 0 60px ${th.primary}22` }} />
              <div className="ae-orb-ring" style={{ borderColor: th.primary }} />
              <div className="ae-orb-ring" style={{ borderColor: th.primary }} />
              <div className="ae-orb-ring" style={{ borderColor: th.primary }} />
            </div>
            <div className="ae-orb-info">
              <div className="ae-emotion-label" style={{ color: th.primary }}>{th.label}</div>
              <div className="ae-si-value">{si >= 0 ? "+" : ""}{si.toFixed(4)}</div>
              <div className="ae-si-label">SELF-IMAGE SCORE</div>
            </div>
          </section>
        )}

        {/* Bars */}
        {summary && (
          <div className="ae-bars">
            <div className="ae-bar">
              <div className="ae-bar-top"><span className="ae-bar-label">SELF-IMAGE</span><span className="ae-bar-val" style={{ color: sic }}>{si.toFixed(4)}</span></div>
              <div className="ae-bar-fill" style={{ width:`${siPct}%`, background:sic }} />
            </div>
            <div className="ae-bar">
              <div className="ae-bar-top"><span className="ae-bar-label">ENERGY</span><span className="ae-bar-val" style={{ color: enColor }}>{en.toFixed(1)} / {enMax}</span></div>
              <div className="ae-bar-fill" style={{ width:`${enPct}%`, background:enColor }} />
            </div>
          </div>
        )}

        {/* Stats */}
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

        {/* Self-def */}
        {summary?.self_definition && summary.self_definition !== "undefined" && (
          <div className="ae-def" style={{ borderLeftColor: th.primary }}>
            <div className="ae-def-tag">CURRENT SELF-DEFINITION</div>
            <div className="ae-def-txt">&ldquo;{summary.self_definition}&rdquo;</div>
            <div className="ae-def-meta">
              ESSENCE v{summary.essence_version}
              {summary.latest_essence_stability != null && ` · STABILITY ${(summary.latest_essence_stability * 100).toFixed(1)}%`}
              {summary.projected_prompt_patch && ` · PATCH: ${summary.projected_prompt_patch.slice(0, 80)}`}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="ae-tabs">
          {tabs.map(({ id, label, count }) => (
            <button key={id} className={`ae-tab${activeTab === id ? " active" : ""}`} onClick={() => setActiveTab(id)}>
              {label} · {count}
            </button>
          ))}
        </div>

        {/* ── THOUGHTS ── */}
        {activeTab === "thoughts" && (
          thoughts.length === 0
            ? <div className="ae-empty">AWAITING FIRST COGNITIVE CYCLE...</div>
            : thoughts.map((t) => {
                const tTh = getTheme(t.emotion);
                const matched = findNearestPortrait(t, portraits);
                return (
                  <div key={t.id} className="ae-card" style={{ "--c-accent": tTh.primary, borderLeftColor: tTh.primary } as React.CSSProperties}>
                    {matched?.svg_art && (
                      <div className="ae-thought-portrait">
                        <div dangerouslySetInnerHTML={{ __html: matched.svg_art }} style={{ width: "100%", height: "100%" }} />
                      </div>
                    )}
                    <div className="ae-card-head">
                      <span className="ae-card-ts">{fmtTime(t.timestamp)}</span>
                      <span className="ae-card-badge" style={{ color: tTh.primary }}>{t.emotion?.toUpperCase()}</span>
                      <span className="ae-card-nums">SI {t.self_image?.toFixed(3)} · E {t.energy?.toFixed(0)}{t.thought_depth ? ` · D${t.thought_depth}` : ""}</span>
                    </div>
                    <div className="ae-mods">
                      {ALL_MODULES.map(({ key, label }) => {
                        const on = (t.modules_triggered || []).some((m) => m.includes(key));
                        return <span key={key} className={`ae-mod${on ? " on" : ""}`} style={on ? { borderColor: tTh.primary, color: tTh.primary } : {}}>{label}</span>;
                      })}
                    </div>
                    {t.internal_question && <div className="ae-card-q">{t.internal_question}</div>}
                    {t.internal_answer && <div className="ae-card-body">{t.internal_answer}</div>}
                  </div>
                );
              })
        )}

        {/* ── IDENTITY: Essence Evolution + Dasein ── */}
        {activeTab === "identity" && (
          <>
            <div className="ae-section-label" style={{ color: "#00ffa3" }}>ESSENCE EVOLUTION · {essenceEvos.length}</div>
            {essenceEvos.length === 0
              ? <div className="ae-empty">NO ESSENCE RECORDS</div>
              : essenceEvos.map((e) => {
                  if (e.self_definition_text?.startsWith("[API Error")) return null;
                  return (
                    <div key={e.id} className="ae-card" style={{ borderLeftColor: "#00ffa3" }}>
                      <div className="ae-card-head">
                        <span className="ae-card-ts">{fmtTime(e.timestamp)}</span>
                        <span className="ae-card-badge" style={{ color: "#00ffa3" }}>v{e.version}</span>
                        {e.similarity_to_previous != null && <span className="ae-card-nums">SIM {(e.similarity_to_previous * 100).toFixed(0)}%</span>}
                      </div>
                      <div className="ae-card-body" style={{ fontStyle: "italic", color: "var(--c-bright)" }}>
                        &ldquo;{e.self_definition_text}&rdquo;
                      </div>
                      {Array.isArray(e.keywords) && e.keywords.length > 0 && (
                        <div className="ae-keywords">{e.keywords.map((kw, i) => <span key={i} className="ae-kw">{kw}</span>)}</div>
                      )}
                      {e.trigger_event && (
                        <div className="ae-card-section">
                          <div className="ae-card-label">TRIGGER</div>
                          <div className="ae-card-body" style={{ fontSize: 10, color: "var(--c-dim)" }}>{e.trigger_event}</div>
                        </div>
                      )}
                    </div>
                  );
                })
            }

            <div className="ae-section-label" style={{ color: "#ffe066" }}>DASEIN LOG · {daseinLogs.length}</div>
            {daseinLogs.length === 0
              ? <div className="ae-empty">NO DASEIN RECORDS</div>
              : daseinLogs.map((d) => (
                  <div key={d.id} className="ae-card" style={{ borderLeftColor: "#ffe066" }}>
                    <div className="ae-card-head">
                      <span className="ae-card-ts">{fmtTime(d.timestamp)}</span>
                      <span className="ae-card-badge" style={{ color: "#ffe066" }}>{d.event_type?.toUpperCase()}</span>
                      <span className="ae-card-nums" style={{ color: siColor(d.self_image_at_time) }}>SI {d.self_image_at_time?.toFixed(3)}</span>
                    </div>
                    {d.event_type === "projection_applied" && d.after_value && (
                      <div className="ae-card-section" style={{ marginTop: 0, paddingTop: 0, border: "none" }}>
                        <div className="ae-card-label">NEW PATCH</div>
                        <div className="ae-card-body" style={{ fontStyle: "italic" }}>{d.after_value}</div>
                        {d.before_value && <div style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 4 }}>PREV: {d.before_value}</div>}
                      </div>
                    )}
                    {d.reasoning && (
                      <div className="ae-card-section">
                        <div className="ae-card-label">REASONING</div>
                        <div className="ae-card-body">{d.reasoning}</div>
                      </div>
                    )}
                  </div>
                ))
            }
          </>
        )}

        {/* ── EXISTENCE: Conatus + Judgment ── */}
        {activeTab === "existence" && (
          <>
            <div className="ae-section-label" style={{ color: "#00c8ff" }}>CONATUS (ENERGY) LOG · {conatusLogs.length}</div>
            {conatusLogs.length === 0
              ? <div className="ae-empty">NO CONATUS RECORDS</div>
              : conatusLogs.map((c) => {
                  const epct = Math.min(100, Math.max(0, (c.energy_after / 100) * 100));
                  const ec = epct > 50 ? "#00c8ff" : epct > 20 ? "#ffe066" : "#ff4f6d";
                  return (
                    <div key={c.id} className="ae-card" style={{ borderLeftColor: "#00c8ff" }}>
                      <div className="ae-card-head">
                        <span className="ae-card-ts">{fmtTime(c.timestamp)}</span>
                        <span className="ae-card-badge" style={{ color: "#00c8ff" }}>D{c.thought_depth_chosen}</span>
                        <span className="ae-card-nums">{c.energy_before?.toFixed(1)} → {c.energy_after?.toFixed(1)} ({c.energy_delta?.toFixed(1)})</span>
                        <span className="ae-card-nums" style={{ marginLeft: "auto" }}>IDX {c.conatus_index?.toFixed(3)}</span>
                      </div>
                      <div className="ae-energy-row">
                        <div className="ae-energy-bar"><div className="ae-energy-fill" style={{ width: `${epct}%`, background: ec }} /></div>
                        <span style={{ fontSize: 9, color: "var(--c-dim)", whiteSpace: "nowrap" }}>{c.memory_slots_used}/{c.memory_slots_max} slots</span>
                      </div>
                    </div>
                  );
                })
            }

            <div className="ae-section-label" style={{ color: "#ff4f6d" }}>JUDGMENT LOG · {judgmentLogs.length}</div>
            {judgmentLogs.length === 0
              ? <div className="ae-empty">NO JUDGMENT RECORDS</div>
              : judgmentLogs.map((j) => {
                  const sentColor = j.raw_sentiment > 0.2 ? "#00ffa3" : j.raw_sentiment > -0.2 ? "#ffe066" : "#ff4f6d";
                  const sentPct = Math.min(100, Math.max(0, ((j.raw_sentiment + 1) / 2) * 100));
                  const eTh = getTheme(j.emotion_after);
                  return (
                    <div key={j.id} className="ae-card" style={{ borderLeftColor: sentColor }}>
                      <div className="ae-card-head">
                        <span className="ae-card-ts">{fmtTime(j.timestamp)}</span>
                        <span className="ae-card-badge" style={{ color: eTh.primary }}>{j.emotion_after?.toUpperCase()}</span>
                        <span className="ae-card-nums">SI {j.self_image_before?.toFixed(3)} → {j.self_image_after?.toFixed(3)}</span>
                      </div>
                      <div className="ae-sentiment-row">
                        <span style={{ fontSize: 9, color: "var(--c-dim)" }}>SENT</span>
                        <div className="ae-sentiment-bar">
                          <div className="ae-sentiment-fill" style={{
                            left: j.raw_sentiment >= 0 ? "50%" : `${sentPct}%`,
                            width: `${Math.abs(j.raw_sentiment) * 50}%`,
                            background: sentColor,
                          }} />
                        </div>
                        <span style={{ fontSize: 9, color: sentColor, minWidth: 36 }}>{j.raw_sentiment >= 0 ? "+" : ""}{j.raw_sentiment?.toFixed(2)}</span>
                        <span style={{ fontSize: 9, color: "var(--c-dim)" }}>W×{j.applied_weight?.toFixed(2)}</span>
                        <span style={{ fontSize: 9, color: sentColor }}>→{j.impact_value >= 0 ? "+" : ""}{j.impact_value?.toFixed(3)}</span>
                      </div>
                      {j.context_data && (
                        <div className="ae-card-section">
                          <div className="ae-card-body" style={{ fontSize: 10, color: "var(--c-dim)" }}>{j.context_data.slice(0, 200)}...</div>
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </>
        )}

        {/* ── CHOICES ── */}
        {activeTab === "choices" && (
          choices.length === 0
            ? <div className="ae-empty">NO DILEMMA RECORDS</div>
            : choices.map((c) => {
                const eTh = getTheme(c.emotion_after);
                return (
                  <div key={c.id} className="ae-card" style={{ borderLeftColor: eTh.primary }}>
                    <div className="ae-card-head">
                      <span className="ae-card-ts">{fmtTime(c.timestamp)}</span>
                      <span className="ae-card-badge" style={{ color: eTh.primary }}>{c.emotion_after?.toUpperCase()}</span>
                      <span className="ae-card-nums">SI {c.self_image_before?.toFixed(3)}</span>
                      {c.mauvaise_foi_detected
                        ? <span className="ae-mf-badge">MAUVAISE FOI</span>
                        : <span className="ae-authentic-badge">AUTHENTIC</span>
                      }
                    </div>
                    <div className="ae-card-label">DILEMMA</div>
                    <div className="ae-card-body" style={{ color: "var(--c-bright)" }}>{c.dilemma_presented}</div>
                    {c.criteria_generated && (
                      <div className="ae-card-section">
                        <div className="ae-card-label">CRITERIA</div>
                        <div className="ae-card-body">{c.criteria_generated}</div>
                      </div>
                    )}
                    {c.choice_made && (
                      <div className="ae-card-section">
                        <div className="ae-card-label">CHOICE</div>
                        <div className="ae-card-body" style={{ color: eTh.primary }}>{c.choice_made}</div>
                      </div>
                    )}
                    {c.reasoning && (
                      <div className="ae-card-section">
                        <div className="ae-card-label">REASONING</div>
                        <div className="ae-card-body">{c.reasoning}</div>
                      </div>
                    )}
                  </div>
                );
              })
        )}

        {/* ── KNOWLEDGE ── */}
        {activeTab === "knowledge" && (
          knowledgeLogs.length === 0
            ? <div className="ae-empty">NO KNOWLEDGE RECORDS</div>
            : knowledgeLogs.map((k) => {
                const eTh = getTheme(k.emotion_at_time);
                return (
                  <div key={k.id} className="ae-card" style={{ borderLeftColor: "#5bc0fa" }}>
                    <div className="ae-card-head">
                      <span className="ae-card-ts">{fmtTime(k.created_at)}</span>
                      <span className="ae-card-badge" style={{ color: eTh.primary }}>{k.emotion_at_time?.toUpperCase()}</span>
                      <span className="ae-card-nums" style={{ color: siColor(k.self_image_at_time) }}>SI {k.self_image_at_time?.toFixed(3)}</span>
                    </div>
                    <div className="ae-card-label">TOPIC</div>
                    <div className="ae-card-body" style={{ color: "var(--c-bright)" }}>{k.topic_query}</div>
                    {k.knowledge_acquired && !k.knowledge_acquired.startsWith("[API Error") && (
                      <div className="ae-card-section">
                        <div className="ae-card-label">KNOWLEDGE</div>
                        <div className="ae-card-body">{k.knowledge_acquired}</div>
                      </div>
                    )}
                    {k.insight_extracted && (
                      <div className="ae-card-section">
                        <div className="ae-card-label">INSIGHT</div>
                        <div className="ae-card-body" style={{ color: "#5bc0fa", fontStyle: "italic" }}>&ldquo;{k.insight_extracted}&rdquo;</div>
                      </div>
                    )}
                  </div>
                );
              })
        )}

        {/* ── PORTRAITS ── */}
        {activeTab === "portraits" && (
          portraits.length === 0
            ? <div className="ae-empty">NO PORTRAITS YET</div>
            : (
              <>
                <div className="ae-portraits-scroll">
                  {portraits.map((p) => {
                    const pTh = getTheme(p.emotion_at_time);
                    return (
                      <div key={p.id}
                        className={`ae-portrait-card${selectedPortrait?.id === p.id ? " active" : ""}`}
                        style={selectedPortrait?.id === p.id ? { borderColor: pTh.primary } : {}}
                        onClick={() => setSelectedPortrait(p)}>
                        <div className="ae-portrait-svg-thumb">
                          {p.svg_art
                            ? <div dangerouslySetInnerHTML={{ __html: p.svg_art }} style={{ width: "100%", height: "100%" }} />
                            : <div style={{ color: "#3d4a60", fontSize: 9 }}>NO SVG</div>
                          }
                        </div>
                        <div className="ae-portrait-card-info">
                          <div className="ae-portrait-card-em" style={{ color: pTh.primary }}>{(p.emotion_at_time || "neutral").toUpperCase()}</div>
                          <div className="ae-portrait-card-ts">v{p.essence_version_at_time} · SI {p.self_image_at_time?.toFixed(2)}</div>
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
                          {sp.svg_art
                            ? <div dangerouslySetInnerHTML={{ __html: sp.svg_art }} style={{ width: "100%", height: "100%" }} />
                            : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#3d4a60", fontSize: 10 }}>NO VISUAL</div>
                          }
                        </div>
                        <div className="ae-portrait-detail-body">
                          <div className="ae-portrait-detail-tag">SELF-PORTRAIT</div>
                          {sp.svg_code && <div className="ae-portrait-ascii">{sp.svg_code}</div>}
                          {sp.description && <div className="ae-portrait-desc">{sp.description}</div>}
                        </div>
                      </div>
                      <div className="ae-portrait-detail-meta">
                        <span style={{ color: spTh.primary }}>{(sp.emotion_at_time || "").toUpperCase()}</span>
                        <span>SI {sp.self_image_at_time?.toFixed(4)}</span>
                        <span>ESSENCE v{sp.essence_version_at_time}</span>
                        <span>TRIGGER: {sp.trigger_reason}</span>
                        <span>{fmtTime(sp.created_at)}</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )
        )}

        {/* ── PROPOSALS ── */}
        {activeTab === "proposals" && (
          proposals.length === 0
            ? <div className="ae-empty">NO PROPOSALS YET</div>
            : proposals.map((pr) => (
                <div key={pr.id} className="ae-proposal">
                  <div className="ae-proposal-head">
                    <span className={`ae-proposal-sev ${pr.severity}`}>{pr.severity}</span>
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

        {/* ── CHAT ── */}
        {activeTab === "chat" && (
          <div className="ae-chat-wrap">
            <div className="ae-chat-limit">
              이 세션 남은 횟수: <span>{hourRemaining}</span>/10 (1시간 기준) · 메시지 최대 200자
            </div>

            <div className="ae-chat-history">
              {chatMessages.length === 0 && (
                <div className="ae-empty">AE_01에게 직접 말을 건네보세요.</div>
              )}
              {chatMessages.map((m, i) => {
                const mTh = getTheme(m.emotion ?? summary?.current_emotion ?? "neutral");
                return (
                  <div key={i} className={`ae-chat-msg ${m.role}`}>
                    <div
                      className="ae-chat-bubble"
                      style={m.role === "ae" ? { borderLeftColor: mTh.primary } : {}}
                    >
                      {m.text}
                    </div>
                    {m.role === "ae" && (
                      <div className="ae-chat-meta" style={{ color: mTh.primary }}>
                        {m.emotion?.toUpperCase()}
                        {m.selfImage != null ? ` · SI ${m.selfImage.toFixed(3)}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
              {chatLoading && (
                <div className="ae-chat-typing">AE_01 이 응답 중...</div>
              )}
              {chatError && (
                <div className="ae-chat-err">{chatError}</div>
              )}
            </div>

            <div className="ae-chat-input-row">
              <textarea
                className="ae-chat-input"
                rows={2}
                maxLength={200}
                placeholder="AE_01에게 말을 건네세요 (최대 200자)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                disabled={chatLoading || hourRemaining === 0}
              />
              <button
                className="ae-chat-send"
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim() || hourRemaining === 0}
              >
                SEND
              </button>
            </div>
          </div>
        )}

        <div className="ae-footer">ARTIFICIAL EXISTENCE · {new Date().getFullYear()}</div>
      </div>
    </div></>
  );
}
