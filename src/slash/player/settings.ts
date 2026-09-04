import { slashCommand } from '../../config/slash';

export default slashCommand('player.settings', `
  $jsonLoad[settings;$getUserVar[settings]]
  
  $interactionReply[
    $ephemeral
    $addTextDisplay[Fetching your player settings...]
  ]
  
  $interactionUpdate[$settingsMenu[$authorID]]
`);
