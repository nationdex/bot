import { command } from '../../util/commands';
import { auctionConfig } from '../../config/auction';

export default command('ready', `
  $registerFont[assets/fonts]
  $!clearInterval[auctionSweep]
  $!auctionSettle
  $setInterval[$!auctionSettle;${auctionConfig.sweepInterval};auctionSweep]
  $log[Ready as $username[$botID]]
`);
