import { parsePrWebhookPayload } from '../src/prNotificationPayload';

// ===== 測試資料工廠 =====
const buildRawPayload = (overrides: Record<string, unknown> = {}) => ({
  pull_request: {
    title: '[ASUS-102] 建立 CI workflow 檔案',
    html_url: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/7',
    number: 7,
    head: { ref: 'feature/ASUS-102' },
    user: { login: 'claude-ai-bot' },
    ...overrides,
  },
});

// ===== 正常情境 =====
describe('parsePrWebhookPayload', () => {
  describe('正常情境 — PR title 符合 [ASUS-N] 格式', () => {
    it('應該_萃取正確 jiraKey_當 title 包含 [ASUS-102]', () => {
      const raw = buildRawPayload();
      const result = parsePrWebhookPayload(raw);
      expect(result.jiraKey).toBe('ASUS-102');
    });

    it('應該_保留完整 prTitle_當 title 含票號與描述', () => {
      const raw = buildRawPayload();
      const result = parsePrWebhookPayload(raw);
      expect(result.prTitle).toBe('[ASUS-102] 建立 CI workflow 檔案');
    });

    it('應該_回傳正確 prUrl_當 payload 含 html_url', () => {
      const raw = buildRawPayload();
      const result = parsePrWebhookPayload(raw);
      expect(result.prUrl).toBe(
        'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/7'
      );
    });

    it('應該_回傳正確 prNumber_當 payload 含 number 欄位', () => {
      const raw = buildRawPayload();
      const result = parsePrWebhookPayload(raw);
      expect(result.prNumber).toBe(7);
    });

    it('應該_回傳正確 branch_當 payload 含 head.ref', () => {
      const raw = buildRawPayload();
      const result = parsePrWebhookPayload(raw);
      expect(result.branch).toBe('feature/ASUS-102');
    });

    it('應該_回傳正確 author_當 payload 含 user.login', () => {
      const raw = buildRawPayload();
      const result = parsePrWebhookPayload(raw);
      expect(result.author).toBe('claude-ai-bot');
    });

    it('應該_萃取不同票號_當 title 包含 [ASUS-999]', () => {
      const raw = buildRawPayload({ title: '[ASUS-999] 其他功能' });
      const result = parsePrWebhookPayload(raw);
      expect(result.jiraKey).toBe('ASUS-999');
    });
  });

  // ===== PR title 無票號 =====
  describe('降級情境 — PR title 不含 Jira 票號', () => {
    it('應該_回傳（無票號��_當 title 不符合 [ASUS-N] 格式', () => {
      const raw = buildRawPayload({ title: '隨意的 PR 標題' });
      const result = parsePrWebhookPayload(raw);
      expect(result.jiraKey).toBe('（無票號）');
    });

    it('應該_仍回傳完整 prTitle_當 title 不含票號', () => {
      const raw = buildRawPayload({ title: '隨意的 PR 標題' });
      const result = parsePrWebhookPayload(raw);
      expect(result.prTitle).toBe('隨意的 PR 標題');
    });

    it('應該_回傳（無票號）_當 title 為空字串', () => {
      const raw = buildRawPayload({ title: '' });
      const result = parsePrWebhookPayload(raw);
      expect(result.jiraKey).toBe('（無票號）');
    });
  });

  // ===== 欄位缺漏容錯 =====
  describe('容錯情境 — payload 欄位不完整', () => {
    it('應該_回傳空字串 prTitle_當 pull_request.title 缺失', () => {
      const raw = buildRawPayload({ title: undefined });
      const result = parsePrWebhookPayload(raw);
      expect(result.prTitle).toBe('');
    });

    it('應該_回傳空字串 prUrl_當 pull_request.html_url 缺失', () => {
      const raw = buildRawPayload({ html_url: undefined });
      const result = parsePrWebhookPayload(raw);
      expect(result.prUrl).toBe('');
    });

    it('應該_回傳空字串 branch_當 head.ref 缺失', () => {
      const raw = buildRawPayload({ head: undefined });
      const result = parsePrWebhookPayload(raw);
      expect(result.branch).toBe('');
    });

    it('應該_回傳空字串 author_當 user.login 缺失', () => {
      const raw = buildRawPayload({ user: undefined });
      const result = parsePrWebhookPayload(raw);
      expect(result.author).toBe('');
    });

    it('應該_回傳 0 作為 prNumber_當 number 欄位缺失', () => {
      const raw = buildRawPayload({ number: undefined });
      const result = parsePrWebhookPayload(raw);
      expect(result.prNumber).toBe(0);
    });
  });

  // ===== 嚴重錯誤防護 =====
  describe('防護情境 — 頂層 pull_request 物件缺失', () => {
    it('應該_拋出繁體中文錯誤_當 payload 不含 pull_request 欄位', () => {
      expect(() => parsePrWebhookPayload({})).toThrow(
        'PR Webhook payload 解析失敗：缺少 pull_request 欄位，無法繼續處理'
      );
    });

    it('應該_拋出繁體中文錯誤_當 payload 為 null', () => {
      expect(() => parsePrWebhookPayload(null as unknown as Record<string, unknown>)).toThrow(
        'PR Webhook payload 解析失敗：payload 為空值，無法繼續處理'
      );
    });

    it('應該_拋出繁體中文錯誤_當 payload 為 undefined', () => {
      expect(() =>
        parsePrWebhookPayload(undefined as unknown as Record<string, unknown>)
      ).toThrow('PR Webhook payload 解析失敗：payload 為空值，無法繼續處理');
    });
  });
});

// ===== Email 主旨格式測試 =====
import { buildEmailSubject } from '../src/prNotificationPayload';

describe('buildEmailSubject', () => {
  it('應該_產出正確主旨格式_當 jiraKey 與 prTitle 皆有值', () => {
    const subject = buildEmailSubject('ASUS-102', '[ASUS-102] 建立 CI workflow 檔案');
    expect(subject).toBe('[ASUS 審核通知] [ASUS-102] 建立 CI workflow 檔案');
  });

  it('應該_包含（無票號）標示_當 jiraKey 為（無票號）', () => {
    const subject = buildEmailSubject('（無票號）', '隨意的 PR 標題');
    expect(subject).toBe('[ASUS 審核通知] [（無票號）] 隨意的 PR 標題');
  });

  it('應該_拋出繁體中文錯誤_當 prTitle 為空字串', () => {
    expect(() => buildEmailSubject('ASUS-102', '')).toThrow(
      'buildEmailSubject 失敗：prTitle 不得為空字串'
    );
  });
});

// ===== Email 內文格式測試 =====
import { buildEmailBody } from '../src/prNotificationPayload';
import type { PrNotificationPayload } from '../src/prNotificationPayload';

describe('buildEmailBody', () => {
  const payload: PrNotificationPayload = {
    jiraKey: 'ASUS-102',
    prTitle: '[ASUS-102] 建立 CI workflow 檔案',
    prUrl: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/7',
    prNumber: 7,
    branch: 'feature/ASUS-102',
    author: 'claude-ai-bot',
  };

  it('應該_包含票號_當 payload 含有效 jiraKey', () => {
    const body = buildEmailBody(payload);
    expect(body).toContain('票號：ASUS-102');
  });

  it('應該_包含 PR 連結_當 payload 含 prUrl', () => {
    const body = buildEmailBody(payload);
    expect(body).toContain(
      'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/7'
    );
  });

  it('應該_包含分支資訊_當 payload 含 branch', () => {
    const body = buildEmailBody(payload);
    expect(body).toContain('feature/ASUS-102');
  });

  it('應該_包含 /addyosmani-review 操作提示_當任意有效 payload', () => {
    const body = buildEmailBody(payload);
    expect(body).toContain('/addyosmani-review');
  });

  it('應該_拋出繁體中文錯誤_當 prUrl 為空字串', () => {
    expect(() => buildEmailBody({ ...payload, prUrl: '' })).toThrow(
      'buildEmailBody 失敗：prUrl 不得為空字串'
    );
  });
});
