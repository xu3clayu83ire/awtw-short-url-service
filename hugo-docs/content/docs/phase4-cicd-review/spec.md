---
title: "Phase 4 — GitHub Actions CI/CD 自動化測試與 PR 審核流程 — 規格文件"
weight: 4
---

# Phase 4 — GitHub Actions CI/CD 自動化測試與 PR 審核流程：規格文件

> 閱讀對象：PM、全員
> 產出工具：/addyosmani-saspec
> 前置條件：Phase 3 全部完成

---

## 需求理解

Phase 3 已能讓 AI 自動產出程式碼並推送 feature branch、建立 PR。Phase 4 的目標是在 PR 進入 main 之前加上兩道把關：

第一道是 **GitHub Actions 自動跑測試**（雲端二刷），確保 AI 產出的程式碼在 CI 環境也能通過；第二道是 **SA（系統分析師）收到 Email 通知**後，在本地執行 `/addyosmani-review` 審核程式碼品質，Approve 後才能 merge。

整個流程確保：AI 產出的程式碼在進入 main 之前，已同時通過機器驗證（CI）與人工審核（SA Review）。

---

## 功能清單

| # | 功能項目 | 負責角色 |
|---|---------|---------|
| F1 | GitHub Actions workflow：push 任意 branch 觸發 test + lint | DevOps |
| F2 | GitHub Actions workflow：push main 額外觸發 build-docs | DevOps |
| F3 | CI test stage：執行 `npm run test`，確保單元測試通過 | DevOps |
| F4 | CI lint stage：執行 `tsc --noEmit` + ESLint 型別與風格檢查 | DevOps |
| F5 | CI build-docs stage：執行 `hugo --minify`，產出 `public/` artifact | DevOps |
| F6 | GitHub branch protection：main 禁止直接 push，PR 需 CI 通過 + 至少一個 Approve | DevOps |
| F7 | n8n 接收 GitHub PR Webhook → 發送 Email 審核通知給 SA | Backend |
| F8 | 通知內容包含：票號、功能摘要、PR 連結、CI 狀態 | Backend |
| F9 | SA 執行 `/addyosmani-review` 審核後 Approve，PR 可 merge | QA |
| F10 | PR merge 後，feature branch 自動刪除 | DevOps |

---

## 非功能需求

- **安全性**：Email SMTP 帳密存於 n8n Credential，不寫入程式碼
- **速度**：CI 執行時間目標 < 3 分鐘（含 test + lint）
- **可觀測性**：CI 每個 step 輸出完整 log，失敗時 GitHub PR 頁面顯示紅燈
- **冪等性**：同一 PR 重複推送只觸發一次最新的 CI run，不重複發送通知
- **Node.js 版本**：20.x（與本地開發環境一致）

---

## 範圍邊界

**本 Phase 做：**
- `.github/workflows/ci.yml`：test + lint（所有 branch）
- `.github/workflows/ci.yml`：build-docs（僅 main branch）
- GitHub branch protection rules 設定說明
- n8n workflow：接收 GitHub PR Webhook → Email 通知
- Email 通知訊息模板
- GitHub Actions Secrets 清單文件

**本 Phase 不做：**
- E2E 測試（PoC 階段只做單元測試）
- 自動 merge（SA 必須手動 Approve）
- Slack / Line 整合（PoC 先用 Email）
- AWS 部署（Phase 5 範圍）
- 藍燈重構自動化（人工判斷是否需要重構）

---

## 驗收條件

| # | 情境 | 操作 | 預期結果 |
|---|------|------|---------|
| AC1 | CI 自動觸發 | push feature branch 到 GitHub | GitHub Actions 自動執行 test + lint 兩個 job |
| AC2 | CI test 通過 | AC1 完成，測試全部 pass | GitHub PR 頁面顯示 test job 綠燈 ✅ |
| AC3 | CI lint 通過 | AC1 完成，TypeScript 無型別錯誤 | GitHub PR 頁面顯示 lint job 綠燈 ✅ |
| AC4 | CI 失敗阻擋 | 故意引入測試失敗後 push | GitHub PR 頁面顯示紅燈，無法 merge |
| AC5 | Branch protection | 直接 push 到 main | GitHub 拒絕，顯示 protected branch 錯誤 |
| AC6 | Email 通知 | PR 建立後 5 分鐘內 | SA 收到 Email，包含票號、PR 連結、CI 狀態 |
| AC7 | build-docs 僅 main | merge 進 main 後 | GitHub Actions 執行 build-docs job，產出 `public/` artifact |
| AC8 | SA Review 流程 | SA 執行 `/addyosmani-review` 後 Approve | PR 顯示 Approved，可進行 merge |
| AC9 | Feature branch 清理 | PR merge 後 | feature branch 自動刪除，GitHub branch 列表不再顯示 |
