import { command } from '../../util/commands';

export default command('spawn', `
  $onlyIf[$spawnConfig[status]==enabled]
  
  $guildCooldown[$guildID;1m;$stop]
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[weight;$sum[$spawnConfig[weight];$randomNumber[3;5]]]
  $!jsonSet[config;weight;$get[weight]]
  $setGuildVar[spawnConfig;$env[config]]
  $let[ch;$if[$channelExists[$env[config;config_channel]];$env[config;config_channel];$channelID]]
  
  $onlyIf[$or[$get[weight]>=50;$sub[$getTimestamp;$spawnConfig[timestamp]]>=$parseString[1h30m]]]

    $!jsonSet[config;weight;0]
    $setGuildVar[spawnConfig;$env[config]]
    $spawnCollectible[$get[ch]]

  $let[wait;$randomNumber[$parseString[1h];$parseString[3h]]]
  $let[guildID;$guildID]

  $setTimeout[
    $jsonLoad[config;$getGuildVar[spawnConfig;$get[guildID]]]
    $if[$spawnConfig[message;$get[guildID]]==$get[message];
      $!jsonSet[config;weight;0]
      $setGuildVar[spawnConfig;$env[config];$get[guildID]]
      $spawnCollectible[$get[ch]]
    ]
  ;$get[wait]]
`);
