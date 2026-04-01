import { config } from '../../../config';
import type { Command } from '../../types';

const collectibleName = config.appearance.commands.collectibles;

const command: Command = {
  data: {
    name: `${config.appearance.commands.comp.name}`,
    description: `Show Your Current Completion of ${config.name}`,
    type: 1,
    integration_types: [0, 1],
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User',
      },
    ],
  },
  code: `
    $if[$or[$getUserVar[owned;$authorID;0]==0;$getUserVar[unowned;$authorID;0]==0];
      $addSection[
        $addTextDisplay[# Account Migration]
        $addTextDisplay[Due to system updates to prevent loss of data, please redo this command]
      ]
      $callFunction[refurb;$authorID]
    ]

    $arrayLoad[totals;,$replace[$readDir[./Balls;,];.json;]]
    $let[Amount;$arrayLength[totals]]

    $let[user;$if[$option[user]==;$authorID;$option[user]]]

    $arrayLoad[owned;,;$getUserVar[owned;$get[user]]]
    $arrayLoad[unowned;,;$getUserVar[unowned;$get[user]]]

    $arrayForEach[owned;id;
      $if[$env[id]==;;
        $jsonLoad[json;$readFile[Balls/$env[id].json]]
        $let[caught2;<:emoji:$env[json;emojiID]>,$get[caught2]]
      ]
    ]

    $arrayForEach[unowned;id;
      $if[$env[id]==;;
        $jsonLoad[json;$readFile[Balls/$env[id].json]]
        $let[uncaught2;<:emoji:$env[json;emojiID]>,$get[uncaught2]]
      ]
    ]

    $author[$userDisplayName[$get[user]];$userAvatar[$get[user]]]

    $let[percentage;$round[$math[($math[$arrayLength[owned]-1]/$get[Amount])*100];2]]
    $addTextDisplay[$username[$botID] Progression: $get[percentage]%]

    $let[name;${collectibleName}]

    $textSplit[$get[caught2];,]
    $let[list1;$getSplitTextLength]
    $let[pageCount;$round[$math[($get[list1]/22)+0.5]]]
    $if[$get[pageCount]>=4;$let[pageCount;4]]

    $let[page;1]
    $loop[$get[pageCount];
      $let[startIndex;$math[($get[page]-1)*22]]
      $let[chunkSize;$min[22;$math[$get[list1]-$get[startIndex]]]]
      $loop[$get[chunkSize];
        $let[ficaught$get[page];$splitText[$get[startIndex]] $get[ficaught$get[page]]]
        $let[startIndex;$math[$get[startIndex]+1]]
      ]
      $if[$get[percentage]==0;
        $addField[Owned $get[name]'s | $math[$arrayLength[owned]-1];You Don't own Any $get[name]'s Yet.]
      ;
        $addField[$if[$get[page]==1;Owned $get[name]'s | $math[$arrayLength[owned]-1]];$get[ficaught$get[page]]]
      ]
      $let[page;$math[$get[page]+1]]
    ]

    $textSplit[$get[uncaught2];,]
    $let[list2;$getSplitTextLength]
    $let[pageCount;$round[$math[($get[list2]/22)+0.5]]]
    $if[$get[pageCount]>=4;$let[pageCount;4]]

    $let[page;1]
    $loop[$get[pageCount];
      $let[startIndex;$math[($get[page]-1)*22]]
      $let[chunkSize;$min[22;$math[$get[list2]-$get[startIndex]]]]
      $loop[$get[chunkSize];
        $let[fiuncaught$get[page];$splitText[$get[startIndex]] $get[fiuncaught$get[page]]]
        $let[startIndex;$math[$get[startIndex]+1]]
      ]
      $if[$get[percentage]==100;
        $addField[Missing $get[name]'s | $math[$arrayLength[unowned]-1];You completed the bot congratulations! :tada:]
      ;
        $addField[$if[$get[page]==1;Missing $get[name]'s | $math[$arrayLength[unowned]-1]];$get[fiuncaught$get[page]]]
      ]
      $let[page;$math[$get[page]+1]]
    ]
  `,
};

export default command;
