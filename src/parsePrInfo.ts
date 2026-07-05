export interface PrNotificationPayload {
  jiraKey: string;
  prTitle: string;
  prUrl: string;
  prNumber: number | string;
  branch: string;
  author: string;
}

interface RawPayload {
  body?: {
    pull_request?: RawPullRequest;
  };
  pull_request?: RawPullRequest;
}

interface RawPullRequest {
  title?: string;
  html_url?: string;
  number?: number;
  head?: { ref?: string };
  user?: { login?: string };
}

export function parsePrInfo(input: RawPayload): PrNotificationPayload {
  const payload = input.body ?? input;
  const pr: RawPullRequest = (payload as RawPayload).pull_request ?? {};

  const titleMatch = pr.title?.match(/\[([A-Z]+-\d+)\]/);
  const jiraKey = titleMatch ? titleMatch[1] : '（無票號）';

  return {
    jiraKey,
    prTitle: pr.title ?? '',
    prUrl: pr.html_url ?? '',
    prNumber: pr.number ?? '',
    branch: pr.head?.ref ?? '',
    author: pr.user?.login ?? '',
  };
}
