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
