# 需求草稿：本地基礎設施與 Notion 資料庫建置

> 放置於 `adw/_idea/phase1-infrastructure.md`
> 觸發指令：`/addyosmani-spec adw/_idea/phase1-infrastructure.md`

---

## 背景與動機

我正在建立一套「AI 驅動自動化開發工作流（ADW）」。
這是整個系統的第零與第一階段，必須先把本地執行環境與資料中樞建好，
後續所有自動化管線、AI 代理人都依賴這個基礎。

---

## 這個階段要解決的問題

1. 目前所有開發規格、任務、決策都散落在各處，沒有單一的「真相來源」
2. 需要一個能被程式讀取與觸發的自動化引擎（n8n），且必須跑在本地，不能把程式碼送到外部服務
3. 需要一個能靜態產出技術文件的系統（Hugo Book），讓規格文件可以被版控與部署

---

## 目標

- 在本地透過 Docker Compose 建立 n8n 自動化引擎，掛載本地專案目錄
- 在本地初始化 Hugo Book 靜態文件站，套用 hugo-book 主題
- 在 Notion 建立三張資料庫：主表（功能規格總表）、子表 A（架構決策紀錄）、子表 B（Bug 追蹤池）
- 建立一支 `send_spec.sh` 腳本，能把本地產出的 Markdown 規格推入 Notion

---

## 技術限制與環境

- 作業系統：macOS
- 本地專案根目錄：`/Users/xamuth/projects`
- Docker 已安裝
- Node.js 已安裝（用於 JSON 轉義）
- n8n 版本：穩定版（docker.n8n.io/n8nio/n8n）
- Hugo Book 主題透過 Git Submodule 引入
- Notion 帳號已建好，使用 Notion API（Internal Integration Token）

---

## Notion 主表【功能規格總表】必要欄位

| 欄位名稱 | 型態 | 用途 |
|---|---|---|
| Name | Title | 功能名稱，例如「【規格】個人縮網址服務」 |
| Status | Status | Draft / Ready to Plan / In Dev / Done |
| Slug | Text | Hugo 檔名與網址，例如 `short-url-service` |
| Weight | Number | Hugo 左側選單排序，數字越小越靠上 |
| Tasks_To_Open | Text | 每行一張 Jira 票的描述，供 n8n 讀取切單 |
| Jira_Epic_Key | Text | n8n 開票後回填的 Epic 票號 |
| Spec_URL | URL | GitLab 上 spec.md 的連結 |
| Deploy_URL | URL | CloudFront 部署後的文件站網址 |

---

## 範圍邊界

**做：**
- docker-compose.yml（n8n 容器 + Volume Mount）
- Hugo Book 初始化腳本與設定
- Notion 三張資料庫的欄位建置規範文件（含 Relation 設定）
- send_spec.sh 腳本（讀取本地 Markdown → POST 到 n8n Webhook）
- 環境驗證 Checklist（可手動逐項確認）

**不做：**
- n8n 工作流內部節點設定（這是 Phase 2 的範圍）
- Notion 頁面內容填寫（這是 Phase 3 的範圍）
- 任何雲端部署（這是 Phase 5 的範圍）

---

## 驗收條件

1. `docker compose up -d` 後，瀏覽器可開啟 `http://localhost:5678` 並完成 n8n 帳號建立
2. Hugo 執行 `hugo server` 後，瀏覽器可預覽文件站
3. Notion 三張資料庫建立完成，欄位與型態符合規範，Relation 雙向連結正常
4. 執行 `./send_spec.sh "測試功能" "test-slug" 99 "_spec/test/spec.md"` 後，n8n Webhook 回傳 HTTP 200，Notion 主表新增一筆資料
