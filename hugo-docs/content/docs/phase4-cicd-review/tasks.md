---
title: "Phase 4 — GitHub Actions CI/CD 自動化測試與 PR 審核流程 — 任務清單"
weight: 4
---

## Backend

# Phase 4 CI/CD 審核流程 — Backend 任務拆解

> 每個任務設計為獨立可驗證，完成後有明確的檢查點。
> ⬜ 待執行　✅ 已完成
>
> 執行方式：🤖 AI 執行（ASUS 自動產出程式碼）　👤 手動執行（Console/CLI 操作）

## 前置閱讀

- `_spec/phase4-cicd-review/spec.md`
- `_spec/phase4-cicd-review/design.md`
- `_rule/workflow.md`
- `_rule/coding-style.md`

## 前置條件

- Phase 4 DevOps T01 已完成（GitHub Actions CI 已建立）
- n8n 已啟動，ngrok 已運行並取得公開 URL
- Gmail 帳號已開啟「應用程式密碼」（App Password）

---

## Phase 0 — n8n PR 通知 Workflow（~2h）

### T01 — 建立 GitHub PR Webhook ⬜　👤 手動執行　(ASUS-101)

至 GitHub repo → Settings → Webhooks → Add webhook：
- Payload URL：`https://<ngrok-url>/webhook/github-pr`
- Content type：`application/json`
- Events：`Pull requests`（僅勾選 Pull request）

> 👤 手動原因：GitHub Console 設定操作，無程式碼產出。

**完成定義**：
- 🟢 綠燈確認：手動建立測試 PR 後，n8n Webhook 節點收到 payload，`action` 欄位為 `opened`
- 執行指令：n8n Executions 頁面出現新記錄

---

### T02 — 建立 n8n PR 通知 Workflow ⬜　🤖 AI 執行　(ASUS-108)

**依賴**：T01

在 n8n 建立新 workflow `github-pr-notify`，節點依序為：

1. **Webhook**（POST `/webhook/github-pr`）
2. **Code node「解析 PR 資訊」**：萃取 jiraKey、prTitle、prUrl、prNumber、branch、author
3. **Send Email node**：寄送審核通知至 SA Email

**完成定義**：
- 測試命名：`應該_發送Email通知_當GitHub PR被建立`
- 🔴 紅燈確認：Webhook 收到 payload 但 Email node 未設定，workflow 執行失敗
- 🟢 綠燈確認：建立測試 PR 後，SA Email 收到通知，主旨格式為 `[ASUS 審核通知] [ASUS-N] 功能描述`

---

### T03 — 設定 n8n Gmail SMTP Credential ⬜　👤 手動執行

**依賴**：T02

在 n8n Credentials 新增 Gmail SMTP：
- Host：`smtp.gmail.com`
- Port：`465`（SSL）
- User：SA Gmail 帳號
- Password：Gmail App Password（非登入密碼）

> 👤 手動原因：帳號密碼等敏感設定需手動輸入至 n8n，不可寫入程式碼。

**完成定義**：
- 🟢 綠燈確認：n8n Send Email node 測試連線成功，收件匣出現測試信

---

### T04 — 實作 PR 資訊解析 Code node ⬜　🤖 AI 執行　(ASUS-109)

**依賴**：T01

實作解析邏輯，處理以下情境：
- PR title 符合格式 `[ASUS-N] 描述` → 正常萃取票號
- PR title 不含票號 → jiraKey 回傳 `（無票號）`，不中斷流程

```javascript
const payload = $input.first().json.body ?? $input.first().json;
const pr = payload.pull_request ?? {};
const titleMatch = pr.title?.match(/\[([A-Z]+-\d+)\]/);
const jiraKey = titleMatch ? titleMatch[1] : '（無票號）';

return [{
  json: {
    jiraKey,
    prTitle: pr.title ?? '',
    prUrl: pr.html_url ?? '',
    prNumber: pr.number ?? '',
    branch: pr.head?.ref ?? '',
    author: pr.user?.login ?? '',
  }
}];
```

**完成定義**：
- 測試命名：`應該_萃取票號_當PR標題符合格式` / `應該_回傳無票號_當PR標題不含票號`
- 🔴 紅燈確認：Code node 無解析邏輯，jiraKey 為 undefined
- 🟢 綠燈確認：兩種情境均正確解析，n8n Execution log 顯示正確欄位值

---

### T05 — 匯出 n8n Workflow JSON ⬜　👤 手動執行

**依賴**：T02、T03、T04

將完成的 `github-pr-notify` workflow 從 n8n 匯出為 JSON，存至：
`n8n-workflows/github-pr-notify.json`

> 👤 手動原因：需從 n8n 介面手動匯出，再 commit 至 repo。

**完成定義**：
- 🟢 綠燈確認：`n8n-workflows/github-pr-notify.json` 檔案存在，commit 進 main branch

---

## Notion 開票格式

```
[Backend][手動] 建立 GitHub PR Webhook 至 n8n｜TDD: 應該_接收Webhook_當PR被建立
[Backend][AI] 建立 n8n github-pr-notify workflow｜TDD: 應該_發送Email通知_當GitHub PR被建立
[Backend][手動] 設定 n8n Gmail SMTP Credential｜TDD: 應該_發送Email成功_當SMTP設定正確
[Backend][AI] 實作 PR 資訊解析 Code node｜TDD: 應該_萃取票號_當PR標題符合格式
[Backend][手動] 匯出 github-pr-notify workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
```


## DevOps

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

### T02 — 設定 npm scripts（lint） ⬜　🤖 AI 執行　(ASUS-110)

**依賴**：T01

確認 `package.json` 中有 `lint` script（`tsc --noEmit`），若不存在則新增。

**完成定義**：
- 測試命名：`應該_型別檢查通過_當程式碼無型別錯誤`
- 🔴 紅燈確認：`npm run lint` 指令不存在，CI lint job 失敗
- 🟢 綠燈確認：`npm run lint` 本地執行通過，CI lint job 顯示 ✅

---

### T03 — 新增 build-docs job ⬜　🤖 AI 執行　(ASUS-111)

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

### T04 — 設定 GitHub Branch Protection ⬜　👤 手動執行

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


## QA

# Phase 4 CI/CD 審核流程 — QA 驗收任務

> 執行時機：DevOps T01-T04 與 Backend T01-T05 全部完成後執行
> ⬜ 待執行　✅ 已完成

## 前置閱讀

- `_spec/phase4-cicd-review/spec.md`（驗收條件 AC1-AC9）
- `_spec/phase4-cicd-review/design.md`

## 前置條件

- GitHub Actions CI workflow 已部署（`.github/workflows/ci.yml` 存在於 main）
- n8n `github-pr-notify` workflow 已啟用
- GitHub Branch Protection 已設定
- SA Gmail 可正常收信

---

## 驗收案例

| AC | 情境 | 步驟 | 預期結果 | 實際結果 | Pass/Fail |
|----|------|------|---------|---------|-----------|
| AC1 | CI 自動觸發 | 1. 建立 feature branch<br>2. push 至 GitHub | GitHub repo → Actions tab 出現新執行記錄，test + lint job 啟動 | | ⬜ |
| AC2 | CI test 通過 | 1. AC1 完成<br>2. 等待 CI 執行完成 | test job 顯示綠燈 ✅，PR 頁面 checks 通過 | | ⬜ |
| AC3 | CI lint 通過 | 1. AC1 完成<br>2. 等待 CI 執行完成 | lint job 顯示綠燈 ✅，PR 頁面 checks 通過 | | ⬜ |
| AC4 | CI 失敗阻擋 | 1. 在 feature branch 引入語法錯誤<br>2. push 至 GitHub<br>3. 嘗試 merge PR | GitHub PR 頁面顯示紅燈 ❌，merge 按鈕呈灰色無法點擊 | | ⬜ |
| AC5 | Branch protection | 1. 本地切換至 main<br>2. 執行 `git push origin main` | GitHub 拒絕 push，終端機顯示 `GH006: Protected branch update failed` | | ⬜ |
| AC6 | Email 通知 | 1. 建立新 PR（title 含 `[ASUS-N]`）<br>2. 等待 5 分鐘 | SA Gmail 收到通知信，主旨含 `[ASUS 審核通知]`，內文含 PR 連結 | | ⬜ |
| AC7 | build-docs 僅 main | 1. merge PR 進 main<br>2. 觀察 Actions 執行 | build-docs job 執行，Artifacts 欄位出現 `hugo-public`（feature branch push 時不執行） | | ⬜ |
| AC8 | SA Review 流程 | 1. SA 在本地執行 `/addyosmani-review`<br>2. 至 GitHub PR 頁面 Approve | PR 頁面顯示 `Approved`，merge 按鈕可點擊 | | ⬜ |
| AC9 | Feature branch 清理 | 1. SA Approve 後執行 merge<br>2. 至 GitHub repo → Branches 頁面 | feature branch 已自動刪除，不再出現於列表 | | ⬜ |

---

## 驗收執行記錄

**執行日期**：＿＿＿＿＿＿

**執行人員**：＿＿＿＿＿＿

**整體結果**：⬜ 通過 / ⬜ 部分通過 / ⬜ 未通過

**備註**：

