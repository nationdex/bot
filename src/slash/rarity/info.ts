import { config } from '../../config/config';
import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';


export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'info',
    description: 'View rarity info of your nation',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'nation',
        description: 'The nation whose rarity info to view',
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[nation;$option[nation]]
  $jsonLoad[sorted;$sortData[$getNationsData[nations];rarity;desc]]
  $jsonLoad[ids;$jsonKeys[sorted]]
  $let[value;$getNationInfo[$get[nation];weight]]
  $let[rarity;$getNationInfo[$get[nation];rarity]]
  $let[totalRarity;$math[$getNationsData[rarity;+]]]
  $let[chance;$cropText[$math[($get[rarity]/$get[totalRarity])*100];0;5]%]
  
  $onlyIf[$arrayIncludes[ids;$get[nation]];
    $err[Invalid nation!;true]
  ]
  
  $interactionReply[
    $addContainer[
      $addTextDisplay[## $appEmoji[$getNationInfo[$get[nation];emoji_id]] $getNationInfo[$get[nation];name]
-# Class: $appEmoji[$getNationInfo[$get[nation];class]] **$getNationInfo[$get[nation];class]**]
      $addSeparator
      $addTextDisplay[- Value: **$get[value]**
- Spawn Chance: \`$get[chance]\`
- Rarity Weight: \`$get[rarity]\`
- Rarity Rank: \`#$sum[$arrayIndexOf[ids;$get[nation]];1]\`]
    ;${config.color}]
  ]
  `,
});