import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'blocklist',
    description: 'View your blocklist',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
  },
  code: `
  $interactionReply[
    $ephemeral
    $blocklist[$authorID;1]
  ]
  `,
});
