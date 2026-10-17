import { SlashCommand } from '../../util/slashes';

export default SlashCommand('suggestions.browse', `
  $interactionReply[
    $ephemeral
    $suggestionList[browse;open;1]
  ]
`);
