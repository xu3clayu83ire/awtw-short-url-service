# Notion 資料庫建置指引（T01 手動操作步驟）

> 對應任務：tasks-backend.md T01
> 完成後在 tasks-backend.md 將 T01 勾選為 ✅

---

## 前置準備

1. 開啟 Notion，建立一個新的 Page，命名為「awtw-short-url-service」（三張資料庫都放在這個 Page 裡，實際頁面已依此命名）
2. 確認已建立 Internal Integration，取得 Token：
   - Notion 右上角頭像 → Settings → Connections → Develop or manage integrations → New integration
3. 把 Integration 連結到這個 Page：
   - Page 右上角 `...` → Connections → 選你的 Integration

---

## 步驟一：建立主表【功能規格總表】

1. 在 Page 內輸入 `/database`，選擇 **Full page database**，命名為「功能規格總表」
2. 預設只有 `Name`（Title）欄位，依序新增以下欄位：

| 欄位名稱 | 型態 | 額外設定 |
|---------|------|---------|
| Status | Status | 新增選項：`Draft`、`Ready to Plan`、`In Dev`、`Done` |
| Slug | Text | 無 |
| Weight | Number | 格式選 Number |
| Tasks_To_Open | Text | 無 |
| Jira_Epic_Key | Text | 無 |
| Spec_URL | URL | 無 |
| Deploy_URL | URL | 無 |

3. 完成後資料庫應有 **8 個欄位**

---

## 步驟二：建立子表 A【架構決策紀錄】

1. 回到同一個 Page，新增第二個 Full page database，命名為「架構決策紀錄」
2. 新增以下欄位：

| 欄位名稱 | 型態 |
|---------|------|
| Decision | Text |
| Options | Text |
| Date | Date |

---

## 步驟三：建立子表 B【Bug 追蹤池】

1. 同一個 Page 新增第三個 Full page database，命名為「Bug 追蹤池」
2. 新增以下欄位：

| 欄位名稱 | 型態 | 額外設定 |
|---------|------|---------|
| Status | Status | 選項：`Open`、`In Progress`、`Resolved` |
| Severity | Select | 選項：`Critical`、`High`、`Medium`、`Low` |
| Description | Text | 無 |

---

## 步驟四：設定 Relation（主表 ↔ 子表）

**主表連結架構決策紀錄：**
1. 開啟「功能規格總表」，新增欄位，型態選 **Relation**
2. 選擇「架構決策紀錄」資料庫
3. 勾選 **Show on 架構決策紀錄**（雙向連結）
4. 欄位命名為 `ADR`

**主表連結 Bug 追蹤池：**
1. 再新增一個 Relation 欄位
2. 選擇「Bug 追蹤池」資料庫
3. 勾選雙向連結
4. 欄位命名為 `Bugs`

---

## 步驟五：取得 Database ID

完成後需要取得主表的 Database ID，填入 `send_spec.py` 的 `.env`：

1. 開啟「功能規格總表」
2. 瀏覽器網址列格式：`https://www.notion.so/<workspace>/<DatabaseID>?v=...`
3. 複製 `?v=` 之前那段 **32 碼**字串，即為 `NOTION_DATABASE_ID`

---

## 完成 Checklist

- [ ] 主表「功能規格總表」建立完成，8 個欄位型態正確
- [ ] Status 欄位有 4 個選項：Draft / Ready to Plan / In Dev / Done
- [ ] 子表 A「架構決策紀錄」建立完成
- [ ] 子表 B「Bug 追蹤池」建立完成
- [ ] 主表 Relation 欄位 `ADR` 雙向連結「架構決策紀錄」
- [ ] 主表 Relation 欄位 `Bugs` 雙向連結「Bug 追蹤池」
- [ ] Integration 已連結到 awtw-short-url-service Page
- [ ] `NOTION_DATABASE_ID` 已記錄備用
