import { ForgeFunction } from '@tryforge/forgescript';
import { config } from '../config/config';

export default new ForgeFunction({
  name: 'progressMenu',
  // Shows the nations progress of a user as a Components v2 message.
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
  $let[nation;$env[nation]]
  $jsonLoad[classes;$getNationsData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[maxperpage;25]
  $let[stInd;$multi[$get[maxperpage];$max[$sub[$get[page];1];0]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  
  $jsonLoad[nations;$getNationsData[nations]]
  $jsonLoad[ids;$jsonKeys[nations]]
  $let[total;$getNationsData[total]]
  $arrayForEach[classes;class;$let[$env[class];$getNationsData[$env[class]]]]
  
  $jsonLoad[userNations;$getUserData[$get[user];nations]]
  $jsonLoad[userUniques;$getUserData[$get[user];unique]]
  $let[userTotal;$getUserData[$get[user];total]]
  $arrayForEach[classes;class;$let[user$toTitleCase[$env[class]];$getUserData[$get[user];$env[class]]]]
      
  $ifx[
    $if[$get[class]!=;
      $arrayMap[userNations;unid;
        $if[$getNationInfo[$getNation[$env[unid];nation];class]==$get[class];$return[$env[unid]]]
      ;clids]
      $let[pages;$ceil[$divide[$max[$arrayLength[clids];1];$get[maxperpage]]]]
      $arraySlice[clids;nation;$get[stInd];$get[endInd]]
      $arrayMap[userUniques;uu;$if[$getNationInfo[$env[uu];class]==$get[class];$return[$appEmoji[$getNationInfo[$env[id];emoji_id]]]];unique]
      $arrayMap[ids;id;$if[$and[$getNationInfo[$env[id];class]==$get[class];$arrayIncludes[owned;$appEmoji[$getNationInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$getNationInfo[$env[id];emoji_id]]]];missing]
      
      $let[total;$get[$get[class]]]
      $let[unique;$arrayLength[unique]]
      $let[missing;$arrayLength[missing]]
      $let[progress;$cropText[$math[($get[unique]/$get[total])*100];0;4]]
      
      $return[
        $addContainer[
          $addSection[
            $addTextDisplay[## $userDisplayName[$get[user]]'s $toTitleCase[$get[class]] Progress: $get[progress]%
Unique $toTitleCase[$get[class]] Nations: **$get[unique] / $get[total]**
Total $toTitleCase[$get[class]] Nations: **$get[user$toTitleCase[$get[class]]]**]
            $addThumbnail[$userAvatar[$get[user]]]
          ]
          $addSeparator
          $addTextDisplay[$appEmoji[$get[class]] **$toTitleCase[$get[class]]** $if[$get[unique]>0;
**Owned**: $arrayJoin[unique;  ]]$if[$get[missing]>0;
**Missing**: $arrayJoin[missing;  ]]
]
          $addSeparator
          $addActionRow
        $if[$arrayLength[nation]>0;
          $addStringSelectMenu[nations-info-$authorID-$get[class];Select a nation to view its info]
          $arrayForEach[nation;nat;
            $let[id;$env[nat]]
            $let[nation;$getNation[$get[id];nation]]
            $addOption[$cropText[$getSpecial[$getNation[$get[id];special];emoji]$getNationInfo[$get[nation];name];0;97;...];ATTACK: $getNation[$get[id];attack] | HEALTH: $getNation[$get[id];health];$env[nat];$appEmoji[$getNationInfo[$get[nation];emoji_id]]]
          ]
          ;$addStringSelectMenu[nations-info-$authorID-$get[class];Select a nation to view its info;true]
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
      $arraySlice[userNations;nation;$get[stInd];$get[endInd]]
      $let[owned;$arrayLength[userUniques]]
      $let[progress;$cropText[$math[($get[owned]/$get[total])*100];0;4]]
      
      $return[
        $addContainer[
          $addSection[
            $addTextDisplay[## $userDisplayName[$get[user]]'s ${config.name} Progress: $get[progress]%
Unique Nations: **$get[owned] / $get[total]**
Total Nations Owned: **$getUserData[$get[user];total]**]
            $addThumbnail[$userAvatar[$get[user]]]
          ]
        $arrayForEach[classes;class;$let[class;$env[class]]
          $arrayMap[userUniques;uu;$if[$getNationInfo[$env[uu];class]==$get[class];$return[$appEmoji[$getNationInfo[$env[id];emoji_id]]]];owned]
          $arrayMap[ids;id;$if[$and[$getNationInfo[$env[id];class]==$get[class];$arrayIncludes[owned;$appEmoji[$getNationInfo[$env[id];emoji_id]]]==false];$return[$appEmoji[$getNationInfo[$env[id];emoji_id]]]];missing]
      
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
        $if[$arrayLength[nation]>0;
          $addStringSelectMenu[nations-info-$authorID-$get[class];Select a nation to view its info]
          $arrayForEach[nation;nat;
            $let[id;$env[nat]]
            $let[nation;$getNation[$get[id];nation]]
            $addOption[$cropText[$getSpecial[$getNation[$get[id];special];emoji]$getNationInfo[$get[nation];name];0;97;...];ATTACK: $getNation[$get[id];attack] | HEALTH: $getNation[$get[id];health];$env[nat];$appEmoji[$getNationInfo[$get[nation];emoji_id]]]
          ]
          ;$addStringSelectMenu[nations-info-$authorID;Select a nation to view its info;true]
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
