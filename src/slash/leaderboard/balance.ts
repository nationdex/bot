import { slashCommand } from '../../config/slash';

export default slashCommand('leaderboard.balance', `
  $interactionReply[
    $leaderboards[balance;1]
  ]
`);
