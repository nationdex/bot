import { SlashCommand } from '../../util/slashes';

export default SlashCommand('leaderboard.value', `
  $interactionReply[Loading $jsonVar[keywords;collectible.plural] value leaderboard...]

  $interactionUpdate[
    $leaderboards[value;1]
  ]
`);
