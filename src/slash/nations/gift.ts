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
        description: 'The user you want to send a gift to',
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
  $jsonLoad[nations;$getUserData[$authorID;collectibleIds]]
  
  $onlyIf[$get[user]!=$authorID;
    $err[gift_self;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_gift;true]
  ]
  $onlyIf[$userSettings[$get[user];accept_gifts];
    $err[decline_gifts;true]
  ]
  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[invalid_collectible;true]
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
