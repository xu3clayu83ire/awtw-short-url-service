# Phase 4 CI/CD 審核流程 — Backend 任務拆解

> 每個任務設計為獨立可驗證，完成後有明確的檢查點。
> ⬜ 待執行　✅ 已完成
>
> 執行方式：🤖 AI 執行（ASUS 自動產出程式碼）　👤 手動執行（Console/CLI 操作）

## 前置閱讀

- `_spec/phase4-cicd-review/spec.md`
- `_spec/phase4-cicd-review/design.md`
- `_rule/workflow.md`
- `_rule/coding-style.md`

## 前置條件

- Phase 4 DevOps T01 已完成（GitHub Actions CI 已建立）
- n8n 已啟動，ngrok 已運行並取得公開 URL
- Gmail 帳號已開啟「應用程式密碼」（App Password）

---

## Phase 0 — n8n PR 通知 Workflow（~2h）

### T01 — 建立 GitHub PR Webhook ✅　👤 手動執行　(ASUS-101)

至 GitHub repo → Settings → Webhooks → Add webhook：
- Payload URL：`https://<ngrok-url>/webhook/github-pr`
- Content type：`application/json`
- Events：`Pull requests`（僅勾選 Pull request）

> 👤 手動原因：GitHub Console 設定操作，無程式碼產出。

**完成定義**：
- 🟢 綠燈確認：手動建立測試 PR 後，n8n Webhook 節點收到 payload，`action` 欄位為 `opened`
- 執行指令：n8n Executions 頁面出現新記錄

---

### T02 — 建立 n8n PR 通知 Workflow ✅　🤖 AI 執行　(ASUS-108)

**依賴**：T01

在 n8n 建立新 workflow `github-pr-notify`，節點依序為：

1. **Webhook**（POST `/webhook/github-pr`）
2. **Code node「解析 PR 資訊」**：萃取 jiraKey、prTitle、prUrl、prNumber、branch、author
3. **Send Email node**：寄送審核通知至 SA Email

**完成定義**：
- 測試命名：`應該_發送Email通知_當GitHub PR被建立`
- 🔴 紅燈確認：Webhook 收到 payload 但 Email node 未設定，workflow 執行失敗
- 🟢 綠燈確認：建立測試 PR 後，SA Email 收到通知，主旨格式為 `[ASUS 審核通知] [ASUS-N] 功能描述`

---

### T03 — 設定 n8n Gmail SMTP Credential ⬜　👤 手動執行

**依賴**：T02

在 n8n Credentials 新增 Gmail SMTP：
- Host：`smtp.gmail.com`
- Port：`465`（SSL）
- User：SA Gmail 帳號
- Password：Gmail App Password（非登入密碼）

> 👤 手動原因：帳號密碼等敏感設定需手動輸入至 n8n，不可寫入程式碼。

**完成定義**：
- 🟢 綠燈確認：n8n Send Email node 測試連線成功，收件匣出現測試信

---

### T04 — 實作 PR 資訊解析 Code node ✅　🤖 AI 執行　(ASUS-109)

**依賴**：T01

實作解析邏輯，處理以下情境：
- PR title 符合格式 `[ASUS-N] 描述` → 正常萃取票號
- PR title 不含票號 → jiraKey 回傳 `（無票號）`，不中斷流程

```javascript
const payload = $input.first().json.body ?? $input.first().json;
const pr = payload.pull_request ?? {};
const titleMatch = pr.title?.match(/\[([A-Z]+-\d+)\]/);
const jiraKey = titleMatch ? titleMatch[1] : '（無票號）';

return [{
  json: {
    jiraKey,
    prTitle: pr.title ?? '',
    prUrl: pr.html_url ?? '',
    prNumber: pr.number ?? '',
    branch: pr.head?.ref ?? '',
    author: pr.user?.login ?? '',
  }
}];
```

**完成定義**：
- 測試命名：`應該_萃取票號_當PR標題符合格式` / `應該_回傳無票號_當PR標題不含票號`
- 🔴 紅燈確認：Code node 無解析邏輯，jiraKey 為 undefined
- 🟢 綠燈確認：兩種情境均正確解析，n8n Execution log 顯示正確欄位值

---

### T05 — 匯出 n8n Workflow JSON ⬜　👤 手動執行

**依賴**：T02、T03、T04

將完成的 `github-pr-notify` workflow 從 n8n 匯出為 JSON，存至：
`n8n-workflows/github-pr-notify.json`

> 👤 手動原因：需從 n8n 介面手動匯出，再 commit 至 repo。

**完成定義**：
- 🟢 綠燈確認：`n8n-workflows/github-pr-notify.json` 檔案存在，commit 進 main branch

---

## Notion 開票格式

```
[Backend][手動] 建立 GitHub PR Webhook 至 n8n｜TDD: 應該_接收Webhook_當PR被建立
[Backend][AI] 建立 n8n github-pr-notify workflow｜TDD: 應該_發送Email通知_當GitHub PR被建立
[Backend][手動] 設定 n8n Gmail SMTP Credential｜TDD: 應該_發送Email成功_當SMTP設定正確
[Backend][AI] 實作 PR 資訊解析 Code node｜TDD: 應該_萃取票號_當PR標題符合格式
[Backend][手動] 匯出 github-pr-notify workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
```
