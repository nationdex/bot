import { slashCommand } from '../../config/slash';

export default slashCommand('rarity.info', `
  $let[colID;$option[$jsonVar[keywords;collectible.singular]]]
  $jsonLoad[sorted;$sortData[$collectiblesData[collectibles];rarity;desc]]
  $jsonLoad[ids;$jsonKeys[sorted]]
  $let[value;$collectibleInfo[$get[colID];weight]]
  $let[rarity;$collectibleInfo[$get[colID];rarity]]
  $let[totalRarity;$math[$collectiblesData[rarity;+]]]
  $let[chance;$cropText[$math[($get[rarity]/$get[totalRarity])*100];0;5]%]
  
  $onlyIf[$arrayIncludes[ids;$get[colID]];
    $err[invalid_collectible;true]
  ]
  
  $interactionReply[
    $addContainer[
      $addTextDisplay[## $appEmoji[$collectibleInfo[$get[colID];emoji_id]] $collectibleInfo[$get[colID];name]
-# Class: $appEmoji[$collectibleInfo[$get[colID];class]] **$collectibleInfo[$get[colID];class]**]
      $addSeparator
      $addTextDisplay[- Value: **$get[value]**
- Spawn Chance: \`$get[chance]\`
- Rarity Weight: \`$get[rarity]\`
- Rarity Rank: \`#$sum[$arrayIndexOf[ids;$get[colID]];1]\`]
    ;$jsonVar[config;accent]]
  ]
`);
