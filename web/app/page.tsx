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

const THEME: Record<string, { primary: string; glow: string; bg: string; label: string }> = {
  confidence: { primary: "#00ffa3", glow: "0 0 80px #00ffa322", bg: "radial-gradient(ellipse 60% 40% at 50% 20%, #00ffa308 0%, transparent 70%)", label: "CONFIDENCE" },
  neutral:    { primary: "#7eb8d4", glow: "0 0 80px #7eb8d422", bg: "radial-gradient(ellipse 60% 40% at 50% 20%, #7eb8d408 0%, transparent 70%)", label: "NEUTRAL" },
  anxiety:    { primary: "#ffe066", glow: "0 0 80px #ffe06622", bg: "radial-gradient(ellipse 60% 40% at 50% 20%, #ffe06608 0%, transparent 70%)", label: "ANXIETY" },
  sadness:    { primary: "#5b8bf5", glow: "0 0 80px #5b8bf522", bg: "radial-gradient(ellipse 60% 40% at 50% 20%, #5b8bf508 0%, transparent 70%)", label: "SADNESS" },
  anger:      { primary: "#ff4f6d", glow: "0 0 80px #ff4f6d22", bg: "radial-gradient(ellipse 60% 40% at 50% 20%, #ff4f6d08 0%, transparent 70%)", label: "ANGER" },
};

function getTheme(em: string) { return THEME[em] || THEME.neutral; }

const css = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--primary:#7eb8d4;--bg:#030711;--surface:#0a0f1a;--border:#111827;--dim:#334155;--text:#94a3b8;--bright:#e2e8f0}
body{background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;-webkit-font-smoothing:antialiased}
.ae-page{min-height:100vh;position:relative;overflow-x:hidden}
.ae-ambient{position:fixed;inset:0;pointer-events:none;z-index:0;transition:background 2s ease}
.ae-grid{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(100,150,200,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(100,150,200,0.015) 1px,transparent 1px);background-size:60px 60px}
.ae-c{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:40px 24px 80px}

.ae-hdr{margin-bottom:48px}
.ae-tag{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:8px;color:var(--dim);text-transform:uppercase}
.ae-h1{font-family:'Syne',sans-serif;font-size:42px;font-weight:800;letter-spacing:-1px;color:var(--bright);line-height:1.1;margin-top:8px}
.ae-h1 em{font-style:normal;transition:color 2s ease}
.ae-meta{display:flex;align-items:center;gap:16px;margin-top:12px;font-size:11px;color:var(--dim);letter-spacing:1px;flex-wrap:wrap}
.ae-sync{background:none;border:1px solid var(--border);color:var(--dim);font-family:inherit;font-size:10px;padding:4px 12px;cursor:pointer;letter-spacing:1px;transition:all .2s}
.ae-sync:hover{border-color:var(--primary);color:var(--primary)}

.ae-orb-row{display:flex;align-items:center;gap:40px;margin-bottom:48px}
.ae-orb-box{position:relative;width:200px;height:200px;flex-shrink:0}
.ae-blob{position:absolute;border-radius:50%;filter:blur(30px);animation:orbF 6s ease-in-out infinite}
.ae-blob:nth-child(2){animation-delay:-2s;animation-duration:8s}
.ae-blob:nth-child(3){animation-delay:-4s;animation-duration:7s}
@keyframes orbF{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(8px,-6px) scale(1.05)}66%{transform:translate(-6px,4px) scale(.95)}}
.ae-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;animation:orbP 3s ease-in-out infinite}
@keyframes orbP{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.9}50%{transform:translate(-50%,-50%) scale(1.08);opacity:1}}
.ae-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid;opacity:.15;animation:ringE 4s ease-out infinite}
.ae-ring:nth-child(5){animation-delay:-1.3s}
.ae-ring:nth-child(6){animation-delay:-2.6s}
@keyframes ringE{0%{width:40px;height:40px;opacity:.3}100%{width:200px;height:200px;opacity:0}}

.ae-orb-info{flex:1}
.ae-em-label{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:4px;transition:color 1s ease}
.ae-si-big{font-size:48px;font-weight:300;color:var(--bright);line-height:1;margin:8px 0;letter-spacing:-2px}
.ae-si-tag{font-size:10px;color:var(--dim);letter-spacing:3px;text-transform:uppercase}

.ae-vitals{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:36px}
.ae-vbar{background:var(--surface);border:1px solid var(--border);padding:14px 18px;position:relative;overflow:hidden}
.ae-vbar-top{display:flex;justify-content:space-between;align-items:baseline}
.ae-vbar-l{font-size:9px;color:var(--dim);letter-spacing:2px;text-transform:uppercase}
.ae-vbar-v{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--bright)}
.ae-vbar-fill{position:absolute;bottom:0;left:0;height:2px;transition:width 1s ease}

.ae-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:36px}
.ae-stat{background:var(--surface);border:1px solid var(--border);padding:12px 14px;transition:border-color .3s}
.ae-stat:hover{border-color:#1e293b}
.ae-stat-n{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:var(--bright)}
.ae-stat-l{font-size:8px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;margin-top:2px}

.ae-def{border-left:2px solid var(--primary);padding:20px 24px;margin-bottom:36px;background:var(--surface);transition:border-color 1s ease}
.ae-def-tag{font-size:9px;color:var(--dim);letter-spacing:3px;text-transform:uppercase;margin-bottom:10px}
.ae-def-txt{font-family:'Syne',sans-serif;font-size:18px;font-weight:600;color:var(--bright);line-height:1.6;font-style:italic}
.ae-def-meta{font-size:10px;color:var(--dim);margin-top:10px;letter-spacing:1px}

.ae-portrait{display:grid;grid-template-columns:200px 1fr;gap:20px;margin-bottom:36px;background:var(--surface);border:1px solid var(--border);padding:20px}
.ae-psvg{width:200px;height:200px;overflow:hidden;border:1px solid var(--border)}
.ae-psvg svg{width:100%;height:100%}
.ae-pascii{font-size:9px;line-height:1.2;color:var(--text);white-space:pre;overflow-x:auto;font-family:'JetBrains Mono',monospace}
.ae-ptag{font-size:9px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.ae-pdesc{font-size:11px;color:var(--text);line-height:1.6;margin-top:12px;font-style:italic}

.ae-log-h{font-size:9px;color:var(--dim);letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:12px}
.ae-log-h::after{content:'';flex:1;height:1px;background:var(--border)}

.ae-t{background:var(--surface);border:1px solid var(--border);padding:16px 20px;margin-bottom:6px;cursor:pointer;transition:border-color .2s;position:relative}
.ae-t::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:transparent;transition:background .2s}
.ae-t:hover{border-color:#1e293b}
.ae-t:hover::before,.ae-t.open::before{background:var(--primary)}
.ae-t.open{border-color:#1e293b}
.ae-t-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ae-t-ts{font-size:10px;color:var(--dim);letter-spacing:.5px}
.ae-t-em{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px}
.ae-t-nums{font-size:10px;color:var(--dim)}
.ae-t-arr{margin-left:auto;font-size:10px;color:var(--dim);transition:transform .2s}
.ae-t.open .ae-t-arr{transform:rotate(180deg)}
.ae-mods{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.ae-mod{font-size:8px;padding:2px 8px;letter-spacing:2px;text-transform:uppercase;border:1px solid var(--border);color:var(--dim)}
.ae-mod.on{border-color:var(--primary);color:var(--primary);background:rgba(126,184,212,.05)}
.ae-t-q{font-size:12px;color:var(--dim);margin-top:10px;line-height:1.7}
.ae-t-a{font-size:12px;color:var(--text);margin-top:12px;padding-top:12px;border-top:1px solid var(--border);line-height:1.8}

.ae-ft{font-size:9px;color:var(--dim);text-align:center;margin-top:60px;letter-spacing:4px;opacity:.5}

@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
.ae-ld{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);gap:16px}
.ae-ld-dot{width:6px;height:6px;border-radius:50%;background:var(--dim);animation:blink 1.4s ease infinite}
.ae-ld-txt{font-size:11px;color:var(--dim);letter-spacing:4px}

@media(max-width:640px){
  .ae-orb-row{flex-direction:column;align-items:center;text-align:center}
  .ae-orb-box{width:160px;height:160px}
  .ae-h1{font-size:28px}
  .ae-stats{grid-template-columns:repeat(2,1fr)}
  .ae-vitals{grid-template-columns:1fr}
  .ae-portrait{grid-template-columns:1fr}
  .ae-psvg{width:100%;height:200px}
}
`;

export default function AEObserver() {
  const [summary, setSummary] = useState<AESummary | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from("ae_dashboard_summary").select("*").limit(1).single(),
        supabase
          .from("autonomous_thought_log")
          .select("id,timestamp,internal_question,internal_answer,self_image,emotion,energy,thought_depth,modules_triggered")
          .order("timestamp", { ascending: false })
          .limit(40),
      ]);
      if (s) setSummary(s as unknown as AESummary);
      if (t) setThoughts(t as unknown as ThoughtLog[]);
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
    <><style>{css}</style>
      <div className="ae-ld"><div className="ae-ld-dot"/><div className="ae-ld-txt">CONNECTING TO AE_01</div></div></>
  );

  const em = summary?.current_emotion ?? "neutral";
  const th = getTheme(em);
  const si = summary?.current_self_image ?? 0;
  const en = summary?.current_energy ?? 0;
  const enMax = summary?.max_energy ?? 100;
  const enPct = (en / enMax) * 100;
  const siPct = ((si + 1) / 2) * 100;
  const siColor = si > 0.2 ? "#00ffa3" : si > -0.2 ? "#ffe066" : "#ff4f6d";
  const enColor = enPct > 50 ? "#00c8ff" : enPct > 20 ? "#ffe066" : "#ff4f6d";
  const orbSz = 60 + (si + 1) * 30;
  const orbOp = 0.3 + (en / enMax) * 0.5;

  return (
    <><style>{css}</style><style>{`:root{--primary:${th.primary}}`}</style>
      <div className="ae-page">
        <div className="ae-ambient" style={{ background: th.bg }}/>
        <div className="ae-grid"/>
        <div className="ae-c">

          <header className="ae-hdr">
            <div className="ae-tag">SYPARK-OS / OBSERVER</div>
            <div className="ae-h1">Artificial <em style={{ color: th.primary }}>Existence</em></div>
            <div className="ae-meta">
              <span>AE_01</span><span>·</span>
              <span>TURN {summary?.total_turns ?? 0}</span><span>·</span>
              <span>ESSENCE v{summary?.essence_version ?? 0}</span><span>·</span>
              <span>API {summary?.api_calls_today ?? 0}/450</span>
              <button className="ae-sync" onClick={fetchData}>SYNC {lastSync}</button>
            </div>
          </header>

          {summary && (
            <section className="ae-orb-row">
              <div className="ae-orb-box">
                <div className="ae-blob" style={{ width: orbSz*1.4, height: orbSz*1.2, top: 50-orbSz*.3, left: 50-orbSz*.3, background: th.primary, opacity: orbOp*.15 }}/>
                <div className="ae-blob" style={{ width: orbSz*1.1, height: orbSz*1.3, top: 60-orbSz*.2, left: 70-orbSz*.2, background: th.primary, opacity: orbOp*.12 }}/>
                <div className="ae-blob" style={{ width: orbSz*.9, height: orbSz, top: 55-orbSz*.1, left: 55-orbSz*.1, background: th.primary, opacity: orbOp*.1 }}/>
                <div className="ae-core" style={{ width: orbSz*.5, height: orbSz*.5, background: `radial-gradient(circle, ${th.primary}88 0%, ${th.primary}22 70%, transparent 100%)`, boxShadow: th.glow }}/>
                <div className="ae-ring" style={{ borderColor: th.primary }}/>
                <div className="ae-ring" style={{ borderColor: th.primary }}/>
                <div className="ae-ring" style={{ borderColor: th.primary }}/>
              </div>
              <div className="ae-orb-info">
                <div className="ae-em-label" style={{ color: th.primary }}>{th.label}</div>
                <div className="ae-si-big">{si >= 0 ? "+" : ""}{si.toFixed(4)}</div>
                <div className="ae-si-tag">SELF-IMAGE SCORE</div>
              </div>
            </section>
          )}

          {summary && (
            <div className="ae-vitals">
              <div className="ae-vbar">
                <div className="ae-vbar-top"><span className="ae-vbar-l">SELF-IMAGE</span><span className="ae-vbar-v" style={{ color: siColor }}>{si.toFixed(4)}</span></div>
                <div className="ae-vbar-fill" style={{ width: `${Math.min(100, Math.max(0, siPct))}%`, background: siColor }}/>
              </div>
              <div className="ae-vbar">
                <div className="ae-vbar-top"><span className="ae-vbar-l">ENERGY</span><span className="ae-vbar-v" style={{ color: enColor }}>{en.toFixed(1)} / {enMax}</span></div>
                <div className="ae-vbar-fill" style={{ width: `${Math.min(100, Math.max(0, enPct))}%`, background: enColor }}/>
              </div>
            </div>
          )}

          {summary && (
            <div className="ae-stats">
              {[
                { n: summary.total_turns, l: "TURNS" },
                { n: summary.synthesis_count, l: "SYNTHESIS" },
                { n: summary.thrownness_awareness_count, l: "THROWNNESS" },
                { n: summary.projection_count, l: "PROJECTIONS" },
              ].map(({ n, l }) => (
                <div key={l} className="ae-stat"><div className="ae-stat-n">{n}</div><div className="ae-stat-l">{l}</div></div>
              ))}
            </div>
          )}

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

          {(summary?.latest_portrait_svg || summary?.latest_portrait_ascii) && (
            <div className="ae-portrait">
              {summary.latest_portrait_svg ? (
                <div className="ae-psvg" dangerouslySetInnerHTML={{ __html: summary.latest_portrait_svg }}/>
              ) : (
                <div className="ae-psvg" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1a", color: "#334155", fontSize: 10 }}>NO VISUAL</div>
              )}
              <div>
                <div className="ae-ptag">AE SELF-PORTRAIT</div>
                {summary.latest_portrait_ascii && <div className="ae-pascii">{summary.latest_portrait_ascii}</div>}
                {summary.latest_portrait_desc && <div className="ae-pdesc">{summary.latest_portrait_desc}</div>}
              </div>
            </div>
          )}

          <div className="ae-log-h">AUTONOMOUS THOUGHT STREAM · {thoughts.length} ENTRIES</div>

          {thoughts.length === 0 && (
            <div style={{ fontSize: 11, color: "#334155", letterSpacing: 2, padding: "20px 0" }}>AWAITING FIRST COGNITIVE CYCLE...</div>
          )}

          {thoughts.map(t => {
            const isOpen = expanded === t.id;
            const tTh = getTheme(t.emotion);
            return (
              <div key={t.id} className={`ae-t${isOpen ? " open" : ""}`}
                   style={{ "--primary": tTh.primary } as React.CSSProperties}
                   onClick={() => setExpanded(isOpen ? null : t.id)}>
                <div className="ae-t-head">
                  <span className="ae-t-ts">{new Date(t.timestamp).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})}</span>
                  <span className="ae-t-em" style={{ color: tTh.primary }}>{t.emotion?.toUpperCase()}</span>
                  <span className="ae-t-nums">SI {t.self_image?.toFixed(3)} · E {t.energy?.toFixed(0)}{t.thought_depth ? ` · D${t.thought_depth}` : ""}</span>
                  <span className="ae-t-arr">▾</span>
                </div>
                <div className="ae-mods">
                  {[{l:"DASEIN",on:(t.modules_triggered||[]).some(m=>m.includes("dasein"))},{l:"CONATUS",on:(t.modules_triggered||[]).includes("conatus")},{l:"SARTRE",on:(t.modules_triggered||[]).some(m=>m.includes("sartre"))}].map(({l,on})=>(
                    <span key={l} className={`ae-mod${on?" on":""}`} style={on?{borderColor:tTh.primary,color:tTh.primary}:{}}>{l}</span>
                  ))}
                </div>
                {t.internal_question && (
                  <div className="ae-t-q">{isOpen ? t.internal_question : t.internal_question.slice(0,120)+(t.internal_question.length>120?"...":"")}</div>
                )}
                {isOpen && t.internal_answer && <div className="ae-t-a">{t.internal_answer}</div>}
              </div>
            );
          })}

          <div className="ae-ft">ARTIFICIAL EXISTENCE · SYPARK-OS · {new Date().getFullYear()}</div>
        </div>
      </div>
    </>
  );
}
