# Phase 2 — n8n 自動化管線：Backend 任務清單

> ⬜ 待執行　✅ 已完成
>
> **2026-07-06 重寫說明**：這份文件是原始逐節點設計（`tasks-backend-original-design.md`）的替代版本。原始設計把管線拆成一堆獨立小節點（冪等 IF、空任務 IF、切割 Code、開票節點、回填節點……），實際開發過程中因為多次實測發現設計缺口（見下方「異動原因」），2026-07-05 的「ADW 架構翻修」決策整個重新設計，最終落地為**單一個 n8n workflow**：`n8n-workflows/asus-notion-to-jira-hugo.json`（39 個節點）。這份文件記錄「實際做出來的功能」，不是可以逐條勾選施工進度的清單——因為施工當時就是直接在 n8n 裡整個重畫，不是照原始清單一格一格完成的。

---

## 已完成功能

### 冪等與跨 Phase 開票防呆 ✅
- **跨 Phase 順序防呆**（節點 `T03 Guard IF - Prev Phase Done`）：前一個 Phase 的 `Jira_Epic_Key` 未回填，不對下一個 Phase 開票
- **任務層級冪等判斷**：不再只看 `Jira_Epic_Key` 是否為空，改成在任務標頭直接註記票號 `⬜(ASUS-97)`，區分「尚未開票」／「已開票未完成」／「已完成」三態（原始設計 T01/T02 這兩個獨立 IF 節點的功能，被整合進更精細的狀態判斷裡）
- **任務依賴防呆**（節點 `T07 Split Tasks And Dependency Guard`）：任務區塊寫明 `依賴：T0X`，依賴的任務未完成就不會被開票（原始設計完全沒有這個機制）

### Jira 開票邏輯 ✅
- 直接讀取 `_spec/<slug>/tasks-backend.md`／`tasks-devops.md`／`tasks-qa.md` 原文、用正則切割任務區塊（節點 `T06`/`T06b`/`T06c`/`T07`），取代原設計「從 Notion `Tasks_To_Open` 簡化格式切割」——這樣 Jira 票就能保留任務的完整驗收條件與依賴資訊，不只是一行標題
- Jira Task 開票（節點 `T13 Jira Create Issue`），票面 Description 包含：完整任務內容、Slug、TaskId（`<slug>#<sourceFile>#<taskId>` 格式，避免同編號跨檔案任務互相打架）、ExecMode（AI/手動）
- 開票成功後回填票號到 `tasks-*.md` 原文（節點 `T14`-`T17c`），並自動 git commit——原始設計完全沒有回寫機制，Jira 票開完就跟來源文件斷連
- `Jira_Epic_Key` 回填採「讀取現有值 → 合併去重 → 寫回」（節點 `T18`-`T20`），支援同一個 Phase 增量開票不會蓋掉先前票號，取代原設計的整批覆蓋寫入

### PM/SA Notion 新增任務入口 ✅
- Notion `Tasks_To_Open` 欄位改當「收件匣」：PM/SA 用簡化格式新增任務，n8n 偵測後自動編號、展開成完整任務區塊、寫入對應 `tasks-*.md`、格式錯誤時在 Notion 留言通知（節點 `T04`-`T04k`）——這是原始設計完全沒有的功能，是後來使用者指出「非工程角色沒有入口」才新增的

### Hugo 文件同步 ✅
- 每個 Phase 產出四篇文件：`_index.md`／`spec.md`／`design.md`／`tasks.md`（節點 `T09`-`T12`），取代原設計「只同步任務清單、看不到 SA 規格文件」

---

## 異動原因（對照 `_note/decisions.md`）

| 原始設計缺口 | 對應決策 |
|---|---|
| Jira 票是一次性快照，跟 tasks-*.md 斷連 | `ADW 架構翻修 — tasks-*.md 與 Jira 票雙向同步、Hugo 四篇文件` |
| 冪等判斷只看空值，同 phase 增量開票會被覆蓋 | `支援 phase 開票後增量新增任務` |
| 非工程角色沒有新增任務入口 | `PM/SA 透過 Notion 新增任務的入口設計`、`Notion 新增任務格式錯誤的回饋管道` |
| 開票順序可能跨 Phase 錯亂 | `跨 Phase 開票順序保護規則`、`跨 Phase 開票順序防呆 — Notion Automation` |
| Slug 解析靠猜路徑容易出錯 | `Spec_URL 用途修正 — 改用現成的 Slug 欄位` |

---

## 參考

- 完整節點清單、每個節點的 JS 邏輯：`n8n-workflows/asus-notion-to-jira-hugo.json`
- 決策脈絡與實測過程：`_note/decisions.md`
- 原始逐節點設計（僅供歷史對照，不代表現況）：`tasks-backend-original-design.md`
