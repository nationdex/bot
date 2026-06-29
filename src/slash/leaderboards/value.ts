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
    name: `value`,
    description: `Show the leaderboard of ${ctbl.plural} value`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
  },
  code: `
  $interactionReply[
    $leaderboards[value;1]
  ]
  `,
});
