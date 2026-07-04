import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { ctbl } from '../../config/collectible';
export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `value`,
    description: `Show the leaderboard for total ${ctbl.plural} value`,
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
