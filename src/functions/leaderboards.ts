import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'leaderboards',
  // Display the given type of leaderboard as a Components v2 message
  params: [
    {
      name: 'type',
      // The leaderboard type
      type: 'String',
      required: true
    },
    {
      name: 'page',
      // The page number to show
      type: 'String',
      required: false
    },
    {
      name: 'class',
      // The rarity class to view the leaderboard of
      type: 'String',
      required: false
    },
  ],
  code: `$let[type;$env[type]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[maxperpage;25]
  $let[stInd;$multi[$get[maxperpage];$max[$sub[$get[page];1];0]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  
  $ifx[
    $if[$get[type]==collectibles;
      $jsonLoad[db;$default[$searchDB[userCollectibles];[\\]]]
      $jsonLoad[data;{}]
      $arrayForEach[db;val;$!jsonSet[data;$env[val;id];$env[val;value]]]
      $jsonLoad[classes;$collectiblesData[classes]]
      $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class];total]]
      $jsonLoad[data;$sortData[$env[data];$get[class];desc]]
      $jsonLoad[userIDs;$jsonKeys[data]]
      $arrayForEach[userIDs;id;$if[$userExists[$env[id]]==false;$!jsonDelete[userIDs;$arrayIndexOf[userIDs;$env[id]]]]]
      $arraySlice[userIDs;leaderboard;$get[stInd];$get[endInd]]
      $arrayMap[leaderboard;uid;$return[$sum[$arrayIndexOf[userIDs;$env[uid]];1]. : [$username[$env[uid]]\\](https://discord.com/users/$env[uid]) - **$separateNumber[$env[data;$env[uid];$get[class]]]** $appEmoji[$get[class]]];display]
      $let[title;$toTitleCase[$replace[$get[class];total;] $jsonVar[keywords;collectible.plural] leaderboard]]
    ]

    $elseIf[$get[type]==value;
      $jsonLoad[db;$default[$searchDB[userCollectibles];[\\]]]
      $jsonLoad[data;{}]
      $arrayForEach[db;val;$!jsonSet[data;$env[val;id];$env[val;value]]]
      $jsonLoad[data;$sortData[$env[data];total_value;desc]]
      $jsonLoad[userIDs;$jsonKeys[data]]
      $arrayForEach[userIDs;id;$if[$userExists[$env[id]]==false;$!jsonDelete[userIDs;$arrayIndexOf[userIDs;$env[id]]]]]
      $arraySlice[userIDs;leaderboard;$get[stInd];$get[endInd]]
      $arrayMap[leaderboard;uid;$return[$sum[$arrayIndexOf[userIDs;$env[uid]];1]. : [$username[$env[uid]]\\](https://discord.com/users/$env[uid]) - **$separateNumber[$env[data;$env[uid];total_value]]**];display]
      $let[title;$toTitleCase[$jsonVar[keywords;collectible.plural] value leaderboard]]
    ]

    $elseIf[$get[type]==balance;
      $jsonLoad[db;$default[$searchDB[balance];[\\]]]
      $jsonLoad[data;{}]
      $arrayForEach[db;val;$!jsonSet[data;$env[val;id];$env[val;value]]]
      $jsonLoad[data;$sortData[$env[data];;desc]]
      $jsonLoad[userIDs;$jsonKeys[data]]
      $arrayForEach[userIDs;id;$if[$userExists[$env[id]]==false;$!jsonDelete[userIDs;$arrayIndexOf[userIDs;$env[id]]]]]
      $arraySlice[userIDs;leaderboard;$get[stInd];$get[endInd]]
      $arrayMap[leaderboard;uid;$return[$sum[$arrayIndexOf[userIDs;$env[uid]];1]. : [$username[$env[uid]]\\](https://discord.com/users/$env[uid]) - **$separateNumber[$env[data;$env[uid]]]** $appEmoji[$jsonVar[keywords;currency.plural]]];display]
      $let[title;$toTitleCase[$jsonVar[keywords;currency.plural] leaderboard]]
    ]
  ]
  
  $let[pages;$max[$ceil[$divide[$arrayLength[userIDs];$get[maxperpage]]];1]]
  $let[position;$if[$arrayIncludes[userIDs;$authorID];at #$sum[$arrayIndexOf[userIDs;$authorID];1];unranked]]

  $return[
    $addContainer[
      $addTextDisplay[### $get[title]]
      $addSeparator
      $addTextDisplay[$if[$arrayLength[display]>0;$arrayJoin[display;
];Nothing to see here...]]
      $addSeparator
      $addTextDisplay[-# You are $get[position] on the leaderboard]
    ;$jsonVar[config;accent]]
    $addActionRow
    $let[prevEmoji;$appEmoji[arrow_left]]
    $let[nextEmoji;$appEmoji[arrow_right]]
    $addButton[pages-lb-$authorID-$sub[$get[page];1]-$get[type]-$get[class];$if[$get[prevEmoji]==;Previous];Primary;$get[prevEmoji];$checkCondition[$get[page]<=1]]
    $addButton[pages-lb-$authorID-jump-$get[type]-$get[class];$get[page] / $get[pages];Secondary;;true]
    $addButton[pages-lb-$authorID-$sum[$get[page];1]-$get[type]-$get[class];$if[$get[nextEmoji]==;Next];Primary;$get[nextEmoji];$checkCondition[$get[page]>=$get[pages]]]
  ]
  `
});
