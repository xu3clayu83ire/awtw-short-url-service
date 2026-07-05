/**
 * ASUS-108：n8n PR 通知 Workflow — PR 資訊解析與 Email 格式化模組
 *
 * 此模組實作 n8n Code node 中使用的核心邏輯：
 * 1. 解析 GitHub PR Webhook payload
 * 2. 格式化 Email 主旨
 * 3. 格式化 Email 內文
 */

export interface PrNotificationPayload {
  jiraKey: string;
  prTitle: string;
  prUrl: string;
  prNumber: number | string;
  branch: string;
  author: string;
}

/**
 * 從 GitHub PR Webhook payload 萃取 PR 資訊。
 * 若 pull_request 欄位缺失或 title 不含 Jira 票號格式，以預設值填補，不拋出錯誤。
 *
 * @param payload - GitHub PR Webhook 的原始 JSON body
 * @returns PrNotificationPayload
 * @throws 若 payload 不是物件型別，拋出錯誤（禁止 silent fail）
 */
export function parsePrPayload(payload: unknown): PrNotificationPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error(
      '[ASUS-108] parsePrPayload 錯誤：payload 必須為物件，收到的型別為 ' +
        typeof payload
    );
  }

  const body = payload as Record<string, unknown>;
  const pr = (body.pull_request ?? {}) as Record<string, unknown>;

  const titleMatch =
    typeof pr.title === 'string'
      ? pr.title.match(/\[([A-Z]+-\d+)\]/)
      : null;
  const jiraKey = titleMatch ? titleMatch[1] : '（無票號）';

  const head = (pr.head ?? {}) as Record<string, unknown>;
  const user = (pr.user ?? {}) as Record<string, unknown>;

  return {
    jiraKey,
    prTitle: typeof pr.title === 'string' ? pr.title : '',
    prUrl: typeof pr.html_url === 'string' ? pr.html_url : '',
    prNumber:
      typeof pr.number === 'number' || typeof pr.number === 'string'
        ? pr.number
        : '',
    branch: typeof head.ref === 'string' ? head.ref : '',
    author: typeof user.login === 'string' ? user.login : '',
  };
}

/**
 * 格式化 Email 主旨。
 * 格式：[ASUS 審核通知] [票號] PR標題
 *
 * @param payload - 已解析的 PR 通知資訊
 * @returns Email 主旨字串
 */
export function formatEmailSubject(payload: PrNotificationPayload): string {
  // prTitle 可能已經帶有 GitHub PR 標題本身的票號前綴（如 "[ASUS-42] xxx"），
  // 需先去除避免跟 jiraKey 前綴重複
  const description = payload.prTitle.replace(/^\[[A-Z]+-\d+\]\s*/, '').trim() || payload.prTitle;
  return `[ASUS 審核通知] [${payload.jiraKey}] ${description}`;
}

/**
 * 格式化 Email 內文。
 * 包含票號、功能摘要、分支、PR 連結、作者、審核指令提示。
 *
 * @param payload - 已解析的 PR 通知資訊
 * @returns Email 內文字串
 */
export function formatEmailBody(payload: PrNotificationPayload): string {
  return [
    '新 PR 待審核',
    '',
    `票號：${payload.jiraKey}`,
    `功能：${payload.prTitle}`,
    `分支：${payload.branch} → main`,
    `PR 連結：${payload.prUrl}`,
    `作者：${payload.author}`,
    '',
    '請執行 /addyosmani-review 後至 GitHub 頁面 Approve。',
  ].join('\n');
}
