export const auctionConfig = {
  feePercent: 5,
  minIncrementPercent: 5,
  maxActivePerUser: 5,
  antiSnipeMs: 120_000,
  pageSize: 8,
  sweepInterval: '1m',
  durations: [
    { name: '10 minutes', value: 10 },
    { name: '1 hour', value: 60 },
    { name: '6 hours', value: 360 },
    { name: '12 hours', value: 720 },
    { name: '1 day', value: 1440 },
    { name: '2 days', value: 2880 },
  ],
};
