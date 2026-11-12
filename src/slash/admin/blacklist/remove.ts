import { SlashCommand } from '../../../core/slashes';

export default SlashCommand('admin.blacklist.remove', `
  $onlyIf[$hasCap[$authorID;blacklist.write];$err[not_bot_staff;true]]
  $let[type;$blacklistTarget[$option[user];$option[guild_id];type]]
  $onlyIf[$and[$get[type]!=none;$get[type]!=invalid];$err[blacklist_target;true]]
  $let[target;$blacklistTarget[$option[user];$option[guild_id];id]]
  $let[reason;$default[$option[reason];No reason given]]

  $let[status;$blacklistRemove[$get[type];$get[target];$authorID;$get[reason]]]
  $onlyIf[$get[status]==removed;$err[blacklist_missing;true]]

  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Blacklist removed]
      $addSeparator
      $addTextDisplay[- **Target:** $if[$get[type]==user;\`$fetchUsername[$get[target]]\` (\`$get[target]\`);Server \`$get[target]\`]
- **Reason:** $get[reason]
- **Moderator:** \`$fetchUsername[$authorID]\`]
    ;$jsonVar[config;accent]]
  ]
`);
