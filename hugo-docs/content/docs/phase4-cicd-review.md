---
title: "Phase 4 — GitHub Actions CI/CD 自動化測試與 PR 審核流程"
weight: 4
---

[Backend][手動] 建立 GitHub PR Webhook 至 n8n｜TDD: 應該_接收Webhook_當PR被建立
[Backend][AI] 建立 n8n github-pr-notify workflow｜TDD: 應該_發送Email通知_當GitHub PR被建立
[Backend][手動] 設定 n8n Gmail SMTP Credential｜TDD: 應該_發送Email成功_當SMTP設定正確
[Backend][AI] 實作 PR 資訊解析 Code node｜TDD: 應該_萃取票號_當PR標題符合格式
[Backend][手動] 匯出 github-pr-notify workflow JSON｜TDD: 應該_存在workflow檔案_當匯出完成
[DevOps][AI] 建立 GitHub Actions CI workflow（test + lint）｜TDD: 應該_顯示綠燈_當測試全數通過
[DevOps][AI] 設定 package.json lint script｜TDD: 應該_型別檢查通過_當程式碼無型別錯誤
[DevOps][AI] 新增 build-docs job（僅 main branch）｜TDD: 應該_產出Hugo artifact_當merge進main
[DevOps][手動] 設定 GitHub Branch Protection Rules｜TDD: 應該_拒絕直接push_當目標為main
