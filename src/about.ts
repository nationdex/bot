import { config } from '../config/config.example';

export default {
  data: {
    name: 'about',
    description: `Provides information about ${config.name}.`,
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
        $addSeparator
        $addSection[
            $addTextDisplay[> $djsEval[client.guilds.cache.reduce((a\\,g)=>a+g.memberCount\\,0)] members across $guildCount[] servers.]
            $addButton[https://discord.com/application-directory/$clientID[];Invite;Link;;false]
            $addButton[${config.serverURL};Support;Link;;false]
        ]
    ]
  `,
};
