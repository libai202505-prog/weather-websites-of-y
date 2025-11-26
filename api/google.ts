import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 允许跨域 (CORS) - 让你的网页能访问这个后端
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { message, systemPrompt } = req.body;
  
  // 🔑 关键：从 Vercel 后台环境变量读取 Key (代码里不写明文)
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Server Error: API Key not configured" });
  }

  try {
    // 2. 直连 Google (Vercel 服务器)
    // 使用 2.5-flash 模型
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemPrompt } },
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();
    
    // 3. 把 Google 的回复转发给前端
    return res.status(200).json(data);

  } catch (error: any) {
    console.error("Google API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}