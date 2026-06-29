# Phase 1 — 本地基礎設施：QA 驗收任務清單

> ⬜ 待執行　✅ 已完成
> **執行時機**：DevOps 與 Backend 所有任務的 ⬜ 全部變為 ✅ 後才執行
> **Phase 1 特別說明**：Jira 尚未建置，本 Phase 直接用此文件勾選追蹤，不走自動化開票流程。

---

## 前置閱讀

執行前必讀：
- `_spec/phase1-infrastructure/spec.md`（驗收條件 AC1～AC5）
- `_spec/phase1-infrastructure/tasks-devops.md`（確認 DevOps 任務全部 ✅）
- `_spec/phase1-infrastructure/tasks-backend.md`（確認 Backend 任務全部 ✅）

---

## 驗收案例

### QA-T01 — 驗收 AC1：n8n 容器啟動 ⬜

**對應**：spec.md AC1、tasks-devops.md T01、T02

| 項目 | 內容 |
|------|------|
| 情境 | 全新環境，n8n 從未啟動過 |
| 步驟 | 1. 進入 `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\n8n\` <br>2. 確認 `.env` 已填入 `WORKSPACE_ROOT`、`N8N_USER`、`N8N_PASSWORD` <br>3. 執行 `docker compose up -d` <br>4. 瀏覽器開啟 `http://localhost:5678` |
| 預期結果 | 顯示 n8n 登入畫面，可完成帳號建立 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T02 — 驗收 AC2：Hugo Book 本地預覽 ⬜

**對應**：spec.md AC2、tasks-devops.md T03、T04

| 項目 | 內容 |
|------|------|
| 情境 | Hugo Book 已初始化完成 |
| 步驟 | 1. 進入 `awtw-short-url-service\hugo-docs\` <br>2. 執行 `hugo server` <br>3. 瀏覽器開啟 `http://localhost:1313` |
| 預期結果 | 文件站首頁正常顯示，站台標題正確，左側目錄結構存在，無錯誤訊息 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T03 — 驗收 AC3：Notion 資料庫結構 ⬜

**對應**：spec.md AC3、tasks-backend.md T01

| 項目 | 內容 |
|------|------|
| 情境 | Notion 三張資料庫已手動建立 |
| 步驟 | 1. 開啟 Notion，確認【功能規格總表】存在 8 個欄位（Name、Status、Slug、Weight、Tasks_To_Open、Jira_Epic_Key、Spec_URL、Deploy_URL） <br>2. 確認 Status 欄位有四個選項：Draft / Ready to Plan / In Dev / Done <br>3. 確認子表 A【架構決策紀錄】存在，Relation 可連結主表 <br>4. 確認子表 B【Bug 追蹤池】存在，Relation 可連結主表 <br>5. 在主表新增一筆測試資料，嘗試在 Relation 欄位連結子表 |
| 預期結果 | 三張資料庫欄位與型態正確，Relation 雙向連結正常，測試資料可成功建立 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T04 — 驗收 AC4：send_spec.py 正常推送流程 ⬜

**對應**：spec.md AC4、tasks-backend.md T03、T04

| 項目 | 內容 |
|------|------|
| 情境 | Notion DB 已建立，n8n 容器已啟動，`.env` 已設定 |
| 步驟 | 1. 確認 `awtw-short-url-service\.env` 已填入 `N8N_WEBHOOK_URL`、`NOTION_TOKEN`、`NOTION_DATABASE_ID` <br>2. 在 `awtw-short-url-service\` 執行：`py send_spec.py "測試功能" "test-slug-qa" 99 "_spec/phase1-infrastructure/spec.md"` <br>3. 觀察終端機輸出 <br>4. 開啟 Notion 主表確認資料 |
| 預期結果 | 終端機輸出成功訊息，exit code 為 0，Notion 主表出現一筆 Slug 為 `test-slug-qa` 的資料 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

### QA-T05 — 驗收 AC5：send_spec.py 冪等性（重複執行不重複建立） ⬜

**對應**：spec.md AC5、tasks-backend.md T02

| 項目 | 內容 |
|------|------|
| 情境 | QA-T04 已通過，Notion 主表已有 `test-slug-qa` 資料 |
| 步驟 | 1. 再次執行相同指令：`py send_spec.py "測試功能" "test-slug-qa" 99 "_spec/phase1-infrastructure/spec.md"` <br>2. 觀察終端機輸出 <br>3. 開啟 Notion 主表確認資料筆數 |
| 預期結果 | 終端機輸出「已存在，跳過」，Notion 主表 `test-slug-qa` 仍只有一筆資料 |
| 實際結果 | （執行後填寫） |
| Pass / Fail | ⬜ |

---

## 整體驗收結論

| AC | 項目 | 結果 |
|----|------|------|
| AC1 | n8n 容器啟動 | ⬜ |
| AC2 | Hugo Book 預覽 | ⬜ |
| AC3 | Notion DB 結構 | ⬜ |
| AC4 | send_spec.py 正常推送 | ⬜ |
| AC5 | send_spec.py 冪等性 | ⬜ |

全部 Pass 後，Phase 1 驗收完成，可進入 Phase 2。

---

## Notion 開票格式

> ⚠️ Phase 1 特別說明：Jira 尚未建置，以下格式**暫不執行**，供 Phase 2 完成後參考格式使用。

```
[QA] 驗收 n8n 容器啟動（AC1）｜TDD: 應該_成功啟動n8n容器_當docker-compose設定正確時
[QA] 驗收 Hugo Book 本地預覽（AC2）｜TDD: 應該_正確顯示站台標題與目錄結構_當config.toml設定完成時
[QA] 驗收 Notion 資料庫結構（AC3）｜TDD: 應該_正確建立三張資料庫與Relation_當Notion設定完成時
[QA] 驗收 send_spec.py 正常推送（AC4）｜TDD: 應該_成功推送規格並輸出成功訊息_當Webhook回傳200時
[QA] 驗收 send_spec.py 冪等性（AC5）｜TDD: 應該_跳過推送並輸出已存在_當Slug已在Notion中時
```
