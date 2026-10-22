import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionNotify',
  // DMs the seller and bidder about an auction settlement summary returned by $auctionClose.
  params: [
    {
      name: 'result',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[r;$default[$env[result];{}]]
  $if[$env[r;outcome]==;$return]
  $let[name;$collectibleInfo[$env[r;colID];name]]
  $let[cur;$jsonVar[keywords;currency.plural]]
  $let[col;$jsonVar[keywords;collectible.singular]]

  $ifx[
    $if[$env[r;outcome]==sold;
      $sendDM[$env[r;seller];Your auction **#$env[r;id]** for **$get[name]** sold to \`$fetchUsername[$env[r;bidder]]\` for **$separateNumber[$env[r;bid]] $get[cur]**. You received **$separateNumber[$env[r;net]] $get[cur]** after a **$separateNumber[$env[r;fee]] $get[cur]** auction fee.]
      $sendDM[$env[r;bidder];You won auction **#$env[r;id]**! **$get[name]** (\`#$env[r;nation]\`) was added to your $jsonVar[keywords;collectible.plural] for **$separateNumber[$env[r;bid]] $get[cur]**.]
    ]
    $elseIf[$env[r;reason]==expired;
      $sendDM[$env[r;seller];Your auction **#$env[r;id]** for **$get[name]** ended with no bids. The $get[col] was returned to your inventory.]
    ]
    $elseIf[$env[r;reason]==admin;
      $sendDM[$env[r;seller];Your auction **#$env[r;id]** for **$get[name]** was cancelled by a bot administrator. The $get[col] was returned to your inventory.]
      $if[$env[r;bidder]!=;
        $sendDM[$env[r;bidder];Auction **#$env[r;id]** for **$get[name]** was cancelled by a bot administrator. Your bid of **$separateNumber[$env[r;bid]] $get[cur]** was refunded.]
      ]
    ]
  ]
  `,
});
