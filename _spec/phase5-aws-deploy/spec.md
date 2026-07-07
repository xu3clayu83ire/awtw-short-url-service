# Phase 5 — AWS CDK 自動部署（短網址 API + Hugo Book 文件站）：規格文件

> 閱讀對象：PM、全員
> 產出工具：/addyosmani-saspec
> 前置條件：Phase 4 全部完成（main branch CI 通過、SA Approve 後 merge）

---

## 需求理解

Phase 4 完成後，main branch 已有人工審核與 CI 把關。Phase 5 的目標是讓 merge 進 main 這個動作自動觸發 AWS 部署，把短網址 API 與 Hugo Book 技術文件站同步上線，不需要任何手動操作。

部署完成後，n8n 自動把兩個服務的 URL 回填到 Notion，並發送 Email 通知 SA。整個 ASUS 系統的自動化閉環在此完成。

---

## 功能清單

| # | 功能項目 | 負責角色 |
|---|---------|---------|
| F1 | AWS CDK ApiStack：Lambda + API Gateway + DynamoDB（短網址後端） | DevOps |
| F2 | AWS CDK DocsStack：S3 + CloudFront（Hugo Book 文件站） | DevOps |
| F3 | GitHub Actions deploy stage：merge 進 main 後觸發 `cdk deploy` | DevOps |
| F4 | DynamoDB Table：存放短網址對應資料（code / originalUrl / createdAt） | Backend |
| F5 | Lambda 實作 POST /api/shorten：產生短碼、存入 DynamoDB | Backend |
| F6 | Lambda 實作 GET /{code}：查詢 DynamoDB，301 轉址或 404 | Backend |
| F7 | n8n 監聽 GitHub Actions 完成 Webhook → 取得 CDK Output URL | Backend |
| F8 | n8n 回填 Notion Deploy_URL 欄位（API URL + 文件站 URL） | Backend |
| F9 | n8n 發送 Email 部署完成通知給 SA | Backend |

---

## 非功能需求

- **安全性**：AWS 金鑰存於 GitHub Actions Secrets，不寫入程式碼；DynamoDB 僅 Lambda 可存取
- **成本**：DynamoDB On-demand 計費、Lambda 按需計費，PoC 期間預估月費 < $1 USD
- **效能**：Lambda cold start 目標 < 1 秒；DynamoDB 查詢 < 50ms
- **可觀測性**：CloudWatch Log Group 記錄 Lambda 執行 log
- **AWS Region**：`us-east-1`（北維吉尼亞，沿用既有 CDKToolkit bootstrap，見 `_note/decisions.md`）
- **CDK 語言**：TypeScript
- **Lambda Runtime**：Node.js 20.x

---

## 範圍邊界

**本 Phase 做：**
- CDK ApiStack：Lambda + API Gateway (HTTP API) + DynamoDB
- CDK DocsStack：S3 + CloudFront (OAC) + BucketDeployment
- GitHub Actions deploy stage（僅 main branch）
- n8n：GitHub Actions 完成 Webhook → 回填 Notion + 發送 Email
- GitHub Actions Secrets 清單文件（AWS 金鑰）

**本 Phase 不做：**
- 自訂 Domain / SSL 憑證（使用 CloudFront / API Gateway 預設 domain）
- 點擊統計功能
- 使用者帳號系統
- CloudFront WAF 設定
- 多環境部署（staging / production）
- Rollback 機制（出問題直接重部署）
- E2E 測試（PoC 只做 API 手動驗證）

---

## 驗收條件

| # | 情境 | 操作 | 預期結果 |
|---|------|------|---------|
| AC1 | CDK 部署觸發 | merge PR 進 main | GitHub Actions deploy stage 自動執行，`cdk deploy` 成功 |
| AC2 | 短網址 API 可呼叫 | `curl -X POST <API_URL>/api/shorten -d '{"url":"https://example.com"}'` | 回傳 `{"shortUrl": "https://<domain>/abc123"}`，HTTP 200 |
| AC3 | 短碼轉址正確 | 瀏覽器開啟 `<API_URL>/<code>` | HTTP 301 轉址至原始 URL |
| AC4 | 短碼不存在 | `curl <API_URL>/notexist` | HTTP 404，回傳 `{"error": "短網址不存在"}` |
| AC5 | Hugo 文件站可訪問 | 瀏覽器開啟 CloudFront URL | Hugo Book 文件站正常顯示 |
| AC6 | Notion 回填 | AC1 完成後 5 分鐘內 | Notion 主表 `Deploy_URL` 欄位出現 API URL 與文件站 URL |
| AC7 | Email 通知 | AC1 完成後 5 分鐘內 | SA 收到部署完成 Email，包含 API URL 與文件站 URL |
| AC8 | DynamoDB 資料驗證 | AC2 完成後至 AWS Console 確認 | DynamoDB Table 存在對應短碼記錄，含 code / originalUrl / createdAt |
