import { describe, it, expect, beforeEach } from 'vitest';
import { shortenUrl, ShortenResult } from '../src/shorten';

describe('shortenUrl', () => {
  describe('應該_成功產生短網址_當輸入合法URL時', () => {
    it('應該_回傳包含短碼的結果物件_當輸入合法HTTPS網址時', async () => {
      const result: ShortenResult = await shortenUrl('https://www.example.com');

      expect(result).toBeDefined();
      expect(result.shortCode).toBeDefined();
      expect(typeof result.shortCode).toBe('string');
      expect(result.shortCode.length).toBeGreaterThan(0);
    });

    it('應該_短碼長度為6到10個字元_當輸入合法URL時', async () => {
      const result: ShortenResult = await shortenUrl('https://www.google.com/search?q=typescript');

      expect(result.shortCode.length).toBeGreaterThanOrEqual(6);
      expect(result.shortCode.length).toBeLessThanOrEqual(10);
    });

    it('應該_短碼只包含字母與數字_當輸入合法URL時', async () => {
      const result: ShortenResult = await shortenUrl('https://github.com/some/repo');

      expect(result.shortCode).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('應該_保留原始網址於結果中_當輸入合法URL時', async () => {
      const originalUrl = 'https://www.example.com/path?query=value';
      const result: ShortenResult = await shortenUrl(originalUrl);

      expect(result.originalUrl).toBe(originalUrl);
    });

    it('應該_回傳完整短網址_當輸入合法URL且提供baseUrl時', async () => {
      const result: ShortenResult = await shortenUrl('https://www.example.com', 'https://short.ly');

      expect(result.shortUrl).toBe(`https://short.ly/${result.shortCode}`);
    });

    it('應該_每次產生不同短碼_當相同URL輸入兩次時', async () => {
      const url = 'https://www.example.com';
      const result1: ShortenResult = await shortenUrl(url);
      const result2: ShortenResult = await shortenUrl(url);

      expect(result1.shortCode).not.toBe(result2.shortCode);
    });
  });

  describe('應該_拋出錯誤_當輸入不合法URL時', () => {
    it('應該_拋出包含繁體中文訊息的錯誤_當輸入空字串時', async () => {
      await expect(shortenUrl('')).rejects.toThrow('輸入的網址不得為空');
    });

    it('應該_拋出包含繁體中文訊息的錯誤_當輸入非URL字串時', async () => {
      await expect(shortenUrl('not-a-valid-url')).rejects.toThrow('輸入的網址格式不合法');
    });

    it('應該_拋出包含繁體中文訊息的錯誤_當輸入非HTTP協定URL時', async () => {
      await expect(shortenUrl('ftp://example.com')).rejects.toThrow('僅支援 HTTP 或 HTTPS 協定');
    });

    it('應該_拋出包含繁體中文訊息的錯誤_當輸入undefined時', async () => {
      await expect(shortenUrl(undefined as unknown as string)).rejects.toThrow('輸入的網址不得為空');
    });
  });
});
