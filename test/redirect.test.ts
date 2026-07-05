import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveRedirect } from '../src/redirect';

// 模擬儲存層
const mockFindByCode = vi.fn();

vi.mock('../src/store', () => ({
  findByCode: (code: string) => mockFindByCode(code),
}));

describe('resolveRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該_成功轉址_當短碼存在時', async () => {
    // Arrange
    const code = 'abc123';
    const originalUrl = 'https://www.example.com/very/long/path';
    mockFindByCode.mockResolvedValue({ code, originalUrl });

    // Act
    const result = await resolveRedirect(code);

    // Assert
    expect(result).toEqual({ found: true, originalUrl });
    expect(mockFindByCode).toHaveBeenCalledWith(code);
    expect(mockFindByCode).toHaveBeenCalledTimes(1);
  });

  it('應該_回傳未找到_當短碼不存在時', async () => {
    // Arrange
    const code = 'notexist';
    mockFindByCode.mockResolvedValue(null);

    // Act
    const result = await resolveRedirect(code);

    // Assert
    expect(result).toEqual({ found: false, originalUrl: null });
  });

  it('應該_拋出錯誤_當短碼為空字串時', async () => {
    // Act & Assert
    await expect(resolveRedirect('')).rejects.toThrow(
      '轉址失敗：短碼不得為空'
    );
  });

  it('應該_拋出錯誤_當儲存層發生異常時', async () => {
    // Arrange
    const code = 'abc123';
    mockFindByCode.mockRejectedValue(new Error('DB 連線失敗'));

    // Act & Assert
    await expect(resolveRedirect(code)).rejects.toThrow(
      '轉址查詢失敗：短碼 abc123 查詢時發生錯誤 — DB 連線失敗'
    );
  });
});
