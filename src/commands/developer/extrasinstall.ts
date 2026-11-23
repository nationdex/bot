import { command } from '../../core/define/commands';

export default command('dev.extrasinstall', `
  $onlyIf[$authorID==$botOwnerID]
  $sendMessage[$extrasOwnerCommand[install;$message]]
  $!accessLog[$authorID;extras.command.install;;]
`);
