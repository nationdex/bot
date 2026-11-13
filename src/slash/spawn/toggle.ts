import { slashCommand } from '../../core/define/slashes';

export default slashCommand('spawn.toggle', `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[no_perms;true]
  ]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[toggle;$if[$env[config;status]==enabled;disabled;enabled]]
  $!jsonSet[config;status;$get[toggle]]
  $setGuildVar[spawnConfig;$env[config]]
 
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$toTitleCase[$get[toggle]] $jsonVar[keywords;collectible.plural] spawning in this server.]
    ;#00FF00]
  ]
`);
