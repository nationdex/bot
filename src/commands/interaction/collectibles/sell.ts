import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$and[$arrayAt[cid;0]==collectible;$arrayAt[cid;1]==sell]]

  $let[act;$arrayAt[cid;2]]
  $let[id;$arrayAt[cid;3]]
  $let[colID;$collectible[$get[id];id]]
  $let[class;$collectibleInfo[$get[colID];class]]
  $let[price;$collectibleInfo[$get[colID];sell_price]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]

  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[no_collectibles_found;true]
  ]

  $ifx[
    $if[$get[act]==confirm;
      $jsonLoad[data;$getUserVar[userCollectibles;$authorID]]
      $jsonLoad[userCollectibles;$env[data;collectibleIDs]]
      $jsonLoad[uniques;$env[data;unique]]
      $!jsonDelete[userCollectibles;$arrayIndexOf[userCollectibles;$get[id]]]
      $!jsonSet[data;collectibleIDs;$env[userCollectibles]]
      $arrayMap[userCollectibles;nat;$return[$collectible[$env[nat];id]];nids]
      $if[$arrayIncludes[nids;$get[colID]]==false;
        $!jsonDelete[data;unique;$arrayIndexOf[uniques;$get[colID]]]
      ]
      $!jsonSet[data;total;$sub[$env[data;total];1]]
      $!jsonSet[data;$get[class];$sub[$env[data;$get[class]];1]]
      $!jsonSet[data;total_value;$max[$sub[$env[data;total_value];$collectibleInfo[$get[colID];weight]];0]]
      $setUserVar[userCollectibles;$env[data];$authorID]
  
      $editBalance[$authorID;add;$get[price]]
  
      $interactionUpdate[
        $appEmoji[check_mark] | Sold ×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectible[$get[id];emoji_id]] **$collectibleInfo[$get[colID];name]** for **$collectibleInfo[$get[colID];sell_price] $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]]**
      ]
    ]

    $elseIf[$get[act]==cancel;
      $interactionUpdate[
        $appEmoji[check_mark] | Cancelled the sale of ×1 $getSpecial[$collectible[$get[id];special];emoji]$appEmoji[$collectible[$get[id];emoji_id]] **$collectibleInfo[$get[colID];name]** for **$collectibleInfo[$get[colID];sell_price] $default[$appEmoji[$jsonVar[keywords;currency.plural]];$jsonVar[keywords;currency.plural]]**
      ]
    ]
  ]
  `
});