# 需求草稿：Jira Webhook → Claude API 全自動開發代理人

> 放置於 `adw/_idea/phase3-ai-agent.md`
> 觸發指令：`/addyosmani-spec adw/_idea/phase3-ai-agent.md`

---

## 背景與動機

這是 ASUS 系統最核心的自動化段。
當 Jira 票狀態改為「In Progress」時，
系統必須自動觸發，不需要工程師手動啟動任何工具，
Claude API 直接讀取票面規格，產出程式碼與測試，
並在本地執行 TDD 驗證流程，最後自動 git commit。

---

## 前置條件（Phase 1、2 完成後才能進行）

- n8n 已能監聽 Jira Webhook
- 本地開發機已安裝 Node.js 20+、TypeScript、Vitest
- GitLab repo 已初始化，SSH key 已設定
- Claude API Key 已取得（Anthropic Console）
- n8n 已建立 Claude API 的 HTTP Request Credential

---

## 目標

建立以下完整的觸發鏈：

```
Jira 票狀態 → "In Progress"
  → Jira Webhook POST 到 n8n
  → n8n 讀取票面（票號、標題、Description）
  → n8n 讀取對應的 spec.md 與 design.md 內文
  → 組裝 Prompt 呼叫 Claude API (claude-sonnet-4-6)
  → Claude 產出：測試檔案內容 + 業務邏輯程式碼
  → n8n 透過 Execute Command 節點在本地執行：
      1. git checkout -b feature/{{jira-key}}
      2. 寫入測試檔案
      3. 執行 npm run test（必須看到 Fail）
      4. 寫入業務邏輯檔案
      5. 執行 npm run test（必須看到 Pass）
      6. git add + git commit
  → n8n 更新 Jira 票狀態為 "In Review"
  → n8n 呼叫 GitLab API 自動建立 Merge Request
```

---

## Claude API Prompt 設計規範

### System Prompt（固定）
```
你是一位嚴格遵循 TDD 紀律的 TypeScript 後端工程師。
你必須依照以下規範產出程式碼：
- 函式長度上限 30 行
- 所有錯誤處理必須有繁體中文上下文，禁止 silent fail
- 測試命名格式：應該_<預期行為>_當<條件>
- 禁止直接產出業務邏輯，必須先產出測試檔案

你的輸出必須是嚴格的 JSON 格式：
{
  "test_file_path": "test/xxx.test.ts",
  "test_file_content": "（完整測試檔案內容）",
  "impl_file_path": "src/xxx.ts",
  "impl_file_content": "（完整業務邏輯內容）",
  "commit_message": "feat(backend): [票號] 實作功能描述"
}
```

### User Prompt（動態組裝）
```
Jira 票號：{{jira_key}}
任務標題：{{jira_summary}}
TDD 完成定義：{{從 Description 解析出的 TDD 欄位}}

規格文件內容：
{{spec.md 全文}}

設計文件內容：
{{design.md 全文}}

請依照上述規格，產出這張票的測試檔案與業務邏輯實作。
```

---

## 技術限制

- Claude API：使用 `claude-sonnet-4-6`，max_tokens: 4096
- n8n Execute Command 節點：在本地執行 shell 指令（需 n8n 有本地執行權限）
- 測試框架：Vitest
- 語言：TypeScript（Node.js 20+）
- git 操作在本地執行，不透過任何 GUI
- spec.md 與 design.md 的讀取路徑：`/data/projects/{{project}}/{{spec_path}}`

---

## 範圍邊界

**做：**
- Jira Webhook 接收節點設定
- n8n 讀取 Jira 票面並解析 TDD DoD 欄位
- n8n 組裝 Prompt 呼叫 Claude API
- n8n Execute Command 節點執行 TDD 三色燈流程
- TDD 阻斷機制：若 `npm run test` 第一次沒有 Fail，中止並記錄錯誤
- 自動建立 GitLab Merge Request，標題帶票號
- Jira 票狀態自動更新

**不做：**
- VS Code / Cline GUI 操作（PoC 階段全走 CLI + API）
- 複雜的多輪對話（Claude 一次性產出，不做多輪修正）
- 人工審核介入點（審核在 Phase 4 的 PR review 流程處理）

---

## 驗收條件

1. 手動將一張 Jira 票改為「In Progress」，n8n 自動收到 Webhook
2. n8n 成功呼叫 Claude API 並取得 JSON 格式的程式碼回應
3. 本地 Git repo 出現新的 feature branch（格式：`feature/ASUS-101`）
4. `test/` 目錄下出現對應的測試檔案，`npm run test` 第一次執行顯示 Fail
5. `src/` 目錄下出現業務邏輯檔案，`npm run test` 第二次執行顯示 Pass
6. `git log` 顯示符合格式的 commit
7. GitLab 上自動出現對應的 Merge Request，assignee 為 SA 帳號
8. Jira 票狀態自動變更為「In Review」
