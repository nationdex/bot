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
      $let[user;$arrayAt[cid;4]]
      $let[class;$arrayAt[cid;5]]
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
      $jsonLoad[nations;$getUserData[$authorID;nations]]
      $let[ind;$arrayIndexOf[nations;$get[id]]]
      $let[prev;$env[nations;$sub[$get[ind];1]]]
      $let[next;$env[nations;$sum[$get[ind];1]]]
      
      $interactionUpdate[
        $nationCard[$get[id]]
        $addActionRow
        $addButton[pages-nationInfo-$authorID-$get[prev]-prev;;Secondary;$appEmoji[arrow_left];$if[$get[prev]==;true]]
        $addButton[pages-nationInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[nations];Primary;;true]
        $addButton[pages-nationInfo-$authorID-$get[next]-next;;Secondary;$appEmoji[arrow_right];$if[$get[next]==;true]]
      ]
    ]
    
    $elseIf[$get[type]==rarity;
      $let[type;$arrayAt[cid;4]]
      $let[class;$arrayAt[cid;5]]
      $let[sortType;$arrayAt[cid;6]]
      $interactionUpdate[$rarityList[$get[type];$get[class];$get[sortType];$get[page]]]
    ]
  ]
  `,
});
