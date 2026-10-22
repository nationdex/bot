import { SlashCommand } from '../../util/slashes';

export default SlashCommand('admin.suggestions', `
  $onlyIf[$hasCap[$authorID;suggestions.review];
    $err[not_bot_staff;true]
  ]
  $interactionReply[
    $ephemeral
    $suggestionList[queue;open;1]
  ]
`);
