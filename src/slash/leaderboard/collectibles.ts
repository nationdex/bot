import { SlashCommand } from '../../util/slashes';

export default SlashCommand('leaderboard.collectibles', `
  $interactionReply[
    $leaderboards[collectibles;1;$option[class]]
  ]
`);
