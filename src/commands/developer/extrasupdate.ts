import { command } from '../../core/define/commands';

export default command('dev.extrasupdate', `
  $onlyIf[$authorID==$botOwnerID]
  $sendMessage[$extrasOwnerCommand[update;$message]]
  $!accessLog[$authorID;extras.command.update;;]
`);
