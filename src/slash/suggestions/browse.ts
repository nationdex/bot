import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('suggestions.browse', `
  $interactionReply[
    $ephemeral
    $suggestionList[browse;open;1]
  ]
`);
