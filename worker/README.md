# AI Proxy Worker

这个 Worker 是网页与 GLM/Gemini 之间的安全代理。API Key 仅保存为 Cloudflare Secret，不会进入前端构建产物。

## 首次部署

在 `worker` 目录执行：

```bash
npx wrangler login
npx wrangler secret put GLM_API_KEY
npx wrangler secret put GOOGLE_API_KEY
npx wrangler deploy
```

`GOOGLE_API_KEY` 是可选项；不需要 Gemini 备用通道时可以不配置。

如果部署后地址不是 `https://gemini-proxy.1870160408.workers.dev`，在 GitHub 仓库中新增 Actions Variable：

```text
VITE_AI_PROXY_URL=https://你的-worker.workers.dev
```

然后重新运行 `Auto Weather System` 工作流。

## 安全配置

- 不要把 `GLM_API_KEY`、`GOOGLE_API_KEY` 写入源码或 `VITE_*` 变量。
- `ALLOWED_ORIGINS` 只列出允许调用 Worker 的网站来源，多个来源用逗号分隔。
- 若资源包额度有风险，建议再在 Cloudflare 控制台为 `/chat` 添加 Rate Limiting Rule。
