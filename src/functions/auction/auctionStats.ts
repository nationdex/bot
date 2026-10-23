import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionStats',
  // Updates a user's "auction" stats and "userStats" after an auction event (listed, sold, unsold, won).
  params: [
    {
      name: 'user',
      type: 'String',
      required: true,
    },
    {
      name: 'aid',
      type: 'String',
      required: true,
    },
    {
      name: 'event',
      type: 'String',
      required: true,
    },
    {
      name: 'amount',
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[user;$env[user]]
  $let[lock;$mutex[acquire;user:$get[user]]]
  $jsonLoad[stats;$getUserVar[auction;$get[user]]]
  $setUserVar[auction;$js[
    (() => {
      const raw = ctx.getEnvironmentKey('stats')
      const s = Object.assign({ total: 0, sold: 0, earnings: 0, onSale: new Array() }, raw && typeof raw === 'object' ? raw : {})
      if (!Array.isArray(s.onSale)) s.onSale = new Array()
      const ev = String(ctx.getEnvironmentKey('event'))
      const aid = String(ctx.getEnvironmentKey('aid'))
      const amt = Number(ctx.getEnvironmentKey('amount')) || 0
      s.onSale = s.onSale.map(String).filter((x) => x !== aid)
      if (ev === 'listed') {
        s.total = (Number(s.total) || 0) + 1
        s.onSale.push(aid)
      }
      if (ev === 'sold') {
        s.sold = (Number(s.sold) || 0) + 1
        s.earnings = (Number(s.earnings) || 0) + amt
      }
      return JSON.stringify(s)
    })()
  ];$get[user]]

  $if[$or[$env[event]==sold;$env[event]==won];
    $jsonLoad[us;$getUserVar[userStats;$get[user]]]
    $!jsonSet[us;trades_completed;$sum[$default[$env[us;trades_completed];0];1]]
    $setUserVar[userStats;$env[us];$get[user]]
  ]
  $!mutex[release;user:$get[user];$get[lock]]
  `,
});
