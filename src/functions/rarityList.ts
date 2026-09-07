import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'rarityList',
  // Displays the rarity list of collectibles/specials as a Components v2 message
  params: [
    {
      name: 'type',
      // Type of list, collectibles/specials
      type: 'String',
      required: true,
    },
    {
      name: 'class',
      // Rarity class of collectibles.
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
  $jsonLoad[classes;$collectiblesData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $let[sortType;$if[$env[sortType]==asc;asc;desc]]
  $let[page;$default[$replace[$env[page];null;];1]]
  $let[maxperpage;15]
  $let[stInd;$multi[$get[maxperpage];$sub[$get[page];1]]]
  $let[endInd;$multi[$get[maxperpage];$get[page]]]
  
  $if[$get[type]==collectibles;
    $jsonLoad[collectibles;$collectiblesData[collectibles]]
    $jsonLoad[ids;$collectibleIDs]
    $if[$get[class]!=;
      $arrayForEach[ids;nid;$if[$collectibleInfo[$env[nid];class]!=$get[class];$!jsonDelete[collectibles;$env[nid]]]]
    ]

    $jsonLoad[sortedData;$sortData[$env[collectibles];rarity;$get[sortType]]]
    $jsonLoad[ids;$jsonKeys[sortedData]]
    $if[$arrayLength[ids]<1;
      $return[$err[No $jsonVar[keywords;collectible.plural] found;true]]
    ]

    $let[totalRarity;$math[$collectiblesData[rarity;+]]]
    
    $arrayMap[ids;id;$return[$appEmoji[$collectibleInfo[$env[id];emoji_id]] **$collectibleInfo[$env[id];name]**: \`$cropText[$math[($collectibleInfo[$env[id];rarity]/$get[totalRarity])*100];0;5]%\`];mapped]
  ]
  $let[pages;$ceil[$divide[$arrayLength[ids];$get[maxperpage]]]]
  $arraySlice[mapped;display;$get[stInd];$get[endInd]]
  
  $return[
    $addContainer[
      $addSection[
        $addTextDisplay[## Rarity List of $jsonVar[keywords;collectible.plural]
-# Total $arrayLength[ids] $jsonVar[keywords;collectible.plural]]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addTextDisplay[$arrayJoin[display;
]]
    ;$jsonVar[config;accent]]
    $addActionRow
      $let[prevEmoji;$appEmoji[arrow_left]]
      $let[nextEmoji;$appEmoji[arrow_right]]
      $addButton[pages-rarity-$authorID-$sub[$get[page];1]-$get[type]-$get[class]-$get[sortType];$if[$get[prevEmoji]==;Previous];Secondary;$get[prevEmoji];$checkCondition[$get[page]==1]]
      $addButton[pages-rarity-$authorID-index;$get[page] / $get[pages];Primary;;true]
      $addButton[pages-rarity-$authorID-$sum[$get[page];1]-$get[type]-$get[class]-$get[sortType];$if[$get[nextEmoji]==;Next];Secondary;$get[nextEmoji];$checkCondition[$get[page]==$get[pages]]]
  ]
  `,
});
