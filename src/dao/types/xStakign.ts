export type XStakingNotifyRewardEntity = {
  timestamp: string;
  amount: string;
  token?: string;
};

export type RevenueChartV2 = Record<number, Record<string, number>>;

export type Epoch = {
  id: number;
  tokens: `0x${string}`[];
  periodFinish: number;
};
