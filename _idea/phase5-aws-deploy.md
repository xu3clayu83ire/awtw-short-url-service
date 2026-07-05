# 需求草稿：AWS CDK 自動部署（短網址 API + Hugo Book 文件站）

> 放置於 `adw/_idea/phase5-aws-deploy.md`
> 觸發指令：`/addyosmani-spec adw/_idea/phase5-aws-deploy.md`

---

## 背景與動機

這是 ASUS 系統的最後一哩路。
當 SA Approve 並 merge 進 main 後，
GitLab CI 自動執行 AWS CDK 部署，
把短網址 API 與 Hugo Book 技術文件站同步上線到 AWS，
不需要任何手動操作。

---

## 前置條件（Phase 4 完成後才能進行）

- main branch merge 已完成，CI test + lint 通過
- AWS 帳號已建立，IAM User 具有 CDK 部署權限
- AWS CDK 初始化（`cdk bootstrap`）已在目標 region 執行過
- GitLab CI Variables 已設定 AWS 金鑰
- Hugo Book `public/` artifact 由 Phase 4 CI 產出

---

## 目標

### 部署架構（兩個獨立 CDK Stack）

**Stack 1：ApiStack（短網址後端）**
- AWS Lambda（Node.js 20.x runtime）：執行 TypeScript 打包後的 API 程式碼
- API Gateway（HTTP API）：對外暴露 `POST /api/shorten` 與 `GET /{code}`
- DynamoDB Table：存放短網址對應資料（Partition Key：`code`，TTL 欄位：`expiredAt`）
- CloudWatch Log Group：記錄 Lambda 執行 log

**Stack 2：DocsStack（Hugo Book 文件站）**
- S3 Bucket：存放 Hugo 產出的靜態檔案，設為完全私有
- CloudFront Distribution：全球 CDN，OAC（Origin Access Control）安全存取
- 404 處理：導向 `/404.html`（Hugo Book 的路由遺失處理）
- 部署後自動 invalidate CloudFront cache

### CDK 部署觸發條件

```yaml
# .gitlab-ci.yml 新增 stage（接在 build-docs 之後）
deploy:
  stage: deploy
  only:
    - main
  # 使用 AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY（存於 GitLab CI Variables）
  # 執行 cdk deploy --require-approval never
```

### 部署完成後的回寫

- CDK Output 取得 API Gateway URL 與 CloudFront URL
- n8n 監聽 GitLab Pipeline 完成 Webhook
- n8n 自動把兩個 URL 回填到 Notion 主表的 `Deploy_URL` 欄位
- n8n 發送 Line Notify 部署完成通知

---

## 短網址 API 規格（PoC 範圍）

### POST /api/shorten
- Input：`{ "url": "https://example.com/very/long/path" }`
- 驗證：URL 格式合法（以 http:// 或 https:// 開頭）
- 產生：6 碼隨機英數短碼（避開 O, 0, I, l 等易混淆字元）
- 存入 DynamoDB：`{ code, originalUrl, createdAt }`
- Output：`{ "shortUrl": "https://your-domain.com/abc123" }`

### GET /{code}
- 從 DynamoDB 查詢短碼
- 找到：HTTP 301 Redirect 到原始 URL
- 找不到：HTTP 404，回傳 `{ "error": "短網址不存在" }`

---

## 技術限制

- AWS Region：`ap-northeast-1`（東京）
- CDK 語言：TypeScript
- Lambda Runtime：Node.js 20.x
- DynamoDB：On-demand 計費模式（PoC 省成本）
- 不使用自訂 Domain（直接用 CloudFront / API Gateway 預設 domain）
- GitLab CI 的 deploy stage image：`node:20`

---

## 範圍邊界

**做：**
- CDK Stack 程式碼：ApiStack（Lambda + API Gateway + DynamoDB）
- CDK Stack 程式碼：DocsStack（S3 + CloudFront + BucketDeployment）
- `.gitlab-ci.yml` deploy stage 配置
- GitLab CI Variables 清單（AWS 金鑰、Region）
- n8n 監聽 Pipeline 完成 → 回填 Notion Deploy_URL
- Line Notify 部署完成通知模板
- CDK 拆兩個 Stack 的理由說明（避免文件更新觸發後端重部署）

**不做：**
- 自訂 Domain / SSL 憑證（PoC 用預設 domain）
- 點擊統計功能
- 使用者帳號系統
- CloudFront WAF 設定
- 多環境部署（staging / production）
- Rollback 機制（PoC 階段出問題直接重部署）

---

## 驗收條件

1. main branch merge 後，GitLab CI 自動觸發 deploy stage，`cdk deploy` 執行成功
2. API Gateway 端點可正常呼叫：`POST /api/shorten` 回傳短網址，`GET /{code}` 正確轉址
3. Hugo Book 文件站可透過 CloudFront URL 正常訪問
4. Notion 主表的 `Deploy_URL` 欄位被自動回填兩個 URL
5. Line Notify 收到部署完成通知，包含 API URL 與文件站 URL
6. DynamoDB 存在對應的測試資料（可在 AWS Console 驗證）
