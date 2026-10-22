import { command } from '../../core/commands';

export default command('guildCreate', `
  $onlyIf[$isBlacklisted[guild;$guildID]]
  $try[$!guildLeave[$guildID];]
`);
