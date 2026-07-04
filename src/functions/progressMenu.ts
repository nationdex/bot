import { ForgeFunction } from '@tryforge/forgescript';
import { ctbl } from '../config/collectible';
import { config } from '../config/config';

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
  $jsonLoad[classes;$collectiblesData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[maxperpage;25]
  $let[stInd;$multi[$get[maxperpage];$max[$sub[$get[page];1];0]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  
  $jsonLoad[nations;$collectiblesData[collectibles]]
  $jsonLoad[ids;$jsonKeys[nations]]
  $let[total;$collectiblesData[total]]
  $arrayForEach[classes;class;$let[$env[class];$collectiblesData[$env[class]]]]
  
  $jsonLoad[userNations;$getUserData[$get[user];collectibleIds]]
  $jsonLoad[userUniques;$getUserData[$get[user];unique]]
  $let[userTotal;$getUserData[$get[user];total]]
  $arrayForEach[classes;class;$let[user$toTitleCase[$env[class]];$getUserData[$get[user];$env[class]]]]
      
  $ifx[
    $if[$get[class]!=;
      $arrayMap[userNations;unid;
        $if[$collectibleInfo[$collectible[$env[unid];collectible];class]==$get[class];$return[$env[unid]]]
      ;clids]
      $let[pages;$ceil[$divide[$max[$arrayLength[clids];1];$get[maxperpage]]]]
      $arraySlice[clids;colId;$get[stInd];$get[endInd]]
      $arrayMap[userUniques;uu;$if[$collectibleInfo[$env[uu];class]==$get[class];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];unique]
      $arrayMap[ids;id;$if[$and[$collectibleInfo[$env[id];class]==$get[class];$arrayIncludes[owned;$appEmoji[$collectibleInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];missing]
      
      $let[total;$get[$get[class]]]
      $let[unique;$arrayLength[unique]]
      $let[missing;$arrayLength[missing]]
      $let[progress;$cropText[$math[($get[unique]/$get[total])*100];0;4]]
      
      $return[
        $addContainer[
          $addSection[
            $addTextDisplay[## $userDisplayName[$get[user]]'s $toTitleCase[$get[class]] Progress: $get[progress]%
Unique $toTitleCase[$get[class]] ${ctbl.plural}: **$get[unique] / $get[total]**
Total $toTitleCase[$get[class]] ${ctbl.plural}: **$get[user$toTitleCase[$get[class]]]**]
            $addThumbnail[$userAvatar[$get[user]]]
          ]
          $addSeparator
          $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]]** $if[$get[unique]>0;
**Owned**: $arrayJoin[unique;  ]]$if[$get[missing]>0;
**Missing**: $arrayJoin[missing;  ]]
]
          $addSeparator
          $addActionRow
        $if[$arrayLength[colId]>0;
          $addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a ${ctbl.singular} to view its info]
          $arrayForEach[colId;nat;
            $let[id;$env[nat]]
            $let[colId;$collectible[$get[id];id]]
            $addOption[$cropText[$getSpecial[$collectible[$get[id];special];emoji] $collectibleInfo[$get[colId];name];0;90;...];ATTACK: $collectible[$get[id];attack] | HEALTH: $collectible[$get[id];health];$env[nat];$appEmoji[$collectibleInfo[$get[colId];emoji_id]]]
          ]
          ;$addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a ${ctbl.singular} to view its info;true]
          $addOption[null;null;null]
        ]
        ;${config.color}]
        $addActionRow
        $addButton[pages-progress-$authorID-$sub[$get[page];1]-$get[user]-$get[class];;Secondary;$appEmoji[arrow_left];$checkCondition[$get[page]==1]]
        $addButton[pages-progress-$authorID-index;$get[page] / $get[pages];Primary;;true]
        $addButton[pages-progress-$authorID-$sum[$get[page];1]-$get[user]-$get[class];;Secondary;$appEmoji[arrow_right];$checkCondition[$get[page]==$get[pages]]]
      ]
    ]
    
    $else[
      $let[pages;$ceil[$divide[$max[$arrayLength[userNations];1];$get[maxperpage]]]]
      $arraySlice[userNations;colId;$get[stInd];$get[endInd]]
      $let[owned;$arrayLength[userUniques]]
      $let[progress;$cropText[$math[($get[owned]/$get[total])*100];0;4]]
      
      $return[
        $addContainer[
          $addSection[
            $addTextDisplay[## $userDisplayName[$get[user]]'s ${config.name} Progress: $get[progress]%
Unique ${ctbl.plural}: **$get[owned] / $get[total]**
Total ${ctbl.plural} Owned: **$getUserData[$get[user];total]**]
            $addThumbnail[$userAvatar[$get[user]]]
          ]
        $arrayForEach[classes;class;$let[class;$env[class]]
          $arrayMap[userUniques;uu;$if[$collectibleInfo[$env[uu];class]==$get[class];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];owned]
          $arrayMap[ids;id;$if[$and[$collectibleInfo[$env[id];class]==$get[class];$arrayIncludes[owned;$appEmoji[$collectibleInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]]]];missing]
      
          $let[total;$get[$get[class]]]
          $let[owned;$arrayLength[owned]]
          $let[missing;$arrayLength[missing]]
          $addSeparator
          $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]] ($get[owned] / $get[total])**$if[$get[owned]>0;
**Owned**: $arrayJoin[owned;  ]]$if[$get[missing]>0;
**Missing**: $arrayJoin[missing;  ]]
]
          ]
          $addSeparator
          $addActionRow
        $if[$arrayLength[colId]>0;
          $addStringSelectMenu[collectibles-info-$authorID-$get[class];Select a ${ctbl.singular} to view its info]
          $arrayForEach[colId;nat;
            $let[id;$env[nat]]
            $let[colId;$collectible[$get[id];id]]
            $addOption[$cropText[$getSpecial[$collectible[$get[id];special];emoji] $collectibleInfo[$get[colId];name];0;90;...];ATTACK: $collectible[$get[id];attack] | HEALTH: $collectible[$get[id];health];$env[nat];$appEmoji[$collectibleInfo[$get[colId];emoji_id]]]
          ]
          ;$addStringSelectMenu[collectibles-info-$authorID;Select a ${ctbl.singular} to view its info;true]
          $addOption[null;null;null]
        ]
        ;${config.color}]
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
