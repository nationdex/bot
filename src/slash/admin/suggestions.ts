import { SlashCommand } from '../../util/slashes';

export default SlashCommand('admin.suggestions', `
  $onlyIf[$isBotStaff[$authorID];
    $err[not_bot_staff;true]
  ]
  $interactionReply[
    $ephemeral
    $suggestionList[queue;open;1]
  ]
`);
