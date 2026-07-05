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
| AC6 | Email 通知 | 1. 建立新 PR（title 含 `[ASUS-N]`）<br>2. 等待 5 分鐘 | SA Gmail 收到通知信，主旨含 `[ADW 審核通知]`，內文含 PR 連結 | | ⬜ |
| AC7 | build-docs 僅 main | 1. merge PR 進 main<br>2. 觀察 Actions 執行 | build-docs job 執行，Artifacts 欄位出現 `hugo-public`（feature branch push 時不執行） | | ⬜ |
| AC8 | SA Review 流程 | 1. SA 在本地執行 `/addyosmani-review`<br>2. 至 GitHub PR 頁面 Approve | PR 頁面顯示 `Approved`，merge 按鈕可點擊 | | ⬜ |
| AC9 | Feature branch 清理 | 1. SA Approve 後執行 merge<br>2. 至 GitHub repo → Branches 頁面 | feature branch 已自動刪除，不再出現於列表 | | ⬜ |

---

## 驗收執行記錄

**執行日期**：＿＿＿＿＿＿

**執行人員**：＿＿＿＿＿＿

**整體結果**：⬜ 通過 / ⬜ 部分通過 / ⬜ 未通過

**備註**：
