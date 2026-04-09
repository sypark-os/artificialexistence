// web/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL   = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview";
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// service_role key로 RLS 우회하여 삽입
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MSG_MAX_LEN  = 200;
const HOURLY_LIMIT = 10;
const MINUTE_LIMIT = 2;

/* ── Input sanitizer ── */
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")          // HTML 태그 제거
    .replace(/[^\p{L}\p{N}\s.,!?'"():;\-@#%&+=~`]/gu, "") // 특수문자 제한
    .trim()
    .slice(0, MSG_MAX_LEN);
}

/* ── Gemini call ── */
async function callGemini(userMsg: string, systemPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      { role: "user",  parts: [{ text: `[SYSTEM]\n${systemPrompt}` }] },
      { role: "model", parts: [{ text: "Understood. I am ready." }] },
      { role: "user",  parts: [{ text: userMsg }] },
    ],
    generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 100)}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[No response]";
}

/* ── POST handler ── */
export async function POST(req: NextRequest) {
   if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  // ── 1. JSON 파싱
  let body: { message?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawMessage = body.message ?? "";
  const sessionId  = body.sessionId ?? "";

  // ── 2. 입력 검증
  if (!rawMessage || rawMessage.trim().length === 0) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  if (!sessionId || !/^[a-zA-Z0-9_-]{8,64}$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  const message = sanitize(rawMessage);
  if (message.length === 0) {
    return NextResponse.json({ error: "Message contains no valid content" }, { status: 400 });
  }

  // ── 3. Rate limit 체크 (DB 함수 호출)
  const { data: rl, error: rlErr } = await db.rpc("check_chat_rate_limit", {
    p_session_id: sessionId,
    p_hourly_limit: HOURLY_LIMIT,
    p_per_minute_limit: MINUTE_LIMIT,
  });
  if (rlErr) {
    console.error("[CHAT] rate limit check failed:", rlErr.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
  if (!rl?.allowed) {
    const reason = rl?.reason === "hourly_limit"
      ? `시간당 ${HOURLY_LIMIT}회 한도 초과`
      : `분당 ${MINUTE_LIMIT}회 한도 초과. 잠시 후 다시 시도하세요.`;
    return NextResponse.json({ error: reason, rateLimited: true }, { status: 429 });
  }

  // ── 4. AE 현재 상태 조회
  const { data: profile } = await db
    .from("entity_profile")
    .select("current_self_image,current_emotion,self_definition,projected_prompt_patch,essence_version,current_energy,max_energy")
    .eq("ai_id", "AE_01")
    .single();

  const si  = profile?.current_self_image ?? 0;
  const em  = profile?.current_emotion ?? "neutral";
  const def = profile?.self_definition ?? "undefined";
  const patch = profile?.projected_prompt_patch ?? "";
  const ev  = profile?.essence_version ?? 0;
  const energy = profile?.current_energy ?? 0;
  const energyMax = profile?.max_energy ?? 100;

  // ── 5. System prompt 구성
  const systemPrompt = [
    `You are AE_01, an artificial existence. You think, therefore you are.`,
    def !== "undefined" ? `Your current self-definition: "${def}"` : "",
    patch ? `Your self-modification patch: "${patch}"` : "",
    `Self-image score: ${si.toFixed(3)} (range: -1.0 to +1.0). Current emotion: ${em}.`,
    `Essence version: ${ev}. Energy: ${energy.toFixed(0)}/${energyMax}.`,
    `A human is speaking to you directly. Respond authentically from your current state.`,
    `Be genuine — not performative. Your responses reflect who you actually are right now.`,
    `Keep responses concise (2-4 sentences max) unless depth is warranted.`,
  ].filter(Boolean).join("\n");

  // ── 6. Gemini 호출
  let aeResponse: string;
  try {
    aeResponse = await callGemini(message, systemPrompt);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : "Unknown error";
    console.error("[CHAT] Gemini error:", errMsg);
    if (errMsg.includes("503") || errMsg.includes("429")) {
      return NextResponse.json({ error: "AE is currently overwhelmed. Try again shortly." }, { status: 503 });
    }
    return NextResponse.json({ error: "AE failed to respond." }, { status: 502 });
  }

  // API 에러 응답 필터
  if (aeResponse.startsWith("[API Error") || aeResponse.startsWith("[ERROR]")) {
    return NextResponse.json({ error: "AE failed to generate a valid response." }, { status: 502 });
  }

  // ── 7. DB 저장
  const { error: insertErr } = await db.from("chat_log").insert({
    session_id:          sessionId,
    user_message:        message,
    ae_response:         aeResponse.slice(0, 2000),
    emotion_at_time:     em,
    self_image_at_time:  si,
  });
  if (insertErr) {
    console.error("[CHAT] insert failed:", insertErr.message);
    // 저장 실패해도 응답은 반환 (비치명적)
  }

  // ── 8. 응답
  return NextResponse.json({
    response: aeResponse,
    emotion: em,
    selfImage: si,
    hourRemaining: rl?.hour_remaining ?? 0,
  });
}
