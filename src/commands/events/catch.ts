import { command } from '../../core/define/commands';

export default command('catch', `
  $let[ctbl;$spawnConfig[collectible]]
  $onlyIf[$get[ctbl]!=]
  $onlyIf[$channelID==$spawnConfig[channel]]
  
  $jsonLoad[names;$collectibleInfo[$get[ctbl];catch_names]]
  $jsonLoad[trNames;$collectibleInfo[$get[ctbl];translations]]
  $let[msg;$toLowerCase[$message]]
  
  $onlyIf[$and[$or[$arrayIncludes[names;$get[msg]];$arrayIncludes[trNames;$get[msg]]];$spawnConfig[caught_by]==]]
  
  $let[caughtin;$sub[$getMessage[$channelID;$messageID;timestamp];$spawnConfig[timestamp]]]
  $let[spawnLock;$mutex[acquire;spawn:$guildID]]
  $if[$spawnConfig[caught_by]!=;
    $!mutex[release;spawn:$guildID;$get[spawnLock]]
    $stop
  ]
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $!jsonSet[config;caught_by;"$authorID"]
  $!jsonSet[config;caught_in;"$get[caughtin]"]
  $setGuildVar[spawnConfig;$env[config]]
  $!mutex[release;spawn:$guildID;$get[spawnLock]]
  
  $addUserCollectible[$authorID;$get[ctbl];{
    "id": "$get[ctbl]",
    "author": "$authorID",
    "attack": "$spawnConfig[attack]",
    "health": "$spawnConfig[health]",
    "attack_type": "$if[$spawnConfig[attack]>=$collectibleInfo[$get[ctbl];attack];buffed;nerfed]",
    "health_type": "$if[$spawnConfig[health]>=$collectibleInfo[$get[ctbl];health];buffed;nerfed]",
    "special": "$spawnConfig[special]",
    "card": "$default[$getSpecial[$spawnConfig[special];card];$collectibleInfo[$get[ctbl];regime]].png",
    "timestamp": "$getMessage[$channelID;$messageID;timestamp]",
    "caught_in": "$get[caughtin]"
  }]
  
  $reply
Congratulations <@$authorID>! You caught a $collectibleInfo[$get[ctbl];class] $appEmoji[$collectibleInfo[$get[ctbl];emoji_id]] **$collectibleInfo[$get[ctbl];name]**!
\`$spawnConfig[attack_bonus]%\` / \`$spawnConfig[health_bonus]%\`
-# Caught in $shortParse[$get[caughtin];-1]
`);
