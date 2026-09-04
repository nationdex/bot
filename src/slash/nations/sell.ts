import { slashCommand } from '../../config/slash';

export default slashCommand('collectibles.sell', `
  $let[id;$option[$jsonVar[keywords;collectible.singular]]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]

  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[invalid_collectible;true]
  ]

  $let[colID;$collectible[$get[id];id]]
  $let[price;$collectibleInfo[$get[colID];price]]
  
  $interactionReply[
    $ephemeral
    Are you sure you want to sell ×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectible[$get[id];emoji_id]] **$collectibleInfo[$get[colID];name]** for **$collectibleInfo[$get[colID];sell_price] $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]]**?
-# ⚠️ This action is irreversible. Once sold, you can't get your $jsonVar[keywords;collectible.singular] back!
    $addActionRow
    $addButton[collectible-sell-confirm-$get[id];Sell;Success]
    $addButton[collectible-sell-cancel-$get[id];Cancel;Danger]
  ]
`);