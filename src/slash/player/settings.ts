import { SlashCommand } from '../../util/slashes';

export default SlashCommand('player.settings', `
  $jsonLoad[settings;$getUserVar[settings]]
  
  $interactionReply[
    $ephemeral
    $addTextDisplay[Fetching your player settings...]
  ]
  
  $interactionUpdate[$settingsMenu[$authorID]]
`);
