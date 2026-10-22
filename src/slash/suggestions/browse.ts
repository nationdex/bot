import { SlashCommand } from '../../core/slashes';

export default SlashCommand('suggestions.browse', `
  $interactionReply[
    $ephemeral
    $suggestionList[browse;open;1]
  ]
`);
