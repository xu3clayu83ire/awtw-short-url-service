import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const CI_WORKFLOW_PATH = resolve(process.cwd(), '.github/workflows/ci.yml');

function 讀取WorkflowYAML(): string {
  if (!existsSync(CI_WORKFLOW_PATH)) {
    throw new Error(`找不到 CI workflow 檔案：${CI_WORKFLOW_PATH}`);
  }
  return readFileSync(CI_WORKFLOW_PATH, 'utf-8');
}

describe('CI Workflow 檔案驗證', () => {
  it('應該_顯示綠燈_當測試全數通過', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toBeTruthy();
  });

  it('應該_包含workflow名稱_當ci.yml存在', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain('name:');
  });

  it('應該_包含push觸發條件_當任意branch被推送', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain('push:');
    expect(content).toContain("'**'");
  });

  it('應該_包含pull_request觸發條件_當PR被建立', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain('pull_request:');
  });

  it('應該_包含test_job_當workflow執行時', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain('test:');
    expect(content).toContain('npm ci');
    expect(content).toContain('npm run test');
  });

  it('應該_包含lint_job_當workflow執行時', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain('lint:');
    expect(content).toContain('npx tsc --noEmit');
  });

  it('應該_test與lint平行執行_當沒有needs依賴關係時', () => {
    const content = 讀取WorkflowYAML();
    // test job 不應該有 needs 指向 lint，lint job 不應該有 needs 指向 test
    const testJobSection = content.substring(
      content.indexOf('test:'),
      content.indexOf('lint:')
    );
    expect(testJobSection).not.toContain('needs:');
  });

  it('應該_使用Node20_當CI環境建置時', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain("node-version: '20'");
  });

  it('應該_使用ubuntu-latest_當job執行時', () => {
    const content = 讀取WorkflowYAML();
    const ubuntuCount = (content.match(/ubuntu-latest/g) ?? []).length;
    expect(ubuntuCount).toBeGreaterThanOrEqual(2);
  });

  it('應該_包含checkout步驟_當job開始時', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain('actions/checkout@v4');
  });

  it('應該_包含npm快取設定_當安裝依賴時', () => {
    const content = 讀取WorkflowYAML();
    expect(content).toContain("cache: 'npm'");
  });
});
