import { SlashCommand } from '../../util/slashes';

export default SlashCommand('leaderboard.value', `
  $interactionReply[
    $leaderboards[value;1]
  ]
`);
