import { slashCommand } from '../../config/slash';

export default slashCommand('economy.balance', `
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
    $if[$get[user]==$authorID;You have **$get[balance]** $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]] in your wallet;**$userDisplayName[$get[user]]** has **$get[balance]** $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]] in their wallet]
  ]
  `,
);
