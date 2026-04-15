import { config } from '../../../config/config';
import type { Command } from '../../types';

const command: Command = {
  data: {
    name: 'redeem',
    description: 'Redeem a promo code!',
    type: 1,
    integration_types: [0, 1],
    options: [
      {
        type: 3,
        name: 'code',
        description: 'Code to redeem',
        required: true,
      },
    ],
  },
  code: `
    $defer

    $let[codeRaw;$get[PromoCode[$toLowerCase[$option[code]]]]

    $onlyIf[$get[codeRaw]!=;$addContainer[$addTextDisplay[❌ This code is invalid.]]]
    $onlyIf[$checkContains[$getUserVar[Redeemed];$toLowerCase[$option[code]]]==false;$addContainer[$addTextDisplay[❌ This code has already been redeemed.]]]

    $textSplit[$get[codeRaw];|]
    $let[reward;$splitText[0]]
    $let[codeMessage;$splitText[1]]

    $let[nationRaw;$get[NationData[$get[reward]]]
    $onlyIf[$get[nationRaw]!=;$addContainer[$addTextDisplay[❌ This code references an unknown nation. Please contact an admin.]]]

    $textSplit[$get[nationRaw];|]
    $let[Country;$splitText[0]]
    $let[emoji;$splitText[1]]
    $let[maxHealth;$splitText[3]]
    $let[maxAttack;$splitText[4]]

    $let[health;$randomNumber[250;$get[maxHealth]]]
    $let[attack;$randomNumber[250;$get[maxAttack]]]

    $onlyIf[$usePromoCode[$toLowerCase[$option[code]]]!=false;$addContainer[$addTextDisplay[❌ This code is no longer available.]]]

    $c[Save redemption data]
    $!setGlobalVar[globalCaught;$math[$getGlobalVar[globalCaught;0]+1]]
    $!setUserVar[Caught;$get[reward]|$get[attack]|$get[health]|$getTimestamp-$getUserVar[Caught]]
    $!setUserVar[Redeemed;$toLowerCase[$option[code]]-$getUserVar[Redeemed]]

    $c[Log synchronously before the CV2 response — container resets after send, no flag leak]
    $sendMessage[${config.logChannel};**Promo Code Redeemed**
    Code: $toTitleCase[$option[code]]
    User: $username ($authorID)
    Nation: $get[Country]
    Guild: $guildID]

    $c[Show success to the user]
    $addContainer[
      $addSection[
        $addTextDisplay[## 🎉 You received a $get[Country]!]
        $addTextDisplay[<:emoji:$get[emoji]> **$get[Country]** (#$getGlobalVar[globalCaught;0])]
        $addTextDisplay[⚔️ ATK: **$get[attack]%** ● ❤️ HP: **$get[health]%**]
        $addThumbnail[https://cdn.discordapp.com/emojis/$get[emoji].png]
      ]
      $addSeparator[Small]
      $addTextDisplay[$get[codeMessage]]
    ]
  `,
};

export default command;
