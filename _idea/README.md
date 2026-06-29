# ADW _idea 草稿文件說明

這五份文件是「AI 驅動自動化開發工作流（ADW）」各階段的需求草稿，
設計給你的 `addyosmani-spec` skill 讀取，自動產出三階段規格文件。

---

## 使用方式

把這五份文件放入你的專案 `adw/_idea/` 目錄後，
依照順序在 Claude Code 執行：

```bash
# Phase 1：本地基礎設施 + Notion 資料庫
/addyosmani-spec adw/_idea/phase1-infrastructure.md

# Phase 2：n8n 自動化分流管線
/addyosmani-spec adw/_idea/phase2-n8n-pipeline.md

# Phase 3：Jira Webhook → Claude API 全自動開發
/addyosmani-spec adw/_idea/phase3-ai-agent.md

# Phase 4：GitLab CI/CD + PR 審核流程
/addyosmani-spec adw/_idea/phase4-cicd-review.md

# Phase 5：AWS CDK 自動部署
/addyosmani-spec adw/_idea/phase5-aws-deploy.md
```

每份文件執行後，`addyosmani-spec` 會依序產出：
- `adw/_spec/<phase>/step1-requirements.md`
- `adw/_spec/<phase>/step2-design.md`
- `adw/_spec/<phase>/step3-tasks.md`

---

## 建議執行順序

不需要一次把五個都跑完。
**建議先執行 Phase 1 → 確認規格 → 實作 → 驗收完成後再跑 Phase 2。**
每個 Phase 都有明確的「前置條件」，確保上一段跑通才繼續。

---

## 各階段對應關係

| 檔案 | 階段 | 核心產出 |
|---|---|---|
| phase1-infrastructure.md | 地基 | docker-compose.yml、Hugo 初始化、Notion DB 規範、send_spec.sh |
| phase2-n8n-pipeline.md | 自動化管線 | n8n Workflow（Notion Trigger → Jira + Hugo） |
| phase3-ai-agent.md | AI 開發代理人 | Jira Webhook → Claude API → TDD → git commit |
| phase4-cicd-review.md | 品質把關 | .gitlab-ci.yml、Line Notify 審核通知 |
| phase5-aws-deploy.md | 雲端部署 | CDK ApiStack + DocsStack、deploy stage |

---

## PoC 目標功能：個人縮網址服務

整個系統用「短網址服務」當白老鼠：
- 架構獨立，不影響任何現有系統
- API 只有兩支（POST 建立、GET 轉址），TDD 測試案例天然清晰
- 覆蓋完整技術棧：Lambda + API Gateway + DynamoDB + CloudFront
