import { BaseCommand } from '@tryforge/forgescript';
import { ctbl } from '../../../config/collectible';

export default new BaseCommand({
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==gift]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[You cannot use this!;true]
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
-# ATK: $appEmoji[$collectible[$get[id];attack_type]] **$collectible[$get[id];attack]** | HP: $appEmoji[$collectible[$get[id];health_type]] **$collectible[$get[id];health]**]
        ;#00FF00]
      ]
    ]
    $elseIf[$get[act]==cancel;
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[$randomText[Awhh why could you not give the poor child a ${ctbl.singular} :(;Good choice! They did'nt deserve it anyway;No way... You gave them a hope and then rejected it?]]
        ;#FF0000]
      ]
    ]
  ]
  `,
});
