import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `balance`,
    description: `View your or another player's ${variables.keywords.currency.plural} balance`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: `user`,
        description: `The user to view the balance of`,
        required: false,
      },
    ],
  },
  code: `
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
});
