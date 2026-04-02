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
    $addContainer[
      $addTextDisplay[## ${config.name} Discord Bot]
      $addSeparator[Small]
      $addTextDisplay[> ${config.description}
      Running version $c[clientVersion]
      The bot has been online for $uptime[%days% day(s), %hours%:%minutes%:%seconds%].]
      $addSeparator[Small]
      $addTextDisplay[> Active across $guildCount[] servers.]
      $addActionRow[
        $addButton[${config.serverURL};Support Server;Link;;false]
        $addButton[${config.repoURL};Source Code;Link;;false]
      ]
      $addSeparator[Large]
      $addTextDisplay[**Legal**]
      $addActionRow[
        $addButton[${config.ToS};Terms of Service;Link;;false]
        $addButton[${config.PrivacyPolicy};Privacy Policy;Link;;false]
      ]
      $addTextDisplay[Made with great honor by the **Nationdex Development Team**!]
    ]
  `,
};

export default command;
