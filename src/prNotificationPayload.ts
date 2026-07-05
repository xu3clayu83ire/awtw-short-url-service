/**
 * PR 通知 Payload 解析器
 * Jira 票號：ASUS-102
 *
 * 職責：
 *  1. 解析 GitHub PR Webhook payload → PrNotificationPayload
 *  2. 格式化 Email 主旨
 *  3. 格式化 Email 內文
 */

// ─── 型別定義 ────────────────────────────────────────────────────

export interface GitHubPrWebhookPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    head: { ref: string };
    user: { login: string };
  };
}

export interface PrNotificationPayload {
  jiraKey: string;
  prTitle: string;
  prUrl: string;
  prNumber: number;
  branch: string;
  author: string;
}

// ─── 常數 ────────────────────────────────────────────────────────

const JIRA_KEY_PATTERN = /\[([A-Z]+-\d+)\]/;
const FALLBACK_JIRA_KEY = '（無票號）';
const EMAIL_PREFIX = '[ASUS 審核通知]';

// ─── 實作 ────────────────────────────────────────────────────────

/**
 * 解析 GitHub PR Webhook payload，萃取 PR 通知所需資訊。
 * @throws {Error} 當 payload 為 null/undefined 或缺少 pull_request 欄位
 */
export function parsePrNotificationPayload(
  payload: GitHubPrWebhookPayload
): PrNotificationPayload {
  if (payload == null) {
    throw new Error(
      'PR Webhook payload 不可為空值，無法解析 PR 通知資訊'
    );
  }

  if (payload.pull_request == null) {
    throw new Error(
      'payload 缺少 pull_request 欄位，無法解析 PR 通知資訊'
    );
  }

  const pr = payload.pull_request;
  const titleMatch = (pr.title ?? '').match(JIRA_KEY_PATTERN);
  const jiraKey = titleMatch ? titleMatch[1] : FALLBACK_JIRA_KEY;

  return {
    jiraKey,
    prTitle: pr.title ?? '',
    prUrl: pr.html_url ?? '',
    prNumber: pr.number ?? 0,
    branch: pr.head?.ref ?? '',
    author: pr.user?.login ?? '',
  };
}

/**
 * 格式化 Email 主旨。
 * @throws {Error} 當 prTitle 為空字串
 */
export function formatEmailSubject(
  jiraKey: string,
  prTitle: string
): string {
  if (!prTitle) {
    throw new Error(
      'prTitle 不可為空字串，無法產生 Email 主旨'
    );
  }

  return `${EMAIL_PREFIX} ${prTitle}`;
}

/**
 * 格式化 Email 通知內文。
 * @throws {Error} 當 prUrl 為空字串
 */
export function formatEmailBody(
  notification: PrNotificationPayload
): string {
  const { jiraKey, prTitle, prUrl, prNumber, branch, author } = notification;

  if (!prUrl) {
    throw new Error(
      'prUrl 不可為空字串，無法產生 Email 通知內文'
    );
  }

  const featureSummary = extractFeatureSummary(prTitle);

  return [
    '新 PR 待審核',
    '',
    `票號：${jiraKey}`,
    `功能：${featureSummary}`,
    `分支：${branch} → main`,
    `作者：${author}`,
    `PR 連結：${prUrl}`,
    '',
    '請執行 /addyosmani-review 後至 GitHub 頁面 Approve。',
  ].join('\n');
}

// ─── 私有輔助函式 ─────────────────────────────────────────────────

/**
 * 從 PR 標題中移除 Jira 票號前綴，保留功能描述文字。
 * 範例：'[ASUS-42] 實作 POST /api/shorten' → '實作 POST /api/shorten'
 */
function extractFeatureSummary(prTitle: string): string {
  return prTitle.replace(JIRA_KEY_PATTERN, '').trim();
}
