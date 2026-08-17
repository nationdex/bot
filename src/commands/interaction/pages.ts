import { BaseCommand } from '@tryforge/forgescript';
import { ctbl } from '../../config/collectible';

export default new BaseCommand({
  hide: true,
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==pages]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[not_author;true]
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
    $elseIf[$get[type]==collectibleInfo;
      $let[id;$arrayAt[cid;3]]
      $jsonLoad[userCollectibles;$getUserData[$authorID;collectibleIds]]
      $let[ind;$arrayIndexOf[userCollectibles;$get[id]]]
      $let[prev;$env[userCollectibles;$sub[$get[ind];1]]]
      $let[next;$env[userCollectibles;$sum[$get[ind];1]]]

      $interactionUpdate[Loading ${ctbl.singular} info...]

      $!editMessage[$channelID;$messageID;
        $collectibleCard[$get[id]]
        $addActionRow
        $addButton[pages-collectibleInfo-$authorID-$get[prev]-prev;;Secondary;$appEmoji[arrow_left];$if[$get[prev]==;true]]
        $addButton[pages-collectibleInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[userCollectibles];Primary;;true]
        $addButton[pages-collectibleInfo-$authorID-$get[next]-next;;Secondary;$appEmoji[arrow_right];$if[$get[next]==;true]]
      ]
    ]
    
    $elseIf[$get[type]==rarity;
      $let[type;$arrayAt[cid;4]]
      $let[class;$arrayAt[cid;5]]
      $let[sortType;$arrayAt[cid;6]]
      $interactionUpdate[$rarityList[$get[type];$get[class];$get[sortType];$get[page]]]
    ]

    $elseIf[$get[type]==lb;
      $let[type;$arrayAt[cid;4]]
      $let[class;$arrayAt[cid;5]]
      $interactionUpdate[
        $leaderboards[$get[type];$get[page];$get[class]]
      ]
    ]
  ]
  `,
});
