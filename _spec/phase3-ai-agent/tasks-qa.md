# Phase 3 — AI 開發代理人：QA 驗收任務清單

> ⬜ 待執行　✅ 已完成
>
> **2026-07-06 重寫說明**：原始驗收案例（`tasks-qa-original-design.md`）針對舊版逐節點設計撰寫，跟實際架構（見 `tasks-backend.md`）對不上。這份文件改成記錄「在 Phase 4 實測過程中已經驗證過的行為」，作為 Phase 3 管線本身可靠度的佐證。

---

## 已驗證行為（Phase 4 實測佐證）

| 行為 | 驗證方式 | 結果 |
|---|---|---|
| Jira Webhook 觸發 | ASUS-107~111 等票號轉 In Progress，皆正確觸發 workflow | ✅ |
| 手動票正確跳過 | ExecMode 為手動的任務轉 In Progress 不會觸發 Claude API | ✅ |
| TDD 紅燈→綠燈完整流程 | ASUS-110（DevOps T02）完整自動跑完：紅燈確認 → 寫業務邏輯 → 綠燈確認 → commit → PR → Jira 更新，全程無人工介入 | ✅ |
| PR 自動建立 | PR #5~#9、#14 皆由 workflow 自動建立，內容範圍與任務規格吻合 | ✅ |
| Jira 狀態自動更新 | 綠燈通過後 Jira 票自動轉 In Review | ✅ |
| 任務檔回寫 | `tasks-*.md` 對應任務的 ⬜→✅ 自動回寫並 commit | ✅ |
| 假紅燈/假綠燈防呆 | 環境錯誤（缺套件、指令不存在、語法錯誤）皆被正確攔截，不會誤判為有效紅/綠燈 | ✅ |
| TDD 阻斷防呆 | ASUS-111 因功能已由其他任務提前實作完成、紅燈階段測試意外先過，正確中止並改為人工確認補測試 | ✅ |
| checkout 失敗防呆 | git checkout 失敗時正確中止，Jira 保持 In Progress，不會用錯誤分支繼續跑 | ✅ |

## 已知限制（記錄於 `_note/decisions.md`）

- **AI 生成品質非百分之百穩定**：曾出現識別字帶空白、巢狀 JSON 未跳脫、業務邏輯本身有 bug（如 ASUS-108 的 `formatEmailSubject` 票號重複前綴）等狀況，皆屬於個案性生成瑕疵，非架構缺陷，已透過 System Prompt 補強規則降低復發機率，但無法保證完全根除
- **worktree race condition**、**Agent Runner 編碼 bug**：見 Phase 2 `tasks-qa.md` 對應條目（同一套基礎設施共用）

## 參考

- 決策脈絡：`_note/decisions.md`
- 原始驗收案例（僅供歷史對照，不代表現況）：`tasks-qa-original-design.md`
