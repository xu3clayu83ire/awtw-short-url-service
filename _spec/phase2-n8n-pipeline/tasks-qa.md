# Phase 2 — n8n 自動化管線：QA 驗收任務清單

> ⬜ 待執行　✅ 已完成
>
> **2026-07-06 重寫說明**：原始驗收案例（`tasks-qa-original-design.md`）是針對舊版「直接在 Notion Tasks_To_Open 寫完整任務、Front Matter 直接同步任務清單」設計撰寫的，跟實際架構（見 `tasks-backend.md`）對不上。這份文件改成記錄「在 Phase 4 實測過程中已經驗證過的行為」，作為 Phase 2 管線本身可靠度的佐證，不是重新設計一套新的驗收案例。

---

## 已驗證行為（Phase 4 實測佐證）

| 行為 | 驗證方式 | 結果 |
|---|---|---|
| Jira 開票成功 | Phase 4 Backend/DevOps 各任務轉票（ASUS-101、107~113 等）皆成功開票，票面含完整任務內容、Slug、TaskId、ExecMode | ✅ |
| 任務依賴防呆 | 依賴未完成的任務（如 DevOps T02/T03 依賴 T01）在 T01 未完成前未被搶先開票 | ✅ |
| 跨 Phase 開票順序防呆 | Phase 5 提前設為 `Ready to Plan` 測試，`Jira_Epic_Key` 經過至少一輪排程仍維持空白，確認防呆生效 | ✅ |
| 冪等判斷（不重複開票） | 同一任務多次排程輪詢，未觀察到重複開票（除已知的 race condition 事件，見下方「已知限制」） | ✅ |
| `Jira_Epic_Key` 增量 append | ASUS-108~111 分批開票，Notion `Jira_Epic_Key` 正確累加，未覆蓋先前票號 | ✅ |
| Hugo 四篇文件同步 | `hugo-docs/content/docs/phase4-cicd-review/` 下 `_index.md`／`spec.md`／`design.md`／`tasks.md` 皆存在且內容跟 `_spec/` 同步 | ✅ |
| 任務票號回填到 tasks-*.md | `_spec/phase4-cicd-review/tasks-*.md` 各任務標頭正確帶有 `(ASUS-N)` 註記 | ✅ |

## 已知限制（記錄於 `_note/decisions.md`）

- **worktree race condition**：排程同步 workflow 與 Jira 觸發開發 workflow 若共用同一個 git 工作目錄，曾發生互相干擾、資料差點遺失的事件（已修復，改用三個獨立 worktree，見「asus-dev-workflow 改用獨立 worktree」決策）
- **Agent Runner 編碼 bug**：HTTP body 逐 chunk 解碼曾造成中文字元損毀（已修復，見「修正 Agent Runner HTTP body 逐 chunk 解碼」決策）

## 參考

- 決策脈絡：`_note/decisions.md`
- 原始驗收案例（僅供歷史對照，不代表現況）：`tasks-qa-original-design.md`
