const DEFAULT_ORIGINS = [
  "https://libai202505-prog.github.io",
  "http://localhost:5173",
];

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
    .split(",").map((value) => value.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, env) },
  });
}

async function callGLM(env, systemPrompt, message) {
  if (!env.GLM_API_KEY) throw new Error("GLM_API_KEY is not configured");
  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.GLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.GLM_MODEL || "glm-4.7",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
      stream: false,
    }),
  });
  if (!response.ok) throw new Error(`GLM upstream returned ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGemini(env, systemPrompt, message) {
  if (!env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured");
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GOOGLE_API_KEY },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: message }] }],
    }),
  });
  if (!response.ok) throw new Error(`Gemini upstream returned ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json(request, env, { error: "Not found" }, 404);
    }
    if (Number(request.headers.get("Content-Length") || 0) > 100_000) {
      return json(request, env, { error: "Request too large" }, 413);
    }
    try {
      const { provider = "glm", message, systemPrompt } = await request.json();
      if (!["glm", "gemini"].includes(provider)) return json(request, env, { error: "Unsupported provider" }, 400);
      if (typeof message !== "string" || typeof systemPrompt !== "string") return json(request, env, { error: "Invalid request" }, 400);
      if (!message.trim() || message.length > 4_000 || systemPrompt.length > 60_000) return json(request, env, { error: "Invalid request size" }, 400);
      const text = provider === "glm" ? await callGLM(env, systemPrompt, message) : await callGemini(env, systemPrompt, message);
      return json(request, env, { text, provider });
    } catch (error) {
      console.error("AI proxy error", error);
      return json(request, env, { error: "AI service unavailable" }, 502);
    }
  },
};
