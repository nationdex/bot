import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionBidMessage',
  // Turns an $auctionBid JSON result into a user-facing message or an error key for $err.
  params: [
    {
      name: 'result',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[r;$default[$env[result];{}]]
  $let[s;$env[r;status]]
  $let[cur;$jsonVar[keywords;currency.plural]]
  $let[name;$collectibleInfo[$env[r;colID];name]]
  $ifx[
    $if[$get[s]==ok;
      $return[$appEmoji[check_mark] \`$fetchUsername[$authorID]\` bid **$separateNumber[$env[r;amount]] $get[cur]** on auction **#$env[r;aid]** (**$get[name]**). It ends <t:$floor[$divide[$env[r;ends];1000]]:R>.]
    ]
    $elseIf[$get[s]==buyout;
      $return[$appEmoji[check_mark] \`$fetchUsername[$authorID]\` bought **$get[name]** (\`#$env[r;nation]\`) instantly from auction **#$env[r;aid]** for **$separateNumber[$env[r;amount]] $get[cur]**!]
    ]
    $elseIf[$get[s]==busy;$return[auction_busy]]
    $elseIf[$or[$get[s]==not_found;$get[s]==ended];$return[auction_not_found]]
    $elseIf[$get[s]==own;$return[auction_own]]
    $elseIf[$get[s]==leading;$return[auction_leading]]
    $elseIf[$get[s]==too_low;$return[Your bid must be at least **$separateNumber[$env[r;min]] $get[cur]**.]]
    $elseIf[$get[s]==low_bal;$return[low_bal]]
  ]
  $return[generic]
  `,
});
