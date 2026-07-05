# Phase 5 AWS CDK 自動部署 — QA 驗收任務

> 執行時機：DevOps T01-T06 與 Backend T01-T05 全部完成後執行
> ⬜ 待執行　✅ 已完成

## 前置閱讀

- `_spec/phase5-aws-deploy/spec.md`（驗收條件 AC1-AC8）
- `_spec/phase5-aws-deploy/design.md`

## 前置條件

- AWS CDK 已完成首次部署
- API Gateway URL 與 CloudFront URL 已取得（從 GitHub Actions log 或 AWS Console）
- n8n `deploy-complete` workflow 已啟用

---

## 驗收案例

| AC | 情境 | 步驟 | 預期結果 | 實際結果 | Pass/Fail |
|----|------|------|---------|---------|-----------|
| AC1 | CDK 部署觸發 | 1. merge PR 進 main<br>2. 觀察 GitHub Actions | deploy job 自動執行，`cdk deploy` 顯示成功，兩個 Stack 均部署完成 | | ⬜ |
| AC2 | 短網址 API 建立 | 1. `curl -X POST <API_URL>/api/shorten -H "Content-Type: application/json" -d '{"url":"https://example.com"}'` | HTTP 200，回傳 `{"shortUrl":"https://<domain>/abc123"}` | | ⬜ |
| AC3 | 短碼轉址正確 | 1. 取 AC2 回傳的 shortUrl<br>2. 瀏覽器開啟該 URL | HTTP 301 轉址至 `https://example.com` | | ⬜ |
| AC4 | 短碼不存在 | 1. `curl <API_URL>/notexist` | HTTP 404，回傳 `{"error":"短網址不存在"}` | | ⬜ |
| AC5 | Hugo 文件站可訪問 | 1. 瀏覽器開啟 CloudFront URL | Hugo Book 文件站正常顯示，頁面標題與導覽列正確 | | ⬜ |
| AC6 | Notion 回填 | 1. AC1 完成後等待 5 分鐘<br>2. 開啟 Notion 功能規格總表 | Phase 5 記錄的 `Deploy_URL` 欄位出現 API Gateway URL | | ⬜ |
| AC7 | Email 通知 | 1. AC1 完成後等待 5 分鐘<br>2. 開啟 SA Gmail | 收到部署完成通知，主旨含 `[ASUS 部署完成]`，內文含 API URL 與文件站 URL | | ⬜ |
| AC8 | DynamoDB 資料驗證 | 1. AC2 完成後<br>2. AWS Console → DynamoDB → ShortUrlTable → Explore items | 存在 AC2 建立的短碼記錄，含 code / originalUrl / createdAt 三個欄位 | | ⬜ |

---

## 驗收執行記錄

**執行日期**：＿＿＿＿＿＿

**執行人員**：＿＿＿＿＿＿

**API Gateway URL**：＿＿＿＿＿＿

**CloudFront URL**：＿＿＿＿＿＿

**整體結果**：⬜ 通過 / ⬜ 部分通過 / ⬜ 未通過

**備註**：
