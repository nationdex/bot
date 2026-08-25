import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==gift]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[not_author;true]
  ]
  
  $let[act;$arrayAt[cid;1]]
  
  $ifx[
    $if[$get[act]==confirm;
      $let[user;$arrayAt[cid;3]]
      $let[id;$arrayAt[cid;4]]
      $let[colId;$collectible[$get[id];id]]
      
      $transferUserCollectible[$get[user];$get[id]]
      
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[Gifted **×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectibleInfo[$get[colId];emoji_id]] $collectibleInfo[$get[colId];name]** to **$userDisplayName[$get[user]]**
-# ATK: $appEmoji[$collectible[$get[id];attack_type]] **$collectible[$get[id];attack]** / HP: $appEmoji[$collectible[$get[id];health_type]] **$collectible[$get[id];health]**]
        ;#00FF00]
      ]
    ]
    $elseIf[$get[act]==cancel;
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[$randomText[Aw, why couldn't you give the poor child a $jsonVar[keywords;collectible.singular]? :(;Good choice! They didn't deserve it anyway;No way... You gave them hope and then rejected it?]]
        ;#FF0000]
      ]
    ]
  ]
  `,
});
