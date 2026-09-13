import { SlashCommand } from '../../util/slashes';

export default SlashCommand('collectibles.sell', `
  $let[id;$replace[$option[$jsonVar[keywords;collectible.singular]];#;]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]

  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[invalid_collectible;true]
  ]

  $let[colID;$collectible[$get[id];id]]
  $let[price;$collectiblePrice[$get[id]]]
  
  $interactionReply[
    $ephemeral
    Are you sure you want to sell ×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]** for **$get[price] $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]]**?
-# ⚠️ This action is irreversible. Once sold, you can't get your $jsonVar[keywords;collectible.singular] back!
    $addActionRow
    $addButton[collectible-sell-confirm-$get[id];Sell;Success]
    $addButton[collectible-sell-cancel-$get[id];Cancel;Danger]
  ]
`);
