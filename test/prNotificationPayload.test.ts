/**
 * 測試檔案：PR 通知 Payload 解析器
 * Jira 票號：ASUS-102
 * TDD 完成定義：應該_顯示綠燈_當測試全數通過
 */

import {
  parsePrNotificationPayload,
  formatEmailSubject,
  formatEmailBody,
} from '../src/prNotificationPayload';
import type { GitHubPrWebhookPayload } from '../src/prNotificationPayload';

// ─── 測試資料工廠 ────────────────────────────────────────────────
function buildPrPayload(
  overrides: Partial<GitHubPrWebhookPayload['pull_request']> = {}
): GitHubPrWebhookPayload {
  return {
    action: 'opened',
    pull_request: {
      number: 42,
      title: '[ASUS-42] 實作 POST /api/shorten',
      html_url: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42',
      head: { ref: 'feature/ASUS-42' },
      user: { login: 'claude-ai-bot' },
      ...overrides,
    },
  };
}

// ─── parsePrNotificationPayload ─────────────────────────────────
describe('parsePrNotificationPayload', () => {
  test('應該_萃取正確的 jiraKey_當 PR title 含標準票號格式', () => {
    const payload = buildPrPayload();
    const result = parsePrNotificationPayload(payload);
    expect(result.jiraKey).toBe('ASUS-42');
  });

  test('應該_回傳（無票號）_當 PR title 不含 Jira 票號', () => {
    const payload = buildPrPayload({ title: '修正若干 bug' });
    const result = parsePrNotificationPayload(payload);
    expect(result.jiraKey).toBe('（無票號）');
  });

  test('應該_正確解析 prTitle_當 payload 正常', () => {
    const payload = buildPrPayload();
    const result = parsePrNotificationPayload(payload);
    expect(result.prTitle).toBe('[ASUS-42] 實作 POST /api/shorten');
  });

  test('應該_正確解析 prUrl_當 payload 正常', () => {
    const payload = buildPrPayload();
    const result = parsePrNotificationPayload(payload);
    expect(result.prUrl).toBe(
      'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42'
    );
  });

  test('應該_正確解析 prNumber_當 payload 正常', () => {
    const payload = buildPrPayload();
    const result = parsePrNotificationPayload(payload);
    expect(result.prNumber).toBe(42);
  });

  test('應該_正確解析 branch_當 payload 正常', () => {
    const payload = buildPrPayload();
    const result = parsePrNotificationPayload(payload);
    expect(result.branch).toBe('feature/ASUS-42');
  });

  test('應該_正確解析 author_當 payload 正常', () => {
    const payload = buildPrPayload();
    const result = parsePrNotificationPayload(payload);
    expect(result.author).toBe('claude-ai-bot');
  });

  test('應該_回傳空字串作為 prTitle_當 pull_request.title 為 undefined', () => {
    const payload = buildPrPayload({ title: undefined as unknown as string });
    const result = parsePrNotificationPayload(payload);
    expect(result.prTitle).toBe('');
  });

  test('應該_回傳空字串作為 prUrl_當 pull_request.html_url 為 undefined', () => {
    const payload = buildPrPayload({ html_url: undefined as unknown as string });
    const result = parsePrNotificationPayload(payload);
    expect(result.prUrl).toBe('');
  });

  test('應該_回傳空字串作為 branch_當 head.ref 為 undefined', () => {
    const payload = buildPrPayload({
      head: { ref: undefined as unknown as string },
    });
    const result = parsePrNotificationPayload(payload);
    expect(result.branch).toBe('');
  });

  test('應該_回傳空字串作為 author_當 user.login 為 undefined', () => {
    const payload = buildPrPayload({
      user: { login: undefined as unknown as string },
    });
    const result = parsePrNotificationPayload(payload);
    expect(result.author).toBe('');
  });

  test('應該_拋出錯誤並附繁體中文訊息_當 payload 為 null', () => {
    expect(() =>
      parsePrNotificationPayload(null as unknown as GitHubPrWebhookPayload)
    ).toThrow('PR Webhook payload 不可為空值，無法解析 PR 通知資訊');
  });

  test('應該_拋出錯誤並附繁體中文訊息_當 pull_request 欄位缺失', () => {
    expect(() =>
      parsePrNotificationPayload(
        { action: 'opened' } as unknown as GitHubPrWebhookPayload
      )
    ).toThrow('payload 缺少 pull_request 欄位，無法解析 PR 通知資訊');
  });

  test('應該_萃取多位數票號_當票號為 ASUS-102', () => {
    const payload = buildPrPayload({ title: '[ASUS-102] 建立 CI workflow 檔案' });
    const result = parsePrNotificationPayload(payload);
    expect(result.jiraKey).toBe('ASUS-102');
  });
});

// ─── formatEmailSubject ──────────────────────────────────────────
describe('formatEmailSubject', () => {
  test('應該_產生正確主旨格式_當 jiraKey 與 prTitle 正常', () => {
    const subject = formatEmailSubject(
      'ASUS-42',
      '[ASUS-42] 實作 POST /api/shorten'
    );
    expect(subject).toBe(
      '[ASUS 審核通知] [ASUS-42] 實作 POST /api/shorten'
    );
  });

  test('應該_主旨仍正常產生_當 jiraKey 為（無票號）', () => {
    const subject = formatEmailSubject('（無票號）', '修正若干 bug');
    expect(subject).toBe('[ASUS 審核通知] 修正若干 bug');
  });

  test('應該_拋出錯誤並附繁體中文訊息_當 prTitle 為空字串', () => {
    expect(() => formatEmailSubject('ASUS-42', '')).toThrow(
      'prTitle 不可為空字串，無法產生 Email 主旨'
    );
  });
});

// ─── formatEmailBody ─────────────────────────────────────────────
describe('formatEmailBody', () => {
  const baseNotification = {
    jiraKey: 'ASUS-42',
    prTitle: '[ASUS-42] 實作 POST /api/shorten',
    prUrl: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42',
    prNumber: 42,
    branch: 'feature/ASUS-42',
    author: 'claude-ai-bot',
  };

  test('應該_包含票號_當通知資料正常', () => {
    const body = formatEmailBody(baseNotification);
    expect(body).toContain('ASUS-42');
  });

  test('應該_包含 PR 連結_當通知資料正常', () => {
    const body = formatEmailBody(baseNotification);
    expect(body).toContain(
      'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42'
    );
  });

  test('應該_包含分支資訊_當通知資料正常', () => {
    const body = formatEmailBody(baseNotification);
    expect(body).toContain('feature/ASUS-42');
  });

  test('應該_包含審核操作指示_當通知資料正常', () => {
    const body = formatEmailBody(baseNotification);
    expect(body).toContain('/addyosmani-review');
  });

  test('應該_包含 PR 作者_當通知資料正常', () => {
    const body = formatEmailBody(baseNotification);
    expect(body).toContain('claude-ai-bot');
  });

  test('應該_拋出錯誤並附繁體中文訊息_當 prUrl 為空字串', () => {
    expect(() =>
      formatEmailBody({ ...baseNotification, prUrl: '' })
    ).toThrow('prUrl 不可為空字串，無法產生 Email 通知內文');
  });

  test('應該_包含功能摘要_當 prTitle 正常', () => {
    const body = formatEmailBody(baseNotification);
    expect(body).toContain('實作 POST /api/shorten');
  });
});
