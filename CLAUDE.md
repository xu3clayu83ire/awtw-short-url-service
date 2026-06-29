# awtw-short-url-service

## 規範來源
- 工作流程：`D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\_rule\workflow.md`
- 編碼風格：`D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\_rule\coding-style.md`
- 技術棧：`D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\awtw-short-url-service\_rule\tech-stack.md`（由第一次 /addyosmani-plan 產生）

---

## 開發流程

```
/addyosmani-init → /addyosmani-spec → /addyosmani-plan → /addyosmani-build → /addyosmani-review → /addyosmani-ship
```

---

## 文件擺放規範

| 產出 | 位置 |
|------|------|
| `/addyosmani-spec` 第一階段（需求、功能清單、驗收條件） | `_spec/<功能>/spec.md` |
| `/addyosmani-spec` 第二階段（架構、資料模型、API 設計） | `_spec/<功能>/design.md` |
| `/addyosmani-plan`（任務清單） | `_spec/<功能>/tasks.md` |
| 決策記錄 | `_note/decisions.md`（找對應議題區塊新增） |
| 部署記錄 | `_note/ship-<版本>.md` |
| Bug 記錄 | `_note/bugs.md` |

---

## /addyosmani-spec 執行規則

分兩階段產出，每階段完成後請使用者確認再繼續：

**第一階段 → `_spec/<功能>/spec.md`**
- 需求理解（用自己的話重述，確認理解正確）
- 功能清單（條列式，每項可獨立驗收）
- 非功能需求（效能、安全性、限制）
- 範圍邊界（明確列出**不做**的事）
- 驗收條件（每個功能的 done criteria）

**第二階段 → `_spec/<功能>/design.md`**
- 技術架構（Mermaid 或文字描述）
- 模組拆解（每個模組的職責與介面）
- 資料模型（型別定義或 schema）
- API 設計（REST endpoints 或 GraphQL schema）
- 關鍵技術決策（選用理由 + 備選方案）
- 已知風險與對策

---

## /addyosmani-plan 執行規則

1. 讀取 `_spec/<功能>/spec.md` 和 `_spec/<功能>/design.md`
2. 若 `_rule/tech-stack.md` 不存在：
   - 萃取 spec.md 和 design.md 中確認的技術棧
   - 若 `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\_rule\` 下有對應的 `type-*.md` 則參考其慣例
   - 產出 `_rule/tech-stack.md`，請使用者確認後再繼續
3. 產出 `_spec/<功能>/tasks.md`

**tasks.md 格式範本：**
```markdown
# <功能名稱> — 任務拆解

> 每個任務設計為獨立可驗證，完成後有明確的檢查點。
> ⬜ 待執行　✅ 已完成

---

## Phase 0 — <階段名稱>（~Xh）

### T01 — <任務名稱> ⬜
<任務描述>

**完成定義**：<具體可驗證的條件，含執行指令>

---

### T02 — <任務名稱> ⬜
**依賴**：T01
<任務描述>

**完成定義**：<具體可驗證的條件>
```

---

## /addyosmani-build 執行規則

每次執行前，依序讀取：
1. `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\_rule\workflow.md`
2. `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\_rule\coding-style.md`
3. `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\awtw-short-url-service\_rule\tech-stack.md`
4. `D:\06_Workspace\Workspace_GitHub\xu3clayu83ire\alag-addyosmani-demos\awtw-short-url-service\_spec\<功能>\tasks.md`

找到第一個 `⬜` 任務後：
- TDD 實作（先寫測試，測試失敗後再實作）
- 執行單元測試確認通過
- 將 `⬜` 改為 `✅`
- Commit（格式遵循 workflow.md）
- 繼續下一個 `⬜` 任務

---

## 決策管控

以下情況**禁止自行決定**，必須暫停列出選項請使用者確認：

- 技術選型（框架、資料庫、第三方服務）
- API 契約變更（endpoint、參數、回傳格式）
- 資料庫 schema 異動
- 需求範圍超出 `_spec/<功能>/spec.md` 的定義
- 任何不可逆操作（刪除、migration、資料覆寫）

確認後，在 `_note/decisions.md` 找到對應議題區塊新增記錄：
```markdown
### [<日期>] <決定標題>
- **選項**：<選項 A> / <選項 B>
- **決定**：<選擇>
- **理由**：<原因>
- **取捨**：<接受的代價>
```

---

## 發現錯誤時的規則

| 情況 | 處理方式 |
|------|---------|
| 實作錯誤（程式寫錯，設計正確） | 直接修正程式，不更新文件 |
| 設計有誤（設計本身有問題） | 暫停 → 說明問題 → 等使用者確認 → 先更新 spec.md 或 design.md → 再改程式 |
| 需超出 spec 範圍 | 暫停 → 說明原因 → 等使用者決定 |

**核心原則：文件是真相來源，程式跟著文件走。文件沒改，程式不能偏離文件。**

---

## 測試時機

| 測試類型 | 時機 |
|---------|------|
| 單元測試 | 每個 task 實作時（TDD，先寫失敗測試再實作） |
| 整合測試 | 一個 spec 所有 tasks 的 `⬜` 全部變為 `✅` 後 |
| E2E 測試 | /addyosmani-ship 之前 |

---

## /addyosmani-review 執行規則

執行 /addyosmani-review 後，若發現問題：
- 將每個問題轉為新的 `⬜` 任務加回 `tasks.md` 對應的 Phase
- 不另開文件，統一用 tasks.md 追蹤

---

## /addyosmani-ship 執行規則

部署完成後，建立 `_note/ship-<版本>.md`：

```markdown
# 部署記錄 — v<版本>

- **部署時間**：<日期時間>
- **版本**：<版本號>
- **部署目標**：<環境>
- **E2E 測試結果**：通過 / 部分通過（說明）
- **異動摘要**：<本次部署包含哪些 spec>
- **Rollback 方式**：<指令或步驟>
```
