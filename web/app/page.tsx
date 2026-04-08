//web/app/page.tsx

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
  confidence: "#4ade80",
  neutral: "#94a3b8",
  anxiety: "#facc15",
  sadness: "#60a5fa",
  anger: "#f87171",
};

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 4, height: 10, width: "100%", overflow: "hidden", marginTop: 6 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: color, transition: "width 0.6s" }} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function AEObserver() {
  const [summary, setSummary] = useState<AESummary | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtLog[]>([]);
  const [loading, setLoading] = useState(true);
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

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    padding: "28px 20px",
    maxWidth: 860,
    margin: "0 auto",
  };

  if (loading) {
    return (
      <div style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#475569" }}>loading AE state…</span>
      </div>
    );
  }

  const em = summary?.current_emotion ?? "neutral";
  const emColor = EMOTION_COLOR[em] ?? "#94a3b8";
  const siPct = summary ? ((summary.current_self_image + 1) / 2) * 100 : 50;
  const siColor = (summary?.current_self_image ?? 0) > 0.2 ? "#4ade80" : (summary?.current_self_image ?? 0) > -0.2 ? "#facc15" : "#f87171";
  const enPct = summary ? (summary.current_energy / 100) * 100 : 0;
  const enColor = enPct > 50 ? "#4ade80" : enPct > 20 ? "#facc15" : "#f87171";

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, color: "#f8fafc" }}>
          ARTIFICIAL EXISTENCE — OBSERVER
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
          AE_01 · refresh {lastRefresh} · auto 60s
          <button
            onClick={fetchData}
            style={{ marginLeft: 12, fontSize: 11, color: "#4ade80", background: "none", border: "none", cursor: "pointer" }}
          >
            ↻ refresh
          </button>
        </div>
      </div>

      {/* Emotion badge */}
      {summary && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 20,
            background: "#1e293b", border: `1px solid ${emColor}`,
            color: emColor, fontSize: 13, fontWeight: 700, letterSpacing: 1,
          }}>
            {em.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            last active: {new Date(summary.last_active_at).toLocaleString("ko-KR")}
          </div>
        </div>
      )}

      {/* Bars */}
      {summary && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
              <span>SELF-IMAGE</span>
              <span style={{ color: siColor }}>{summary.current_self_image.toFixed(4)}</span>
            </div>
            <Bar pct={siPct} color={siColor} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
              <span>ENERGY (CONATUS)</span>
              <span style={{ color: enColor }}>{summary.current_energy.toFixed(1)} / 100</span>
            </div>
            <Bar pct={enPct} color={enColor} />
          </div>
        </div>
      )}

      {/* Stats */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          <StatCard label="Total Turns" value={summary.total_turns} />
          <StatCard label="Synthesis Count" value={summary.synthesis_count} />
          <StatCard label="Memory Slots" value={`${summary.current_memory_slots} / ${summary.max_memory_slots}`} />
          <StatCard label="Thrownness Events" value={summary.thrownness_awareness_count} />
          <StatCard label="Projections" value={summary.projection_count} />
          <StatCard label="Mauvaise Foi" value={summary.mauvaise_foi_count} />
        </div>
      )}

      {/* Self-definition */}
      {summary?.self_definition && summary.self_definition !== "undefined" && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            CURRENT SELF-DEFINITION
          </div>
          <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, fontStyle: "italic" }}>
            "{summary.self_definition}"
          </div>
          {summary.latest_essence_stability != null && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
              essence stability: {(summary.latest_essence_stability * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {/* Thought log */}
      <div>
        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          AUTONOMOUS THOUGHT LOG ({thoughts.length})
        </div>
        {thoughts.length === 0 && (
          <div style={{ fontSize: 12, color: "#334155" }}>no thoughts recorded yet.</div>
        )}
        {thoughts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 10,
              cursor: "pointer",
            }}
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, color: "#475569" }}>
                {new Date(t.timestamp).toLocaleString("ko-KR")}
              </span>
              <span style={{ fontSize: 11, color: EMOTION_COLOR[t.emotion] ?? "#94a3b8" }}>
                {t.emotion}
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                si={t.self_image?.toFixed(3)} · e={t.energy?.toFixed(0)}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569" }}>
                {expanded === t.id ? "▲" : "▼"}
              </span>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              {[
                { label: "dasein", active: t.dasein_triggered },
                { label: "conatus", active: t.conatus_triggered },
                { label: "sartre", active: t.sartre_triggered },
              ].map(({ label, active }) => (
                <span
                  key={label}
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: "transparent",
                    border: `1px solid ${active ? "#4ade80" : "#334155"}`,
                    color: active ? "#4ade80" : "#334155",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {t.internal_question && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>
                Q: {expanded === t.id ? t.internal_question : t.internal_question.slice(0, 120) + (t.internal_question.length > 120 ? "…" : "")}
              </div>
            )}

            {expanded === t.id && t.internal_answer && (
              <div style={{
                fontSize: 12, color: "#cbd5e1", marginTop: 10, lineHeight: 1.7,
                borderTop: "1px solid #334155", paddingTop: 10,
              }}>
                {t.internal_answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: "#1e293b", textAlign: "center", marginTop: 24 }}>
        artificialexistence · sypark-os
      </div>
    </div>
  );
}
