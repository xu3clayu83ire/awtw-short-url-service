import { describe, it, expect } from 'vitest';
import { parsePrInfo } from '../src/parsePrInfo';

describe('parsePrInfo', () => {
  it('應該_萃取票號_當PR標題符合格式', () => {
    const 標準PRPayload = {
      pull_request: {
        title: '[ASUS-109] 實作 PR 資訊解析 Code node',
        html_url: 'https://github.com/org/repo/pull/42',
        number: 42,
        head: { ref: 'feature/ASUS-109' },
        user: { login: 'ai-bot' },
      },
    };

    const result = parsePrInfo(標準PRPayload);

    expect(result.jiraKey).toBe('ASUS-109');
    expect(result.prTitle).toBe('[ASUS-109] 實作 PR 資訊解析 Code node');
    expect(result.prUrl).toBe('https://github.com/org/repo/pull/42');
    expect(result.prNumber).toBe(42);
    expect(result.branch).toBe('feature/ASUS-109');
    expect(result.author).toBe('ai-bot');
  });

  it('應該_回傳無票號_當PR標題不含票號', () => {
    const 無票號PRPayload = {
      pull_request: {
        title: '修正一些問題',
        html_url: 'https://github.com/org/repo/pull/7',
        number: 7,
        head: { ref: 'fix/some-bug' },
        user: { login: 'developer' },
      },
    };

    const result = parsePrInfo(無票號PRPayload);

    expect(result.jiraKey).toBe('（無票號）');
    expect(result.prTitle).toBe('修正一些問題');
    expect(result.prNumber).toBe(7);
  });

  it('應該_正確處理_當payload包含body層包裝', () => {
    const 巢狀Payload = {
      body: {
        pull_request: {
          title: '[ASUS-42] 建立短網址 API',
          html_url: 'https://github.com/org/repo/pull/3',
          number: 3,
          head: { ref: 'feature/ASUS-42' },
          user: { login: 'ai-agent' },
        },
      },
    };

    const result = parsePrInfo(巢狀Payload);

    expect(result.jiraKey).toBe('ASUS-42');
    expect(result.branch).toBe('feature/ASUS-42');
  });

  it('應該_使用預設空字串_當PR欄位缺失', () => {
    const 空PRPayload = {
      pull_request: {},
    };

    const result = parsePrInfo(空PRPayload);

    expect(result.jiraKey).toBe('（無票號）');
    expect(result.prTitle).toBe('');
    expect(result.prUrl).toBe('');
    expect(result.prNumber).toBe('');
    expect(result.branch).toBe('');
    expect(result.author).toBe('');
  });
});
