# Phase 5 AWS CDK 自動部署 — Backend 任務拆解

> 每個任務設計為獨立可驗證，完成後有明確的檢查點。
> ⬜ 待執行　✅ 已完成

## 前置閱讀

- `_spec/phase5-aws-deploy/spec.md`
- `_spec/phase5-aws-deploy/design.md`
- `_rule/workflow.md`
- `_rule/coding-style.md`

## 前置條件

- Phase 5 DevOps T02 完成（CDK 專案結構已建立）
- n8n 已啟動，ngrok 已運行

---

## Phase 0 — Lambda 函式實作（~2h）

### T01 — 實作 POST /api/shorten ⬜

在 `cdk/lambda/handler.ts` 實作短碼產生邏輯：
- 驗證 URL 格式（必須以 http:// 或 https:// 開頭）
- 產生 6 碼短碼（字元集排除 O, 0, I, l）
- 寫入 DynamoDB：`{ code, originalUrl, createdAt }`
- 回傳 `{ shortUrl: "<api-url>/<code>" }`

**完成定義**：
- 測試命名：`應該_回傳短網址_當URL格式正確` / `應該_拋出錯誤_當URL格式無效`
- 🔴 紅燈確認：`handler.ts` 尚未實作，單元測試 Fail
- 🟢 綠燈確認：`npm run test` 通過，`cdk deploy` 後 `curl -X POST <API_URL>/api/shorten -d '{"url":"https://example.com"}'` 回傳 HTTP 200（AC2）

---

### T02 — 實作 GET /{code} ⬜

**依賴**：T01

在 `handler.ts` 新增轉址邏輯：
- 從 DynamoDB 查詢短碼
- 找到：回傳 HTTP 301，Location header 設為原始 URL
- 找不到：回傳 HTTP 404，`{ "error": "短網址不存在" }`

**完成定義**：
- 測試命名：`應該_回傳301轉址_當短碼存在` / `應該_回傳404_當短碼不存在`
- 🔴 紅燈確認：GET 路由未實作，單元測試 Fail
- 🟢 綠燈確認：`npm run test` 通過，部署後瀏覽器開啟 `<API_URL>/<code>` 正確轉址（AC3、AC4）

---

## Phase 1 — n8n 部署完成通知 Workflow（~1h）

### T03 — 建立 n8n deploy-complete Webhook ⬜

**依賴**：DevOps T05

在 n8n 建立新 workflow `deploy-complete`：
1. **Webhook**（POST `/webhook/deploy-complete`）
2. **Code node「解析部署資訊」**：萃取 apiUrl、docsUrl
3. **HTTP Request「更新 Notion Deploy_URL」**：PATCH Notion page
4. **Send Email「部署完成通知」**

**完成定義**：
- 測試命名：`應該_回填Notion並發Email_當收到部署完成通知`
- 🔴 紅燈確認：Webhook 存在但後續節點未設定，workflow 執行失敗
- 🟢 綠燈確認：手動 curl POST 測試 Webhook，Notion `Deploy_URL` 更新、SA 收到 Email（AC6、AC7）

---

### T04 — 設定 Notion API Credential ⬜

**依賴**：T03

在 n8n Credentials 新增 Header Auth：
- Name：`notion-api`
- Header Name：`Authorization`
- Header Value：`Bearer <NOTION_TOKEN>`

確認 Notion Integration 已加入「功能規格總表」資料庫的連結。

**完成定義**：
- 🟢 綠燈確認：n8n HTTP Request 測試 Notion API 回傳 200，`Deploy_URL` 欄位更新成功

---

### T05 — 匯出 n8n Workflow JSON ⬜

**依賴**：T03、T04

將完成的 `deploy-complete` workflow 從 n8n 匯出為 JSON，存至：
`n8n-workflows/deploy-complete.json`

**完成定義**：
- 🟢 綠燈確認：`n8n-workflows/deploy-complete.json` 存在，commit 進 main branch

---

## Notion 開票格式

```
[Backend] 實作 Lambda POST /api/shorten 短碼產生邏輯｜TDD: 應該_回傳短網址_當URL格式正確
[Backend] 實作 Lambda GET /{code} 轉址邏輯｜TDD: 應該_回傳301轉址_當短碼存在
[Backend] 建立 n8n deploy-complete webhook workflow｜TDD: 應該_回填Notion並發Email_當收到部署完成通知
[Backend] 設定 n8n Notion API Credential｜TDD: 應該_更新Deploy_URL成功_當Credential設定正確
[Backend] 匯出 deploy-complete workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
```
