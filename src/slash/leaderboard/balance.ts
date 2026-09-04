import { SlashCommand } from '../../util/slashes';

export default SlashCommand('leaderboard.balance', `
  $interactionReply[
    $leaderboards[balance;1]
  ]
`);
