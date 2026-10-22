import { SlashCommand } from '../../core/slashes';

export default SlashCommand('rarity.collectibles', `
  $interactionReply[Loading $jsonVar[keywords;collectible.plural] data...]

  $interactionUpdate[
    $rarityList[collectibles;$option[class];$option[sort_type];1]
  ]
`);
