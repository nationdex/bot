import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionBidNotify',
  // Sends the DMs that follow a successful bid: outbid refund notice and buyout settlement.
  params: [
    {
      name: 'result',
      type: 'String',
      required: true,
    },
    {
      name: 'user',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[r;$default[$env[result];{}]]
  $let[s;$env[r;status]]
  $if[$or[$get[s]==ok;$get[s]==buyout]==false;$return]
  $let[prev;$env[r;previous]]
  $if[$and[$get[prev]!=;$get[prev]!=$env[user]];
    $sendDM[$get[prev];You were outbid on auction **#$env[r;aid]** (**$collectibleInfo[$env[r;colID];name]**). Your **$separateNumber[$env[r;refund]] $jsonVar[keywords;currency.plural]** were refunded.$if[$get[s]==buyout; The auction was won via buyout.]]
  ]
  $if[$get[s]==buyout;$auctionNotify[$env[r;closed]]]
  `,
});
