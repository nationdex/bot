import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'collectibles',
    description: `View the rarity list of ${variables.keywords.collectible.plural}.`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: `The rarity class of the ${variables.keywords.collectible.plural} you want to view.`,
        required: false,
        autocomplete: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'sort_type',
        description: 'Sort type of the list.',
        required: false,
        choices: [
          {
            name: 'Common to Rare',
            value: 'desc',
          },
          {
            name: 'Rare to Common',
            value: 'asc',
          },
        ],
      },
    ],
  },
  code: `
  $interactionReply[
    $rarityList[collectibles;$option[class];$option[sort_type];1]
  ]
  `,
});
