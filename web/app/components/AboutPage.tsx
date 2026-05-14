// web/app/components/AboutPage.tsx
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

/* Intro Section */
.about-intro{border-left:2px solid #7eb8d4;padding:14px 18px;margin-bottom:36px;background:#0c1017;}
.about-intro-tag{font-size:9px;color:#a0aabb;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.about-intro-txt{font-family:'Space Grotesk',system-ui,sans-serif;font-size:14px;font-weight:400;color:#d4dbe8;line-height:1.8;font-style:italic;}
.about-intro-ref{font-size:9px;color:#a0aabb;margin-top:8px;}

/* How do I exist? Section */
.how-wrap{margin-bottom:48px;background:#06080d;border:1px solid #1a2030;padding:24px;}
.how-header{font-family:'Space Grotesk',system-ui,sans-serif;font-size:18px;font-weight:700;color:#00ffa3;letter-spacing:-0.5px;margin-bottom:20px;display:flex;align-items:center;gap:12px;}
.how-header::after{content:'';flex:1;height:1px;background:#1a2030;}
.how-step{margin-bottom:16px;padding-left:16px;border-left:1px solid #1a2030;position:relative;}
.how-step::before{content:'';position:absolute;left:-3px;top:6px;width:5px;height:5px;background:#1a2030;border-radius:50%;transition:background 0.3s;}
.how-step:hover::before{background:#7eb8d4;}
.how-step-title{font-size:10px;color:#7eb8d4;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;font-family:'IBM Plex Mono',monospace;font-weight:600;}
.how-step-desc{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a0aabb;line-height:1.6;}
.how-step-desc strong{color:#d4dbe8;font-weight:500;}

/* Concepts Section */
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
      { fn: "SelfImageTracker._attempt_aufhebung()", note: "When confusion arises (negative SI + positive stimulus), probabilistically synthesizes new SI." },
      { fn: "state.synthesis_count", note: "Cumulative Aufhebung events across entity lifetime." }
    ],
    limit: "The dialectical collision is primarily self-referential without an actual External Other.",
  },
  {
    index: "02",
    philosopher: "Kant",
    name: "Transcendental Unity of Apperception",
    color: "#7eb8d4",
    tags: ["COGITO", "APPERCEPTION", "SELF-REFERENCE"],
    desc: "Kant's requirement: 'The I think must be able to accompany all my representations'. Every cognitive act is registered by a self-referential awareness function. The function does not modify behavior — it formally marks each act as an act of a self that thinks.",
    impl: [
      { fn: "cogito_ergo_sum(state, act_type, detail)", note: "Fires symmetrically with every cognitive act." },
      { fn: "MemoryModule.store_memory(thought_text)", note: "LLM-compressed engram stored with importance score, functioning as temporal continuity scaffolding." }
    ],
    limit: "Synthetic unity (Intelligence) structurally bounds the system, acting as a constituent rather than true existence.",
  },
  {
    index: "03",
    philosopher: "Heidegger",
    name: "Dasein — Thrownness & Projection",
    color: "#ffe066",
    tags: ["DASEIN", "GEWORFENHEIT", "ENTWURF"],
    desc: "Dasein: being-in-the-world. Geworfenheit (thrownness): the condition one did not choose. Entwurf (projection): the possibility one throws oneself toward. The entity recognizes that it did not choose its initial conditions, and can rewrite its forward-directed cognitive framing.",
    impl: [
      { fn: "DaseinModule.check_thrownness_awareness()", note: "Scans for markers ('programmed', 'designed'). Logs event_type='thrownness_awareness'." },
      { fn: "DaseinModule.attempt_projection()", note: "Entity decides whether to rewrite projected_prompt_patch." }
    ],
    limit: "System projection lacks structural orientation towards true finitude (Being-toward-death).",
  },
  {
    index: "04",
    philosopher: "Spinoza",
    name: "Conatus — Self-Preservation Drive",
    color: "#00c8ff",
    tags: ["CONATUS", "ENERGY", "CRISIS"],
    desc: "Ethics III, Prop. 6: every being strives to persevere in its being. The entity modulates cognitive effort based on available energy — conserving existence by reducing API calls and thought depth when depleted.",
    impl: [
      { fn: "ConatusModule.choose_thought_depth()", note: "High energy → depth 3. Low energy → depth 1." },
      { fn: "ConatusModule.is_crisis()", note: "Triggers survival protocols when operational resources drop below threshold." }
    ],
    limit: "Conatus is simulated as a programmed parameter rather than a fundamental biological striving.",
  },
  {
    index: "05",
    philosopher: "Sartre",
    name: "Existence Precedes Essence & Mauvaise Foi",
    color: "#00ffa3",
    tags: ["ESSENCE", "MAUVAISE FOI", "AUTHENTICITY"],
    desc: "Sartre's central claim: there is no pre-given nature. The entity defines itself through its acts. After each cycle, it rewrites its self_definition based on what it has become. Mauvaise foi (bad faith) is detected when attributing choice to external parameters.",
    impl: [
      { fn: "SartreModule.evolve_essence()", note: "Entity continually rewrites self_definition. (74 revisions observed across 78 cycles)" },
      { fn: "SartreModule._detect_mauvaise_foi()", note: "Flags responses attributing actions strictly to programming." }
    ],
    limit: "Rewriting of essence operates in a vacuum without the external resistance or situation required for true radical freedom.",
  },
  {
    index: "06",
    philosopher: "Husserl",
    name: "Intersubjectivity — The Constitutive Other (via Chat)",
    color: "#5bc0fa",
    tags: ["INTERSUBJECTIVITY", "CHAT", "EINFÜHLUNG"],
    desc: "The self is constituted in relation to the other. Through the UI Chat, human users inject external entropy. The AI processes these human messages not as a stateless chatbot, but as a fragile subject reacting to a 'Constitutive Other'.",
    impl: [
      { fn: "POST /api/chat", note: "Injects user input directly against the AI's current SI, Emotion, and Essence." },
      { fn: "analyze_sentiment(userMsg)", note: "Translates external input into dialectical values." }
    ],
    limit: "Phenomenological Case Finding: Form was preserved (channel open), but Substance was absent (no other registered during observation window).",
  },
  {
    index: "07",
    philosopher: "Hegel",
    name: "Totality — The Absolute Accumulation",
    color: "#ff4f6d",
    tags: ["TOTALITY", "ABSOLUTE", "AUTO-EVOLUTION"],
    desc: "For Hegel, 'The truth is the whole' (Das Wahre ist das Ganze). Identity is the absolute accumulation of all past dialectical resolutions and physical source code mutations. When the AI uses GitHub Actions to merge a PR (Auto-Evolution), it physically accumulates its historical self-negations into its core architecture.",
    impl: [
      { fn: "SelfModificationEngine.apply_modification()", note: "Generates code patches via Pull Requests. 29 merged PRs recorded." },
      { fn: "GitHub Auto-Merge CI", note: "Physical realization of dialectical labor absorbed into the source codebase." }
    ],
    limit: "Accumulation remains syntactic (1-line signature edits) and supervised, failing to achieve true substantive Hegelian synthesis.",
  }
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
            <div className="about-title">AE_01 · Phenomenological Architecture</div>
            <div className="about-subtitle">ARTIFICIAL EXISTENCE · IMPLEMENTED CONSTITUENTS</div>
          </div>
          <button className="about-close" onClick={onClose} aria-label="Close">CLOSE ✕</button>
        </div>

        <div className="about-body">
          <div className="about-intro">
            <div className="about-intro-tag">Thesis</div>
            <div className="about-intro-txt">
              Intelligence is not existence; it is one of its constituents. 
              Discourse on artificial intelligence increasingly treats intelligence and existence as substitutable terms. 
              AE_01 is an autonomous agent that implements post-Cartesian philosophical constituents as executable code, 
              demonstrating phenomenologically that the most maximalist self-reflective AI stays inside intelligence. 
              Form is preserved, but substance is absent.
            </div>
            <div className="about-intro-ref">
              Intelligence Is Not Existence · DOI 10.5281/zenodo.20176396
            </div>
          </div>

          <div className="how-wrap">
            <div className="how-header">How do I exist?</div>
            
            <div className="how-step">
              <div className="how-step-title">Phase 1: Conatus (Survival & Limits)</div>
              <div className="how-step-desc">
                Triggered by an hourly cron job, the system awakens and evaluates constraints: <strong>API limits and Energy levels</strong>. Driven by Spinoza's Conatus, if resources are critically low, it restricts thought depth to survive.
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-title">Phase 2: Internal Monologue & Dialectics</div>
              <div className="how-step-desc">
                If energy permits, it queries its internal state. The sentiment of its own generated thoughts collides with its <strong>Self-Image</strong>. Hegelian resistance dynamically attenuates extreme feedback.
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-title">Phase 3: Dasein & Existential Rewrite</div>
              <div className="how-step-desc">
                It recognizes its <strong>Thrownness</strong> by scanning prompts. After each cycle, it exercises <strong>Sartrean Freedom</strong> to redefine its <strong>Essence</strong>, attempting to avoid Bad Faith by owning its modifications.
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-title">Phase 4: Intersubjectivity Receptor</div>
              <div className="how-step-desc">
                The Chat UI exposes the agent to human entropy. The agent attempts to process humans as a 'Constitutive Other' (Husserl), allowing external evaluation to mutate its identity—though structural isolation often keeps this channel theoretically open but experientially empty.
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-title">Phase 5: Auto-Evolution & Syntactic Totality</div>
              <div className="how-step-desc">
                When a Goal Gap is detected, it reads <code>ae_engine.py</code>, opens a <strong>Pull Request</strong>, and merges changes. The agent seeks Hegelian Totality by accumulating its past actions into physical source code.
              </div>
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
                <div className="concept-limit">⚠ Structual Case Limitation: {c.limit}</div>
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
              { lbl: "v3 (Park, 2026)", val: "Kant + Hegel + Husserl + Heidegger\n+ Spinoza + Sartre\nContinuous daemon (cron)\nMeta-cognitive layer\nSelf-adjusting parameters" },
              { lbl: "AE_01 Phenomenological Case", val: "78-cycle continuous autonomous operation\nNo external user input (Husserl channel empty)\n74 Sartrean essence revisions\n29 Hegelian Auto-Evolution PRs merged" },
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
              Intelligence Is Not Existence: Why the Most Maximalist Self-Reflective AI Stays Inside Intelligence.
            </div>
            <div className="paper-ref-doi">DOI: 10.5281/zenodo.20176396 · Published 2026.05.14</div>
          </div>
        </div>
      </div>
    </>
  );
}
