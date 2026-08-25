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
    name: `sell`,
    description: `Sell a ${variables.keywords.collectible.singular} for ${variables.keywords.currency.plural}`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: `${variables.keywords.collectible.singular}`,
        description: `The ${variables.keywords.collectible.singular} to sell.`,
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[id;$option[$jsonVar[keywords;collectible.singular]]]
  $jsonLoad[nations;$getUserData[$authorID;collectibleIds]]

  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[invalid_collectible;true]
  ]

  $let[colId;$collectible[$get[id];id]]
  $let[price;$collectibleInfo[$get[colId];price]]
  
  $interactionReply[
    $ephemeral
    Are you sure you want to sell ×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectible[$get[id];emoji_id]] **$collectibleInfo[$get[colId];name]** for **$collectibleInfo[$get[colId];sell_price] $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]]**?
-# ⚠️ This action is irreversible. Once sold, you can't get your $jsonVar[keywords;collectible.singular] back!
    $addActionRow
    $addButton[collectible-sell-confirm-$get[id];Sell;Success]
    $addButton[collectible-sell-cancel-$get[id];Cancel;Danger]
  ]
  `
});