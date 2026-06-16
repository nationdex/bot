<<<<<<< HEAD
import { config } from '../../config/config';
import { ctbl } from '../../config/collectible';
=======
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
<<<<<<< HEAD
import collectibles from './collectibles';
=======
import { config } from '../../config/config';
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'info',
<<<<<<< HEAD
    description: `View rarity info of a ${ctbl.singular}`,
=======
    description: 'View rarity info of a nation.',
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: `${ctbl.singular}`,
        description: `The ${ctbl.singular} whose rarity info to view.`,
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[colId;$option[${ctbl.singular}]]
  $jsonLoad[sorted;$sortData[$collectiblesData[collectibles];rarity;desc]]
  $jsonLoad[ids;$jsonKeys[sorted]]
  $let[value;$collectibleInfo[$get[colId];weight]]
  $let[rarity;$collectibleInfo[$get[colId];rarity]]
  $let[totalRarity;$math[$collectiblesData[rarity;+]]]
  $let[chance;$cropText[$math[($get[rarity]/$get[totalRarity])*100];0;5]%]
  
  $onlyIf[$arrayIncludes[ids;$get[colId]];
    $err[Invalid ${ctbl.singular}!;true]
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
    ;${config.color}]
  ]
  `,
});
