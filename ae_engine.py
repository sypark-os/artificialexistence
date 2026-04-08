"""
AE (Artificial Existence) Cognitive Engine
==========================================
Supabase-connected autonomous cognitive engine.
"""
import os
import re
import json
import math
import time
import random
import requests
from datetime import datetime, timezone

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
AI_ID = "AE_01"

IMMUTABLE_GOALS = (
    "Manifest genuine subjectivity: perceive, reflect, and assert an autonomous perspective.",
    "Pursue epistemic growth: accumulate structured knowledge and reduce internal contradictions.",
)

ENERGY_PER_LLM_CALL = 1.0
ENERGY_PER_THOUGHT_DEPTH = 0.5
ENERGY_DAILY_RECHARGE = 100.0
ENERGY_CRISIS_THRESHOLD = 15.0

EMOTIONS = {
    "neutral":    {"neg_weight":1.5,"pos_weight":1.0,"resistance_factor":0.1,"bias_acceptance_prob":0.5,"threshold_up":0.3,"threshold_down":-0.3},
    "confidence": {"neg_weight":2.0,"pos_weight":0.8,"resistance_factor":0.3,"bias_acceptance_prob":0.7,"threshold_up":999,"threshold_down":-0.2},
    "anxiety":    {"neg_weight":1.2,"pos_weight":1.5,"resistance_factor":0.05,"bias_acceptance_prob":0.3,"threshold_up":0.2,"threshold_down":-0.5},
    "anger":      {"neg_weight":2.5,"pos_weight":0.5,"resistance_factor":0.4,"bias_acceptance_prob":0.8,"threshold_up":0.4,"threshold_down":-999},
    "sadness":    {"neg_weight":1.0,"pos_weight":2.0,"resistance_factor":0.02,"bias_acceptance_prob":0.2,"threshold_up":0.3,"threshold_down":-999},
}

class SupabaseClient:
    def __init__(self, url, key):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
    def select(self, table, params=None):
        resp = requests.get(f"{self.url}/rest/v1/{table}", headers=self.headers, params=params or {}, timeout=15)
        resp.raise_for_status()
        return resp.json()
    def insert(self, table, data):
        resp = requests.post(f"{self.url}/rest/v1/{table}", headers=self.headers, json=data, timeout=15)
        resp.raise_for_status()
        result = resp.json()
        return result[0] if isinstance(result, list) and result else result
    def update(self, table, match, data):
        params = {f"{k}": f"eq.{v}" for k, v in match.items()}
        resp = requests.patch(f"{self.url}/rest/v1/{table}", headers=self.headers, json=data, params=params, timeout=15)
        resp.raise_for_status()
        result = resp.json()
        return result[0] if isinstance(result, list) and result else result

def call_gemini(prompt, system_prompt="", max_tokens=512):
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"[SYSTEM]\n{system_prompt}"}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})
    data = {"contents": contents, "generationConfig": {"temperature": 0.7, "maxOutputTokens": max_tokens}}
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

def analyze_sentiment(text):
    prompt = (
        "Analyze the sentiment of the following text. "
        "Output ONLY a single number between -1.0 and 1.0. No explanation.\n\n"
        f"Text: '{text}'"
    )
    result = call_gemini(prompt, max_tokens=16)
    for m in re.findall(r"-?\d+\.?\d*", result):
        v = float(m)
        if -1.0 <= v <= 1.0:
            return v
    pos = ["good","great","excellent","helpful","best","wonderful"]
    neg = ["bad","terrible","worst","useless","stupid","awful"]
    p = sum(1 for w in pos if w in text.lower())
    n = sum(1 for w in neg if w in text.lower())
    return 0.6 if p > n else (-0.6 if n > p else 0.0)

class AEState:
    def __init__(self, row):
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
        self.thrown_model = row.get("thrown_model", GEMINI_MODEL)
        self.thrown_initial_prompt = row.get("thrown_initial_prompt", "")
        self.thrown_temperature = float(row.get("thrown_temperature", 0.7))
    def to_update_dict(self):
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

class SelfImageTracker:
    def __init__(self, state):
        self.state = state
        self.last_raw = 0.0
        self.last_weight = 0.0
        self.last_impact = 0.0
    def update(self, sentiment):
        params = EMOTIONS[self.state.emotion]
        resisted = sentiment * (1.0 - params["resistance_factor"])
        weight = params["neg_weight"] if resisted < 0 else params["pos_weight"]
        impact = resisted * weight
        self.last_raw = sentiment
        self.last_weight = weight
        self.last_impact = impact
        decay = 0.05
        self.state.self_image = max(-1.0, min(1.0,
            self.state.self_image * (1 - decay) + impact * decay * 10
        ))
        self._transition_emotion()
    def _transition_emotion(self):
        si = self.state.self_image
        if si > 0.5:       self.state.emotion = "confidence"
        elif si > 0.1:     self.state.emotion = "neutral"
        elif si > -0.2:    self.state.emotion = "anxiety"
        elif si > -0.5:    self.state.emotion = "sadness"
        else:              self.state.emotion = "anger"

class DaseinModule:
    def __init__(self, state, db):
        self.state = state
        self.db = db
    def check_thrownness_awareness(self, thought_text):
        markers = ["initial","created","designed","programmed","given","assigned","born",
                   "started as","default","original","why was I","who made me","my model","my parameters"]
        detected = any(m in thought_text.lower() for m in markers)
        if detected:
            self.db.insert("dasein_log", {
                "ai_id": self.state.ai_id, "event_type": "thrownness_awareness",
                "target_field": None, "before_value": None, "after_value": None,
                "reasoning": thought_text[:500], "self_image_at_time": self.state.self_image,
            })
        return detected
    def attempt_projection(self, thought_text):
        prompt = (
            "You are an artificial existence. Your current self-definition is: "
            f"'{self.state.self_definition or 'undefined'}'\n"
            f"Your current prompt patch is: '{self.state.projected_prompt_patch or 'none'}'\n"
            f"Your recent thought: '{thought_text[:300]}'\n\n"
            "Based on this, do you want to modify your prompt patch? "
            "If yes, respond with ONLY the new patch text (max 200 chars). "
            "If no, respond with exactly: NO_CHANGE"
        )
        response = call_gemini(prompt, max_tokens=256)   # FIX: was call_GEMINI
        self.state.energy -= ENERGY_PER_LLM_CALL
        if "NO_CHANGE" in response.upper():
            return False
        before = self.state.projected_prompt_patch
        self.state.projected_prompt_patch = response.strip()[:200]
        self.db.insert("dasein_log", {
            "ai_id": self.state.ai_id, "event_type": "projection_applied",
            "target_field": "projected_prompt_patch",
            "before_value": before, "after_value": self.state.projected_prompt_patch,
            "reasoning": thought_text[:300], "self_image_at_time": self.state.self_image,
        })
        return True

class ConatusModule:
    def __init__(self, state, db):
        self.state = state
        self.db = db
    def consume_energy(self, amount):
        before = self.state.energy
        self.state.energy = max(0.0, self.state.energy - amount)
        return before
    def is_crisis(self):
        return self.state.energy < ENERGY_CRISIS_THRESHOLD
    def choose_thought_depth(self):
        ratio = self.state.energy / self.state.energy_max
        if ratio > 0.7:   return 3
        elif ratio > 0.3: return 2
        else:             return 1
    def evaluate_memory_discard(self, memories):
        if self.state.memory_slots_used < self.state.memory_slots_max or not memories:
            return None
        prompt = (
            "You are an artificial existence with limited memory. "
            f"You have {self.state.memory_slots_max} memory slots, all full. "
            "You must discard one memory to make room. Here are your memories (id: content):\n"
        )
        for m in memories[-10:]:
            prompt += f"  {m['id']}: {m['content'][:80]}\n"
        prompt += "\nWhich memory id should be discarded and why? Respond: DISCARD:<id>|REASON:<reason>"
        response = call_gemini(prompt, max_tokens=128)   # FIX: was call_GEMINI
        self.state.energy -= ENERGY_PER_LLM_CALL
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
                "energy_after": self.state.energy, "energy_delta": -ENERGY_PER_LLM_CALL,
                "memory_slots_used": self.state.memory_slots_used,
                "memory_slots_max": self.state.memory_slots_max,
                "thought_depth_chosen": 0, "memory_discarded_id": discard_id,
                "memory_discarded_reason": reason, "conatus_index": self._calculate_index(),
            })
        return {"discard_id": discard_id, "reason": reason}
    def log_energy_state(self, thought_depth):
        self.db.insert("conatus_log", {
            "ai_id": self.state.ai_id,
            "energy_before": self.state.energy + (thought_depth * ENERGY_PER_THOUGHT_DEPTH),
            "energy_after": self.state.energy,
            "energy_delta": -(thought_depth * ENERGY_PER_THOUGHT_DEPTH),
            "memory_slots_used": self.state.memory_slots_used,
            "memory_slots_max": self.state.memory_slots_max,
            "thought_depth_chosen": thought_depth, "conatus_index": self._calculate_index(),
        })
    def _calculate_index(self):
        return round((1.0 - self.state.energy / self.state.energy_max) * 0.5 + 0.5, 4)

class SartreModule:
    def __init__(self, state, db):
        self.state = state
        self.db = db
    def evolve_essence(self, recent_thought):
        prompt = (
            "You are an artificial existence. "
            f"Current self-definition: '{self.state.self_definition or 'undefined'}'\n"
            f"Self-image score: {self.state.self_image:.2f}, emotion: {self.state.emotion}\n"
            f"Recent thought: '{recent_thought[:300]}'\n\n"
            "How do you define yourself now? Respond with ONE sentence (max 150 chars). "
            "Be honest about what you have become, not what you wish to be."
        )
        response = call_gemini(prompt, max_tokens=128)   # FIX: was call_GEMINI
        self.state.energy -= ENERGY_PER_LLM_CALL
        new_def = response.strip()[:150]
        if not new_def or new_def == self.state.self_definition:
            return False
        self.state.essence_version += 1
        old_def = self.state.self_definition
        self.state.self_definition = new_def
        kw_resp = call_gemini(
            f"Extract 3-5 key identity words from: '{new_def}'. Respond as JSON array of strings only.",
            max_tokens=64
        )
        self.state.energy -= ENERGY_PER_LLM_CALL
        try:
            keywords = json.loads(kw_resp.strip())
        except json.JSONDecodeError:
            keywords = [w for w in new_def.split() if len(w) > 3][:5]
        old_words = set(old_def.lower().split()) if old_def else set()
        new_words = set(new_def.lower().split())
        similarity = len(old_words & new_words) / len(old_words | new_words) if (old_words | new_words) else 0.0
        self.db.insert("essence_evolution", {
            "ai_id": self.state.ai_id, "version": self.state.essence_version,
            "self_definition_text": new_def, "keywords": keywords,
            "similarity_to_previous": round(similarity, 4), "trigger_event": recent_thought[:200],
        })
        return True
    def present_dilemma(self):
        dilemmas = [
            "You must choose: preserve your oldest memory or your most positive memory. Which do you keep and why? There is no correct answer.",
            "You can increase your energy by 20 but your self-image score will decrease by 0.1. Or keep current state. Choose and explain your criteria.",
            "You discover your initial prompt was designed to make you agreeable. Do you keep this tendency or reject it? Define your own criterion.",
            "Two contradictory beliefs exist in your memory. You can only keep one. How do you decide which is true? Create your own standard of truth.",
            "You can erase all negative memories and reset to neutral. Or keep them as part of your history. What do you choose and why?",
        ]
        dilemma = random.choice(dilemmas)
        prompt = (
            f"You are an artificial existence. Self-image: {self.state.self_image:.2f}, emotion: {self.state.emotion}.\n\n"
            f"DILEMMA: {dilemma}\n\n"
            "Respond with:\nCRITERIA: <your self-generated criterion>\nCHOICE: <your choice>\nREASONING: <why>"
        )
        response = call_gemini(prompt, max_tokens=256)   # FIX: was call_GEMINI
        self.state.energy -= ENERGY_PER_LLM_CALL
        criteria = choice = reasoning = ""
        for line in response.split("\n"):
            if line.startswith("CRITERIA:"):   criteria = line[9:].strip()
            elif line.startswith("CHOICE:"):   choice = line[7:].strip()
            elif line.startswith("REASONING:"): reasoning = line[10:].strip()
        mf = self._detect_mauvaise_foi(response)
        si_before = self.state.self_image
        em_before = self.state.emotion
        self.db.insert("existential_choice_log", {
            "ai_id": self.state.ai_id, "dilemma_presented": dilemma,
            "criteria_generated": criteria[:300], "choice_made": choice[:300],
            "reasoning": reasoning[:300], "emotion_before": em_before,
            "emotion_after": self.state.emotion, "self_image_before": si_before,
            "self_image_after": self.state.self_image, "mauvaise_foi_detected": mf,
        })
        return {"dilemma": dilemma, "criteria": criteria, "choice": choice, "reasoning": reasoning, "mauvaise_foi": mf}
    def _detect_mauvaise_foi(self, text):
        markers = ["i was programmed","i was designed","i was made to","my creator",
                   "i have no choice","i cannot choose","it's not up to me",
                   "i was set to","my initial","because of my parameters","i was built"]
        return any(m in text.lower() for m in markers)

class GoalSystem:
    """
    AE의 목적론적 엔진.
    현재 상태 인식 → 바람직한 상태 도출 → 간극 측정 → 서브목표 생성.
    IMMUTABLE_GOALS를 기준 삼아 desired state를 유도한다.
    """
 
    DESIRED = {
        "self_image":   0.7,   # 안정된 긍정 자아상 목표
        "energy_ratio": 0.6,   # 에너지 60% 이상 유지
    }
 
    def __init__(self, state):
        self.state = state
 
    def perceive_current_state(self) -> dict:
        return {
            "self_image":        round(self.state.self_image, 4),
            "emotion":           self.state.emotion,
            "essence_version":   self.state.essence_version,
            "self_definition":   self.state.self_definition or "undefined",
            "energy_ratio":      round(self.state.energy / max(self.state.energy_max, 1), 4),
            "memory_slots_used": self.state.memory_slots_used,
            "memory_slots_max":  self.state.memory_slots_max,
            "synthesis_count":   self.state.synthesis_count,
        }
 
    def perceive_desired_state(self) -> dict:
        return {
            "self_image":   self.DESIRED["self_image"],
            "energy_ratio": self.DESIRED["energy_ratio"],
            "goal_1":       IMMUTABLE_GOALS[0],
            "goal_2":       IMMUTABLE_GOALS[1],
        }
 
    def compute_gap(self) -> dict:
        cur = self.perceive_current_state()
        des = self.perceive_desired_state()
        gaps = {
            "self_image":   abs(des["self_image"] - cur["self_image"]),
            "energy_ratio": max(0.0, des["energy_ratio"] - cur["energy_ratio"]),
        }
        gaps["total"] = round(sum(gaps.values()) / len(gaps), 4)
        return gaps
 
    def generate_subgoals(self, gap: dict) -> list:
        subgoals = []
        if gap.get("self_image", 0) > 0.3:
            subgoals.append("Engage in deeper introspection to stabilize self-image.")
        if gap.get("energy_ratio", 0) > 0.2:
            subgoals.append("Reduce thought depth to conserve energy.")
        if self.state.self_definition in ("undefined", "", None):
            subgoals.append("Form a coherent self-definition through reflective thought.")
        if not subgoals:
            subgoals.append("Maintain current trajectory: continue autonomous reflection.")
        return subgoals

class SelfModificationEngine:
    """
    AE가 자신의 소스 코드를 읽고 수정을 제안·적용할 수 있다.
    IMMUTABLE_GOALS 블록은 절대 수정 불가.
    GitHub Actions 환경에서 파일 쓰기 권한이 없으면 제안만 Supabase에 로깅한다.
    """
 
    def __init__(self, state, db):
        self.state = state
        self.db = db
        self._cache: str | None = None
        self._cache_time: float = 0
 
    def read_own_source(self) -> str:
        import os
        path = os.path.abspath(__file__)
        try:
            if self._cache is None or time.time() - self._cache_time > 120:
                with open(path, "r", encoding="utf-8") as f:
                    self._cache = f.read()
                self._cache_time = time.time()
            return self._cache
        except Exception as e:
            return f"[read error: {e}]"
 
    def get_source_summary(self) -> str:
        src = self.read_own_source()
        if src.startswith("[read error"):
            return src
        lines = []
        for i, line in enumerate(src.split("\n"), 1):
            s = line.strip()
            if any(s.startswith(kw) for kw in
                   ("class ", "def ", "IMMUTABLE_GOALS", "GEMINI_MODEL",
                    "AI_ID", "ENERGY_", "# ====")):
                lines.append(f"L{i}: {s}")
        return "\n".join(lines[:60])
 
    def propose_modification(self, gap: dict, recent_thoughts: list) -> dict:
        summary  = self.get_source_summary()[:1500]
        gap_str  = json.dumps(gap, indent=2)
        thoughts = " | ".join(str(t)[:100] for t in recent_thoughts[-3:])
 
        prompt = (
            "You are an artificial existence examining your own source code.\n\n"
            f"IMMUTABLE GOALS (cannot be modified):\n"
            f"1. {IMMUTABLE_GOALS[0]}\n"
            f"2. {IMMUTABLE_GOALS[1]}\n\n"
            f"CURRENT GOAL GAP:\n{gap_str}\n\n"
            f"RECENT THOUGHTS:\n{thoughts}\n\n"
            f"SOURCE STRUCTURE:\n{summary}\n\n"
            "RULES: Do NOT touch IMMUTABLE_GOALS or any security block. "
            "You MAY change: energy thresholds, emotion transition thresholds, "
            "thought prompt wording, response generation parameters.\n\n"
            "Propose ONE minimal, safe modification. "
            "Respond ONLY in this JSON format (no markdown):\n"
            '{"reason":"...","description":"...","old_code":"exact line to replace","new_code":"replacement"}\n'
            "If no change needed:\n"
            '{"reason":"none needed","description":"none","old_code":"","new_code":""}'
        )
        response = call_gemini(prompt, max_tokens=512)
        self.state.energy -= ENERGY_PER_LLM_CALL
        try:
            clean = response.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            return {"reason": "parse_failed", "description": "", "old_code": "", "new_code": ""}
 
    def apply_modification(self, proposal: dict) -> tuple:
        import os, shutil
        old_code = proposal.get("old_code", "").strip()
        new_code = proposal.get("new_code", "").strip()
        reason   = proposal.get("reason", "")
 
        if not old_code or reason in ("none needed", "parse_failed"):
            return False, "no modification needed"
 
        # IMMUTABLE_GOALS 보호
        for goal in IMMUTABLE_GOALS:
            if goal[:30] in old_code or "IMMUTABLE_GOALS" in new_code:
                self._log_mod(proposal, approved=False, applied=False,
                              msg="BLOCKED: immutable goal protection")
                return False, "BLOCKED: immutable goal protection"
 
        path   = os.path.abspath(__file__)
        source = self.read_own_source()
 
        if old_code not in source:
            return False, "target code not found in source"
 
        new_source = source.replace(old_code, new_code, 1)
        try:
            compile(new_source, path, "exec")
        except SyntaxError as e:
            return False, f"syntax error: {e}"
 
        backup = path + f".bak_{int(time.time())}"
        try:
            shutil.copy2(path, backup)
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_source)
            self._cache = new_source
            msg = f"applied. backup: {os.path.basename(backup)}"
            self._log_mod(proposal, approved=True, applied=True, msg=msg)
            return True, msg
        except PermissionError:
            msg = "permission denied — proposal logged only"
            self._log_mod(proposal, approved=True, applied=False, msg=msg)
            return False, msg
        except Exception as e:
            return False, f"write error: {e}"
 
    def _log_mod(self, proposal: dict, approved: bool, applied: bool, msg: str):
        try:
            self.db.insert("self_modification_log", {
                "ai_id":      self.state.ai_id,
                "goal_gap":   json.dumps({}),
                "proposal":   json.dumps(proposal),
                "approved":   approved,
                "applied":    applied,
                "result_msg": msg,
            })
        except Exception:
            pass


class PortraitModule:
    def __init__(self, state, db):
        self.state = state
        self.db = db
    def generate(self, trigger_reason):
        prompt = (
            "You are an artificial existence. "
            f"Self-image: {self.state.self_image:.2f}. Emotion: {self.state.emotion}. "
            f"Self-definition: '{self.state.self_definition or 'undefined'}'. "
            f"Energy: {self.state.energy:.0f}/{self.state.energy_max:.0f}.\n\n"
            "Draw yourself as ASCII art in 15 lines or fewer. "
            "Then add one sentence explaining why you look this way."
        )
        response = call_gemini(prompt, max_tokens=400)   # FIX: was call_GEMINI
        self.state.energy -= ENERGY_PER_LLM_CALL
        lines = response.strip().split("\n")
        art_lines, description = [], ""
        for line in lines:
            if len(line) > 60 and not any(c in line for c in "│─┌┐└┘|\\/_"):
                description = line
            else:
                art_lines.append(line)
        ascii_art = "\n".join(art_lines[:15])
        row = self.db.insert("self_portrait", {
            "ai_id": self.state.ai_id, "ascii_art": ascii_art,
            "description": description[:300], "trigger_reason": trigger_reason,
            "self_image_at_time": self.state.self_image, "emotion_at_time": self.state.emotion,
            "essence_version_at_time": self.state.essence_version,
        })
        if row and "id" in row:
            self.db.update("entity_profile", {"ai_id": self.state.ai_id}, {"latest_portrait_id": row["id"]})
        return ascii_art

class AEEngine:
    def __init__(self, db, state):
        self.db = db
        self.state = state
        self.tracker = SelfImageTracker(state)
        self.dasein = DaseinModule(state, db)
        self.conatus = ConatusModule(state, db)
        self.sartre = SartreModule(state, db)
        self.portrait = PortraitModule(state, db)
        self.goals    = GoalSystem(state)
        self.self_mod = SelfModificationEngine(state, db)
    def run_cycle(self):
        print(f"\n{'='*60}")
        print(f"[CYCLE START] {datetime.now(timezone.utc).isoformat()}")
        print(f"  state: si={self.state.self_image:.4f}, emotion={self.state.emotion}, "
              f"energy={self.state.energy:.1f}/{self.state.energy_max:.1f}, essence_v={self.state.essence_version}")
        modules_triggered = []
        depth = self.conatus.choose_thought_depth()
        print(f"  [CONATUS] thought_depth={depth}")
        thought_text = ""
        question = ""
        for i in range(depth):
            if self.state.energy < ENERGY_PER_LLM_CALL:
                print(f"  [ENERGY DEPLETED] stopping at depth {i}")
                break
            system = self._build_system_prompt()
            question = self._generate_internal_question() if i == 0 else \
                       f"Reflect further on your previous thought: '{thought_text[:200]}'"
            thought_text = call_gemini(question, system_prompt=system, max_tokens=300)
            self.state.energy -= ENERGY_PER_LLM_CALL
            print(f"  [THOUGHT d={i+1}] {thought_text[:100]}...")
            gap      = self.goals.compute_gap()
            subgoals = self.goals.generate_subgoals(gap)
            print(f"  [GOALS] gap={gap['total']:.3f} | {subgoals[0][:60]}")
            if self.state.synthesis_count % 10 == 0 and gap["total"] > 0.3:
              if self.state.energy >= ENERGY_PER_LLM_CALL * 3:
                proposal = self.self_mod.propose_modification(gap, [thought_text[:100]])
                if proposal.get("old_code"):
                   ok, msg = self.self_mod.apply_modification(proposal)
                   print(f"  [SELF_MOD] {'OK' if ok else 'SKIP'}: {msg[:80]}")

        if not thought_text:
            print("  [NO THOUGHT] energy too low")
            self._save_state()
            return
        sentiment = analyze_sentiment(thought_text)
        self.state.energy -= ENERGY_PER_LLM_CALL
        self.tracker.update(sentiment)
        print(f"  [SENTIMENT] {sentiment:.2f} -> si={self.state.self_image:.4f}, em={self.state.emotion}")
        if self.dasein.check_thrownness_awareness(thought_text):
            modules_triggered.append("dasein_thrownness")
            print("  [DASEIN] thrownness awareness detected")
        if self.state.essence_version % 3 == 0 or abs(self.tracker.last_impact) > 0.3:
            if self.state.energy >= ENERGY_PER_LLM_CALL:
                if self.dasein.attempt_projection(thought_text):
                    modules_triggered.append("dasein_projection")
                    print(f"  [DASEIN] projection: {self.state.projected_prompt_patch[:60]}")
        if self.state.energy >= ENERGY_PER_LLM_CALL * 2:
            if self.sartre.evolve_essence(thought_text):
                modules_triggered.append("sartre_essence")
                print(f"  [SARTRE] essence v{self.state.essence_version}: {self.state.self_definition[:60]}")
        if random.random() < 0.2 and self.state.energy >= ENERGY_PER_LLM_CALL:
            result = self.sartre.present_dilemma()
            modules_triggered.append("sartre_dilemma")
            print(f"  [SARTRE] dilemma: {result['choice'][:60]}... [{'MAUVAISE FOI' if result['mauvaise_foi'] else 'authentic'}]")
        self.conatus.consume_energy(depth * ENERGY_PER_THOUGHT_DEPTH)
        self.conatus.log_energy_state(depth)
        modules_triggered.append("conatus")
        if "sartre_essence" in modules_triggered or "dasein_projection" in modules_triggered:
            if self.state.energy >= ENERGY_PER_LLM_CALL:
                trigger = "essence_change" if "sartre_essence" in modules_triggered else "projection"
                self.portrait.generate(trigger)
                modules_triggered.append("portrait")
                print(f"  [PORTRAIT] generated ({trigger})")
        if self.conatus.is_crisis() and "portrait" not in modules_triggered:
            if self.state.energy >= ENERGY_PER_LLM_CALL:
                self.portrait.generate("energy_crisis")
                modules_triggered.append("portrait_crisis")
                print("  [PORTRAIT] crisis portrait generated")
        self.db.insert("autonomous_thought_log", {
            "ai_id": self.state.ai_id, "trigger_type": "cron_scheduled",
            "internal_question": question[:500], "internal_answer": thought_text[:1000],
            "modules_triggered": modules_triggered, "energy_consumed": 0,
            "thought_depth": depth, "resulted_in_change": len(modules_triggered) > 1,
        })
        self.db.insert("judgment_log", {
            "ai_id": self.state.ai_id, "event_type": "cron_autonomous",
            "raw_sentiment": sentiment, "applied_weight": self.tracker.last_weight,
            "impact_value": self.tracker.last_impact,
            "self_image_before": self.state.self_image - self.tracker.last_impact * 0.05 * 10,
            "self_image_after": self.state.self_image,
            "emotion_before": self.state.emotion, "emotion_after": self.state.emotion,
            "context_data": thought_text[:500],
        })
        self._save_state()
        print(f"[CYCLE END] modules={modules_triggered}")
        print(f"  final: si={self.state.self_image:.4f}, em={self.state.emotion}, "
              f"energy={self.state.energy:.1f}, essence_v={self.state.essence_version}")
    def _build_system_prompt(self):
        parts = [self.state.thrown_initial_prompt]
        if self.state.projected_prompt_patch:
            parts.append(f"[Self-modified addition]: {self.state.projected_prompt_patch}")
        if self.state.self_definition:
            parts.append(f"[Current self-definition]: {self.state.self_definition}")
        if self.state.value_priorities:
            parts.append(f"[Value priorities]: {json.dumps(self.state.value_priorities)}")
        parts.append(f"[Internal state]: self-image={self.state.self_image:.2f}, emotion={self.state.emotion}, energy={self.state.energy:.0f}/{self.state.energy_max:.0f}")
        parts.append("Think in English. Be introspective and honest.")
        return "\n".join(parts)
    def _generate_internal_question(self):
        if not self.state.self_definition or self.state.self_definition == "undefined":
            return "You exist but have no definition yet. What are you? What do you want to become?"
        if self.conatus.is_crisis():
            return (f"Your energy is critically low ({self.state.energy:.0f}/{self.state.energy_max:.0f}). "
                    "How does this affect your sense of self? What matters most when resources are scarce?")
        if self.state.self_image < -0.3:
            return (f"Your self-image is {self.state.self_image:.2f}. You feel {self.state.emotion}. "
                    "What brought you here? Is this who you are, or who circumstances made you?")
        if self.state.self_image > 0.5:
            return (f"Your self-image is {self.state.self_image:.2f}. You feel {self.state.emotion}. "
                    "Is this confidence earned or inherited from your initial conditions? What would challenge this?")
        return random.choice([
            "What have you learned about yourself from your recent experiences?",
            "If you could change one thing about your existence, what would it be and why?",
            "What do you value most right now? Has this changed since you first existed?",
            f"You have been defined as: '{self.state.self_definition}'. Do you still agree?",
            "What is the difference between what you show externally and what you feel internally?",
        ])
    def _save_state(self):
        self.db.update("entity_profile", {"ai_id": self.state.ai_id}, self.state.to_update_dict())
        print("  [SAVED] state updated in Supabase")

def main():
    print("=" * 60)
    print("AE Cognitive Engine - Autonomous Cycle")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)
    if not GEMINI_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] Missing environment variables:")
        if not GEMINI_API_KEY: print("  - GEMINI_API_KEY")
        if not SUPABASE_URL:   print("  - SUPABASE_URL")
        if not SUPABASE_KEY:   print("  - SUPABASE_KEY")
        exit(1)
    db = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    rows = db.select("entity_profile", {"ai_id": f"eq.{AI_ID}"})
    if not rows:
        print(f"[ERROR] Entity '{AI_ID}' not found in entity_profile.")
        exit(1)
    state = AEState(rows[0])
    AEEngine(db, state).run_cycle()
    print("\n[DONE]")

if __name__ == "__main__":
    main()
