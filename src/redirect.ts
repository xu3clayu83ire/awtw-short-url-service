import { findByCode } from './store';

export interface RedirectResult {
  found: boolean;
  originalUrl: string | null;
}

/**
 * 根據短碼查詢對應的原始 URL
 * @param code - 短碼字串
 * @returns RedirectResult - 包含是否找到及原始 URL
 * @throws 當短碼為空或儲存層發生錯誤時拋出繁體中文錯誤訊息
 */
export async function resolveRedirect(code: string): Promise<RedirectResult> {
  if (!code || code.trim() === '') {
    throw new Error('轉址失敗：短碼不得為空');
  }

  try {
    const record = await findByCode(code);

    if (!record) {
      return { found: false, originalUrl: null };
    }

    return { found: true, originalUrl: record.originalUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `轉址查詢失敗：短碼 ${code} 查詢時發生錯誤 — ${message}`
    );
  }
}
