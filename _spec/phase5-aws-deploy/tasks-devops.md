# Phase 5 AWS CDK 自動部署 — DevOps 任務拆解

> 每個任務設計為獨立可驗證，完成後有明確的檢查點。
> ⬜ 待執行　✅ 已完成

## 前置閱讀

- `_spec/phase5-aws-deploy/spec.md`
- `_spec/phase5-aws-deploy/design.md`
- `_rule/workflow.md`

## 前置條件

- AWS 帳號已建立，IAM User 具有 AdministratorAccess
- Node.js 20.x 已安裝於本機
- AWS CLI 已安裝並設定（`aws configure`）

---

## Phase 0 — AWS CDK 初始化（~1h）

### T01 — 安裝 AWS CDK 並執行 bootstrap ⬜

```bash
npm install -g aws-cdk
cdk bootstrap aws://ACCOUNT_ID/ap-northeast-1
```

**完成定義**：
- 🟢 綠燈確認：`cdk bootstrap` 執行成功，AWS Console → CloudFormation 出現 `CDKToolkit` Stack

---

### T02 — 建立 CDK 專案結構 ⬜

**依賴**：T01

在 `cdk/` 目錄初始化 CDK TypeScript 專案：

```bash
mkdir cdk && cd cdk
cdk init app --language typescript
```

建立以下檔案結構：
```
cdk/
├── bin/app.ts
├── lib/api-stack.ts
├── lib/docs-stack.ts
├── lambda/handler.ts
├── package.json
└── tsconfig.json
```

**完成定義**：
- 🔴 紅燈確認：`cdk/lib/api-stack.ts` 尚未建立，`cdk synth` 失敗
- 🟢 綠燈確認：`cdk synth` 執行成功，產出 CloudFormation template

---

### T03 — 實作 ApiStack（Lambda + API Gateway + DynamoDB） ⬜

**依賴**：T02

在 `cdk/lib/api-stack.ts` 定義：
- DynamoDB Table（Partition Key: `code`，On-demand）
- Lambda Function（Node.js 20.x，指向 `lambda/handler.ts`，注入 `TABLE_NAME` 環境變數）
- HTTP API Gateway（路由 POST /api/shorten 與 GET /{code} 至 Lambda）
- CfnOutput：`ApiUrl`

**完成定義**：
- 測試命名：`應該_建立DynamoDB和Lambda資源_當ApiStack被合成`
- 🔴 紅燈確認：`cdk synth ApiStack` 缺少 DynamoDB 或 Lambda 定義，報錯
- 🟢 綠燈確認：`cdk synth ApiStack` 成功，CloudFormation template 含 DynamoDB Table 與 Lambda Function 資源

---

### T04 — 實作 DocsStack（S3 + CloudFront） ⬜

**依賴**：T02

在 `cdk/lib/docs-stack.ts` 定義：
- S3 Bucket（完全私有，BlockPublicAccess）
- CloudFront Distribution（OAC 安全存取 S3，404 導向 `/404.html`）
- BucketDeployment（從 `hugo-docs/public/` 部署靜態檔案）
- CfnOutput：`DocsUrl`

**完成定義**：
- 測試命名：`應該_建立S3和CloudFront資源_當DocsStack被合成`
- 🔴 紅燈確認：`cdk synth DocsStack` 缺少 CloudFront 定義，報錯
- 🟢 綠燈確認：`cdk synth DocsStack` 成功，CloudFormation template 含 S3 Bucket 與 CloudFront Distribution

---

### T05 — 建立 GitHub Actions deploy.yml ⬜

**依賴**：T03、T04

在 `.github/workflows/deploy.yml` 建立 deploy stage：
- 觸發條件：push to main
- 執行 `cdk deploy --all --require-approval never --outputs-file outputs.json`
- 最後 step 讀取 outputs.json，curl POST 通知 n8n

**完成定義**：
- 🔴 紅燈確認：push main 但 `deploy.yml` 不存在，GitHub Actions 無 deploy job
- 🟢 綠燈確認：merge PR 後 GitHub Actions 出現 deploy job，`cdk deploy` 執行成功（AC1）

---

### T06 — 設定 GitHub Actions Secrets ⬜

**依賴**：T05

至 GitHub repo → Settings → Secrets and variables → Actions，新增：
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `N8N_WEBHOOK_URL`

**完成定義**：
- 🟢 綠燈確認：deploy.yml 的 AWS 步驟執行時無 credentials 錯誤

---

## Notion 開票格式

```
[DevOps] 安裝 AWS CDK 並執行 bootstrap｜TDD: 應該_CDKToolkit Stack存在_當bootstrap完成
[DevOps] 建立 CDK 專案結構｜TDD: 應該_cdk synth成功_當專案結構正確
[DevOps] 實作 ApiStack（Lambda + API Gateway + DynamoDB）｜TDD: 應該_建立DynamoDB和Lambda資源_當ApiStack被合成
[DevOps] 實作 DocsStack（S3 + CloudFront）｜TDD: 應該_建立S3和CloudFront資源_當DocsStack被合成
[DevOps] 建立 GitHub Actions deploy.yml｜TDD: 應該_觸發deploy job_當merge進main
[DevOps] 設定 GitHub Actions Secrets（AWS 金鑰）｜TDD: 應該_無credentials錯誤_當deploy執行
```
