import { SlashCommand } from '../../../core/define/slashes';

export default SlashCommand('admin.blacklist.view', `
  $onlyIf[$hasCap[$authorID;blacklist.read];$err[not_bot_staff;true]]
  $let[type;$blacklistTarget[$option[user];$option[guild_id];type]]
  $onlyIf[$get[type]!=invalid;$err[blacklist_target;true]]

  $interactionReply[
    $ephemeral
    $if[$get[type]==none;
      $blacklistPanel[user;1;$authorID]
    ;
      $blacklistDetailView[$get[type];$blacklistTarget[$option[user];$option[guild_id];id];$authorID;1]
    ]
  ]
`);
