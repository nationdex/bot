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
    $jsonLoad[code;$readFile[./codes/$toLowerCase[$option[code]].json]]

    $if[$or[$env[code;Reward]==;$checkContains[$getUserVar[Redeemed];$option[code]]];This Code is Invalid/Used;$end]

    $jsonLoad[numbers;$readFile[./Balls/$env[code;Reward].json]]
    $let[health;$randomNumber[250;$env[numbers;health]]]
    $let[attack;$randomNumber[250;$env[numbers;strength]]]
    $let[Country;$env[numbers;country]]
    $let[emoji;$env[numbers;emojiID]]

    $if[$getUserVar[inventory;$authorID;open]==open;
      $callFunction[redeem;$get[Country] (#$math[$getGlobalVar[globalCaught;0]+1], $get[attack]%/$get[health]%);$get[emoji];$env[code;Message]]
    ;
      $ephemeral
      $callFunction[redeem;$get[Country] (#$math[$getGlobalVar[globalCaught;0]+1], $get[attack]%/$get[health]%);$get[emoji];$env[code;Message]]
    ]

    $sendMessage[${config.logChannel};
    A ball has been Redeemed!
    ]
    $addContainer[
      $addTextDisplay[## Details of the Redeem]
      $addSeparator[]
      $addSection[
        $addTextDisplay[Code: $toTitleCase[$option[code]]]
        $addTextDisplay[Author: $username]
        $addTextDisplay[User ID: $authorID]
        $addTextDisplay[Guild ID: $guildID]
        $addTextDisplay[Ball: $get[Country]]
      ]
    ]

    $setGlobalVar[globalCaught;$math[$getGlobalVar[globalCaught;0]+1]]
    $setUserVar[Caught;$env[code;Reward]|$get[attack]|$get[health]|$getTimestamp-$getUserVar[Caught]]
    $setUserVar[Redeemed;$toLowerCase[$option[code]]-$getUserVar[Redeemed]]
  `,
};

export default command;
