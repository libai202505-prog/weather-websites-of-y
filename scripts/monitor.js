import fs from 'node:fs';
import path from 'node:path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'node:url';
import TARGET_CITIES from './cities.js';

// 🛠️ 手动构建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("正在检查 Key...");
console.log("QWEATHER_KEY:", process.env.QWEATHER_KEY ? "✅ 已读取 (前4位: " + process.env.QWEATHER_KEY.substring(0, 4) + ")" : "❌ 未读取 (undefined)");
console.log("GOOGLE_KEY:", process.env.GOOGLE_API_KEY ? "✅ 已读取" : "❌ 未读取");

const WECHAT = {
  CORP_ID: process.env.WECHAT_CORP_ID,
  SECRET: process.env.WECHAT_APP_SECRET,
  AGENT_ID: process.env.WECHAT_AGENT_ID,
};
const QWEATHER_KEY = process.env.QWEATHER_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

// 📁 文件路径配置
const DATA_FILE = path.join(__dirname, '../public/weather-status.json');
const LATEST_FILE = path.join(__dirname, '../public/latest-briefings.json');
const HISTORY_ROOT = path.join(__dirname, '../public/history');

// 🚨 报警阈值设置 (修改版)
const THRESHOLDS = {
  // 1. 骤降阈值 (1小时体感降温)
  DROP_ORANGE: 3, // 橙色：降 3度
  DROP_RED: 5,    // 红色：降 5度

  // 2. 极寒阈值 (体感绝对值)
  FREEZE_ORANGE: -15, // 橙色：低于 -15度
  FREEZE_RED: -20,    // 红色：低于 -20度

  // 3. 风力阈值
  WIND_KEYWORD: '北',
  WIND_LEVEL: 4,
};

// --- 工具函数 ---
async function fetchJson(url, options = {}) {
  const headers = { ...options.headers };

  if (process.env.CI === 'true') {
    headers['Referer'] = 'https://libai202505-prog.github.io';
    console.log("🌐 检测到 GitHub 环境，已添加 Referer");
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ 请求失败: ${url}`);
    console.error(`❌ 状态码: ${response.status}`);
    console.error(`❌ 详情: ${errorText}`);
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

const GOOGLE_MODEL = "gemini-2.5-flash";

async function callGemini(prompt) {
  if (!GOOGLE_KEY) return "AI KEY MISSING";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${GOOGLE_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "NO AI DATA";
    }
    const text = await res.text();
    console.error("Gemini Error Detail:", text);
    return `AI ERROR ${res.status}`;
  } catch (e) {
    console.error("Gemini Network Error:", e.message);
    return "AI NETWORK ERROR";
  }
}

function getBeijingHour() {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const bjDate = new Date(utc + (3600000 * 8));
  return bjDate.getHours();
}

async function sendWeChat(markdown, tagId) {
  if (!tagId) return;
  try {
    const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECHAT.CORP_ID}&corpsecret=${WECHAT.SECRET}`;
    const tokenData = await fetchJson(tokenUrl);
    const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${tokenData.access_token}`;

    await fetch(sendUrl, {
      method: 'POST',
      body: JSON.stringify({
        totag: tagId,
        msgtype: "markdown",
        agentid: WECHAT.AGENT_ID,
        markdown: { content: markdown },
        safe: 0
      })
    });
    console.log(`📨 已推送至标签 [${tagId}]`);
  } catch (e) { console.error("WeChat Error:", e.message); }
}

// --- 主程序 ---
async function run() {
  console.log("🚀 开始执行全量监控与归档...");

  // 1. 目录准备
  [path.dirname(DATA_FILE), HISTORY_ROOT].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const nowTime = new Date();
  const dateStr = nowTime.toISOString().split('T')[0].replace(/-/g, '');
  const dayDir = path.join(HISTORY_ROOT, nowTime.getFullYear().toString(), dateStr);
  if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });

  // 2. 读取旧数据
  let lastData = { cities: [] };
  if (fs.existsSync(DATA_FILE)) {
    try { lastData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { }
  }
  let memory = lastData.memory || {};

  // 3. 读取现有简报
  let dailyData = {};
  if (fs.existsSync(LATEST_FILE)) {
    try { dailyData = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8')); } catch (e) { }
  }

  const currentHour = getBeijingHour();
  const isSilentTime = (currentHour >= 22 || currentHour < 7);

  // 4. 遍历城市
  const frontendList = [];

  for (const city of TARGET_CITIES) {
    // A. 查全量数据
    const url = `https://mh359fbvpj.re.qweatherapi.com/v7/weather/now?location=${city.id}&key=${QWEATHER_KEY}`;
    let now;
    try {
      const res = await fetchJson(url);
      if (res.code === '200') now = res.now;
    } catch (e) { console.error(`${city.name} API Error`, e); continue; }
    if (!now) continue;

    // B. 🤖 生成 AI 简报 (恢复暖心风格)
    const prompt = `
      城市：${city.name}
      天气：${now.text}，气温：${now.temp}℃，体感：${now.feelsLike}℃，风向：${now.windDir}，风力：${now.windScale}级，湿度：${now.humidity}%。

      请分别用「中文」和「英文」各写一句不超过 20 个字的天气关怀提示，语气要温暖、贴心、生活化。
      ⚠️ 格式要求：
      1. 在单位和标点/正文汉字或者字符周围必须加空格(例如: 16°C 多云,而不是16°C多云,也不是16°C,)。
      2. 中文简报和英文简报必须分开输出，中间用空行隔开。
      严格按照下面格式输出：
      ZH: 中文简报
      EN: ENGLISH BRIEFING
    `;

    await new Promise(r => setTimeout(r, 800));
    const rawBrief = await callGemini(prompt);

    let zhBrief = rawBrief;
    let enBrief = "";
    const zhMatch = rawBrief.match(/ZH:\s*(.+)/i);
    const enMatch = rawBrief.match(/EN:\s*(.+)/i);
    if (zhMatch) zhBrief = zhMatch[1].trim();
    if (enMatch) enBrief = enMatch[1].trim();
    if (!enBrief) enBrief = zhBrief;

    console.log(`🤖 [${city.name}] ZH: ${zhBrief}`);

    // =========================================================
    // 🔥 C. 核心升级：体感 + 极寒 双重判断逻辑
    // =========================================================

    if (!memory[city.name]) memory[city.name] = { lastSeverity: 0 };
    const cityMem = memory[city.name];
    const lastSeverity = cityMem.lastSeverity || 0;

    let myAlerts = [];
    let currentSeverity = 0; // 0=正常, 1=橙色, 2=红色

    const currentFeels = parseInt(now.feelsLike);

    // 1. ❄️ 极寒绝对值判断 (新增逻辑)
    if (currentFeels <= THRESHOLDS.FREEZE_RED) {
      myAlerts.push(`🥶 红色极寒警报：体感低至 ${currentFeels}℃`);
      currentSeverity = 2; // 直接拉满
    } else if (currentFeels <= THRESHOLDS.FREEZE_ORANGE) {
      myAlerts.push(`❄️ 橙色寒冷提示：体感低至 ${currentFeels}℃`);
      if (currentSeverity < 1) currentSeverity = 1;
    }

    // 2. 📉 骤降判断 (结合旧数据)
    const lastCity = lastData.cities.find(c => c.name === city.name);
    if (lastCity && lastCity.feelsLike) {
      const drop = parseInt(lastCity.feelsLike) - currentFeels;

      if (!Number.isNaN(drop) && drop > 0) {
        if (drop >= THRESHOLDS.DROP_RED) {
          myAlerts.push(`📉 红色降温预警：1小时骤降${drop}℃`);
          currentSeverity = 2; // 直接拉满
        } else if (drop >= THRESHOLDS.DROP_ORANGE) {
          myAlerts.push(`🟧 橙色降温提示：1小时降温${drop}℃`);
          if (currentSeverity < 2) currentSeverity = 1;
        }
      }
    }

    // 3. 💨 北风判断
    const windLvl = parseInt(now.windScale);
    if (now.windDir.includes(THRESHOLDS.WIND_KEYWORD) && windLvl >= THRESHOLDS.WIND_LEVEL) {
      myAlerts.push(`💨 北风警报：${now.windDir} ${now.windScale}级`);
      if (currentSeverity < 1) currentSeverity = 1;
    }

    // 4. 决策：只在 "恶化" 时发送
    if (currentSeverity > lastSeverity) {
      if (city.isVip && city.tagId && !isSilentTime) {
        // 把所有警报拼起来发
        const msg = `### 📍 ${city.name} 气象警报\n${myAlerts.join('\n')}\n当前: ${now.text} ${now.temp}℃ (体感 ${now.feelsLike}℃)\n[详情](https://libai202505-prog.github.io/weather-websites-of-y/)`;
        await sendWeChat(msg, city.tagId);
      }
    }

    // 5. 更新记忆
    cityMem.lastSeverity = currentSeverity;

    // =========================================================

    const fullData = {
      name: city.name,
      updateTime: now.obsTime,
      temp: now.temp,
      feelsLike: now.feelsLike,
      text: now.text,
      windDir: now.windDir,
      windScale: now.windScale,
      windSpeed: now.windSpeed,
      wind360: now.wind360,
      humidity: now.humidity,
      precip: now.precip,
      pressure: now.pressure,
      vis: now.vis,
      dew: now.dew,
      cloud: now.cloud,
      ai_briefing: zhBrief,
      ai_briefing_zh: zhBrief,
      ai_briefing_en: enBrief,
      alert: myAlerts.length > 0 ? myAlerts.join(' | ') : null
    };

    dailyData[city.name] = fullData;

    frontendList.push({
      name: city.name,
      temp: now.temp,
      feelsLike: now.feelsLike,
      text: now.text,
      wind: `${now.windDir}${now.windScale}级`,
      humidity: now.humidity,
      alert: myAlerts.length > 0 ? myAlerts.join(' ') : null
    });
  }
  frontendList.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  // 6. 保存文件
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    updateTime: new Date().toISOString(),
    cities: frontendList,
    memory: memory
  }, null, 2));

  fs.writeFileSync(LATEST_FILE, JSON.stringify(dailyData, null, 2));

  const archiveFile = path.join(dayDir, 'full_data.json');
  fs.writeFileSync(archiveFile, JSON.stringify(dailyData, null, 2));

  // 🔥 新增：按城市归档 (解决数据覆盖问题，一行一个时刻)
  // 文件名示例: public/history/2025/20251202/北京.json
  for (const city of TARGET_CITIES) {
    const cityFile = path.join(dayDir, `${city.name}.json`);
    let cityHistory = [];

    // 1. 如果文件存在，先读取旧数据
    if (fs.existsSync(cityFile)) {
      try {
        cityHistory = JSON.parse(fs.readFileSync(cityFile, 'utf8'));
      } catch (e) { console.error(`读取历史文件失败: ${cityFile}`, e); }
    }

    // 2. 追加当前时刻的数据 (从 dailyData 中取)
    if (dailyData[city.name]) {
      cityHistory.push(dailyData[city.name]);
    }

    // 3. 写回文件
    fs.writeFileSync(cityFile, JSON.stringify(cityHistory, null, 2));
  }

  console.log("💾 数据已按城市归档 (追加模式)");
}

run();