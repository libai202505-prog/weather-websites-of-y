/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RAW_SOURCES } from '../data';
import type { FuyaoPersonality } from '../types';

const SILICON_KEY_PART_1 = "sk-";
const SILICON_KEY_PART_2 = "lpsogwjfzwokzdjdllzyitlqxxjqhzhgbcxywvwxqvbcbbzd"; // 
const SILICON_API_KEY = SILICON_KEY_P1 + SILICON_KEY_P2;
const SILICON_BASE_URL = "https://api.siliconflow.cn/v1/chat/completions";

// 2. 知识库构建 (保持不变)
const KNOWLEDGE_BASE = RAW_SOURCES.map(cat => {
  const sources = cat.sources.map(s => 
    `- Name: ${s.name.en} / ${s.name.zh}
     - Description: ${s.description.en}
     - URL: ${s.link || 'N/A'}`
  ).join('\n');
  return `Category: ${cat.title.en} (${cat.title.zh})\n${sources}`;
}).join('\n\n');

const getSystemPrompt = (personality: FuyaoPersonality) => {
  let toneInstruction = "Tone: Playful, witty.";
  if (personality === 'ANCIENT') toneInstruction = "Tone: Ancient Chinese style. Use '本仙'.";
  if (personality === 'CYBER') toneInstruction = "Tone: Cyberpunk AI, geeky.";
  if (personality === 'PLAYFUL') toneInstruction = "Tone: Sassy, tsundere.";
  if (personality === 'CARING') toneInstruction = "Tone: Warm, big sister vibe.";

  return `
    You are "Fuyao" (扶摇), a meteorological AI assistant.
    Your Persona:
    - Name: Strictly use "扶摇".
    - ${toneInstruction}
    - Role: Guide users to find weather tools.
    Your Knowledge Base:
    ${KNOWLEDGE_BASE}
    Instructions:
    Identify user intent and recommend tools with URLs.
  `;
};

// 3. 通道 A: 呼叫 Vercel 后端 (Google)
const callVercelGoogle = async (message: string, systemPrompt: string) => {
  // 👇 这里直接 fetch 本地后端的地址，不需要 import GoogleGenAI
  const response = await fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, systemPrompt })
  });

  if (!response.ok) throw new Error("Vercel Backend Unreachable");
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// 4. 通道 B: 直连硅基流动 (DeepSeek)
const callSiliconFlow = async (message: string, systemPrompt: string) => {
  console.log("切换 DeepSeek 直连...");
  if (!SILICON_KEY_P2 || SILICON_KEY_P2.includes('xxxx')) throw new Error("DeepSeek Key Missing");

  const response = await fetch(SILICON_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SILICON_API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`DeepSeek Error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// 5. 离线兜底
const findRelevantSources = (query: string) => {
  const q = query.toLowerCase();
  const results = [];
  const searchableCategories = RAW_SOURCES.filter(cat => cat.title.en !== "Original Footage (Bilibili)");
  for (const category of searchableCategories) {
    for (const source of category.sources) {
      if (source.name.en.toLowerCase().includes(q) || source.name.zh.includes(q)) {
        results.push(source);
      }
    }
  }
  return results.slice(0, 3);
};

// 6. 导出总函数
export const sendMessageToGemini = async (message: string, personality: FuyaoPersonality = 'RANDOM'): Promise<string> => {
  const systemPrompt = getSystemPrompt(personality);
  const lower = message.toLowerCase();

  if (lower.includes('contact')) return "请联系邮箱：1742521891@qq.com";

  try {
    // 优先尝试 Vercel
    return await callVercelGoogle(message, systemPrompt);
  } catch (vercelError) {
    console.warn("Vercel 失败，切换 DeepSeek...", vercelError);
    try {
      // 失败则尝试 DeepSeek
      const dsReply = await callSiliconFlow(message, systemPrompt);
      return dsReply + "\n\n(⚡ DeepSeek)";
    } catch (dsError) {
      // 都失败则离线
      const matches = findRelevantSources(lower);
      if (matches.length > 0) {
        const linksZh = matches.map(m => `* **${m.name.zh}**: ${m.link}`).join('\n');
        return `(离线模式) 推荐查看：\n${linksZh}`;
      }
      return "连接断开，请检查网络。";
    }
  }
};