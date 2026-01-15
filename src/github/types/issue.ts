import { IGithubIssue } from '@stabilitydao/host/out/activity/builder';

export type Issues = { [repository: string]: FullIssue[] };

export type FullIssue = IGithubIssue & { repoId: number };
