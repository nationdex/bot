import { config } from '../../../config';
import type { Command } from '../../types';

const command: Command = {
  data: {
    name: 'about',
    description: `Provides information about ${config.name}.`,
    type: 1,
    integration_types: [0, 1],
  },
  code: `
    $defer
    $addContainer[
      $addTextDisplay[# ${config.name} Discord Bot]
      $addTextDisplay[${config.description}]
      $addTextDisplay[**Running Version:** v1.0.0]
      $addSeparator[Large]
      $addTextDisplay[### ====== 📊 Statistics ======]
      $addTextDisplay[🌍 Servers: **$guildCount** | ⚡ Latency: **$ping ms**]
      $addSeparator[Large;false]
      $addTextDisplay[### ====== 🔗 Links ======]
      $addActionRow
      $addButton[${config.serverURL};Support Server;Link]
      $addButton[${config.repoURL};GitHub Repository;Link]
      $addButton[${config.ToS};Terms of Service;Link]
      $addButton[${config.PrivacyPolicy};Privacy Policy;Link]
      $addSeparator[Small]
      $addTextDisplay[Made with great honor by the **Nationdex Development Team**!]
    ]
  `,
};

export default command;
