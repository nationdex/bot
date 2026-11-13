import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('economy.balance', `
  $let[user;$findUser[$option[user];true]]
  $let[balance;$getUserVar[balance;$get[user]]]

  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_no_bal;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[inv_private;true]
    ]
  ]
  
  $interactionReply[
    $ephemeral
    $if[$get[user]==$authorID;You have **$get[balance]** $jsonVar[keywords;currency.plural] in your wallet;**$userDisplayName[$get[user]]** has **$get[balance]** $jsonVar[keywords;currency.plural] in their wallet]
  ]
  `,
);
