# 需求草稿：GitLab CI/CD 自動化測試與 PR 審核流程

> 放置於 `adw/_idea/phase4-cicd-review.md`
> 觸發指令：`/addyosmani-spec adw/_idea/phase4-cicd-review.md`

---

## 背景與動機

AI 在本地完成開發並推送 feature branch 後，
不能直接 merge 進 main，必須經過兩道把關：
第一道是 GitLab CI 自動跑測試（雲端二刷），
第二道是 SA（系統分析師，即我本人）用 `/addyosmani-review` 審核程式碼品質。
這個階段確保 AI 產出的程式碼在進入主線前已達到品質標準。

---

## 前置條件（Phase 3 完成後才能進行）

- GitLab repo 已有 feature branch 與 Merge Request
- GitLab CI Runner 已設定（可使用 GitLab.com shared runner）
- n8n 可接收 GitLab Webhook

---

## 目標

### CI 自動化（.gitlab-ci.yml）

建立三個 Stage：

1. **test**：在 CI 環境執行 `npm run test`，確保所有單元測試通過
2. **build-docs**：執行 `hugo --minify` 編譯 Hugo Book，產出 `public/` 作為 artifact
3. **lint**：執行 TypeScript 型別檢查（`tsc --noEmit`）與 ESLint

### PR 審核通知流程

- Merge Request 建立後，GitLab Webhook 通知 n8n
- n8n 發送審核通知（管道：Line Notify 或 Email）給 SA
- 通知內容包含：票號、功能摘要、MR 連結、CI 狀態
- SA 在本地執行 `/addyosmani-review` 審核
- SA Approve 後，GitLab CI 觸發 merge 並進入 Phase 5 部署流程

### 分支保護規則

- `main` branch 設為 protected：禁止直接 push，只能透過 MR merge
- MR merge 條件：CI 全部通過 + 至少一個 Approve
- 自動刪除已 merge 的 feature branch

---

## .gitlab-ci.yml 技術規格

```yaml
# 參考結構（由 addyosmani-spec 產出實際配置）
stages:
  - test
  - lint
  - build-docs

# Node.js 版本：20-alpine
# 快取策略：.npm/ 目錄，key 為 branch slug
# Artifacts：hugo 產出的 public/ 目錄，保留 1 week
# 觸發條件：所有 branch 跑 test + lint，只有 main 跑 build-docs
```

---

## 通知訊息格式

n8n 發送的審核通知，內容必須包含：

```
🔔 新 MR 待審核

票號：ASUS-101
功能：實作 POST /api/shorten
分支：feature/ASUS-101 → main
CI 狀態：✅ 通過（test / lint / build-docs）

MR 連結：https://gitlab.com/.../merge_requests/42

請執行 /addyosmani-review 後 Approve。
```

---

## 技術限制

- CI 環境：GitLab.com shared runner（Docker executor）
- Node.js image：`node:20-alpine`
- Hugo image：`alpine:latest`（apk 安裝 hugo）
- 通知管道：Line Notify（使用 Line Notify API Token，存放於 GitLab CI Variables）
- GitLab API：用於查詢 MR 狀態、自動設定 Assignee

---

## 範圍邊界

**做：**
- `.gitlab-ci.yml` 完整配置（test / lint / build-docs 三個 stage）
- GitLab branch protection 規則設定說明
- n8n 接收 GitLab MR Webhook → 發送 Line Notify 通知
- CI Variables 清單（需要設定哪些環境變數）
- 通知訊息模板

**不做：**
- E2E 測試（PoC 階段只做單元測試）
- 自動 merge（SA 必須手動 Approve，不能全自動合併）
- Slack 整合（PoC 先用 Line Notify 即可）
- AWS 部署（這是 Phase 5 的範圍）

---

## 驗收條件

1. feature branch push 後，GitLab CI 自動觸發，test + lint 兩個 stage 均通過
2. Merge Request 建立後，Line Notify 在 5 分鐘內收到審核通知，包含 MR 連結
3. 直接 push 到 main branch 被 GitLab 拒絕（Protected branch）
4. SA 執行 `/addyosmani-review` 審核無誤後 Approve，GitLab MR 可以 merge
5. Merge 後 feature branch 自動刪除
6. `main` branch 的 CI 成功後，觸發條件寫入 `.gitlab-ci.yml`，準備接 Phase 5
