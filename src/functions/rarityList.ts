import { config } from '../config/config';
import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'rarityList',
  // Displays the rarity list of nations/specials as a components v2 message
  params: [
    {
      name: 'type',
      // Type of list, nations/specials
      type: 'String',
      required: true,
    },
    {
      name: 'class',
      // Rarity class of nations.
      type: 'String',
      required: false,
    },
    {
      name: 'sortType',
      // Sorting type of the list.
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
  code: `
  $let[type;$env[type]]
  $jsonLoad[classes;$getNationsData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $let[sortType;$if[$env[sortType]==asc;asc;desc]]
  $let[page;$default[$replace[$env[page];null;];1]]
  $let[maxperpage;15]
  $let[stInd;$multi[$get[maxperpage];$sub[$get[page];1]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  
  $if[$get[type]==nations;
    $jsonLoad[nations;$getNationsData[nations]]
    $jsonLoad[ids;$getNationsData[id]]
    $if[$get[class]!=;
      $arrayForEach[ids;nid;$if[$getNationInfo[$env[nid];class]!=$get[class];$!jsonDelete[nations;$env[nid]]]]
    ]
    
    $jsonLoad[sortedData;$sortData[$env[nations];rarity;$get[sortType]]]
    $jsonLoad[ids;$jsonKeys[sortedData]]
    $let[totalRarity;$math[$getNationsData[rarity;+]]]
    
    $arrayMap[ids;id;$return[$appEmoji[$getNationInfo[$env[id];emoji_id]] **$getNationInfo[$env[id];name]**: \`$cropText[$math[($getNationInfo[$env[id];rarity]/$get[totalRarity])*100];0;5]%\`];mapped]
  ]
  $let[pages;$ceil[$divide[$arrayLength[ids];$get[maxperpage]]]]
  $arraySlice[mapped;display;$get[stInd];$get[endInd]]
  
  $return[
    $addContainer[
      $addSection[
        $addTextDisplay[## Rarity List of nations
-# Total $arrayLength[ids] nations]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addTextDisplay[$arrayJoin[display;
]]
    ;${config.color}]
    $addActionRow
        $addButton[pages-rarity-$authorID-$sub[$get[page];1]-$get[type]-$get[class]-$get[sortType];;Secondary;$appEmoji[arrow_left];$checkCondition[$get[page]==1]]
        $addButton[pages-rarity-$authorID-index;$get[page] / $get[pages];Primary;;true]
        $addButton[pages-rarity-$authorID-$sum[$get[page];1]-$get[type]-$get[class]-$get[sortType];;Secondary;$appEmoji[arrow_right];$checkCondition[$get[page]==$get[pages]]]
  ]
  `,
});
