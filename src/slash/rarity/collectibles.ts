import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { ctbl } from '../../config/collectible';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'collectibles',
    description: `View the rarity list of ${ctbl.plural}.`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: `The rarity class whose ${ctbl.plural}' rarity to view.`,
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
