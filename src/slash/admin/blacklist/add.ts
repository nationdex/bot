import { SlashCommand } from '../../../util/slashes';

export default SlashCommand('admin.blacklist.add', `
  $onlyIf[$hasCap[$authorID;blacklist.write];$err[not_bot_staff;true]]
  $let[type;$blacklistTarget[$option[user];$option[guild_id];type]]
  $onlyIf[$and[$get[type]!=none;$get[type]!=invalid];$err[blacklist_target;true]]
  $let[target;$blacklistTarget[$option[user];$option[guild_id];id]]

  $let[status;$blacklistAdd[$get[type];$get[target];$authorID;$option[reason]]]
  $onlyIf[$get[status]!=protected;$err[blacklist_protected;true]]
  $onlyIf[$get[status]!=exists;$err[blacklist_exists;true]]

  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Blacklisted]
      $addSeparator
      $addTextDisplay[- **Target:** $if[$get[type]==user;\`$fetchUsername[$get[target]]\` (\`$get[target]\`);Server \`$get[target]\`]
- **Reason:** $option[reason]
- **Moderator:** \`$fetchUsername[$authorID]\`$if[$get[type]==guild;
-# The bot left the server if it was a member and will leave again if re-added.]]
    ;$jsonVar[config;accent]]
  ]
`);
