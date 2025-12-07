/**
 * 🧪 PushPlus 发送测试脚本 (完整修复版)
 * 用法: node scripts/test-pushplus.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- 1. 手动加载 .env 文件 ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        if (!line || line.startsWith('#')) return;
        const [key, ...vals] = line.split('=');
        if (key && vals.length) {
            process.env[key.trim()] = vals.join('=').trim();
        }
    });
    console.log("✅ 已加载 .env 文件");
}

// --- 2. 配置信息 ---
const CONFIG = {
    TOKEN: process.env.PUSHPLUS_TOKEN,
    URL: 'http://www.pushplus.plus/send'
};

async function testPushPlus() {
    console.log("\n🧪 开始测试 PushPlus 发送...\n");

    // --- 步骤 1: 检查配置 ---
    if (!CONFIG.TOKEN) {
        console.error("❌ 错误: 未找到 Token！");
        console.error("   请在 .env 文件中添加: PUSHPLUS_TOKEN=你的token");
        return;
    }

    // 隐藏 Token 中间部分
    const maskToken = CONFIG.TOKEN.length > 8
        ? CONFIG.TOKEN.substring(0, 4) + "****" + CONFIG.TOKEN.slice(-4)
        : "****";
    console.log(`📋 配置检查: Token [${maskToken}]`);

    // --- 步骤 2: 准备发送列表 ---
    const targets = [
        { code: 'weather_cx', name: '慈溪组' },
        // { code: 'weather_cx', name: '慈溪组' } 
    ];

    console.log(`📋 准备发送给: ${targets.map(t => t.name).join(', ')}`);

    // --- 步骤 3: 循环发送 ---
    const currentTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const testContent = `
        <h3>👋 PushPlus 连通性测试</h3>
        <p><b>时间:</b> ${currentTime}</p>
        <p><b>状态:</b> Node.js 脚本发送成功！</p>
        <hr>
        <small>来自: 本地测试脚本</small>
    `;

    for (const target of targets) {
        try {
            console.log(`\n👉 正在发送给 [${target.name}]...`);

            const body = {
                token: CONFIG.TOKEN,
                topic: target.code,
                title: `${target.name} - 连通性测试`,
                content: testContent,
                template: 'html'
            };

            const response = await fetch(CONFIG.URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.code === 200) {
                console.log(`   ✅ 发送成功!`);
            } else {
                console.error(`   ❌ 发送失败: ${result.msg}`);
                if (result.code === 600) {
                    console.log(`      💡 提示: 请检查群组编码 '${target.code}' 是否正确`);
                }
            }

        } catch (e) {
            console.error(`   ❌ 网络异常: ${e.message}`);
        }
    } // 循环结束

    console.log("\n🎉 测试结束");
} // 函数结束

// 执行主函数
testPushPlus();