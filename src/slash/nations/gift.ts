import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { ctbl } from '../../config/collectible';
import { config } from '../../config/config';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'gift',
    description: `Gift a ${ctbl.singular} to another user`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: 'The user whom you want to gift',
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: `${ctbl.singular}`,
        description: `The ${ctbl.singular} you want to gift`,
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[user;$option[user]]
  $let[id;$option[${ctbl.singular}]]
  $let[colId;$collectible[$get[id];id]]
  $jsonLoad[blocked;$getUserVar[blockedUsers]]
  $jsonLoad[userBlocked;$getUserVar[blockedUsers;$get[user]]]
  $jsonLoad[nations;$getUserData[$authorID;collectibleIds]]
  
  $onlyIf[$get[user]!=$authorID;
    $err[You cannot send gifts to yourself;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot accept gifts;true]
  ]
  $onlyIf[$userSettings[$get[user];accept_gifts];
    $err[**$userDisplayName[$get[user]]** do not accept gifts;true]
  ]
  $onlyIf[$arrayIncludes[blocked;$get[user]]==false;
    $err[You have blocked **$userDisplayName[$get[user]]**;true]
  ]
  $onlyIf[$arrayIncludes[userBlocked;$authorID]==false;
    $err[Something went wrong;true]
  ]
  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[Invalid ${ctbl.singular}!;true]
  ]
  
  $let[msg;$interactionReply[
    $addContainer[
      $addTextDisplay[Please confirm that you want to gift **$userDisplayName[$get[user]]** the following ${ctbl.singular}:
\`#$get[id]\` $getSpecial[$collectible[$get[id];event];emoji]$appEmoji[$collectibleInfo[$get[colId];emoji_id]] **$collectibleInfo[$get[colId];name]**
-# ATK: $appEmoji[$collectible[$get[id];attack_type]] **$collectible[$get[id];attack]** / HP: $appEmoji[$collectible[$get[id];health_type]] **$collectible[$get[id];health]**]
    ;${config.color}]
    $addActionRow
    $addButton[gift-confirm-$authorID-$get[user]-$get[id];Confirm;Success;$appEmoji[check_mark]]
    $addButton[gift-cancel-$authorID;Cancel;Danger;$appEmoji[cross_mark]]
  ;true]]
  
  $setTimeout[
    $onlyIf[$and[$channelExists[$channelID];$messageExists[$channelID;$get[msg]]]]
    $deleteMessageVar[messageData;$get[msg]]
    $disableComponents
  ]
  `,
});
