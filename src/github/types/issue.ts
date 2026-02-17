import { IGithubIssueV2 } from "@daohost/host";
import { IBuildersMemoryV3 } from "@daohost/host/out/api";


export type Issues = { [repository: string]: FullIssue[] };

export type FullIssue = IGithubIssueV2 & {
  repoId: number;
  assignee: IGithubIssueV2['assignees'][number];
};

export type Repos = {
  [daoSymbol: string]: IBuildersMemoryV3['string']['repos'];
};
