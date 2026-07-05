# ADW 系統慣例規範

> 本文件僅在使用 ADW（AI 驅動自動化開發工作流）開發時適用。
> 一般開發規範請參考 `_rule/workflow.md` 與 `_rule/coding-style.md`。

---

## 任務執行方式標注規則

每個任務必須在標題標注執行方式，供 n8n 判斷是否觸發 Claude API。

| 標籤 | 說明 | 適用情境 |
|------|------|---------|
| `[AI]` | ADW 自動執行，n8n 觸發 Claude API 產出程式碼 | 產出程式碼檔案（TypeScript / YAML / JSON），可用測試驗證 |
| `[手動]` | 人工執行，n8n 收到 Webhook 後靜默略過 | Console/UI 操作、敏感憑證設定、一次性環境初始化、無程式碼產出 |

### 判斷標準

**標注 `[AI]` 的條件（同時符合）：**
- 產出至少一個程式碼檔案（`.ts`、`.yml`、`.json` 等）
- 可用自動化測試驗證結果（單元測試、CI 執行結果）

**標注 `[手動]` 的條件（符合任一）：**
- 操作對象為外部系統 UI（GitHub Settings、AWS Console、n8n Credentials）
- 涉及敏感憑證輸入（API Token、密碼、金鑰）
- 一次性環境初始化（`cdk bootstrap`、`ngrok` 設定）
- 無程式碼產出，僅有設定變更

---

## Notion 開票格式規範

每個任務的開票格式：

```
[角色][執行方式] 任務標題｜TDD: 測試命名
```

範例：
```
[Backend][AI] 實作 POST /api/shorten 短碼產生邏輯｜TDD: 應該_回傳短網址_當URL格式正確
[DevOps][手動] 設定 GitHub Branch Protection Rules｜TDD: 應該_拒絕直接push_當目標為main
```

**角色標籤：** `[Frontend]`、`[Backend]`、`[DevOps]`、`[QA]`

---

## spec 文件與 ADW Prompt 對應規則

ADW 的 Claude Prompt 從以下位置讀取規格：

| 資料來源 | 路徑規則 |
|---------|---------|
| 規格文件（spec.md） | `_spec/<slug>/spec.md` |
| 設計文件（design.md） | `_spec/<slug>/design.md` |

`<slug>` 由 Jira 票 Description 中的 `Spec：` 欄位提供，格式：
```
Spec：_spec/<slug>/tasks-backend.md
```

---

## ADW 支援的任務類型

| 任務類型 | Claude 產出 | 備註 |
|---------|------------|------|
| TypeScript 後端邏輯 | `src/*.ts` + `test/*.test.ts` | 標準 TDD 流程 |
| TypeScript CDK Stack | `cdk/lib/*.ts` | 以 `cdk synth` 驗證 |
| Lambda 函式 | `cdk/lambda/*.ts` + 單元測試 | mock DynamoDB |
| GitHub Actions YAML | `.github/workflows/*.yml` | 以 CI 執行結果驗證 |
| n8n Workflow | `n8n-workflows/*.json` | 以 n8n Execution 驗證 |

---

## ADW 不支援的任務類型（一律標注 `[手動]`）

- AWS / GitHub / n8n Console 設定操作
- 環境初始化指令（`cdk bootstrap`、`npm install -g`）
- 敏感憑證設定（GitHub Secrets、n8n Credentials）
- 外部服務 Webhook 註冊
- 檔案匯出操作（n8n workflow JSON 匯出）
