import { slashCommand } from '../../config/slash';

export default slashCommand('leaderboard.value', `
  $interactionReply[
    $leaderboards[value;1]
  ]
`);
