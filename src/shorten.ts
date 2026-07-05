export interface ShortenResult {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const SHORT_CODE_LENGTH = 6;
const SHORT_CODE_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function validateUrl(url: string): void {
  if (url === undefined || url === null || url.trim() === '') {
    throw new Error('輸入的網址不得為空');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('輸入的網址格式不合法');
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error('僅支援 HTTP 或 HTTPS 協定');
  }
}

function generateShortCode(length: number = SHORT_CODE_LENGTH): string {
  if (length < 1) {
    throw new Error('短碼長度必須大於 0');
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SHORT_CODE_CHARSET.length);
    code += SHORT_CODE_CHARSET[randomIndex];
  }
  return code;
}

export async function shortenUrl(
  originalUrl: string,
  baseUrl: string = 'https://short.ly'
): Promise<ShortenResult> {
  validateUrl(originalUrl);

  const shortCode = generateShortCode(SHORT_CODE_LENGTH);
  const shortUrl = `${baseUrl}/${shortCode}`;

  return {
    shortCode,
    originalUrl,
    shortUrl,
  };
}
