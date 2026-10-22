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
  $log[Ready as $username[$botID]]
`);
