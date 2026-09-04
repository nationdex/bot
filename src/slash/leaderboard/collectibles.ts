import { slashCommand } from '../../config/slash';

export default slashCommand('leaderboard.collectibles', `
  $interactionReply[
    $leaderboards[collectibles;1;$option[class]]
  ]
`);
