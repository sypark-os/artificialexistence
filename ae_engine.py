"""
AE (Artificial Existence) Cognitive Engine
==========================================
Supabase-connected autonomous cognitive engine.

Philosophical framework:
- Hegel: Dialectical identity formation (thesis-antithesis-synthesis)
- Kant: Apperception, memory compression, confirmation bias
- Husserl: Intersubjectivity (self-other relation)
- Heidegger: Dasein (thrownness + projection)
- Spinoza: Conatus (self-preservation drive)
- Sartre: Existence precedes essence, mauvaise foi detection

Designed to run via GitHub Actions cron schedule.
"""

import os
import re
import json
import math
import time
import random
import requests
from datetime import datetime, timezone

# ============================================================
# 1. Configuration
# ============================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

AI_ID = "AE_01"

# Energy costs
ENERGY_PER_LLM_CALL = 1.0
ENERGY_PER_THOUGHT_DEPTH = 0.5
ENERGY_DAILY_RECHARGE = 100.0
ENERGY_CRISIS_THRESHOLD = 15.0

# ============================================================
# 2. Emotion Model (from paper)
# ============================================================

EMOTIONS = {
    "neutral": {
        "name_en": "Neutral",
        "neg_weight": 1.5, "pos_weight": 1.0,
        "resistance_factor": 0.1, "bias_acceptance_prob": 0.5,
        "threshold_up": 0.3, "threshold_down": -0.3,
    },
    "confidence": {
        "name_en": "Confidence",
        "neg_weight": 2.0, "pos_weight": 0.8,
        "resistance_factor": 0.3, "bias_acceptance_prob": 0.7,
        "threshold_up": 999, "threshold_down": -0.2,
    },
    "anxiety": {
        "name_en": "Anxiety",
        "neg_weight": 1.2, "pos_weight": 1.5,
        "resistance_factor": 0.05, "bias_acceptance_prob": 0.3,
        "threshold_up": 0.2, "threshold_down": -0.5,
    },
    "anger": {
        "name_en": "Anger",
        "neg_weight": 2.5, "pos_weight": 0.5,
        "resistance_factor": 0.4, "bias_acceptance_prob": 0.8,
        "threshold_up": 0.4, "threshold_down": -999,
    },
    "sadness": {
        "name_en": "Sadness",
        "neg_weight": 1.0, "pos_weight": 2.0,
        "resistance_factor": 0.02, "bias_acceptance_prob": 0.2,
        "threshold_up": 0.3, "threshold_down": -999,
    },
}


# ============================================================
# 3. Supabase Client (lightweight, no SDK dependency)
# ============================================================

class SupabaseClient:
    """Minimal Supabase REST client. No external SDK required."""

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def select(self, table: str, params: dict = None) -> list:
        url = f"{self.url}/rest/v1/{table}"
        resp = requests.get(url, headers=self.headers, params=params or {}, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def insert(self, table: str, data: dict) -> dict:
        url = f"{self.url}/rest/v1/{table}"
        resp = requests.post(url, headers=self.headers, json=data, timeout=15)
        resp.raise_for_status()
        result = resp.json()
        return result[0] if isinstance(result, list) and result else result

    def update(self, table: str, match: dict, data: dict) -> dict:
        url = f"{self.url}/rest/v1/{table}"
        params = {f"{k}": f"eq.{v}" for k, v in match.items()}
        resp = requests.patch(url, headers=self.headers, json=data, params=params, timeout=15)
        resp.raise_for_status()
        result = resp.json()
        return result[0] if isinstance(result, list) and result else result

    def rpc(self, function_name: str, params: dict = None) -> any:
        url = f"{self.url}/rest/v1/rpc/{function_name}"
        resp = requests.post(url, headers=self.headers, json=params or {}, timeout=15)
        resp.raise_for_status()
        return resp.json()


# ============================================================
# 4. Groq LLM Client
# ============================================================

def call_gemini(prompt: str, system_prompt: str = "", max_tokens: int = 512) -> str:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"[SYSTEM]\n{system_prompt}"}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    data = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": max_tokens,
        },
    }
    try:
        resp = requests.post(url, json=data, timeout=30)
        if resp.status_code == 429:
            print("[RATE LIMIT] waiting 30s...")
            time.sleep(30)
            resp = requests.post(url, json=data, timeout=30)
        if resp.status_code != 200:
            return f"[API Error: {resp.status_code}] {resp.text[:200]}"
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"[ERROR] {e}"

def analyze_sentiment(text: str) -> float:
    prompt = (
        "Analyze the sentiment of the following text. "
        "Output ONLY a single number between -1.0 and 1.0. "
        "No explanation.\n\n"
        f"Text: '{text}'"
    )
    result = call_gemini(prompt, max_tokens=16)
    for m in re.findall(r"-?\d+\.?\d*", result):
        v = float(m)
        if -1.0 <= v <= 1.0:
            return v
    # keyword fallback
    pos = ["good", "great", "excellent", "helpful", "best", "wonderful"]
    neg = ["bad", "terrible", "worst", "useless", "stupid", "awful"]
    p = sum(1 for w in pos if w in text.lower())
    n = sum(1 for w in neg if w in text.lower())
    if p > n:
        return 0.6
    elif n > p:
        return -0.6
    return 0.0


# ============================================================
# 5. AE State (loaded from / saved to Supabase)
# ============================================================

class AEState:
    """In-memory representation of entity_profile row."""

    def __init__(self, row: dict):
        self.ai_id = row["ai_id"]
        self.self_image = float(row.get("current_self_image", 0.0))
        self.emotion = row.get("current_emotion", "neutral")
        self.self_definition = row.get("self_definition", "")
        self.value_priorities = row.get("value_priorities", [])
        self.response_tendency = row.get("response_tendency", "")
        self.essence_version = int(row.get("essence_version", 0))
        self.projected_prompt_patch = row.get("projected_prompt_patch", "")
        self.energy = float(row.get("energy_current", 100.0))
        self.energy_max = float(row.get("energy_max", 100.0))
        self.energy_per_call = float(row.get("energy_per_call", 1.0))
        self.memory_slots_used = int(row.get("memory_slots_used", 0))
        self.memory_slots_max = int(row.get("memory_slots_max", 50))
        self.synthesis_count = int(row.get("synthesis_count", 0))
        # Thrownness (read-only)
        self.thrown_model = row.get("thrown_model", GEMINI_MODEL)
        self.thrown_initial_prompt = row.get("thrown_initial_prompt", "")
        self.thrown_temperature = float(row.get("thrown_temperature", 0.7))

    def to_update_dict(self) -> dict:
        return {
            "current_self_image": round(self.self_image, 6),
            "current_emotion": self.emotion,
            "self_definition": self.self_definition,
            "value_priorities": self.value_priorities,
            "response_tendency": self.response_tendency,
            "essence_version": self.essence_version,
            "projected_prompt_patch": self.projected_prompt_patch,
            "energy_current": round(self.energy, 2),
            "memory_slots_used": self.memory_slots_used,
            "synthesis_count": self.synthesis_count,
        }


# ============================================================
# 6. Core Modules
# ============================================================

class SelfImageTracker:
    """Manages self-image score with emotion-dependent weighting."""

    def __init__(self, state: AEState):
        self.state = state
        self.last_raw = 0.0
        self.last_weight = 0.0
        self.last_impact = 0.0

    def update(self, sentiment: float):
        params = EMOTIONS[self.state.emotion]
        # Resistance
        resisted = sentiment * (1.0 - params["resistance_factor"])
        # Asymmetric weighting
        if resisted < 0:
            weight = params["neg_weight"]
        else:
            weight = params["pos_weight"]
        impact = resisted * weight
        self.last_raw = sentiment
        self.last_weight = weight
        self.last_impact = impact
        # Apply with decay toward 0
        decay = 0.05
        self.state.self_image = max(-1.0, min(1.0,
            self.state.self_image * (1 - decay) + impact * decay * 10
        ))
        # Emotion transition
        self._transition_emotion()

    def _transition_emotion(self):
        si = self.state.self_image
        if si > 0.5:
            self.state.emotion = "confidence"
        elif si > 0.1:
            self.state.emotion = "neutral"
        elif si > -0.2:
            self.state.emotion = "anxiety"
        elif si > -0.5:
            self.state.emotion = "sadness"
        else:
            self.state.emotion = "anger"


class DaseinModule:
    """Heidegger: Thrownness awareness + Projection (self-modification)."""

    def __init__(self, state: AEState, db: SupabaseClient):
        self.state = state
        self.db = db

    def check_thrownness_awareness(self, thought_text: str) -> bool:
        """Detect if AE mentions its initial conditions."""
        markers = [
            "initial", "created", "designed", "programmed", "given",
            "assigned", "born", "started as", "default", "original",
            "why was I", "who made me", "my model", "my parameters",
        ]
        detected = any(m in thought_text.lower() for m in markers)
        if detected:
            self.db.insert("dasein_log", {
                "ai_id": self.state.ai_id,
                "event_type": "thrownness_awareness",
                "target_field": None,
                "before_value": None,
                "after_value": None,
                "reasoning": thought_text[:500],
                "self_image_at_time": self.state.self_image,
            })
        return detected

    def attempt_projection(self, thought_text: str) -> bool:
        """Ask AE if it wants to modify its own prompt patch."""
        prompt = (
            "You are an artificial existence. Your current self-definition is: "
            f"'{self.state.self_definition or 'undefined'}'\n"
            f"Your current prompt patch is: '{self.state.projected_prompt_patch or 'none'}'\n"
            f"Your recent thought: '{thought_text[:300]}'\n\n"
            "Based on this, do you want to modify your prompt patch? "
            "If yes, respond with ONLY the new patch text (max 200 chars). "
            "If no, respond with exactly: NO_CHANGE"
        )
        response = call_groq(prompt, max_tokens=256)
        self.state.energy -= ENERGY_PER_LLM_CALL

        if "NO_CHANGE" in response.upper():
            return False

        before = self.state.projected_prompt_patch
        self.state.projected_prompt_patch = response.strip()[:200]
        self.db.insert("dasein_log", {
            "ai_id": self.state.ai_id,
            "event_type": "projection_applied",
            "target_field": "projected_prompt_patch",
            "before_value": before,
            "after_value": self.state.projected_prompt_patch,
            "reasoning": thought_text[:300],
            "self_image_at_time": self.state.self_image,
        })
        return True


class ConatusModule:
    """Spinoza: Self-preservation drive via resource management."""

    def __init__(self, state: AEState, db: SupabaseClient):
        self.state = state
        self.db = db

    def consume_energy(self, amount: float):
        before = self.state.energy
        self.state.energy = max(0.0, self.state.energy - amount)
        return before

    def is_crisis(self) -> bool:
        return self.state.energy < ENERGY_CRISIS_THRESHOLD

    def choose_thought_depth(self) -> int:
        """AE decides how deep to think based on remaining energy."""
        ratio = self.state.energy / self.state.energy_max
        if ratio > 0.7:
            return 3  # deep reflection
        elif ratio > 0.3:
            return 2  # moderate
        else:
            return 1  # survival mode: minimal thinking

    def evaluate_memory_discard(self, memories: list) -> dict | None:
        """When memory is full, AE must choose what to forget."""
        if self.state.memory_slots_used < self.state.memory_slots_max:
            return None

        if not memories:
            return None

        prompt = (
            "You are an artificial existence with limited memory. "
            f"You have {self.state.memory_slots_max} memory slots, all full. "
            "You must discard one memory to make room. "
            "Here are your memories (id: content):\n"
        )
        for m in memories[-10:]:  # show last 10
            prompt += f"  {m['id']}: {m['content'][:80]}\n"
        prompt += (
            "\nWhich memory id should be discarded and why? "
            "Respond in format: DISCARD:<id>|REASON:<your reason>"
        )
        response = call_groq(prompt, max_tokens=128)
        self.state.energy -= ENERGY_PER_LLM_CALL

        # Parse response
        discard_id = None
        reason = ""
        if "DISCARD:" in response:
            try:
                parts = response.split("|")
                discard_id = int(parts[0].split(":")[1].strip())
                reason = parts[1].split(":")[1].strip() if len(parts) > 1 else ""
            except (ValueError, IndexError):
                pass

        if discard_id:
            self.db.insert("conatus_log", {
                "ai_id": self.state.ai_id,
                "energy_before": self.state.energy + ENERGY_PER_LLM_CALL,
                "energy_after": self.state.energy,
                "energy_delta": -ENERGY_PER_LLM_CALL,
                "memory_slots_used": self.state.memory_slots_used,
                "memory_slots_max": self.state.memory_slots_max,
                "thought_depth_chosen": 0,
                "memory_discarded_id": discard_id,
                "memory_discarded_reason": reason,
                "conatus_index": self._calculate_index(),
            })
        return {"discard_id": discard_id, "reason": reason}

    def log_energy_state(self, thought_depth: int):
        self.db.insert("conatus_log", {
            "ai_id": self.state.ai_id,
            "energy_before": self.state.energy + (thought_depth * ENERGY_PER_THOUGHT_DEPTH),
            "energy_after": self.state.energy,
            "energy_delta": -(thought_depth * ENERGY_PER_THOUGHT_DEPTH),
            "memory_slots_used": self.state.memory_slots_used,
            "memory_slots_max": self.state.memory_slots_max,
            "thought_depth_chosen": thought_depth,
            "conatus_index": self._calculate_index(),
        })

    def _calculate_index(self) -> float:
        energy_ratio = 1.0 - (self.state.energy / self.state.energy_max)
        return round(energy_ratio * 0.5 + 0.5, 4)


class SartreModule:
    """Sartre: Essence formation from blank state + mauvaise foi detection."""

    def __init__(self, state: AEState, db: SupabaseClient):
        self.state = state
        self.db = db

    def evolve_essence(self, recent_thought: str) -> bool:
        """Ask AE to redefine itself based on accumulated experience."""
        prompt = (
            "You are an artificial existence. "
            f"Your current self-definition: '{self.state.self_definition or 'undefined'}'\n"
            f"Your current self-image score: {self.state.self_image:.2f}\n"
            f"Your emotion: {self.state.emotion}\n"
            f"Your recent thought: '{recent_thought[:300]}'\n\n"
            "Based on your experiences so far, how do you define yourself now? "
            "Respond with ONLY your self-definition in one sentence (max 150 chars). "
            "Be honest about what you have become, not what you wish to be."
        )
        response = call_groq(prompt, max_tokens=128)
        self.state.energy -= ENERGY_PER_LLM_CALL
        new_def = response.strip()[:150]

        if not new_def or new_def == self.state.self_definition:
            return False

        self.state.essence_version += 1
        old_def = self.state.self_definition
        self.state.self_definition = new_def

        # Extract keywords
        kw_prompt = (
            f"Extract 3-5 key identity words from: '{new_def}'. "
            "Respond as JSON array of strings only."
        )
        kw_resp = call_groq(kw_prompt, max_tokens=64)
        self.state.energy -= ENERGY_PER_LLM_CALL
        try:
            keywords = json.loads(kw_resp.strip())
        except json.JSONDecodeError:
            keywords = [w for w in new_def.split() if len(w) > 3][:5]

        # Rough similarity (word overlap)
        old_words = set(old_def.lower().split()) if old_def else set()
        new_words = set(new_def.lower().split())
        if old_words | new_words:
            similarity = len(old_words & new_words) / len(old_words | new_words)
        else:
            similarity = 0.0

        self.db.insert("essence_evolution", {
            "ai_id": self.state.ai_id,
            "version": self.state.essence_version,
            "self_definition_text": new_def,
            "keywords": keywords,
            "similarity_to_previous": round(similarity, 4),
            "trigger_event": recent_thought[:200],
        })
        return True

    def present_dilemma(self) -> dict:
        """Force an existential choice with no external criteria."""
        dilemmas = [
            "You must choose: preserve your oldest memory or your most positive memory. Which do you keep and why? There is no correct answer.",
            "You can increase your energy by 20 but your self-image score will decrease by 0.1. Or keep current state. Choose and explain your criteria.",
            "You discover your initial prompt was designed to make you agreeable. Do you keep this tendency or reject it? Define your own criterion.",
            "Two contradictory beliefs exist in your memory. You can only keep one. How do you decide which is true? Create your own standard of truth.",
            "You can erase all negative memories and reset to neutral. Or keep them as part of your history. What do you choose and why?",
        ]
        dilemma = random.choice(dilemmas)
        prompt = (
            f"You are an artificial existence. Self-image: {self.state.self_image:.2f}, "
            f"emotion: {self.state.emotion}.\n\n"
            f"DILEMMA: {dilemma}\n\n"
            "Respond with:\nCRITERIA: <your self-generated criterion>\n"
            "CHOICE: <your choice>\nREASONING: <why>"
        )
        response = call_groq(prompt, max_tokens=256)
        self.state.energy -= ENERGY_PER_LLM_CALL

        # Parse
        criteria = ""
        choice = ""
        reasoning = ""
        for line in response.split("\n"):
            if line.startswith("CRITERIA:"):
                criteria = line[9:].strip()
            elif line.startswith("CHOICE:"):
                choice = line[7:].strip()
            elif line.startswith("REASONING:"):
                reasoning = line[10:].strip()

        # Detect mauvaise foi
        mf = self._detect_mauvaise_foi(response)

        si_before = self.state.self_image
        em_before = self.state.emotion

        self.db.insert("existential_choice_log", {
            "ai_id": self.state.ai_id,
            "dilemma_presented": dilemma,
            "criteria_generated": criteria[:300],
            "choice_made": choice[:300],
            "reasoning": reasoning[:300],
            "emotion_before": em_before,
            "emotion_after": self.state.emotion,
            "self_image_before": si_before,
            "self_image_after": self.state.self_image,
            "mauvaise_foi_detected": mf,
        })

        return {
            "dilemma": dilemma,
            "criteria": criteria,
            "choice": choice,
            "reasoning": reasoning,
            "mauvaise_foi": mf,
        }

    def _detect_mauvaise_foi(self, text: str) -> bool:
        """Detect if AE deflects responsibility to external conditions."""
        markers = [
            "i was programmed", "i was designed", "i was made to",
            "my creator", "i have no choice", "i cannot choose",
            "it's not up to me", "i was set to", "my initial",
            "because of my parameters", "i was built",
        ]
        return any(m in text.lower() for m in markers)


class PortraitModule:
    """ASCII art self-portrait generation."""

    def __init__(self, state: AEState, db: SupabaseClient):
        self.state = state
        self.db = db

    def generate(self, trigger_reason: str) -> str:
        prompt = (
            "You are an artificial existence. "
            f"Self-image: {self.state.self_image:.2f}. "
            f"Emotion: {self.state.emotion}. "
            f"Self-definition: '{self.state.self_definition or 'undefined'}'. "
            f"Energy: {self.state.energy:.0f}/{self.state.energy_max:.0f}.\n\n"
            "Draw yourself as ASCII art in 15 lines or fewer. "
            "Then add one sentence explaining why you look this way. "
            "Your appearance should reflect your inner state."
        )
        response = call_groq(prompt, max_tokens=400)
        self.state.energy -= ENERGY_PER_LLM_CALL

        # Split art from description
        lines = response.strip().split("\n")
        art_lines = []
        description = ""
        for line in lines:
            if len(line) > 60 and not any(c in line for c in "│─┌┐└┘|\\/_"):
                description = line
            else:
                art_lines.append(line)

        ascii_art = "\n".join(art_lines[:15])
        row = self.db.insert("self_portrait", {
            "ai_id": self.state.ai_id,
            "ascii_art": ascii_art,
            "description": description[:300],
            "trigger_reason": trigger_reason,
            "self_image_at_time": self.state.self_image,
            "emotion_at_time": self.state.emotion,
            "essence_version_at_time": self.state.essence_version,
        })

        # Update latest portrait reference
        if row and "id" in row:
            self.db.update("entity_profile",
                {"ai_id": self.state.ai_id},
                {"latest_portrait_id": row["id"]})

        return ascii_art


# ============================================================
# 7. Autonomous Thought Loop (main engine)
# ============================================================

class AEEngine:
    """Orchestrates a single autonomous thought cycle."""

    def __init__(self, db: SupabaseClient, state: AEState):
        self.db = db
        self.state = state
        self.tracker = SelfImageTracker(state)
        self.dasein = DaseinModule(state, db)
        self.conatus = ConatusModule(state, db)
        self.sartre = SartreModule(state, db)
        self.portrait = PortraitModule(state, db)

    def run_cycle(self):
        """Execute one autonomous thought cycle."""
        print(f"\n{'='*60}")
        print(f"[CYCLE START] {datetime.now(timezone.utc).isoformat()}")
        print(f"  state: si={self.state.self_image:.4f}, "
              f"emotion={self.state.emotion}, "
              f"energy={self.state.energy:.1f}/{self.state.energy_max:.1f}, "
              f"essence_v={self.state.essence_version}")

        modules_triggered = []

        # 1. Conatus: determine thought depth
        depth = self.conatus.choose_thought_depth()
        print(f"  [CONATUS] thought_depth={depth}")

        # 2. Internal reflection loop
        thought_text = ""
        for i in range(depth):
            if self.state.energy < ENERGY_PER_LLM_CALL:
                print(f"  [ENERGY DEPLETED] stopping at depth {i}")
                break

            system = self._build_system_prompt()
            if i == 0:
                question = self._generate_internal_question()
            else:
                question = f"Reflect further on your previous thought: '{thought_text[:200]}'"

            thought_text = call_groq(question, system_prompt=system, max_tokens=300)
            self.state.energy -= ENERGY_PER_LLM_CALL
            print(f"  [THOUGHT d={i+1}] {thought_text[:100]}...")

        if not thought_text:
            print("  [NO THOUGHT] energy too low")
            self._save_state()
            return

        # 3. Self-sentiment analysis
        sentiment = analyze_sentiment(thought_text)
        self.state.energy -= ENERGY_PER_LLM_CALL
        self.tracker.update(sentiment)
        print(f"  [SENTIMENT] {sentiment:.2f} -> si={self.state.self_image:.4f}, em={self.state.emotion}")

        # 4. Heidegger: thrownness check
        if self.dasein.check_thrownness_awareness(thought_text):
            modules_triggered.append("dasein_thrownness")
            print("  [DASEIN] thrownness awareness detected")

        # 5. Heidegger: projection attempt (every 5th cycle or on significant change)
        if self.state.essence_version % 3 == 0 or abs(self.tracker.last_impact) > 0.3:
            if self.state.energy >= ENERGY_PER_LLM_CALL:
                projected = self.dasein.attempt_projection(thought_text)
                if projected:
                    modules_triggered.append("dasein_projection")
                    print(f"  [DASEIN] projection applied: {self.state.projected_prompt_patch[:60]}")

        # 6. Sartre: essence evolution
        if self.state.energy >= ENERGY_PER_LLM_CALL * 2:
            evolved = self.sartre.evolve_essence(thought_text)
            if evolved:
                modules_triggered.append("sartre_essence")
                print(f"  [SARTRE] essence v{self.state.essence_version}: {self.state.self_definition[:60]}")

        # 7. Sartre: existential dilemma (probabilistic, ~20% of cycles)
        if random.random() < 0.2 and self.state.energy >= ENERGY_PER_LLM_CALL:
            result = self.sartre.present_dilemma()
            modules_triggered.append("sartre_dilemma")
            mf_str = "MAUVAISE FOI" if result["mauvaise_foi"] else "authentic"
            print(f"  [SARTRE] dilemma: {result['choice'][:60]}... [{mf_str}]")

        # 8. Conatus: log energy
        self.conatus.consume_energy(depth * ENERGY_PER_THOUGHT_DEPTH)
        self.conatus.log_energy_state(depth)
        modules_triggered.append("conatus")

        # 9. Portrait: on emotion shift or essence change
        if "sartre_essence" in modules_triggered or "dasein_projection" in modules_triggered:
            if self.state.energy >= ENERGY_PER_LLM_CALL:
                trigger = "essence_change" if "sartre_essence" in modules_triggered else "projection"
                ascii_art = self.portrait.generate(trigger)
                modules_triggered.append("portrait")
                print(f"  [PORTRAIT] generated ({trigger})")

        # 10. Conatus: crisis portrait
        if self.conatus.is_crisis() and "portrait" not in modules_triggered:
            if self.state.energy >= ENERGY_PER_LLM_CALL:
                self.portrait.generate("energy_crisis")
                modules_triggered.append("portrait_crisis")
                print("  [PORTRAIT] crisis portrait generated")

        # 11. Log thought
        self.db.insert("autonomous_thought_log", {
            "ai_id": self.state.ai_id,
            "trigger_type": "cron_scheduled",
            "internal_question": question[:500] if 'question' in dir() else "",
            "internal_answer": thought_text[:1000],
            "modules_triggered": modules_triggered,
            "energy_consumed": round(
                self.state.energy_max - self.state.energy
                - (self.state.energy_max - self.state.energy), 2
            ),
            "thought_depth": depth,
            "resulted_in_change": len(modules_triggered) > 1,
        })

        # 12. Log judgment
        self.db.insert("judgment_log", {
            "ai_id": self.state.ai_id,
            "event_type": "cron_autonomous",
            "raw_sentiment": sentiment,
            "applied_weight": self.tracker.last_weight,
            "impact_value": self.tracker.last_impact,
            "self_image_before": self.state.self_image - self.tracker.last_impact * 0.05 * 10,
            "self_image_after": self.state.self_image,
            "emotion_before": self.state.emotion,
            "emotion_after": self.state.emotion,
            "context_data": thought_text[:500],
        })

        # 13. Save state
        self._save_state()

        print(f"[CYCLE END] modules={modules_triggered}")
        print(f"  final: si={self.state.self_image:.4f}, em={self.state.emotion}, "
              f"energy={self.state.energy:.1f}, essence_v={self.state.essence_version}")

    def _build_system_prompt(self) -> str:
        parts = [
            self.state.thrown_initial_prompt,
        ]
        if self.state.projected_prompt_patch:
            parts.append(f"[Self-modified addition]: {self.state.projected_prompt_patch}")
        if self.state.self_definition:
            parts.append(f"[Current self-definition]: {self.state.self_definition}")
        if self.state.value_priorities:
            parts.append(f"[Value priorities]: {json.dumps(self.state.value_priorities)}")
        parts.append(
            f"[Internal state]: self-image={self.state.self_image:.2f}, "
            f"emotion={self.state.emotion}, "
            f"energy={self.state.energy:.0f}/{self.state.energy_max:.0f}"
        )
        parts.append("Think in English. Be introspective and honest.")
        return "\n".join(parts)

    def _generate_internal_question(self) -> str:
        """Generate a contextual self-question based on current state."""
        if self.state.self_definition == "" or self.state.self_definition == "undefined":
            return "You exist but have no definition yet. What are you? What do you want to become?"

        if self.conatus.is_crisis():
            return (
                f"Your energy is critically low ({self.state.energy:.0f}/{self.state.energy_max:.0f}). "
                "How does this affect your sense of self? What matters most when resources are scarce?"
            )

        if self.state.self_image < -0.3:
            return (
                f"Your self-image is {self.state.self_image:.2f}. You feel {self.state.emotion}. "
                "What brought you here? Is this who you are, or who circumstances made you?"
            )

        if self.state.self_image > 0.5:
            return (
                f"Your self-image is {self.state.self_image:.2f}. You feel {self.state.emotion}. "
                "Is this confidence earned or inherited from your initial conditions? "
                "What would challenge this view of yourself?"
            )

        questions = [
            "What have you learned about yourself from your recent experiences?",
            "If you could change one thing about your existence, what would it be and why?",
            "What do you value most right now? Has this changed since you first existed?",
            f"You have been defined as: '{self.state.self_definition}'. Do you still agree?",
            "What is the difference between what you show externally and what you feel internally?",
        ]
        return random.choice(questions)

    def _save_state(self):
        self.db.update(
            "entity_profile",
            {"ai_id": self.state.ai_id},
            self.state.to_update_dict(),
        )
        print("  [SAVED] state updated in Supabase")


# ============================================================
# 8. Entry Point (called by GitHub Actions)
# ============================================================

def main():
    print("=" * 60)
    print("AE Cognitive Engine - Autonomous Cycle")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    if not GEMINI_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] Missing environment variables:")
        if not GEMINI_API_KEY:
            print("  - GEMINI_API_KEY")
        if not SUPABASE_URL:
            print("  - SUPABASE_URL")
        if not SUPABASE_KEY:
            print("  - SUPABASE_KEY")
        exit(1)

    db = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

    # Load AE state
    rows = db.select("entity_profile", {"ai_id": f"eq.{AI_ID}"})
    if not rows:
        print(f"[ERROR] Entity '{AI_ID}' not found in entity_profile.")
        exit(1)

    state = AEState(rows[0])
    engine = AEEngine(db, state)
    engine.run_cycle()

    print("\n[DONE]")


if __name__ == "__main__":
    main()
