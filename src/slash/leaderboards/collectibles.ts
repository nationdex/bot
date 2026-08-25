import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `${variables.keywords.collectible.plural}`,
    description: `Show the leaderboard of ${variables.keywords.collectible.plural} caught`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: `class`,
        description: `The rarity class to view the leaderboard of.`,
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $interactionReply[
    $leaderboards[collectibles;1;$option[class]]
  ]
  `,
});
