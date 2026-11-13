import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('leaderboard.value', `
  $interactionReply[Loading $jsonVar[keywords;collectible.plural] value leaderboard...]

  $interactionUpdate[
    $leaderboards[value;1]
  ]
`);
