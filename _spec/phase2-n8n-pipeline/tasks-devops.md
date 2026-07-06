# Phase 2 — n8n 自動化管線：DevOps 任務清單

> ⬜ 待執行　✅ 已完成
> **注意**：本 Phase 任務是「建立管線本身」，尚無法用管線自動開票，直接用此文件勾選追蹤。
>
> **2026-07-06 更新**：以下狀態已對照實際 `n8n-workflows/asus-notion-to-jira-hugo.json`（39 節點）核實補上，內容本身跟實際節點大致仍對得起來，只有 T03 改用 Schedule Trigger 輪詢 + Notion Query（而非原生 Notion Trigger 節點）；管線本身完整的架構翻修記錄見 `_note/decisions.md`「ADW 架構翻修」條目，Backend 對應任務清單已依實際架構重寫（`tasks-backend.md`）。

---

## 前置閱讀

執行前必讀：
- `_spec/phase2-n8n-pipeline/spec.md`
- `_spec/phase2-n8n-pipeline/design.md`
- `_rule/workflow.md`

環境需求：
- n8n 容器已啟動（`http://localhost:5678` 可存取）
- Notion Internal Integration Token 已取得
- Jira API Token 已取得（`https://id.atlassian.com/manage-profile/security/api-tokens`）

---

## Phase 0 — n8n Credential 設定（~30min）

### T01 — 設定 Notion Credential ✅

在 n8n 介面操作：
1. 左側選單 → Credentials → Add Credential
2. 搜尋「Notion API」
3. 填入 Internal Integration Token
4. 命名為 `Notion - ASUS`，儲存並測試連線

**TDD DoD**
- 測試命名：`應該_成功連線Notion_當Token正確時`
- 🔴 紅燈：未設定前，Notion 節點顯示「No credentials」
- 🟢 綠燈：設定後，n8n Credential 頁面顯示 `Notion - ASUS` 連線測試通過
- 覆蓋率：n8n UI 驗證

**完成定義**：`Notion - ASUS` Credential 連線測試顯示綠色勾勾

---

### T02 — 設定 Jira Credential ✅

**依賴**：無（可與 T01 並行）

在 n8n 介面操作：
1. Add Credential → 搜尋「Jira Software」
2. 填入：
   - **Host**：`https://prostyliu.atlassian.net`
   - **Email**：你的 Atlassian 帳號 Email
   - **API Token**：從 `https://id.atlassian.com/manage-profile/security/api-tokens` 取得
3. 命名為 `Jira - ASUS`，儲存並測試連線

**TDD DoD**
- 測試命名：`應該_成功連線Jira_當APIToken正確時`
- 🔴 紅燈：未設定前，Jira 節點顯示「No credentials」
- 🟢 綠燈：設定後，n8n Credential 頁面顯示 `Jira - ASUS` 連線測試通過
- 覆蓋率：n8n UI 驗證

**完成定義**：`Jira - ASUS` Credential 連線測試顯示綠色勾勾

---

## Phase 1 — Workflow 節點建置（~2h，依 Backend tasks 順序配合）

### T03 — 建立 Notion Trigger 節點 ✅（改為 Schedule Trigger + Query，非 Notion Trigger 節點，見下方備註）

**依賴**：T01

在 n8n 新建 Workflow，命名為 `ASUS - Notion to Jira & Hugo`：
1. 新增 Notion Trigger 節點
2. Credential 選 `Notion - ASUS`
3. Database 選「功能規格總表」
4. Poll 間隔：1 分鐘
5. 連線到後續 IF 節點（由 Backend T01 建立）

**TDD DoD**
- 測試命名：`應該_正確觸發workflow_當Notion主表有新資料時`
- 🔴 紅燈：Trigger 節點未啟用前，手動 Test Trigger 無回應
- 🟢 綠燈：Test Trigger 後，n8n 顯示 Notion 主表最新一筆資料的 JSON
- 覆蓋率：n8n Test Trigger 驗證

**完成定義**：Test Trigger 成功取得 Notion 主表資料

---

### T04 — 建立 Write File 節點（分流 B 終點）✅

**依賴**：Backend T06

新增 Write Binary File 節點：
1. 接在「組裝 Front Matter」Code Node 之後
2. File Path 設為：`/data/projects/awtw-short-url-service/hugo-docs/content/docs/{{ $json.slug }}.md`
3. File Content 設為：`{{ $json.content }}`
4. 使用 Test Step 驗證寫入結果

**TDD DoD**
- 測試命名：`應該_成功寫入md檔案_當FrontMatter組裝正確時`
- 🔴 紅燈：Test Step 前，`hugo-docs/content/docs/` 無對應 `.md` 檔案
- 🟢 綠燈：Test Step 後，目錄下出現正確命名的 `.md` 檔案，內容含 Front Matter
- 覆蓋率：檔案系統驗證

**完成定義**：`hugo-docs/content/docs/test-slug.md` 存在且 Front Matter 格式正確

---

### T05 — 匯出 Workflow JSON 並版控 ✅（實際檔名為 `asus-notion-to-jira-hugo.json`，2026-07-05 ADW→ASUS 更名決策一併套用）

**依賴**：所有節點建置完成，Workflow 啟用後

1. n8n 介面：Workflow → Download（匯出 JSON）
2. 儲存至 `awtw-short-url-service/n8n-workflows/asus-notion-to-jira-hugo.json`
3. git commit

**TDD DoD**
- 測試命名：`應該_能從JSON還原Workflow_當匯出檔案完整時`
- 🔴 紅燈：匯出前，`n8n-workflows/` 目錄不存在
- 🟢 綠燈：匯出後，JSON 檔案可成功匯入 n8n 並還原所有節點
- 覆蓋率：匯入測試驗證

**完成定義**：`n8n-workflows/adw-notion-to-jira-hugo.json` 已版控，可成功匯入還原

---

## Notion 開票格式

> ⚠️ Phase 2 的 DevOps 任務是在「建立」開票管線本身，尚無法用管線自動開票，留存備用。

```
[DevOps] 設定 Notion Credential｜TDD: 應該_成功連線Notion_當Token正確時
[DevOps] 設定 Jira Credential｜TDD: 應該_成功連線Jira_當APIToken正確時
[DevOps] 建立 Notion Trigger 節點｜TDD: 應該_正確觸發workflow_當Notion主表有新資料時
[DevOps] 建立 Write File 節點｜TDD: 應該_成功寫入md檔案_當FrontMatter組裝正確時
[DevOps] 匯出 Workflow JSON 版控｜TDD: 應該_能從JSON還原Workflow_當匯出檔案完整時
```
