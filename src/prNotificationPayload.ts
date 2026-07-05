// src/prNotificationPayload.ts
// ASUS-102 — CI workflow 建立：PR Webhook payload 解析與 Email 內容產生

// ===== 型別定義 =====
export interface PrNotificationPayload {
  jiraKey: string;    // 從 PR title 萃取，如 "ASUS-102"；缺失時為「無票號」
  prTitle: string;    // PR 完整標題
  prUrl: string;      // GitHub PR 頁面連結
  prNumber: number;   // PR 編號
  branch: string;     // feature branch 名稱
  author: string;     // GitHub 帳號
}

// ===== 內部輔助：萃取 Jira 票號 =====
function extractJiraKey(title: string | undefined): string {
  if (!title) return '（無票號）';
  const match = title.match(/\[([A-Z]+-\d+)\]/);
  return match ? match[1] : '（無票號）';
}

// ===== 主要解析函式 =====
/**
 * 解析 GitHub PR Webhook 原始 payload，回傳標準化的 PrNotificationPayload。
 * 若頂層欄位缺失，拋出繁體中文錯誤；子欄位缺失則以安全預設值填補，不中斷流程。
 */
export function parsePrWebhookPayload(
  raw: Record<string, unknown>
): PrNotificationPayload {
  if (raw == null) {
    throw new Error(
      'PR Webhook payload 解析失敗：payload 為空值，無法繼續處理'
    );
  }

  if (!('pull_request' in raw) || raw['pull_request'] == null) {
    throw new Error(
      'PR Webhook payload 解析失敗：缺少 pull_request 欄位，無法繼續處理'
    );
  }

  const pr = raw['pull_request'] as Record<string, unknown>;

  const title =
    typeof pr['title'] === 'string' ? pr['title'] : '';
  const htmlUrl =
    typeof pr['html_url'] === 'string' ? pr['html_url'] : '';
  const number =
    typeof pr['number'] === 'number' ? pr['number'] : 0;

  const head = pr['head'] as Record<string, unknown> | undefined;
  const branch =
    head != null && typeof head['ref'] === 'string' ? head['ref'] : '';

  const user = pr['user'] as Record<string, unknown> | undefined;
  const author =
    user != null && typeof user['login'] === 'string' ? user['login'] : '';

  return {
    jiraKey: extractJiraKey(title),
    prTitle: title,
    prUrl: htmlUrl,
    prNumber: number,
    branch,
    author,
  };
}

// ===== Email 主旨產生 =====
/**
 * 產生 Email 主旨。
 * 格式：[ASUS 審核通知] [jiraKey] prTitle
 */
export function buildEmailSubject(
  jiraKey: string,
  prTitle: string
): string {
  if (!prTitle) {
    throw new Error('buildEmailSubject 失敗：prTitle 不得為空字串');
  }
  return `[ASUS 審核通知] [${jiraKey}] ${prTitle}`;
}

// ===== Email 內文產生 =====
/**
 * 產生 Email 審核通知內文。
 * 若 prUrl 為空字串，拋出繁體中文錯誤。
 */
export function buildEmailBody(payload: PrNotificationPayload): string {
  if (!payload.prUrl) {
    throw new Error('buildEmailBody 失敗：prUrl 不得為空字串');
  }

  return [
    '新 PR 待審核',
    '',
    `票號：${payload.jiraKey}`,
    `功能：${payload.prTitle}`,
    `分支：${payload.branch} → main`,
    `PR 連結：${payload.prUrl}`,
    `提交者：${payload.author}`,
    '',
    '請執行 /addyosmani-review 後至 GitHub 頁面 Approve。',
  ].join('\n');
}
