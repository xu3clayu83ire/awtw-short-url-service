# Phase 3 — AI 開發代理人：DevOps 任務清單

> ⬜ 待執行　✅ 已完成
> **執行環境**：Windows + Docker + n8n UI

---

## 前置閱讀

執行前必讀：
- `_spec/phase3-ai-agent/spec.md`
- `_spec/phase3-ai-agent/design.md`
- `_rule/workflow.md`

環境需求：
- Docker Desktop 已啟動
- n8n 容器正常運作（Phase 2 完成）
- GitHub repo `awtw-short-url-service` 已存在

---

## Phase 0 — 環境準備（~1h）

### T01 — 建立 Agent Runner HTTP 服務 ✅

> 注意：n8n Docker 映像（包含 Docker Hub 版與硬化版）均無套件管理器，無法直接安裝 git。
> 改用 Agent Runner 架構：在 Windows 本機跑 Node.js HTTP 服務，n8n 透過 `http://host.docker.internal:3001` 呼叫執行 git/npm 指令。

**架構：**
```
n8n 容器 → HTTP POST → host.docker.internal:3001 → Agent Runner（Windows）→ git/npm
```

**Agent Runner 位置**：`awtw-short-url-service/agent-runner/server.js`

**API 設計：**

`POST /run`
```json
// Request
{ "command": "git --version", "cwd": "/path/to/project" }
// Response
{ "stdout": "git version 2.x.x", "stderr": "", "exitCode": 0 }
```

`POST /write-file`
```json
// Request
{ "filePath": "/path/to/file.ts", "content": "..." }
// Response
{ "success": true, "filePath": "..." }
```

啟動指令：
```powershell
cd "D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\awtw-short-url-service\agent-runner"
node server.js
```

**TDD DoD**
- 測試命名：`應該_回傳git版本_當呼叫run端點時`
- 🔴 紅燈：服務未啟動前，HTTP POST 回傳 ECONNREFUSED
- 🟢 綠燈：啟動後，POST `/run` with `{"command":"git --version"}` 回傳含版本號的 JSON
- 覆蓋率：curl 或 n8n Test Step 驗證

**完成定義**：Agent Runner 啟動，`/run` 端點可正確執行 git 指令並回傳結果

---

### T02 — 初始化 TypeScript + Vitest 專案 ⬜

**依賴**：T01

在 `awtw-short-url-service/` 建立 TypeScript 專案：

```powershell
cd "D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\awtw-short-url-service"
```

建立 `package.json`：
```json
{
  "name": "awtw-short-url-service",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

建立 `tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist"
  },
  "include": ["src/**/*", "test/**/*"]
}
```

建立 `vitest.config.ts`：
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

建立目錄：
```powershell
New-Item -ItemType Directory -Force src, test
```

在本機安裝依賴（Agent Runner 架構，測試在 Windows 本機執行）：
```powershell
cd "D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\awtw-short-url-service"
npm install
```

**TDD DoD**
- 測試命名：`應該_npm_run_test執行成功_當vitest正確安裝時`
- 🔴 紅燈：安裝前，`npm run test` 顯示 command not found
- 🟢 綠燈：安裝後，`npm run test` 顯示「No test files found」
- 覆蓋率：本機 npm run test 驗證

**完成定義**：本機 `npm run test` 顯示「No test files found」✅

---

### T03 — 安裝 ngrok 並設定 Jira Webhook ⬜

**依賴**：無（可與 T01 並行）

**Step 1：安裝 ngrok**

下載 ngrok：https://ngrok.com/download（免費帳號即可）

安裝完成後登入：
```powershell
ngrok config add-authtoken <your-token>
```

**Step 2：啟動 ngrok**

```powershell
ngrok http 5678
```

記下顯示的公開 URL（如 `https://abc123.ngrok.io`）

**Step 3：設定 Jira Webhook**

1. 開啟 `https://prostyliu.atlassian.net`
2. 專案設定 → **Project Settings** → **Webhooks** → **Create webhook**
3. 填入：
   - **Name**：`ADW Phase 3`
   - **URL**：`https://<ngrok-id>.ngrok.io/webhook/jira-inprogress`
   - **Issue**：勾選 `updated`
   - **JQL**：`project = ASUS AND status = "In Progress"`

**TDD DoD**
- 測試命名：`應該_n8n收到webhook_當Jira票改為InProgress時`
- 🔴 紅燈：設定前，n8n 無 Webhook 節點，Jira 更新票無任何反應
- 🟢 綠燈：設定後，手動將 Jira 票改為 In Progress，n8n Executions 出現新記錄
- 覆蓋率：n8n UI 驗證

**完成定義**：手動觸發後 n8n Executions 出現對應記錄

---

### T04 — 設定 n8n Credential ⬜

**依賴**：T01

在 n8n 介面設定以下 Credential：

**Claude API：**
1. Credentials → Add Credential → 搜尋 `Header Auth`
2. Name：`Claude API`
3. Name（Header）：`x-api-key`
4. Value：你的 Anthropic API Key

**GitHub Token：**
1. Add Credential → 搜尋 `GitHub`
2. Name：`GitHub - ADW`
3. Access Token：從 GitHub → Settings → Developer settings → Personal access tokens 取得（需含 `repo` 範圍）

**TDD DoD**
- 測試命名：`應該_HTTP請求帶正確Header_當Credential設定正確時`
- 🔴 紅燈：未設定前，HTTP Request 節點顯示「No credentials」
- 🟢 綠燈：設定後，Credential 頁面顯示連線測試通過
- 覆蓋率：n8n UI 驗證

**完成定義**：兩個 Credential 均建立完成

---

## Notion 開票格式

```
[DevOps] 建立自訂 n8n Dockerfile 安裝 git｜TDD: 應該_容器內有git指令_當Dockerfile正確時
[DevOps] 初始化 TypeScript Vitest 專案｜TDD: 應該_npm_run_test執行成功_當vitest正確安裝時
[DevOps] 安裝 ngrok 並設定 Jira Webhook｜TDD: 應該_n8n收到webhook_當Jira票改為InProgress時
[DevOps] 設定 Claude API 和 GitHub Token Credential｜TDD: 應該_HTTP請求帶正確Header_當Credential設定正確時
```
