import { command } from '../../core/define/commands';

export default command('dev.extrasremove', `
  $onlyIf[$authorID==$botOwnerID]
  $sendMessage[$extrasOwnerCommand[remove;$message]]
  $!accessLog[$authorID;extras.command.remove;;]
`);
