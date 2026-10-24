import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionLock',
  // Auction mutex, a named lock on top of $mutex. acquire returns a token (empty when busy), release frees it.
  params: [
    {
      name: 'action',
      type: 'String',
      required: true,
    },
    {
      name: 'token',
      type: 'String',
      required: false,
    },
  ],
  code: `
  $if[$env[action]==release;
    $return[$mutex[release;auction;$env[token]]]
  ]
  $return[$mutex[acquire;auction]]
  `,
});
