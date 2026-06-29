import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { config } from '../../config/config';
import { currency } from '../../config/currency';
export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: `${currency.plural}`,
    description: `Show the leaderboard of ${currency.plural}`,
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
