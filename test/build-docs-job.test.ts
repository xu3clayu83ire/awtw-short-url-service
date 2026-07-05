import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ciYmlPath = path.resolve('.github/workflows/ci.yml');

function 讀取CI設定(): string {
  if (!fs.existsSync(ciYmlPath)) {
    throw new Error(`找不到 CI 設定檔：${ciYmlPath}`);
  }
  return fs.readFileSync(ciYmlPath, 'utf-8');
}

describe('build-docs job 設定驗證', () => {
  it('應該_產出Hugo artifact_當merge進main', () => {
    const 內容 = 讀取CI設定();

    // 確認 build-docs job 存在
    expect(內容).toContain('build-docs:');

    // 確認使用 peaceiris/actions-hugo@v3
    expect(內容).toContain('peaceiris/actions-hugo@v3');

    // 確認僅在 refs/heads/main 觸發
    expect(內容).toContain("if: github.ref == 'refs/heads/main'");

    // 確認產出路徑為 hugo-docs/public/
    expect(內容).toContain('hugo-docs/public/');

    // 確認 artifact 名稱為 hugo-public
    expect(內容).toContain('hugo-public');

    // 確認保留天數為 7 天
    expect(內容).toContain('retention-days: 7');

    // 確認使用 actions/upload-artifact@v4
    expect(內容).toContain('actions/upload-artifact@v4');

    // 確認 needs test 與 lint
    expect(內容).toContain('needs: [test, lint]');

    // 確認 hugo --minify 指令
    expect(內容).toContain('hugo --minify');
  });

  it('應該_不在featureBranch執行buildDocs_當push非main分支', () => {
    const 內容 = 讀取CI設定();

    // build-docs job 必須有 if 條件限制只在 main 執行
    const buildDocs區塊起始 = 內容.indexOf('build-docs:');
    expect(buildDocs區塊起始).toBeGreaterThan(-1);

    const buildDocs區塊 = 內容.slice(buildDocs區塊起始, buildDocs區塊起始 + 300);
    expect(buildDocs區塊).toContain('refs/heads/main');

    // 確認 if 條件與 github.ref 比對
    expect(buildDocs區塊).toContain('github.ref');
  });

  it('應該_包含checkout步驟_當執行buildDocsJob', () => {
    const 內容 = 讀取CI設定();

    const buildDocs區塊起始 = 內容.indexOf('build-docs:');
    expect(buildDocs區塊起始).toBeGreaterThan(-1);

    const buildDocs區塊 = 內容.slice(buildDocs區塊起始, buildDocs區塊起始 + 500);
    expect(buildDocs區塊).toContain('actions/checkout@v4');
  });
});
