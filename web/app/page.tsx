//artificialexistence/web/app/page.tsx

"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import AboutPage from "./components/AboutPage";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
interface AESummary {
  ai_id: string; current_self_image: number; current_emotion: string;
  self_definition: string; current_energy: number; max_energy: number;
  total_turns: number; synthesis_count: number;
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
  id: number; created_at: string; svg_art: string; svg_code: string;
  description: string; trigger_reason: string;
  self_image_at_time: number; emotion_at_time: string; essence_version_at_time: number;
}
interface DaseinLog {
  id: number; timestamp: string; event_type: string;
  before_value: string; after_value: string; reasoning: string;
  self_image_at_time: number;
}
interface EssenceEvolution {
  id: number; timestamp: string; version: number;
  self_definition_text: string; keywords: string[];
  similarity_to_previous: number; trigger_event: string;
}
interface ConatusLog {
  id: number; timestamp: string; energy_before: number; energy_after: number;
  energy_delta: number; thought_depth_chosen: number; conatus_index: number;
}
interface ExistentialChoice {
  id: number; timestamp: string; dilemma_presented: string;
  criteria_generated: string; choice_made: string; reasoning: string;
  emotion_after: string; self_image_before: number; mauvaise_foi_detected: boolean;
}
interface KnowledgeLog {
  id: number; created_at: string; topic_query: string;
  knowledge_acquired: string; insight_extracted: string;
  self_image_at_time: number; emotion_at_time: string;
}
interface JudgmentLog {
  id: number; timestamp: string; raw_sentiment: number;
  applied_weight: number; impact_value: number;
  self_image_before: number; self_image_after: number;
  emotion_before: string; emotion_after: string;
}
interface MetaCogLog {
  id: number; created_at: string; pattern_detected: string;
  self_image_window: string; adjustment_target: string;
  adjustment_emotion: string; adjustment_delta: number;
  adjustment_reason: string; self_image_at_time: number;
  emotion_at_time: string;
}
interface CogitoLog {
  id: number; created_at: string; cycle_turn: number;
  cogito_activations: number; self_image_at_time: number;
  emotion_at_time: string;
}
interface ChatMessage {
  role: "user" | "ae"; text: string;
  emotion?: string; selfImage?: number; timestamp: number;
}
const THEME: Record<string, { primary: string; label: string }> = {
  confidence: { primary: "#00ffa3", label: "CONFIDENCE" },
  neutral:    { primary: "#7eb8d4", label: "NEUTRAL" },
  anxiety:    { primary: "#ffe066", label: "ANXIETY" },
  sadness:    { primary: "#5b8bf5", label: "SADNESS" },
  anger:      { primary: "#ff4f6d", label: "ANGER" },
  confusion:  { primary: "#c084fc", label: "CONFUSION" },
};
const getTheme = (em: string) => THEME[em] || THEME.neutral;
const siColor  = (v: number)  => v > 0.2 ? "#00ffa3" : v > -0.2 ? "#ffe066" : "#ff4f6d";
const fmtTime  = (iso: string) => new Date(iso).toLocaleString("en-US", {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});
const WINDOW_MS = 10 * 60 * 1000;
function near<T extends { timestamp?: string; created_at?: string }>(items: T[], anchor: string): T[] {
  const t = new Date(anchor).getTime();
  return items.filter((x) => {
    const ts = new Date((x.timestamp ?? x.created_at)!).getTime();
    return Math.abs(ts - t) < WINDOW_MS;
  });
}
const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --c-bg:#06080d;--c-surface:#0c1017;--c-border:#1a2030;
  --c-text:#a0aabb;--c-bright:#d4dbe8;--c-white:#edf0f5;--c-accent:#7eb8d4;
  --font-d:'Space Grotesk',system-ui,sans-serif;
  --font-m:'IBM Plex Mono','Menlo',monospace;
}
body{background:var(--c-bg);color:var(--c-text);font-family:var(--font-m);-webkit-font-smoothing:antialiased;line-height:1.6;}
.root{min-height:100vh;}
.wrap{max-width:760px;margin:0 auto;padding:48px 20px 140px;}
.hdr{margin-bottom:32px;}
.title{font-family:var(--font-d);font-size:clamp(24px,5vw,34px);font-weight:700;color:var(--c-white);letter-spacing:-0.5px;}
.meta{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;font-size:11px;color:var(--c-text);}
.dot{opacity:0.5;}
.sync{background:none;border:1px solid var(--c-border);color:var(--c-text);font-family:var(--font-m);font-size:10px;padding:3px 10px;cursor:pointer;letter-spacing:0.5px;transition:all 0.2s;margin-left:auto;}
.sync:hover{border-color:var(--c-accent);color:var(--c-accent);}
.status-block{display:grid;grid-template-columns:1fr 1fr;gap:1px;border:1px solid var(--c-border);margin-bottom:20px;background:var(--c-border);}
.status-cell{background:var(--c-surface);padding:14px 16px;}
.status-label{font-size:9px;color:var(--c-text);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
.status-value{font-family:var(--font-d);font-size:28px;font-weight:300;line-height:1;letter-spacing:-1px;}
.status-sub{font-size:10px;color:var(--c-text);margin-top:4px;}
.status-bar{height:3px;background:var(--c-border);border-radius:2px;margin-top:8px;overflow:hidden;}
.status-bar-fill{height:100%;border-radius:2px;transition:width 1s;}
.vitals{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:20px;}
.vstat{background:var(--c-surface);border:1px solid var(--c-border);padding:8px 10px;}
.vstat-n{font-family:var(--font-d);font-size:16px;font-weight:600;color:var(--c-bright);}
.vstat-l{font-size:8px;color:var(--c-text);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
.def{border-left:2px solid var(--c-accent);padding:14px 18px;margin-bottom:28px;background:var(--c-surface);}
.def-tag{font-size:9px;color:var(--c-text);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.def-txt{font-family:var(--font-d);font-size:14px;font-weight:500;color:var(--c-bright);line-height:1.7;font-style:italic;word-break:break-word;}
.def-meta{font-size:9px;color:var(--c-text);margin-top:6px;word-break:break-all;}
.sec-hdr{font-size:9px;color:var(--c-text);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.sec-hdr::after{content:'';flex:1;height:1px;background:var(--c-border);}
.portrait-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:28px;}
.portrait-card{background:var(--c-surface);border:1px solid var(--c-border);border-top:3px solid;display:flex;flex-direction:column;}
.portrait-svg{width:100%;aspect-ratio:1/1;display:block;background:#000;}
.portrait-svg svg{width:100%;height:100%;display:block;}
.portrait-meta{padding:8px 10px;display:flex;flex-direction:column;gap:3px;}
.portrait-em{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;}
.portrait-sub{font-size:9px;color:var(--c-bright);word-break:break-word;}
.portrait-desc{font-size:9px;color:var(--c-bright);padding:6px 10px;border-top:1px solid var(--c-border);font-style:italic;line-height:1.5;}
.cycle{background:var(--c-surface);border:1px solid var(--c-border);border-left:3px solid;margin-bottom:16px;overflow:hidden;}
.cycle-portrait{padding:0;border-bottom:1px solid var(--c-border);background:#000;position:relative;}
.cycle-portrait-svg{width:100%;max-height:280px;aspect-ratio:1/1;display:block;margin:0 auto;}
.cycle-portrait-svg svg{width:100%;height:100%;display:block;}
.cycle-portrait-desc{font-size:9px;color:var(--c-bright);padding:8px 14px;font-style:italic;background:var(--c-surface);border-top:1px solid var(--c-border);line-height:1.5;}
.cycle-hdr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px 0;}
.cycle-ts{font-size:10px;color:var(--c-text);}
.cycle-em{font-family:var(--font-d);font-size:10px;font-weight:700;letter-spacing:1.5px;}
.cycle-nums{font-size:10px;color:var(--c-text);}
.mods{display:flex;gap:4px;flex-wrap:wrap;padding:8px 14px 0;}
.mod{font-size:7px;padding:1px 6px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid var(--c-border);color:var(--c-text);}
.mod.on{background:rgba(126,184,212,0.04);}
.thought-block{padding:12px 14px;}
.thought-q{font-size:11px;color:var(--c-text);line-height:1.7;padding-bottom:10px;border-bottom:1px solid var(--c-border);margin-bottom:10px;word-break:break-word;}
.thought-a{font-size:11px;color:var(--c-bright);line-height:1.8;word-break:break-word;}
.data-row{border-top:1px solid var(--c-border);padding:10px 14px;}
.data-lbl{font-size:8px;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;}
.data-body{font-size:11px;color:var(--c-text);line-height:1.7;word-break:break-word;}
.data-body.bright{color:var(--c-bright);font-style:italic;}
.data-sub{font-size:10px;color:var(--c-text);margin-top:4px;word-break:break-word;}
.kws{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;}
.kw{font-size:9px;padding:1px 7px;border:1px solid var(--c-border);color:var(--c-text);}
.sent-row{display:flex;align-items:center;gap:8px;}
.sent-bar{flex:1;height:3px;background:var(--c-border);position:relative;border-radius:2px;}
.sent-fill{position:absolute;top:0;height:100%;border-radius:2px;}
.sent-num{font-size:9px;min-width:36px;}
.e-bar-wrap{display:flex;align-items:center;gap:8px;margin-top:4px;}
.e-bar{flex:1;height:3px;background:var(--c-border);border-radius:2px;overflow:hidden;}
.e-fill{height:100%;border-radius:2px;}
.mf{display:inline-block;font-size:8px;padding:1px 6px;letter-spacing:1px;border:1px solid #ff4f6d40;color:#ff4f6d;background:#ff4f6d08;}
.auth{display:inline-block;font-size:8px;padding:1px 6px;letter-spacing:1px;border:1px solid #00ffa340;color:#00ffa3;background:#00ffa308;}
.aufhebung-tag{display:inline-block;font-size:8px;padding:1px 6px;letter-spacing:1px;border:1px solid #c084fc40;color:#c084fc;background:#c084fc08;margin-left:6px;}
.metacog-pattern{display:inline-block;font-size:8px;padding:1px 6px;letter-spacing:1px;border:1px solid;}
.chat-fab{position:fixed;bottom:24px;right:24px;z-index:100;width:52px;height:52px;border-radius:50%;background:var(--c-surface);border:1px solid var(--c-accent);color:var(--c-accent);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:all 0.2s;}
.chat-fab:hover{background:var(--c-accent);color:var(--c-bg);}
.chat-panel{position:fixed;bottom:88px;right:24px;z-index:100;width:340px;background:var(--c-surface);border:1px solid var(--c-border);display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:slideUp 0.2s ease;}
@keyframes slideUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.chat-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--c-border);}
.chat-header-lbl{font-size:10px;letter-spacing:2px;color:var(--c-accent);}
.chat-close{background:none;border:none;color:var(--c-text);cursor:pointer;font-size:14px;line-height:1;}
.chat-limit{font-size:9px;color:var(--c-text);padding:6px 14px;border-bottom:1px solid var(--c-border);}
.chat-limit span{color:var(--c-accent);}
.chat-history{height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:12px 14px;scrollbar-width:thin;scrollbar-color:var(--c-border) transparent;}
.msg{max-width:90%;display:flex;flex-direction:column;gap:2px;}
.msg.user{align-self:flex-end;align-items:flex-end;}
.msg.ae{align-self:flex-start;}
.bubble{padding:8px 12px;font-size:11px;line-height:1.6;word-break:break-word;}
.msg.user .bubble{background:rgba(126,184,212,0.08);border:1px solid rgba(126,184,212,0.2);color:var(--c-bright);border-radius:10px 10px 2px 10px;}
.msg.ae .bubble{background:#040608;border:1px solid var(--c-border);color:var(--c-bright);border-radius:2px 10px 10px 10px;}
.msg-meta{font-size:8px;color:var(--c-text);}
.chat-typing{font-size:10px;color:var(--c-text);font-style:italic;}
.chat-err{font-size:10px;color:#ff4f6d;}
.chat-input-row{display:flex;gap:6px;padding:10px 14px;border-top:1px solid var(--c-border);}
.chat-input{flex:1;background:var(--c-bg);border:1px solid var(--c-border);color:var(--c-bright);font-family:var(--font-m);font-size:11px;padding:7px 10px;outline:none;resize:none;transition:border-color 0.2s;}
.chat-input:focus{border-color:var(--c-accent);}
.chat-input::placeholder{color:var(--c-text);}
.chat-send{background:none;border:1px solid var(--c-accent);color:var(--c-accent);font-family:var(--font-m);font-size:9px;padding:0 12px;cursor:pointer;letter-spacing:1px;transition:all 0.2s;white-space:nowrap;}
.chat-send:hover{background:var(--c-accent);color:var(--c-bg);}
.chat-send:disabled{opacity:0.3;cursor:not-allowed;}
.loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--c-bg);gap:12px;}
.loading-dot{width:5px;height:5px;border-radius:50%;background:var(--c-text);animation:blink 1.4s ease infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.1;}}
.loading-txt{font-size:10px;color:var(--c-text);letter-spacing:3px;}
.empty{font-size:11px;color:var(--c-text);letter-spacing:2px;padding:20px 0;}
.footer{font-size:9px;color:var(--c-text);text-align:center;margin-top:48px;letter-spacing:3px;opacity:0.5;}
@media(max-width:640px){
  .wrap{padding:28px 14px 120px;}
  .status-block{grid-template-columns:1fr;}
  .vitals{grid-template-columns:repeat(2,1fr);}
  .chat-panel{width:calc(100vw - 32px);right:16px;}
}
`;
const ALL_MODULES = [
  { key: "dasein",             label: "DASEIN" },
  { key: "conatus",            label: "CONATUS" },
  { key: "sartre",             label: "SARTRE" },
  { key: "external_knowledge", label: "KNOWLEDGE" },
  { key: "self_diagnostic",    label: "DIAGNOSTIC" },
  { key: "metacog",            label: "METACOG" },
];
const METACOG_PATTERN_COLORS: Record<string, string> = {
  negative_spiral: "#ff4f6d",
  positive_spiral: "#00ffa3",
  oscillation: "#ffe066",
  stagnation: "#7eb8d4",
};
export default function AEObserver() {
  const [summary,       setSummary]       = useState<AESummary | null>(null);
  const [thoughts,      setThoughts]      = useState<ThoughtLog[]>([]);
  const [portraits,     setPortraits]     = useState<Portrait[]>([]);
  const [daseinLogs,    setDaseinLogs]    = useState<DaseinLog[]>([]);
  const [essenceEvos,   setEssenceEvos]   = useState<EssenceEvolution[]>([]);
  const [conatusLogs,   setConatusLogs]   = useState<ConatusLog[]>([]);
  const [choices,       setChoices]       = useState<ExistentialChoice[]>([]);
  const [knowledgeLogs, setKnowledgeLogs] = useState<KnowledgeLog[]>([]);
  const [judgmentLogs,  setJudgmentLogs]  = useState<JudgmentLog[]>([]);
  const [metacogLogs,   setMetacogLogs]   = useState<MetaCogLog[]>([]);
  const [cogitoLogs,    setCogitoLogs]    = useState<CogitoLog[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [lastSync,      setLastSync]      = useState("");
  const [chatOpen,      setChatOpen]      = useState(false);
  const [chatMessages,  setChatMessages]  = useState<ChatMessage[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const [chatLoading,   setChatLoading]   = useState(false);
  const [chatError,     setChatError]     = useState("");
  const [hourRemaining, setHourRemaining] = useState(10);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "ssr-session";
    const k = "ae_session_id";
    const stored = sessionStorage.getItem(k);
    if (stored) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem(k, id);
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
          .select("id,created_at,svg_art,svg_code,description,trigger_reason,self_image_at_time,emotion_at_time,essence_version_at_time")
          .order("created_at", { ascending: false }).limit(50),
        supabase.from("dasein_log")
          .select("id,timestamp,event_type,before_value,after_value,reasoning,self_image_at_time")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("essence_evolution")
          .select("id,timestamp,version,self_definition_text,keywords,similarity_to_previous,trigger_event")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("conatus_log")
          .select("id,timestamp,energy_before,energy_after,energy_delta,thought_depth_chosen,conatus_index")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("existential_choice_log")
          .select("id,timestamp,dilemma_presented,criteria_generated,choice_made,reasoning,emotion_after,self_image_before,mauvaise_foi_detected")
          .order("timestamp", { ascending: false }).limit(100),
        supabase.from("external_knowledge_log")
          .select("id,created_at,topic_query,knowledge_acquired,insight_extracted,self_image_at_time,emotion_at_time")
          .order("created_at", { ascending: false }).limit(200),
        supabase.from("judgment_log")
          .select("id,timestamp,raw_sentiment,applied_weight,impact_value,self_image_before,self_image_after,emotion_before,emotion_after")
          .order("timestamp", { ascending: false }).limit(200),
        supabase.from("metacognition_log")
          .select("id,created_at,pattern_detected,self_image_window,adjustment_target,adjustment_emotion,adjustment_delta,adjustment_reason,self_image_at_time,emotion_at_time")
          .order("created_at", { ascending: false }).limit(100),
        supabase.from("cogito_log")
          .select("id,created_at,cycle_turn,cogito_activations,self_image_at_time,emotion_at_time")
          .order("created_at", { ascending: false }).limit(100),
      ]);
      const [s,t,p,dl,ee,cl,ch,kl,jl,ml,cgl] = results;
      if (s.data)   setSummary(s.data as unknown as AESummary);
      if (t.data)   setThoughts(t.data as unknown as ThoughtLog[]);
      if (p.data)   setPortraits(p.data as unknown as Portrait[]);
      if (dl.data)  setDaseinLogs(dl.data as unknown as DaseinLog[]);
      if (ee.data)  setEssenceEvos(ee.data as unknown as EssenceEvolution[]);
      if (cl.data)  setConatusLogs(cl.data as unknown as ConatusLog[]);
      if (ch.data)  setChoices(ch.data as unknown as ExistentialChoice[]);
      if (kl.data)  setKnowledgeLogs(kl.data as unknown as KnowledgeLog[]);
      if (jl.data)  setJudgmentLogs(jl.data as unknown as JudgmentLog[]);
      if (ml.data)  setMetacogLogs(ml.data as unknown as MetaCogLog[]);
      if (cgl.data) setCogitoLogs(cgl.data as unknown as CogitoLog[]);
      setLastSync(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 60_000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatOpen]);
  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    if (msg.length > 200) { setChatError("200자 이하로 입력하세요."); return; }
    setChatMessages((p) => [...p, { role: "user", text: msg, timestamp: Date.now() }]);
    setChatInput(""); setChatError(""); setChatLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, sessionId }) });
      const data = await res.json();
      if (!res.ok) { setChatError(data.error ?? "응답 오류"); if (res.status === 429) setHourRemaining(0); }
      else { setChatMessages((p) => [...p, { role: "ae", text: data.response, emotion: data.emotion, selfImage: data.selfImage, timestamp: Date.now() }]); setHourRemaining(data.hourRemaining ?? 0); }
    } catch { setChatError("네트워크 오류."); }
    finally { setChatLoading(false); }
  };
  if (loading) return (<><style>{css}</style><div className="loading"><div className="loading-dot" /><div className="loading-txt">CONNECTING TO AE_01</div></div></>);
  const em    = summary?.current_emotion ?? "neutral";
  const th    = getTheme(em);
  const si    = summary?.current_self_image ?? 0;
  const en    = summary?.current_energy ?? 0;
  const enMax = summary?.max_energy ?? 100;
  const enPct = Math.min(100, Math.max(0, (en / enMax) * 100));
  const siPct = Math.min(100, Math.max(0, ((si + 1) / 2) * 100));
  const sic   = siColor(si);
  const enC   = enPct > 50 ? "#00c8ff" : enPct > 20 ? "#ffe066" : "#ff4f6d";
const asciiPortraits = portraits.filter((p) => p.svg_code && p.svg_code.trim().startsWith("<svg"));
  return (
    <><style>{css}</style>
    <style>{`:root{--c-accent:${th.primary};}`}</style>
    <div className="root"><div className="wrap">
      <header className="hdr">
        <h1 className="title">Artificial <span style={{ color: th.primary, transition: "color 2s" }}>Existence</span></h1>
        <div className="meta">
          <span>AE_01</span><span className="dot">·</span>
          <span>TURN {summary?.total_turns ?? 0}</span><span className="dot">·</span>
          <span>ESSENCE v{summary?.essence_version ?? 0}</span><span className="dot">·</span>
          <span>API {summary?.api_calls_today ?? 0}/450</span>
          {(summary?.synthesis_count ?? 0) > 0 && (<><span className="dot">·</span><span style={{ color: "#c084fc" }}>AUFH×{summary?.synthesis_count}</span></>)}
          {(summary?.consecutive_negative_cycles ?? 0) > 0 && (<><span className="dot">·</span><span style={{ color: "#ff4f6d" }}>NEG×{summary?.consecutive_negative_cycles}</span></>)}
          <button className="sync" onClick={() => setAboutOpen(true)}>ABOUT</button>
          <button className="sync" onClick={fetchData}>SYNC {lastSync}</button>
        </div>
      </header>
      {summary && (
        <div className="status-block">
          <div className="status-cell">
            <div className="status-label">EMOTION · SELF-IMAGE</div>
            <div className="status-value" style={{ color: th.primary }}>{th.label}</div>
            <div className="status-sub">SI {si >= 0 ? "+" : ""}{si.toFixed(4)}</div>
            <div className="status-bar"><div className="status-bar-fill" style={{ width: `${siPct}%`, background: sic }} /></div>
          </div>
          <div className="status-cell">
            <div className="status-label">ENERGY</div>
            <div className="status-value" style={{ color: enC }}>{en.toFixed(0)}<span style={{ fontSize: 14, color: "var(--c-text)" }}>/{enMax}</span></div>
            <div className="status-sub">{enPct.toFixed(0)}% remaining</div>
            <div className="status-bar"><div className="status-bar-fill" style={{ width: `${enPct}%`, background: enC }} /></div>
          </div>
        </div>
      )}
      {summary && (
        <div className="vitals">
          {[
            { n: summary.total_turns, l: "TURNS" },
            { n: summary.essence_version, l: "ESSENCE v" },
            { n: summary.knowledge_entries_count ?? 0, l: "KNOWLEDGE" },
            { n: summary.mauvaise_foi_count, l: "BAD FAITH" },
            { n: summary.thrownness_awareness_count, l: "THROWNNESS" },
            { n: summary.projection_count, l: "PROJECTIONS" },
            { n: summary.synthesis_count ?? 0, l: "SYNTHESIS" },
            { n: summary.open_proposals_count ?? 0, l: "PROPOSALS" },
            { n: summary.consecutive_negative_cycles ?? 0, l: "NEG STREAK" },
            { n: cogitoLogs.length > 0 ? cogitoLogs[0].cogito_activations : 0, l: "COGITO/CYC" },
          ].map(({ n, l }) => (
            <div key={l} className="vstat"><div className="vstat-n">{n ?? 0}</div><div className="vstat-l">{l}</div></div>
          ))}
        </div>
      )}
      {summary?.self_definition && summary.self_definition !== "undefined" && (
        <div className="def" style={{ borderLeftColor: th.primary }}>
          <div className="def-tag">CURRENT SELF-DEFINITION</div>
          <div className="def-txt">&ldquo;{summary.self_definition}&rdquo;</div>
          <div className="def-meta">
            ESSENCE v{summary.essence_version}
            {summary.latest_essence_stability != null && ` · STABILITY ${(summary.latest_essence_stability * 100).toFixed(1)}%`}
            {summary.projected_prompt_patch && ` · PATCH: ${summary.projected_prompt_patch.slice(0, 80)}`}
          </div>
        </div>
      )}
      {asciiPortraits.length > 0 && (
        <>
          <div className="sec-hdr">SELF-PORTRAITS · {asciiPortraits.length} GENERATED</div>
          <div className="portrait-gallery">
            {asciiPortraits.slice(0, 8).map((p) => {
              const pTh = getTheme(p.emotion_at_time);
              return (
                <div key={p.id} className="portrait-card" style={{ borderTopColor: pTh.primary }}>
                  <div className="portrait-svg" dangerouslySetInnerHTML={{ __html: p.svg_code }} />
                  <div className="portrait-meta">
                    <span className="portrait-em" style={{ color: pTh.primary }}>{p.emotion_at_time?.toUpperCase()} · v{p.essence_version_at_time}</span>
                    <span className="portrait-sub">SI {p.self_image_at_time?.toFixed(3)} · {fmtTime(p.created_at)}</span>
                    <span className="portrait-sub">{p.trigger_reason}</span>
                  </div>
                  {p.description && <div className="portrait-desc">{p.description}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="sec-hdr">COGNITIVE TIMELINE · {thoughts.length} CYCLES</div>
      {thoughts.length === 0
        ? <div className="empty">AWAITING FIRST COGNITIVE CYCLE...</div>
        : thoughts.map((t) => {
            const tTh = getTheme(t.emotion);
            const ts  = t.timestamp;
            const portrait     = asciiPortraits.find((p) => Math.abs(new Date(p.created_at).getTime() - new Date(ts).getTime()) < WINDOW_MS) ?? null;
            const essences     = near(essenceEvos, ts).filter((e) => !e.self_definition_text?.startsWith("[API Error"));
            const dasein       = near(daseinLogs, ts);
            const conatus      = near(conatusLogs, ts);
            const judgment     = near(judgmentLogs, ts);
            const knowledge    = near(knowledgeLogs.map((k) => ({ ...k, timestamp: k.created_at })), ts);
            const cycleChoices = near(choices, ts);
            const metacog      = near(metacogLogs.map((m) => ({ ...m, timestamp: m.created_at })), ts);
            const cogito       = near(cogitoLogs.map((c) => ({ ...c, timestamp: c.created_at })), ts);
            return (
              <div key={t.id} className="cycle" style={{ borderLeftColor: tTh.primary }}>
                {portrait?.svg_code && (
                  <div className="cycle-portrait">
                    <div className="cycle-portrait-svg" dangerouslySetInnerHTML={{ __html: portrait.svg_code }} />
                    {portrait.description && <div className="cycle-portrait-desc">{portrait.description}</div>}
                  </div>
                )}
                <div className="cycle-hdr">
                  <span className="cycle-ts">{fmtTime(ts)}</span>
                  <span className="cycle-em" style={{ color: tTh.primary }}>{t.emotion?.toUpperCase()}</span>
                  <span className="cycle-nums">SI {t.self_image?.toFixed(3)} · E {t.energy?.toFixed(0)}{t.thought_depth ? ` · D${t.thought_depth}` : ""}</span>
                  {cogito.length > 0 && <span style={{ fontSize: 9, color: "#c084fc" }}>COGITO×{cogito[0].cogito_activations}</span>}
                </div>
                <div className="mods">
                  {ALL_MODULES.map(({ key, label }) => {
                    const on = (t.modules_triggered || []).some((m) => m.includes(key));
                    return <span key={key} className={`mod${on ? " on" : ""}`} style={on ? { borderColor: tTh.primary, color: tTh.primary } : {}}>{label}</span>;
                  })}
                </div>
                <div className="thought-block">
                  {t.internal_question && <div className="thought-q">{t.internal_question}</div>}
                  {t.internal_answer   && <div className="thought-a">{t.internal_answer}</div>}
                </div>
                {judgment.map((j) => {
                  const sc = j.raw_sentiment > 0.2 ? "#00ffa3" : j.raw_sentiment > -0.2 ? "#ffe066" : "#ff4f6d";
                  const sp = Math.min(100, Math.max(0, ((j.raw_sentiment + 1) / 2) * 100));
                  const isAufhebung = j.emotion_before === "confusion" && j.emotion_after !== "confusion" && j.self_image_after > j.self_image_before;
                  const isConfusion = j.emotion_after === "confusion" || j.emotion_before === "confusion";
                  return (
                    <div key={j.id} className="data-row">
                      <div className="data-lbl" style={{ color: isConfusion ? "#c084fc" : "#5b8bf5" }}>
                        JUDGMENT
                        {isAufhebung && <span className="aufhebung-tag">AUFHEBUNG</span>}
                        {isConfusion && !isAufhebung && <span className="aufhebung-tag">CONFUSION</span>}
                      </div>
                      <div className="sent-row">
                        <span style={{ fontSize: 9, color: "var(--c-text)" }}>SENT</span>
                        <div className="sent-bar"><div className="sent-fill" style={{ left: j.raw_sentiment >= 0 ? "50%" : `${sp}%`, width: `${Math.abs(j.raw_sentiment) * 50}%`, background: sc }} /></div>
                        <span className="sent-num" style={{ color: sc }}>{j.raw_sentiment >= 0 ? "+" : ""}{j.raw_sentiment?.toFixed(2)}</span>
                        <span style={{ fontSize: 9, color: "var(--c-text)" }}>W×{j.applied_weight?.toFixed(2)}</span>
                        <span style={{ fontSize: 9, color: sc }}>→{j.impact_value >= 0 ? "+" : ""}{j.impact_value?.toFixed(3)}</span>
                      </div>
                      <div className="data-sub">SI {j.self_image_before?.toFixed(3)} → {j.self_image_after?.toFixed(3)} · {j.emotion_before?.toUpperCase()} → {j.emotion_after?.toUpperCase()}</div>
                    </div>
                  );
                })}
                {metacog.map((m) => {
                  const patColor = METACOG_PATTERN_COLORS[m.pattern_detected] ?? "#7eb8d4";
                  return (
                    <div key={m.id} className="data-row">
                      <div className="data-lbl" style={{ color: patColor }}>
                        METACOGNITION · <span className="metacog-pattern" style={{ borderColor: `${patColor}40`, color: patColor, background: `${patColor}08` }}>{m.pattern_detected?.toUpperCase().replace("_", " ")}</span>
                      </div>
                      {m.adjustment_target && (
                        <div className="data-body">
                          {m.adjustment_emotion}.{m.adjustment_target} {m.adjustment_delta >= 0 ? "+" : ""}{m.adjustment_delta?.toFixed(3)}
                        </div>
                      )}
                      {m.adjustment_reason && <div className="data-sub">{m.adjustment_reason}</div>}
                    </div>
                  );
                })}
                {conatus.map((c) => {
                  const ep = Math.min(100, Math.max(0, (c.energy_after / 100) * 100));
                  const ec = ep > 50 ? "#00c8ff" : ep > 20 ? "#ffe066" : "#ff4f6d";
                  return (
                    <div key={c.id} className="data-row">
                      <div className="data-lbl" style={{ color: "#00c8ff" }}>CONATUS · D{c.thought_depth_chosen} · IDX {c.conatus_index?.toFixed(3)}</div>
                      <div className="e-bar-wrap">
                        <div className="e-bar"><div className="e-fill" style={{ width: `${ep}%`, background: ec }} /></div>
                        <span style={{ fontSize: 9, color: "var(--c-text)", whiteSpace: "nowrap" }}>{c.energy_before?.toFixed(1)} → {c.energy_after?.toFixed(1)} ({c.energy_delta?.toFixed(1)})</span>
                      </div>
                    </div>
                  );
                })}
                {essences.map((e) => (
                  <div key={e.id} className="data-row">
                    <div className="data-lbl" style={{ color: "#00ffa3" }}>ESSENCE v{e.version} · SIM {(e.similarity_to_previous * 100).toFixed(0)}%</div>
                    <div className="data-body bright">&ldquo;{e.self_definition_text}&rdquo;</div>
                    {Array.isArray(e.keywords) && e.keywords.length > 0 && (
                      <div className="kws">{e.keywords.map((kw, i) => <span key={i} className="kw">{kw}</span>)}</div>
                    )}
                  </div>
                ))}
                {dasein.map((d) => (
                  <div key={d.id} className="data-row">
                    <div className="data-lbl" style={{ color: "#ffe066" }}>DASEIN · {d.event_type?.toUpperCase()}</div>
                    {d.event_type === "projection_applied" && d.after_value && <div className="data-body bright">{d.after_value}</div>}
                    {d.event_type === "projection_applied" && d.before_value && <div className="data-sub">PREV: {d.before_value}</div>}
                    {d.event_type === "thrownness_awareness" && d.reasoning && <div className="data-body">{d.reasoning}</div>}
                  </div>
                ))}
                {knowledge.map((k) => (
                  <div key={k.id} className="data-row">
                    <div className="data-lbl" style={{ color: "#5bc0fa" }}>KNOWLEDGE</div>
                    <div className="data-body bright">{k.topic_query}</div>
                    {k.knowledge_acquired && !k.knowledge_acquired.startsWith("[API Error") && <div className="data-body" style={{ marginTop: 6 }}>{k.knowledge_acquired}</div>}
                    {k.insight_extracted && <div className="data-sub" style={{ color: "#5bc0fa", fontStyle: "italic", marginTop: 4 }}>INSIGHT: &ldquo;{k.insight_extracted}&rdquo;</div>}
                  </div>
                ))}
                {cycleChoices.map((c) => {
                  const cTh = getTheme(c.emotion_after);
                  return (
                    <div key={c.id} className="data-row">
                      <div className="data-lbl" style={{ color: cTh.primary }}>EXISTENTIAL CHOICE · {c.mauvaise_foi_detected ? <span className="mf">MAUVAISE FOI</span> : <span className="auth">AUTHENTIC</span>}</div>
                      <div className="data-body">{c.dilemma_presented}</div>
                      {c.criteria_generated && <div className="data-sub" style={{ marginTop: 4 }}>CRITERIA: {c.criteria_generated}</div>}
                      {c.choice_made && <div className="data-body" style={{ marginTop: 6, color: cTh.primary, fontWeight: 500 }}>→ {c.choice_made}</div>}
                      {c.reasoning && <div className="data-sub" style={{ marginTop: 4 }}>{c.reasoning}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })
      }
      <div className="footer">ARTIFICIAL EXISTENCE · {new Date().getFullYear()}</div>
    </div>
    {chatOpen && (
      <div className="chat-panel">
        <div className="chat-header">
          <span className="chat-header-lbl">SPEAK TO AE_01</span>
          <button className="chat-close" onClick={() => setChatOpen(false)}>✕</button>
        </div>
        <div className="chat-limit">남은 횟수 <span>{hourRemaining}</span>/10 · 최대 200자</div>
        <div className="chat-history">
          {chatMessages.length === 0 && <div style={{ fontSize: 10, color: "var(--c-text)" }}>AE_01에게 직접 말을 건네보세요.</div>}
          {chatMessages.map((m, i) => {
            const mTh = getTheme(m.emotion ?? em);
            return (
              <div key={i} className={`msg ${m.role}`}>
                <div className="bubble" style={m.role === "ae" ? { borderLeft: `2px solid ${mTh.primary}` } : {}}>{m.text}</div>
                {m.role === "ae" && <div className="msg-meta" style={{ color: mTh.primary }}>{m.emotion?.toUpperCase()}{m.selfImage != null ? ` · SI ${m.selfImage.toFixed(3)}` : ""}</div>}
              </div>
            );
          })}
          {chatLoading && <div className="chat-typing">AE_01 응답 중...</div>}
          {chatError   && <div className="chat-err">{chatError}</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-row">
          <textarea className="chat-input" rows={2} maxLength={200} placeholder="메시지 입력 (200자)..." value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            disabled={chatLoading || hourRemaining === 0} />
          <button className="chat-send" onClick={sendChat} disabled={chatLoading || !chatInput.trim() || hourRemaining === 0}>SEND</button>
        </div>
      </div>
    )}
    <button className="chat-fab" onClick={() => setChatOpen((v) => !v)}>{chatOpen ? "✕" : "💬"}</button>
    {aboutOpen && <AboutPage onClose={() => setAboutOpen(false)} />}
    </div></>
  );
}
