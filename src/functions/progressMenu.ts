import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'progressMenu',
  // Shows the collectible progress of a user as a Components v2 message.
  params: [
    {
      name: 'user',
      // The user whose progress to check.
      type: 'String',
      required: false,
    },
    {
      name: 'class',
      // Progress of a specific rarity class.
      type: 'String',
      required: false,
    },
    {
      name: 'page',
      // The page number to show.
      type: 'String',
      required: false,
    },
  ],
  brackets: false,
  code: `
  $let[user;$findUser[$env[user];true]]
  $let[class;$if[$isValidClass[$env[class]];$env[class]]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[maxperpage;25]
  $let[stInd;$multi[$get[maxperpage];$max[$sub[$get[page];1];0]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  
  $jsonLoad[catalog;$getGlobalVar[collectiblesData]]
  $jsonLoad[classes;$env[catalog;classes]]
  $jsonLoad[ids;$collectibleIDs]
  $let[total;$env[catalog;total]]
  $arrayForEach[classes;class;$let[$env[class];$env[catalog;$env[class]]]]
  
  $jsonLoad[userCollectibles;$getUserData[$get[user];collectibleIDs]]
  $jsonLoad[userUniques;$collectibleIDs[$get[user]]]
  $let[userTotal;$getUserData[$get[user];total]]
  $arrayForEach[classes;class;$let[user$env[class];$collectibleIDs[$get[user];$env[class]]]]
      
  $ifx[
    $if[$isValidClass[$get[class]];
      $arrayMap[userCollectibles;unid;
        $if[$env[catalog;collectibles;$collectible[$env[unid];collectible];class]==$get[class];$return[$env[unid]]]
      ;clids]
      $let[pages;$ceil[$divide[$max[$arrayLength[clids];1];$get[maxperpage]]]]
      $arraySlice[clids;colID;$get[stInd];$get[endInd]]
      $arrayMap[userUniques;uu;$if[$env[catalog;collectibles;$env[uu];class]==$get[class];$return[$appEmoji[$env[catalog;collectibles;$env[uu];emoji_id]]]];owned]
      $arrayMap[ids;id;
        $if[$and[$env[catalog;collectibles;$env[id];class]==$get[class];$arrayIncludes[userUniques;$env[id]]==false];
          $return[$appEmoji[$env[catalog;collectibles;$env[id];emoji_id]]]
        ]
      ;missing]
      
      $let[classTotal;$default[$get[$get[class]];0]]
      $let[owned;$arrayLength[owned]]
      $let[missing;$arrayLength[missing]]
      $let[progress;$if[$get[classTotal]>0;$cropText[$math[($get[owned]/$get[classTotal])*100];0;4];NaN]]
      
      $if[$or[$get[classTotal]<1;$get[classTotal]==];
        $return[$err[no_collectibles_found;true]]
      ;
        $return[
          $addContainer[
            $addSection[
              $addTextDisplay[## $userDisplayName[$get[user]]'s $toTitleCase[$get[class]] Progress: $get[progress]%
Unique $toTitleCase[$get[class]] $jsonVar[keywords;collectible.plural]: **$get[owned] / $get[classTotal]**
Total $toTitleCase[$get[class]] $jsonVar[keywords;collectible.plural]: **$default[$get[user$get[class]];0]**]
              $addThumbnail[$userAvatar[$get[user]]]
            ]
            $addSeparator
            $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]]**$if[$get[owned]>0;
**Owned**: $arrayJoin[owned;  ]]$if[$get[missing]>0;
**Missing**: $arrayJoin[missing;  ]]
]
            $addSeparator
            $addActionRow
          $if[$arrayLength[colID]>0;
            $addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info]
            $arrayForEach[colID;nat;
              $let[id;$env[nat]]
              $let[colID;$collectible[$get[id];id]]
              $addOption[$cropText[$getSpecial[$collectible[$get[id];special];emoji] $env[catalog;collectibles;$get[colID];name];0;90;...];ATTACK: $collectible[$get[id];attack] | HEALTH: $collectible[$get[id];health];$env[nat];$appEmoji[$env[catalog;collectibles;$get[colID];emoji_id]]]
            ]
            ;$addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info;true]
            $addOption[null;null;null]
          ]
          ;$jsonVar[config;accent]]
          $addActionRow
          $let[prevEmoji;$appEmoji[arrow_left]]
          $let[nextEmoji;$appEmoji[arrow_right]]
          $addButton[pages-progress-$authorID-$sub[$get[page];1]-$get[user]-$get[class];$if[$get[prevEmoji]==;Previous];Secondary;$get[prevEmoji];$checkCondition[$get[page]==1]]
          $addButton[pages-progress-$authorID-index;$get[page] / $get[pages];Primary;;true]
          $addButton[pages-progress-$authorID-$sum[$get[page];1]-$get[user]-$get[class];$if[$get[nextEmoji]==;Next];Secondary;$get[nextEmoji];$checkCondition[$get[page]==$get[pages]]]
        ]
      ]
    ]
    
    $else[
      $if[$or[$get[total]<1;$get[total]==];
        $return[$err[no_collectibles_found;true]]
      ;
        $let[pages;$ceil[$divide[$max[$arrayLength[userCollectibles];1];$get[maxperpage]]]]
        $arraySlice[userCollectibles;colID;$get[stInd];$get[endInd]]
        $let[owned;$arrayLength[userUniques]]
        $let[progress;$if[$get[total]>0;$cropText[$math[($get[owned]/$get[total])*100];0;4];NaN]]

        $return[
          $addContainer[
            $addSection[
              $addTextDisplay[## $userDisplayName[$get[user]]'s $jsonVar[config;bot.name] Progress: $get[progress]%
Unique $jsonVar[keywords;collectible.plural]: **$get[owned] / $get[total]**
Total $jsonVar[keywords;collectible.plural] Owned: **$default[$getUserData[$get[user];total];0]**]
              $addThumbnail[$userAvatar[$get[user]]]
            ]
          $arrayForEach[classes;c;
            $arrayCreate[classOwned$env[c]]
            $arrayCreate[classMissing$env[c]]
          ]
          $arrayCreate[noClassOwned]
          $arrayCreate[noClassMissing]

          $arrayForEach[userUniques;uu;
            $let[uuClass;$env[catalog;collectibles;$env[uu];class]]
            $let[uuEmoji;$appEmoji[$env[catalog;collectibles;$env[uu];emoji_id]]]
            $if[$arrayIncludes[classes;$get[uuClass]];
              $arrayPush[classOwned$get[uuClass];$get[uuEmoji]]
            ;
              $arrayPush[noClassOwned;$get[uuEmoji]]
            ]
          ]

          $arrayForEach[ids;id;
            $if[$arrayIncludes[userUniques;$env[id]]==false;
              $let[idClass;$env[catalog;collectibles;$env[id];class]]
              $let[idEmoji;$appEmoji[$env[catalog;collectibles;$env[id];emoji_id]]]
              $if[$arrayIncludes[classes;$get[idClass]];
                $arrayPush[classMissing$get[idClass];$get[idEmoji]]
              ;
                $arrayPush[noClassMissing;$get[idEmoji]]
              ]
            ]
          ]

          $arrayForEach[classes;class;$let[class;$env[class]]
            $let[classTotal;$default[$get[$get[class]];0]]
            $let[ownedCount;$arrayLength[classOwned$get[class]]]
            $let[missingCount;$arrayLength[classMissing$get[class]]]
            $addSeparator
            $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]] ($get[ownedCount] / $get[classTotal])**$if[$get[classTotal]==0;
No $jsonVar[keywords;collectible.plural] in this class;$if[$get[ownedCount]>0;
**Owned**: $arrayJoin[classOwned$get[class];  ]]$if[$get[missingCount]>0;
**Missing**: $arrayJoin[classMissing$get[class];  ]]
]]
            ]
          $let[noClassOwnedCount;$arrayLength[noClassOwned]]
          $let[noClassMissingCount;$arrayLength[noClassMissing]]
          $let[noClassTotal;$sum[$get[noClassOwnedCount];$get[noClassMissingCount]]]
          $if[$get[noClassTotal]>0;
            $addSeparator
            $addTextDisplay[**Unclassified $jsonVar[keywords;collectible.plural] ($get[noClassOwnedCount] / $get[noClassTotal])**$if[$get[noClassOwnedCount]>0;
**Owned**: $arrayJoin[noClassOwned;  ]]$if[$get[noClassMissingCount]>0;
**Missing**: $arrayJoin[noClassMissing;  ]]
]
          ]
            $addSeparator
            $addActionRow
          $if[$arrayLength[colID]>0;
            $addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info]
            $arrayForEach[colID;nat;
              $let[id;$env[nat]]
              $let[colID;$collectible[$get[id];id]]
              $addOption[$cropText[$getSpecial[$collectible[$get[id];special];emoji] $env[catalog;collectibles;$get[colID];name];0;90;...];ATTACK: $collectible[$get[id];attack] | HEALTH: $collectible[$get[id];health];$env[nat];$appEmoji[$env[catalog;collectibles;$get[colID];emoji_id]]]
            ]
            ;$addStringSelectMenu[collectibles-info-$authorID;Select a $jsonVar[keywords;collectible.singular] to view its info;true]
            $addOption[null;null;null]
          ]
          ;$jsonVar[config;accent]]
          $addActionRow
          $let[prevEmoji;$appEmoji[arrow_left]]
          $let[nextEmoji;$appEmoji[arrow_right]]
          $addButton[pages-progress-$authorID-$sub[$get[page];1]-$get[user];$if[$get[prevEmoji]==;Previous];Secondary;$get[prevEmoji];$checkCondition[$get[page]==1]]
          $addButton[pages-progress-$authorID-index;$get[page] / $get[pages];Primary;;true]
          $addButton[pages-progress-$authorID-$sum[$get[page];1]-$get[user];$if[$get[nextEmoji]==;Next];Secondary;$get[nextEmoji];$checkCondition[$get[page]==$get[pages]]]
        ]
      ]
    ]
  ]
  
  $return
  `,
});
