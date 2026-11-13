import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('player.settings', `
  $jsonLoad[settings;$getUserVar[settings]]
  
  $interactionReply[
    $ephemeral
    $addTextDisplay[Fetching your player settings...]
  ]
  
  $interactionUpdate[$settingsMenu[$authorID]]
`);
