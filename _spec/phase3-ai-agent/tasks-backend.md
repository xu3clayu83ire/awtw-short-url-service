# Phase 3 — AI 開發代理人：Backend 任務清單

> ⬜ 待執行　✅ 已完成
> **執行環境**：n8n UI（Code 節點使用 JavaScript）

---

## 前置閱讀

執行前必讀：
- `_spec/phase3-ai-agent/spec.md`
- `_spec/phase3-ai-agent/design.md`
- `_rule/coding-style.md`

前置條件：
- DevOps T01 完成（Agent Runner 已啟動於 localhost:3001）
- DevOps T02 完成（TypeScript + Vitest 已初始化）
- DevOps T03 完成（ngrok + Jira Webhook 已設定）
- DevOps T04 完成（Claude API、GitHub Token Credential 已設定）

---

## Phase 1 — Webhook 接收與票面解析（~1h）

### T01 — 建立 Jira Webhook 接收節點 ⬜

新增 **Webhook** 節點：
- **HTTP Method**：POST
- **Path**：`jira-inprogress`
- **Response Mode**：Respond Immediately

**TDD DoD**
- 測試命名：`應該_回傳200_當Jira發送Webhook時`
- 🔴 紅燈：未建立前，POST 到 `/webhook/jira-inprogress` 回傳 404
- 🟢 綠燈：建立後，Test Webhook 顯示收到請求並回傳 200
- 覆蓋率：n8n Test Webhook 驗證

**完成定義**：n8n Webhook 節點啟用，手動 POST 可收到請求

---

### T02 — 建立解析票面 Code 節點 ⬜

**依賴**：T01

模式：`Run Once for All Items`

```javascript
const payload = $input.first().json.body ?? $input.first().json;
const issue = payload.issue ?? {};
const fields = issue.fields ?? {};

// 從 Description 解析 TDD DoD（取 "測試命名：" 後的文字）
const descText = JSON.stringify(fields.description ?? '');
const tddMatch = descText.match(/測試命名[：:]\s*`?([^`\n"]+)`?/);
const tddDod = tddMatch ? tddMatch[1].trim() : '';

// 從 Description 解析 Notion Slug（取 Spec 欄位路徑）
const slugMatch = descText.match(/Spec[：:][^\n]*?\/([^\/\s"]+)\.md/);
const slug = slugMatch ? slugMatch[1] : '';

return [{
  json: {
    jiraKey: issue.key ?? '',
    summary: fields.summary ?? '',
    tddDod,
    slug,
    jiraUrl: `https://prostyliu.atlassian.net/browse/${issue.key}`,
    issueId: issue.id ?? '',
  }
}];
```

**TDD DoD**
- 測試命名：`應該_解析出票號和TDD描述_當Webhook payload正確時`
- 🔴 紅燈：Test Step 輸入 Jira payload，輸出仍為原始結構
- 🟢 綠燈：輸出包含 `jiraKey`、`summary`、`tddDod`、`slug`
- 覆蓋率：n8n Test Step 驗證

**完成定義**：Test Step 輸出含正確解析的票面資訊

---

## Phase 2 — 讀取規格文件（~30min）

### T03 — 建立讀取 spec.md 節點 ⬜

**依賴**：T02

新增 **Read Binary File** 節點：
- **File Path**：`/data/projects/alag-addyosmani-demos/awtw-short-url-service/_spec/phase3-ai-agent/spec.md`

> 實際路徑依 Jira 票對應的 slug 動態組裝，初期先用固定路徑測試

接著新增 **Move Binary Data** 節點，將檔案內容轉為文字：
- **Mode**：Binary to JSON
- **Destination Key**：`specContent`

**TDD DoD**
- 測試命名：`應該_讀取spec檔案內容_當路徑正確時`
- 🔴 紅燈：Test Step 前，輸出無 `specContent` 欄位
- 🟢 綠燈：Test Step 後，`specContent` 含 spec.md 文字內容
- 覆蓋率：n8n Test Step 驗證

**完成定義**：`specContent` 欄位有 spec.md 全文

---

### T04 — 建立讀取 design.md 節點 ⬜

**依賴**：T03

同 T03，讀取 `design.md`，`Destination Key` 改為 `designContent`。

**完成定義**：`designContent` 欄位有 design.md 全文

---

## Phase 3 — Claude API 呼叫（~1h）

### T05 — 建立組裝 Prompt Code 節點 ⬜

**依賴**：T04

模式：`Run Once for All Items`

```javascript
const ticket = $('解析票面').first().json;
const specContent = $('讀取 spec').first().json.specContent ?? '';
const designContent = $('讀取 design').first().json.designContent ?? '';

const systemPrompt = `你是一位嚴格遵循 TDD 紀律的 TypeScript 後端工程師。
你必須依照以下規範產出程式碼：
- 函式長度上限 50 行
- 所有錯誤處理必須有繁體中文上下文，禁止 silent fail
- 測試命名格式：應該_<預期行為>_當<條件>

你的輸出必須是嚴格的 JSON 格式：
{
  "test_file_path": "test/xxx.test.ts",
  "test_file_content": "（完整測試檔案內容）",
  "impl_file_path": "src/xxx.ts",
  "impl_file_content": "（完整業務邏輯內容）",
  "commit_message": "feat(backend): [票號] 實作功能描述"
}`;

const userPrompt = `Jira 票號：${ticket.jiraKey}
任務標題：${ticket.summary}
TDD 完成定義：${ticket.tddDod}

規格文件內容：
${specContent}

設計文件內容：
${designContent}

請依照上述規格，產出這張票的測試檔案與業務邏輯實作。`;

return [{ json: { systemPrompt, userPrompt, jiraKey: ticket.jiraKey, jiraUrl: ticket.jiraUrl, issueId: ticket.issueId } }];
```

**完成定義**：Test Step 輸出含 `systemPrompt` 與 `userPrompt` 完整字串

---

### T06 — 建立呼叫 Claude API HTTP Request 節點 ⬜

**依賴**：T05

新增 **HTTP Request** 節點：
- **Method**：POST
- **URL**：`https://api.anthropic.com/v1/messages`
- **Authentication**：Header Auth → `Claude API`
- **Headers**：
  - `anthropic-version`：`2023-06-01`
  - `content-type`：`application/json`
- **Body（JSON）**：
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096,
  "system": "={{ $json.systemPrompt }}",
  "messages": [
    { "role": "user", "content": "={{ $json.userPrompt }}" }
  ]
}
```

**TDD DoD**
- 測試命名：`應該_取得JSON格式回應_當Claude API呼叫成功時`
- 🔴 紅燈：Test Step 前，輸出無 `content` 欄位
- 🟢 綠燈：Test Step 後，輸出含 Claude 的 JSON 格式回應
- 覆蓋率：n8n Test Step 驗證

**完成定義**：Claude 回傳含 `test_file_path`、`impl_file_path` 的 JSON 字串

---

### T07 — 建立解析 Claude 回應 Code 節點 ⬜

**依賴**：T06

模式：`Run Once for All Items`

```javascript
const response = $input.first().json;
const rawText = response.content?.[0]?.text ?? '';

// 從回應文字中提取 JSON
const jsonMatch = rawText.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('Claude 回應無法解析為 JSON：' + rawText.substring(0, 200));
}

const parsed = JSON.parse(jsonMatch[0]);
const required = ['test_file_path', 'test_file_content', 'impl_file_path', 'impl_file_content', 'commit_message'];
const missing = required.filter(k => !parsed[k]);

if (missing.length > 0) {
  throw new Error(`Claude 回應缺少必要欄位：${missing.join(', ')}`);
}

const prev = $('組裝 Prompt').first().json;
return [{
  json: {
    ...parsed,
    jiraKey: prev.jiraKey,
    jiraUrl: prev.jiraUrl,
    issueId: prev.issueId,
  }
}];
```

**完成定義**：輸出含 `test_file_path`、`test_file_content`、`impl_file_path`、`impl_file_content`、`commit_message`

---

## Phase 4 — TDD 執行流程（~1.5h）

### T08 — 建立 git checkout HTTP Request 節點 ⬜

**依賴**：T07

> Agent Runner 架構：n8n 透過 HTTP 呼叫 `host.docker.internal:3001`，由 Windows 本機執行 git 指令。

新增 **HTTP Request** 節點：
- **Method**：POST
- **URL**：`http://host.docker.internal:3001/run`
- **Body（JSON）**：
```json
{
  "command": "git checkout main && git pull origin main && git checkout -b feature/{{ $json.jiraKey }}",
  "cwd": "D:\\06_Workspace\\Workspace_GitHub\\xu3clayu83ire\\alag-addyosmani-demos\\awtw-short-url-service"
}
```

接著新增 Code 節點，將 Agent Runner 回應合併至主資料流：
```javascript
const agentResult = $input.first().json;
const prev = $('解析回應').first().json;
if (agentResult.exitCode !== 0) {
  throw new Error(`git checkout 失敗：${agentResult.stderr}`);
}
return [{ json: { ...prev, gitBranch: `feature/${prev.jiraKey}` } }];
```

**完成定義**：Test Step 後本地出現 `feature/ASUS-N` 分支

---

### T09 — 建立寫入測試檔案 HTTP Request 節點 ⬜

**依賴**：T08

新增 **HTTP Request** 節點：
- **Method**：POST
- **URL**：`http://host.docker.internal:3001/write-file`
- **Body（JSON）**：
```json
{
  "filePath": "D:\\06_Workspace\\Workspace_GitHub\\xu3clayu83ire\\alag-addyosmani-demos\\awtw-short-url-service\\{{ $json.test_file_path }}",
  "content": "={{ $json.test_file_content }}"
}
```

**完成定義**：測試檔案出現在正確路徑

---

### T10 — 建立執行測試（紅燈）HTTP Request 節點 ⬜

**依賴**：T09

新增 **HTTP Request** 節點（執行測試）：
- **Method**：POST
- **URL**：`http://host.docker.internal:3001/run`
- **Body（JSON）**：
```json
{
  "command": "npm run test",
  "cwd": "D:\\06_Workspace\\Workspace_GitHub\\xu3clayu83ire\\alag-addyosmani-demos\\awtw-short-url-service"
}
```

接著新增 **IF 節點**（紅燈確認）：
- 條件：`{{ $json.exitCode }}` 等於 `0` → False（TDD 阻斷）
- exitCode 非 0 → True（繼續）

False 分支接 **No Operation** 並記錄：`TDD 阻斷：測試未 Fail，中止流程`

**TDD DoD**
- 測試命名：`應該_中止流程_當測試第一次未Fail時`
- 🔴 紅燈：未加 IF 前，測試未 Fail 也會繼續執行
- 🟢 綠燈：加 IF 後，exitCode 為 0 走 False 分支停止
- 覆蓋率：n8n Test Step 驗證

**完成定義**：Agent Runner 回傳 exitCode != 0 才繼續，否則中止

---

### T11 — 建立寫入業務邏輯 + 執行測試（綠燈）節點 ⬜

**依賴**：T10

寫入業務邏輯（同 T09，`filePath` 改用 `impl_file_path`，`content` 改用 `impl_file_content`）

再新增 HTTP Request 執行測試確認 Pass（同 T10，不需 IF 節點）：

```json
{
  "command": "npm run test",
  "cwd": "D:\\06_Workspace\\Workspace_GitHub\\xu3clayu83ire\\alag-addyosmani-demos\\awtw-short-url-service"
}
```

**完成定義**：Agent Runner 回傳 exitCode 為 0

---

### T12 — 建立 git commit HTTP Request 節點 ⬜

**依賴**：T11

新增 **HTTP Request** 節點：
- **Method**：POST
- **URL**：`http://host.docker.internal:3001/run`
- **Body（JSON）**：
```json
{
  "command": "git add . && git commit -m \"{{ $json.commit_message }}\" && git push origin feature/{{ $json.jiraKey }}",
  "cwd": "D:\\06_Workspace\\Workspace_GitHub\\xu3clayu83ire\\alag-addyosmani-demos\\awtw-short-url-service"
}
```

**完成定義**：Agent Runner 回傳 exitCode 為 0，`git log --oneline -1` 顯示正確 commit 訊息

---

## Phase 5 — PR 建立與狀態回填（~30min）

### T13 — 建立 GitHub PR HTTP Request 節點 ⬜

**依賴**：T12

新增 **HTTP Request** 節點：
- **Method**：POST
- **URL**：`https://api.github.com/repos/xu3clayu83ire/alag-addyosmani-demos/pulls`
- **Authentication**：`GitHub - ASUS`
- **Body（JSON）**：
```json
{
  "title": "[{{ $json.jiraKey }}] {{ $('解析票面').first().json.summary }}",
  "head": "feature/{{ $json.jiraKey }}",
  "base": "main",
  "body": "## 自動產生的 Pull Request\n\n- Jira：{{ $json.jiraUrl }}\n- 由 ASUS Phase 3 自動建立\n\n## TDD 驗證\n- ✅ 紅燈確認（測試先 Fail）\n- ✅ 綠燈確認（測試全數 Pass）"
}
```

**完成定義**：GitHub 出現對應 PR

---

### T14 — 建立 Jira 狀態更新節點 ⬜

**依賴**：T13

新增 **Jira Software** 節點：
- **Resource**：Issue
- **Operation**：Update
- **Issue Key**：`{{ $('解析票面').first().json.jiraKey }}`
- **Status**：`In Review`

**完成定義**：Jira 票狀態自動變更為 `In Review`

---

## Notion 開票格式

```
[Backend] 建立 Jira Webhook 接收節點｜TDD: 應該_回傳200_當Jira發送Webhook時
[Backend] 建立解析票面 Code 節點｜TDD: 應該_解析出票號和TDD描述_當Webhook payload正確時
[Backend] 建立讀取 spec.md 節點｜TDD: 應該_讀取spec檔案內容_當路徑正確時
[Backend] 建立讀取 design.md 節點｜TDD: 應該_讀取design檔案內容_當路徑正確時
[Backend] 建立組裝 Prompt Code 節點｜TDD: 應該_組裝出完整Prompt_當票面資料齊全時
[Backend] 建立呼叫 Claude API HTTP Request 節點｜TDD: 應該_取得JSON格式回應_當Claude API呼叫成功時
[Backend] 建立解析 Claude 回應 Code 節點｜TDD: 應該_解析出四個必要欄位_當回應格式正確時
[Backend] 建立 git checkout Execute Command 節點｜TDD: 應該_建立feature分支_當jiraKey正確時
[Backend] 建立寫入測試檔案節點｜TDD: 應該_寫入測試檔案到正確路徑_當test_file_path有效時
[Backend] 建立執行測試紅燈節點和TDD阻斷IF｜TDD: 應該_中止流程_當測試第一次未Fail時
[Backend] 建立寫入業務邏輯和執行測試綠燈節點｜TDD: 應該_測試全數Pass_當業務邏輯正確時
[Backend] 建立 git commit Execute Command 節點｜TDD: 應該_commit格式正確_當測試Pass時
[Backend] 建立 GitHub PR HTTP Request 節點｜TDD: 應該_建立PR_當commit成功時
[Backend] 建立 Jira 狀態更新節點｜TDD: 應該_更新狀態為InReview_當PR建立成功時
```
