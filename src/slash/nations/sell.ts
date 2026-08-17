import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { ctbl } from '../../config/collectible';
import { currency } from '../../config/currency';
export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `sell`,
    description: `Sell a ${ctbl.singular} for ${currency.plural}`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: `${ctbl.singular}`,
        description: `The ${ctbl.singular} to sell.`,
        required: true,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[id;$option[${ctbl.singular}]]
  $jsonLoad[nations;$getUserData[$authorID;collectibleIds]]

  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[invalid_collectible;true]
  ]

  $let[colId;$collectible[$get[id];id]]
  $let[price;$collectibleInfo[$get[colId];price]]
  
  $interactionReply[
    $ephemeral
    Are you sure you want to sell ×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectible[$get[id];emoji_id]] **$collectibleInfo[$get[colId];name]** for **$collectibleInfo[$get[colId];sell_price] $default[$appEmoji[${currency.plural}];${currency.plural}]**?
-# ⚠️ This action is irreversible. Once sold, you can't get your ${ctbl.singular} back!
    $addActionRow
    $addButton[collectible-sell-confirm-$get[id];Sell;Success]
    $addButton[collectible-sell-cancel-$get[id];Cancel;Danger]
  ]
  `
});