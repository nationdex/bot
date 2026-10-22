import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'editBalance',
  // edit a user's balance
  params: [
    {
      name: 'user',
      // The user to to edit the balance of
      type: 'String',
      required: true
    },
    {
      name: 'method',
      // The method to use (add/remove/set)
      type: 'String',
      required: true,
    },
    {
      name: 'amount',
      // The amount to edit
      type: 'String',
      required: true
    }
  ],
  code: `
  $let[user;$findUser[$env[user]]]
  $let[method;$env[method]]
  $let[amount;$env[amount]]
  $let[curBalance;$getUserVar[balance;$get[user]]]

  $ifx[
    $if[$get[method]==add;
      $setUserVar[balance;$sum[$get[curBalance];$get[amount]];$get[user]]
    ]
    $elseIf[$get[method]==remove;
      $setUserVar[balance;$sub[$get[curBalance];$get[amount]];$get[user]]
    ]
    $elseIf[$get[method]==set;
      $setUserVar[balance;$get[amount];$get[user]]
    ]
  ]
  `
});
