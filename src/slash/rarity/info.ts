import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'info',
    description: `View the rarity info of a ${variables.keywords.collectible.singular}`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: `${variables.keywords.collectible.singular}`,
        description: `The ${variables.keywords.collectible.singular} whose rarity info to view.`,
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[colId;$option[$jsonVar[keywords;collectible.singular]]]
  $jsonLoad[sorted;$sortData[$collectiblesData[collectibles];rarity;desc]]
  $jsonLoad[ids;$jsonKeys[sorted]]
  $let[value;$collectibleInfo[$get[colId];weight]]
  $let[rarity;$collectibleInfo[$get[colId];rarity]]
  $let[totalRarity;$math[$collectiblesData[rarity;+]]]
  $let[chance;$cropText[$math[($get[rarity]/$get[totalRarity])*100];0;5]%]
  
  $onlyIf[$arrayIncludes[ids;$get[colId]];
    $err[invalid_collectible;true]
  ]
  
  $interactionReply[
    $addContainer[
      $addTextDisplay[## $appEmoji[$collectibleInfo[$get[colId];emoji_id]] $collectibleInfo[$get[colId];name]
-# Class: $appEmoji[$collectibleInfo[$get[colId];class]] **$collectibleInfo[$get[colId];class]**]
      $addSeparator
      $addTextDisplay[- Value: **$get[value]**
- Spawn Chance: \`$get[chance]\`
- Rarity Weight: \`$get[rarity]\`
- Rarity Rank: \`#$sum[$arrayIndexOf[ids;$get[colId]];1]\`]
    ;$jsonVar[config;accent]]
  ]
  `,
});
