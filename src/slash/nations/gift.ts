import { slashCommand } from '../../config/slash';

export default slashCommand('collectibles.gift', `
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
-# ATK: $appEmoji[$collectible[$get[id];attack_type]] **$collectible[$get[id];attack]** / HP: $appEmoji[$collectible[$get[id];health_type]] **$collectible[$get[id];health]**]
    ;$jsonVar[config;accent]]
    $addActionRow
    $addButton[gift-confirm-$authorID-$get[user]-$get[id];Confirm;Success;$appEmoji[check_mark]]
    $addButton[gift-cancel-$authorID;Cancel;Danger;$appEmoji[cross_mark]]
  ;true]]
  
  $setTimeout[
    $onlyIf[$and[$channelExists[$channelID];$messageExists[$channelID;$get[msg]]]]
    $deleteMessageVar[messageData;$get[msg]]
    $disableComponents
  ]
`);
