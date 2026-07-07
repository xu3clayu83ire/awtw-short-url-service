# ASUS 系統慣例規範

> 本文件僅在使用 ASUS（AI 驅動自動化開發工作流）開發時適用。
> 一般開發規範請參考 `_rule/workflow.md` 與 `_rule/coding-style.md`。

---

## 任務執行方式標注規則

每個任務必須在標題標注執行方式，供 n8n 判斷是否觸發 Claude API。

| 標籤 | 說明 | 適用情境 |
|------|------|---------|
| `[AI]` | ASUS 自動執行，n8n 觸發 Claude API 產出程式碼 | 產出程式碼檔案（TypeScript / YAML / JSON），可用測試驗證 |
| `[手動]` | 人工執行，n8n 收到 Webhook 後靜默略過 | Console/UI 操作、敏感憑證設定、一次性環境初始化、無程式碼產出 |

### 判斷標準

**標注 `[AI]` 的條件（同時符合）：**
- 產出至少一個程式碼檔案（`.ts`、`.yml`、`.json` 等）
- 可用自動化測試驗證結果（單元測試、CI 執行結果）

**標注 `[手動]` 的條件（符合任一）：**
- 操作對象為外部系統 UI（GitHub Settings、AWS Console、n8n Credentials）
- 涉及敏感憑證輸入（API Token、密碼、金鑰）
- 一次性環境初始化（`cdk bootstrap`、`ngrok` 設定）
- 無程式碼產出，僅有設定變更

---

## Notion 開票格式規範

每個任務的開票格式：

```
[角色][執行方式] 任務標題｜TDD: 測試命名
```

範例：
```
[Backend][AI] 實作 POST /api/shorten 短碼產生邏輯｜TDD: 應該_回傳短網址_當URL格式正確
[DevOps][手動] 設定 GitHub Branch Protection Rules｜TDD: 應該_拒絕直接push_當目標為main
```

**角色標籤：** `[Frontend]`、`[Backend]`、`[DevOps]`、`[QA]`

---

## Tasks_To_Open 產出與同步規則（Notion MCP 尚未建立前的替代流程）

Notion 主表「功能規格總表」的 `Tasks_To_Open` 欄位，正常應由 MCP 直接寫入。在 `/mcp` 尚未建立之前，改用本地佇列檔暫存，避免內容遺漏或散落。

**流程：**

1. 每個 phase 的 `tasks-*.md` 產出「Notion 開票格式規範」文字區塊後，立即彙整成一份完整區塊（含全部角色任務，依 tasks-backend.md → tasks-devops.md → tasks-qa.md 順序合併）。
2. 寫入 `_note/notion-tasks-queue.md`，以 phase slug 分節，並標記同步狀態：⬜ 尚未同步 / ✅ 已同步。
3. `/mcp` 建立完成後，依 **Weight 由小到大** 的順序，逐一將佇列中的區塊寫入對應 phase row 的 `Tasks_To_Open` 欄位；每完成一筆就把該區塊改為 ✅ 已同步，並附上同步日期。
4. `_note/notion-tasks-queue.md` 為 Tasks_To_Open 內容的**單一事實來源**。若與 `hugo-docs/content/docs/phaseN-*.md` 的開票文字不一致，以佇列檔為準，並回頭修正 hugo-docs。

---

## 跨 Phase 開票順序保護規則（避免 Jira 依賴混亂）

**問題**：Phase 5 的 Jira 票曾經比 Phase 4 先建立，導致票號大小與 Epic 順序無法反映實際開發依賴關係。

**根因**：開票流程（無論手動或未來 n8n 自動化）若未依 `Weight` 欄位排序處理，或同時對多個 `Status = Ready to Plan` 的 row 觸發，後面的 phase 就可能搶先開票。

**規則：**

0. **開票 workflow 防呆（2026-07-05 起生效）**：主表新增 `前置Phase`（self-relation，指向 Weight 較小的前一個 phase）、`後置Phase`（雙向自動同步）、`前置Jira_Epic_Key`（Rollup，取 `前置Phase` 的 `Jira_Epic_Key`）三個欄位。原規劃用 Notion Automation 做防呆，但 Notion Free 方案沒有 Automations 功能，改在 `n8n-workflows/asus-notion-to-jira-hugo.json` 的 `T03 Guard IF - Prev Phase Done` 節點實作：`HasPrevPhase` 為 false（無前置 phase）或 `PrevJiraEpicKey` 非空才放行，否則導向 `T03a Skip - Prev Phase Not Ready` 略過，不建票、不回填 Notion。新增 phase row 時務必設定其 `前置Phase` 關聯，否則此防呆不會生效。實測：Phase 5 暫設 `Ready to Plan` 但前置 Jira_Epic_Key 為空時，經過完整排程週期未被誤開票，防呆有效（見 `_note/decisions.md`）。
1. **手動開票前置檢查（Automation 之外的雙重確認）**：任一 phase 要把 Notion Status 改為 `Ready to Plan` 前，必須先確認「`Weight` 比自己小的所有 phase」的 `Jira_Epic_Key` 欄位皆已非空。若有任何前置 phase 尚未開票，本 phase 一律不得改為 `Ready to Plan`。
2. **n8n workflow 規則（未來自動化時遵守）**：
   - 查詢 Notion 主表時一律加上 `sort: Weight ascending`，逐筆處理，不可平行或批次觸發多個 phase 的開票。
   - 處理任一筆前，需先確認「`Weight` 較小且 `Jira_Epic_Key` 為空」的 row 不存在；若存在，本次執行只處理該筆並結束，不得跳過去處理後面 Weight 較大的 phase。
3. **回填即許可**：每個 phase 開票完成後，立刻把 Jira Epic Key 寫回該 row 的 `Jira_Epic_Key` 欄位，作為下一個 phase 開票的許可條件。
4. **例外處理**：若必須讓某 phase 提前開票（例如刻意平行開發），需在 `_note/decisions.md` 的「架構決策」區塊記錄決定與理由，不可默默略過本規則。

---

## spec 文件與 ASUS Prompt 對應規則

ASUS 的 Claude Prompt 從以下位置讀取規格：

| 資料來源 | 路徑規則 |
|---------|---------|
| 規格文件（spec.md） | `_spec/<slug>/spec.md` |
| 設計文件（design.md） | `_spec/<slug>/design.md` |

`<slug>` 由 Jira 票 Description 中的 `Slug：` 欄位直接提供（值取自 Notion 主表現成的 `Slug` 屬性，開票時由 `asus-notion-to-jira-hugo` workflow 寫入票面），格式：
```
Slug：<slug>
```

> 2026-07-05 修正：原本規劃靠 `Spec：` 欄位夾帶 `_spec/<slug>/xxx.md` 路徑、再用正則拆出 `<slug>`，但 `Spec_URL` 屬性其實應該保留給人看的連結（比照 `Deploy_URL`），且路徑正則容易解析錯誤（見 `_note/decisions.md`）。改成直接在票面寫 `Slug：<slug>`，`asus-dev-workflow.json` 的「解析票面」節點直接比對這行取值，不再依賴 `Spec_URL`。

---

## ASUS 支援的任務類型

| 任務類型 | Claude 產出 | 備註 |
|---------|------------|------|
| TypeScript 後端邏輯 | `src/*.ts` + `test/*.test.ts` | 標準 TDD 流程 |
| TypeScript CDK Stack | `cdk/lib/*.ts` | 以 `cdk synth` 驗證 |
| Lambda 函式 | `cdk/lambda/*.ts` + 單元測試 | mock DynamoDB |
| GitHub Actions YAML | `.github/workflows/*.yml` | 以 CI 執行結果驗證 |
| n8n Workflow | `n8n-workflows/*.json` | 以 n8n Execution 驗證 |

---

## ASUS 不支援的任務類型（一律標注 `[手動]`）

- AWS / GitHub / n8n Console 設定操作
- 環境初始化指令（`cdk bootstrap`、`npm install -g`）
- 敏感憑證設定（GitHub Secrets、n8n Credentials）
- 外部服務 Webhook 註冊
- 檔案匯出操作（n8n workflow JSON 匯出）

---

## Git Worktree 架構與分支規則

本機同一份 repo 有三個 worktree（同一份 `.git` 歷史，三個獨立資料夾），彼此職責分開，避免自動化互搶工作目錄（見 `_note/decisions.md`「Agent Runner 獨立工作目錄」「asus-dev-workflow 改用獨立 worktree」兩筆決策）：

| 資料夾 | 用途 | 誰在用 | 分支狀態 |
|---|---|---|---|
| `awtw-short-url-service` | **使用者互動用**，平常打開看的就是這份 | 使用者本人、Claude 與使用者對話時的操作 | 應**隨時同步到 origin/main 最新狀態**（可能是 detached HEAD，因為 `main` 這個分支名稱目前被下面的 `-agent` worktree 佔用；detached 不影響讀檔案，只影響「能不能直接在這裡 commit」） |
| `awtw-short-url-service-agent` | 排程同步 workflow（`asus-notion-to-jira-hugo.json`）專用，直接 commit 到 main | 只有 n8n 排程會寫入，不應手動操作 | 固定 checkout 在 `main` 分支 |
| `awtw-short-url-service-devrun` | Jira 觸發開發 workflow（`asus-dev-workflow.json`）專用，會頻繁切換 `feature/ASUS-N` 分支 | 只有 n8n Jira webhook 觸發時會寫入，不應手動操作 | 動態切換，執行完會停在某個 `feature/ASUS-N` 分支上，這是正常現象 |

**規則：**

1. **使用者只需要關心 `awtw-short-url-service` 這一份資料夾**，且應該永遠反映 origin/main 的最新內容。維護這個同步是 Claude 的責任，不需要使用者自己判斷目前在哪個分支。
2. 每次 Claude 完成 merge 或推送 main 之後，若使用者的互動資料夾落後了，Claude 應主動同步，不用等使用者發現不對勁才處理。
3. 使用者若想自行確認/強制同步，可在 `awtw-short-url-service` 資料夾執行：
   ```
   git status
   ```
   確認乾淨（無 `Changes not staged`）後，執行：
   ```
   git fetch origin main
   git checkout --detach origin/main
   ```
   這兩行保證安全（不刪檔、不強制覆蓋、不動遠端），執行後資料夾內容必定與 GitHub main 一致。**若 `git status` 顯示有未儲存的變更，先不要執行第二步，找 Claude 確認怎麼處理。**
4. `-agent`、`-devrun` 兩個資料夾使用者不需要打開、不需要理解，純粹是自動化的內部工作空間。

---

## GitHub 操作規則（PR 流程 vs 直接 commit）

避免每次小改動都要走完整 PR 流程等待，區分兩種情況：

| 變更類型 | 規則 |
|---|---|
| **純文件變更**（`.md`、`_note/`、`_spec/` 說明文字等，不影響 CI／系統行為） | 直接用 owner bypass 一次 `commit` + `push` 到 main，**不開 PR**，不用等 CI |
| **程式碼／設定變更**（`.ts`、`test/*`、`package.json`、n8n workflow JSON 等會影響 CI 或系統行為的檔案） | 一律走完整 PR 流程：開分支 → 開 PR → 等 CI 過 → merge → （分支已設定 merge 後自動刪除，不用手動清） |

判斷原則：**這個檔案的內容錯了，CI 測得出來嗎？** 測得出來（程式碼、測試、設定檔）就走 PR；測不出來（純文字說明）就直接 commit，省去不必要的等待。

## GitHub API 操作工具

- 目前這個環境**沒有安裝 GitHub MCP**，也沒有 `gh` CLI，所以是用 `curl` 直接打 GitHub REST API
- 若已安裝 `gh` CLI（`winget install GitHub.cli`，安裝後執行 `gh auth login` 完成授權），優先改用 `gh pr create`／`gh pr merge`／`gh api` 等指令，比手動組 curl + 解析 JSON 更可靠、更少出錯
