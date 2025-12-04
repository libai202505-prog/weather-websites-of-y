/**
 * 🧪 企业微信发送测试脚本
 * 用法: node scripts/test-wechat.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

// 手动加载 .env 文件
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length) {
            process.env[key.trim()] = vals.join('=').trim();
        }
    });
    console.log("✅ 已加载 .env 文件\n");
}

const WECHAT = {
    CORP_ID: process.env.WECHAT_CORP_ID,
    SECRET: process.env.WECHAT_APP_SECRET,
    AGENT_ID: process.env.WECHAT_AGENT_ID,
};

async function testWeChat() {
    console.log("🧪 开始测试企业微信发送...\n");

    // 1. 检查配置
    console.log("📋 步骤 1: 检查配置");
    console.log(`   CORP_ID: ${WECHAT.CORP_ID ? "✅ " + WECHAT.CORP_ID.substring(0, 4) + "****" : "❌ 未配置"}`);
    console.log(`   SECRET: ${WECHAT.SECRET ? "✅ ****" + WECHAT.SECRET.slice(-4) : "❌ 未配置"}`);
    console.log(`   AGENT_ID: ${WECHAT.AGENT_ID ? "✅ " + WECHAT.AGENT_ID : "❌ 未配置"}`);

    if (!WECHAT.CORP_ID || !WECHAT.SECRET || !WECHAT.AGENT_ID) {
        console.error("\n❌ 配置不完整！请检查环境变量或 .env 文件");
        return;
    }

    // 2. 获取 access_token
    console.log("\n📋 步骤 2: 获取 access_token");
    try {
        const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECHAT.CORP_ID}&corpsecret=${WECHAT.SECRET}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.errcode !== 0) {
            console.error(`   ❌ 获取失败: ${tokenData.errmsg}`);
            return;
        }
        console.log(`   ✅ 获取成功: ${tokenData.access_token.substring(0, 20)}...`);

        // 3. 发送测试消息
        console.log("\n📋 步骤 3: 发送测试消息");
        const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${tokenData.access_token}`;

        const testMsg = `### 🧪 测试消息
> 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
> 来源: 本地测试脚本

如果你收到这条消息，说明 IP 白名单配置正确 ✅`;

        // 分别测试两个标签
        const tags = [
            { id: '1', name: '北京组' },
            { id: '2', name: '慈溪组' }
        ];

        for (const tag of tags) {
            const sendRes = await fetch(sendUrl, {
                method: 'POST',
                body: JSON.stringify({
                    totag: tag.id,
                    msgtype: "markdown",
                    agentid: WECHAT.AGENT_ID,
                    markdown: { content: testMsg },
                    safe: 0
                })
            });

            const result = await sendRes.json();
            if (result.errcode === 0) {
                console.log(`   ✅ 标签 [${tag.id}] ${tag.name}: 发送成功!`);
            } else {
                console.error(`   ❌ 标签 [${tag.id}] ${tag.name}: 发送失败 - ${result.errmsg}`);
                if (result.errcode === 60020) {
                    console.log(`      💡 错误 60020: 需要在企业微信后台配置可信 IP`);
                }
            }
        }

    } catch (e) {
        console.error(`   ❌ 网络错误: ${e.message}`);
    }
}

testWeChat();
