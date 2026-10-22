import { SlashCommand } from '../../core/slashes';

export default SlashCommand('leaderboard.collectibles', `
  $interactionReply[Loading $jsonVar[keywords;collectible.plural] leaderboard...]

  $interactionUpdate[
    $leaderboards[collectibles;1;$option[class]]
  ]
`);
