# 扶摇气象网站

React + TypeScript + Vite 构建的气象资料导航、实时天气看板和 AI 气象助手。

## 数据链路

- GitHub Actions 每小时使用 QWeather API 更新天气 JSON。
- 网页直接读取已生成的天气 JSON，不向浏览器暴露 QWeather Key。
- AI 助手只请求 Cloudflare Worker，由 Worker在服务端调用 GLM-4.7 或 Gemini。
- 所有 API Key 均保存在 GitHub Secrets 或 Cloudflare Secrets 中。

## 本地开发

```bash
npm install
npm run dev
```

需要指定其他 Worker 地址时，创建 `.env.local`：

```text
VITE_AI_PROXY_URL=https://你的-worker.workers.dev
```

这里的 URL 是公开地址；不要把任何 API Key 写进 `VITE_*` 变量。

## 部署 AI Worker

详见 [`worker/README.md`](worker/README.md)。
