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
    {
      name: 'listPage',
      // The page number for the nation-listing select menu (overview mode only).
      type: 'String',
      required: false,
    },
  ],
  brackets: false,
  code: `
  $let[user;$findUser[$env[user];true]]
  $let[class;$if[$isValidClass[$env[class]];$env[class]]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[listPage;$if[$and[$isNumber[$env[listPage]];$env[listPage]>0];$env[listPage];1]]
  $let[maxperpage;25]
  $let[stInd;$multi[$get[maxperpage];$max[$sub[$get[page];1];0]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  $let[listStInd;$multi[$get[maxperpage];$max[$sub[$get[listPage];1];0]]]
  $let[listEndInd;$multi[$get[maxperpage];$get[listPage]]]

  $jsonLoad[catalog;$getGlobalVar[collectiblesData]]
  $jsonLoad[classes;$env[catalog;classes]]
  $jsonLoad[ids;$collectibleIDs]
  $let[total;$env[catalog;total]]
  $arrayForEach[classes;class;$let[$env[class];$env[catalog;$env[class]]]]

  $jsonLoad[userCollectibles;$getUserData[$get[user];collectibleIDs]]
  $jsonLoad[userUniques;$collectibleIDs[$get[user]]]
  $let[userTotal;$getUserData[$get[user];total]]
  $arrayForEach[classes;class;$let[user$env[class];$default[$getUserData[$get[user];$env[class]];0]]]

  $ifx[
    $if[$isValidClass[$get[class]];
      $jsonLoad[clids;$classCatchIDs[$jsonStringify[userCollectibles];$jsonStringify[catalog];$get[class]]]
      $let[pages;$ceil[$divide[$max[$arrayLength[clids];1];$get[maxperpage]]]]
      $let[page;$min[$max[$get[page];1];$get[pages]]]
      $let[stInd;$multi[$get[maxperpage];$sub[$get[page];1]]]
      $let[endInd;$multi[$get[maxperpage];$get[page]]]
      $arraySlice[clids;colID;$get[stInd];$get[endInd]]
      $arrayMap[userUniques;uu;
        $if[$env[catalog;collectibles;$env[uu];class]==$get[class];
          $let[uuEmojiVal;$appEmoji[$env[catalog;collectibles;$env[uu];emoji_id]]]
          $let[uuName;$default[$replace[$env[catalog;collectibles;$env[uu];short_name];null;];$env[catalog;collectibles;$env[uu];name]]]
          $return[$if[$get[uuEmojiVal]==;\`$get[uuName]\` ;$get[uuEmojiVal]]]
        ]
      ;owned]
      $arrayMap[ids;id;
        $if[$and[$env[catalog;collectibles;$env[id];class]==$get[class];$arrayIncludes[userUniques;$env[id]]==false];
          $let[idEmojiVal;$appEmoji[$env[catalog;collectibles;$env[id];emoji_id]]]
          $let[idName;$default[$replace[$env[catalog;collectibles;$env[id];short_name];null;];$env[catalog;collectibles;$env[id];name]]]
          $return[$if[$get[idEmojiVal]==;\`$get[idName]\` ;$get[idEmojiVal]]]
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
            $addTextDisplay[### $toTitleCase[$get[class]]$if[$get[owned]>0;
**Owned**: $arrayJoin[owned;]]$if[$get[missing]>0;

**Missing**: $arrayJoin[missing;]]
            ]
            $addSeparator
            $addActionRow
            $if[$arrayLength[colID]>0;
              $addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info]
              $arrayForEach[colID;nat;
                $let[id;$env[nat]]
                $jsonLoad[colData;$getVar[collectible;$get[id]]]
                $let[colID;$env[colData;id]]
                $addOption[$cropText[$getSpecial[$env[colData;special];emoji] $env[catalog;collectibles;$get[colID];name];0;90;...];ATTACK: $env[colData;attack] | HEALTH: $env[colData;health];$env[nat];$appEmoji[$env[catalog;collectibles;$get[colID];emoji_id]]]
              ]
            ;$addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a $jsonVar[keywords;collectible.singular] to view its info;true]
              $addOption[null;null;null]
            ]
          ;$jsonVar[config;accent]]
          $addActionRow
          $addButton[pages-collectibles-$authorID-$sub[$get[page];1]-$get[user]-$get[class];Previous;Secondary;;$checkCondition[$get[page]==1]]
          $addButton[pages-collectibles-$authorID-index;$get[page] / $get[pages];Primary;;true]
          $addButton[pages-collectibles-$authorID-$sum[$get[page];1]-$get[user]-$get[class];Next;Secondary;;$checkCondition[$or[$get[page]==$get[pages];$get[pages]<=1]]]
        ]
      ]
    ]

    $else[
      $if[$or[$get[total]<1;$get[total]==];
        $return[$err[no_collectibles_found;true]]
      ;
        $let[owned;$arrayLength[userUniques]]
        $let[progress;$if[$get[total]>0;$cropText[$math[($get[owned]/$get[total])*100];0;4];NaN]]

        $let[totalClassCount;$arrayLength[classes]]
        $arrayMap[ids;id;$if[$arrayIncludes[classes;$env[catalog;collectibles;$env[id];class]]==false;$return[$env[id]]];unclassifiedIds]
        $let[hasUnclassified;$if[$arrayLength[unclassifiedIds]>0;1;0]]
        $let[pages;$sum[$get[totalClassCount];$get[hasUnclassified]]]
        $let[page;$min[$max[$get[page];1];$get[pages]]]


        $if[$get[page]<=$get[totalClassCount];
          $let[classIndex;$sub[$get[page];1]]
          $let[pageClass;$arrayAt[classes;$get[classIndex]]]
          $let[classTotal;$default[$get[$get[pageClass]];0]]

          $arrayMap[userUniques;uu;$if[$env[catalog;collectibles;$env[uu];class]==$get[pageClass];$return[$env[uu]]];classOwnedIds]
          $arrayMap[ids;id;$if[$and[$env[catalog;collectibles;$env[id];class]==$get[pageClass];$arrayIncludes[userUniques;$env[id]]==false];$return[$env[id]]];classMissingIds]

          $arrayMap[classOwnedIds;uu;
            $let[uuEmojiVal;$appEmoji[$env[catalog;collectibles;$env[uu];emoji_id]]]
            $let[uuName;$default[$replace[$env[catalog;collectibles;$env[uu];short_name];null;];$env[catalog;collectibles;$env[uu];name]]]
            $return[$if[$get[uuEmojiVal]==;\`$get[uuName]\` ;$get[uuEmojiVal]]]
          ;classOwned$get[pageClass]]
          $arrayMap[classMissingIds;id;
            $let[idEmojiVal;$appEmoji[$env[catalog;collectibles;$env[id];emoji_id]]]
            $let[idName;$default[$replace[$env[catalog;collectibles;$env[id];short_name];null;];$env[catalog;collectibles;$env[id];name]]]
            $return[$if[$get[idEmojiVal]==;\`$get[idName]\` ;$get[idEmojiVal]]]
          ;classMissing$get[pageClass]]

          $let[ownedCount;$arrayLength[classOwned$get[pageClass]]]
          $let[missingCount;$arrayLength[classMissing$get[pageClass]]]
          $jsonLoad[summary;$classCatchSummary[$jsonStringify[userCollectibles];$jsonStringify[catalog];$get[pageClass]]]
          $jsonLoad[clids;$env[summary;ids]]
          $jsonLoad[counts;$env[summary;counts]]
          $let[listPages;$ceil[$divide[$max[$arrayLength[clids];1];$get[maxperpage]]]]
          $let[listPage;$min[$max[$get[listPage];1];$get[listPages]]]
          $let[prevPage;$get[page]]
          $let[prevList;$sub[$get[listPage];1]]
          $if[$and[$get[listPage]<=1;$get[page]>1];
            $let[prevPage;$sub[$get[page];1]]
            $let[prevClass;$arrayAt[classes;$sub[$get[page];2]]]
            $let[prevList;$max[$ceil[$divide[$max[$default[$env[counts;$get[prevClass]];0];1];$get[maxperpage]]];1]]
          ]
          $let[nextPage;$get[page]]
          $let[nextList;$sum[$get[listPage];1]]
          $if[$get[listPage]>=$get[listPages];
            $let[nextPage;$sum[$get[page];1]]
            $let[nextList;1]
          ]
          $let[listStInd;$multi[$get[maxperpage];$sub[$get[listPage];1]]]
          $let[listEndInd;$multi[$get[maxperpage];$get[listPage]]]
          $arraySlice[clids;colID;$get[listStInd];$get[listEndInd]]
          $return[
            $addContainer[
              $addSection[
                $addTextDisplay[## $userDisplayName[$get[user]]'s $toTitleCase[$get[pageClass]] Progress
**$get[ownedCount] / $get[classTotal]** owned]
                $addThumbnail[$userAvatar[$get[user]]]
              ]
              $addSeparator
              $addTextDisplay[### $toTitleCase[$get[pageClass]]$if[$get[ownedCount]>0;
**Owned**: $arrayJoin[classOwned$get[pageClass];]]$if[$get[missingCount]>0;

**Missing**: $arrayJoin[classMissing$get[pageClass];]]
              ]
              $addSeparator
              $addActionRow
              $if[$arrayLength[colID]>0;
                $addStringSelectMenu[collectibles-info-$authorID-$get[pageClass];Select a $jsonVar[keywords;collectible.singular] to view its info]
                $arrayForEach[colID;nat;
                  $let[id;$env[nat]]
                  $jsonLoad[colData;$getVar[collectible;$get[id]]]
                  $let[colID;$env[colData;id]]
                  $addOption[$cropText[$getSpecial[$env[colData;special];emoji] $env[catalog;collectibles;$get[colID];name];0;90;...];ATTACK: $env[colData;attack] | HEALTH: $env[colData;health];$env[nat];$appEmoji[$env[catalog;collectibles;$get[colID];emoji_id]]]
                ]
              ;$addStringSelectMenu[collectibles-info-$authorID-$get[pageClass];Select a $jsonVar[keywords;collectible.singular] to view its info;true]
                $addOption[null;null;null]
              ]
              $addActionRow
              $addButton[pages-progress-$authorID-$get[prevPage]-$get[user]-$get[prevList];Previous;Secondary;;$checkCondition[$and[$get[page]<=1;$get[listPage]<=1]]]
              $addButton[pages-progress-$authorID-index;$toTitleCase[$get[pageClass]] · $get[listPage] / $get[listPages];Primary;;true]
              $addButton[pages-progress-$authorID-$get[nextPage]-$get[user]-$get[nextList];Next;Secondary;;$checkCondition[$and[$get[page]>=$get[pages];$get[listPage]>=$get[listPages]]]]
            ;$jsonVar[config;accent]]
          ]
        ;
          $arrayMap[unclassifiedIds;id;$if[$arrayIncludes[userUniques;$env[id]];$return[$env[id]]];noClassOwnedIds]
          $arrayMap[unclassifiedIds;id;$if[$arrayIncludes[userUniques;$env[id]]==false;$return[$env[id]]];noClassMissingIds]
          $arrayMap[noClassOwnedIds;uu;
            $let[uuEmojiVal;$appEmoji[$env[catalog;collectibles;$env[uu];emoji_id]]]
            $let[uuName;$default[$replace[$env[catalog;collectibles;$env[uu];short_name];null;];$env[catalog;collectibles;$env[uu];name]]]
            $return[$if[$get[uuEmojiVal]==;\`$get[uuName]\` ;$get[uuEmojiVal]]]
          ;noClassOwned]
          $arrayMap[noClassMissingIds;id;
            $let[idEmojiVal;$appEmoji[$env[catalog;collectibles;$env[id];emoji_id]]]
            $let[idName;$default[$replace[$env[catalog;collectibles;$env[id];short_name];null;];$env[catalog;collectibles;$env[id];name]]]
            $return[$if[$get[idEmojiVal]==;\`$get[idName]\` ;$get[idEmojiVal]]]
          ;noClassMissing]
          $let[noClassOwnedCount;$arrayLength[noClassOwned]]
          $let[noClassMissingCount;$arrayLength[noClassMissing]]
          $let[noClassTotal;$sum[$get[noClassOwnedCount];$get[noClassMissingCount]]]
          $return[
            $addContainer[
              $addSection[
                $addTextDisplay[## $userDisplayName[$get[user]]'s Unclassified $jsonVar[keywords;collectible.plural]
**$get[noClassOwnedCount] / $get[noClassTotal]** owned]
                $addThumbnail[$userAvatar[$get[user]]]
              ]
              $addSeparator
              $addTextDisplay[### Unclassified $jsonVar[keywords;collectible.plural]$if[$get[noClassOwnedCount]>0;
**Owned**: $arrayJoin[noClassOwned;]]$if[$get[noClassMissingCount]>0;

**Missing**: $arrayJoin[noClassMissing;]]
              ]
              $addSeparator
              $addActionRow
              $addButton[pages-progress-$authorID-$sub[$get[page];1]-$get[user]-1;Previous;Secondary]
              $addButton[pages-progress-$authorID-index;$get[page] / $get[pages];Primary;;true]
              $addButton[pages-progress-$authorID-$sum[$get[page];1]-$get[user]-1;Next;Secondary;;true]
            ;$jsonVar[config;accent]]
          ]
        ]
      ]
    ]
  ]

  $return
  `,
});
