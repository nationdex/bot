import { command } from '../../config/commands';

export default command('ready', `
  $registerFont[assets/fonts]
  $log[Ready as $username[$botID]]
`);
