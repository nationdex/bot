import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  unprefixed: true,
  type: 'messageCreate',
  code: `
  $let[nation;$spawnConfig[nation]]
  $onlyIf[$get[nation]!=]
  
  $jsonLoad[names;$getNationInfo[$get[nation];catch_names]]
  $jsonLoad[trNames;$getNationInfo[translations]]
  
  $let[msg;$toLowerCase[$message]]
  
  $onlyIf[$and[$or[$arrayIncludes[names;$get[msg]];$arrayIncludes[trNames;$get[msg]]];$spawnConfig[caught_by]==]]
  
  $let[caughtin;$sub[$getMessage[$channelID;$messageID;timestamp];$spawnConfig[timestamp]]]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $!jsonSet[config;caught_by;"$authorID"]
  $!jsonSet[config;caught_in;"$get[caughtin]"]
  $setGuildVar[spawnConfig;$env[config]]
  
  $addUserNation[$authorID;$get[nation];{
    "nation": "$get[nation]",
    "author": "$authorID",
    "attack": "$spawnConfig[attack]",
    "health": "$spawnConfig[health]",
    "attack_type": "$if[$spawnConfig[attack]>=$getNationInfo[$get[nation];attack];buffed;nerfed]",
    "health_type": "$if[$spawnConfig[health]>=$getNationInfo[$get[nation];health];buffed;nerfed]",
    "special": "$spawnConfig[special]",
    "card": "$default[$getSpecial[$spawnConfig[special];card];$getNationInfo[$get[nation];regime]].png",
    "timestamp": "$getMessage[$channelID;$messageID;timestamp]",
    "caught_in": "$get[caughtin]"
  }]
  
  $reply
Congratulations <@$authorID>! You caught a $getNationInfo[$get[nation];class] $appEmoji[$getNationInfo[$get[nation];emoji_id]] **$getNationInfo[$get[nation];name]**!
\`$spawnConfig[attack_bonus]%\` / \`$spawnConfig[health_bonus]%\`
-# Caught in $divide[$get[caughtin];1000]s
  `,
});
