import { SlashCommand } from '../../core/slashes';

export default SlashCommand('economy.give', `
  $let[user;$findUser[$option[user];true]]
  $let[amount;$round[$option[amount]]]
  $let[balance;$getUserVar[balance]]

  $onlyIf[$get[user]!=$authorID;
    $err[give_self;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_earn;true]
  ]
  $onlyIf[$userSettings[$get[user];accept_gifts];
    $err[decline_currency;true]
  ]
  $onlyIf[$get[amount]>0;
    $err[min_amount;true]
  ]
  $onlyIf[$get[balance]>=$get[amount];
    $err[low_bal;true]
  ]

  $setUserVar[balance;$sub[$get[balance];$get[amount]];$authorID]
  $setUserVar[balance;$sum[$getUserVar[balance;$get[user]];$get[amount]];$get[user]]

  $interactionReply[
    $ephemeral
    Given **$separateNumber[$get[amount]]** $jsonVar[keywords;currency.plural] to **$userDisplayName[$get[user]]**
  ]
  `
);
