# Phase 1 — 本地基礎設施：Backend 任務清單

> ⬜ 待執行　✅ 已完成
> **Phase 1 特別說明**：Jira 尚未建置，本 Phase 直接用此文件勾選追蹤，不走自動化開票流程。

---

## 前置閱讀

執行前必讀：
- `_spec/phase1-infrastructure/spec.md`
- `_spec/phase1-infrastructure/design.md`
- `_rule/workflow.md`（Commit 格式規範）
- `_rule/coding-style.md`（函式長度、命名規則）

環境需求：
- Python 3.13（`py` 指令可用）
- `pip install requests python-dotenv pytest pytest-mock`
- Notion 帳號已建立，Internal Integration Token 已取得

---

## Phase 0 — Notion 資料庫建置（~1h，人工操作）

### T01 — 建立 Notion 三張資料庫並設定欄位 ⬜

依照 design.md 的資料模型，**在 Notion 手動操作**：

**主表【功能規格總表】** — 8 個欄位：
| 欄位名稱 | 型態 |
|---------|------|
| Name | Title |
| Status | Status（選項：Draft / Ready to Plan / In Dev / Done） |
| Slug | Text |
| Weight | Number |
| Tasks_To_Open | Text |
| Jira_Epic_Key | Text |
| Spec_URL | URL |
| Deploy_URL | URL |

**子表 A【架構決策紀錄】** — 建立後與主表設定雙向 Relation
**子表 B【Bug 追蹤池】** — 建立後與主表設定雙向 Relation

**TDD DoD**
- 測試命名：`應該_正確建立三張資料庫與Relation_當Notion設定完成時`
- 🔴 紅燈：建立前，Notion 工作區中不存在上述三張資料庫
- 🟢 綠燈：建立後，手動新增一筆主表資料，Relation 欄位可正確連結子表
- 覆蓋率：人工驗證（Notion 介面操作）

**完成定義**：三張資料庫欄位與型態符合規範，主表與兩張子表的 Relation 雙向連結正常

---

## Phase 1 — send_spec.py 實作（~2h）

### T02 — 實作 Notion 查詢冪等檢查函式 ⬜

**依賴**：T01

在 `awtw-short-url-service/send_spec.py` 實作：
```python
def check_slug_exists(notion_token: str, database_id: str, slug: str) -> bool
```
- 呼叫 Notion Query API，過濾 `Slug == slug`
- 回傳 True（已存在）或 False（不存在）
- 錯誤時拋出含繁體中文上下文的例外

**TDD DoD**
- 測試命名：`應該_回傳True_當Notion中已存在相同Slug時`、`應該_回傳False_當Notion中不存在該Slug時`
- 🔴 紅燈：pytest 執行 `test_check_slug_exists.py`，因函式未實作而 Fail
- 🟢 綠燈：實作後，mock Notion API 回應，兩個測試案例均 Pass
- 單元測試覆蓋率 100%

**完成定義**：`py -m pytest tests/test_check_slug_exists.py -v` 全部通過

---

### T03 — 實作 send_spec.py 主流程 ⬜

**依賴**：T02

完成 `send_spec.py` 完整邏輯：
1. 解析命令列引數（功能名稱、slug、weight、spec_md 路徑）
2. 讀取 spec.md 內容
3. 呼叫 `check_slug_exists()`，已存在則輸出提示並 exit 0
4. 組裝 JSON Payload 並 POST 到 n8n Webhook URL
5. HTTP 200 → 輸出成功訊息，exit 0；非 200 → 輸出錯誤，exit 1

從 `.env` 讀取：`N8N_WEBHOOK_URL`、`NOTION_TOKEN`、`NOTION_DATABASE_ID`

**TDD DoD**
- 測試命名：`應該_成功推送規格並輸出成功訊息_當Webhook回傳200時`、`應該_跳過推送並輸出已存在_當Slug已在Notion中時`、`應該_輸出錯誤並exit1_當Webhook回傳非200時`
- 🔴 紅燈：pytest 三個測試案例均 Fail
- 🟢 綠燈：實作後，mock requests 與 Notion API，三個案例均 Pass
- 單元測試覆蓋率 100%

**完成定義**：`py -m pytest tests/test_send_spec.py -v` 全部通過

---

### T04 — 建立 .env.example 與執行說明 ⬜

**依賴**：T03

在 `awtw-short-url-service/` 建立：
- `.env.example`（版控）：
  ```
  N8N_WEBHOOK_URL=http://localhost:5678/webhook/<your-webhook-id>
  NOTION_TOKEN=<your-notion-integration-token>
  NOTION_DATABASE_ID=<your-main-table-database-id>
  ```
- 確認 `.env` 加入 `.gitignore`

**TDD DoD**
- 測試命名：`應該_不洩漏機敏資訊_當.env被gitignore時`
- 🔴 紅燈：`.env` 未加入 `.gitignore` 前，`git status` 顯示為 untracked
- 🟢 綠燈：加入後，`git status` 不顯示 `.env`
- 覆蓋率：指令驗證

**完成定義**：`.env.example` 已版控，`.env` 不出現在 `git status`

---

## Notion 開票格式

> ⚠️ Phase 1 特別說明：Jira 尚未建置，以下格式**暫不執行**，供 Phase 2 完成後參考格式使用。

```
[Backend] 建立 Notion 三張資料庫與 Relation 設定｜TDD: 應該_正確建立三張資料庫與Relation_當Notion設定完成時
[Backend] 實作 Notion 查詢冪等檢查函式｜TDD: 應該_回傳True_當Notion中已存在相同Slug時
[Backend] 實作 send_spec.py 主流程｜TDD: 應該_成功推送規格並輸出成功訊息_當Webhook回傳200時
[Backend] 建立 .env.example 與 gitignore 設定｜TDD: 應該_不洩漏機敏資訊_當.env被gitignore時
```
