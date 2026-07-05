# Notion Tasks_To_Open 同步佇列

> `/mcp`（Notion MCP）尚未建立，Tasks_To_Open 內容暫存於此，待 MCP 建立後依序貼入主表「功能規格總表」對應 phase row。
> 同步規則見 `_rule/adw-conventions.md` →「Tasks_To_Open 產出與同步規則」「跨 Phase 開票順序保護規則」。
>
> ⚠️ 開票順序保護：本檔案內 phase 依 Weight 由小到大排列。同步／開票時**必須依序處理**，
> 前一個 phase 的 `Jira_Epic_Key` 未回填前，不得對後一個 phase 開票（避免重演 Phase 5 早於 Phase 4 開票的問題）。

---

## phase4-cicd-review（Weight: 4）✅ 已同步（2026-07-05）｜⚠️ 重新開票中

**對應 row**：功能規格總表 → Slug = `phase4-cicd-review`
**開票前置條件**：資料庫中無 Weight < 4 的 row（Phase 1-3 未走 Jira），視同已滿足
**Spec_URL**：維持空值（用途已改回人看的 Hugo 發布網址，待 Phase 5 文件站部署後才回填，不再用於 workflow 解析 slug）
**Slug 傳遞方式**：開票時 workflow 直接把 Notion 的 `Slug` 屬性值寫進 Jira 票面 `Slug：<slug>` 這行，`asus-dev-workflow.json` 直接解析這行取值（見 `_rule/adw-conventions.md`）
**Jira_Epic_Key**：舊票 ASUS-88 ~ ASUS-96 因舊版 workflow 用 `Spec_URL` 路徑正則解析 slug、而 `Spec_URL` 當時為空，Description 缺必要資訊，已規劃刪除重建（見 `_note/decisions.md`），目前 Notion 端已重置為空、Status 改回 Draft，待使用者刪除 Jira 舊票後重新觸發開票

```
[Backend][手動] 建立 GitHub PR Webhook 至 n8n｜TDD: 應該_接收Webhook_當PR被建立
[Backend][AI] 建立 n8n github-pr-notify workflow｜TDD: 應該_發送Email通知_當GitHub PR被建立
[Backend][手動] 設定 n8n Gmail SMTP Credential｜TDD: 應該_發送Email成功_當SMTP設定正確
[Backend][AI] 實作 PR 資訊解析 Code node｜TDD: 應該_萃取票號_當PR標題符合格式
[Backend][手動] 匯出 github-pr-notify workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
[DevOps][AI] 建立 GitHub Actions CI workflow（test + lint）｜TDD: 應該_顯示綠燈_當測試全數通過
[DevOps][AI] 設定 package.json lint script｜TDD: 應該_型別檢查通過_當程式碼無型別錯誤
[DevOps][AI] 新增 build-docs job（僅 main branch）｜TDD: 應該_產出Hugo artifact_當merge進main
[DevOps][手動] 設定 GitHub Branch Protection Rules｜TDD: 應該_拒絕直接push_當目標為main
```

---

## phase5-aws-deploy（Weight: 5）✅ Tasks_To_Open 已同步（2026-07-05）｜⛔ 尚不得開票

**對應 row**：功能規格總表 → Slug = `phase5-aws-deploy`
**開票前置條件**：`phase4-cicd-review` 的 `Jira_Epic_Key` 已填值 —— 目前為空，**仍不得**將本 phase Status 改為 `Ready to Plan`（已設定 `前置Phase` 關聯至 Phase 4，並有 Notion Automation 防呆：誤改為 Ready to Plan 會自動退回 Draft）

```
[Backend][AI] 實作 Lambda POST /api/shorten 短碼產生邏輯｜TDD: 應該_回傳短網址_當URL格式正確
[Backend][AI] 實作 Lambda GET /{code} 轉址邏輯｜TDD: 應該_回傳301轉址_當短碼存在
[Backend][AI] 建立 n8n deploy-complete webhook workflow｜TDD: 應該_回填Notion並發Email_當收到部署完成通知
[Backend][手動] 設定 n8n Notion API Credential｜TDD: 應該_更新Deploy_URL成功_當Credential設定正確
[Backend][手動] 匯出 deploy-complete workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
[DevOps][手動] 安裝 AWS CDK 並執行 bootstrap｜TDD: 應該_CDKToolkit Stack存在_當bootstrap完成
[DevOps][AI] 建立 CDK 專案結構｜TDD: 應該_cdk synth成功_當專案結構正確
[DevOps][AI] 實作 ApiStack（Lambda + API Gateway + DynamoDB）｜TDD: 應該_建立DynamoDB和Lambda資源_當ApiStack被合成
[DevOps][AI] 實作 DocsStack（S3 + CloudFront）｜TDD: 應該_建立S3和CloudFront資源_當DocsStack被合成
[DevOps][AI] 建立 GitHub Actions deploy.yml｜TDD: 應該_觸發deploy job_當merge進main
[DevOps][手動] 設定 GitHub Actions Secrets（AWS 金鑰）｜TDD: 應該_無credentials錯誤_當deploy執行
```
