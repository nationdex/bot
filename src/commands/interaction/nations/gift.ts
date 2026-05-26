import { BaseCommand } from '@tryforge/forgescript';

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
      $let[nation;$getNation[$get[id];nation]]
      
      $transferUserNation[$get[user];$get[id]]
      
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[Gifted **×1 $getSpecial[$getNation[$get[id];special];emoji]$appEmoji[$getNationInfo[$get[nation];emoji_id]] $getNationInfo[$get[nation];name]** to **$userDisplayName[$get[user]]**
-# ATK: $appEmoji[$getNation[$get[id];attack_type]] **$getNation[$get[id];attack]** | HP: $appEmoji[$getNation[$get[id];health_type]] **$getNation[$get[id];health]**]
        ;#00FF00]
      ]
    ]
    $elseIf[$get[act]==cancel;
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[$randomText[Awhh why could you not give the poor child a nation :(;Good choice! They did'nt deserve it anyway;No way... You gave them a hope and then rejected it?]]
        ;#FF0000]
      ]
    ]
  ]
  `
});