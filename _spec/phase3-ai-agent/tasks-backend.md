# Phase 3 — AI 開發代理人：Backend 任務清單

> ⬜ 待執行　✅ 已完成
>
> **2026-07-06 重寫說明**：這份文件是原始逐節點設計（`tasks-backend-original-design.md`）的替代版本。原始設計把「Jira 觸發 AI 開發」拆成 14 個獨立小節點依序建置，實際開發過程中經過大量實測抓 bug（見下方「異動原因」），最終落地為**單一個 n8n workflow**：`n8n-workflows/asus-dev-workflow.json`（37 個節點）。這份文件記錄「實際做出來的功能」，不是可以逐條勾選施工進度的清單。

---

## 已完成功能

### 票面解析 ✅
- Webhook 接收 Jira `In Progress` 事件（節點 `Webhook`），只處理狀態確實變成 `In Progress` 的事件
- 解析票面（節點 `解析票面`）：從 Description 解析 `ExecMode`（判斷 AI/手動，手動票直接跳過不觸發 Claude API）、`Slug`、`TaskId`（`<slug>#<sourceFile>#<taskId>` 格式）、`測試命名`（TDD DoD）——比原始設計多解析 `sourceFile`，用來解決同編號任務跨檔案（backend/devops/qa）互相打架的問題

### 讀取規格與任務內容 ✅
- 讀取 `spec.md`／`design.md`／`package.json`（依票面動態組路徑，非原始設計的固定路徑）
- 讀取 `tasks-backend.md`／`tasks-devops.md`／`tasks-qa.md`，用票面明確指定的 `sourceFile` 直接定位對應檔案（節點 `擷取任務區塊`），不再依序猜測

### 組裝 Prompt 與呼叫 Claude API ✅
- System Prompt 動態帶入目前 `package.json` 已安裝的依賴清單，要求優先使用既有依賴（節點 `組裝 Prompt`）
- 明確要求 JSON 輸出格式、`additional_dependencies` 欄位、`impl_file_path` 必須是任務實際交付檔案本身（不可包一層驗證模組）、識別字不可有空白、巢狀 JSON 需正確跳脫
- `max_tokens: 8192`，並偵測 `stop_reason === 'max_tokens'` 截斷情況
- 解析回應（節點 `解析回應`）：`impl_file_path` 缺失時從測試檔 import 路徑自動推斷，避免因單一欄位缺失整個中止

### TDD 紅綠燈執行與防呆 ✅
- `git checkout` 失敗會中止並保留 Jira `In Progress`，不會讓後續步驟用錯誤的分支狀態繼續跑
- 紅燈/綠燈確認前都有「環境錯誤偵測」，區分「測試斷言正確失敗」跟「環境根本跑不起來」（缺套件、指令不存在、語法轉譯失敗等），避免假紅燈/假綠燈
- 新增「TDD 阻斷」防呆：若紅燈階段測試意外一次就通過（代表功能可能已經被別的任務完成），中止並要求人工確認，不會產生誤導性的 commit
- 綠燈確認是原本完全缺失的閘門，測試沒有真的通過就不會 commit

### PR 建立與 Jira 回寫 ✅
- 綠燈通過後 `git commit` → 建立 GitHub PR → 查詢 Jira 可用 transition → 更新 Jira 狀態為 In Review
- 回寫 `tasks-*.md` 對應任務的 ⬜→✅（節點 `回寫任務狀態`），只改狀態圖示，不重複加註已經在開票階段寫入的票號

---

## 異動原因（對照 `_note/decisions.md`）

| 原始設計缺口 | 對應決策 |
|---|---|
| `summary`／`git checkout` 失敗／`max_tokens` 太小三個連鎖 bug | `asus-dev-workflow 實測發現的三個連鎖 bug` |
| Agent Runner 跟工程師共用工作目錄 | `Agent Runner 獨立工作目錄（git worktree）` |
| TaskId 跨檔案同編號互相打架 | `TaskId 加上 sourceFile` |
| 假紅燈/假綠燈（缺套件、無綠燈判斷閘門） | `additional_dependencies 自動安裝 + 紅綠燈環境錯誤偵測` |
| `impl_file_path` 偶爾缺欄位 | `impl_file_path 缺失時從測試檔 import 自動推斷` |
| 環境錯誤偵測誤判正常 TDD 紅燈 | `修正環境錯誤偵測誤判正常 TDD 紅燈` |
| `impl_file_path` 被寫成驗證模組而非交付檔案 | `impl_file_path 必須是任務實際交付檔案` |
| 排程與 Jira 觸發共用 worktree 互踩 | `asus-dev-workflow 改用獨立 worktree` |
| HTTP body chunk 解碼造成字元損毀 | `修正 Agent Runner HTTP body 逐 chunk 解碼造成的多位元組字元損毀` |
| Claude 生成識別字帶空白、巢狀 JSON 未跳脫 | `n8n-workflows/asus-dev-workflow.json` System Prompt 直接補充規則，未另立決策條目 |

---

## 參考

- 完整節點清單、每個節點的 JS 邏輯：`n8n-workflows/asus-dev-workflow.json`
- 決策脈絡與實測過程：`_note/decisions.md`
- 原始逐節點設計（僅供歷史對照，不代表現況）：`tasks-backend-original-design.md`
