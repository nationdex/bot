import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('leaderboard.balance', `
  $interactionReply[Loading $jsonVar[keywords;currency.plural] leaderboard...]

  $interactionUpdate[
    $leaderboards[balance;1]
  ]
`);
