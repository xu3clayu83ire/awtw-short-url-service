# Phase 2 — n8n 自動化分流管線：規格文件

> 閱讀對象：PM、全員
> 產出工具：/addyosmani-saspec
> 前置條件：Phase 1 全部完成

---

## 需求理解

Phase 1 建好了本地 n8n 引擎與 Notion 資料庫。Phase 2 的目標是讓「規格進 Notion」這個動作自動引發後續一切工作，不需要手動開票或手動維護文件。

具體來說，當你把 Notion 主表的 Status 改為「Ready to Plan」，n8n 要自動做兩件事：
1. 讀取 `Tasks_To_Open` 欄位，按行切割成多張 Jira Task 票，票面自動帶入 TDD DoD 格式，開完後把 Epic Key 回填到 Notion
2. 讀取 Notion 的屬性與內文，組裝成 Hugo Book 格式的 Markdown，寫到本地掛載目錄，讓文件站自動更新

---

## 功能清單

| # | 功能項目 | 負責角色 |
|---|---------|---------|
| F1 | Notion Trigger 節點：監聽主表 Status 改為 `Ready to Plan` 時觸發 | DevOps |
| F2 | 分流 A — JavaScript 切割 `Tasks_To_Open`，依換行符拆成任務陣列 | Backend |
| F3 | 分流 A — Jira 批次開票，每行建立一張 Task，票面含完整 TDD DoD | Backend |
| F4 | 分流 A — 開票完成後，將 Jira Epic Key 回填到 Notion `Jira_Epic_Key` 欄位 | Backend |
| F5 | 分流 B — JavaScript 組裝 Hugo Front Matter（含 title、weight、slug） | Backend |
| F6 | 分流 B — Write File 節點把 `.md` 寫入本地掛載目錄 | DevOps |
| F7 | 錯誤處理：`Tasks_To_Open` 為空時中斷並寫入 log，不開票不報錯 | Backend |
| F8 | n8n 工作流 JSON 匯出，版控於 Git | DevOps |

---

## 非功能需求

- **安全性**：Jira API Token 與 Notion Token 存於 n8n Credential，不寫入程式碼
- **冪等性**：同一筆 Notion 資料重複觸發時，不重複開 Jira 票（以 `Jira_Epic_Key` 欄位是否已有值判斷）
- **可追蹤性**：每次 n8n 工作流執行結果可在 n8n Executions 頁面查閱

---

## 範圍邊界

**本 Phase 做：**
- Notion Trigger 節點（含 Status 過濾條件）
- 分流 A：切割任務 + Jira 批次開票 + 回填 Notion
- 分流 B：Hugo Front Matter 組裝 + Write File
- 錯誤處理（Tasks_To_Open 為空）
- n8n Workflow JSON 版控

**本 Phase 不做：**
- Jira Webhook 監聽（Phase 3）
- Claude API 呼叫（Phase 3）
- 任何前端 UI

---

## 驗收條件

| # | 情境 | 操作 | 預期結果 |
|---|------|------|---------|
| AC1 | 正常觸發流程 | Notion 主表新增一筆資料，`Tasks_To_Open` 填 2 行任務，Status 改為 `Ready to Plan` | n8n 自動觸發，Jira 出現 2 張 Task 票，票面含完整 TDD DoD |
| AC2 | Jira Key 回填 | AC1 完成後 | Notion 主表 `Jira_Epic_Key` 欄位被自動填入 |
| AC3 | Hugo 文件同步 | AC1 完成後 | `hugo-docs/content/docs/{{slug}}.md` 出現，Front Matter 正確 |
| AC4 | 空任務保護 | `Tasks_To_Open` 為空，Status 改為 `Ready to Plan` | n8n 不開票、不報錯，Executions 可看到 log 記錄 |
| AC5 | 冪等保護 | `Jira_Epic_Key` 已有值的資料 Status 再次改為 `Ready to Plan` | n8n 不重複開票 |
