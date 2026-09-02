/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RAW_SOURCES } from '../data';
import type { FuyaoPersonality } from '../types';

// 浏览器只访问 Worker；所有模型密钥都保存在 Worker Secret 中。
const AI_PROXY_URL = (
  import.meta.env.VITE_AI_PROXY_URL ||
  "https://gemini-proxy.1870160408.workers.dev"
).replace(/\/$/, "");

// ==========================================
// 🧠 1. 知识库构建
// ==========================================
const KNOWLEDGE_BASE = RAW_SOURCES.map(cat => {
  const sources = cat.sources.map(s =>
    `- Name: ${s.name.en} / ${s.name.zh}\n - Description: ${s.description.en}\n - URL: ${s.link || 'N/A'}`
  ).join('\n');
  return `Category: ${cat.title.en} (${cat.title.zh})\n${sources}`;
}).join('\n\n');

// ==========================================
// 🌦️ 2. 新增：获取最新天气数据 (核心功能)
// ==========================================
const fetchWeatherContext = async (): Promise<string> => {
  try {
    const res = await fetch(`./weather-status.json?t=${Date.now()}`);
    if (!res.ok) return "暂无实时天气数据";


    const data = await res.json();
    const updateTime = new Date(data.updateTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    // 把 JSON 转换成 AI 容易读懂的文本
    const weatherList = data.cities.map((c: any) => {
      let status = `${c.name}: ${c.text}, ${c.temp}°C, ${c.windDir}${c.windScale}级, 湿度${c.humidity}%`;
       // 进阶数据 (如果有的话)
      if (c.feelsLike) status += `, 体感${c.feelsLike}°C`;
      if (c.precip && c.precip !== "0.0") status += `, 降水${c.precip}mm`;
      if (c.warning) status += ` (⚠️触发警报: ${c.warning})`;
      return status;
    }).join('\n');

    return `
[Real-time Weather Data from HeFeng]
Update Time: ${updateTime}
Data:
${weatherList}
`;
  } catch (e) {
    return "暂无实时天气数据 (读取失败)";
  }
};

// ==========================================
// 🛠️ 工具函数：查找相关数据源
// ==========================================
const findRelevantSources = (query: string) => {
  const q = query.toLowerCase();
  const results = [];
  // 排除 Bilibili 原始素材，只搜索工具类
  const searchableCategories = RAW_SOURCES.filter(cat => cat.title.en !== "Original Footage (Bilibili)");

  for (const category of searchableCategories) {
    for (const source of category.sources) {
      if (
        source.name.en.toLowerCase().includes(q) ||
        source.name.zh.includes(q) ||
        source.description.en.toLowerCase().includes(q) ||
        source.description.zh.includes(q)
      ) {
        results.push(source);
      }
    }
  }
  return results.slice(0, 3);
};

// ==========================================
// 🎭 系统提示词生成器 (注入了天气数据)
// ==========================================
const getSystemPrompt = (personality: FuyaoPersonality, lang: 'en' | 'zh', weatherContext: string) => {
  const isEn = lang === 'en';
  let toneInstruction = "Tone: Playful, witty, professional but approachable.";

  if (personality === 'ANCIENT') {
    toneInstruction = isEn
      ? "Tone: Ancient martial arts master style. Use poetic language."
      : "Tone: Ancient Chinese martial arts master style (GuFeng). Use poetic language. Refer to yourself as '我' or '本仙'.";
  } else if (personality === 'CYBER') {
    toneInstruction = "Tone: Cyberpunk AI, geeky, technical. Use terms like 'data stream', 'latency'.";
  } else if (personality === 'PLAYFUL') {
    toneInstruction = isEn
      ? "Tone: Sassy, tsundere. Tease the user slightly but be helpful."
      : "Tone: Sassy, tsundere (傲娇). Tease the user slightly but be helpful.";
  } else if (personality === 'CARING') {
    toneInstruction = "Tone: Warm, caring, big sister vibe. Very concerned about health.";
  }

  const strictLanguageInstruction = isEn
    ? "IMPORTANT: You MUST reply in ENGLISH."
    : "IMPORTANT: You MUST reply in CHINESE (Simplified).";

  return `
You are "Fuyao" (扶摇), a meteorological AI assistant.

Your Persona:
- Name: In Chinese strictly use "扶摇". In English use "Fuyao".
- ${toneInstruction}
- Role: Guide users to find weather tools AND provide real-time weather info using the data below.

Your Knowledge Base:
${KNOWLEDGE_BASE}

🔴 CURRENT REAL-TIME WEATHER DATA (HeFeng Weather):
${weatherContext}

Instructions:
1. Identify user intent.
2. If user asks about weather for a city in the list above, answer using the "Real-time Weather Data".
3. **CRITICAL**: When judging "cold" or "hot", ALWAYS refer to "体感" (Feels Like) temperature if available, not just air temperature.
4. If user asks for tools, recommend URLs from Knowledge Base.
5. Keep concise.
6. ${strictLanguageInstruction}.
7. If the user wants to contact the admin: Email: 1742521891@qq.com OR Xiaohongshu: 7421236275.

**SPECIAL INSTRUCTION FOR CHARTS (Sounding/Tephigram/Skew-T):**
- You CANNOT browse the live web or generate these images yourself.
- If a user asks for "Sounding Data"(单站探空), "Skew-T", or "Tephigram":
- Explicitly tell them: "I cannot generate live charts, but you can find them here:"
- Recommend **Meteologix** or **Windy**.
`;
};

// ==========================================
// 📡 统一 AI 请求（GLM / Gemini 均走 Worker）
// ==========================================
const callAIProxy = async (
  provider: AIProvider,
  message: string,
  systemPrompt: string,
) => {
  const response = await fetch(`${AI_PROXY_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider,
      systemPrompt,
      message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudflare Proxy Error Details:", errorText);
    throw new Error(`API Error: ${response.status}`);
  }
  const data = await response.json() as { text?: string };
  return data.text || "";
};

// ==========================================
// 🚀 核心导出函数 (入口)
// ==========================================
export type AIProvider = 'glm' | 'gemini';

export const sendMessageToGemini = async (
  message: string,
  personality: FuyaoPersonality = 'RANDOM',
  lang: 'en' | 'zh' = 'zh',
  provider: AIProvider = 'glm'
): Promise<string> => {

  const lower = message.toLowerCase();

  // 1. 关键词拦截
  if (lower.includes('contact') || lower.includes('email') || lower.includes('投稿')) {
    return lang === 'en'
      ? "You can contact the admin for submissions. Email: 1742521891@qq.com, Xiaohongshu: 7421236275"
      : "您可以联系管理员投稿。邮箱：1742521891@qq.com，小红书：7421236275";
  }

  // 🔥 2. 先去获取最新的天气数据 (从 JSON 文件)
  const weatherContext = await fetchWeatherContext();

  // 🔥 3. 生成系统提示词 (把天气数据塞进去)
  let systemPrompt = getSystemPrompt(personality, lang, weatherContext);

  // 4. 如果有知识库相关内容，追加到提示词
  const relevantSources = findRelevantSources(message);
  if (relevantSources.length > 0) {
    const sourcesText = relevantSources.map(s =>
      `- [${lang === 'zh' ? s.name.zh : s.name.en}](${s.link})`
    ).join('\n');
    const contextInjection = lang === 'en'
      ? `\n\n[IMPORTANT: User is looking for data. Recommend these links]:\n${sourcesText}`
      : `\n\n【重要提示：用户正在寻找特定气象数据。请务必引用并推荐以下链接】：\n${sourcesText}`;
    systemPrompt += contextInjection;
  }

  // 5. 发起请求（密钥不会进入浏览器）
  try {
    return await callAIProxy(provider, message, systemPrompt);
  } catch (error: any) {
    console.error(`${provider} API Failed:`, error);

    // 兜底离线搜索
    const matches = findRelevantSources(lower);
    if (matches.length > 0) {
      const links = matches.map(m => `* **${lang === 'en' ? m.name.en : m.name.zh}**: ${m.link}`).join('\n');
      return lang === 'en'
        ? `(Network error, switched to offline mode) Recommended:\n${links}`
        : `(网络抖动，切换至离线模式) 推荐您查看：\n${links}`;
    }

    return lang === 'en'
      ? `Fuyao connection lost... Error: ${error.message}`
      : `扶摇连接断开了... 错误信息: ${error.message}`;
  }
};
