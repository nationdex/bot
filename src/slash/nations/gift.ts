import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('collectibles.gift', `
  $let[user;$option[user]]
  $let[id;$option[$jsonVar[keywords;collectible.singular]]]
  $let[colID;$collectible[$get[id];id]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]
  
  $onlyIf[$get[user]!=$authorID;
    $err[gift_self;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_gift;true]
  ]
  $onlyIf[$userSettings[$get[user];accept_gifts];
    $err[decline_gifts;true]
  ]
  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[invalid_collectible;true]
  ]
  
  $let[msg;$interactionReply[
    $addContainer[
      $addTextDisplay[Please confirm that you want to gift **$userDisplayName[$get[user]]** the following $jsonVar[keywords;collectible.singular]:
\`#$get[id]\` $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]**
-# ATK: **$collectible[$get[id];attack]** ($collectible[$get[id];attack_type]) / HP: **$collectible[$get[id];health]** ($collectible[$get[id];health_type])]
    ;$jsonVar[config;accent]]
    $addActionRow
    $addButton[gift-confirm-$authorID-$get[user]-$get[id];Confirm;Success]
    $addButton[gift-cancel-$authorID;Cancel;Danger]
  ;true]]
  
  $setTimeout[
    $onlyIf[$and[$channelExists[$channelID];$messageExists[$channelID;$get[msg]]]]
    $disableComponentsOf[$channelID;$get[msg]]
  ;1m]
`);
