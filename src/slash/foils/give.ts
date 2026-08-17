import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { currency } from '../../config/currency';
export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `give`,
    description: `Give your ${currency.plural} to another user`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: `user`,
        description: `The user to give your ${currency.plural} to`,
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: `amount`,
        description: `The amount of ${currency.plural} to give`,
        required: true,
      },
    ],
  },
  code: `
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
    Given **$separateNumber[$get[amount]]** $default[$appEmoji[${currency.plural}];${currency.plural}] to **$userDisplayName[$get[user]]**
  ]
  `
});