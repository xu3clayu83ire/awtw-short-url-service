# Phase 2 — n8n 自動化管線：Backend 任務清單

> ⬜ 待執行　✅ 已完成
> **注意**：本 Phase 任務是「建立管線本身」，直接用此文件勾選追蹤。
> **執行環境**：n8n UI（Code 節點使用 JavaScript）

---

## 前置閱讀

執行前必讀：
- `_spec/phase2-n8n-pipeline/spec.md`
- `_spec/phase2-n8n-pipeline/design.md`（重點：節點清單、JS 程式碼、票面格式）
- `_rule/coding-style.md`

前置條件：
- DevOps T01、T02 完成（Credential 已設定）
- DevOps T03 完成（Notion Trigger 節點已建立）

---

## Phase 0 — 冪等與防呆機制

### T01 — 建立冪等檢查 IF 節點 ✅

**節點名稱**：` T01 IF`

在 Notion Trigger 節點之後新增 IF 節點：
- **條件**：`{{ $json.Jira_Epic_Key.length }}` 等於 `0`（字串比對，啟用 loose type validation）
- **True**（無值）→ 繼續往下
- **False**（已有值）→ 接 `No Operation, do nothing`，log：`已有 Jira_Epic_Key，跳過`

> 注意：n8n Notion Trigger 回傳簡化格式，`$json.Jira_Epic_Key` 直接為字串，無需存取 `.properties.rich_text`

**完成定義**：`Jira_Epic_Key` 有值時，Test Step 顯示走 False 分支

---

### T02 — 建立空任務檢查 IF 節點 ✅

**節點名稱**：` T02 IF`

在 T01 IF True 分支後新增第二個 IF 節點：
- **條件**：`{{ $json.Tasks_To_Open.length }}` 大於 `0`（數字比對，啟用 loose type validation）
- **True**（有內容）→ 繼續往下
- **False**（為空）→ 接 `No Operation, do nothing1`，log：`Tasks_To_Open 為空，中止`

**完成定義**：`Tasks_To_Open` 為空時，Test Step 顯示走 False 分支

---

## Phase 1 — 分流 A：Jira 開票

### T03 — 建立切割任務 Code 節點 ✅

**節點名稱**：`T03 Cut Task`
**模式**：Run Once for All Items

```javascript
const item = $input.first().json;
const raw = item.Tasks_To_Open ?? '';
const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

return lines.map(line => {
  const [left, right] = line.split('｜TDD:');
  const roleMatch = left ? left.match(/^\[(.+?)\]/) : null;
  return {
    json: {
      role: roleMatch ? roleMatch[1] : 'Backend',
      title: left ? left.replace(/^\[.+?\]\s*/, '').trim() : '',
      tdd: right ? right.trim() : '',
      notionPageId: item.id ?? '',
      notionPageUrl: '',
      specUrl: item.Spec_URL ?? '',
      slug: item.Slug ?? '',
    }
  };
});
```

> 注意：原設計為 Run Once for Each Item，實際因 n8n 格式限制改為 Run Once for All Items，以 `$input.first().json` 取得 Notion 資料

**完成定義**：Test Step 輸入 2 行任務，輸出 2 個 JSON 物件，各含 `role`、`title`、`tdd` 欄位

---

### T04 — 建立 Jira Task 開票節點 ✅

**節點名稱**：`T04 Jira Create an issue`
**模式**：Run Once for Each Item

- **Credential**：`Jira SW Cloud account`
- **Project**：`awtw-short-url-service`（ID: 10000）
- **Issue Type**：`任務`（ID: 10003）
- **Summary**：`{{ $json.title }}`
- **Description**：
```
## 任務說明
{{ $json.title }}

## TDD 完成定義 (DoD)
- [ ] 測試命名：`{{ $json.tdd }}`
- [ ] 🔴 紅燈：測試必須先 Fail
- [ ] 🟢 綠燈：實作後測試 Pass，覆蓋率 100%
- [ ] 🔵 藍燈：重構完成，git commit 已執行

## 規格來源
- Notion：{{ $json.notionPageUrl }}
- Spec：{{ $json.specUrl }}
```

**完成定義**：Jira ASUS 看板出現對應 Task 票，票面含完整 TDD DoD

---

### T08 — 建立 Combine Jira Key Code 節點 ✅

**節點名稱**：`T08 Combine Jira Key`
**模式**：Run Once for All Items

> 此節點為實作過程新增，原規格未包含。用途：將 T04 產生的所有 Jira 票號聚合為逗號分隔字串，支援一筆 Notion 資料對應多張 Jira 票。

```javascript
const items = $input.all();
const allKeys = items.map(item => item.json.key).join(', ');
const notionPageId = $('Notion Trigger').first().json.id;

return [{ json: { allKeys, notionPageId } }];
```

**完成定義**：輸出包含 `allKeys`（如 `ASUS-8, ASUS-9`）與 `notionPageId`

---

### T05 — 建立回填 Jira_Epic_Key Notion 節點 ✅

**節點名稱**：`T05 Update Notion`

- **Operation**：Update Page
- **Page ID**：`{{ $json.notionPageId }}`（來自 T08）
- **Property**：`Jira_Epic_Key` → `{{ $json.allKeys }}`（來自 T08，含所有票號）

> 注意：原規格只回填第一張票號，實際實作改為回填所有票號（逗號分隔）以提升可追溯性

**完成定義**：Notion 主表該筆資料 `Jira_Epic_Key` 填入所有票號（如 `ASUS-8, ASUS-9`）

---

## Phase 2 — 分流 B：Hugo 文件同步

### T06 — 建立 Hugo Front Matter 組裝 Code 節點 ✅

**節點名稱**：`T06 Hugo Front Matter`
**模式**：Run Once for All Items
**連接點**：T02 IF True 分支（與分流 A 並行）

```javascript
const item = $input.first().json;
const title = item.Name ?? '';
const slug = item.Slug ?? '';
const weight = item.Weight ?? 99;
const body = item.Tasks_To_Open ?? '';

const content = `---
title: "${title}"
weight: ${weight}
---

${body}
`;

return [{ json: { slug, content } }];
```

> 注意：原設計直接取 `$input.item.json.properties`，實際改用 n8n 簡化格式直接存取屬性

**完成定義**：Test Step 輸出含 `title`、`weight` 的 YAML Front Matter 格式

---

### T07 — 建立 Hugo 文件寫入 Code 節點 ✅

**節點名稱**：`T07 Hugo docs`
**模式**：Run Once for All Items

> 注意：原規格使用 Write Binary File 節點，實際因 n8n 容器權限問題改用 Code 節點 + Node.js `fs` 模組。需在 docker-compose.yml 設定 `NODE_FUNCTION_ALLOW_BUILTIN=fs`，容器執行身份改為 root（`user: "0:0"`）。

```javascript
const fs = require('fs');
const item = $input.first().json;

const filePath = `/data/projects/alag-addyosmani-demos/awtw-short-url-service/hugo-docs/content/docs/${item.slug}.md`;

fs.writeFileSync(filePath, item.content, 'utf8');

return [{ json: { success: true, filePath } }];
```

**完成定義**：`hugo-docs/content/docs/<slug>.md` 存在且 Front Matter 格式正確

---

## 實作備註

| 項目 | 原設計 | 實際實作 | 原因 |
|------|--------|---------|------|
| Notion Trigger 資料格式 | `$json.properties.X.rich_text` | `$json.X`（簡化格式） | n8n Notion Trigger 自動展平屬性 |
| T03 執行模式 | Run Once for Each Item | Run Once for All Items | `$input.item` 在此模式下有相容性問題 |
| T05 回填內容 | 第一張票號 | 所有票號（逗號分隔） | 提升可追溯性 |
| T07 寫檔方式 | Write Binary File 節點 | Code 節點 + `fs` 模組 | Write Binary File 對 Docker 掛載目錄有寫入限制 |
| T08 | 原規格無此節點 | 新增聚合節點 | 支援多票號回填需求 |

---

## Notion 開票格式

> ⚠️ Phase 2 的 Backend 任務是在「建立」開票管線本身，留存備用。

```
[Backend] 建立冪等檢查 IF 節點｜TDD: 應該_跳過workflow_當Jira_Epic_Key已有值時
[Backend] 建立空任務檢查 IF 節點｜TDD: 應該_中止workflow_當Tasks_To_Open為空時
[Backend] 建立切割任務 Code 節點｜TDD: 應該_正確切割成任務陣列_當Tasks_To_Open有兩行時
[Backend] 建立 Jira Task 開票節點｜TDD: 應該_成功建立Jira票_當任務資料正確時
[Backend] 建立 Combine Jira Key Code 節點｜TDD: 應該_聚合所有票號_當有多張Jira票時
[Backend] 建立回填 Jira_Epic_Key Notion 節點｜TDD: 應該_回填所有JiraKey到Notion_當Jira票建立成功時
[Backend] 建立 Hugo Front Matter 組裝 Code 節點｜TDD: 應該_產出正確FrontMatter_當Notion屬性完整時
[Backend] 建立 Hugo 文件寫入 Code 節點｜TDD: 應該_成功寫入md檔案_當FrontMatter組裝正確時
```
