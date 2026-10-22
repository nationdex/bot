import { slashCommand } from '../../core/slashes';

export default slashCommand('spawn.channel', `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[no_perms;true]
  ]
  
  $let[ch;$option[channel]]
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $!jsonSet[config;config_channel;"$get[ch]"]
  $setGuildVar[spawnConfig;$env[config]]
  
 
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$if[$get[ch]==;Removed the spawn channel. $jsonVar[keywords;collectible.plural] will now spawn in the most active channel of the server.;$jsonVar[keywords;collectible.plural] will now spawn in <#$get[ch]>]]
    ;#00FF00]
  ]
`);
