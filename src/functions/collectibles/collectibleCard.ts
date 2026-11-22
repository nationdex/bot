import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectibleCard',
  // Displays a caught collectible's info with its card as a plain message.
  params: [
    {
      name: 'id',
      // ID of the collectible whose card to show.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[colID;$collectible[$get[id];id]]
  $let[bg;$jsonVar[config;paths.cards]/$collectibleInfo[$get[colID];regime].png]
  $let[name;$toUpperCase[$default[$replace[$collectibleInfo[$get[colID];short_name];null;];$collectibleInfo[$get[colID];name]]]]
  $let[economyIcon;$jsonVar[config;paths.icons]/$collectibleInfo[$get[colID];economy]]
  $let[card;$jsonVar[config;paths.window_art]/$collectibleInfo[$get[colID];collection_card]]
  $let[capacity;$collectibleInfo[$get[colID];capacity_name]]
  $let[description;$collectibleInfo[$get[colID];capacity_description]]
  $let[attack;$collectible[$get[id];attack]]
  $let[attack_color;$if[$collectible[$get[id];attack_type]==buffed;#00FF00;#FF0000]]
  $let[health;$collectible[$get[id];health]]
  $let[health_color;$if[$collectible[$get[id];health_type]==buffed;#00FF00;#FF0000]]
  $let[artist;$collectibleInfo[$get[colID];credits]]

  $createCanvas[info;1428;2000]
  $drawImage[info;$get[bg];0;0;1428;2000]
  $drawText[info;fill;$get[name];133px collectible_name;#FFFFFF;67;219;1100]
  $drawImage[info;$get[economyIcon];1195;95;143;143]
  $drawImage[info;$get[card];67;267;1295;695]
  $drawText[info;fill;$get[capacity];70px ability_name;#FFFFFF;114;1104;1270]

  $arrayLoad[words; ;$get[description]]
  $arrayCreate[wrapLines]
  $let[currentLine;]
  $arrayForEach[words;word;
    $let[candidate;$if[$get[currentLine]==;$env[word];$get[currentLine] $env[word]]]
    $ifx[
      $if[$and[$get[currentLine]!=;$measureText[info;$get[candidate];71px ability_description;width]>1190];
        $arrayPush[wrapLines;$get[currentLine]]
        $let[currentLine;$env[word]]
      ]
      $else[
        $let[currentLine;$get[candidate]]
      ]
    ]
  ]
  $if[$get[currentLine]!=;$arrayPush[wrapLines;$get[currentLine]]]

  $let[lineIndex;0]
  $arrayForEach[wrapLines;line;
    $drawText[info;fill;$env[line];71px ability_description;#EEEEEE;114;$sum[1238;$multi[$get[lineIndex];89]]]
    $let[lineIndex;$sum[$get[lineIndex];1]]
  ]

  $textBaseline[info;middle]
  $drawText[info;fill;$get[health];95px stats;$get[health_color];286;1685]
  $drawText[info;fill;$get[attack];95px stats;$get[attack_color];1038;1685]
  $drawText[info;fill;Artwork by:;48px credits;#FFFFFF;67;1856]
  $drawText[info;fill;$get[artist];48px credits;#FFFFFF;67;1916]

  $return[
ID: \`#$get[id]\`
Caught on $discordTimestamp[$collectible[$get[id];timestamp];FullDateShortTime] in $shortParse[$collectible[$get[id];caught_in];5]

ATK: $collectible[$get[id];attack] ($collectible[$get[id];attack_type])
HP: $collectible[$get[id];health] ($collectible[$get[id];health_type])
$attachCanvas[info]
  ]
  `,
});
