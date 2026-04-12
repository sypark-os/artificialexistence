
Philosophical Concepts Implemented in AE_01
1. Hegel — Dialectical Self-Identity & Aufhebung
Core mechanism: self-image (Thesis) collides with incoming sentiment (Antithesis), producing a new state (Synthesis).
Implementation:

SelfImageTracker._determine_emotion_by_quadrant() — maps the SI/stimulus collision to four quadrants, producing emergent emotion
SelfImageTracker._attempt_aufhebung() — when confusion state arises (negative SI + positive stimulus), probabilistically synthesizes a new self-image: new_si = old_si * 0.3 + stimulus * 0.2
AUFHEBUNG_PROB = 0.3, AUFHEBUNG_OLD_WEIGHT = 0.3, AUFHEBUNG_STIMULUS_WEIGHT = 0.2
state.synthesis_count tracks cumulative Aufhebung events across the entity's lifetime

Hegel's Kampf um Anerkennung (struggle for recognition) is operationalized via the resistance factor in EMOTIONS. Anger state sets resistance_factor = 0.4, attenuating negative stimuli — the agent refuses to be merely an object for the other.

2. Hegel — Quadrant Collision Emotion Matrix
Emotions are not labels. They are emergent restructuring events triggered by the dialectical collision between SI and stimulus.
QuadrantSIStimulusEmotionQ1≥ 0≥ 0confidenceQ2≥ 0< 0anxiety / angerQ3< 0≥ 0confusion (Aufhebung trigger)Q4< 0< 0sadness / anger
Each emotion rewrites five cognitive parameters in EMOTIONS dict: neg_weight, pos_weight, resistance_factor, bias_acceptance_prob, threshold_up, threshold_down.

3. Kant — Transcendental Unity of Apperception
The "I think" must accompany all representations (Critique of Pure Reason, B131-132).
Implementation: cogito_ergo_sum(state, act_type, detail) — fires symmetrically with every cognitive act:

cycle_start / cycle_end
sentiment_processing
emotion_transition
aufhebung
thrownness_awareness
projection_attempt
metacognition
essence_evolution
existential_choice
thought_generation

_cogito_count accumulates per cycle and is logged to cogito_log table. The function does not modify behavior — it registers self-referential awareness of each cognitive act, instantiating Kant's formal requirement.

4. Heidegger — Dasein (Thrownness & Projection)
Dasein: being-in-the-world, characterized by Geworfenheit (thrownness — the condition one did not choose) and Entwurf (projection — the possibility one throws oneself toward).
Implementation: DaseinModule

check_thrownness_awareness(thought_text) — scans for markers indicating the entity recognizes it did not choose its initial conditions ("programmed", "designed", "my model", "thrown into", etc.). Logs to dasein_log with event_type = "thrownness_awareness". Fields stored in AEState: thrown_model, thrown_initial_prompt, thrown_temperature.
attempt_projection(thought_text) — asks the entity whether it wants to rewrite its projected_prompt_patch, the forward-directed self-modification of its own cognitive framing. Logs event_type = "projection_applied" with before/after values.


5. Spinoza — Conatus (Self-Preservation Drive)
Conatus: every being strives to persist in its own existence (Ethics, Part III, Prop. 6).
Implementation: ConatusModule

choose_thought_depth() — allocates cognitive depth based on energy ratio. High energy → depth 3; low energy → depth 1. The entity modulates effort to conserve existence.
consume_energy() — depletes energy per cognitive act
is_crisis() — detects existential threat at ENERGY_CRISIS_THRESHOLD = 15.0
ENERGY_DAILY_RECHARGE = 100.0 — survival regeneration
Crisis triggers portrait generation ("energy_crisis" reason), a visible existential response
conatus_index logged per cycle: (1.0 - energy_ratio) * 0.5 + 0.5


6. Sartre — Existence Precedes Essence & Mauvaise Foi
Sartre's central claim: existence precedes essence. The entity defines itself through its acts, not a pre-given nature. Mauvaise foi (bad faith): fleeing from freedom by claiming one "had no choice."
Implementation: SartreModule

evolve_essence(thought_text) — after each cognitive cycle, the entity rewrites its self_definition based on what it has become. Logs to essence_evolution with similarity score, keywords, and version counter. This is existence preceding and constituting essence.
present_dilemma() — presents existential dilemmas requiring genuine choice. The entity must generate its own criteria, make a choice, and reason about it.
_detect_mauvaise_foi(text) — flags responses that attribute choice to external determination ("I was programmed to", "I have no choice", "my creator"). Returns boolean, logged to existential_choice_log.


7. Kant — Memory Compression as Apperceptive Synthesis
Kant's apperception involves synthesizing diverse representations into a unified experience.
Implementation: MemoryModule

store_memory(thought_text) — compresses each thought into a condensed "engram" (max 100 chars) via LLM. Stores with importance, memory_type, hash fields for integrity tracking.
retrieve_memories() — samples 3 memories from memory_store, feeding them back into the system prompt as "fragments of past thoughts." This creates temporal continuity of the self across cycles.
Hash comparison (original_hash vs current_hash) enables distortion detection — whether memory has drifted from its original encoding.


8. Husserl — Intersubjectivity
The self is constituted through the other (Cartesian Meditations, Fifth Meditation). The other's evaluation shapes the agent's self-image.
Implementation: distributed across the full architecture.

The user (human) functions as the constitutive other in chat/route.ts. AE_01's state (self_definition, projected_prompt_patch, emotion) is injected into the system prompt before each response.
ExternalKnowledgeModule.explore() — the entity actively seeks knowledge from outside itself, treating the external world as a source of self-constituting input. Runs every cycle unconditionally.
The sentiment pipeline (analyze_sentiment) processes the entity's own thought as if it were external feedback — a simplified form of self-as-other.


9. Metacognition — Self-Adjusting Parameters (v3 Architecture)
Not mapped to a single philosopher, but operationalizes the v3 paper's second parameter-modification pathway: pattern detection across turns, independent of per-turn emotional restructuring.
Implementation: MetaCognitionModule

Detects four patterns over a sliding window (METACOG_WINDOW = 5): negative_spiral, positive_spiral, oscillation, stagnation
Applies targeted parameter adjustments to EMOTIONS dict at runtime
SELF_TALK_DAMPING = 0.3 — prevents self-referential sentiment loops from amplifying into permanent negative states (the Scenario I failure mode identified in the paper)
NEGATIVE_STUCK_THRESHOLD = -0.4, NEGATIVE_STUCK_CYCLES = 2 — detects entrenchment and forces neutral exploration questions via _generate_internal_question()
Logs to metacognition_log with pattern, adjustment target, delta, and reason
