import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// CI Workflow 結構型別定義
interface WorkflowJob {
  'runs-on': string;
  needs?: string[];
  if?: string;
  steps: Array<{
    uses?: string;
    run?: string;
    name?: string;
    with?: Record<string, unknown>;
  }>;
}

interface CiWorkflow {
  name: string;
  on: {
    push: { branches: string[] };
    pull_request: { branches: string[] };
  };
  jobs: {
    test: WorkflowJob;
    lint: WorkflowJob;
    'build-docs'?: WorkflowJob;
  };
}

const WORKFLOW_PATH = path.resolve(
  __dirname,
  '../.github/workflows/ci.yml'
);

function 載入CI工作流程(): CiWorkflow {
  if (!fs.existsSync(WORKFLOW_PATH)) {
    throw new Error(
      `找不到 CI workflow 檔案：${WORKFLOW_PATH}，請確認 .github/workflows/ci.yml 已建立`
    );
  }
  const raw = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
  const parsed = yaml.load(raw) as CiWorkflow;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(
      `CI workflow 檔案格式錯誤：無法解析 ${WORKFLOW_PATH} 為有效 YAML`
    );
  }
  return parsed;
}

describe('CI Workflow 檔案驗證', () => {
  let workflow: CiWorkflow;

  beforeAll(() => {
    workflow = 載入CI工作流程();
  });

  // ── 觸發條件驗證 ──────────────────────────────────────────
  describe('觸發條件', () => {
    test('應該_涵蓋所有分支push_當設定on.push.branches', () => {
      const branches = workflow.on?.push?.branches;
      expect(branches).toBeDefined();
      const 涵蓋所有分支 = branches.some(
        (b) => b === '**' || b === '*'
      );
      expect(涵蓋所有分支).toBe(true);
    });

    test('應該_包含PR觸發條件_當pull_request事件針對main', () => {
      const prBranches = workflow.on?.pull_request?.branches;
      expect(prBranches).toBeDefined();
      expect(prBranches).toContain('main');
    });
  });

  // ── test job 驗證 ─────────────────────────────────────────
  describe('test job', () => {
    test('應該_存在test_job_當ci_yml已建立', () => {
      expect(workflow.jobs?.test).toBeDefined();
    });

    test('應該_使用ubuntu-latest_當test_job執行環境設定', () => {
      expect(workflow.jobs.test['runs-on']).toBe('ubuntu-latest');
    });

    test('應該_包含npm_ci步驟_當test_job執行依賴安裝', () => {
      const steps = workflow.jobs.test.steps;
      const hasNpmCi = steps.some(
        (s) => s.run?.trim() === 'npm ci'
      );
      expect(hasNpmCi).toBe(true);
    });

    test('應該_包含npm_run_test步驟_當test_job執行測試', () => {
      const steps = workflow.jobs.test.steps;
      const hasNpmTest = steps.some(
        (s) => s.run?.trim() === 'npm run test'
      );
      expect(hasNpmTest).toBe(true);
    });

    test('應該_npm_ci在npm_run_test之前_當test_job步驟順序正確', () => {
      const steps = workflow.jobs.test.steps;
      const ciIdx = steps.findIndex((s) => s.run?.trim() === 'npm ci');
      const testIdx = steps.findIndex(
        (s) => s.run?.trim() === 'npm run test'
      );
      if (ciIdx === -1 || testIdx === -1) {
        throw new Error(
          'test job 缺少 npm ci 或 npm run test 步驟，請確認 ci.yml 設定正確'
        );
      }
      expect(ciIdx).toBeLessThan(testIdx);
    });

    test('應該_包含Node20設定_當test_job需要指定Node版本', () => {
      const steps = workflow.jobs.test.steps;
      const nodeStep = steps.find(
        (s) => s.uses?.startsWith('actions/setup-node')
      );
      expect(nodeStep).toBeDefined();
      const nodeVersion = String(nodeStep?.with?.['node-version'] ?? '');
      expect(nodeVersion).toMatch(/^20/);
    });
  });

  // ── lint job 驗證 ─────────────────────────────────────────
  describe('lint job', () => {
    test('應該_存在lint_job_當ci_yml已建立', () => {
      expect(workflow.jobs?.lint).toBeDefined();
    });

    test('應該_使用ubuntu-latest_當lint_job執行環境設定', () => {
      expect(workflow.jobs.lint['runs-on']).toBe('ubuntu-latest');
    });

    test('應該_包含npm_ci步驟_當lint_job執行依賴安裝', () => {
      const steps = workflow.jobs.lint.steps;
      const hasNpmCi = steps.some(
        (s) => s.run?.trim() === 'npm ci'
      );
      expect(hasNpmCi).toBe(true);
    });

    test('應該_包含tsc_noEmit步驟_當lint_job執行型別檢查', () => {
      const steps = workflow.jobs.lint.steps;
      const hasTsc = steps.some(
        (s) => s.run?.includes('tsc') && s.run?.includes('--noEmit')
      );
      expect(hasTsc).toBe(true);
    });

    test('應該_npm_ci在tsc之前_當lint_job步驟順序正確', () => {
      const steps = workflow.jobs.lint.steps;
      const ciIdx = steps.findIndex((s) => s.run?.trim() === 'npm ci');
      const tscIdx = steps.findIndex(
        (s) => s.run?.includes('tsc') && s.run?.includes('--noEmit')
      );
      if (ciIdx === -1 || tscIdx === -1) {
        throw new Error(
          'lint job 缺少 npm ci 或 tsc --noEmit 步驟，請確認 ci.yml 設定正確'
        );
      }
      expect(ciIdx).toBeLessThan(tscIdx);
    });

    test('應該_包含Node20設定_當lint_job需要指定Node版本', () => {
      const steps = workflow.jobs.lint.steps;
      const nodeStep = steps.find(
        (s) => s.uses?.startsWith('actions/setup-node')
      );
      expect(nodeStep).toBeDefined();
      const nodeVersion = String(nodeStep?.with?.['node-version'] ?? '');
      expect(nodeVersion).toMatch(/^20/);
    });
  });

  // ── 平行執行驗證 ──────────────────────────────────────────
  describe('平行執行', () => {
    test('應該_顯示綠燈_當測試全數通過', () => {
      // test 與 lint job 均不應有 needs 互相依賴，確保平行執行
      const testNeeds = workflow.jobs.test.needs ?? [];
      const lintNeeds = workflow.jobs.lint.needs ?? [];

      const testBlockedByLint = testNeeds.includes('lint');
      const lintBlockedByTest = lintNeeds.includes('test');

      if (testBlockedByLint) {
        throw new Error(
          'test job 不應依賴 lint job：兩個 job 必須平行執行以確保效率'
        );
      }
      if (lintBlockedByTest) {
        throw new Error(
          'lint job 不應依賴 test job：兩個 job 必須平行執行以確保效率'
        );
      }

      expect(testBlockedByLint).toBe(false);
      expect(lintBlockedByTest).toBe(false);
    });
  });

  // ── build-docs job 驗證 ───────────────────────────────────
  describe('build-docs job', () => {
    test('應該_存在build-docs_job_當ci_yml已建立', () => {
      expect(workflow.jobs['build-docs']).toBeDefined();
    });

    test('應該_僅在main分支執行_當build-docs_job設定if條件', () => {
      const buildDocsJob = workflow.jobs['build-docs'];
      if (!buildDocsJob) {
        throw new Error(
          'build-docs job 不存在，請確認 ci.yml 已正確定義此 job'
        );
      }
      expect(buildDocsJob.if).toBeDefined();
      expect(buildDocsJob.if).toContain('refs/heads/main');
    });

    test('應該_在test與lint通過後才執行_當build-docs_job依賴設定', () => {
      const buildDocsJob = workflow.jobs['build-docs'];
      if (!buildDocsJob) {
        throw new Error(
          'build-docs job 不存在，請確認 ci.yml 已正確定義此 job'
        );
      }
      const needs = buildDocsJob.needs ?? [];
      expect(needs).toContain('test');
      expect(needs).toContain('lint');
    });
  });
});
