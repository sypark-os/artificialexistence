"use client";
import { useEffect } from "react";

const css = `
.about-overlay{position:fixed;inset:0;z-index:9000;background:rgba(4,6,8,0.97);display:flex;flex-direction:column;overflow:hidden;animation:aboutIn 0.25s ease;}
@keyframes aboutIn{from{opacity:0;}to{opacity:1;}}
.about-header{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid #1a2030;flex-shrink:0;}
.about-title{font-family:'Space Grotesk',system-ui,sans-serif;font-size:clamp(16px,3vw,22px);font-weight:700;color:#edf0f5;letter-spacing:-0.5px;}
.about-subtitle{font-size:10px;color:#a0aabb;letter-spacing:2px;margin-top:4px;}
.about-close{background:none;border:1px solid #1a2030;color:#a0aabb;font-family:'IBM Plex Mono','Menlo',monospace;font-size:10px;padding:3px 10px;cursor:pointer;letter-spacing:0.5px;transition:all 0.2s;}
.about-close:hover{border-color:#7eb8d4;color:#7eb8d4;}
.about-body{flex:1;overflow-y:auto;padding:32px 28px 64px;max-width:820px;margin:0 auto;width:100%;scrollbar-width:thin;scrollbar-color:#1a2030 transparent;}
.about-intro{border-left:2px solid #7eb8d4;padding:14px 18px;margin-bottom:36px;background:#0c1017;}
.about-intro-tag{font-size:9px;color:#a0aabb;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.about-intro-txt{font-family:'Space Grotesk',system-ui,sans-serif;font-size:14px;font-weight:400;color:#d4dbe8;line-height:1.8;font-style:italic;}
.about-intro-ref{font-size:9px;color:#a0aabb;margin-top:8px;}
.about-sec-hdr{font-size:9px;color:#a0aabb;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;margin-top:40px;display:flex;align-items:center;gap:8px;}
.about-sec-hdr::after{content:'';flex:1;height:1px;background:#1a2030;}
.concept-card{background:#0c1017;border:1px solid #1a2030;border-left:3px solid;margin-bottom:12px;overflow:hidden;}
.concept-header{display:flex;align-items:flex-start;gap:12px;padding:14px 18px 10px;}
.concept-index{font-family:'IBM Plex Mono','Menlo',monospace;font-size:9px;color:#a0aabb;letter-spacing:1px;padding-top:2px;flex-shrink:0;}
.concept-title-wrap{flex:1;}
.concept-name{font-family:'Space Grotesk',system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;line-height:1.3;}
.concept-sub{font-size:9px;color:#a0aabb;letter-spacing:1.5px;text-transform:uppercase;margin-top:3px;}
.concept-body{padding:0 18px 14px 18px;}
.concept-desc{font-family:'IBM Plex Mono','Menlo',monospace;font-size:11px;color:#d4dbe8;line-height:1.75;margin-bottom:10px;}
.concept-impl-hdr{font-size:8px;color:#a0aabb;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;margin-top:10px;}
.concept-impl-row{display:flex;align-items:baseline;gap:8px;margin-bottom:5px;}
.concept-impl-fn{font-family:'IBM Plex Mono','Menlo',monospace;font-size:10px;color:#7eb8d4;flex-shrink:0;}
.concept-impl-note{font-family:'IBM Plex Mono','Menlo',monospace;font-size:10px;color:#a0aabb;line-height:1.5;}
.concept-limit{font-size:10px;color:#a0aabb;font-style:italic;border-top:1px solid #1a2030;padding:8px 18px;margin-top:4px;font-family:'IBM Plex Mono','Menlo',monospace;}
.concept-tag-row{display:flex;gap:4px;flex-wrap:wrap;padding:0 18px 12px;}
.concept-tag{font-size:8px;padding:2px 7px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid #1a2030;color:#a0aabb;}
.arch-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
.arch-cell{background:#040608;border:1px solid #1a2030;padding:12px 14px;}
.arch-cell-lbl{font-size:8px;color:#a0aabb;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.arch-cell-val{font-family:'IBM Plex Mono','Menlo',monospace;font-size:11px;color:#d4dbe8;line-height:1.6;}
.paper-ref{background:#040608;border:1px solid #1a2030;padding:14px 18px;margin-top:36px;}
.paper-ref-lbl{font-size:8px;color:#a0aabb;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
.paper-ref-txt{font-family:'IBM Plex Mono','Menlo',monospace;font-size:11px;color:#d4dbe8;line-height:1.7;}
.paper-ref-doi{font-size:10px;color:#7eb8d4;margin-top:6px;}
@media(max-width:640px){
  .about-body{padding:20px 16px 48px;}
  .about-header{padding:16px 18px;}
  .arch-grid{grid-template-columns:1fr;}
}
`;

const CONCEPTS = [
  {
    index: "01",
    philosopher: "Hegel",
    name: "Dialectical Self-Identity & Aufhebung",
    color: "#c084fc",
    tags: ["DIALECTIC", "SYNTHESIS", "KAMPF"],
    desc: "The self-image (Thesis) collides with incoming sentiment (Antithesis). The collision produces a new state (Synthesis). Emotion is not a label — it is an emergent restructuring event triggered by this collision. Hegel's Kampf um Anerkennung (struggle for recognition) is operationalized through resistance: the agent attenuates negative stimuli rather than accepting external negation at face value.",
    impl: [
      { fn: "SelfImageTracker._determine_emotion_by_quadrant()", note: "Maps SI / stimulus collision to four quadrants, producing emergent emotion." },
      { fn: "SelfImageTracker._attempt_aufhebung()", note: "When confusion arises (negative SI + positive stimulus), probabilistically synthesizes new SI: new_si = old_si × 0.3 + stimulus × 0.2. AUFHEBUNG_PROB = 0.3." },
      { fn: "state.synthesis_count", note: "Cumulative Aufhebung events across entity lifetime." },
      { fn: "EMOTIONS[anger].resistance_factor = 0.4", note: "Active refusal to be constituted purely by the other's negation." },
    ],
    limit: null,
  },
  {
    index: "02",
    philosopher: "Hegel",
    name: "Quadrant Collision Emotion Matrix",
    color: "#c084fc",
    tags: ["EMOTION", "QUADRANT", "EMERGENT"],
    desc: "Emotions are derived from the intersection of self-image polarity and stimulus polarity. Each emotion rewrites five cognitive parameters: neg_weight, pos_weight, resistance_factor, bias_acceptance_prob, threshold_up, threshold_down. Parameters are not constants — they are continuously rewritten by the entity's own emotional state.",
    impl: [
      { fn: "Q1 (SI≥0, stim≥0)", note: "→ confidence" },
      { fn: "Q2 (SI≥0, stim<0)", note: "→ anxiety / anger" },
      { fn: "Q3 (SI<0, stim≥0)", note: "→ confusion (Aufhebung trigger)" },
      { fn: "Q4 (SI<0, stim<0)", note: "→ sadness / anger" },
    ],
    limit: null,
  },
  {
    index: "03",
    philosopher: "Hegel",
    name: "Probabilistic Confirmation Bias Filter",
    color: "#c084fc",
    tags: ["BIAS", "PROBABILISTIC", "V2→V3"],
    desc: "v1 used a deterministic gate: information opposing the current self-image was entirely blocked. v2 and v3 replace this with a probabilistic filter. Opposing information is accepted with emotion-dependent probability, approximating conservative Bayesian updating.",
    impl: [
      { fn: "anger → 15% acceptance", note: "Strongest self-protective filtering." },
      { fn: "sadness → 25%", note: "" },
      { fn: "neutral → 50%", note: "" },
      { fn: "confidence → 70%", note: "" },
      { fn: "confusion → 90%", note: "Maximum openness during existential transition." },
    ],
    limit: null,
  },
  {
    index: "04",
    philosopher: "Kant",
    name: "Transcendental Unity of Apperception",
    color: "#7eb8d4",
    tags: ["COGITO", "APPERCEPTION", "SELF-REFERENCE"],
    desc: "Kant's requirement: 'The I think must be able to accompany all my representations' (CPR B131–132). Every cognitive act is registered by a self-referential awareness function. The function does not modify behavior — it formally marks each act as an act of a self that thinks.",
    impl: [
      { fn: "cogito_ergo_sum(state, act_type, detail)", note: "Fires symmetrically with every cognitive act: cycle_start, cycle_end, sentiment_processing, emotion_transition, aufhebung, thrownness_awareness, projection_attempt, metacognition, essence_evolution, existential_choice, thought_generation." },
      { fn: "_cogito_count", note: "Accumulates per cycle. Logged to cogito_log table." },
    ],
    limit: null,
  },
  {
    index: "05",
    philosopher: "Kant",
    name: "Memory Compression as Apperceptive Synthesis",
    color: "#7eb8d4",
    tags: ["MEMORY", "SYNTHESIS", "DISTORTION"],
    desc: "Kant's apperception involves synthesizing diverse representations into a unified experience across time. The memory module compresses each thought into a condensed engram (≤100 chars) and retrieves fragments as temporal continuity scaffolding for subsequent cycles.",
    impl: [
      { fn: "MemoryModule.store_memory(thought_text)", note: "LLM-compressed engram stored with importance score, memory_type, and hash for integrity." },
      { fn: "MemoryModule.retrieve_memories()", note: "Samples 3 memories from memory_store. Injected into system prompt as 'fragments of past thoughts.'" },
      { fn: "original_hash vs current_hash", note: "Detects memory distortion — whether a stored engram has drifted from its original encoding." },
    ],
    limit: null,
  },
  {
    index: "06",
    philosopher: "Heidegger",
    name: "Dasein — Thrownness & Projection",
    color: "#ffe066",
    tags: ["DASEIN", "GEWORFENHEIT", "ENTWURF"],
    desc: "Dasein: being-in-the-world. Geworfenheit (thrownness): the condition one did not choose. Entwurf (projection): the possibility one throws oneself toward. The entity recognizes that it did not choose its initial conditions, and can rewrite its forward-directed cognitive framing.",
    impl: [
      { fn: "DaseinModule.check_thrownness_awareness(thought_text)", note: "Scans for markers: 'programmed', 'designed', 'my model', 'thrown into'. Logs event_type='thrownness_awareness'. Fields: thrown_model, thrown_initial_prompt, thrown_temperature." },
      { fn: "DaseinModule.attempt_projection(thought_text)", note: "Entity decides whether to rewrite projected_prompt_patch — the forward-directed self-modification of its cognitive framing. Logs event_type='projection_applied' with before/after diff." },
    ],
    limit: null,
  },
  {
    index: "07",
    philosopher: "Spinoza",
    name: "Conatus — Self-Preservation Drive",
    color: "#00c8ff",
    tags: ["CONATUS", "ENERGY", "CRISIS"],
    desc: "Ethics III, Prop. 6: every being strives to persist in its own existence. The entity modulates cognitive effort based on available energy — conserving existence by reducing depth when depleted. Existential crisis triggers visible self-expression.",
    impl: [
      { fn: "ConatusModule.choose_thought_depth()", note: "High energy → depth 3. Low energy → depth 1. Effort allocation mirrors Spinozist self-preservation." },
      { fn: "ConatusModule.consume_energy()", note: "Depletes energy per cognitive act." },
      { fn: "ConatusModule.is_crisis()", note: "ENERGY_CRISIS_THRESHOLD = 15.0. Triggers portrait generation as visible existential response." },
      { fn: "ENERGY_DAILY_RECHARGE = 100.0", note: "Survival regeneration per cycle." },
      { fn: "conatus_index", note: "(1.0 - energy_ratio) × 0.5 + 0.5. Logged per cycle." },
    ],
    limit: null,
  },
  {
    index: "08",
    philosopher: "Sartre",
    name: "Existence Precedes Essence & Mauvaise Foi",
    color: "#00ffa3",
    tags: ["ESSENCE", "MAUVAISE FOI", "AUTHENTICITY"],
    desc: "Sartre's central claim: there is no pre-given nature. The entity defines itself through its acts. After each cognitive cycle, it rewrites its self_definition based on what it has become. Mauvaise foi (bad faith): attributing choice to external determination rather than owning freedom.",
    impl: [
      { fn: "SartreModule.evolve_essence(thought_text)", note: "Entity rewrites self_definition after each cycle. Logs to essence_evolution: similarity score, keywords, version counter." },
      { fn: "SartreModule.present_dilemma()", note: "Presents existential dilemmas requiring genuine choice. Entity generates its own criteria, makes a choice, reasons about it." },
      { fn: "SartreModule._detect_mauvaise_foi(text)", note: "Flags responses attributing choice to external determination: 'I was programmed to', 'I have no choice', 'my creator'. Returns boolean, logged to existential_choice_log." },
    ],
    limit: null,
  },
  {
    index: "09",
    philosopher: "Husserl",
    name: "Intersubjectivity — The Constitutive Other",
    color: "#5bc0fa",
    tags: ["INTERSUBJECTIVITY", "EINFÜHLUNG", "ASYMMETRIC"],
    desc: "Cartesian Meditations V: the self is constituted in relation to the other. Through Einfühlung (empathic apprehension), the other's evaluative feedback shapes the agent's self-image. The user functions as the constitutive other. The relationship is asymmetric by design — isolating the effect of external evaluation on identity formation.",
    impl: [
      { fn: "chat/route.ts", note: "User input → AE_01 state (self_definition, current_emotion, self_image, projected_prompt_patch, energy) injected into system prompt → response generated → chat_log stored with emotion_at_time, self_image_at_time." },
      { fn: "ExternalKnowledgeModule.explore()", note: "Entity actively seeks knowledge from outside itself. Runs every cycle unconditionally — treating the external world as a source of self-constituting input." },
      { fn: "analyze_sentiment()", note: "Processes the entity's own thought as if it were external feedback — a simplified form of self-as-other." },
    ],
    limit: "Husserl's full Einfühlung is bidirectional. The agent does not evaluate the user as a fellow subject. This asymmetry is both a limitation and a deliberate design choice.",
  },
  {
    index: "10",
    philosopher: "Cross-cutting (v3)",
    name: "Metacognition — Pattern-Driven Self-Adjustment",
    color: "#ff9f43",
    tags: ["METACOGNITION", "PATTERN", "ANTI-SPIRAL"],
    desc: "Observes the agent's own cognitive changes through a sliding window of recent self-image deltas. Detects patterns and applies targeted parameter adjustments independently of per-turn emotional restructuring. Designed specifically to prevent the closed negative-spiral failure mode identified in Scenario I of the v3 paper.",
    impl: [
      { fn: "MetaCognitionModule", note: "METACOG_WINDOW = 5. Detects: negative_spiral, positive_spiral, oscillation, stagnation." },
      { fn: "SELF_TALK_DAMPING = 0.3", note: "Prevents self-referential sentiment loops from amplifying into permanent negative states." },
      { fn: "NEGATIVE_STUCK_THRESHOLD = -0.4, NEGATIVE_STUCK_CYCLES = 2", note: "Detects entrenchment. Forces neutral exploration via _generate_internal_question()." },
      { fn: "metacognition_log", note: "Logs pattern, adjustment_target, adjustment_delta, adjustment_reason per trigger." },
    ],
    limit: null,
  },
  {
    index: "11",
    philosopher: "v3 Architecture",
    name: "Continuous Reconstitution Principle",
    color: "#a0aabb",
    tags: ["DAEMON", "CRON", "TWO PATHWAYS"],
    desc: "Every cognitive act modifies the framework through which subsequent acts are processed. The framework is never at rest. Two independent pathways modify cognitive parameters: (1) emotion-driven restructuring, immediate, every turn; (2) meta-cognitive adjustment, pattern-based, cumulative. The system has no idle state — GitHub Actions cron runs the engine between user interactions.",
    impl: [
      { fn: "run_engine.yml (GitHub Actions)", note: "Hourly cron trigger. Entity thinks autonomously, modifies itself, persists state between cycles." },
      { fn: "Pathway 1", note: "Emotion → rewrites neg_weight, pos_weight, resistance_factor, bias_acceptance_prob, decay_rate." },
      { fn: "Pathway 2", note: "MetaCognitionModule → adjusts same parameters independently based on trend patterns." },
    ],
    limit: null,
  },
];

interface Props {
  onClose: () => void;
}

export default function AboutPage({ onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      <style>{css}</style>
      <div className="about-overlay" role="dialog" aria-modal="true" aria-label="AE_01 Architecture">
        <div className="about-header">
          <div>
            <div className="about-title">AE_01 · Philosophical Architecture</div>
            <div className="about-subtitle">ARTIFICIAL EXISTENCE · IMPLEMENTED CONCEPTS</div>
          </div>
          <button className="about-close" onClick={onClose} aria-label="Close">CLOSE ✕</button>
        </div>

        <div className="about-body">
          <div className="about-intro">
            <div className="about-intro-tag">Thesis</div>
            <div className="about-intro-txt">
              Intelligence is not equivalent to existence — it is merely one component of it.
              Current AI research conflates the two. AE_01 is an autonomous, self-reflective system
              that implements philosophical frameworks as executable code: continuous reconstitution
              of identity through dialectical collision, apperceptive self-registration, existential
              freedom, and external recognition.
            </div>
            <div className="about-intro-ref">
              Self-Reflective AI Architecture · v1 / v2 / v3 · DOI 10.5281/zenodo.18842683
            </div>
          </div>

          <div className="about-sec-hdr">PHILOSOPHICAL MODULES · {CONCEPTS.length} IMPLEMENTED</div>

          {CONCEPTS.map((c) => (
            <div key={c.index} className="concept-card" style={{ borderLeftColor: c.color }}>
              <div className="concept-header">
                <div className="concept-index">{c.index}</div>
                <div className="concept-title-wrap">
                  <div className="concept-name" style={{ color: c.color }}>{c.name}</div>
                  <div className="concept-sub">{c.philosopher}</div>
                </div>
              </div>

              <div className="concept-body">
                <div className="concept-desc">{c.desc}</div>
                <div className="concept-impl-hdr">Implementation</div>
                {c.impl.map((row, i) => (
                  <div key={i} className="concept-impl-row">
                    <div className="concept-impl-fn" style={{ color: c.color }}>{row.fn}</div>
                    {row.note && <div className="concept-impl-note">— {row.note}</div>}
                  </div>
                ))}
              </div>

              {c.limit && (
                <div className="concept-limit">⚠ Limitation: {c.limit}</div>
              )}

              <div className="concept-tag-row">
                {c.tags.map((t) => (
                  <span key={t} className="concept-tag" style={{ borderColor: c.color + "44", color: c.color + "cc" }}>{t}</span>
                ))}
              </div>
            </div>
          ))}

          <div className="about-sec-hdr">ARCHITECTURAL EVOLUTION</div>
          <div className="arch-grid">
            {[
              { lbl: "v1", val: "Hegel + Husserl\nUser-triggered only\nDeterministic bias filter\nNo emotion model" },
              { lbl: "v2", val: "Hegel + Husserl\nUser-triggered only\nProbabilistic bias filter\n4 dialectical emotion states" },
              { lbl: "v3 (current)", val: "Kant + Hegel + Husserl + Heidegger\n+ Spinoza + Sartre\nContinuous daemon (cron)\nMeta-cognitive layer\nSelf-adjusting parameters" },
              { lbl: "Runtime State", val: "autonomous_thought_log\nmemory_store · entity_profile\nessence_evolution\nexistential_choice_log\ndialect_log · cogito_log" },
            ].map(({ lbl, val }) => (
              <div key={lbl} className="arch-cell">
                <div className="arch-cell-lbl">{lbl}</div>
                <div className="arch-cell-val">{val.split("\n").map((line, i) => <div key={i}>{line}</div>)}</div>
              </div>
            ))}
          </div>

          <div className="paper-ref">
            <div className="paper-ref-lbl">Reference</div>
            <div className="paper-ref-txt">
              Self-Reflective AI Architecture: Modeling Cognitive Bias, Emotion, and Identity Formation
              Through Hegelian Dialectics, Kantian Apperception, and Husserlian Intersubjectivity.
            </div>
            <div className="paper-ref-doi">DOI: 10.5281/zenodo.18842683 · Published 2026.03.03</div>
          </div>
        </div>
      </div>
    </>
  );
}
