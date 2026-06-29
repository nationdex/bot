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
  $jsonLoad[blocked;$getUserVar[blockedUsers]]
  $jsonLoad[userBlocked;$getUserVar[blockedUsers;$get[user]]]

  $onlyIf[$get[user]!=$authorID;
    $err[You cannot give ${currency.plural} to yourself;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot aqcuire ${currency.plural};true]
  ]
  $onlyIf[$userSettings[$get[user];accept_gifts];
    $err[**$userDisplayName[$get[user]]** do not accept ${currency.plural};true]
  ]
  $onlyIf[$arrayIncludes[blocked;$get[user]]==false;
    $err[You have blocked **$userDisplayName[$get[user]]**;true]
  ]
  $onlyIf[$arrayIncludes[userBlocked;$authorID]==false;
    $err[Something went wrong;true]
  ]
  $onlyIf[$get[amount]>0;
    $err[Please put a minimum amount of **1**;true]
  ]
  $onlyIf[$get[balance]>=$get[amount];
    $err[You don't have enough ${currency.plural}!;true]
  ]

  $setUserVar[balance;$sub[$get[balance];$get[amount]];$authorID]
  $setUserVar[balance;$sum[$getUserVar[balance;$get[user]];$get[amount]];$get[user]]

  $interactionReply[
    $ephemeral
    Given **$separateNumber[$get[amount]]** $default[$appEmoji[${currency.plural}];${currency.plural}] to **$userDisplayName[$get[user]]**
  ]
  `
});