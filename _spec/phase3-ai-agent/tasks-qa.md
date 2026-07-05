# Phase 3 — AI 開發代理人：QA 驗收任務清單

> ⬜ 待執行　✅ 已完成
> **執行時機**：DevOps 與 Backend 所有任務的 ⬜ 全部變為 ✅ 後才執行

---

## 前置閱讀

執行前必讀：
- `_spec/phase3-ai-agent/spec.md`（驗收條件 AC1～AC9）
- `_spec/phase3-ai-agent/tasks-devops.md`（確認全部 ✅）
- `_spec/phase3-ai-agent/tasks-backend.md`（確認全部 ✅）

前置準備：
- n8n Workflow 已啟用（Active 狀態）
- ngrok 已啟動，Jira Webhook URL 已更新
- Jira ASUS 看板有一張狀態為 `To Do` 的票（含完整 TDD DoD）
- `awtw-short-url-service` GitHub repo 已初始化，有 `main` 分支

---

## 驗收案例

### QA-T01 — 驗收 AC1：Jira Webhook 觸發 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | 手動將 Jira 票狀態改為 `In Progress` |
| 步驟 | 1. 開啟 Jira ASUS 看板<br>2. 選一張 `To Do` 的票<br>3. 將狀態改為 `In Progress` |
| 預期結果 | n8n Executions 在 30 秒內出現新執行記錄 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T02 — 驗收 AC2：Claude API 呼叫成功 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T01 通過後 |
| 步驟 | 1. 開啟 n8n Executions 對應記錄<br>2. 找到「呼叫 Claude API」節點的輸出<br>3. 確認 Output 含合法 JSON |
| 預期結果 | Output 含 `test_file_path`、`test_file_content`、`impl_file_path`、`impl_file_content`、`commit_message` |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T03 — 驗收 AC3：Git branch 建立 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T02 通過後 |
| 步驟 | 在 PowerShell 執行：`cd "D:\06_Workspace\...\awtw-short-url-service" && git branch` |
| 預期結果 | 出現 `feature/ASUS-N` 分支 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T04 — 驗收 AC4：🔴 紅燈確認 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T03 通過後 |
| 步驟 | 1. 確認 `test/` 目錄出現測試檔案<br>2. 在 PowerShell 手動執行：`npm run test`（應顯示 Fail） |
| 預期結果 | 測試檔案存在，`npm run test` 第一次執行顯示 FAIL |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T05 — 驗收 AC5：🟢 綠燈確認 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T04 通過後 |
| 步驟 | 1. 確認 `src/` 目錄出現業務邏輯檔案<br>2. 手動執行：`npm run test`（應顯示 Pass） |
| 預期結果 | `src/` 目錄有對應檔案，`npm run test` 全數 Pass |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T06 — 驗收 AC6：Git commit ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T05 通過後 |
| 步驟 | 執行：`git log --oneline -3` |
| 預期結果 | 最新 commit 格式為 `feat(backend): [ASUS-N] ...` |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T07 — 驗收 AC7：GitHub PR 建立 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T06 通過後 |
| 步驟 | 開啟 GitHub repo → Pull Requests |
| 預期結果 | 出現標題含 `[ASUS-N]` 的 PR，base branch 為 `main` |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T08 — 驗收 AC8：Jira 狀態更新 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T07 通過後 |
| 步驟 | 開啟 Jira ASUS 看板 |
| 預期結果 | 原本 `In Progress` 的票自動變為 `In Review` |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T09 — 驗收 AC9：TDD 阻斷機制 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | 模擬 Claude 產出不會 Fail 的測試 |
| 步驟 | 1. 暫時修改解析節點，讓 `test_file_content` 為空測試（無 assertion）<br>2. 觸發 Jira Webhook<br>3. 觀察 n8n Executions |
| 預期結果 | 流程在「紅燈確認 IF」走 False 分支中止，Jira 票保持 `In Progress`，log 含「TDD 阻斷」訊息 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

## 整體驗收結論

| AC | 項目 | 結果 |
|----|------|------|
| AC1 | Jira Webhook 觸發 | ⬜ |
| AC2 | Claude API 呼叫成功 | ⬜ |
| AC3 | Git branch 建立 | ⬜ |
| AC4 | 🔴 紅燈確認 | ⬜ |
| AC5 | 🟢 綠燈確認 | ⬜ |
| AC6 | Git commit | ⬜ |
| AC7 | GitHub PR 建立 | ⬜ |
| AC8 | Jira 狀態更新 | ⬜ |
| AC9 | TDD 阻斷機制 | ⬜ |

全部 Pass 後，Phase 3 驗收完成，可進入 Phase 4。

---

## Notion 開票格式

```
[QA] 驗收 Jira Webhook 觸發（AC1）｜TDD: 應該_n8n收到webhook_當Jira票改為InProgress時
[QA] 驗收 Claude API 呼叫成功（AC2）｜TDD: 應該_取得合法JSON回應_當API呼叫成功時
[QA] 驗收 Git branch 建立（AC3）｜TDD: 應該_出現feature分支_當jiraKey正確時
[QA] 驗收紅燈確認（AC4）｜TDD: 應該_測試第一次Fail_當Claude產出正確測試時
[QA] 驗收綠燈確認（AC5）｜TDD: 應該_測試全數Pass_當業務邏輯正確時
[QA] 驗收 Git commit（AC6）｜TDD: 應該_commit格式正確_當測試Pass時
[QA] 驗收 GitHub PR 建立（AC7）｜TDD: 應該_PR出現在GitHub_當commit成功時
[QA] 驗收 Jira 狀態更新（AC8）｜TDD: 應該_狀態變為InReview_當PR建立成功時
[QA] 驗收 TDD 阻斷機制（AC9）｜TDD: 應該_流程中止_當測試未Fail時
```
