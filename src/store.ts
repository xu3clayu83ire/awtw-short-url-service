export interface UrlRecord {
  code: string;
  originalUrl: string;
}

export async function findByCode(code: string): Promise<UrlRecord | null> {
  throw new Error('store 尚未實作，請使用測試 mock');
}
