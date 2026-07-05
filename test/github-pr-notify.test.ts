import { describe, it, expect } from 'vitest';
import {
  parsePrPayload,
  formatEmailSubject,
  formatEmailBody,
} from '../src/github-pr-notify';
import type { PrNotificationPayload } from '../src/github-pr-notify';

// 標準PRPayload：符合 GitHub PR opened 事件結構
const 標準PRPayload = {
  action: 'opened',
  pull_request: {
    number: 42,
    title: '[ASUS-42] 實作 POST /api/shorten',
    html_url: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42',
    head: { ref: 'feature/ASUS-42' },
    user: { login: 'ai-agent' },
  },
};

// 無票號PRPayload：PR title 不含 Jira 票號格式
const 無票號PRPayload = {
  action: 'opened',
  pull_request: {
    number: 99,
    title: '修正一些問題',
    html_url: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/99',
    head: { ref: 'hotfix/some-fix' },
    user: { login: 'developer' },
  },
};

// 空白PRPayload：pull_request 欄位缺失
const 空白PRPayload = {};

describe('github-pr-notify', () => {
  describe('parsePrPayload', () => {
    it('應該_發送Email通知_當GitHub PR被建立', () => {
      const result = parsePrPayload(標準PRPayload);

      expect(result.jiraKey).toBe('ASUS-42');
      expect(result.prTitle).toBe('[ASUS-42] 實作 POST /api/shorten');
      expect(result.prUrl).toBe(
        'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42'
      );
      expect(result.prNumber).toBe(42);
      expect(result.branch).toBe('feature/ASUS-42');
      expect(result.author).toBe('ai-agent');
    });

    it('應該_設定票號為無票號_當PR標題不含Jira票號格式', () => {
      const result = parsePrPayload(無票號PRPayload);

      expect(result.jiraKey).toBe('（無票號）');
      expect(result.prTitle).toBe('修正一些問題');
      expect(result.prNumber).toBe(99);
      expect(result.branch).toBe('hotfix/some-fix');
      expect(result.author).toBe('developer');
    });

    it('應該_回傳空值預設值_當payload缺少pull_request欄位', () => {
      const result = parsePrPayload(空白PRPayload);

      expect(result.jiraKey).toBe('（無票號）');
      expect(result.prTitle).toBe('');
      expect(result.prUrl).toBe('');
      expect(result.prNumber).toBe('');
      expect(result.branch).toBe('');
      expect(result.author).toBe('');
    });

    it('應該_正確萃取ASUS票號_當PR標題包含多種格式的票號', () => {
      const payloadWithBracket = {
        action: 'opened',
        pull_request: {
          number: 108,
          title: '[ASUS-108] 建立 n8n PR 通知 Workflow',
          html_url: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/108',
          head: { ref: 'feature/ASUS-108' },
          user: { login: 'ai-agent' },
        },
      };

      const result = parsePrPayload(payloadWithBracket);
      expect(result.jiraKey).toBe('ASUS-108');
    });
  });

  describe('formatEmailSubject', () => {
    it('應該_產生正確Email主旨格式_當傳入標準PR資訊', () => {
      const payload: PrNotificationPayload = {
        jiraKey: 'ASUS-42',
        prTitle: '[ASUS-42] 實作 POST /api/shorten',
        prUrl: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42',
        prNumber: 42,
        branch: 'feature/ASUS-42',
        author: 'ai-agent',
      };

      const subject = formatEmailSubject(payload);
      expect(subject).toBe(
        '[ASUS 審核通知] [ASUS-42] 實作 POST /api/shorten'
      );
    });

    it('應該_主旨包含無票號文字_當PR沒有Jira票號', () => {
      const payload: PrNotificationPayload = {
        jiraKey: '（無票號）',
        prTitle: '修正一些問題',
        prUrl: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/99',
        prNumber: 99,
        branch: 'hotfix/some-fix',
        author: 'developer',
      };

      const subject = formatEmailSubject(payload);
      expect(subject).toBe('[ASUS 審核通知] [（無票號）] 修正一些問題');
    });
  });

  describe('formatEmailBody', () => {
    it('應該_產生包含所有必要欄位的Email內容_當傳入完整PR資訊', () => {
      const payload: PrNotificationPayload = {
        jiraKey: 'ASUS-42',
        prTitle: '[ASUS-42] 實作 POST /api/shorten',
        prUrl: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42',
        prNumber: 42,
        branch: 'feature/ASUS-42',
        author: 'ai-agent',
      };

      const body = formatEmailBody(payload);

      expect(body).toContain('新 PR 待審核');
      expect(body).toContain('票號：ASUS-42');
      expect(body).toContain('功能：[ASUS-42] 實作 POST /api/shorten');
      expect(body).toContain('分支：feature/ASUS-42 → main');
      expect(body).toContain(
        'PR 連結：https://github.com/xu3clayu83ire/awtw-short-url-service/pull/42'
      );
      expect(body).toContain('/addyosmani-review');
    });

    it('應該_Email內容包含作者資訊_當PR有提交者', () => {
      const payload: PrNotificationPayload = {
        jiraKey: 'ASUS-108',
        prTitle: '[ASUS-108] 建立 n8n PR 通知 Workflow',
        prUrl: 'https://github.com/xu3clayu83ire/awtw-short-url-service/pull/108',
        prNumber: 108,
        branch: 'feature/ASUS-108',
        author: 'ai-agent',
      };

      const body = formatEmailBody(payload);
      expect(body).toContain('作者：ai-agent');
    });
  });
});
