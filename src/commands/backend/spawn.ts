import { BaseCommand } from '@tryforge/forgescript';
export default new BaseCommand({
  unprefixed: true,
  type: 'messageCreate',
  code: `
  $onlyIf[$spawnConfig[status]==enabled]
  
  $guildCooldown[spawn;1m]
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[weight;$sum[$spawnConfig[weight];$randomNumber[3;5]]]
  $!jsonSet[config;weight;$get[weight]]
  $setGuildVar[spawnConfig;$env[config]]
  $let[ch;$if[$channelExists[$env[config;config_channel]];$env[config;config_channel];$channelID]]
  
  $if[$get[weight]>=50;
    $!jsonSet[config;weight;0]
    $setGuildVar[spawnConfig;$env[config]]
    $spawnNation[$get[ch]]
  ]
  
  $if[$sub[$getTimestamp;$spawnConfig[timestamp]]>$parseString[1h30m];
    $spawnNation[$get[ch]]
  ]
  
  $let[message;$spawnConfig[message]]
  $let[wait;$randomNumber[$parseString[20m];$parseString[40m]]]
  
  $setTimeout[
    $jsonLoad[config;$getGuildVar[spawnConfig]]
    $if[$spawnConfig[message]==$get[message];
      $!jsonSet[config;weight;0]
      $setGuildVar[spawnConfig;$env[config]]
      $spawnNation[$get[ch]]
    ]
  ;$get[wait]]
  `,
});
