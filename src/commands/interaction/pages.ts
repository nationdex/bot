import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  hide: true,
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==pages]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[You cannot use this!;true]
  ]
  
  $let[type;$arrayAt[cid;1]]
  $let[page;$arrayAt[cid;3]]
  
  $ifx[
    $if[$get[type]==progress;
      $let[class;$arrayAt[cid;5]]
      $let[user;$arrayAt[cid;4]]
      $interactionUpdate[
        $progressMenu[$get[user];$get[class];$get[page]]
      ]
    ]
    $elseIf[$get[type]==blocklist;
      $let[user;$arrayAt[cid;4]]
      $interactionUpdate[
        $blocklist[$get[user];$get[page]]
      ]
    ]
    $elseIf[$get[type]==nationInfo;
      $let[id;$arrayAt[cid;3]]
      $let[user;$arrayAt[cid;4]]
      $jsonLoad[nations;$getUserData[$get[user];nations]]
      $let[ind;$arrayIndexOf[nations;$get[id]]]
      $let[prev;$env[nations;$sub[$get[ind];1]]]
      $let[next;$env[nations;$sum[$get[ind];1]]]
      
      $interactionUpdate[
Viewing nations info cards of $userDisplayName[$get[user]]
$nationCard[$get[id]]
        $addActionRow
        $addButton[pages-nationInfo-$authorID-$get[prev]-$get[user]-prev;;Secondary;$appEmoji[arrow_left];$if[$get[prev]==;true]]
        $addButton[pages-nationInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[nations];Secondary;;true]
        $addButton[pages-nationInfo-$authorID-$get[next]-$get[user]-next;;Secondary;$appEmoji[arrow_right];$if[$get[next]==;true]]
      ]
    ]
  ]
  `,
});
