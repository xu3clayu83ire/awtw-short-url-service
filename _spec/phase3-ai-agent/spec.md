# Phase 3 — Jira Webhook → Claude API 全自動開發代理人：規格文件

> 閱讀對象：PM、全員
> 產出工具：/addyosmani-saspec
> 前置條件：Phase 1、Phase 2 全部完成

---

## 需求理解

Phase 2 已能自動從 Notion 開出 Jira Task 票。Phase 3 的目標是讓工程師只要把 Jira 票狀態改為「In Progress」，系統就自動完成 TDD 開發流程：讀取票面規格 → 呼叫 Claude API 產出程式碼 → 在本地執行 TDD 三色燈驗證 → git commit → 建立 GitHub Pull Request → 回填 Jira 票狀態。

整個流程中工程師不需要手動啟動任何工具，只需要最後審核 PR。

---

## 功能清單

| # | 功能項目 | 負責角色 |
|---|---------|---------|
| F1 | Jira Webhook 接收節點：監聽票狀態改為 `In Progress` 時觸發 | DevOps |
| F2 | n8n 讀取 Jira 票面（票號、標題、Description TDD DoD） | Backend |
| F3 | n8n 讀取對應的 spec.md 與 design.md 檔案內容 | Backend |
| F4 | 組裝 Prompt 呼叫 Claude API（claude-sonnet-4-6），取得 JSON 格式回應 | Backend |
| F5 | Execute Command：git checkout -b feature/ASUS-{票號} | DevOps |
| F6 | Execute Command：寫入測試檔案，執行測試確認 Fail（🔴 紅燈） | Backend |
| F7 | Execute Command：寫入業務邏輯，執行測試確認 Pass（🟢 綠燈） | Backend |
| F8 | Execute Command：git add + git commit | DevOps |
| F9 | GitHub API：自動建立 Pull Request，標題帶票號 | DevOps |
| F10 | Jira API：更新票狀態為 `In Review` | Backend |
| F11 | TDD 阻斷機制：第一次測試未 Fail 時中止流程並記錄錯誤 | Backend |

---

## 非功能需求

- **安全性**：Claude API Key、GitHub Token 存於 n8n Credential，不寫入程式碼
- **可觀測性**：每個步驟的 stdout/stderr 記錄於 n8n Execution log
- **冪等性**：同一張 Jira 票重複觸發時，不重複建立 branch 或 PR
- **語言**：TypeScript（Node.js 20+），測試框架 Vitest
- **模型**：claude-sonnet-4-6，max_tokens: 4096

---

## 範圍邊界

**本 Phase 做：**
- Jira Webhook 接收與票面解析
- Claude API Prompt 組裝與呼叫
- TDD 三色燈本地執行流程（紅燈 → 綠燈 → commit）
- TDD 阻斷機制（第一次測試未 Fail 則中止）
- GitHub Pull Request 自動建立
- Jira 票狀態更新為 In Review

**本 Phase 不做：**
- VS Code / Cline GUI 操作（全走 CLI + API）
- Claude 多輪對話修正（一次性產出）
- 人工審核介入點（Phase 4 的 PR Review 流程處理）
- 藍燈重構（Phase 4 處理）
- 前端程式碼生成（僅限後端 TypeScript）

---

## 驗收條件

| # | 情境 | 操作 | 預期結果 |
|---|------|------|---------|
| AC1 | Jira Webhook 觸發 | 手動將 Jira 票 ASUS-N 改為 `In Progress` | n8n Executions 出現新執行記錄 |
| AC2 | Claude API 呼叫成功 | AC1 完成後 | n8n log 顯示 Claude 回傳合法 JSON，含 `test_file_path`、`test_file_content`、`impl_file_path`、`impl_file_content`、`commit_message` |
| AC3 | Git branch 建立 | AC2 完成後 | 本地 repo 出現 `feature/ASUS-N` 分支 |
| AC4 | 🔴 紅燈確認 | AC3 完成後 | `test/` 目錄出現測試檔，`npm run test` 第一次執行顯示 Fail |
| AC5 | 🟢 綠燈確認 | AC4 完成後 | `src/` 目錄出現業務邏輯檔，`npm run test` 第二次執行顯示 Pass |
| AC6 | Git commit | AC5 完成後 | `git log` 顯示符合格式的 commit（`feat(backend): [ASUS-N] ...`） |
| AC7 | GitHub PR 建立 | AC6 完成後 | GitHub repo 出現對應 PR，標題含票號，base branch 為 `main` |
| AC8 | Jira 狀態更新 | AC7 完成後 | Jira 票狀態自動變更為 `In Review` |
| AC9 | TDD 阻斷機制 | 故意讓 Claude 產出不會 Fail 的測試 | n8n 中止流程，Jira 票保持 `In Progress`，log 記錄錯誤原因 |
