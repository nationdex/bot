import { command } from '../../core/commands';
import { auctionConfig } from '../../config/auction';

export default command('ready', `
  $registerFont[assets/fonts]
  $!clearInterval[auctionSweep]
  $!auctionSettle
  $setInterval[$!auctionSettle;${auctionConfig.sweepInterval};auctionSweep]
  $jsonLoad[blocked;$searchDB[blacklist]]
  $arrayForEach[blocked;row;
    $if[$env[row;type]==guild;$try[$!guildLeave[$env[row;id]];]]
  ]
  $let[home;$js[process.env.HOME_GUILD_ID || '']]
  $if[$get[home]==;
    $log[HOME_GUILD_ID is not set: /admin and /access are not registered and every staff capability is denied]
  ;
    $try[$!registerGuildApplicationCommands[$get[home]];$log[Could not register the staff commands in the home server $get[home]]]
  ]
  $log[Ready as $username[$botID]]
`);
