import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `${variables.keywords.currency.plural}`,
    description: `Show the leaderboard of ${variables.keywords.currency.plural}`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
  },
  code: `
  $interactionReply[
    $leaderboards[balance;1]
  ]
  `,
});
