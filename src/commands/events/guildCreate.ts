import { command } from '../../core/define/commands';

export default command('guildCreate', `
  $onlyIf[$isBlacklisted[guild;$guildID]]
  $try[$!guildLeave[$guildID];]
`);
