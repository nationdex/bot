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
  
  $jsonLoad[classes;$collectiblesData[classes]]
  $jsonLoad[ids;$collectibleIDs]
  $let[total;$collectiblesData[total]]
  $arrayForEach[classes;class;$let[$env[class];$collectiblesData[$env[class]]]]
  
  $jsonLoad[userCollectibles;$getUserData[$get[user];collectibleIDs]]
  $jsonLoad[userUniques;$collectibleIDs[$get[user]]]
  $let[userTotal;$getUserData[$get[user];total]]
  $arrayForEach[classes;class;$let[user$env[class];$collectibleIDs[$get[user];$env[class]]]]
      
  $ifx[
    $if[$isValidClass[$get[class]];
      $arrayMap[userCollectibles;unid;
        $if[$collectibleInfo[$collectible[$env[unid];collectible];class]==$get[class];$return[$env[unid]]]
      ;clids]
      $let[pages;$ceil[$divide[$max[$arrayLength[clids];1];$get[maxperpage]]]]
      $arraySlice[clids;colID;$get[stInd];$get[endInd]]
      $arrayMap[userUniques;uu;$if[$collectibleInfo[$env[uu];class]==$get[class];$return[$appEmoji[$collectibleInfo[$env[uu];emoji_id]]]];owned]
      $arrayMap[ids;id;$if[$and[$collectibleInfo[$env[id];class]==$get[class];$arrayIncludes[owned;$appEmoji[$collectibleInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];missing]
      
      $let[classTotal;$default[$get[$get[class]];0]]
      $let[owned;$arrayLength[owned]]
      $let[missing;$arrayLength[missing]]
      $let[progress;$if[$get[classTotal]>0;$cropText[$math[($get[owned]/$get[classTotal])*100];0;4];NaN]]
      
      $return[
        $addContainer[
          $addSection[
            $addTextDisplay[## $userDisplayName[$get[user]]'s $toTitleCase[$get[class]] Progress: $get[progress]%
Unique $toTitleCase[$get[class]] $jsonVar[keywords;collectible.plural]: **$get[owned] / $get[classTotal]**
Total $toTitleCase[$get[class]] $jsonVar[keywords;collectible.plural]: **$default[$get[user$get[class]];0]**]
            $addThumbnail[$userAvatar[$get[user]]]
          ]
          $addSeparator
          $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]]**$if[$get[classTotal]==0;
No $jsonVar[keywords;collectible.plural] in this class;$if[$get[owned]>0;
**Owned**: $arrayJoin[owned;  ]]$if[$get[missing]>0;
**Missing**: $arrayJoin[missing;  ]]
]]
          $addSeparator
          $addActionRow
        $if[$arrayLength[colID]>0;
          $addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info]
          $arrayForEach[colID;nat;
            $let[id;$env[nat]]
            $let[colID;$collectible[$get[id];id]]
            $addOption[$cropText[$getSpecial[$collectible[$get[id];special];emoji] $collectibleInfo[$get[colID];name];0;90;...];ATTACK: $collectible[$get[id];attack] | HEALTH: $collectible[$get[id];health];$env[nat];$appEmoji[$collectibleInfo[$get[colID];emoji_id]]]
          ]
          ;$addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info;true]
          $addOption[null;null;null]
        ]
        ;$jsonVar[config;accent]]
        $addActionRow
        $addButton[pages-progress-$authorID-$sub[$get[page];1]-$get[user]-$get[class];;Secondary;$appEmoji[arrow_left];$checkCondition[$get[page]==1]]
        $addButton[pages-progress-$authorID-index;$get[page] / $get[pages];Primary;;true]
        $addButton[pages-progress-$authorID-$sum[$get[page];1]-$get[user]-$get[class];;Secondary;$appEmoji[arrow_right];$checkCondition[$get[page]==$get[pages]]]
      ]
    ]
    
    $else[
      $if[$or[$get[total]<1;$get[total]==];
        $return[$err[No $jsonVar[keywords;collectible.plural] to collect;true]]
      ]
      
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
        $arrayForEach[classes;class;$let[class;$env[class]]
          $arrayMap[userUniques;uu;$if[$collectibleInfo[$env[uu];class]==$get[class];$return[$appEmoji[$collectibleInfo[$env[uu];emoji_id]]]];owned]
          $arrayMap[ids;id;$if[$and[$collectibleInfo[$env[id];class]==$get[class];$arrayIncludes[owned;$appEmoji[$collectibleInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];missing]
      
          $let[classTotal;$default[$get[$get[class]];0]]
          $let[owned;$arrayLength[owned]]
          $let[missing;$arrayLength[missing]]
          $addSeparator
          $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]] ($get[owned] / $get[classTotal])**$if[$get[classTotal]==0;
No $jsonVar[keywords;collectible.plural] in this class;$if[$get[owned]>0;
**Owned**: $arrayJoin[owned;  ]]$if[$get[missing]>0;
**Missing**: $arrayJoin[missing;  ]]
]]
          ]
        $arrayMap[userUniques;uu;$if[$or[$collectibleInfo[$env[uu];class]==;$collectibleInfo[$env[uu];class]==null;$arrayIncludes[classes;$collectibleInfo[$env[uu];class]]==false];$return[$appEmoji[$collectibleInfo[$env[uu];emoji_id]]]];noClassOwned]
        $arrayMap[ids;id;$if[$and[$or[$collectibleInfo[$env[id];class]==;$collectibleInfo[$env[id];class]==null;$arrayIncludes[classes;$collectibleInfo[$env[id];class]]==false];$arrayIncludes[noClassOwned;$appEmoji[$collectibleInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];noClassMissing]
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
            $addOption[$cropText[$getSpecial[$collectible[$get[id];special];emoji] $collectibleInfo[$get[colID];name];0;90;...];ATTACK: $collectible[$get[id];attack] | HEALTH: $collectible[$get[id];health];$env[nat];$appEmoji[$collectibleInfo[$get[colID];emoji_id]]]
          ]
          ;$addStringSelectMenu[collectibles-info-$authorID;Select a $jsonVar[keywords;collectible.singular] to view its info;true]
          $addOption[null;null;null]
        ]
        ;$jsonVar[config;accent]]
        $addActionRow
        $addButton[pages-progress-$authorID-$sub[$get[page];1]-$get[user];;Secondary;$appEmoji[arrow_left];$checkCondition[$get[page]==1]]
        $addButton[pages-progress-$authorID-index;$get[page] / $get[pages];Primary;;true]
        $addButton[pages-progress-$authorID-$sum[$get[page];1]-$get[user];;Secondary;$appEmoji[arrow_right];$checkCondition[$get[page]==$get[pages]]]
      ]
    ]
  ]
  
  $return
  `,
});
