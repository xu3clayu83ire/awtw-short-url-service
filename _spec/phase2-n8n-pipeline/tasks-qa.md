# Phase 2 — n8n 自動化管線：QA 驗收任務清單

> ⬜ 待執行　✅ 已完成
> **執行時機**：DevOps 與 Backend 所有任務的 ⬜ 全部變為 ✅ 後才執行

---

## 前置閱讀

執行前必讀：
- `_spec/phase2-n8n-pipeline/spec.md`（驗收條件 AC1～AC5）
- `_spec/phase2-n8n-pipeline/tasks-devops.md`（確認全部 ✅）
- `_spec/phase2-n8n-pipeline/tasks-backend.md`（確認全部 ✅）

前置準備：
- n8n Workflow 已啟用（非 Inactive 狀態）
- Notion 主表有一筆測試資料（Slug: `qa-test-phase2`，Status: `Draft`）

---

## 驗收案例

### QA-T01 — 驗收 AC1：正常觸發流程 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | Notion 主表有新資料，Tasks_To_Open 含 2 行任務 |
| 步驟 | 1. 開啟 Notion 主表，確認測試資料 `Jira_Epic_Key` 為空 <br>2. `Tasks_To_Open` 填入：<br>`[Backend] 測試任務 A｜TDD: 應該_測試A_當條件X時`<br>`[DevOps] 測試任務 B｜TDD: 應該_測試B_當條件Y時` <br>3. 將 Status 改為 `Ready to Plan` <br>4. 等待最多 1 分鐘（n8n Poll 週期） |
| 預期結果 | Jira ASUS 看板出現 2 張 Task 票，票號 ASUS-N 與 ASUS-N+1，票面含完整 TDD DoD |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T02 — 驗收 AC2：Jira Key 回填 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T01 通過後 |
| 步驟 | 1. 開啟 Notion 主表，找到 `qa-test-phase2` 資料 <br>2. 檢查 `Jira_Epic_Key` 欄位 |
| 預期結果 | `Jira_Epic_Key` 欄位被自動填入 Jira 票號（如 `ASUS-3`） |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T03 — 驗收 AC3：Hugo 文件同步 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T01 通過後 |
| 步驟 | 1. 開啟檔案總管，確認路徑：<br>`awtw-short-url-service\hugo-docs\content\docs\qa-test-phase2.md` <br>2. 開啟檔案，確認 Front Matter |
| 預期結果 | 檔案存在，Front Matter 含正確 `title` 與 `weight`，內文為 Tasks_To_Open 原始內容 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T04 — 驗收 AC4：空任務保護 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | 新增一筆 Notion 資料，Tasks_To_Open 故意留空 |
| 步驟 | 1. Notion 主表新增一筆資料（Slug: `qa-empty-test`），`Tasks_To_Open` 留空 <br>2. Status 改為 `Ready to Plan` <br>3. 等待 1 分鐘後，到 n8n Executions 查看執行記錄 |
| 預期結果 | Jira 看板無新票，n8n Executions 顯示執行成功（非錯誤），log 含「Tasks_To_Open 為空」 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T05 — 驗收 AC5：冪等保護 ⬜

| 項目 | 內容 |
|------|------|
| 情境 | QA-T02 通過後，`Jira_Epic_Key` 已有值 |
| 步驟 | 1. 記下 Jira 目前 ASUS 看板的票數 <br>2. 將 QA-T01 的測試資料 Status 改回 `Draft`，再改為 `Ready to Plan` <br>3. 等待 1 分鐘 |
| 預期結果 | Jira 看板票數不增加，n8n Executions 顯示執行成功，log 含「已有 Jira_Epic_Key，跳過」 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

## 整體驗收結論

| AC | 項目 | 結果 |
|----|------|------|
| AC1 | 正常觸發流程 | ⬜ |
| AC2 | Jira Key 回填 | ⬜ |
| AC3 | Hugo 文件同步 | ⬜ |
| AC4 | 空任務保護 | ⬜ |
| AC5 | 冪等保護 | ⬜ |

全部 Pass 後，Phase 2 驗收完成，可進入 Phase 3。
Phase 2 完成後，send_spec.py 的 AC4/AC5（Phase 1 遺留）也可一併補驗。

---

## Notion 開票格式

> ⚠️ Phase 2 的 QA 任務是驗收管線本身，留存備用。

```
[QA] 驗收正常觸發流程（AC1）｜TDD: 應該_自動觸發並建立2張Jira票_當Status改為ReadyToPlan時
[QA] 驗收 Jira Key 回填（AC2）｜TDD: 應該_回填JiraKey到Notion_當Jira票建立成功時
[QA] 驗收 Hugo 文件同步（AC3）｜TDD: 應該_成功寫入md檔案_當FrontMatter組裝正確時
[QA] 驗收空任務保護（AC4）｜TDD: 應該_中止workflow_當Tasks_To_Open為空時
[QA] 驗收冪等保護（AC5）｜TDD: 應該_跳過workflow_當Jira_Epic_Key已有值時
```
