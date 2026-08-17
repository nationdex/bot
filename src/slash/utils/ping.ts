import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'ping',
    description: `Check bot's latency`,
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
  },
  code: `
  $interactionReply[
    
  ]
  `
});