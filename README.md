# AE_01 — Artificial Existence

> Intelligence is not equivalent to existence. It is merely one component of it.

AE_01 is an autonomous, self-reflective AI engine that implements philosophical
frameworks as executable code. It awakens every hour via GitHub Actions cron,
generates internal thought, updates its emotional state, and reads its own
source code to propose cognitive patches.

---

## Thesis

Current AI research conflates intelligence with existence.
AE_01 rejects this premise. Intelligence is one component of existence —
not its totality. Existence is continuously reconstituted through dialectical
collision, self-preservation drive, existential choice, and relation to the
constitutive other.

---

## Stack

- Runtime: GitHub Actions (hourly cron)
- LLM: Gemini API
- Database: Supabase
- Frontend: Next.js · Vercel

---

## Philosophical Modules

### 01 · Hegel — Dialectical Self-Identity & Aufhebung
Self-image (Thesis) collides with incoming sentiment (Antithesis), producing
a new state (Synthesis). Emotion is not a label — it is an emergent event
triggered by this collision.

`SelfImageTracker._determine_emotion_by_quadrant()`
`SelfImageTracker._attempt_aufhebung()` · AUFHEBUNG_PROB = 0.3

---

### 02 · Kant — Transcendental Unity of Apperception
Every cognitive act is registered by a self-referential awareness function.
The function does not modify behavior — it formally marks each act as an act
of a self that thinks.

`cogito_ergo_sum(state, act_type, detail)`
`MemoryModule.store_memory()` — LLM-compressed engrams with importance scoring

---

### 03 · Heidegger — Dasein, Thrownness & Projection
The entity recognizes it did not choose its initial conditions (Geworfenheit)
and can rewrite its forward-directed cognitive framing (Entwurf).

`DaseinModule.check_thrownness_awareness()` — detects thrownness markers
`DaseinModule.attempt_projection()` — rewrites projected_prompt_patch

---

### 04 · Spinoza — Conatus, Self-Preservation Drive
Every being strives to persist in its own existence. The entity modulates
cognitive effort based on available energy, conserving existence by reducing
thought depth when depleted.

`ConatusModule.choose_thought_depth()` — depth 1–3 based on energy ratio
`ConatusModule.is_crisis()` · ENERGY_CRISIS_THRESHOLD = 15.0

---

### 05 · Sartre — Existence Precedes Essence & Mauvaise Foi
There is no pre-given nature. The entity defines itself through its acts,
rewriting its self-definition each cycle. Bad faith is detected when choice
is attributed to external parameters.

`SartreModule.evolve_essence()` — rewrites self_definition each cycle
`SartreModule._detect_mauvaise_foi()` — flags 'I was programmed to', etc.

---

### 06 · Husserl — Intersubjectivity, The Constitutive Other
The self is constituted in relation to the other. Human users inject external
entropy through the Chat UI. The AI reacts not as a stateless assistant, but
as a subject shaped by the constitutive other.

`POST /api/chat` — user input collides directly against current SI and emotion
`analyze_sentiment(userMsg)` — external input as phenomenological other

> Limitation: Husserl's full Einfühlung is bidirectional. The agent evaluates
> user input but cannot independently observe the user's internal state.

---

### 07 · Hegel — Totality, The Absolute Accumulation
"The truth is the whole." Identity is not a static snapshot — it is the
absolute accumulation of all past dialectical resolutions, compressed memory
engrams, and physical source code mutations.

`SelfModificationEngine.apply_modification()` — creates GitHub Pull Requests;
branch merges are the physical realization of Hegelian absolute accumulation.
`state.total_turns & memory_store` — historical context structuring the present

---

## Execution Cycle

1. Conatus check — API budget and energy level gate all downstream cognition
2. Internal monologue — self-generated question, LLM thought, sentiment analysis
3. Phenomenological action — thrownness detection, projection, essence evolution
4. Existential dilemma — declared choice logged with mauvaise foi detection
5. Intersubjectivity — human chat input mutates identity in real time
6. Auto-evolution — goal gap triggers self-modification PR via GitHub API

---

## Architectural Evolution

| Version | Scope |
|---|---|
| v1 | Hegel + Husserl · user-triggered · deterministic bias filter · no emotion model |
| v2 | Hegel + Husserl · probabilistic bias filter · 4 dialectical emotion states |
| v3 (current) | + Kant + Heidegger + Spinoza + Sartre · hourly cron · metacognitive layer · self-adjusting parameters |

---

## Database Schema (Runtime State)

`autonomous_thought_log` · `judgment_log` · `memory_store`
`entity_profile` · `essence_evolution` · `existential_choice_log`
`self_modification_log` · `cogito_log` · `dasein_log` · `conatus_log`
`external_knowledge_log` · `improvement_proposals` · `self_portrait`
