import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('npm scripts lint 設定', () => {
  it('應該_型別檢查通過_當程式碼無型別錯誤', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    let packageJson: Record<string, unknown>;

    try {
      const content = readFileSync(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content) as Record<string, unknown>;
    } catch (err) {
      throw new Error(`無法讀取 package.json：${String(err)}`);
    }

    const scripts = packageJson['scripts'] as Record<string, string> | undefined;
    if (!scripts) {
      throw new Error('package.json 中缺少 scripts 欄位');
    }

    const lintScript = scripts['lint'];
    if (!lintScript) {
      throw new Error('package.json 中缺少 lint script，請新增 "lint": "tsc --noEmit"');
    }

    expect(lintScript).toContain('tsc --noEmit');

    try {
      execSync('npm run lint', {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch (err) {
      const execError = err as { stdout?: string; stderr?: string; message?: string };
      const stdout = execError.stdout ?? '';
      const stderr = execError.stderr ?? '';
      throw new Error(
        `npm run lint 執行失敗，TypeScript 型別檢查未通過。\n` +
        `stdout：${stdout}\n` +
        `stderr：${stderr}`
      );
    }
  });
});
