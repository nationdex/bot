import { command } from '../../util/commands';

export default command('interaction.pages', `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==pages]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[not_author;true]
  ]

  $let[type;$arrayAt[cid;1]]
  $let[page;$arrayAt[cid;3]]
  
  $ifx[
    $if[$get[type]==collectibles;
      $let[user;$arrayAt[cid;4]]
      $let[class;$arrayAt[cid;5]]
      $deferUpdate
      $!editMessage[$channelID;$messageID;
        $progressMenu[$get[user];$get[class];$get[page]]
      ]
    ]
    $elseIf[$get[type]==progress;
      $let[user;$arrayAt[cid;4]]
      $let[arg5;$arrayAt[cid;5]]
      $deferUpdate
      $if[$isValidClass[$get[arg5]];
        $!editMessage[$channelID;$messageID;
          $progressMenu[$get[user];$get[arg5];$get[page]]
        ]
      ;
        $!editMessage[$channelID;$messageID;
          $progressMenu[$get[user];;$get[page];$get[arg5]]
        ]
      ]
    ]
    $elseIf[$get[type]==collectibleInfo;
      $let[id;$arrayAt[cid;3]]
      $jsonLoad[userCollectibles;$getUserData[$authorID;collectibleIDs]]
      $let[ind;$arrayIndexOf[userCollectibles;$get[id]]]
      $let[prev;$env[userCollectibles;$sub[$get[ind];1]]]
      $let[next;$env[userCollectibles;$sum[$get[ind];1]]]

      $let[prevEmoji;$appEmoji[arrow_left]]
      $let[nextEmoji;$appEmoji[arrow_right]]

      $interactionUpdate[Loading $jsonVar[keywords;collectible.singular] info...]

      $!editMessage[$channelID;$messageID;
        $collectibleCard[$get[id]]
        $addActionRow
        $addButton[pages-collectibleInfo-$authorID-$get[prev]-prev;$if[$get[prevEmoji]==;Previous];Secondary;$get[prevEmoji];$if[$get[prev]==;true]]
        $addButton[pages-collectibleInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[userCollectibles];Primary;;true]
        $addButton[pages-collectibleInfo-$authorID-$get[next]-next;$if[$get[nextEmoji]==;Next];Secondary;$get[nextEmoji];$if[$get[next]==;true]]
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
`);
