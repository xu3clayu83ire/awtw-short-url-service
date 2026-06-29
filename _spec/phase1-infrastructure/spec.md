# Phase 1 — 本地基礎設施與 Notion 資料庫建置：規格文件

> 閱讀對象：PM、全員
> 產出工具：/addyosmani-saspec

---

## 需求理解

本階段目標是在進行任何自動化開發前，先把「地基」搭好。具體來說有三件事：
1. 用 Docker Compose 在本地跑起 n8n，掛載專案目錄，讓後續 Phase 的 n8n 工作流可以讀寫本地檔案
2. 初始化 Hugo Book 靜態文件站，讓規格文件可以版控並最終部署
3. 在 Notion 建好三張資料庫（主表 + 兩張子表），並寫一支 `send_spec.py` 腳本，讓本地產出的 Markdown 規格能自動推入 Notion

本 Phase **不碰任何自動化流程邏輯**，只確保環境可以跑、Notion 資料庫結構正確、腳本能打通 n8n Webhook。

---

## 功能清單

| # | 功能項目 | 負責角色 |
|---|---------|---------|
| F1 | Docker Compose 啟動 n8n 容器，掛載工作區根目錄至容器 `/data/projects` | DevOps |
| F2 | Hugo Book 初始化（含 hugo-book 主題 Git Submodule 引入） | DevOps |
| F3 | Notion 主表【功能規格總表】建立（8 個欄位，含 Status、Tasks_To_Open 等） | Backend |
| F4 | Notion 子表 A【架構決策紀錄】建立，與主表建立 Relation | Backend |
| F5 | Notion 子表 B【Bug 追蹤池】建立，與主表建立 Relation | Backend |
| F6 | `send_spec.py` 腳本：讀取本地 Markdown → POST 到 n8n Webhook → Notion 主表新增一筆 | Backend |
| F7 | 環境驗證 Checklist（逐項可手動確認） | QA |

---

## 非功能需求

- **安全性**：Notion Integration Token 不得寫入版控，存放於 `.env` 檔（加入 `.gitignore`）
- **可攜性**：docker-compose.yml 使用 `${WORKSPACE_ROOT}` 環境變數，避免 hardcode 個人路徑
- **冪等性**：`send_spec.py` 重複執行不應在 Notion 重複建立同名 Slug 資料

---

## 範圍邊界

**本 Phase 做：**
- `n8n/docker-compose.yml`（n8n 容器 + Volume Mount）
- Hugo Book 初始化腳本與 `config.toml` 設定
- Notion 三張資料庫的欄位規範文件（含 Relation 雙向設定說明）
- `send_spec.py` 腳本（Python 3.13）
- 環境驗證 Checklist

**本 Phase 不做：**
- n8n 工作流內部節點設定（Phase 2）
- Notion 頁面內文填寫（Phase 3）
- 任何雲端部署（Phase 5）
- n8n Credential 設定（Phase 2 前置步驟）

---

## 驗收條件

| # | 情境 | 操作 | 預期結果 |
|---|------|------|---------|
| AC1 | n8n 容器啟動 | 在 `n8n/` 目錄執行 `docker compose up -d` | 瀏覽器開啟 `http://localhost:5678`，可完成 n8n 帳號建立 |
| AC2 | Hugo Book 預覽 | 執行 `hugo server` | 瀏覽器可預覽文件站首頁，無錯誤 |
| AC3 | Notion DB 結構 | 手動開啟 Notion | 三張資料庫欄位與型態符合規範，Relation 雙向連結正常 |
| AC4 | send_spec.py 正常流程 | 執行 `py send_spec.py "測試功能" "test-slug" 99 "_spec/test/spec.md"` | n8n Webhook 回傳 HTTP 200，Notion 主表新增一筆資料 |
| AC5 | send_spec.py 重複執行 | 連續執行兩次相同參數 | Notion 主表不重複建立同名 Slug 資料 |
