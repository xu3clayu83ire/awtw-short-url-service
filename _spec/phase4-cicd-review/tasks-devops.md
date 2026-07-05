# Phase 4 CI/CD 審核流程 — DevOps 任務拆解

> 每個任務設計為獨立可驗證，完成後有明確的檢查點。
> ⬜ 待執行　✅ 已完成
>
> 執行方式：🤖 AI 執行（ASUS 自動產出程式碼）　👤 手動執行（Console/CLI 操作）

## 前置閱讀

- `_spec/phase4-cicd-review/spec.md`
- `_spec/phase4-cicd-review/design.md`
- `_rule/workflow.md`

---

## Phase 0 — GitHub Actions CI 建置（~2h）

### T01 — 建立 CI workflow 檔案 ✅　🤖 AI 執行　(ASUS-107)

在 `.github/workflows/ci.yml` 建立 GitHub Actions workflow，包含：
- `test` job：`npm ci` + `npm run test`
- `lint` job：`npm ci` + `npx tsc --noEmit`
- 兩個 job 平行執行，觸發條件為所有 branch push 與 PR

**完成定義**：
- 測試命名：`應該_顯示綠燈_當測試全數通過`
- 🔴 紅燈確認：push feature branch，GitHub Actions 尚未出現（無 workflow 檔）
- 🟢 綠燈確認：push 後 Actions tab 出現執行記錄，test + lint 兩個 job 均顯示 ✅
- 執行指令：`git push origin feature/test-ci` 後至 GitHub repo → Actions 頁面確認

---

### T02 — 設定 npm scripts（lint） ✅　🤖 AI 執行　(ASUS-110)

**依賴**：T01

確認 `package.json` 中有 `lint` script（`tsc --noEmit`），若不存在則新增。

**完成定義**：
- 測試命名：`應該_型別檢查通過_當程式碼無型別錯誤`
- 🔴 紅燈確認：`npm run lint` 指令不存在，CI lint job 失敗
- 🟢 綠燈確認：`npm run lint` 本地執行通過，CI lint job 顯示 ✅

---

### T03 — 新增 build-docs job ✅　🤖 AI 執行　(ASUS-111)

**依賴**：T01

在 `ci.yml` 新增 `build-docs` job：
- 使用 `peaceiris/actions-hugo@v3`
- 僅在 `refs/heads/main` 觸發（`if: github.ref == 'refs/heads/main'`）
- 產出 `hugo-docs/public/` 為 artifact，保留 7 天

**完成定義**：
- 測試命名：`應該_產出Hugo artifact_當merge進main`
- 🔴 紅燈確認：feature branch push 時 build-docs job 不執行
- 🟢 綠燈確認：merge 進 main 後 Actions 頁面出現 build-docs job ✅，Artifacts 欄位有 `hugo-public`

---

### T04 — 設定 GitHub Branch Protection ⬜　👤 手動執行　(ASUS-113)

**依賴**：T01、T02

至 GitHub repo → Settings → Branches → Add rule，設定 main branch 保護規則：
- Require pull request before merging（Required approvals: 1）
- Require status checks：`test`、`lint`
- Require branches to be up to date
- Automatically delete head branches

> 👤 手動原因：GitHub Console 操作，無法用程式碼表達，不適用 TDD 流程。

**完成定義**：
- 🟢 綠燈確認：直接 `git push origin main` 被拒絕，顯示 protected branch 錯誤（AC5）
- 執行指令：`git push origin main` 預期輸出 `remote: error: GH006: Protected branch update failed`

---

## Notion 開票格式

```
[DevOps][AI] 建立 GitHub Actions CI workflow（test + lint）｜TDD: 應該_顯示綠燈_當測試全數通過
[DevOps][AI] 設定 package.json lint script｜TDD: 應該_型別檢查通過_當程式碼無型別錯誤
[DevOps][AI] 新增 build-docs job（僅 main branch）｜TDD: 應該_產出Hugo artifact_當merge進main
[DevOps][手動] 設定 GitHub Branch Protection Rules｜TDD: 應該_拒絕直接push_當目標為main
```
