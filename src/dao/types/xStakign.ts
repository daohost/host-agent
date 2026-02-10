export type XStakingNotifyRewardEntity = {
  timestamp: string;
  amount: string;
  token?: string;
};

export type RevenueChartV2 = Record<number, { amount: string; token: string }>;
