import { command } from '../../../core/commands';

export default command('interaction.collectibles.sell', `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$and[$arrayAt[cid;0]==collectible;$arrayAt[cid;1]==sell]]

  $let[act;$arrayAt[cid;2]]
  $let[id;$arrayAt[cid;3]]
  $let[colID;$collectible[$get[id];id]]
  $let[class;$collectibleInfo[$get[colID];class]]
  $let[price;$collectiblePrice[$get[id]]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]

  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[no_collectibles_found;true]
  ]

  $ifx[
    $if[$get[act]==confirm;
      $let[invLock;$mutex[acquire;inv:$authorID]]
      $jsonLoad[data;$getUserVar[userCollectibles;$authorID]]
      $jsonLoad[userCollectibles;$env[data;collectibleIDs]]
      $jsonLoad[uniques;$env[data;unique]]
      $if[$arrayIncludes[userCollectibles;$get[id]]==false;
        $!mutex[release;inv:$authorID;$get[invLock]]
        $err[no_collectibles_found;true]
        $stop
      ]
      $!jsonDelete[userCollectibles;$arrayIndexOf[userCollectibles;$get[id]]]
      $!jsonSet[data;collectibleIDs;$env[userCollectibles]]
      $arrayMap[userCollectibles;nat;$return[$collectible[$env[nat];id]];nids]
      $if[$arrayIndexOf[nids;$get[colID]]==-1;
        $!jsonDelete[data;unique;$arrayIndexOf[uniques;$get[colID]]]
      ]
      $!jsonSet[data;total;$sub[$env[data;total];1]]
      $!jsonSet[data;$get[class];$sub[$env[data;$get[class]];1]]
      $!jsonSet[data;total_value;$max[$sub[$env[data;total_value];$collectibleInfo[$get[colID];weight]];0]]
      $setUserVar[userCollectibles;$env[data];$authorID]
      $!mutex[release;inv:$authorID;$get[invLock]]
  
      $editBalance[$authorID;add;$get[price]]
  
      $interactionUpdate[
        Sold A-1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]** for **$get[price] $jsonVar[keywords;currency.plural]**
      ]
    ]

    $elseIf[$get[act]==cancel;
      $interactionUpdate[
        Cancelled the sale of A-1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]** for **$get[price] $jsonVar[keywords;currency.plural]**
      ]
    ]
  ]
`);
