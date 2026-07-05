# 決策記錄

> 記錄專案中所有重要的架構與技術決策。
> 每筆記錄包含：決定內容、選項與取捨、選擇理由、日期。

---

## 架構決策

### [2026-06-30] Phase 1 任務追蹤方式
- **選項**：A. 用 tasks-*.md 手動勾選，Notion 開票格式照產但不執行 / B. Phase 1 不附開票格式 / C. 先手動建 Jira 再接自動化
- **決定**：選項 A — Phase 1 直接用 tasks-*.md 勾選追蹤，不走 Jira
- **理由**：Jira 與 n8n Pipeline 尚未建置，Phase 1 本身就是在建這套基礎，無法用尚不存在的流程追蹤自己
- **取捨**：Phase 1 的 Jira 票不存在，但文件格式與後續 Phase 保持一致，Phase 2 完成後從 Phase 3 起正式走自動化流程

---

## API 設計決策

<!-- 在此記錄 API 契約相關決策 -->

---

## 待決議事項

### [2026-07-01] Jira_Epic_Key 增量 Append 機制（待處理）
- **情境**：同一個 Notion 功能頁面，分多次新增 Task（先開 ASUS-1、ASUS-2，後續再加 ASUS-3）
- **現況**：工作流程每次觸發都覆寫 `Jira_Epic_Key`，只保留本次批次票號
- **選項**：
  - A. 維持覆寫 + 操作慣例（Tasks_To_Open 只填新增 Task，Jira 看板本身有完整歷史）
  - B. Append 模式（讀取現有 Jira_Epic_Key 後串接新票號）
  - C. 新增 Notion 欄位 `Tasks_To_Add`，專門放本次新增的 Task
- **暫定**：選項 A（Phase 2 維持覆寫）
- **待決**：後續優化時實作選項 C，設計如下：
  - `Tasks_To_Open`：累積所有任務（新舊保留）→ Hugo 文件使用
  - `Tasks_To_Add`：本次新增任務 → Jira 開票使用，處理後自動清空
  - `Jira_Epic_Key`：改為 Append 模式，累積所有歷史票號
  - T03 改讀 `Tasks_To_Add`；T05 改為 Append；處理後清空 `Tasks_To_Add`
- **影響範圍**：Notion 資料庫 Schema、T03/T05/T08 節點、tasks-backend.md

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
