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
        $addSection[
            $addTextDisplay[> ${config.description}
            Running version $c[clientVersion]
            The bot has been online for $uptime[%days% day(s), %hours%:%minutes%:%seconds%].]
        ]
        $addSeparator[]
        $addSection[
            $addTextDisplay[> $djsEval[client.guilds.cache.reduce((a\\,g)=>a+g.memberCount\\,0)] members across $guildCount[] servers.]
            $addButton[https://discord.com/application-directory/$clientID[];Invite;Link;;false]
            $addButton[${config.serverURL};Support;Link;;false]
        ]
        $addTextDisplay[Made with great honor by the **Nationdex Development Team**!]
    ]
  `,
};

export default command;
