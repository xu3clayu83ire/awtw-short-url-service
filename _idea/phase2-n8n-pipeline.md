# 需求草稿：n8n 自動化分流管線配置

> 放置於 `adw/_idea/phase2-n8n-pipeline.md`
> 觸發指令：`/addyosmani-spec adw/_idea/phase2-n8n-pipeline.md`

---

## 背景與動機

這是 ASUS 系統的核心自動化引擎。
當規格文件進入 Notion 且狀態改為「Ready to Plan」時，
n8n 必須自動把工作分流到兩個方向：
一路去 Jira 開票，一路把規格同步成 Hugo Book 的靜態 Markdown 文件。
這個階段消滅所有手動開票與手動維護文件的重複勞動。

---

## 前置條件（Phase 1 完成後才能進行）

- n8n 本地容器已啟動，`/data/projects` 掛載完成
- Notion 三張資料庫已建立
- Jira 專案已建立（專案代號：ASUS）
- n8n 已完成 Notion 與 Jira 的 Credential 設定

---

## 目標

建立一條完整的 n8n 工作流，包含：

1. **Notion Trigger**：監聽【功能規格總表】的 `Status` 欄位，當改為 `Ready to Plan` 時觸發
2. **分流 A（Jira 批次切單）**：
   - 讀取 `Tasks_To_Open` 欄位，依換行符切成陣列
   - 每一行自動在 Jira 建立一張 Task 票
   - 票面 Description 自動組裝，包含 TDD 完成定義（DoD）格式
   - 開票完成後，將 Jira Epic Key 回填到 Notion 的 `Jira_Epic_Key` 欄位
3. **分流 B（Hugo Book 同步）**：
   - 讀取 Notion 的屬性（Name、Slug、Weight）與內文
   - 組裝符合 Hugo Book 規範的 Front Matter 標頭
   - 透過 Write File 節點，把 `.md` 檔案寫入本地掛載目錄

---

## Tasks_To_Open 欄位格式規範

每行格式：`[類型] 任務標題｜TDD: 測試命名`

範例：
```
[Backend] 實作 POST /api/shorten｜TDD: 應該_成功產生短網址_當輸入合法URL時
[Backend] 實作 GET /:code 轉址｜TDD: 應該_成功轉址_當短碼存在時
[Infra] 建立 DynamoDB Table schema｜TDD: 應該_成功寫入並讀取資料_當Schema正確時
```

---

## Jira 票面自動組裝格式

n8n 切割後，每張 Jira Task 的 Description 自動填入：

```
## 任務說明
{{任務標題（｜左邊的部分）}}

## TDD 完成定義 (DoD)
- [ ] 測試命名：`{{TDD 命名（｜右邊的部分）}}`
- [ ] 🔴 紅燈：測試必須先 Fail，截圖或終端機輸出為憑
- [ ] 🟢 綠燈：實作後測試 Pass，覆蓋率 100%
- [ ] 🔵 藍燈：重構完成，git commit 已執行

## 規格來源
- Notion：{{Notion 頁面 URL}}
- GitLab Spec：{{Spec_URL 欄位值}}
```

---

## 技術限制

- n8n 節點語言：JavaScript
- Jira 連線：使用 n8n 內建的 Jira Software node（REST API v3）
- Notion 連線：使用 n8n 內建的 Notion node
- 檔案寫入路徑：`/data/projects/xamuth-docs/content/docs/xamuthapp/{{slug}}.md`
- 所有 JavaScript 節點設定為 `Run Once for Each Item` 模式

---

## 範圍邊界

**做：**
- Notion Trigger 節點設定（含過濾條件）
- 分流 A：JavaScript 切割任務 + Jira 批次開票 + 回填 Jira Key 至 Notion
- 分流 B：JavaScript 組裝 Hugo Front Matter + Write File 節點
- 錯誤處理：Tasks_To_Open 為空時中斷並記錄 log
- n8n 工作流 JSON 匯出，版控於 GitLab

**不做：**
- Jira Webhook 監聽（這是 Phase 3 的範圍）
- Claude API 呼叫（這是 Phase 3 的範圍）
- 任何前端 UI

---

## 驗收條件

1. 在 Notion 主表新增一筆測試資料，填好 `Tasks_To_Open`（至少 2 行任務），Status 改為 `Ready to Plan`
2. n8n 工作流自動觸發，Jira 看板出現對應數量的 Task 票，票面包含完整的 TDD DoD 格式
3. 本地 Hugo Book 目錄下出現對應的 `.md` 檔案，Front Matter 內容正確
4. Notion 的 `Jira_Epic_Key` 欄位被自動回填
5. `Tasks_To_Open` 為空時，n8n 不開票、不報錯，寫入 log 後靜默結束
