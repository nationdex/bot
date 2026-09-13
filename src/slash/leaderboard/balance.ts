import { SlashCommand } from '../../util/slashes';

export default SlashCommand('leaderboard.balance', `
  $interactionReply[Loading $jsonVar[keywords;currency.plural] leaderboard...]

  $interactionUpdate[
    $leaderboards[balance;1]
  ]
`);
