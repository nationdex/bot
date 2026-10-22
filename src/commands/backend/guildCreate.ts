import { command } from '../../util/commands';

export default command('guildCreate', `
  $onlyIf[$isBlacklisted[guild;$guildID]]
  $try[$!guildLeave[$guildID];]
`);
