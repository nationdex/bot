import { config } from '../../../config';
import type { Command } from '../../types';

const collectibleSingular = config.appearance.interface.collectible.singular;
const collectiblePlural = config.appearance.interface.collectible.plural;

const command: Command = {
  data: {
    name: `${config.appearance.commands.list.name}`,
    description: config.appearance.commands.list.desc,
    type: 1,
    integration_types: [0, 1],
  },
  code: `
    $let[nationCount;$get[NationCount[]]]

    $if[$get[nationCount]==0;
      $addContainer[
        $addTextDisplay[## No ${collectiblePlural} available yet!]
        $addSeparator[Small]
        $addTextDisplay[The bot's ${collectiblePlural} haven't been set up yet. Check back later!]
      ]
      $end
    ]

    $let[rareness;$get[TotalRareness[]]

    $let[caught;$getUserVar[Caught;$authorID]]

    $let[page;1]

    $textSplit[$get[caught];-]
    $let[totalItems;$getSplitTextLength]
    $let[totalPages;$round[$math[($get[totalItems]/10)+0.5]]]

    $addContainer[
      $addTextDisplay[## $username's ${collectibleSingular} List]
      $addTextDisplay[Select a ${collectibleSingular} from below to view!]
      $addTextDisplay[Page: $get[page]/$get[totalPages]]
    ]

    $if[$get[totalPages]>1;
      $addActionRow[
        $addButton[sepageback|1|$authorID;;Secondary;<:left:1255938305590300793>;true]
        $addButton[sepagecount;Page $get[page];Primary;;true]
        $addButton[sepageforward|1|$authorID;;Secondary;<:right:1255938306764701727>;false]
      ]
    ]

    $addActionRow[
      $addStringSelectMenu[nations-list-$get[page];Choose a ${collectibleSingular}!;;0;1]
    ]

    $let[startIndex;$math[($get[page]-1)*10]]
    $if[$get[totalItems]>=10;$let[min;10];$let[min;$get[totalItems]]]

    $loop[$min[$get[min];$get[totalItems]];
      $textSplit[$get[caught];-]
      $if[$splitText[$get[startIndex]]==;
        $let[startIndex;$math[$get[startIndex]+1]]
      ;
        $let[split;$splitText[$get[startIndex]]]

        $if[$checkContains[$get[split];|];
          $textSplit[$get[split];|]
          $let[name;$splitText[0]]
          $let[atk;$splitText[1]]
          $let[hlth;$splitText[2]]
          $let[date;$splitText[3]]
          $let[random;]
          $let[split2;$get[name]|$get[atk]|$get[hlth]|$get[date]]
        ;
          $let[name;$get[split]]
          $let[atk;1]
          $let[hlth;1]
          $let[date;1729707105594]
          $let[random;-$randomNumber[0;100]]
          $let[split2;$get[name]|$get[atk]|$get[hlth]|$get[date]]
        ]

        $let[nationRaw;$get[NationData[$get[name]]]]
        $textSplit[$get[nationRaw];|]
        $let[nCountry;$splitText[0]]
        $let[nEmojiId;$splitText[1]]
        $let[nRarity;$splitText[2]]

        $addOption[$get[nCountry] - Rarity $round[$math[($get[nRarity]/$get[rareness])*100];2]%;ATK: $get[atk]% ● HP: $get[hlth]% ● $parseDate[$get[date];Date];$authorID-$get[split2]$get[random];<:emoji:$get[nEmojiId]>]
        $let[startIndex;$math[$get[startIndex]+1]]
      ]
    ]
  `,
};

export default command;
