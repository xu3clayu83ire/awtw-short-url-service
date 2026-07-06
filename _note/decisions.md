# 決策記錄

> 記錄專案中所有重要的架構與技術決策。
> 每筆記錄包含：決定內容、選項與取捨、選擇理由、日期。

---

## 架構決策

### [2026-07-05] 跨 Phase 開票順序保護規則
- **問題**：Phase 5 的 Jira 票曾比 Phase 4 先建立，導致票號與 Epic 依賴順序錯亂
- **選項**：A. 靠人工留意順序 / B. 在 adw-conventions.md 明訂「前一 phase 的 Jira_Epic_Key 未回填不得對下一 phase 開票」規則，並要求未來 n8n workflow 依 Weight 排序逐筆處理 / C. 改用 Jira 原生 Epic Link 事後修正，不管開票順序
- **決定**：選項 B — 新增前置條件檢查規則，寫入 `_rule/adw-conventions.md`
- **理由**：開票順序若錯亂，Epic 之間的依賴關係無法單靠事後修正票號還原，且未來 n8n 自動化仍會重複發生同樣問題，需在規則層面預先擋下
- **取捨**：初期為手動檢查，2026-07-05 已加上 Notion Automation 防呆（見下一筆決策），n8n workflow 開發時再補上自動化查詢邏輯

### [2026-07-05] 跨 Phase 開票順序防呆 — Notion Automation
- **選項**：A. 維持純文件規則、靠人工檢查 / B. 加 self-relation（前置Phase/後置Phase）+ Rollup（前置Jira_Epic_Key）+ Notion Automation，Status 誤改為 Ready to Plan 但前置 Jira_Epic_Key 為空時自動退回 Draft / C. 等 n8n workflow 開發完成再做防呆
- **決定**：選項 B
- **理由**：純文件規則沒有實際約束力，容易再次發生 Phase 5 搶先開票的問題；Notion Automation 不依賴尚未開發的 n8n，可以現在就生效
- **取捨**：Automation 規則設定無法透過 API/MCP 建立（Notion 平台限制），已由使用者於 Notion UI 手動設定；schema 異動（新增 `前置Phase`、`後置Phase`、`前置Jira_Epic_Key` 三個欄位）已透過 MCP 完成
- **Schema 變更**：功能規格總表新增 `前置Phase`（self-relation）、`後置Phase`（dual 同步）、`前置Jira_Epic_Key`（rollup，來源 `前置Phase`.`Jira_Epic_Key`）；Phase 5 row 的 `前置Phase` 已設為 Phase 4
- **實測結果（2026-07-05）**：因 Notion Free 方案無 Automations 功能，改在 `n8n-workflows/asus-notion-to-jira-hugo.json` 加上 `T03 Guard IF - Prev Phase Done` 節點做防呆。實測：Phase 4 開票成功（Jira_Epic_Key = ASUS-88~ASUS-96）；Phase 5 暫時設為 `Ready to Plan` 測試，經過 80 秒（涵蓋至少一輪排程）`Jira_Epic_Key` 仍維持空白，確認防呆生效，測試後已將 Phase 5 Status 改回 `Draft`

### [2026-07-05] asus-dev-workflow 的 slug 解析與規格讀取修正
- **問題**：追查 Phase 4 開票後的下一步（票狀態改 `In Progress` 觸發 AI 開發自動化）時，發現 `n8n-workflows/asus-dev-workflow.json` 有三個環環相扣的 bug：
  1. 「讀取 spec」「讀取 design」節點的檔案路徑寫死指向 `_spec/phase3-ai-agent/`，不會依票面實際 phase 讀取正確規格
  2. 「解析票面」節點的 slug 擷取正則 `/Spec[：:][^\n]*?\/([^\/\s"]+)\.md/` 抓的是檔名（例如 `tasks-backend`），不是資料夾名稱（`phase4-cicd-review`）
  3. Notion 主表的 `Spec_URL` 欄位從未被填值，導致 Jira 票 Description 裡「Spec：」那行本來就是空的
- **決定**：三個一起修 —— 正則改成 `/Spec[：:][^\n]*?\/([^\/\s"]+)\/[^\/\s"]+\.md/`（抓檔名前一層資料夾）；讀取 spec/design 節點改用 `$('解析票面').first().json.slug` 動態組路徑；Notion Phase4/5 的 `Spec_URL` 分別填入 `_spec/phase4-cicd-review/tasks-backend.md`、`_spec/phase5-aws-deploy/tasks-backend.md`
- **理由**：這三個問題疊在一起會讓 Phase 4（以及之後每個 phase）的 AI 自動開發流程讀到錯誤規格或直接解析失敗，必須在推進到下一步前修好
- **取捨**：Phase 4 已建立的 9 張舊票（ASUS-88~96）是在 `Spec_URL` 還是空值時建立的，Description 裡的 Spec 資訊已經壞掉，決定刪除重建而非事後補登，需使用者手動到 Jira 刪票、再重新觸發開票 workflow

### [2026-07-05] Spec_URL 用途修正 — 改用現成的 Slug 欄位
- **問題**：使用者質疑 `Spec_URL` 為何存放 repo 相對路徑（`_spec/<slug>/xxx.md`）而不是網址。核對 `notion-setup-guide.md` 的欄位定義，`Spec_URL`／`Deploy_URL` 命名邏輯上都應該是「給人看的連結」（比照 `Deploy_URL` 是部署後網址），存放本地檔案路徑是用途錯位
- **選項**：A. 維持現狀，只是命名不準確 / B. 新增 `Slug：<slug>` 直接寫入 Jira 票面 Description（值取自 Notion 主表現成的 `Slug` 屬性），`asus-dev-workflow.json` 改成直接解析這行，不再靠正則拆解 `Spec_URL` 路徑；`Spec_URL` 恢復為人看的連結用途（Hugo 發布網址，待 Phase 5 文件站部署後回填）
- **決定**：選項 B
- **理由**：Notion 主表本來就有 `Slug` 屬性存著正確的值，沒有必要繞路徑正則去反推，直接傳遞更簡單也更不容易出錯；同時讓 `Spec_URL` 欄位語意回歸一致（比照 `Deploy_URL`）
- **異動**：`asus-notion-to-jira-hugo.json` 的 `T09 Jira Create Issue` description 樣板把 `Spec：{{ $json.specUrl }}` 改成 `Slug：{{ $json.slug }}`，`T06 Cut Task Lines` 移除不再使用的 `specUrl` 映射；`asus-dev-workflow.json` 的「解析票面」節點正則改成 `/Slug[：:]\s*([^\s"\\]+)/`；Notion Phase4/5 的 `Spec_URL` 清空（等 Hugo 站台部署後才回填真正網址）
- **取捨**：Phase 4 的 9 張舊票本來就要刪除重建（見上一筆決策），這次修正一併包含在重建範圍內，不需要額外的遷移動作

---

### [2026-06-30] Phase 1 任務追蹤方式
- **選項**：A. 用 tasks-*.md 手動勾選，Notion 開票格式照產但不執行 / B. Phase 1 不附開票格式 / C. 先手動建 Jira 再接自動化
- **決定**：選項 A — Phase 1 直接用 tasks-*.md 勾選追蹤，不走 Jira
- **理由**：Jira 與 n8n Pipeline 尚未建置，Phase 1 本身就是在建這套基礎，無法用尚不存在的流程追蹤自己
- **取捨**：Phase 1 的 Jira 票不存在，但文件格式與後續 Phase 保持一致，Phase 2 完成後從 Phase 3 起正式走自動化流程

---

### [2026-07-05] ADW 架構翻修 — tasks-*.md 與 Jira 票雙向同步、Hugo 四篇文件
- **背景**：實測 Phase 4 開票流程後，發現原始設計（`_idea/phase2-n8n-pipeline.md`、`_idea/phase3-ai-agent.md`）本來就是刻意讓 Jira 票是「一次性快照」——開票時從 `Tasks_To_Open` 精簡格式建票，之後票就跟 `tasks-*.md` 斷連；Hugo 文件站原始設計也只同步任務清單，沒有 SA 規格/設計文件
- **問題**：這個設計導致（1）`tasks-*.md` 的依賴關係（`依賴：T0X`）完全沒有反映到 Jira 開票流程，同 phase 內任務可能亂序執行；（2）`tasks-*.md` 的 ⬜/✅ 狀態跟 Jira 票的實際進度會脫節，沒有回寫機制；（3）Hugo 站台只能看任務清單，看不到規格與設計文件
- **選項**：A. 維持原始設計，只記錄限制不修改 / B. 重新設計：開票直接讀 `tasks-*.md` 原文切割任務區塊（保留依賴資訊），Jira 轉 In Review 後回寫 `tasks-*.md` 的 ⬜→✅，Hugo 站台改為每 phase 四篇文件（`_index.md`/`spec.md`/`design.md`/`tasks.md`）
- **決定**：選項 B
- **理由**：使用者評估後認為 Jira 票應該對應到 `tasks-*.md`（保持活連結，不只是快照），Hugo 文件站也應該完整呈現 SA 文件與開發文件，不是只有任務名稱清單
- **異動範圍**：`_spec/phase2-n8n-pipeline/design.md`、`_spec/phase3-ai-agent/design.md` 已更新技術架構圖、節點清單、票面格式、回寫機制、技術決策與風險對策；`n8n-workflows/asus-notion-to-jira-hugo.json`、`asus-dev-workflow.json` 尚未依新設計實作（下一步）
- **取捨**：新增「任務依賴防呆」「tasks-*.md 回寫」「四篇文件同步」都是全新機制，複雜度明顯提高；同一份 `tasks-*.md` 被多張票並發回寫可能有 race condition，設計文件已記錄對策（序列化寫入佇列），但實作前需要先確認 Agent Runner 是否支援
- **分支**：在 `feature/task-jira-bidirectional-sync` 分支上進行，`main` 分支維持之前修好的簡化版（Phase4/5 防呆、Slug 傳遞）不受影響

### [2026-07-05] 支援 phase 開票後增量新增任務
- **問題**：使用者問「Notion 改 Tasks_To_Open 會不會同步更新 Jira、Jira_Epic_Key 會不會 append」，追查後發現原設計有兩個缺口：(1) 冪等判斷只看 ⬜/✅，任務開票後、完成前仍是 ⬜，會被每輪排程重複開票；(2) `Jira_Epic_Key` 回填邏輯是覆蓋不是 append，增量開票會蓋掉先前票號
- **選項**：A. 支援增量新增任務，修好上述兩個缺口 / B. Phase 開票後鎖死範圍，新功能一律在 Notion 新開一個 phase row，不修改既有 tasks-*.md
- **決定**：選項 A
- **理由**：使用者傾向讓 tasks-*.md 保持可持續擴充，不希望每個小功能異動都要開一個新 phase
- **異動**：標頭格式新增票號標註 `⬜(ASUS-97)` 同時作為冪等判斷依據（區分「尚未開票」／「已開票未完成」／「已完成」三態）；Notion 回填 Jira_Epic_Key 前先讀現有值，新舊票號合併去重後寫回，不再整批覆蓋。已更新 `_spec/phase2-n8n-pipeline/design.md`
- **取捨**：標頭正則變複雜（要同時解析狀態圖示、執行模式、選填的票號括號），未來若 `tasks-*.md` 格式手動編輯不慎破壞標頭格式，切割與冪等判斷都會失效，需要靠「格式錯誤跳過並 log」的防禦性設計兜底

### [2026-07-05] PM/SA 透過 Notion 新增任務的入口設計
- **問題**：改成 `tasks-*.md` 是唯一真相來源後，使用者指出非工程角色（PM/SA）平常操作 Notion、不會去改 git 檔案，這個入口被堵死了，違背 Phase 1 建立 Notion 的初衷（消滅任務散落各處的問題）
- **選項**：A. `Tasks_To_Open` 當收件匣，PM/SA 用簡化格式新增，n8n 偵測後自動編號、展開成完整區塊、寫入對應 tasks-*.md，再清空收件匣 / B. Notion 也維護一份完整任務清單，跟 tasks-*.md 平行存在
- **決定**：選項 A
- **理由**：選項 B 會製造兩個可能分歧的真相來源，跟先前「Jira 票斷連 tasks-*.md」是同一類問題，選項 A 讓 tasks-*.md 保持唯一持久記錄，Notion 只是暫存輸入信箱
- **異動**：`_spec/phase2-n8n-pipeline/design.md` 新增「Notion 新增任務入口」章節、對應節點（2a-2e）、風險與對策
- **取捨**：PM/SA 寫的簡化格式資訊量比 `/addyosmani-plan` 產出的完整版少（沒有詳細任務描述），需要工程師事後補充；且新增了一個「格式錯誤時不清空、留給提交者修正」的例外處理路徑，需要在 Hugo tasks.md 或其他管道讓 PM/SA 看到失敗訊息，否則會誤以為已經送出成功

### [2026-07-05] Notion 新增任務格式錯誤的回饋管道
- **問題**：上一筆決策留下的缺口——PM/SA 送出格式錯誤的任務時，n8n 只會記 log、不清空欄位，但提交者本人不會主動去看 log，等於送出去卻不知道失敗了
- **選項**：A. Notion 留言（在 phase 頁面留言原始行 + 失敗原因）/ B. Email 通知（比照 Phase4 `github-pr-notify` 的 Gmail SMTP）/ C. 兩者並行
- **決定**：選項 A（先只做 Notion 留言，不疊加 Email）
- **理由**：PM/SA 提交當下就在 Notion 那個頁面，留言是最貼近使用情境的回饋位置，不需要額外憑證（Notion API 已接好），比 Email 少一層「要離開當下畫面去收信」的摩擦
- **異動**：`_spec/phase2-n8n-pipeline/design.md` 新增節點 2b（格式驗證）、2b-fail（留言通知），`Tasks_To_Open` 改成成功/失敗分開處理（只清除成功轉換的行）
- **取捨**：留言不是即時推播，PM/SA 要主動回頭打開 Notion 頁面才會看到；如果之後發現留言不夠即時，可以再疊加 Email 通知（决策仍保留這個升級空間，非一次性關閉）

### [2026-07-05] 系統名稱 ADW → ASUS 統一更名
- **背景**：專案原本用「ADW（AI 驅動自動化開發工作流）」當系統代稱，但 Jira 專案代號、n8n workflow 檔名（`asus-notion-to-jira-hugo.json`、`asus-dev-workflow.json`）早就用 `ASUS`，兩套名稱同時並存造成混淆
- **決定**：全面統一用 `ASUS` 當系統名稱，`ADW` 一詞除歷史紀錄外不再使用
- **異動範圍**：
  - `_rule/adw-conventions.md` 改名為 `_rule/asus-conventions.md`（git mv），內容與所有引用該檔名的地方一併更新
  - `_idea/*.md`、`hugo-docs/content/docs/_index.md`、`_spec/phase2~5/*.md`（design/spec/tasks）、`n8n-workflows/asus-dev-workflow.json` 內文字全部 `ADW` → `ASUS`
  - `_spec/phase1-infrastructure/notion-setup-guide.md` 原寫「建立 Page 命名為『ADW 工作區』」，但實際 Notion 頁面本來就叫 `awtw-short-url-service`，已修正文件內容對齊現實，不是改成「ASUS 工作區」
- **例外（比照先前 XAM→ASUS 的做法）**：`_note/decisions.md` 既有的歷史決策記錄保留原字面（當時確實叫 ADW），不追溯修改，只在本筆新決策說明改名
- **取捨**：`_spec/phase2-n8n-pipeline/tasks-devops.md`、`phase3-ai-agent/tasks-devops.md`、`tasks-backend.md` 裡提到的 n8n Credential／Workflow／Webhook 名稱（例如 `Notion - ADW`、`GitHub - ADW`、`ADW Phase 3`、`ADW - Notion to Jira & Hugo`）文字也一併改成 ASUS，但**這些是 Phase 2/3 已經在 n8n 實際設定好的資源名稱**，文件改了不代表 n8n 裡的名稱自動跟著變，需要使用者自行到 n8n UI 手動同步改名，否則文件與實際設定會不一致

---

### [2026-07-05] 自動註冊新 Phase 進 Notion — 暫緩，先記錄設計方向
- **背景**：Phase4/5 的 Notion 資料被清空後，討論到「以後開新 phase 時，Notion row 要不要自動建立」。最初想加進 `/addyosmani-plan` 的執行規則，但被指出這樣會讓一個通用的規劃 skill 綁死 Notion 依賴——Notion 資料庫是這個專案（ADW PoC）才用的東西，不是每次規劃都需要
- **選項**：A. 加進 `/addyosmani-plan`（已否決，耦合不當）/ B. 獨立於規劃流程之外，做成 ADW 自動化的一環，例如新增 `asus-register-phase` n8n workflow，由 GitHub push 到 main 且 diff 出現新 `_spec/<slug>/` 資料夾觸發，讀取 spec.md 建立 Notion row / C. 暫緩，先不做設計
- **決定**：選項 C（暫緩），但把選項 B 的方向記錄下來，等真的要開新 phase 時再回頭設計
- **理由**：(1) Phase2/3 的大改造（tasks-*.md 雙向同步）都還沒經過完整實測，不宜再疊加新自動化入口增加除錯複雜度；(2) 眼前 Phase4/5 的 Notion 資料被清空是一次性資料修復問題，不需要先解決「未來怎麼自動註冊新 phase」才能動手修復；(3) 現有的 Phase4/Phase5 row 本來就已經存在，用不到這個功能，等真的開 Phase 6 或其他新功能時，才看得出真正的自動化痛點在哪
- **待辦（未實作）**：若之後要做，建議用 GitHub push webhook 觸發（而非 Claude Code 規劃階段），讓「規劃」「commit」「進 ADW 管線」三件事保持獨立、互不綁死

### [2026-07-05] Phase4/5 Notion 資料遺失與重建
- **事件**：Phase4、Phase5 的 Notion 頁面資料在原因不明的情況下被清空（Phase4 標題變成「新頁面」、Phase5 被移入垃圾桶），時間點早於當次 workflow 更新，排除是這次 API 呼叫造成；使用者確認後直接刪除兩個壞頁面
- **處理**：用 Notion MCP 重新建立兩個 row（`Name`/`Slug`/`Weight`/`Status`/`前置Phase`），`Tasks_To_Open` 刻意留空（新設計下這欄位只做 PM/SA 收件匣用，phase 本身的任務已經在 `tasks-*.md` 裡，填了反而會被誤判成新增任務）
- **後續實測結果**：Phase4 改 `Ready to Plan` 後，新版 `asus-notion-to-jira-hugo` workflow 完整跑通——Backend/DevOps 各自的 T01 開票成功（ASUS-97、ASUS-98）、任務依賴防呆正確擋下 T02~T05（依賴 T01 未完成）、`tasks-*.md` 正確回填票號並自動 git commit、Notion `Jira_Epic_Key` 正確 append、Hugo 四篇文件同步成功

### [2026-07-05] 修正 ExecMode 遺漏 — 手動票過濾邏輯失效
- **問題**：新版任務區塊只把執行方式（🤖 AI 執行／👤 手動執行）解析進 `execMode` 欄位，沒有放進 Jira 票面任何地方；`asus-dev-workflow` 判斷手動票的邏輯還是舊的 `summary.includes('[手動]')`，這個字串在新格式下永遠不會出現，導致手動票不會被正確跳過，會被誤觸發 Claude API
- **決定**：Jira 票面 Description 新增 `ExecMode：AI` 或 `ExecMode：手動` 這行（`T13 Jira Create Issue` 加上），`asus-dev-workflow` 的「解析票面」節點改成解析這行判斷，不再依賴 summary 字串比對
- **驗證**：用模擬 payload 測試，手動票正確回傳空陣列（跳過），AI 票正確解析出 taskId/tddDod，兩個 workflow 都已透過 n8n API 重新推送更新
- **異動範圍**：`n8n-workflows/asus-notion-to-jira-hugo.json`（T07 正規化 execMode 為 'AI'/'手動'，T13 description 樣板加一行）、`n8n-workflows/asus-dev-workflow.json`（解析票面節點）、`_spec/phase2-n8n-pipeline/design.md`

### [2026-07-05] asus-dev-workflow 實測發現的三個連鎖 bug
- **問題**：ASUS-102 改 In Progress 實測完整流程，一路暴露三個問題：(1) `summary` 欄位在 Prompt 組裝節點的傳遞鏈中遺失，PR 標題變成 `[ASUS-102] undefined`；(2) `git checkout -b` 失敗（working tree 有未 commit 變更擋住）時沒有中斷，導致 Claude 產出的程式碼被直接寫進當下分支、`npm run test` 因為 `package.json` 不存在而誤判為紅燈/綠燈都通過、最後 commit 混進不相關檔案；(3) `max_tokens: 4096` 太小，Claude 回應在 JSON 產出到一半就被截斷，`解析回應` 節點 `JSON.parse` 直接丟 `Unterminated string`
- **決定**：三個都修——`組裝 Prompt`／`解析回應` 補回 `summary` 欄位；新增 `Guard IF - Checkout 成功` 節點，checkout exitCode ≠ 0 就中止並保留 Jira `In Progress`；`max_tokens` 提高到 8192，並在 `解析回應` 加上明確的截斷偵測錯誤訊息
- **驗證**：JSON 語法與 Code node 語法都過 node 測試；實際 bug 是透過真實執行 ASUS-102 才發現的，修完後尚待下一輪實測確認
- **後續發現**：即使修好上述三點，實測仍暴露更深層的問題——`asus-dev-workflow` 的 `basePath` 跟工程師互動用的工作目錄是同一份，見下一筆決策

### [2026-07-05] Agent Runner 獨立工作目錄（git worktree）
- **問題**：實測發現嚴重的架構缺陷——`basePath` 從最初設計就寫死指向工程師互動開發用的同一個資料夾。Agent Runner 執行 `git checkout main` 會把**整個共用工作目錄**切走，不管工程師手上有沒有未 commit 的變更、也不管排程 workflow 是否同時在背景執行。實測後果：IDE 檔案內容瞬間變成別的分支版本（看起來像資料遺失）、`feature/ASUS-102` 分支從舊版 main 分岔（缺少當時只在 feature 分支上的 package.json）、排程 workflow 的 commit 誤打到這個意外切出來的分支上，甚至已經 push 到 GitHub 遠端並建立 PR
- **選項**：A. 只靠 checkout 失敗防呆，共用同一個工作目錄（治標不治本——只要 checkout「成功」切到別的分支，工程師的工作目錄還是會被切走）/ B. Agent Runner 改用獨立 git worktree，與工程師互動用的目錄分開 / C. Agent Runner 用完全獨立的 clone（不共用 .git）
- **決定**：選項 B
- **理由**：worktree 比獨立 clone 輕量（共用 `.git`、共用 commit 歷史與分支清單），比純防呆更根本地解決「工作目錄被搶走」的問題
- **異動**：`git worktree add ../awtw-short-url-service-agent main`；`asus-dev-workflow.json` 所有本地檔案路徑（讀 tasks-*.md/spec.md/design.md、寫測試/實作檔、git 指令的 cwd）全部改指向新路徑；`_spec/phase3-ai-agent/design.md` 新增「Agent Runner 獨立工作目錄」章節
- **後續處理**：worktree 建立時預設 checkout 在 `main`，但 `package.json` scaffold 當時只在 `feature/task-jira-bidirectional-sync` 分支上，導致 worktree 裡 `npm install` 找不到檔案；改用 cherry-pick（commit `24e14ab`）把 scaffold 單獨帶進 `main`，不整批 merge 尚未完整測試的 tasks-*.md 雙向同步設計。cherry-pick 後的 commit 暫時只留在本地 main，未 push 上 origin（使用者決定先不 push，等其他問題都確認沒問題再說）
- **意外副作用清理**：`feature/ASUS-102` 分支（從舊版 main 分岔、混進無關的 `src/store.ts`、測試結果不可信）已由使用者確認刪除 GitHub 上的分支與 PR，本地分支也已 `git branch -D` 清除
- **取捨**：worktree 需要各自獨立 `npm install`（`node_modules` 不共用）；且 worktree 只解決「工作目錄被搶走」，如果工程師與 Agent Runner 同時改到同一個檔案，一樣會產生正常的 git 衝突，需要靠任務範圍不重疊來避免

### [2026-07-05] TaskId 加上 sourceFile — 修正跨檔案同編號任務互相打架
- **問題**：實測 ASUS-102（devops T01「建立 CI workflow 檔案」）時，`擷取任務區塊` 依序嘗試 `tasks-backend.md`／`tasks-devops.md`／`tasks-qa.md` 找第一個符合編號的 `T01`，但三個檔案的 `T01` 是各自獨立編號、內容完全不同的任務。結果永遠先抓到 `tasks-backend.md` 的 T01（「建立 GitHub PR Webhook」），Claude 用錯任務內容產生程式碼，回寫也標記錯檔案的任務為完成
- **決定**：`TaskId` 格式從 `<slug>#<taskId>` 改成 `<slug>#<sourceFile>#<taskId>`，`asus-dev-workflow` 直接用票面明確指定的 `sourceFile` 讀取對應檔案，不再依序嘗試三份檔案用編號猜測；找不到合法 `sourceFile` 就直接拋錯中止，不可用猜測代替
- **驗證**：用模擬 payload 測試正確解析出 `sourceFile: tasks-devops.md`；用新格式重開票（ASUS-106）後完整跑通全部 28 個節點，`.github/workflows/ci.yml`／`test/ci-workflow.test.ts`／`tasks-devops.md` 三個檔案正確對應
- **異動範圍**：`n8n-workflows/asus-notion-to-jira-hugo.json`（T13 description 樣板 TaskId 格式）、`n8n-workflows/asus-dev-workflow.json`（解析票面、擷取任務區塊節點）

### [2026-07-05] additional_dependencies 自動安裝 + 紅綠燈環境錯誤偵測
- **問題**：ASUS-106 實測「完整跑通」後，人工檢查 PR 內容才發現測試檔 `import` 了 `js-yaml`，但這個套件根本沒裝在 `package.json` 裡，`npm run test` 實際上是因為模組載入失敗而報錯，不是真正的紅燈/綠燈。既有的紅燈確認邏輯只看 `exitCode !== 0`，沒辦法分辨「測試斷言正確失敗」跟「環境缺套件、測試根本跑不起來」，把後者誤判成有效紅燈；綠燈階段甚至**完全沒有**成功與否的判斷閘門，不管測試結果如何都直接 commit
- **決定**：(1) `組裝 Prompt` 讀出目前 `package.json` 的依賴清單告知 Claude，優先使用既有依賴；若任務真的需要新套件，回應新增 `additional_dependencies` 欄位列出，`asus-dev-workflow` 在寫入測試檔前自動 `npm install`；(2) 紅燈與綠燈確認前都新增「環境錯誤偵測」節點，比對 `Cannot find module`／`Failed to load url`／`SyntaxError` 等樣式，命中就直接中止並丟出明確錯誤，不當作有效的紅/綠燈；(3) 補上原本完全缺失的「綠燈確認」IF 閘門，測試沒有真的通過（`exitCode !== 0`）就中止，不再不管三七二十一直接 commit
- **理由**：這類「假紅燈/假綠燈」問題已經是這個 session 第三次用不同面貌出現（`package.json` 不存在、`js-yaml` 沒裝），代表光靠「有沒有 exitCode」判斷 TDD 燈號本質上不夠，需要從「輸出內容是否包含環境錯誤特徵」跟「是否真的執行到測試判斷式」兩個角度補強
- **驗證**：用模擬 stdout/stderr 測試環境錯誤偵測邏輯，正確攔截 `Failed to load url` 並丟出錯誤，正常測試失敗訊息則正常放行
- **異動範圍**：`n8n-workflows/asus-dev-workflow.json` 新增 5 個節點（讀取 package.json、Guard IF - Has Additional Deps、npm install 額外依賴、檢查環境錯誤×2、綠燈確認 IF），已 push 上 `origin/main`
- **後續待辦**：PR #4（ASUS-106）本身仍然是用修正前的版本產生的，`js-yaml` 沒裝、測試實際上跑不起來，**不建議直接合併**；應該關閉此 PR、刪除分支，讓 ASUS-106 用修正後的邏輯重新跑一次，才能驗證這次的修正是否徹底解決問題

### [2026-07-05] impl_file_path 缺失時從測試檔 import 自動推斷
- **問題**：Claude 回應偶爾會缺少 `impl_file_path` 欄位（`impl_file_content` 正常齊全），導致「解析回應」節點直接判定為缺欄位錯誤中止，即使 Claude 產出的程式碼內容本身完全正確可用
- **決定**：新增 fallback——`impl_file_path` 缺失時，改從 `test_file_content` 裡的相對路徑 `import ... from '../...'` 陳述式反推出實作檔路徑；只有連這個推斷都失敗，才真正拋錯中止
- **異動範圍**：`n8n-workflows/asus-dev-workflow.json`（`解析回應` 節點）

### [2026-07-05] 修正環境錯誤偵測誤判正常 TDD 紅燈
- **問題**：ASUS-107 實測發現「Failed to load url ../src/xxx」這個訊息在紅燈階段其實是正常現象（實作檔案本來就還沒寫），但上一版（見「additional_dependencies 自動安裝＋紅綠燈環境錯誤偵測」條目）的偵測邏輯無條件把這個樣式當成環境錯誤，導致正常的 TDD 紅燈被誤判、流程被錯誤中止
- **決定**：改成判斷「找不到的是 npm 套件名稱、還是本地相對路徑」——本地相對路徑找不到＝正常 TDD 現象（實作檔還沒寫），套件名稱（不含 `./` 或 `../` 開頭）找不到才是真正的環境錯誤（缺少 npm 套件），用 `isLocalPath()` helper 判斷
- **異動範圍**：`n8n-workflows/asus-dev-workflow.json`（`檢查環境錯誤（紅燈）`／`檢查環境錯誤（綠燈）` 節點）

### [2026-07-05] impl_file_path 必須是任務實際交付檔案，不可包一層驗證模組
- **問題**：ASUS-107 連續兩次實測都出現同樣的系統性偏誤——Claude 把 `impl_file_path` 寫成另包一層驗證用的 TypeScript 模組（如 `src/ci-workflow-validator.ts`），卻沒有真正產出任務要求的交付檔案本身（`.github/workflows/ci.yml`），導致測試因為真正該有的檔案不存在而全數失敗
- **決定**：在 System Prompt 明確規定：任務要求的是設定檔（或其他非 TS 檔案）就直接把該檔案路徑當 `impl_file_path`，不要包一層驗證模組
- **驗證**：修正後下一次重試（ASUS-107）即完全成功，PR #5 經 GitHub compare API 確認乾淨（4 檔案／2 commit，內容與任務範圍完全吻合）——確認這是可重現、可用明確指令根治的系統性偏誤，不是隨機失誤
- **異動範圍**：`n8n-workflows/asus-dev-workflow.json`（System Prompt）

### [2026-07-05] asus-dev-workflow 改用獨立 worktree，與排程同步 workflow 徹底隔離
- **問題**：`asus-dev-workflow`（Jira 觸發）與 `asus-notion-to-jira-hugo`（排程同步）先前共用同一個 worktree `awtw-short-url-service-agent`。ASUS-107 成功跑完後人工審查 PR 內容，發現 PR 裡混進一個不該出現的 `hugo-docs/.../tasks.md` 變更——排程同步剛好在 `asus-dev-workflow` 把 worktree checkout 到 `feature/ASUS-107` 期間執行，把 Hugo 文件同步結果寫並提交到了這個 feature 分支上，而不是 main。這是「Agent Runner 獨立工作目錄」那次修復解決了工程師與 Agent Runner 互搶目錄的問題後，殘留的第二層同款問題——這次是兩個自動化 workflow 互搶
- **後續發現**：排查時進一步發現這個 race 曾經造成真正的資料遺失風險：排程同步把 ASUS-108/109/110/111 四張票的回填票號寫進了當時被切到 `feature/ASUS-107` 的共用 worktree，且從未提交，長期停留在 working tree 的未追蹤變更裡，若沒有排查極可能在下一次 `git checkout` 時被靜默覆蓋遺失。已人工核對後救回，正確寫回 `_spec/phase4-cicd-review/tasks-backend.md`（T02→ASUS-108、T04→ASUS-109）與 `tasks-devops.md`（T02→ASUS-110、T03→ASUS-111）
- **決定**：新增第三個 worktree `awtw-short-url-service-devrun`，`asus-dev-workflow` 的所有本地檔案路徑與 git 指令 cwd 全部改指向這裡；`asus-notion-to-jira-hugo` 維持指向原本的 `awtw-short-url-service-agent`，兩者互不重疊
- **理由**：與先前「Agent Runner 獨立工作目錄」決策同樣的邏輯——只要兩個自動化流程共用一個可以被 `git checkout` 切換分支的工作目錄，就永遠有機率互相干擾；worktree 之間共用同一份 `.git` 物件庫與歷史，隔離工作目錄的成本很低
- **驗證**：透過 n8n API 讀回兩個 workflow 目前的節點內容，確認 `asus-dev-workflow` 只含 `awtw-short-url-service-devrun` 字樣、`asus-notion-to-jira-hugo` 只含 `awtw-short-url-service-agent` 字樣，兩者完全不重疊
- **異動範圍**：`n8n-workflows/asus-dev-workflow.json`（10 處路徑），已透過 n8n API push 生效並 commit 進 git（main）
- **殘留風險（未處理）**：若同一個 `asus-dev-workflow` 因兩張 Jira 票幾乎同時轉為 In Progress 而被觸發兩次，仍會在 `awtw-short-url-service-devrun` 這個 worktree 內互踩（同一個 worktree 同時間只能在一個分支上）。範圍較小，暫不處理，之後若真的遇到再考慮用 n8n workflow concurrency 設定或檔案鎖序列化

### [2026-07-05] 修正 Agent Runner HTTP body 逐 chunk 解碼造成的多位元組字元損毀
- **問題**：PR #5 merge 進 main 後，人工核對發現 `_spec/phase4-cicd-review/tasks-devops.md` 裡「尚未出現」的「尚」字被替換成 `�`（U+FFFD）。追查到根因在 `agent-runner/server.js` 的 `parseBody`：`req.on('data', chunk => (body += chunk))` 對每個到達的 Buffer chunk 個別呼叫 `toString()`（預設 utf8）後才字串相加；若一個多位元組字元（中文在 UTF-8 是 3 bytes）的位元組序列剛好被切在兩個 HTTP chunk 邊界中間，各自獨立解碼那一半的位元組就會產生無效序列、被替換成 `�`，且這個過程是不可逆的（字串相加當下就已經遺失原始位元組資訊，之後 `JSON.parse` 對此完全沒有察覺，寫檔案時只是忠實寫入已損毀的字串）
- **決定**：`parseBody` 改成先把所有到達的 chunk 以 Buffer 形式收集進陣列，在 `end` 事件才用 `Buffer.concat(chunks).toString('utf8')` 一次性解碼，避免跨 chunk 邊界切斷多位元組字元
- **驗證**：重啟 Agent Runner 後，寫入一段刻意涵蓋 Node 預設 64KB chunk 邊界（padding 長度 65480～65540 逐一掃描）、結尾為中文字串的內容，透過 `/write-file` → `/read-file` round-trip 全部通過，未再出現任何替換字元
- **異動範圍**：`agent-runner/server.js`（三個 worktree 各自的複本都已同步更新，需手動重啟正在跑的 Node process 才會套用，git pull 不會讓已啟動的 process 拿到新程式碼）
- **取捨**：這個 bug 屬於機率性重現（只有中文字元位元組剛好落在 chunk 邊界才會觸發），過去測試沒抓到不代表沒發生過，只是剛好之前的檔案內容或 payload 大小沒有踩中邊界；建議往後若又看到任務檔內容出現不明亂碼，優先懷疑是不是又有類似「串流資料逐段處理但用字串而非 Buffer 累積」的地方沒改到（例如 `/run` 端點的 `exec` callback 本身用的是 Node 內建 buffering，不受影響，但若未來新增其他串流讀寫端點要留意同樣的陷阱）

---

## API 設計決策

<!-- 在此記錄 API 契約相關決策 -->

---

## 技術選型決策

### [2026-06-30] Jira 專案設定
- **選項**：Project key XAM（idea 草稿預設）/ ASUS（實際建立）
- **決定**：ASUS，專案名稱 awtw-short-url-service，網址 https://prostyliu.atlassian.net
- **理由**：Jira 建立時 key 已設為 ASUS，票號格式為 ASUS-1、ASUS-2
- **取捨**：idea 草稿中所有 XAM 字樣均以 ASUS 取代

---

## 資料庫決策

<!-- 在此記錄 Schema 設計相關決策 -->

