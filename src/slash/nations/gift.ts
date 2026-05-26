import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { config } from '../../config/config';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'gift',
    description: 'Gift a nation to another user.',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: 'The user whom you want to gift.',
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'nation',
        description: 'The nation you want to gift.',
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[user;$option[user]]
  $let[id;$option[nation]]
  $let[nation;$getNation[$get[id];nation]]
  $jsonLoad[nations;$getUserData[$authorID;nations]]
  
  $onlyIf[$get[user]!=$authorID;
    $err[You cannot send gifts to yourself.;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot accept gifts.;true]
  ]
  $onlyIf[$userSettings[$get[user];accept_gifts];
    $err[**$userDisplayName[$get[user]]** does not accept gifts.;true]
  ]
  $onlyIf[$arrayIncludes[blocked;$get[user]]==false;
    $err[You have blocked **$userDisplayName[$get[user]]**.;true]
  ]
  $onlyIf[$arrayIncludes[userBlocked;$authorID]==false;
    $err[Something went wrong.;true]
  ]
  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[Invalid nation!;true]
  ]
  
  $let[msg;$interactionReply[
    $addContainer[
      $addTextDisplay[Please confirm that you want to gift **$userDisplayName[$get[user]]** the following nation:
\`#$get[id]\` $getEvent[$getNation[$get[id];event];emoji]$appEmoji[$getNationInfo[$get[nation];emoji_id]] **$getNationInfo[$get[nation];name]**
-# ATK: $appEmoji[$getNation[$get[id];attack_type]] **$getNation[$get[id];attack]** / HP: $appEmoji[$getNation[$get[id];health_type]] **$getNation[$get[id];health]**]
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
