import { config } from '../../../config';
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
    $let[codeRaw;$get[PromoCode[$toLowerCase[$option[code]]]]]

    $if[$or[$get[codeRaw]==;$checkContains[$getUserVar[Redeemed];$toLowerCase[$option[code]]]];
      This code is invalid or has already been used.
      $end
    ]

    $textSplit[$get[codeRaw];|]
    $let[reward;$splitText[0]]
    $let[codeMessage;$splitText[1]]

    $let[nationRaw;$get[NationData[$get[reward]]]]
    $if[$get[nationRaw]==;
      This code references an unknown nation. Please contact an admin.
      $end
    ]

    $textSplit[$get[nationRaw];|]
    $let[Country;$splitText[0]]
    $let[emoji;$splitText[1]]
    $let[maxHealth;$splitText[3]]
    $let[maxAttack;$splitText[4]]

    $let[health;$randomNumber[250;$get[maxHealth]]]
    $let[attack;$randomNumber[250;$get[maxAttack]]]

    $if[$usePromoCode[$toLowerCase[$option[code]]]==false;
      This code is no longer available.
      $end
    ]

    $if[$getUserVar[inventory;$authorID;open]==open;
      $callFunction[redeem;$get[Country] (#$math[$getGlobalVar[globalCaught;0]+1], $get[attack]%/$get[health]%);$get[emoji];$get[codeMessage]]
    ;
      $ephemeral
      $callFunction[redeem;$get[Country] (#$math[$getGlobalVar[globalCaught;0]+1], $get[attack]%/$get[health]%);$get[emoji];$get[codeMessage]]
    ]

    $sendMessage[${config.logChannel};
    A nation has been Redeemed!
    ]
    $addContainer[
      $addTextDisplay[## Details of the Redeem]
      $addSeparator[Small]
      $addSection[
        $addTextDisplay[Code: $toTitleCase[$option[code]]]
        $addTextDisplay[Author: $username]
        $addTextDisplay[User ID: $authorID]
        $addTextDisplay[Guild ID: $guildID]
        $addTextDisplay[Nation: $get[Country]]
      ]
    ]

    $setGlobalVar[globalCaught;$math[$getGlobalVar[globalCaught;0]+1]]
    $setUserVar[Caught;$get[reward]|$get[attack]|$get[health]|$getTimestamp-$getUserVar[Caught]]
    $setUserVar[Redeemed;$toLowerCase[$option[code]]-$getUserVar[Redeemed]]
  `,
};

export default command;
