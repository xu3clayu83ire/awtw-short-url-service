# Phase 1 — 本地基礎設施：DevOps 任務清單

> ⬜ 待執行　✅ 已完成
> **Phase 1 特別說明**：Jira 尚未建置，本 Phase 直接用此文件勾選追蹤，不走自動化開票流程。

---

## 前置閱讀

執行前必讀：
- `_spec/phase1-infrastructure/spec.md`
- `_spec/phase1-infrastructure/design.md`
- `_rule/workflow.md`（Commit 格式規範）

環境需求：
- Docker Desktop for Windows 已安裝並啟動
- Git 已安裝
- Hugo 已安裝（`winget install Hugo.Hugo.Extended`）

---

## Phase 0 — n8n 容器建置（~1h）

### T01 — 建立 n8n 目錄與 docker-compose.yml ⬜

在 `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\n8n\` 建立 `docker-compose.yml`，內容依 design.md 規格：
- n8n 穩定版映像
- port 5678 對外
- Basic Auth 啟用
- Volume：`n8n_data` 持久化設定檔、`${WORKSPACE_ROOT}` 掛載至 `/data/projects`

**TDD DoD**
- 測試命名：`應該_成功啟動n8n容器_當docker-compose設定正確時`
- 🔴 紅燈：執行 `docker compose up -d` 前，`curl http://localhost:5678` 應回傳連線失敗
- 🟢 綠燈：執行後，`curl http://localhost:5678` 回傳 HTTP 200，瀏覽器可開啟登入頁
- 覆蓋率：人工驗證（基礎設施測試）

**完成定義**：`docker compose up -d` 成功，瀏覽器開啟 `http://localhost:5678` 可進入 n8n 登入畫面

---

### T02 — 建立 .env 範本與設定說明文件 ⬜

**依賴**：T01

在 `n8n/` 目錄建立：
- `.env.example`（版控）：含 `WORKSPACE_ROOT`、`N8N_USER`、`N8N_PASSWORD` 欄位說明
- `.env`（不版控）：實際填入值
- 確認 `.gitignore` 已排除 `.env`

**TDD DoD**
- 測試命名：`應該_不洩漏機敏資訊_當.env被gitignore時`
- 🔴 紅燈：`git status` 顯示 `.env` 為 untracked（尚未加入 `.gitignore`）
- 🟢 綠燈：加入 `.gitignore` 後，`git status` 不顯示 `.env`
- 覆蓋率：指令驗證

**完成定義**：`.env.example` 已版控，`.env` 不出現在 `git status`

---

## Phase 1 — Hugo Book 初始化（~1h）

### T03 — 初始化 Hugo Book 專案並引入主題 ✅

在 `awtw-short-url-service\hugo-docs\` 執行：
1. `hugo new site hugo-docs`
2. 以 Git Submodule 引入 hugo-book 主題，鎖定特定 commit hash（不用 latest）
3. 確認 `themes/hugo-book/` 目錄存在

**TDD DoD**
- 測試命名：`應該_成功載入hugo-book主題_當submodule初始化完成時`
- 🔴 紅燈：未執行 `git submodule update --init` 前，`hugo server` 報錯找不到主題
- 🟢 綠燈：執行後，`hugo server` 啟動無錯誤
- 覆蓋率：指令驗證

**完成定義**：`hugo server` 執行後，`http://localhost:1313` 可正常預覽文件站首頁

---

### T04 — 設定 config.toml ✅

**依賴**：T03

設定 `hugo-docs/config.toml`：
- `theme = "hugo-book"`
- `title`、`baseURL`（本地開發用 `http://localhost:1313`）
- 啟用左側目錄自動產生（`BookMenuFromFiles = true`）
- 設定 `content/docs/` 作為文件根目錄

**TDD DoD**
- 測試命名：`應該_正確顯示站台標題與目錄結構_當config.toml設定完成時`
- 🔴 紅燈：`config.toml` 為預設值時，主題不完整顯示
- 🟢 綠燈：設定後，`hugo server` 顯示正確標題與左側目錄
- 覆蓋率：瀏覽器人工驗證

**完成定義**：`http://localhost:1313` 顯示正確站台標題，左側目錄結構正常

---

## Notion 開票格式

> ⚠️ Phase 1 特別說明：Jira 尚未建置，以下格式**暫不執行**，供 Phase 2 完成後參考格式使用。

```
[DevOps] 建立 n8n docker-compose.yml｜TDD: 應該_成功啟動n8n容器_當docker-compose設定正確時
[DevOps] 建立 .env 範本與 gitignore 設定｜TDD: 應該_不洩漏機敏資訊_當.env被gitignore時
[DevOps] 初始化 Hugo Book 並引入主題 Submodule｜TDD: 應該_成功載入hugo-book主題_當submodule初始化完成時
[DevOps] 設定 Hugo config.toml｜TDD: 應該_正確顯示站台標題與目錄結構_當config.toml設定完成時
```
