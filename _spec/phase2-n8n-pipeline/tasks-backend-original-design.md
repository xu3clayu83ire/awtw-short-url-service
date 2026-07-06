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

## Phase 0 — 冪等與防呆機制（~30min）

### T01 — 建立冪等檢查 IF 節點 ⬜

**依賴**：DevOps T03

在 Notion Trigger 節點之後新增 IF 節點：
- **條件**：`{{ $json.properties.Jira_Epic_Key.rich_text.length }}` 等於 `0`
- **True**（無值）→ 繼續往下
- **False**（已有值）→ 接 No Operation 節點，寫入 log：`已有 Jira_Epic_Key，跳過`

**TDD DoD**
- 測試命名：`應該_跳過workflow_當Jira_Epic_Key已有值時`
- 🔴 紅燈：未加 IF 前，重複觸發會往下執行
- 🟢 綠燈：Test Step 輸入已有 `Jira_Epic_Key` 的資料，IF 走 False 分支停止
- 覆蓋率：n8n Test Step 驗證

**完成定義**：`Jira_Epic_Key` 有值時，Test Step 顯示走 False 分支

---

### T02 — 建立空任務檢查 IF 節點 ⬜

**依賴**：T01

在冪等 IF True 分支後新增第二個 IF 節點：
- **條件**：`{{ $json.properties.Tasks_To_Open.rich_text.length }}` 大於 `0`
- **True**（有內容）→ 繼續往下
- **False**（為空）→ No Operation，寫入 log：`Tasks_To_Open 為空，中止`

**TDD DoD**
- 測試命名：`應該_中止workflow_當Tasks_To_Open為空時`
- 🔴 紅燈：未加 IF 前，空 Tasks_To_Open 會導致後續節點錯誤
- 🟢 綠燈：Test Step 輸入空 Tasks_To_Open，IF 走 False 分支停止
- 覆蓋率：n8n Test Step 驗證

**完成定義**：`Tasks_To_Open` 為空時，Test Step 顯示走 False 分支

---

## Phase 1 — 分流 A：Jira 開票（~1h）

### T03 — 建立切割任務 Code 節點 ⬜

**依賴**：T02

新增 Code 節點（Run Once for Each Item），填入 design.md 的切割邏輯：

```javascript
const raw = $input.item.json.properties.Tasks_To_Open.rich_text
  .map(t => t.plain_text).join('');

const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

return lines.map(line => {
  const [left, right] = line.split('｜TDD:');
  const roleMatch = left.match(/^\[(.+?)\]/);
  return {
    json: {
      role: roleMatch ? roleMatch[1] : 'Backend',
      title: left.replace(/^\[.+?\]\s*/, '').trim(),
      tdd: right ? right.trim() : '',
      notionPageId: $input.item.json.id,
      notionPageUrl: $input.item.json.url,
      specUrl: $input.item.json.properties.Spec_URL?.url ?? '',
      slug: $input.item.json.properties.Slug?.rich_text[0]?.plain_text ?? '',
    }
  };
});
```

**TDD DoD**
- 測試命名：`應該_正確切割成任務陣列_當Tasks_To_Open有兩行時`
- 🔴 紅燈：Test Step 輸入 2 行任務，輸出仍為原始字串（未切割）
- 🟢 綠燈：輸出為 2 個 JSON 物件，各含 `role`、`title`、`tdd` 欄位
- 覆蓋率：n8n Test Step 驗證

**完成定義**：Test Step 輸入 `[Backend] 任務A｜TDD: 測試A\n[DevOps] 任務B｜TDD: 測試B`，輸出 2 個物件

---

### T04 — 建立 Jira Task 開票節點 ⬜

**依賴**：T03

新增 Jira Software 節點（Run Once for Each Item）：
- **Credential**：`Jira - ASUS`
- **Operation**：Create Issue
- **Project**：`ASUS`
- **Issue Type**：`Task`
- **Summary**：`{{ $json.title }}`
- **Description**（ADF 格式）：依 design.md 票面格式組裝

Description 內容：
```
## 任務說明
{{ $json.title }}

## TDD 完成定義 (DoD)
- [ ] 測試命名：`{{ $json.tdd }}`
- [ ] 🔴 紅燈：測試必須先 Fail，截圖或終端機輸出為憑
- [ ] 🟢 綠燈：實作後測試 Pass，覆蓋率 100%
- [ ] 🔵 藍燈：重構完成，git commit 已執行

## 規格來源
- Notion：{{ $json.notionPageUrl }}
- Spec：{{ $json.specUrl }}
```

**TDD DoD**
- 測試命名：`應該_成功建立Jira票_當任務資料正確時`
- 🔴 紅燈：Test Step 前，Jira ASUS 看板無對應票
- 🟢 綠燈：Test Step 後，Jira 出現一張 Task 票，票面含完整 TDD DoD
- 覆蓋率：Jira UI 驗證

**完成定義**：Jira ASUS 看板出現測試票，Description 格式符合規範

---

### T05 — 建立回填 Jira_Epic_Key Notion 節點 ⬜

**依賴**：T04

在 Jira 開票節點之後新增 Notion 節點：
- **Operation**：Update Page
- **Page ID**：`{{ $('切割任務').item.json.notionPageId }}`
- **Property**：`Jira_Epic_Key` → `{{ $json.key }}`（Jira 節點回傳的票號，如 `ASUS-1`）

**TDD DoD**
- 測試命名：`應該_回填JiraKey到Notion_當Jira票建立成功時`
- 🔴 紅燈：Test Step 前，Notion 主表 `Jira_Epic_Key` 欄位為空
- 🟢 綠燈：Test Step 後，Notion 主表該筆資料 `Jira_Epic_Key` 填入票號（如 `ASUS-1`）
- 覆蓋率：Notion UI 驗證

**完成定義**：Notion 主表測試資料的 `Jira_Epic_Key` 欄位被自動填入

---

## Phase 2 — 分流 B：Hugo 文件同步（~30min）

### T06 — 建立 Hugo Front Matter 組裝 Code 節點 ⬜

**依賴**：T02（與分流 A 並行，接在空任務 IF True 後）

新增 Code 節點，填入 design.md 的組裝邏輯：

```javascript
const props = $input.item.json.properties;
const title = props.Name.title[0]?.plain_text ?? '';
const slug = props.Slug?.rich_text[0]?.plain_text ?? '';
const weight = props.Weight?.number ?? 99;
const body = props.Tasks_To_Open
  ?.rich_text.map(t => t.plain_text).join('') ?? '';

const content = `---
title: "${title}"
weight: ${weight}
---

${body}
`;

return [{ json: { slug, content } }];
```

**TDD DoD**
- 測試命名：`應該_產出正確FrontMatter_當Notion屬性完整時`
- 🔴 紅燈：Test Step 前，輸出不含 `---` Front Matter 區塊
- 🟢 綠燈：Test Step 後，輸出含 `title`、`weight` 的 YAML Front Matter
- 覆蓋率：n8n Test Step 驗證

**完成定義**：Test Step 輸出的 `content` 欄位包含正確 Front Matter 格式

---

## Notion 開票格式

> ⚠️ Phase 2 的 Backend 任務是在「建立」開票管線本身，留存備用。

```
[Backend] 建立冪等檢查 IF 節點｜TDD: 應該_跳過workflow_當Jira_Epic_Key已有值時
[Backend] 建立空任務檢查 IF 節點｜TDD: 應該_中止workflow_當Tasks_To_Open為空時
[Backend] 建立切割任務 Code 節點｜TDD: 應該_正確切割成任務陣列_當Tasks_To_Open有兩行時
[Backend] 建立 Jira Task 開票節點｜TDD: 應該_成功建立Jira票_當任務資料正確時
[Backend] 建立回填 Jira_Epic_Key Notion 節點｜TDD: 應該_回填JiraKey到Notion_當Jira票建立成功時
[Backend] 建立 Hugo Front Matter 組裝 Code 節點｜TDD: 應該_產出正確FrontMatter_當Notion屬性完整時
```
