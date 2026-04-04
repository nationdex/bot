import { config } from '../../../config';
import type { Command } from '../../types';

const collectibleSingular = config.appearance.interface.collectible.singular;
const collectiblePlural = config.appearance.interface.collectible.plural;

const command: Command = {
  data: {
    name: `${config.appearance.commands.prog.name}`,
    description: config.appearance.commands.prog.desc,
    type: 1,
    integration_types: [0, 1],
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User to view progression for',
      },
    ],
  },
  code: `
    $defer
    $let[nationCount;$getNationCount]

    $onlyIf[$get[nationCount]!=0;$addContainer[$addTextDisplay[## No ${collectiblePlural} available yet!]$addSeparator[Small]$addTextDisplay[The bot's ${collectiblePlural} haven't been set up yet. Check back later!]]]

    $let[user;$if[$option[user]==;$authorID;$option[user]]]
    $let[rareness;$getTotalRareness]
    $let[caught;$getUserVar[Caught;$get[user]]]

    $onlyIf[$get[caught]!=;$addContainer[$addTextDisplay[## $userDisplayName[$get[user]]'s ${collectibleSingular} Progression]$addSeparator[Small]$addTextDisplay[You haven't caught any ${collectiblePlural} yet! Use </redeem:$botID> to get started.]]]

    $textSplit[$get[caught];-]
    $let[totalItems;$getSplitTextLength]
    $let[remaining;$math[$get[nationCount]-$get[totalItems]]]

    $c[First pass: build emoji list and cache nation data per entry]
    $let[emojiList;]
    $let[i;0]
    $loop[$get[totalItems];
      $textSplit[$get[caught];-]
      $let[entry;$splitText[$get[i]]]
      $if[$get[entry]!=;
        $if[$checkContains[$get[entry];|];
          $textSplit[$get[entry];|]
          $let[slug$get[i];$splitText[0]]
          $let[atk$get[i];$splitText[1]]
          $let[hlth$get[i];$splitText[2]]
          $let[date$get[i];$splitText[3]]
        ;
          $c[Legacy: caught before stat tracking]
          $let[slug$get[i];$get[entry]]
          $let[atk$get[i];1]
          $let[hlth$get[i];1]
          $let[date$get[i];1729707105594]
        ]
        $let[nd$get[i];$getNationData[$get[slug$get[i]]]]
        $if[$get[nd$get[i]]!=;
          $textSplit[$get[nd$get[i]];|]
          $let[emojiList;$get[emojiList] <:emoji:$splitText[1]>]
        ]
      ]
      $let[i;$math[$get[i]+1]]
    ]

    $addContainer[
      $addTextDisplay[## $userDisplayName[$get[user]]'s ${collectibleSingular} Progression]
      $addSeparator
      $addSection[
        $addTextDisplay[$get[emojiList]]
        $addThumbnail[$userAvatar[$get[user]]]
      ]
      $addSeparator
      $addTextDisplay[-# Completed: **$get[totalItems]** - Remaining: **$get[remaining]**]
      $addActionRow
      $addStringSelectMenu[nations-list;Select a ${collectibleSingular}!;false;1;1]

      $c[Second pass: populate select menu options]
      $let[i;0]
      $loop[$get[totalItems];
        $if[$get[nd$get[i]]!=;
          $textSplit[$get[nd$get[i]];|]
          $let[nCountry;$splitText[0]]
          $let[nEmojiId;$splitText[1]]
          $let[nRarity;$splitText[2]]
          $addOption[$get[nCountry] - Rarity $round[$math[($get[nRarity]/$get[rareness])*100];2]%;ATK: $get[atk$get[i]]% ● HP: $get[hlth$get[i]]% ● $parseDate[$get[date$get[i]];Date];$get[user]-$get[slug$get[i]]|$get[atk$get[i]]|$get[hlth$get[i]]|$get[date$get[i]];<:emoji:$get[nEmojiId]>]
        ]
        $let[i;$math[$get[i]+1]]
      ]
      $addActionRow
      $addButton[nations-missing;Missing ${collectiblePlural};Secondary;🔮]
    ;#d93b3a]
  `,
};

export default command;
