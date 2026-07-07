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
| AC1 | CI 自動觸發 | 1. 建立 feature branch<br>2. push 至 GitHub | GitHub repo → Actions tab 出現新執行記錄，test + lint job 啟動 | 每個 PR push 都正確觸發，Actions 頁面確認 | ✅ |
| AC2 | CI test 通過 | 1. AC1 完成<br>2. 等待 CI 執行完成 | test job 顯示綠燈 ✅，PR 頁面 checks 通過 | PR #14 修正 rollup lockfile 平台 bug 後，main 上最新一次執行 test job 綠燈 | ✅ |
| AC3 | CI lint 通過 | 1. AC1 完成<br>2. 等待 CI 執行完成 | lint job 顯示綠燈 ✅，PR 頁面 checks 通過 | 同上，lint job 綠燈 | ✅ |
| AC4 | CI 失敗阻擋 | 1. 在 feature branch 引入語法錯誤<br>2. push 至 GitHub<br>3. 嘗試 merge PR | GitHub PR 頁面顯示紅燈 ❌，merge 按鈕呈灰色無法點擊 | PR #11：lint job 顯示紅燈 ❌，`mergeable_state: blocked`（required status checks 未通過），T04 完成並勾選 no-bypass 後複測通過 | ✅ |
| AC5 | Branch protection | 1. 本地切換至 main<br>2. 執行 `git push origin main` | GitHub 拒絕 push，終端機顯示 `GH006: Protected branch update failed` | 實測直接 push main，錯誤訊息完全吻合：`remote: error: GH006: Protected branch update failed for refs/heads/main.`（首次測試時 repo owner 帳號預設可繞過規則，勾選「Do not allow bypassing」後複測通過） | ✅ |
| AC6 | Email 通知 | 1. 建立新 PR（title 含 `[ASUS-N]`）<br>2. 等待 5 分鐘 | SA Gmail 收到通知信，主旨含 `[ASUS 審核通知]`，內文含 PR 連結 | | ⬜ |
| AC7 | build-docs 僅 main | 1. merge PR 進 main<br>2. 觀察 Actions 執行 | build-docs job 執行，Artifacts 欄位出現 `hugo-public`（feature branch push 時不執行） | main 分支上的 #54 執行記錄（docs commit 直接推送，非 PR merge）確認出現 build-docs job 且 Artifacts 有 `hugo-public`，證實只要是 main 分支的 push（不限 PR merge）就會觸發 | ✅ |
| AC8 | SA Review 流程 | 1. SA 在本地執行 `/addyosmani-review`<br>2. 至 GitHub PR 頁面 Approve | PR 頁面顯示 `Approved`，merge 按鈕可點擊 | PR #13：GitHub 不允許帳號核准自己開的 PR（422 Can not approve your own pull request），且 repo owner 的 bypass 權限連「required approvals: 1」也一併繞過，即使 0 個 approval 仍 merge 成功。單一帳號的 PoC 環境架構上無法驗證這條 | 🟡環境限制（非缺陷） |
| AC9 | Feature branch 清理 | 1. SA Approve 後執行 merge<br>2. 至 GitHub repo → Branches 頁面 | feature branch 已自動刪除，不再出現於列表 | Repo Settings 的「Automatically delete head branches」已由使用者手動勾選並確認生效（`delete_branch_on_merge: true`）。步驟本身「SA Approve 後 merge」跟 AC8 是同一個環境限制（單一帳號無法自我 approve、owner bypass 讓 0 approval 也能 merge），但「merge 後分支是否自動清除」這個結果本身已驗證為 ✅ | 🟡 設定已生效，approval 步驟同 AC8 環境限制 |

---

## 驗收執行記錄

**執行日期**：＿＿＿＿＿＿

**執行人員**：＿＿＿＿＿＿

**整體結果**：⬜ 通過 / ⬜ 部分通過 / ⬜ 未通過

**備註**：
