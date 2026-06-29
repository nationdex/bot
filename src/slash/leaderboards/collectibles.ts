import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { config } from '../../config/config';
import { ctbl } from '../../config/collectible';
export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `${ctbl.plural}`,
    description: `Show the leaderboard of ${ctbl.plural} caught`,
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
