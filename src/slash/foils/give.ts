import { SlashCommand } from '../../core/slashes';

export default SlashCommand('economy.give', `
  $let[user;$findUser[$option[user];true]]
  $let[amount;$round[$option[amount]]]
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

  $let[first;$js[Array.of(ctx.getKeyword('user'), ctx.getKeyword('authorID')).sort().at(0)]]
  $let[second;$js[Array.of(ctx.getKeyword('user'), ctx.getKeyword('authorID')).sort().at(1)]]
  $let[lockOne;$mutex[acquire;user:$get[first]]]
  $let[lockTwo;$mutex[acquire;user:$get[second]]]
  $let[balance;$getUserVar[balance;$authorID]]
  $if[$get[balance]<$get[amount];
    $!mutex[release;user:$get[first];$get[lockOne]]
    $!mutex[release;user:$get[second];$get[lockTwo]]
    $err[low_bal;true]
    $stop
  ]

  $setUserVar[balance;$sub[$get[balance];$get[amount]];$authorID]
  $setUserVar[balance;$sum[$getUserVar[balance;$get[user]];$get[amount]];$get[user]]
  $!mutex[release;user:$get[first];$get[lockOne]]
  $!mutex[release;user:$get[second];$get[lockTwo]]

  $interactionReply[
    $ephemeral
    Given **$separateNumber[$get[amount]]** $jsonVar[keywords;currency.plural] to **$userDisplayName[$get[user]]**
  ]
  `
);
