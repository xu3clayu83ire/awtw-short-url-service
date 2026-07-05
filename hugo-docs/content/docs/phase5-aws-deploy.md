---
title: "Phase 5 —Phase 5 — AWS CDK 自動部署（短網址 API + Hugo Book 文件站）"
weight: 5
---

[DevOps][手動] 安裝 AWS CDK 並執行 bootstrap｜TDD: 應該_CDKToolkit Stack存在_當bootstrap完成
[DevOps][AI] 建立 CDK 專案結構｜TDD: 應該_cdk synth成功_當專案結構正確
[DevOps][AI] 實作 ApiStack（Lambda + API Gateway + DynamoDB）｜TDD: 應該_建立DynamoDB和Lambda資源_當ApiStack被合成
[DevOps][AI] 實作 DocsStack（S3 + CloudFront）｜TDD: 應該_建立S3和CloudFront資源_當DocsStack被合成
[DevOps][AI] 建立 GitHub Actions deploy.yml｜TDD: 應該_觸發deploy job_當merge進main
[DevOps][手動] 設定 GitHub Actions Secrets（AWS 金鑰）｜TDD: 應該_無credentials錯誤_當deploy執行
[Backend][AI] 實作 Lambda POST /api/shorten 短碼產生邏輯｜TDD: 應該_回傳短網址_當URL格式正確
[Backend][AI] 實作 Lambda GET /{code} 轉址邏輯｜TDD: 應該_回傳301轉址_當短碼存在
[Backend][AI] 建立 n8n deploy-complete webhook workflow｜TDD: 應該_回填Notion並發Email_當收到部署完成通知
[Backend][手動] 設定 n8n Notion API Credential｜TDD: 應該_更新Deploy_URL成功_當Credential設定正確
[Backend][手動] 匯出 deploy-complete workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
